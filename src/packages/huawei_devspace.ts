// @ts-nocheck
/*
METADATA
{
    "name": "huawei_devspace",
    "display_name": {
        "zh": "华为云开发空间",
        "en": "Huawei DevSpace"
    },
    "description": {
        "zh": "华为云开发环境管理：开/关连接、自由切换容器/虚拟机、列表、状态、远程执行、enable_root。",
        "en": "Huawei Cloud dev env management: connect/switch container/VM freely, list, status, exec, enable_root."
    },
    "author": ["Operit User"],
    "category": "System",
    "tools": [
        {
            "name": "usage_advice",
            "description": {
                "zh": "使用建议：\n- huawei_dev_connect 可传 num 或 id 连接任意容器/虚拟机；切换自动替换旧隧道。\n- Vm 登录用户是 developer，Container 是 root，自动探测。\n- root 被拒时自动尝试 enable_root 注入公钥。\n- 首次使用先 huawei_dev_config 配置 AK/SK。\n- 开发桌面类型暂不支持。\n- 连接空闲掉线时可直接重试 exec（自动重建隧道），或调用 huawei_dev_keepalive 主动保活。",
                "en": "- connect accepts num/id for any container/VM; switching replaces tunnel.\n- Vm uses developer, Container uses root; auto-probed.\n- Auto enable_root when root denied.\n- First-time: huawei_dev_config.\n- Desktop type not supported yet.\n- On idle disconnects: just retry exec (auto rebuilds tunnel), or call huawei_dev_keepalive."
            },
            "parameters": [],
            "advice": true
        },
        {
            "name": "huawei_dev_connect",
            "description": {
                "zh": "开启/切换连接：确保 Running、建隧道（校验指向并按需重建）、探测登录用户、必要时自动启用 root。",
                "en": "Open/switch connection: ensure Running, tunnel with target check, probe user, auto-enable root if denied."
            },
            "parameters": [
                {"name": "num", "description": {"zh": "NUM 列序号，与 id 二选一", "en": "NUM column"}, "type": "number", "required": false},
                {"name": "id", "description": {"zh": "实例 ID，与 num 二选一", "en": "Instance ID"}, "type": "string", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_disconnect",
            "description": {
                "zh": "断开：杀隧道；stop_env=false 仅断隧道保留环境。",
                "en": "Disconnect: kill tunnel; stop_env=false keeps env."
            },
            "parameters": [
                {"name": "stop_env", "description": {"zh": "同时关环境，默认 true", "en": "Stop env too, default true"}, "type": "boolean", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_list",
            "description": {"zh": "列出全部开发环境。", "en": "List all dev environments."},
            "parameters": [],
            "returns": true
        },
        {
            "name": "huawei_dev_status",
            "description": {"zh": "查询当前连接状态。", "en": "Query status."},
            "parameters": [],
            "returns": true
        },
        {
            "name": "huawei_dev_exec",
            "description": {"zh": "在当前环境执行命令（自动用户）。", "en": "Exec on current env."},
            "parameters": [
                {"name": "command", "description": {"zh": "命令", "en": "Command"}, "type": "string", "required": true},
                {"name": "timeout_ms", "description": {"zh": "超时毫秒", "en": "Timeout ms"}, "type": "number", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_config",
            "description": {"zh": "配置/更换 AK/SK（密钥环+验证）。", "en": "Configure/rotate AK/SK."},
            "parameters": [
                {"name": "ak", "description": {"zh": "AK", "en": "AK"}, "type": "string", "required": true},
                {"name": "sk", "description": {"zh": "SK", "en": "SK"}, "type": "string", "required": true},
                {"name": "verify", "description": {"zh": "配置后验证，默认 true", "en": "Verify after"}, "type": "boolean", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_shell",
            "description": {"zh": "交互式 SSH 会话。", "en": "Interactive SSH."},
            "parameters": [
                {"name": "input", "description": {"zh": "初始命令", "en": "Initial cmd"}, "type": "string", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_enable_root",
            "description": {
                "zh": "为当前环境启用 root SSH：注入公钥到 /root/.ssh/authorized_keys 并确保 PermitRootLogin prohibit-password 后重载 sshd。",
                "en": "Enable root SSH: inject pubkey, PermitRootLogin prohibit-password, reload sshd."
            },
            "parameters": [],
            "returns": true
        },
        {
            "name": "huawei_dev_power",
            "description": {
                "zh": "开/关机（不建隧道）：对任意环境执行开机或关机，等待状态到位。action=start|stop，可用 id 或 num 指定环境。",
                "en": "Power on/off (no tunnel): start or stop any env, waits for state. action=start|stop, target via id or num."
            },
            "parameters": [
                {"name": "action", "description": {"zh": "start 或 stop", "en": "start or stop"}, "type": "string", "required": true},
                {"name": "id", "description": {"zh": "实例 ID，与 num 二选一", "en": "Instance ID"}, "type": "string", "required": false},
                {"name": "num", "description": {"zh": "NUM 序号，与 id 二选一", "en": "NUM column"}, "type": "number", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_keepalive",
            "description": {
                "zh": "保活/自愈：真实 SSH 通信探测（可发现端口通但数据不通的僵死隧道），失败自动重建；隧道进程消失时自动复活。建议配合定时任务每 3~5 分钟调用。",
                "en": "Keepalive/self-heal: real SSH echo probe (detects half-open zombie tunnels), auto-rebuilds on failure; revives dead tunnel process. Recommended every 3-5 min via scheduled task."
            },
            "parameters": [],
            "returns": true
        }
    ]
}
*/
Object.defineProperty(exports, "__esModule", { value: true });
const PACKAGE_VERSION = "0.2.1";
const CLI_PATH = "/root/.local/bin/hdspace";
const CLI_SOURCE = "/storage/emulated/0/Download/hdspace";
const TUNNEL_PORT = 10022;
const REMOTE_SSH_PORT = 22;
const DBUS_ADDRESS = "unix:path=/tmp/hds-dbus.sock";
const ENV_SETUP_SCRIPT = "/root/.local/bin/hds-env-setup.sh";
const TUNNEL_PROC_PATTERN = "bin/hdspace devenv start-tunnel";
const IDENTITY_DIR = "/root/.devenv/.ssh/IdentityFile";
const KNOWN_HOSTS_DIR = "/root/.devenv/.ssh/known_hosts";
const CONNECT_TIMEOUT_MS = 150000;
const POLL_INTERVAL_MS = 5000;
const TUNNEL_RESTART_RETRIES = 3;
const CANDIDATE_USERS = ["root", "developer"];
function asText(value) {
    return String(value == null ? "" : value);
}
function firstNonBlank(...values) {
    for (let i = 0; i < values.length; i += 1) {
        const v = values[i];
        if (typeof v === "string" && v.trim())
            return v.trim();
    }
    return "";
}
async function runShell(command, timeoutMs, executorKey) {
    const result = await Tools.System.terminal.hiddenExec(command, {
        executorKey: executorKey || "huawei-devspace",
        timeoutMs
    });
    return {
        exitCode: Number(result.exitCode || 0),
        timedOut: !!result.timedOut,
        output: asText(result.output)
    };
}
async function ensureCli() {
    const check = await runShell(`test -x ${CLI_PATH} && echo CLI_OK || echo CLI_MISSING`, 8000);
    if (check.output.indexOf("CLI_OK") >= 0)
        return;
    const install = await runShell(`mkdir -p /root/.local/bin && cp ${CLI_SOURCE} ${CLI_PATH} && chmod 755 ${CLI_PATH} && echo INSTALLED`, 20000);
    if (install.output.indexOf("INSTALLED") < 0) {
        throw new Error(`failed to install hdspace binary: ${install.output.slice(0, 200)}`);
    }
}
async function ensureKeyring() {
    const probe = await runShell(`DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} bash ${ENV_SETUP_SCRIPT} 2>&1`, 30000);
    return probe.output.indexOf("KEYRING_OK") >= 0;
}
/** 原子组合：自愈密钥环 + 执行 hdspace */
async function hds(args, timeoutMs) {
    await ensureCli();
    const combined = `DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} bash ${ENV_SETUP_SCRIPT} >/dev/null 2>&1; DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} ${CLI_PATH} ${args}`;
    return await runShell(combined, timeoutMs, "hds-cli");
}
/** 解析 devenv list 表格输出 */
function parseEnvList(tableText) {
    const result = [];
    const lines = tableText.split("\n");
    for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("|"))
            continue;
        if (line.indexOf("NUM") >= 0 && line.indexOf("ID") >= 0)
            continue;
        if (line.indexOf("---") >= 0 || line.indexOf("===") >= 0)
            continue;
        const cells = line.split("|").map(c => c.trim());
        if (cells.length < 9)
            continue;
        const num = cells[1];
        const id = cells[2];
        const name = cells[3];
        const state = cells[8];
        const type = cells[9] || "";
        if (!/^\d+$/.test(num))
            continue;
        if (!/^[0-9a-f]{32}$/i.test(id) && state === "")
            continue;
        result.push({ num, id, name, state, type });
    }
    return result;
}
async function listEnvs(timeoutMs) {
    const r = await hds("devenv list", timeoutMs || 60000);
    if (r.exitCode !== 0) {
        throw new Error(`hdspace devenv list failed (exit=${r.exitCode}): ${r.output.slice(0, 400)}`);
    }
    return parseEnvList(r.output);
}
// 持久状态目录（proot /tmp 重启可能清空，用 /root/.devenv/.cache）
const STATE_DIR = "/root/.devenv/.cache";
const CUR_ENV_FILE = `${STATE_DIR}/hds-current-env`;
function userFile(envId) { return `${STATE_DIR}/hds-ssh-user-${envId}`; }

// 兼容读取：新位置 > 旧 /tmp 位置（迁移）
async function readState(fileBase) {
    const neu = await runShell(`cat ${STATE_DIR}/${fileBase} 2>/dev/null`, 5000);
    let v = firstNonBlank(neu.output);
    if (!v) {
        const old = await runShell(`cat /tmp/${fileBase} 2>/dev/null`, 5000);
        v = firstNonBlank(old.output);
        if (v) {
            await runShell(`mkdir -p ${STATE_DIR} && cp /tmp/${fileBase} ${STATE_DIR}/ 2>/dev/null; echo MIGRATED`, 5000);
        }
    }
    return v;
}

async function writeState(fileBase, content) {
    await runShell(`mkdir -p ${STATE_DIR} && echo '${content}' > ${STATE_DIR}/${fileBase}`, 5000);
}

async function resolveTarget(params) {
    const envs = await listEnvs();
    if (!envs.length)
        throw new Error("No dev environments found");
    const numParam = params?.num != null ? String(params.num) : "";
    const idParam = asText(params?.id).trim().toLowerCase();
    let target = null;
    if (idParam && /^[0-9a-f]{32}$/.test(idParam)) {
        target = envs.find(e => e.id === idParam) || null;
        if (!target)
            throw new Error(`Env id=${idParam} not found`);
    }
    else if (numParam) {
        target = envs.find(e => e.num === numParam) || null;
        if (!target)
            throw new Error(`Env num=${numParam} not found`);
    }
    else {
        // 无参优先级：current-env 文件(connect写入,最可靠) > 环境变量 > 存活隧道指向 > 最新日志(ls -t) > Running
        const curId = await readState("hds-current-env");
        if (curId && /^[0-9a-f]{32}$/.test(curId)) {
            target = envs.find(e => e.id === curId) || null;
        }
        if (!target) {
            const cfgId = firstNonBlank(asText(getEnv("HUAWEI_DEV_INSTANCE_ID")));
            if (cfgId)
                target = envs.find(e => e.id === cfgId) || null;
        }
        if (!target) {
            // 存活隧道进程的 --instance-id 最准确
            const t = await getTunnelTarget();
            if (t && /^[0-9a-f]{32}$/.test(t)) {
                target = envs.find(e => e.id === t) || null;
            }
        }
        if (!target) {
            // 兜底：ls -t 取最新修改的日志（而非字母序）
            const r = await runShell(`ls -t /tmp/hds-tunnel-*.log 2>/dev/null | head -1 | sed 's/.*hds-tunnel-//;s/\\.log//'`, 8000);
            const tunnelEnvId = firstNonBlank(r.output);
            if (tunnelEnvId && /^[0-9a-f]{32}$/.test(tunnelEnvId)) {
                target = envs.find(e => e.id === tunnelEnvId) || null;
            }
        }
        if (!target) {
            const cfgNum = firstNonBlank(asText(getEnv("HUAWEI_DEV_NUM")));
            if (cfgNum)
                target = envs.find(e => e.num === cfgNum) || null;
        }
        if (!target)
            target = envs.find(e => e.state === "Running") || null;
        if (!target)
            target = envs[0];
    }
    return target;
}
async function waitForState(env, wantStates, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    let lastState = "";
    let sawTransition = false;
    while (Date.now() < deadline) {
        try {
            const envs = await listEnvs(30000);
            const cur = envs.find(e => e.id === env.id);
            if (cur) {
                lastState = cur.state;
                if (wantStates.indexOf(cur.state) >= 0)
                    return cur.state;
                // 记录过渡态（如 Starting/Stopping），只有见过目标态的前置态后才允许 Ready 提前退出
                if (cur.state === "Starting" || cur.state === "Stopping")
                    sawTransition = true;
                if (cur.state === "Ready" && wantStates.indexOf("Running") >= 0 && sawTransition)
                    break;
            }
        }
        catch (e) {
            lastState = `poll_error: ${asText(e.message)}`;
        }
        await new Promise(res => setTimeout(res, POLL_INTERVAL_MS));
    }
    return lastState;
}
/** 读取当前隧道进程实际指向的实例 ID（无隧道或解析失败返回 ""） */
async function getTunnelTarget() {
    const r = await runShell(`pgrep -af '${TUNNEL_PROC_PATTERN}' 2>/dev/null | grep -o -- '--instance-id=[0-9a-f]*' | head -1 | cut -d= -f2`, 8000);
    const id = firstNonBlank(r.output);
    return /^[0-9a-f]{32}$/.test(id) ? id : "";
}
/** 是否存在指向指定环境的存活隧道 */
async function isTunnelAliveFor(envId) {
    const alive = await runShell(`pgrep -f '${TUNNEL_PROC_PATTERN}' >/dev/null 2>&1 && echo ALIVE || echo DEAD`, 8000);
    if (alive.output.indexOf("ALIVE") < 0)
        return false;
    // 指向不明也视为不匹配，宁可重建
    return (await getTunnelTarget()) === envId;
}
/** 是否存在任意存活的隧道进程 */
async function isTunnelAlive() {
    const r = await runShell(`pgrep -f '${TUNNEL_PROC_PATTERN}' >/dev/null 2>&1 && echo ALIVE || echo DEAD`, 8000);
    return r.output.indexOf("ALIVE") >= 0;
}
async function killTunnel() {
    const kill = await runShell(`pkill -f '${TUNNEL_PROC_PATTERN}' 2>/dev/null; sleep 1; pgrep -f '${TUNNEL_PROC_PATTERN}' >/dev/null && echo STILL_ALIVE || echo KILLED`, 10000);
    return kill.output.indexOf("KILLED") >= 0;
}
/** 原子启动：同 shell 内先自愈密钥环，再 setsid nohup 启动隧道 */
function buildTunnelCommand(envId) {
    const logFile = `/tmp/hds-tunnel-${envId}.log`;
    return `DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} bash ${ENV_SETUP_SCRIPT} >/dev/null 2>&1; DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} setsid nohup ${CLI_PATH} devenv start-tunnel --instance-id=${envId} --ports=${TUNNEL_PORT}:${REMOTE_SSH_PORT} > ${logFile} 2>&1 < /dev/null & sleep 0.3; echo TUNNEL_PID=$!`;
}
async function waitPortOpen(port, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const r = await runShell(`(exec 3<>/dev/tcp/127.0.0.1/${port}) 2>/dev/null && echo PORT_OPEN || echo PORT_CLOSED`, 8000);
        if (r.output.indexOf("PORT_OPEN") >= 0)
            return true;
        await new Promise(res => setTimeout(res, 2000));
        void deadline;
    }
    return false;
}
function firstLine(text) {
    const idx = text.indexOf("\n");
    return (idx >= 0 ? text.slice(0, idx) : text).trim().slice(0, 160);
}
/** 隧道日志截断（防无限增长），每次启动隧道前调用 */
async function trimTunnelLogs() {
    await runShell(`for f in /tmp/hds-tunnel-*.log; do [ -f "$f" ] && [ "$(wc -c < "$f")" -gt 262144 ] && tail -c 65536 "$f" > "$f.tmp" && mv "$f.tmp" "$f"; done 2>/dev/null; true`, 8000, "log-maint");
}
/** 启动隧道并等待端口开放；失败自动重启重试（hdspace 偶发 success 后自退） */
async function startTunnelWithRetry(envId) {
    const attempts = [];
    await trimTunnelLogs();
    for (let attempt = 1; attempt <= TUNNEL_RESTART_RETRIES; attempt += 1) {
        await killTunnel();
        const t = await runShell(buildTunnelCommand(envId), 15000, "tunnel-mgr");
        attempts.push(`launch#${attempt}: exit=${t.exitCode}`);
        const opened = await waitPortOpen(TUNNEL_PORT, 25000);
        attempts.push(`port#${attempt}: ${opened ? "OPEN" : "CLOSED"}`);
        if (opened) {
            // 端口开了还要确认进程没自退
            const still = await runShell(`pgrep -f '${TUNNEL_PROC_PATTERN}' >/dev/null 2>&1 && echo ALIVE || echo DEAD`, 5000);
            if (still.output.indexOf("ALIVE") >= 0) {
                attempts.push(`process#${attempt}: ALIVE`);
                return { ok: true, attempts };
            }
            attempts.push(`process#${attempt}: exited unexpectedly`);
            continue;
        }
        const log = await runShell(`tail -5 /tmp/hds-tunnel-${envId}.log 2>/dev/null`, 8000);
        attempts.push(`log#${attempt}: ${firstLine(log.output).slice(0, 120)}`);
    }
    return { ok: false, attempts };
}
/** 统一 SSH 基础参数：防挂起 + 固定密钥 */
function sshBaseArgs(identityPath, knownHosts) {
    return [
        "ssh -o ConnectTimeout=10",
        "-o BatchMode=yes",
        "-o IdentitiesOnly=yes",
        "-o PasswordAuthentication=no",
        "-o StrictHostKeyChecking=no",
        `-o UserKnownHostsFile=${knownHosts}`,
        `-i ${identityPath}`,
        `-p ${TUNNEL_PORT}`
    ];
}
/** 主机指纹过期自愈 */
async function healKnownHosts(envId) {
    const knownHosts = `${KNOWN_HOSTS_DIR}/${envId}`;
    await runShell(`ssh-keygen -f '${knownHosts}' -R '[127.0.0.1]:${TUNNEL_PORT}' >/dev/null 2>&1; rm -f '${knownHosts}' 2>/dev/null; echo HEALED`, 8000);
}
/** 以指定用户探测 SSH；失败分类：keyMismatch / hostChanged / noRoute / other */
async function trySshAs(envId, user) {
    const parts = [...sshBaseArgs(`${IDENTITY_DIR}/${envId}`, `${KNOWN_HOSTS_DIR}/${envId}`)];
    parts.push(`${user}@127.0.0.1`);
    parts.push("'echo __SSH_OK__'");
    const r = await runShell(parts.join(" "), 25000);
    const out = r.output;
    if (out.indexOf("__SSH_OK__") >= 0)
        return { ok: true, category: "ok", detail: user };
    if (out.indexOf("REMOTE HOST IDENTIFICATION HAS CHANGED") >= 0 || out.indexOf("host key verification failed") >= 0) {
        return { ok: false, category: "hostChanged", detail: out.slice(-200) };
    }
    if (out.indexOf("Permission denied") >= 0 || out.indexOf("no supported methods") >= 0) {
        return { ok: false, category: "keyMismatch", detail: out.slice(-200) };
    }
    if (out.indexOf("Connection refused") >= 0 || out.indexOf("Connection timed out") >= 0) {
        return { ok: false, category: "noRoute", detail: out.slice(-200) };
    }
    return { ok: false, category: "other", detail: out.slice(-200) };
}
/**
 * 探测可用登录用户：
 * 1) 按 env.type 排候选（Container→root优先，其他→developer优先）
 * 2) hostChanged 清指纹重试
 * 3) 全部 keyMismatch 时执行官方 ssh-key-reset 后再试一轮
 */
async function probeUser(env) {
    const steps = [];
    // Desktop 连接方式不同（非标准 SSH），不做探测也不产生 key-reset 副作用
    if ((env.type || "").toLowerCase() === "desktop") {
        steps.push("desktop type: ssh probing skipped (unsupported)");
        return { user: "", steps };
    }
    const preferredFirst = env.type.toLowerCase() !== "vm";
    const candidates = preferredFirst ? CANDIDATE_USERS : [CANDIDATE_USERS[1], CANDIDATE_USERS[0]];
    steps.push(`candidates(${env.type}): ${candidates.join(" -> ")}`);
    let keyResetDone = false;
    for (let round = 0; round < 3; round += 1) {
        let healedThisRound = false;
        let sawKeyMismatch = false;
        for (const user of candidates) {
            const res = await trySshAs(env.id, user);
            if (res.ok) {
                steps.push(`OK as ${user}`);
                await writeState(`hds-ssh-user-${env.id}`, user);
                return { user, steps };
            }
            steps.push(`${user}: ${res.category}`);
            if (res.category === "hostChanged" && !healedThisRound) {
                steps.push("healing known_hosts...");
                await healKnownHosts(env.id);
                healedThisRound = true;
                break;
            }
            if (res.category === "keyMismatch")
                sawKeyMismatch = true;
        }
        // 全部 publickey 失败 => 本地私钥与远端不匹配，官方 reset 会更新本地 IdentityFile
        if (sawKeyMismatch && !keyResetDone) {
            steps.push("all users keyMismatch, running official ssh-key-reset...");
            const reset = await runShell(`printf 'yes\\n' | DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} timeout 60 ${CLI_PATH} devenv ssh-key-reset --instance-id=${env.id} 2>&1`, 70000);
            keyResetDone = true;
            steps.push(`key-reset: ${reset.output.indexOf("success") >= 0 ? "done" : firstLine(reset.output).slice(0, 100)}`);
        }
        else if (!sawKeyMismatch && keyResetDone) {
            break;
        }
    }
    return { user: "", steps };
}
async function persistToolResult(key, data) {
    try {
        const dir = getPluginConfigDir("huawei_devspace");
        const path = `${dir}/last_${key}.json`;
        await Tools.Files.write(path, JSON.stringify({ ts: Date.now(), ...data }, null, 2), false);
    }
    catch (e) {
        void e;
    }
    return data;
}
// ==================== 工具实现 ====================
async function huaweiDevConnect(params) {
    const steps = [];
    const keyringOk = await ensureKeyring();
    const env = await resolveTarget(params);
    steps.push(`target: #${env.num} ${env.name} (${env.id}) state=${env.state} type=${env.type}`);
    // 步骤1：确保 Running
    if (env.state !== "Running") {
        if (env.state === "Stopping") {
            steps.push("state=Stopping, waiting before start...");
            await waitForState(env, ["Ready"], 120000);
        }
        const startRes = await hds(`devenv start --instance-id=${env.id}`, 60000);
        steps.push(`start: ${firstLine(startRes.output)}`);
        if (startRes.exitCode !== 0 && startRes.output.indexOf("is Starting") < 0 && startRes.output.indexOf("already") < 0) {
            throw new Error(`start failed: ${startRes.output.slice(0, 300)}`);
        }
        const finalState = await waitForState(env, ["Running"], CONNECT_TIMEOUT_MS);
        steps.push(`wait state -> ${finalState}`);
        if (finalState !== "Running") {
            throw new Error(`environment did not reach Running (last=${finalState})`);
        }
    }
    else {
        steps.push("already Running");
    }
    // 步骤2：隧道——校验存活隧道指向，不一致就重建
    if (await isTunnelAliveFor(env.id)) {
        steps.push("tunnel alive for this env");
    }
    else {
        const oldTarget = await getTunnelTarget();
        if (oldTarget && oldTarget !== env.id) {
            steps.push(`old tunnel points to ${oldTarget.slice(0, 8)}..., rebuilding`);
        }
        const t = await startTunnelWithRetry(env.id);
        steps.push(...t.attempts);
        if (!t.ok)
            throw new Error(`tunnel failed after retries: ${t.attempts.join(" | ").slice(-400)}`);
    }
    // 记录当前选择（resolveTarget 无参时的最高优先级依据）
    await writeState('hds-current-env', env.id);
    // 步骤3：探测登录用户并验证
    const probe = await probeUser(env);
    const user = probe.user;
    steps.push(...probe.steps);
    // 步骤4：root 直连失败时自动启用 root SSH
    let rootOk = null;
    if (user && user !== "root") {
        const rootCheck = await trySshAs(env.id, "root");
        rootOk = rootCheck.ok;
        if (!rootOk) {
            steps.push("root denied, attempting enable_root...");
            try {
                const er = await enableRootInternal(env, user);
                rootOk = er.success;
                steps.push(...er.steps.slice(-3));
            }
            catch (e) {
                steps.push(`enable_root failed: ${asText(e.message).slice(0, 120)}`);
            }
        }
    }
    const success = !!user;
    return await persistToolResult("connect", {
        success,
        keyringOk,
        env,
        user,
        rootOk,
        steps,
        localPort: TUNNEL_PORT,
        error: success ? "" : "no working login user found"
    });
}
/** 开/关机（不建隧道）：target 可为任意环境，支持 id/num 参数 */
async function huaweiDevPower(params) {
    const action = asText(params?.action).trim().toLowerCase();
    if (action !== "start" && action !== "stop") {
        throw new Error("action must be 'start' or 'stop'");
    }
    const steps = [];
    // 目标解析：显式参数 > 隧道指向/current-env（仅 stop 时）> 报错
    let env = null;
    if (params?.id != null || params?.num != null) {
        env = await resolveTarget(params);
    }
    else {
        const tunnelId = await getTunnelTarget();
        const curId = await readState("hds-current-env");
        const targetId = tunnelId || curId;
        if (!targetId) {
            throw new Error(action === "stop"
                ? "no target specified and no active connection; pass id or num"
                : "no target specified; pass id or num");
        }
        const envs = await listEnvs();
        env = envs.find(e => e.id === targetId) || null;
        if (!env) throw new Error(`env ${targetId} not found in list`);
    }
    steps.push(`power ${action}: #${env.num} ${env.name} (${env.id}) state=${env.state}`);

    let finalState = env.state;
    if (action === "start") {
        if (env.state === "Running") {
            steps.push("already Running");
        }
        else {
            if (env.state === "Stopping") {
                steps.push("waiting for Stopping -> Ready...");
                await waitForState(env, ["Ready"], 120000);
                env.state = "Ready";
            }
            const startRes = await hds(`devenv start --instance-id=${env.id}`, 60000);
            steps.push(`start: ${firstLine(startRes.output)}`);
            if (startRes.exitCode !== 0 && startRes.output.indexOf("is Starting") < 0 && startRes.output.indexOf("already") < 0) {
                throw new Error(`start failed: ${startRes.output.slice(0, 300)}`);
            }
            finalState = await waitForState(env, ["Running"], CONNECT_TIMEOUT_MS);
            steps.push(`wait -> ${finalState}`);
            if (finalState !== "Running") {
                throw new Error(`did not reach Running (last=${finalState})`);
            }
        }
    }
    else {
        // stop
        if (env.state === "Ready" || env.state === "Stopped") {
            steps.push("already stopped");
            finalState = "Ready";
        }
        else {
            const st = await hds(`devenv stop --instance-id=${env.id}`, 60000);
            steps.push(`stop: ${firstLine(st.output)}`);
            // 轮询到 Ready（完全停止）或超时
            finalState = await waitForState(env, ["Ready", "Stopped"], 120000);
            steps.push(`wait -> ${finalState}`);
        }
    }

    return await persistToolResult("power", {
        success: true,
        action,
        env,
        finalState,
        steps
    });
}

/**
 * 真实 SSH 通信探测：能发现 TCP 半开的僵死隧道（端口开但数据不通）。
 * 成功时记录 last_ok 时间戳，供 status/keepalive 判断隧道健康度。
 */
async function sshEchoProbe(envId, user, executorKey) {
    const identityPath = `${IDENTITY_DIR}/${envId}`;
    const knownHosts = `${KNOWN_HOSTS_DIR}/${envId}`;
    if (!user) {
        user = await getCurrentUser({ id: envId, num: "", name: "", state: "", type: "" });
    }
    if (!user)
        return { ok: false, reason: "no known login user" };
    const parts = [...sshBaseArgs(identityPath, knownHosts)];
    parts.push(`${user}@127.0.0.1`);
    parts.push("'echo __KEEPALIVE_OK__'");
    const r = await runShell(parts.join(" "), 20000, executorKey || "probe");
    const ok = r.output.indexOf("__KEEPALIVE_OK__") >= 0;
    return { ok, reason: ok ? "" : firstLine(r.output).slice(0, 120), user };
}
async function markLastOk(envId) {
    await writeState("hds-last-ok-ts", String(Date.now()));
    void envId;
}
async function getLastOk() {
    const v = await readState("hds-last-ok-ts");
    return Number(v) > 0 ? Number(v) : 0;
}
/** keepalive 工具实现：真实探测 + 僵死自愈 */
async function huaweiDevKeepalive(params) {
    void params;
    const steps = [];
    const alive = await isTunnelAlive();
    steps.push(`tunnel process: ${alive ? "ALIVE" : "DOWN"}`);
    if (!alive) {
        // 进程没了：若之前有 current-env，自动重建
        const curId = await readState("hds-current-env");
        if (!curId) {
            steps.push("no previous env; nothing to revive");
            return await persistToolResult("keepalive", { success: false, action: "none", steps });
        }
        steps.push(`reviving tunnel for ${curId.slice(0, 8)}...`);
        const t = await startTunnelWithRetry(curId);
        steps.push(...t.attempts);
        if (t.ok) {
            await markLastOk(curId);
            return await persistToolResult("keepalive", { success: true, action: "revived", envId: curId, steps });
        }
        throw new Error(`tunnel revival failed: ${t.attempts.join(" | ").slice(-300)}`);
    }
    // 进程在：做真实通信探测
    const tunnelTarget = await getTunnelTarget();
    const targetId = tunnelTarget || (await readState("hds-current-env"));
    if (!targetId) {
        steps.push("tunnel alive but target unknown; treating as healthy");
        return await persistToolResult("keepalive", { success: true, action: "none", steps });
    }
    const probe = await sshEchoProbe(targetId, "");
    steps.push(probe.ok ? `ssh echo OK as ${probe.user}` : `ssh echo FAILED (${probe.reason})`);
    if (probe.ok) {
        await markLastOk(targetId);
        return await persistToolResult("keepalive", { success: true, action: "verified", envId: targetId, user: probe.user, steps });
    }
    // 半开僵死 → 重建
    steps.push("tunnel appears half-open zombie; rebuilding...");
    const t = await startTunnelWithRetry(targetId);
    steps.push(...t.attempts);
    if (!t.ok)
        throw new Error(`zombie rebuild failed: ${t.attempts.join(" | ").slice(-300)}`);
    const reprobe = await sshEchoProbe(targetId, probe.user || "");
    steps.push(reprobe.ok ? "re-verify OK after rebuild" : `still failing after rebuild (${reprobe.reason})`);
    if (reprobe.ok)
        await markLastOk(targetId);
    return await persistToolResult("keepalive", {
        success: reprobe.ok,
        action: "rebuilt",
        envId: targetId,
        steps
    });
}
async function huaweiDevDisconnect(params) {
    const stopEnv = params?.stop_env !== false;
    const steps = [];
    // 先确定目标（杀隧道前），因为 getTunnelTarget 依赖存活进程
    const tunnelId = await getTunnelTarget();
    const curId = await readState("hds-current-env");
    const targetId = tunnelId || curId;
    const killed = await killTunnel();
    steps.push(killed ? "tunnel killed" : "tunnel already dead");
    let stopped = "";
    if (stopEnv) {
        if (!targetId) {
            // 无活动连接迹象：绝不走 Running 兜底，避免误关无关环境
            steps.push("no active connection known; not stopping any env (safety)");
        }
        else {
            try {
                const st = await hds(`devenv stop --instance-id=${targetId}`, 60000);
                stopped = `${targetId.slice(0, 8)}...: ${firstLine(st.output)}`;
                steps.push(stopped);
            }
            catch (e) {
                steps.push(`stop failed: ${asText(e.message).slice(0, 120)}`);
            }
        }
    }
    else {
        steps.push("keep env running (stop_env=false)");
    }
    return await persistToolResult("disconnect", {
        success: killed,
        stoppedEnv: stopEnv,
        targetId: targetId || null,
        steps
    });
}
async function huaweiDevList(params) {
    void params;
    await ensureKeyring();
    const envs = await listEnvs();
    const lines = envs.map(e => `#${e.num} [${e.state}] ${e.name} (${e.type}) id=${e.id}`);
    return await persistToolResult("list", {
        success: true,
        count: envs.length,
        envs,
        table: lines.join("\n")
    });
}
async function huaweiDevStatus(params) {
    void params;
    const steps = [];
    const alive = await isTunnelAlive();
    const tunnelTarget = alive ? await getTunnelTarget() : "";
    steps.push(`tunnel: ${alive ? "ALIVE" : "DOWN"}${tunnelTarget ? ` -> ${tunnelTarget}` : ""}`);
    let portOpen = false;
    if (alive) {
        portOpen = await waitPortOpenOnce(TUNNEL_PORT);
        steps.push(`port ${TUNNEL_PORT}: ${portOpen ? "OPEN" : "CLOSED"}`);
    }
    let envState = "unknown";
    let envName = "";
    let envId = "";
    let envType = "";
    try {
        const env = await resolveTarget({});
        envState = env.state;
        envName = env.name;
        envId = env.id;
        envType = env.type;
    }
    catch (e) {
        steps.push(`list failed: ${asText(e.message).slice(0, 120)}`);
    }
    let user = "";
    let sshOk = false;
    if (alive && portOpen && envId) {
        user = await readState(`hds-ssh-user-${envId}`);
        if (user) {
            const check = await trySshAs(envId, user);
            sshOk = check.ok;
            steps.push(`ssh as ${user}: ${sshOk ? "OK" : check.category}`);
            if (!sshOk)
                user = "";
        }
        if (!user) {
            const probe = await probeUser({ id: envId, num: "", name: envName, state: envState, type: envType });
            user = probe.user;
            sshOk = !!user;
        }
    }
    return await persistToolResult("status", {
        success: true,
        connected: alive && portOpen && sshOk,
        tunnelAlive: alive,
        tunnelTarget,
        portOpen,
        sshOk,
        user,
        envState, envName, envId, envType,
        lastOkTs: await getLastOk(),
        steps
    });
}
async function waitPortOpenOnce(port) {
    const r = await runShell(`(exec 3<>/dev/tcp/127.0.0.1/${port}) 2>/dev/null && echo PORT_OPEN || echo PORT_CLOSED`, 8000);
    return r.output.indexOf("PORT_OPEN") >= 0;
}
/** 获取当前执行用户：缓存 > 现场探测 */
async function getCurrentUser(env) {
    let user = firstNonBlank(asText(getEnv("HUAWEI_DEV_USER")), "");
    if (!user) {
        user = await readState(`hds-ssh-user-${env.id}`);
    }
    if (!user) {
        const probe = await probeUser(env);
        user = probe.user;
    }
    return user;
}
async function huaweiDevExec(params) {
    const command = asText(params?.command).trim();
    if (!command)
        throw new Error("command cannot be empty");
    const timeoutMs = params?.timeout_ms != null ? Number(params.timeout_ms) : 30000;
    if (!(await isTunnelAlive())) {
        throw new Error("tunnel not running, call huawei_dev_connect first");
    }
    const env = await resolveTarget({});
    const identityPath = `${IDENTITY_DIR}/${env.id}`;
    const knownHosts = `${KNOWN_HOSTS_DIR}/${env.id}`;
    let user = await getCurrentUser(env);
    if (!user)
        throw new Error("no working login user; run huawei_dev_connect first");
    const escaped = command.replace(/'/g, `'\\''`);
    const buildCmd = () => {
        const parts = [...sshBaseArgs(identityPath, knownHosts)];
        parts.push(`${user}@127.0.0.1`);
        parts.push(`'${escaped}'`);
        return parts.join(" ");
    };
    let r = await runShell(buildCmd(), Math.max(timeoutMs + 10000, 20000), "ssh-exec");
    let success = r.exitCode === 0 && !r.timedOut;
    // 隧道自愈：半开/端口死 → 重建后重试一次（用户无感）
    const tunnelDead = !success
        && (r.output.indexOf("Connection refused") >= 0
            || r.output.indexOf("Connection timed out") >= 0
            || r.output.indexOf("kex_exchange_identification") >= 0);
    if (tunnelDead) {
        const t = await startTunnelWithRetry(env.id);
        if (t.ok) {
            r = await runShell(buildCmd(), Math.max(timeoutMs + 10000, 20000), "ssh-exec");
            success = r.exitCode === 0 && !r.timedOut;
            if (success)
                await markLastOk(env.id);
        }
    }
    // 自愈：指纹变化 / 密钥失配
    if (!success) {
        if (r.output.indexOf("REMOTE HOST IDENTIFICATION HAS CHANGED") >= 0) {
            await healKnownHosts(env.id);
            r = await runShell(buildCmd(), Math.max(timeoutMs + 10000, 20000));
            success = r.exitCode === 0 && !r.timedOut;
        }
        else if (r.output.indexOf("Permission denied") >= 0) {
            const reprobe = await probeUser(env);
            if (reprobe.user && reprobe.user !== user) {
                user = reprobe.user;
                r = await runShell(buildCmd(), Math.max(timeoutMs + 10000, 20000));
                success = r.exitCode === 0 && !r.timedOut;
            }
        }
    }
    return await persistToolResult("exec_output", {
        success,
        user,
        exitCode: r.exitCode,
        timedOut: r.timedOut,
        output: r.output,
        error: success ? "" : `exit=${r.exitCode}`
    });
}
/**
 * enable_root 内部实现：
 * 以 workingUser 登录，导出本地公钥，追加到 /root/.ssh/authorized_keys，
 * 确保 PermitRootLogin prohibit-password，重载 sshd。
 * 脚本经 base64 传输避免引号地狱。
 */
async function enableRootInternal(env, workingUser) {
    const steps = [];
    const identityPath = `${IDENTITY_DIR}/${env.id}`;
    const knownHosts = `${KNOWN_HOSTS_DIR}/${env.id}`;
    // 1. 从本地私钥导出公钥
    const pub = await runShell(`ssh-keygen -y -f '${identityPath}'`, 10000);
    const pubkey = firstNonBlank(pub.output.replace(/\s+/g, " ").trim());
    if (!pubkey || pubkey.indexOf(" ") < 0) {
        throw new Error(`failed to export pubkey from local private key: ${pub.output.slice(0, 150)}`);
    }
    steps.push(`pubkey exported (${pubkey.length} chars)`);
    // 2. 本地生成脚本并转 base64
    const scriptLines = [
        "set -e",
        "mkdir -p /root/.ssh",
        "chmod 700 /root/.ssh",
        "touch /root/.ssh/authorized_keys",
        "chmod 600 /root/.ssh/authorized_keys",
        `grep -qF '${pubkey}' /root/.ssh/authorized_keys 2>/dev/null || echo '${pubkey}' >> /root/.ssh/authorized_keys`,
        "",
        "# ensure PermitRootLogin prohibit-password",
        "if grep -qE '^#?\\s*PermitRootLogin' /etc/ssh/sshd_config; then",
        "  sed -i 's/^#\\?\\s*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config",
        "else",
        "  echo 'PermitRootLogin prohibit-password' >> /etc/ssh/sshd_config",
        "fi",
        "",
        "# reload sshd (any variant)",
        "(systemctl reload sshd 2>/dev/null || systemctl reload ssh 2>/dev/null || service sshd reload 2>/dev/null || service ssh reload 2>/dev/null || pkill -HUP sshd) >/dev/null 2>&1 || true",
        "echo __ENABLE_ROOT_DONE__"
    ];
    const localScript = "/tmp/hds_enable_root.sh";
    const writeScript = [
        `cat > ${localScript} << 'HDS_EOF'`,
        ...scriptLines,
        "HDS_EOF",
        `base64 -w0 ${localScript} > ${localScript}.b64 && echo B64_OK`
    ].join("\n");
    const wr = await runShell(writeScript, 10000);
    if (wr.output.indexOf("B64_OK") < 0) {
        throw new Error(`failed to prepare enable_root script: ${wr.output.slice(0, 150)}`);
    }
    const payloadB64 = firstNonBlank((await runShell(`cat ${localScript}.b64`, 5000)).output);
    if (!payloadB64)
        throw new Error("failed to read b64 payload");
    steps.push(`payload ready (${payloadB64.length} b64 chars)`);
    // 3. 远端解码执行（非 root 用户需 sudo -n）
    const SUDO_PREFIX = workingUser === "root" ? "" : "sudo -n ";
    const remoteScript = [
        `echo '${payloadB64}' | base64 -d > /tmp/.hds_enable_root.sh`,
        `${SUDO_PREFIX}bash /tmp/.hds_enable_root.sh`,
        "rm -f /tmp/.hds_enable_root.sh"
    ].join("; ");
    const cmdParts = [...sshBaseArgs(identityPath, knownHosts)];
    cmdParts.push(`${workingUser}@127.0.0.1`);
    cmdParts.push(`'${remoteScript.replace(/'/g, `'\\''`)}'`);
    const r = await runShell(cmdParts.join(" "), 45000);
    const ok = r.output.indexOf("__ENABLE_ROOT_DONE__") >= 0;
    if (!ok) {
        if (r.output.indexOf("a password is required") >= 0 || r.output.indexOf("sudo:") >= 0) {
            steps.push("sudo needs password; cannot auto-inject for this env type");
        }
        steps.push(`inject failed: ${r.output.slice(-200)}`);
        return { success: false, steps };
    }
    steps.push("pubkey injected, PermitRootLogin ensured, sshd reloaded");
    // 4. 验证 root 可登录，成功则把用户缓存切到 root
    const verify = await trySshAs(env.id, "root");
    steps.push(`root verify: ${verify.ok ? "OK" : verify.category}`);
    if (verify.ok) {
        await writeState(`hds-ssh-user-${env.id}`, 'root');
    }
    return { success: verify.ok, steps };
}
async function huaweiDevEnableRoot(params) {
    void params;
    if (!(await isTunnelAlive())) {
        throw new Error("tunnel not running, call huawei_dev_connect first");
    }
    const env = await resolveTarget({});
    const workingUser = await getCurrentUser(env);
    if (!workingUser)
        throw new Error("no working login user; run connect first");
    const result = await enableRootInternal(env, workingUser);
    return await persistToolResult("enable_root", {
        success: result.success,
        workingUser,
        envId: env.id,
        steps: result.steps
    });
}
async function huaweiDevConfig(params) {
    const ak = asText(params?.ak).trim();
    const sk = asText(params?.sk).trim();
    const verify = params?.verify !== false;
    if (!ak || !sk)
        throw new Error("ak and sk are required");
    await ensureCli();
    const keyringOk = await ensureKeyring();
    if (!keyringOk)
        throw new Error("keyring unavailable, cannot store credentials");
    const assetPath = "/storage/emulated/0/Download/Operit/dev_package/huawei_devspace/assets/hds-config.py";
    const scriptPath = "/root/.local/bin/hds-config.py";
    await runShell(`cp '${assetPath}' ${scriptPath} 2>/dev/null; test -f ${scriptPath} && echo SCRIPT_OK || echo SCRIPT_MISSING`, 10000);
    // 原子：自愈密钥环 + pty 配置
    const cfg = await runShell(`bash ${ENV_SETUP_SCRIPT} >/dev/null 2>&1; python3 ${scriptPath} '${ak.replace(/'/g, `'\\''`)}' '${sk.replace(/'/g, `'\\''`)}'`, 90000);
    const output = cfg.output.trim();
    let success = output.indexOf("CONFIG_SUCCESS") >= 0;
    let error = "";
    if (!success) {
        if (output.indexOf("CONFIG_INVALID") >= 0) {
            error = "AK/SK was rejected by Huawei Cloud (invalid credentials)";
        }
        else {
            error = output.slice(-300);
        }
    }
    let verified = null;
    if (success && verify) {
        try {
            await listEnvs();
            verified = true;
        }
        catch (e) {
            verified = false;
            error = `stored but verification failed: ${asText(e.message).slice(0, 200)}`;
        }
    }
    return await persistToolResult("config", {
        success: success && (verified !== false),
        configSaved: success,
        verified,
        keyringOk,
        hint: "凭据存储在 Linux 密钥环中，重启后仍有效；如需再次更换随时调用本工具",
        error
    });
}
async function huaweiDevShell(params) {
    const input = asText(params?.input).trim();
    if (!(await isTunnelAlive())) {
        throw new Error("tunnel not running, call huawei_dev_connect first");
    }
    const env = await resolveTarget({});
    const identityPath = `${IDENTITY_DIR}/${env.id}`;
    const knownHosts = `${KNOWN_HOSTS_DIR}/${env.id}`;
    const user = await getCurrentUser(env);
    if (!user)
        throw new Error("no working login user; run connect first");
    const sshCmd = [...sshBaseArgs(identityPath, knownHosts)];
    sshCmd[0] = "ssh -t -o ConnectTimeout=10"; // 强制 TTY
    sshCmd.push(`${user}@127.0.0.1`);
    const session = await Tools.System.terminal.create("huawei_devspace_ssh");
    const sessionId = asText(session.sessionId);
    // 用 input 模拟键入而非 exec：交互式 ssh 不被 exec 超时杀掉
    await Tools.System.terminal.input(sessionId, { input: sshCmd.join(" ") });
    await Tools.System.terminal.input(sessionId, { control: "enter" });
    await new Promise(res => setTimeout(res, 6000));
    if (input) {
        await Tools.System.terminal.input(sessionId, { input });
        await Tools.System.terminal.input(sessionId, { control: "enter" });
        await new Promise(res => setTimeout(res, 2000));
    }
    const screen = await Tools.System.terminal.screen(sessionId);
    return await persistToolResult("shell", {
        success: true,
        sessionId,
        user,
        envId: env.id,
        hint: "后续用 terminal_input/terminal_screen 或 super_admin 终端工具与会话 'huawei_devspace_ssh' 交互",
        screen: asText(screen.content || screen.output || "")
    });
}
// ==================== 导出 ====================
const huaweiDevspaceTools = {
    usage_advice: async () => ({ success: true }),
    huawei_dev_connect: huaweiDevConnect,
    huawei_dev_disconnect: huaweiDevDisconnect,
    huawei_dev_list: huaweiDevList,
    huawei_dev_status: huaweiDevStatus,
    huawei_dev_exec: huaweiDevExec,
    huawei_dev_config: huaweiDevConfig,
    huawei_dev_shell: huaweiDevShell,
    huawei_dev_enable_root: huaweiDevEnableRoot,
    huawei_dev_power: huaweiDevPower,
    huawei_dev_keepalive: huaweiDevKeepalive
};
export default huaweiDevspaceTools;
exports.huawei_dev_connect = huaweiDevConnect;
exports.huawei_dev_disconnect = huaweiDevDisconnect;
exports.huawei_dev_list = huaweiDevList;
exports.huawei_dev_status = huaweiDevStatus;
exports.huawei_dev_exec = huaweiDevExec;
exports.huawei_dev_config = huaweiDevConfig;
exports.huawei_dev_shell = huaweiDevShell;
exports.huawei_dev_enable_root = huaweiDevEnableRoot;
exports.huawei_dev_power = huaweiDevPower;
exports.huawei_dev_keepalive = huaweiDevKeepalive;
