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

/** 启动隧道并等待端口开放；失败自动重启重试（hdspace 偶发 success 后自退） */
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
        const log = await runShell(`tail -5 /tmp/hds-tunnel-${envId}.log 2>/dev/null`, 8000, "log-maint");
        attempts.push(`log#${attempt}: ${firstLine(log.output).slice(0, 120)}`);
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
