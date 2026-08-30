// @ts-nocheck
// core/tunnel.ts — 隧道生命周期管理（按环境隔离，支持多环境并行）
import { runShell, firstLine } from "./shell";
import {
    TUNNEL_PROC_PATTERN, DBUS_ADDRESS, ENV_SETUP_SCRIPT, CLI_PATH,
    REMOTE_SSH_PORT, TUNNEL_RESTART_RETRIES,
    STATE_DIR, readState, removeState
} from "./state";

/** 列出所有存活的隧道及其环境 ID */
export async function getAliveTunnelIds() {
    const r = await runShell("pgrep -af '" + TUNNEL_PROC_PATTERN + "' 2>/dev/null | grep -o -- '--instance-id=[0-9a-f]*' | cut -d= -f2 | sort -u", 8000, "port-mgr");
    return r.output.split("\n").map(s => s.trim()).filter(id => /^[0-9a-f]{32}$/.test(id));
}

/** 指定环境是否有存活隧道 */
export async function isTunnelAliveFor(envId) {
    const r = await runShell("pgrep -af '" + TUNNEL_PROC_PATTERN + "' 2>/dev/null | grep -- '--instance-id=" + envId + "' >/dev/null && echo ALIVE || echo DEAD", 8000, "tunnel-mgr");
    return r.output.indexOf("ALIVE") >= 0;
}

/** 是否存在任意存活的隧道进程 */
export async function isTunnelAlive() {
    const r = await runShell(`pgrep -f '${TUNNEL_PROC_PATTERN}' >/dev/null 2>&1 && echo ALIVE || echo DEAD`, 8000, "probe");
    return r.output.indexOf("ALIVE") >= 0;
}

/** 杀掉指定环境的隧道（envId 省略时杀全部——仅显式 disconnect 使用） */
export async function killTunnel(envId) {
    const pattern = envId ? `${TUNNEL_PROC_PATTERN}.*--instance-id=${envId}` : TUNNEL_PROC_PATTERN;
    const kill = await runShell(`pkill -f '${pattern}' 2>/dev/null; sleep 1; pgrep -f '${pattern}' >/dev/null && echo STILL_ALIVE || echo KILLED`, 10000, "tunnel-mgr");
    return kill.output.indexOf("KILLED") >= 0;
}

/** 原子启动：同 shell 内先自愈密钥环，再 setsid nohup 启动隧道 */
function buildTunnelCommand(envId, port) {
    const logFile = `/tmp/hds-tunnel-${envId}.log`;
    return `DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} bash ${ENV_SETUP_SCRIPT} >/dev/null 2>&1; DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} setsid nohup ${CLI_PATH} devenv start-tunnel --instance-id=${envId} --ports=${port}:${REMOTE_SSH_PORT} > ${logFile} 2>&1 < /dev/null & sleep 0.3; echo TUNNEL_PID=$!`;
}

async function waitPortOpen(port, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const r = await runShell(`(exec 3<>/dev/tcp/127.0.0.1/${port}) 2>/dev/null && echo PORT_OPEN || echo PORT_CLOSED`, 8000, "port-mgr");
        if (r.output.indexOf("PORT_OPEN") >= 0)
            return true;
        await new Promise(res => setTimeout(res, 2000));
    }
    return false;
}

export async function waitPortOpenOnce(port) {
    const r = await runShell(`(exec 3<>/dev/tcp/127.0.0.1/${port}) 2>/dev/null && echo PORT_OPEN || echo PORT_CLOSED`, 8000, "port-mgr");
    return r.output.indexOf("PORT_OPEN") >= 0;
}

/** 隧道日志截断（防无限增长），每次启动前调用 */
async function trimTunnelLogs() {
    await runShell(`for f in /tmp/hds-tunnel-*.log; do [ -f "$f" ] && [ "$(wc -c < "$f")" -gt 262144 ] && tail -c 65536 "$f" > "$f.tmp" && mv "$f.tmp" "$f"; done 2>/dev/null; true`, 8000, "log-maint");
}
/** 启动隧道并等待端口开放；失败自动重启重试（hdspace 偶发 success 后自退/崩溃） */
export async function startTunnelWithRetry(envId, port) {
    const attempts = [];
    await trimTunnelLogs();
    for (let attempt = 1; attempt <= TUNNEL_RESTART_RETRIES; attempt += 1) {
        await killTunnel(envId);
        const t = await runShell(buildTunnelCommand(envId, port), 15000, "tunnel-mgr");
        attempts.push(`launch#${attempt}: exit=${t.exitCode}`);
        const opened = await waitPortOpen(port, 25000);
        attempts.push(`port#${attempt}@${port}: ${opened ? "OPEN" : "CLOSED"}`);
        if (opened) {
            // 端口开了还要确认进程没自退
            if (await isTunnelAliveFor(envId)) {
                attempts.push(`process#${attempt}: ALIVE`);
                return { ok: true, attempts };
            }
            attempts.push(`process#${attempt}: exited unexpectedly`);
            continue;
        }
        // 抖动退避：连续失败时指数退避，避开 server 端状态收敛窗口
        if (attempt < TUNNEL_RESTART_RETRIES) {
            const backoff = 1000 * Math.pow(2, attempt - 1);
            attempts.push(`backoff#${attempt}: ${backoff}ms`);
            await new Promise(res => setTimeout(res, backoff));
        }
    }
    return { ok: false, attempts };
}

// ==================== 自动保活登记 ====================
/** connect 时加入名单；显式 disconnect 时移除。keepalive 巡检该名单 */
export async function markAutoKeep(envId) {
    await runShell(`mkdir -p ${STATE_DIR} && touch ${STATE_DIR}/hds-keep-${envId}`, 5000, "state-mgr");
}

export async function unmarkAutoKeep(envId) {
    await removeState(`hds-keep-${envId}`);
}

export async function listAutoKeepEnvs() {
    const r = await runShell(`ls ${STATE_DIR}/hds-keep-* 2>/dev/null | sed 's|.*/hds-keep-||'`, 8000, "state-mgr");
    return r.output.split("\n").map(s => s.trim()).filter(id => /^[0-9a-f]{32}$/.test(id));
}

// ==================== 常驻隧道守护 (supervisor) ====================
// 脚本职责：每 15s 巡查 auto-keep 名单里的环境；进程死即拉、半开即杀重拉。
// 连续 3 次徒劳拉起 -> 该环境冷却 10 分钟，避免对未开机的 Ready 环境刷 API。
const SUPERVISOR_B64 = "IyEvYmluL2Jhc2gKIyBoZHMtc3VwZXJ2aXNvciB2NCAtIGh1YXdlaSBjbG91ZCB0dW5uZWwgd2F0Y2hkb2cKIyAxNXMgbG9vcDogcHJvY2VzcyBkZWFkIC0+IHJlbGF1bmNoLiBoYWxmLW9wZW4vZnJvemVuIC0+IGZvcmNlIGtpbGwrcmVsYXVuY2guCiMgaGVhcnRiZWF0IGZpbGUgZm9yIGxpdmVuZXNzLiAzIGZhaWxlZCByZWxhdW5jaGVzIC0+IGZyZWV6ZSAzMG1pbiAocGVyIGVudikuCklOVEVSVkFMPTE1ClNUQVRFX0RJUj0vcm9vdC8uZGV2ZW52Ly5jYWNoZQpDTEk9L3Jvb3QvLmxvY2FsL2Jpbi9oZHNwYWNlClNFVFVQPS9yb290Ly5sb2NhbC9iaW4vaGRzLWVudi1zZXR1cC5zaApEQlVTPXVuaXg6cGF0aD0vdG1wL2hkcy1kYnVzLnNvY2sKTE9HPS90bXAvaGRzLXN1cGVydmlzb3IubG9nCkNPT0xET1dOX01TPTE4MDAwMDAKQUdFX0dVQVJEX1M9MTIKSEJFQVQ9L3RtcC9oZHMtc3VwZXJ2aXNvci5oZWFydGJlYXQKCmlmIFsgLWYgL3RtcC9oZHMtc3VwZXJ2aXNvci5sb2NrIF07IHRoZW4KICBPTEQ9JChjYXQgL3RtcC9oZHMtc3VwZXJ2aXNvci5sb2NrKQogIGlmIGtpbGwgLTAgIiRPTEQiIDI+L2Rldi9udWxsOyB0aGVuIGV4aXQgMDsgZmkKZmkKZWNobyAkJCA+IC90bXAvaGRzLXN1cGVydmlzb3IubG9jawoKbG9nKCkgeyBlY2hvICJbc3VwICQoZGF0ZSArJW0tJWRfJUg6JU06JVMpXSAkKiIgPj4gIiRMT0ciOyB9CmxvZyAidjQgc3RhcnRlZCBwaWQ9JCQiCgpjb29sZG93bl9hY3RpdmUoKSB7CiAgbG9jYWwgRj0iJFNUQVRFX0RJUi9oZHMtZmFpbC0kMSIgaGl0cyB0cyBhZ2UKICBbIC1mICIkRiIgXSB8fCByZXR1cm4gMQogIElGUz06IHJlYWQgLXIgaGl0cyB0cyA8PDwgIiQoY2F0ICIkRiIgMj4vZGV2L251bGwpIgogIGFnZT0kKCggJChkYXRlICslcyUzTikgLSAke3RzOi0wfSApKQogIFsgIiRhZ2UiIC1sdCAiJENPT0xET1dOX01TIiBdICYmIFsgIiR7aGl0czotMH0iIC1nZSAzIF0KfQoKYnVtcF9mYWlsKCkgewogIGxvY2FsIEY9IiRTVEFURV9ESVIvaGRzLWZhaWwtJDEiIGhpdHMgdHMgbm93CiAgbm93PSQoZGF0ZSArJXMlM04pCiAgaWYgWyAtZiAiJEYiIF07IHRoZW4gSUZTPTogcmVhZCAtciBoaXRzIHRzIDw8PCAiJChjYXQgIiRGIikiOyBlbHNlIGhpdHM9MDsgZmkKICBlY2hvICIkKChoaXRzKzEpKTokbm93IiA+ICIkRiIKfQoKY2xlYXJfZmFpbCgpIHsgcm0gLWYgIiRTVEFURV9ESVIvaGRzLWZhaWwtJDEiOyB9Cgpwcm9jX2FnZV9zKCkgewogIGxvY2FsIHBpZAogIHBpZD0kKHBncmVwIC1mICJzdGFydC10dW5uZWwuKi0taW5zdGFuY2UtaWQ9JDEiIHwgaGVhZCAtMSkKICBbIC1uICIkcGlkIiBdICYmIHBzIC1vIGV0aW1lcz0gLXAgIiRwaWQiIDI+L2Rldi9udWxsIHwgdHIgLWRjICcwLTknCn0KCnByb2Nfc3RhdCgpIHsKICBsb2NhbCBwaWQKICBwaWQ9JChwZ3JlcCAtZiAic3RhcnQtdHVubmVsLiotLWluc3RhbmNlLWlkPSQxIiB8IGhlYWQgLTEpCiAgWyAtbiAiJHBpZCIgXSAmJiBwcyAtbyBzdGF0PSAtcCAiJHBpZCIgMj4vZGV2L251bGwgfCB0ciAtZCAnICcKfQoKZm9yY2Vfa2lsbF90dW5uZWwoKSB7CiAgcGtpbGwgLWYgInN0YXJ0LXR1bm5lbC4qLS1pbnN0YW5jZS1pZD0kMSIgMj4vZGV2L251bGwKICBzbGVlcCAxCiAgcGdyZXAgLWYgInN0YXJ0LXR1bm5lbC4qLS1pbnN0YW5jZS1pZD0kMSIgPi9kZXYvbnVsbCAyPiYxICYmIHBraWxsIC05IC1mICJzdGFydC10dW5uZWwuKi0taW5zdGFuY2UtaWQ9JDEiIDI+L2Rldi9udWxsCiAgc2xlZXAgMQp9CgpyZXZpdmUoKSB7CiAgbG9jYWwgSUQ9JDEgUE9SVD0kMiBiYW5uZXIgYWdlIHN0CiAgY29vbGRvd25fYWN0aXZlICIkSUQiICYmIHJldHVybgogIGlmIHBncmVwIC1mICJzdGFydC10dW5uZWwuKi0taW5zdGFuY2UtaWQ9JElEIiA+L2Rldi9udWxsIDI+JjE7IHRoZW4KICAgIGFnZT0kKHByb2NfYWdlX3MgIiRJRCIpCiAgICBpZiBbIC1uICIkYWdlIiBdICYmIFsgIiRhZ2UiIC1sdCAiJEFHRV9HVUFSRF9TIiBdOyB0aGVuCiAgICAgIHJldHVybgogICAgZmkKICAgIHN0PSQocHJvY19zdGF0ICIkSUQiKQogICAgaWYgWyAtbiAiJHN0IiBdICYmIFsgIiR7c3QjKlR9IiAhPSAiJHN0IiBdOyB0aGVuCiAgICAgIGxvZyAiZnJvemVuIHByb2Nlc3MgJElEIChzdGF0PSRzdCkgLT4gZm9yY2Uga2lsbCIKICAgICAgZm9yY2Vfa2lsbF90dW5uZWwgIiRJRCIKICAgIGVsc2UKICAgICAgYmFubmVyPSQodGltZW91dCA2IGJhc2ggLWMgImV4ZWMgMzw+L2Rldi90Y3AvMTI3LjAuMC4xLyRQT1JUIDI+L2Rldi9udWxsOyBoZWFkIC1jIDE2IDwmMyAyPi9kZXYvbnVsbCIgMj4vZGV2L251bGwpCiAgICAgIGNhc2UgIiRiYW5uZXIiIGluCiAgICAgICAgU1NILSopIHJldHVybiA7OwogICAgICBlc2FjCiAgICAgIGxvZyAiaGFsZi1vcGVuICRJRDokUE9SVCAtPiByZXN0YXJ0IgogICAgICBmb3JjZV9raWxsX3R1bm5lbCAiJElEIgogICAgZmkKICBlbHNlCiAgICBsb2cgInByb2Nlc3MgZGVhZCAkSUQgLT4gcmVsYXVuY2giCiAgZmkKICBEQlVTX1NFU1NJT05fQlVTX0FERFJFU1M9JERCVVMgYmFzaCAiJFNFVFVQIiA+L2Rldi9udWxsIDI+JjEKICBEQlVTX1NFU1NJT05fQlVTX0FERFJFU1M9JERCVVMgc2V0c2lkIG5vaHVwICIkQ0xJIiBkZXZlbnYgc3RhcnQtdHVubmVsIC0taW5zdGFuY2UtaWQ9IiRJRCIgLS1wb3J0cz0iJFBPUlQ6MjIiID4vdG1wL2hkcy10dW5uZWwtIiRJRCIubG9nIDI+JjEgPC9kZXYvbnVsbCAmCiAgc2xlZXAgMwogIGlmIHBncmVwIC1mICJzdGFydC10dW5uZWwuKi0taW5zdGFuY2UtaWQ9JElEIiA+L2Rldi9udWxsIDI+JjE7IHRoZW4KICAgIGNsZWFyX2ZhaWwgIiRJRCIKICBlbHNlCiAgICBidW1wX2ZhaWwgIiRJRCIKICAgIGxvZyAibGF1bmNoIGZhaWxlZCAkSUQgKGZhaWwgY291bnRlciBidW1wZWQpIgogIGZpCn0KCndoaWxlIHRydWU7IGRvCiAgZGF0ZSArJXMgPiAiJEhCRUFUIgogIGZvciBmIGluICIkU1RBVEVfRElSIi9oZHMta2VlcC0qOyBkbwogICAgWyAtZSAiJGYiIF0gfHwgY29udGludWUKICAgIElEPSR7ZiMjKi9oZHMta2VlcC19CiAgICBQT1JUPSQoY2F0ICIkU1RBVEVfRElSL2hkcy1wb3J0LSRJRCIgMj4vZGV2L251bGwgfCB0ciAtZGMgJzAtOScpCiAgICBbIC1uICIkUE9SVCIgXSB8fCBjb250aW51ZQogICAgcmV2aXZlICIkSUQiICIkUE9SVCIKICBkb25lCiAgc2xlZXAgIiRJTlRFUlZBTCIKZG9uZQo=";
/** 部署并启动常驻隧道守护（幂等：已部署已运行则跳过）。connect/keepalive 时调用。 */
export async function ensureSupervisor() {
    const script = "/root/.local/bin/hds-supervisor.sh";
    // 每次同步脚本版本：跑着的守护发现文件变了会自己重启，这里主动重启一次确保新版落地
    const cmd = `echo '${SUPERVISOR_B64}' | base64 -d > ${script}; chmod +x ${script}; ` +
        `if md5sum -c /tmp/hds-supervisor.md5 >/dev/null 2>&1; then ` +
        `  pgrep -f 'hds-supervisor[.]sh' >/dev/null 2>&1 || (setsid nohup ${script} >/dev/null 2>&1 </dev/null & sleep 0.5); ` +
        `else ` +
        `  pkill -f 'hds-supervisor[.]sh' 2>/dev/null; sleep 0.5; rm -f /tmp/hds-supervisor.lock; ` +
        `  setsid nohup ${script} >/dev/null 2>&1 </dev/null & sleep 0.5; ` +
        `  md5sum ${script} > /tmp/hds-supervisor.md5; ` +
        `fi; ` +
        `pgrep -f 'hds-supervisor[.]sh' >/dev/null 2>&1 && echo SUP_OK || echo SUP_ERR`;
    const r = await runShell(cmd, 20000, "tunnel-mgr");
    return r.output.indexOf("SUP_OK") >= 0;
}
