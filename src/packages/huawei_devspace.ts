/*
METADATA
{
    "name": "huawei_devspace",
    "display_name": {
        "zh": "华为云开发空间",
        "en": "Huawei DevSpace"
    },
    "description": {
        "zh": "华为云开发环境管理：通过 hdspace CLI 实现开发环境的开/关连接（隧道+SSH）、列表查看、状态查询与远程命令执行。",
        "en": "Huawei Cloud dev environment management via hdspace CLI: connect on/off (tunnel+SSH), list, status, and remote exec."
    },
    "author": ["Operit User"],
    "category": "System",
    "tools": [
        {
            "name": "usage_advice",
            "description": {
                "zh": "华为云开发空间使用建议：\n- 先调用 huawei_dev_connect 建立连接（内部自动启动环境、开隧道、验证 SSH）。\n- 用 huawei_dev_status 查询当前连接状态，用 huawei_dev_disconnect 断开并关闭环境。\n- huawei_dev_exec 用于在已连接的远程环境执行命令。\n- 首次使用需在 Linux 终端环境完成 hdspace config 配置 AK/SK（需要 dbus + gnome-keyring）。\n- 环境启动约需 1 分钟，请耐心等待轮询完成。",
                "en": "Huawei DevSpace usage advice:\n- Call huawei_dev_connect first (auto start env, tunnel, verify SSH).\n- Use huawei_dev_status to query, huawei_dev_disconnect to disconnect and stop env.\n- huawei_dev_exec runs commands on the connected remote env.\n- First-time setup requires 'hdspace config' in Linux terminal with dbus+gnome-keyring.\n- Env startup takes ~1 minute; polling is handled automatically."
            },
            "parameters": [],
            "advice": true
        },
        {
            "name": "huawei_dev_connect",
            "description": {
                "zh": "开启到华为云开发环境的连接：自动确保环境 Running、建立 SSH 端口转发隧道、验证 SSH 可达。幂等可重复调用。",
                "en": "Open connection to Huawei dev environment: ensure env Running, establish SSH port-forward tunnel, verify SSH reachability. Idempotent."
            },
            "parameters": [
                {
                    "name": "num",
                    "description": {
                        "zh": "环境序号（devenv list 中的 NUM 列），不传默认 2",
                        "en": "Env number from devenv list NUM column, default 2"
                    },
                    "type": "number",
                    "required": false
                }
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_disconnect",
            "description": {
                "zh": "断开连接：停止本地隧道进程并停止远端开发环境。",
                "en": "Disconnect: kill local tunnel process and stop remote dev environment."
            },
            "parameters": [],
            "returns": true
        },
        {
            "name": "huawei_dev_list",
            "description": {
                "zh": "列出全部华为云开发环境（表格文本）。",
                "en": "List all Huawei dev environments (table text)."
            },
            "parameters": [],
            "returns": true
        },
        {
            "name": "huawei_dev_status",
            "description": {
                "zh": "查询当前连接与环境状态（进程、端口、密钥文件、环境 STATE）。",
                "en": "Query connection and env status (process, port, key file, env STATE)."
            },
            "parameters": [],
            "returns": true
        },
        {
            "name": "huawei_dev_exec",
            "description": {
                "zh": "在已连接的开发环境中通过 SSH 执行命令（root 身份）。",
                "en": "Execute a command in the connected dev env through SSH (as root)."
            },
            "parameters": [
                {
                    "name": "command",
                    "description": { "zh": "要执行的命令", "en": "Command to execute" },
                    "type": "string",
                    "required": true
                },
                {
                    "name": "timeout_ms",
                    "description": { "zh": "超时毫秒，默认 30000", "en": "Timeout ms, default 30000" },
                    "type": "number",
                    "required": false
                }
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_config",
            "description": {
                "zh": "配置或更换 hdspace 的 AK/SK 凭据（写入系统密钥环并自动验证）。换绑华为云账号时使用。",
                "en": "Configure or rotate hdspace AK/SK credentials (stored in keyring and verified automatically). Use when switching Huawei Cloud accounts."
            },
            "parameters": [
                {
                    "name": "ak",
                    "description": { "zh": "Access Key ID", "en": "Access Key ID" },
                    "type": "string",
                    "required": true
                },
                {
                    "name": "sk",
                    "description": { "zh": "Secret Access Key", "en": "Secret Access Key" },
                    "type": "string",
                    "required": true
                },
                {
                    "name": "verify",
                    "description": { "zh": "配置后是否调用 devenv list 验证凭据有效性，默认 true", "en": "Verify via devenv list after config, default true" },
                    "type": "boolean",
                    "required": false
                }
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_shell",
            "description": {
                "zh": "在 Operit 终端中打开到开发环境的交互式 SSH 会话（复用隧道）。",
                "en": "Open an interactive SSH session to the dev env inside Operit terminal (reusing tunnel)."
            },
            "parameters": [
                {
                    "name": "input",
                    "description": { "zh": "初始输入命令（可选）", "en": "Initial input command (optional)" },
                    "type": "string",
                    "required": false
                }
            ],
            "returns": true
        }
    ]
}
*/

const PACKAGE_VERSION = "0.1.0";
const CLI_PATH = "/root/.local/bin/hdspace";
const CLI_SOURCE = "/storage/emulated/0/Download/hdspace";
const TUNNEL_PORT = 10022;
const REMOTE_SSH_PORT = 22;
const SSH_USER = "root";
const DBUS_ADDRESS = "unix:path=/tmp/hds-dbus.sock";
const ENV_SETUP_SCRIPT = "/root/.local/bin/hds-env-setup.sh";
const TUNNEL_PROC_PATTERN = "bin/hdspace devenv start-tunnel";
const IDENTITY_DIR = "/root/.devenv/.ssh/IdentityFile";
const KNOWN_HOSTS_DIR = "/root/.devenv/.ssh/known_hosts";
const CONNECT_TIMEOUT_MS = 150000;
const POLL_INTERVAL_MS = 5000;

function asText(value: unknown): string {
    return String(value == null ? "" : value);
}

function firstNonBlank(...values: string[]): string {
    for (let i = 0; i < values.length; i += 1) {
        const v = values[i];
        if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
}

async function runShell(command: string, timeoutMs: number): Promise<{ exitCode: number; timedOut: boolean; output: string }> {
    const result = await Tools.System.terminal.hiddenExec(command, {
        executorKey: "huawei-devspace",
        timeoutMs
    });
    return {
        exitCode: Number((result as any).exitCode || 0),
        timedOut: !!(result as any).timedOut,
        output: asText((result as any).output)
    };
}

/** 确保 hdspace 二进制就位（proot /tmp 可能被清理，用持久路径） */
async function ensureCli(): Promise<void> {
    const check = await runShell(`test -x ${CLI_PATH} && echo CLI_OK || echo CLI_MISSING`, 8000);
    if (check.output.indexOf("CLI_OK") >= 0) return;
    const install = await runShell(
        `mkdir -p /root/.local/bin && cp ${CLI_SOURCE} ${CLI_PATH} && chmod 755 ${CLI_PATH} && echo INSTALLED`,
        20000
    );
    if (install.output.indexOf("INSTALLED") < 0) {
        throw new Error(`failed to install hdspace binary: ${install.output.slice(0, 200)}`);
    }
}

/** 确保密钥环可用；hdspace 读取凭据依赖 dbus+gnome-keyring。
 *  关键：沙盒的 hiddenExec 结束会清理本次派生的进程树，
 *  所以 daemon 自愈与 hdspace 执行必须在同一命令内完成。 */
async function ensureKeyring(): Promise<boolean> {
    const probe = await runShell(`DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} bash ${ENV_SETUP_SCRIPT} 2>&1`, 30000);
    return probe.output.indexOf("KEYRING_OK") >= 0;
}

/** 组合执行：先自愈密钥环，再在同一 shell 内执行 hdspace 命令 */
async function hds(args: string, timeoutMs: number): Promise<{ exitCode: number; timedOut: boolean; output: string }> {
    await ensureCli();
    const combined = `DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} bash ${ENV_SETUP_SCRIPT} >/dev/null 2>&1; DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} ${CLI_PATH} ${args}`;
    return await runShell(combined, timeoutMs);
}

interface EnvInfo {
    num: string;
    id: string;
    name: string;
    state: string;
    type: string;
}

/** 解析 devenv list 表格输出 */
function parseEnvList(tableText: string): EnvInfo[] {
    const result: EnvInfo[] = [];
    const lines = tableText.split("\n");
    for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("|")) continue;
        if (line.indexOf("NUM") >= 0 && line.indexOf("ID") >= 0) continue;
        if (line.indexOf("---") >= 0 || line.indexOf("===") >= 0) continue;
        const cells = line.split("|").map(c => c.trim());
        // split 后首尾为空串
        if (cells.length < 9) continue;
        const num = cells[1];
        const id = cells[2];
        const name = cells[3];
        const state = cells[8];
        const type = cells[9] || "";
        if (!/^\d+$/.test(num)) continue;
        if (!/^[0-9a-f]{32}$/i.test(id) && state === "") continue;
        result.push({ num, id, name, state, type });
    }
    return result;
}

async function listEnvs(timeoutMs?: number): Promise<EnvInfo[]> {
    const r = await hds("devenv list", timeoutMs || 60000);
    if (r.exitCode !== 0) {
        throw new Error(`hdspace devenv list failed (exit=${r.exitCode}): ${r.output.slice(0, 400)}`);
    }
    return parseEnvList(r.output);
}

async function resolveTarget(num?: number): Promise<EnvInfo> {
    const envs = await listEnvs();
    if (!envs.length) throw new Error("No dev environments found");
    let target: EnvInfo | null = null;
    if (num != null) {
        target = envs.find(e => e.num === String(num)) || null;
        if (!target) throw new Error(`Env num=${num} not found`);
    } else {
        // 优先级：环境变量 INSTANCE_ID > 环境变量 NUM > 隧道日志中的实例 > Running 中第一个
        const cfgId = firstNonBlank(asText(getEnv("HUAWEI_DEV_INSTANCE_ID")));
        if (cfgId) {
            target = envs.find(e => e.id === cfgId) || null;
        }
        if (!target) {
            // 从隧道日志推断当前连接的实例
            const r = await runShell(`ls /tmp/hds-tunnel-*.log 2>/dev/null | head -1 | sed 's/.*hds-tunnel-//;s/\\.log//'`, 8000);
            const tunnelEnvId = firstNonBlank(r.output);
            if (tunnelEnvId && /^[0-9a-f]{32}$/.test(tunnelEnvId)) {
                target = envs.find(e => e.id === tunnelEnvId) || null;
            }
        }
        if (!target) {
            const cfgNum = firstNonBlank(asText(getEnv("HUAWEI_DEV_NUM")));
            if (cfgNum) {
                target = envs.find(e => e.num === cfgNum) || null;
            }
        }
        if (!target) {
            target = envs.find(e => e.state === "Running") || null;
        }
        if (!target) {
            target = envs[0];
        }
    }
    return target;
}

async function waitForState(env: EnvInfo, wantStates: string[], timeoutMs: number): Promise<string> {
    const deadline = Date.now() + timeoutMs;
    let lastState = "";
    while (Date.now() < deadline) {
        try {
            const envs = await listEnvs(30000);
            const cur = envs.find(e => e.id === env.id);
            if (cur) {
                lastState = cur.state;
                if (wantStates.indexOf(cur.state) >= 0) return cur.state;
                if (cur.state === "Ready" && wantStates.indexOf("Running") >= 0 && lastState !== "Starting") {
                    // 启动失败回退
                    break;
                }
            }
        } catch (e) {
            lastState = `poll_error: ${asText((e as Error).message)}`;
        }
        await new Promise<void>(res => setTimeout(res, POLL_INTERVAL_MS));
    }
    return lastState;
}

async function isTunnelAlive(): Promise<boolean> {
    const r = await runShell(`pgrep -f '${TUNNEL_PROC_PATTERN}' >/dev/null 2>&1 && echo ALIVE || echo DEAD`, 8000);
    return r.output.indexOf("ALIVE") >= 0;
}

function buildTunnelCommand(envId: string): string {
    const logFile = `/tmp/hds-tunnel-${envId}.log`;
    return `DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} setsid nohup ${CLI_PATH} devenv start-tunnel --instance-id=${envId} --ports=${TUNNEL_PORT}:${REMOTE_SSH_PORT} > ${logFile} 2>&1 < /dev/null & sleep 0.3; echo TUNNEL_PID=$!`;
}

async function waitPortOpen(port: number, timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const r = await runShell(
            `(exec 3<>/dev/tcp/127.0.0.1/${port}) 2>/dev/null && echo PORT_OPEN || echo PORT_CLOSED`,
            8000
        );
        if (r.output.indexOf("PORT_OPEN") >= 0) return true;
        await new Promise<void>(res => setTimeout(res, 2000));
        void deadline;
    }
    return false;
}

async function sshProbe(envId: string): Promise<{ ok: boolean; detail: string }> {
    const identityPath = `${IDENTITY_DIR}/${envId}`;
    const knownHosts = `${KNOWN_HOSTS_DIR}/${envId}`;
    const check = await runShell(`test -f ${identityPath} && echo KEY_EXISTS || echo KEY_MISSING`, 8000);
    if (check.output.indexOf("KEY_EXISTS") < 0) {
        return { ok: false, detail: `identity key not found at ${identityPath}` };
    }
    const cmd = [
        "ssh -o ConnectTimeout=10",
        `-o UserKnownHostsFile=${knownHosts}`,
        "-o StrictHostKeyChecking=no",
        `-i ${identityPath}`,
        `-p ${TUNNEL_PORT}`,
        `${SSH_USER}@127.0.0.1`,
        "'echo __SSH_OK__'"
    ].join(" ");
    const r = await runShell(cmd, 25000);
    if (r.output.indexOf("__SSH_OK__") >= 0) {
        return { ok: true, detail: "ok" };
    }
    // publickey 认证失败 => 本地私钥与远端不匹配，重置远端公钥后重试
    if (r.output.indexOf("Permission denied") >= 0 || r.output.indexOf("no supported methods") >= 0) {
        const reset = await runShell(
            `printf 'yes\\n' | DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} timeout 60 ${CLI_PATH} devenv ssh-key-reset --instance-id=${envId} 2>&1`,
            70000
        );
        const resetOk = reset.output.indexOf("success") >= 0;
        // reset 后本地 IdentityFile 会更新，再试一次 SSH
        const retry = await runShell(cmd, 25000);
        return {
            ok: retry.output.indexOf("__SSH_OK__") >= 0,
            detail: `keyReset=${resetOk}; retry=${retry.output.slice(-150)}`
        };
    }
    return { ok: false, detail: r.output.slice(-300) };
}

async function persistToolResult(key: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
        const dir = getPluginConfigDir("huawei_devspace");
        const path = `${dir}/last_${key}.json`;
        await Tools.Files.write(path, JSON.stringify({ ts: Date.now(), ...data }, null, 2), false);
    } catch (e) {
        // 持久化失败不影响主流程
        void e;
    }
    return data as Record<string, unknown>;
}

// ==================== 工具实现 ====================

async function huaweiDevConnect(params: Record<string, unknown>) {
    const numParam = params?.num != null ? Number(params.num) : undefined;
    void numParam;
    // 步骤0：确保运行时依赖
    const keyringOk = await ensureKeyring();
    const env = await resolveTarget(numParam);
    const steps: string[] = [];
    steps.push(`target: #${env.num} ${env.name} (${env.id}) state=${env.state}`);

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
    } else {
        steps.push("already Running, skip start");
    }

    // 步骤2：隧道
    const alive = await isTunnelAlive();
    if (!alive) {
        const t = await runShell(buildTunnelCommand(env.id), 10000);
        steps.push(`tunnel launched: exit=${t.exitCode}`);
        const opened = await waitPortOpen(TUNNEL_PORT, 30000);
        steps.push(`port ${TUNNEL_PORT}: ${opened ? "OPEN" : "CLOSED"}`);
        if (!opened) {
            const log = await runShell(`tail -5 /tmp/hds-tunnel-${env.id}.log 2>/dev/null`, 8000);
            throw new Error(`tunnel port not open. log: ${log.output}`);
        }
    } else {
        steps.push("tunnel already alive");
    }

    // 步骤3：SSH 验证
    const probe = await sshProbe(env.id);
    steps.push(`ssh probe: ${probe.ok ? "OK" : `FAIL (${probe.detail.slice(0, 120)})`}`);

    const success = probe.ok;
    return await persistToolResult("connect", {
        success,
        keyringOk,
        env,
        steps,
        localPort: TUNNEL_PORT,
        error: success ? "" : "SSH probe failed after tunnel established"
    });
}

function firstLine(text: string): string {
    const idx = text.indexOf("\n");
    return (idx >= 0 ? text.slice(0, idx) : text).trim().slice(0, 160);
}

async function huaweiDevDisconnect(params: Record<string, unknown>) {
    void params;
    const steps: string[] = [];
    // 杀掉所有隧道进程
    const kill = await runShell(
        `pkill -f '${TUNNEL_PROC_PATTERN}' 2>/dev/null; sleep 1; pgrep -f '${TUNNEL_PROC_PATTERN}' >/dev/null && echo STILL_ALIVE || echo KILLED`,
        10000
    );
    steps.push(kill.output.indexOf("KILLED") >= 0 ? "tunnel killed" : "tunnel still alive?");
    // 找到当前目标环境并 stop
    let stopped = "";
    try {
        const env = await resolveTarget(undefined);
        const st = await hds(`devenv stop --instance-id=${env.id}`, 60000);
        stopped = `${env.name}: ${firstLine(st.output)}`;
        steps.push(stopped);
    } catch (e) {
        steps.push(`resolve target failed: ${asText((e as Error).message).slice(0, 120)}`);
    }
    return await persistToolResult("disconnect", {
        success: kill.output.indexOf("KILLED") >= 0,
        steps
    });
}

async function huaweiDevList(params: Record<string, unknown>) {
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

async function huaweiDevStatus(params: Record<string, unknown>) {
    void params;
    const steps: string[] = [];
    const alive = await isTunnelAlive();
    steps.push(`tunnel: ${alive ? "ALIVE" : "DOWN"}`);
    let portOpen = false;
    if (alive) {
        portOpen = await waitPortOpenOnce(TUNNEL_PORT);
        steps.push(`port ${TUNNEL_PORT}: ${portOpen ? "OPEN" : "CLOSED"}`);
    }
    let envState = "unknown";
    let envName = "";
    let envId = "";
    try {
        const env = await resolveTarget(undefined);
        envState = env.state;
        envName = env.name;
        envId = env.id;
    } catch (e) {
        steps.push(`list failed: ${asText((e as Error).message).slice(0, 120)}`);
    }
    let sshOk = false;
    if (alive && portOpen && envId) {
        const probe = await sshProbe(envId);
        sshOk = probe.ok;
    }
    return await persistToolResult("status", {
        success: true,
        connected: alive && portOpen && sshOk,
        tunnelAlive: alive,
        portOpen,
        sshOk,
        envState,
        envName,
        envId,
        steps
    });
}

async function waitPortOpenOnce(port: number): Promise<boolean> {
    const r = await runShell(
        `(exec 3<>/dev/tcp/127.0.0.1/${port}) 2>/dev/null && echo PORT_OPEN || echo PORT_CLOSED`,
        8000
    );
    return r.output.indexOf("PORT_OPEN") >= 0;
}

async function huaweiDevExec(params: Record<string, unknown>) {
    const command = asText(params?.command).trim();
    if (!command) throw new Error("command cannot be empty");
    const timeoutMs = params?.timeout_ms != null ? Number(params.timeout_ms) : 30000;
    // 确保连接存在
    const alive = await isTunnelAlive();
    if (!alive) {
        throw new Error("tunnel not running, call huawei_dev_connect first");
    }
    const env = await resolveTarget(undefined);
    const identityPath = `${IDENTITY_DIR}/${env.id}`;
    const knownHosts = `${KNOWN_HOSTS_DIR}/${env.id}`;
    const escaped = command.replace(/'/g, `'\\''`);
    const cmd = [
        "ssh -o ConnectTimeout=10",
        `-o UserKnownHostsFile=${knownHosts}`,
        "-o StrictHostKeyChecking=no",
        `-i ${identityPath}`,
        `-p ${TUNNEL_PORT}`,
        `${SSH_USER}@127.0.0.1`,
        `'${escaped}'`
    ].join(" ");
    const r = await runShell(cmd, Math.max(timeoutMs + 10000, 20000));
    const success = r.exitCode === 0 && !r.timedOut;
    return await persistToolResult("exec_output", {
        success,
        exitCode: r.exitCode,
        timedOut: r.timedOut,
        output: r.output,
        error: success ? "" : `exit=${r.exitCode}`
    });
}

async function huaweiDevConfig(params: Record<string, unknown>) {
    const ak = asText(params?.ak).trim();
    const sk = asText(params?.sk).trim();
    const verify = params?.verify !== false;
    if (!ak || !sk) throw new Error("ak and sk are required");
    // 1. 确保运行环境（CLI + 密钥环）
    await ensureCli();
    const keyringOk = await ensureKeyring();
    if (!keyringOk) throw new Error("keyring unavailable, cannot store credentials");
    // 2. 同步配置辅助脚本到持久位置
    const assetPath = "/storage/emulated/0/Download/Operit/dev_package/huawei_devspace/assets/hds-config.py";
    const scriptPath = "/root/.local/bin/hds-config.py";
    await runShell(`cp '${assetPath}' ${scriptPath} 2>/dev/null; test -f ${scriptPath} && echo SCRIPT_OK || echo SCRIPT_MISSING`, 10000);
    // 3. 自愈密钥环 + pty 配置，同一命令内原子完成
    const cfg = await runShell(
        `bash ${ENV_SETUP_SCRIPT} >/dev/null 2>&1; python3 ${scriptPath} '${ak.replace(/'/g, `'\\''`)}' '${sk.replace(/'/g, `'\\''`)}'`,
        90000
    );
    const output = cfg.output.trim();
    let success = output.indexOf("CONFIG_SUCCESS") >= 0;
    let error = "";
    if (!success) {
        if (output.indexOf("CONFIG_INVALID") >= 0) {
            error = "AK/SK was rejected by Huawei Cloud (invalid credentials)";
        } else {
            error = output.slice(-300);
        }
    }
    // 4. 可选验证：用新凭据调一次 devenv list
    let verified: boolean | null = null;
    if (success && verify) {
        try {
            await listEnvs();
            verified = true;
        } catch (e) {
            verified = false;
            error = `stored but verification failed: ${asText((e as Error).message).slice(0, 200)}`;
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

async function huaweiDevShell(params: Record<string, unknown>) {
    const input = asText(params?.input).trim();
    const alive = await isTunnelAlive();
    if (!alive) {
        throw new Error("tunnel not running, call huawei_dev_connect first");
    }
    const env = await resolveTarget(undefined);
    const identityPath = `${IDENTITY_DIR}/${env.id}`;
    const knownHosts = `${KNOWN_HOSTS_DIR}/${env.id}`;
    // 用 -t 强制分配 TTY；known_hosts 已由 hdspace 维护
    const sshCmd = [
        "ssh -t -o ConnectTimeout=10",
        "-o StrictHostKeyChecking=no",
        `-o UserKnownHostsFile=${knownHosts}`,
        `-i ${identityPath}`,
        `-p ${TUNNEL_PORT}`,
        `${SSH_USER}@127.0.0.1`
    ].join(" ");
    // 创建/复用可见终端会话
    const session = await Tools.System.terminal.create("huawei_devspace_ssh");
    const sessionId = asText((session as any).sessionId);
    // 关键：用 input 模拟键入命令并回车，而不是 exec，
    // 这样交互式 ssh 不会被 exec 超时机制杀掉，可长期保持
    await Tools.System.terminal.input(sessionId, { input: sshCmd });
    await Tools.System.terminal.input(sessionId, { control: "enter" });
    // 等待连接建立后读取一屏
    await new Promise<void>(res => setTimeout(res, 6000));
    if (input) {
        await Tools.System.terminal.input(sessionId, { input });
        await Tools.System.terminal.input(sessionId, { control: "enter" });
        await new Promise<void>(res => setTimeout(res, 2000));
    }
    const screen = await Tools.System.terminal.screen(sessionId);
    return await persistToolResult("shell", {
        success: true,
        sessionId,
        envId: env.id,
        hint: "后续用 terminal_input/terminal_screen 或 super_admin 终端工具与会话 'huawei_devspace_ssh' 交互",
        screen: asText((screen as any).content || (screen as any).output || "")
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
    huawei_dev_shell: huaweiDevShell
};

export default huaweiDevspaceTools;

exports.huawei_dev_connect = huaweiDevConnect;
exports.huawei_dev_disconnect = huaweiDevDisconnect;
exports.huawei_dev_list = huaweiDevList;
exports.huawei_dev_status = huaweiDevStatus;
exports.huawei_dev_exec = huaweiDevExec;
exports.huawei_dev_config = huaweiDevConfig;
exports.huawei_dev_shell = huaweiDevShell;