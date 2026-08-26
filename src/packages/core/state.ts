// @ts-nocheck
// core/state.ts — 常量、状态持久化、端口池
import { runShell } from "./shell";

// ==================== 常量 ====================
export const CLI_PATH = "/root/.local/bin/hdspace";
export const CLI_SOURCE = "/storage/emulated/0/Download/hdspace";
export const TUNNEL_PORT = 10022;          // 兼容旧版默认端口（仅 status 兜底用）
export const REMOTE_SSH_PORT = 22;
export const DBUS_ADDRESS = "unix:path=/tmp/hds-dbus.sock";
export const ENV_SETUP_SCRIPT = "/root/.local/bin/hds-env-setup.sh";
export const TUNNEL_PROC_PATTERN = "bin/hdspace devenv start-tunnel";
export const IDENTITY_DIR = "/root/.devenv/.ssh/IdentityFile";
export const KNOWN_HOSTS_DIR = "/root/.devenv/.ssh/known_hosts";
export const CONNECT_TIMEOUT_MS = 150000;
export const POLL_INTERVAL_MS = 5000;
export const TUNNEL_RESTART_RETRIES = 3;
export const CANDIDATE_USERS = ["root", "developer"];

/** 持久状态目录（proot /tmp 重启可能清空，故用 /root/.devenv/.cache） */
export const STATE_DIR = "/root/.devenv/.cache";

// ==================== 状态读写 ====================
/** 兼容读取：新位置 > 旧 /tmp 位置（自动迁移） */
export async function readState(fileBase) {
    const neu = await runShell(`cat ${STATE_DIR}/${fileBase} 2>/dev/null`, 5000, "state-mgr");
    let v = neu.output.trim();
    if (!v) {
        const old = await runShell(`cat /tmp/${fileBase} 2>/dev/null`, 5000, "state-mgr");
        v = old.output.trim();
        if (v) {
            await runShell(`mkdir -p ${STATE_DIR} && cp /tmp/${fileBase} ${STATE_DIR}/ 2>/dev/null; true`, 5000, "state-mgr");
        }
    }
    return v;
}

export async function writeState(fileBase, content) {
    await runShell(`mkdir -p ${STATE_DIR} && echo '${content}' > ${STATE_DIR}/${fileBase}`, 5000, "state-mgr");
}

export async function removeState(fileBase) {
    await runShell(`rm -f ${STATE_DIR}/${fileBase}`, 5000, "state-mgr");
}

// ==================== 端口池 ====================
const PORT_POOL_START = 10022;
const PORT_POOL_END = 10079;

/** 列出所有已分配的端口映射 [{envId, port}] */
export async function listAssignedPorts() {
    const r = await runShell(`grep -H . ${STATE_DIR}/hds-port-* 2>/dev/null | sed 's|.*/hds-port-||'`, 8000, "port-mgr");
    const out = [];
    for (const raw of r.output.split("\n")) {
        const m = raw.trim().match(/^([0-9a-f]{32}):(\d{4,5})$/);
        if (m && Number(m[2]) >= PORT_POOL_START && Number(m[2]) <= PORT_POOL_END)
            out.push({ envId: m[1], port: Number(m[2]) });
    }
    return out;
}

/** 获取（必要时分配）某环境的专属本地端口 */
export async function getEnvPort(envId) {
    const assigned = await listAssignedPorts();
    const found = assigned.find(a => a.envId === envId);
    if (found)
        return found.port;
    // 探测本机已监听端口，避开冲突
    const listening = await runShell(`netstat -tln 2>/dev/null | awk '{print $4}' | grep -oE '[0-9]+$' | sort -un || true`, 8000, "port-mgr");
    const busy = new Set(listening.output.split("\n").map(s => Number(s.trim())).filter(n => n > 0));
    let port = 0;
    for (let p = PORT_POOL_START; p <= PORT_POOL_END; p += 1) {
        if (!assigned.some(a => a.port === p) && !busy.has(p)) {
            port = p;
            break;
        }
    }
    if (!port)
        throw new Error(`port pool exhausted (${PORT_POOL_START}-${PORT_POOL_END})`);
    await writeState(`hds-port-${envId}`, String(port));
    return port;
}
