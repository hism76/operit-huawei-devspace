// @ts-nocheck
/*
METADATA
{
    "name": "huawei_devspace",
    "display_name": {"zh": "华为云开发空间", "en": "Huawei DevSpace"},
    "description": {"zh": "华为云开发环境管理：多环境并行隧道、文件传输、端口转发。", "en": "Huawei Cloud dev env management."},
    "author": ["Operit User"],
    "category": "System",
    "tools": [
        {
            "name": "huawei_dev_connect",
            "description": {"zh": "连接环境：自动开机+建隧道+探测用户+启用root。id/num二选一，缺省用当前连接的环境。"},
            "parameters": [
                {"name": "num", "description": {"zh": "环境序号"}, "type": "number", "required": false},
                {"name": "id", "description": {"zh": "实例ID"}, "type": "string", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_disconnect",
            "description": {"zh": "断开隧道。id/num指定环境；都不传断开全部。stop_env=false保留环境运行。"},
            "parameters": [
                {"name": "stop_env", "description": {"zh": "同时关环境，默认true"}, "type": "boolean", "required": false},
                {"name": "id", "description": {"zh": "实例ID"}, "type": "string", "required": false},
                {"name": "num", "description": {"zh": "环境序号"}, "type": "number", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_list",
            "description": {"zh": "列出全部环境。"},
            "parameters": [],
            "returns": true
        },
        {
            "name": "huawei_dev_status",
            "description": {"zh": "查询所有连接状态与当前环境详情。结果缓存30秒，refresh=true强制刷新。"},
            "parameters": [
                {"name": "refresh", "description": {"zh": "跳过缓存强制刷新"}, "type": "boolean", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_exec",
            "description": {"zh": "在当前连接的环境执行命令，隧道断了自动重建重试。"},
            "parameters": [
                {"name": "command", "description": {"zh": "命令"}, "type": "string", "required": true},
                {"name": "timeout_ms", "description": {"zh": "超时毫秒，默认30000"}, "type": "number", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_quick",
            "description": {"zh": "一步到位：指定环境(可选)执行命令。未连接自动连接，未开机自动开机。日常执行命令优先用这个。"},
            "parameters": [
                {"name": "command", "description": {"zh": "命令"}, "type": "string", "required": true},
                {"name": "id", "description": {"zh": "实例ID，缺省用当前"}, "type": "string", "required": false},
                {"name": "num", "description": {"zh": "环境序号"}, "type": "number", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_config",
            "description": {"zh": "配置AK/SK凭据（存密钥环并验证）。换账号时用。"},
            "parameters": [
                {"name": "ak", "description": {"zh": "AccessKey"}, "type": "string", "required": true},
                {"name": "sk", "description": {"zh": "SecretKey"}, "type": "string", "required": true}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_shell",
            "description": {"zh": "打开交互式SSH终端会话。"},
            "parameters": [
                {"name": "input", "description": {"zh": "初始命令"}, "type": "string", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_enable_root",
            "description": {"zh": "为当前环境注入root公钥。需免密sudo或root登录。"},
            "parameters": [],
            "returns": true
        },
        {
            "name": "huawei_dev_power",
            "description": {"zh": "开关机（不建隧道）。action=start|stop，id/num选环境。"},
            "parameters": [
                {"name": "action", "description": {"zh": "start|stop"}, "type": "string", "required": true},
                {"name": "id", "description": {"zh": "实例ID"}, "type": "string", "required": false},
                {"name": "num", "description": {"zh": "环境序号"}, "type": "number", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_keepalive",
            "description": {"zh": "巡检全部隧道，僵死自愈。建议定时任务每5分钟调用。"},
            "parameters": [],
            "returns": true
        },
        {
            "name": "huawei_dev_upload",
            "description": {"zh": "上传手机文件到云环境。"},
            "parameters": [
                {"name": "local_path", "description": {"zh": "本地路径"}, "type": "string", "required": true},
                {"name": "remote_path", "description": {"zh": "远端路径"}, "type": "string", "required": true}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_download",
            "description": {"zh": "从云环境下载文件到手机。相对路径存/sdcard/Download/。"},
            "parameters": [
                {"name": "remote_path", "description": {"zh": "远端路径"}, "type": "string", "required": true},
                {"name": "local_path", "description": {"zh": "本地路径"}, "type": "string", "required": true}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_logs",
            "description": {"zh": "看隧道日志尾部+自动诊断掉线原因。"},
            "parameters": [
                {"name": "lines", "description": {"zh": "行数，默认50"}, "type": "number", "required": false},
                {"name": "id", "description": {"zh": "实例ID"}, "type": "string", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_forward",
            "description": {"zh": "端口转发：远端服务映射到手机本地。action=start|stop|list。"},
            "parameters": [
                {"name": "action", "description": {"zh": "start|stop|list"}, "type": "string", "required": false},
                {"name": "local_port", "description": {"zh": "本地端口1024-65535"}, "type": "number", "required": false},
                {"name": "remote_port", "description": {"zh": "远端端口"}, "type": "number", "required": false},
                {"name": "remote_host", "description": {"zh": "远端地址默认127.0.0.1"}, "type": "string", "required": false}
            ],
            "returns": true
        }
    ]
}
*/
Object.defineProperty(exports, "__esModule", { value: true });
const PACKAGE_VERSION = "0.2.3";
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
// ==================== core 模块导入 ====================
import { asText, firstNonBlank, firstLine, runShell } from "./core/shell";
import {
    CLI_PATH, CLI_SOURCE, TUNNEL_PORT, REMOTE_SSH_PORT, DBUS_ADDRESS,
    ENV_SETUP_SCRIPT, CONNECT_TIMEOUT_MS, POLL_INTERVAL_MS,
    STATE_DIR, readState, writeState, listAssignedPorts, getEnvPort
} from "./core/state";
import {
    getAliveTunnelIds, isTunnelAliveFor, isTunnelAlive, killTunnel,
    startTunnelWithRetry, markAutoKeep, unmarkAutoKeep, listAutoKeepEnvs,
    waitPortOpenOnce
} from "./core/tunnel";
import {
    sshBaseArgsFor, healKnownHosts, trySshAs, probeUser, sshEchoProbe
} from "./core/ssh";
import { persistToolResult, output, buildExecFailReason } from "./core/result";

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
// ==================== 端口池：多环境并行隧道基础 ====================
/** 列出所有已分配的端口映射 [{envId, port}] */
/** 自动保活登记：connect 时加入，显式 disconnect 时移除 */
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
            const aliveIds = await getAliveTunnelIds();
            if (aliveIds.length) {
                target = envs.find(e => e.id === aliveIds[0]) || null;
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
/** 列出所有存活的隧道及其环境 ID */
/** 指定环境是否有存活隧道 */
/** 是否存在任意存活的隧道进程 */
/** 杀掉指定环境的隧道（envId 省略时杀全部——仅显式 disconnect 使用） */
/** 原子启动：同 shell 内先自愈密钥环，再 setsid nohup 启动隧道 */
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
/** 启动隧道并等待端口开放；失败自动重启重试（hdspace 偶发 success 后自退） */
/** 统一 SSH 基础参数：防挂起 + 固定密钥（port 可省略，默认该环境的端口池端口） */
/** 同步版（兼容既有调用点）：显式传 port */
function sshBaseArgs(identityPath, knownHosts, port) {
    return [
        "ssh -o ConnectTimeout=10",
        "-o BatchMode=yes",
        "-o IdentitiesOnly=yes",
        "-o PasswordAuthentication=no",
        "-o StrictHostKeyChecking=no",
        `-o UserKnownHostsFile=${knownHosts}`,
        `-i ${identityPath}`,
        `-p ${port}`
    ];
}
/** 主机指纹过期自愈 */
/** 以指定用户探测 SSH；失败分类：keyMismatch / hostChanged / noRoute / other */
/**
 * 探测可用登录用户：
 * 1) 按 env.type 排候选（Container→root优先，其他→developer优先）
 * 2) hostChanged 清指纹重试
 * 3) 全部 keyMismatch 时执行官方 ssh-key-reset 后再试一轮
 */
/**
 * 摘要输出：默认只返回关键字段（省 token），verbose=true 才带 steps/详情。
 * summary: 摘要对象；detail: 完整对象；params: 原始参数（读 verbose）
 */
// ==================== 工具实现 ====================
async function huaweiDevConnect(params) {
    const steps = [];
    const keyringOk = await ensureKeyring();
    const env = await resolveTarget(params);
    const port = await getEnvPort(env.id);
    steps.push(`target: #${env.num} ${env.name} (${env.id}) state=${env.state} type=${env.type} port=${port}`);
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
    // 步骤2：隧道——按环境独立管理（多环境并行）
    if (await isTunnelAliveFor(env.id)) {
        steps.push(`tunnel alive for this env @${port}`);
    }
    else {
        const t = await startTunnelWithRetry(env.id, port);
        steps.push(...t.attempts);
        if (!t.ok)
            throw new Error(`tunnel failed after retries: ${t.attempts.join(" | ").slice(-400)}`);
    }
    // 登记自动保活 + 记录当前选择 + 缓存环境名
    await markAutoKeep(env.id);
    await writeState('hds-current-env', env.id);
    await writeState(`hds-name-${env.id}`, `${env.name} #${env.num}`);
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
    invalidateStatusCache();
    const detail = {
        success,
        keyringOk,
        env,
        user,
        rootOk,
        steps,
        localPort: port,
        error: success ? "" : "no working login user found",
        failReason: success ? "" : buildFailReason(steps, user, keyringOk)
    };
    return await persistToolResult("connect", output(params, {
        success,
        env: `${env.name} #${env.num}`,
        port,
        user,
        // 失败时摘要里也带过程尾部，避免"详见steps"却拿不到
        ...(success ? {} : { stepsTail: steps.slice(-5) }),
        failReason: detail.failReason
    }, detail));
}
/** quick：一步到位 连接+执行。未连接自动连接，未开机自动开机 */
async function huaweiDevQuick(params) {
    const command = asText(params?.command).trim();
    if (!command)
        throw new Error("command cannot be empty");
    // 复用 connect 的完整流程（含自动开机/建隧道/探测用户）
    const connectResult = await huaweiDevConnect(params);
    if (!connectResult.success) {
        return await persistToolResult("quick", output(params, {
            success: false,
            failReason: connectResult.failReason || "连接失败"
        }, connectResult));
    }
    const env = await resolveTarget(params || {});
    const port = await getEnvPort(env.id);
    let user = connectResult.user;
    const escaped = command.replace(/'/g, `'\\''`);
    const buildCmd = async () => {
        const { args } = await sshBaseArgsFor(env.id, port);
        const parts = [...args];
        parts.push(`${user}@127.0.0.1`);
        parts.push(`'${escaped}'`);
        return parts.join(" ");
    };
    let r = await runShell(await buildCmd(), 60000, "ssh-exec");
    if (r.exitCode !== 0 && r.output.indexOf("REMOTE HOST IDENTIFICATION HAS CHANGED") >= 0) {
        await healKnownHosts(env.id, port);
        r = await runShell(await buildCmd(), 60000, "ssh-exec");
    }
    const success = r.exitCode === 0 && !r.timedOut;
    if (success)
        await markLastOk(env.id);
    return await persistToolResult("quick", output(params, {
        success,
        env: `${env.name} #${env.num}`,
        output: r.output.slice(0, 2000),
        exitCode: r.exitCode,
        failReason: success ? "" : "命令失败，verbose=true 看详情"
    }, {
        success,
        user,
        exitCode: r.exitCode,
        timedOut: r.timedOut,
        output: r.output,
        failReason: success ? "" : buildExecFailReason(r, success),
        connectSteps: connectResult.steps
    }));
}
/** 汇总步骤日志生成人话版失败原因 */
function buildFailReason(steps, user, keyringOk) {
    const tail = steps.slice(-6).join(" | ");
    if (!keyringOk)
        return "密钥环不可用：dbus/gnome-keyring 未就绪，请先在终端执行 hds-env-setup.sh";
    if (tail.indexOf("keyMismatch") >= 0 || tail.indexOf("ssh-key-reset") >= 0)
        return "SSH 密钥失配：已尝试官方 ssh-key-reset 仍未通过，请重新 connect 或检查环境是否重建过";
    if (tail.indexOf("hostChanged") >= 0)
        return "远端主机指纹变化：known_hosts 已自动清理，请重试连接";
    if (tail.indexOf("tunnel failed") >= 0 || tail.indexOf("port#") >= 0 && tail.indexOf("CLOSED") >= 0)
        return `隧道建立失败：${tail.slice(-200)}`;
    if (tail.indexOf("did not reach Running") >= 0 || tail.indexOf("not reach Running") >= 0)
        return "环境未能进入 Running 状态：可能云侧配额/资源问题，请到控制台确认";
    if (!user)
        return "SSH 登录探测失败：root 与 developer 用户均无法登录，详见 steps 日志";
    return tail.slice(-300);
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
        const aliveIds = await getAliveTunnelIds();
        const tunnelId = firstNonBlank(aliveIds);
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

    invalidateStatusCache();
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
async function markLastOk(envId) {
    await writeState("hds-last-ok-ts", String(Date.now()));
    void envId;
}
async function getLastOk() {
    const v = await readState("hds-last-ok-ts");
    return Number(v) > 0 ? Number(v) : 0;
}
/** keepalive 工具实现：真实探测 + 僵死自愈（多环境并行版） */
async function huaweiDevKeepalive(params) {
    void params;
    const steps = [];
    // 收集需要保活的环境：登记过的 + 存活隧道的
    const keepEnvs = await listAutoKeepEnvs();
    const aliveIds = await getAliveTunnelIds();
    let targets = [...keepEnvs];
    for (const id of aliveIds) {
        if (/^[0-9a-f]{32}$/.test(id) && targets.indexOf(id) < 0)
            targets.push(id);
    }
    if (!targets.length) {
        steps.push("no registered or active tunnels; nothing to do");
        return await persistToolResult("keepalive", { success: true, action: "none", steps });
    }
    let allOk = true;
    const results = [];
    for (const envId of targets) {
        const port = await getEnvPort(envId);
        if (!(await isTunnelAliveFor(envId))) {
            steps.push(`[${envId.slice(0, 8)}] tunnel DOWN, reviving @${port}...`);
            const t = await startTunnelWithRetry(envId, port);
            steps.push(...t.attempts.map(a => `[${envId.slice(0, 8)}] ${a}`));
            if (!t.ok) {
                allOk = false;
                results.push({ envId, ok: false, action: "revive_failed" });
                continue;
            }
        }
        const probe = await sshEchoProbe(envId, "");
        steps.push(`[${envId.slice(0, 8)}] ssh echo ${probe.ok ? `OK as ${probe.user}` : `FAILED (${probe.reason})`} @${port}`);
        if (!probe.ok) {
            steps.push(`[${envId.slice(0, 8)}] zombie detected; rebuilding...`);
            const t = await startTunnelWithRetry(envId, port);
            steps.push(...t.attempts.map(a => `[${envId.slice(0, 8)}] ${a}`));
            const reprobe = await sshEchoProbe(envId, probe.user || "");
            steps.push(`[${envId.slice(0, 8)}] re-verify ${reprobe.ok ? "OK" : "FAILED"}`);
            if (!reprobe.ok) {
                allOk = false;
                results.push({ envId, ok: false, action: "zombie_rebuild_failed" });
                continue;
            }
            results.push({ envId, ok: true, action: "rebuilt", user: reprobe.user });
        }
        else {
            await markLastOk(envId);
            results.push({ envId, ok: true, action: "verified", user: probe.user });
        }
    }
    invalidateStatusCache();
    return await persistToolResult("keepalive", {
        success: allOk,
        checked: targets.length,
        results,
        lastOkTs: Date.now(),
        steps
    });
}
/** 文件上传：本地(Android) → 远程，走现有隧道 scp */
async function huaweiDevUpload(params) {
    const localPath = asText(params?.local_path).trim();
    const remotePath = asText(params?.remote_path).trim();
    if (!localPath || !remotePath)
        throw new Error("local_path and remote_path are required");
    if (!(await isTunnelAlive())) {
        throw new Error("tunnel not running, call huawei_dev_connect first");
    }
    const env = await resolveTarget({});
    const port = await getEnvPort(env.id);
    let user = await getCurrentUser(env);
    if (!user)
        throw new Error("no working login user; run huawei_dev_connect first");
    // Android 侧路径转 proot 可见路径
    const prootLocal = localPath.replace(/^\/storage\/emulated\/0/, "/sdcard").replace(/^\/sdcard/, "/sdcard");
    const existsCheck = await runShell(`test -f '${prootLocal}' && echo EXISTS || echo MISSING`, 8000, "file-xfer");
    if (existsCheck.output.indexOf("EXISTS") < 0) {
        return await persistToolResult("upload", {
            success: false,
            failReason: `本地文件不存在：${localPath}（终端侧解析为 ${prootLocal}）`
        });
    }
    const sizeOut = await runShell(`wc -c < '${prootLocal}'`, 8000, "file-xfer");
    const sizeBytes = Number(firstNonBlank(sizeOut.output)) || 0;
    const escRemote = remotePath.replace(/'/g, `'\\''`);
    const scpCmd = [
        "scp -o ConnectTimeout=10",
        "-o BatchMode=yes",
        "-o IdentitiesOnly=yes",
        "-o PasswordAuthentication=no",
        "-o StrictHostKeyChecking=no",
        `-o UserKnownHostsFile=${KNOWN_HOSTS_DIR}/${env.id}`,
        `-i ${IDENTITY_DIR}/${env.id}`,
        `-P ${port}`,
        `'${prootLocal}'`,
        `${user}@127.0.0.1:'${escRemote}'`
    ].join(" ");
    const r = await runShell(scpCmd, Math.max(120000, sizeBytes / 500), "file-xfer");
    const ok = r.exitCode === 0 && !r.timedOut;
    const failReason = ok ? "" : (r.timedOut
        ? "传输超时中断：文件过大或隧道不稳，可重试"
        : `scp 失败（exit=${r.exitCode}）：${firstLine(r.output).slice(-200)}；若目标是 root 目录而登录用户非 root，远端可能无写权限`);
    return await persistToolResult("upload", output(params, {
        success: ok,
        remotePath,
        sizeBytes,
        failReason
    }, {
        success: ok,
        user,
        envId: env.id,
        localPath,
        remotePath,
        sizeBytes,
        exitCode: r.exitCode,
        output: r.output.slice(-400),
        failReason
    }));
}
/** 文件下载：远程 → 本地(Android)，走现有隧道 scp */
async function huaweiDevDownload(params) {
    const remotePath = asText(params?.remote_path).trim();
    const localPath = asText(params?.local_path).trim();
    if (!remotePath || !localPath)
        throw new Error("remote_path and local_path are required");
    if (!(await isTunnelAlive())) {
        throw new Error("tunnel not running, call huawei_dev_connect first");
    }
    const env = await resolveTarget({});
    const port = await getEnvPort(env.id);
    let user = await getCurrentUser(env);
    if (!user)
        throw new Error("no working login user; run huawei_dev_connect first");
    const prootLocal = localPath.startsWith("/") ? localPath : `/sdcard/Download/${localPath}`;
    await runShell(`mkdir -p "$(dirname '${prootLocal}')"`, 8000, "file-xfer");
    const escRemote = remotePath.replace(/'/g, `'\\''`);
    const scpCmd = [
        "scp -o ConnectTimeout=10",
        "-o BatchMode=yes",
        "-o IdentitiesOnly=yes",
        "-o PasswordAuthentication=no",
        "-o StrictHostKeyChecking=no",
        `-o UserKnownHostsFile=${KNOWN_HOSTS_DIR}/${env.id}`,
        `-i ${IDENTITY_DIR}/${env.id}`,
        `-P ${port}`,
        `${user}@127.0.0.1:'${escRemote}'`,
        `'${prootLocal}'`
    ].join(" ");
    const r = await runShell(scpCmd, 180000, "file-xfer");
    const ok = r.exitCode === 0 && !r.timedOut;
    return await persistToolResult("download", {
        success: ok,
        user,
        envId: env.id,
        remotePath,
        localPath: prootLocal,
        exitCode: r.exitCode,
        output: r.output.slice(-400),
        failReason: ok ? "" : (r.timedOut
            ? "下载超时中断：文件过大或隧道不稳，可重试"
            : r.output.indexOf("No such file or directory") >= 0
                ? `远程文件不存在：${remotePath}`
                : `scp 失败（exit=${r.exitCode}）：${firstLine(r.output).slice(-200)}`)
    });
}
/** 查看隧道日志尾部：掉线原因排查利器 */
async function huaweiDevLogs(params) {
    const lines = Number(params?.lines) > 0 ? Number(params.lines) : 50;
    const envIdParam = asText(params?.id).trim().toLowerCase();
    let targetId = envIdParam;
    if (!targetId || !/^[0-9a-f]{32}$/.test(targetId)) {
        targetId = (await getAliveTunnelIds())[0] || (await readState("hds-current-env")) || "";
    }
    if (!targetId) {
        // 没有明确目标：取最新修改的日志文件
        const ls = await runShell(`ls -t /tmp/hds-tunnel-*.log 2>/dev/null | head -1`, 8000, "log-view");
        const latest = firstNonBlank(ls.output);
        if (!latest)
            return await persistToolResult("logs", {
                success: false,
                failReason: "没有任何隧道日志：尚未建立过连接"
            });
        targetId = latest.replace(/.*hds-tunnel-/, "").replace(/\.log$/, "");
    }
    const logFile = `/tmp/hds-tunnel-${targetId}.log`;
    const r = await runShell(`tail -n ${Math.min(lines, 500)} '${logFile}' 2>/dev/null; echo "---SIZE---"; wc -c < '${logFile}' 2>/dev/null`, 10000, "log-view");
    const segs = r.output.split("---SIZE---");
    const content = firstNonBlank(segs[0]) || "(日志为空)";
    const sizeBytes = Number(firstNonBlank(segs[1])) || 0;
    // 简易诊断：识别常见错误关键词
    const diag = [];
    if (/Connection reset/i.test(content))
        diag.push("检测到 Connection reset：远端主动断开（可能环境重启/网络抖动）");
    if (/timed out/i.test(content))
        diag.push("检测到超时：网络不稳定或 NAT 回收了空闲连接");
    if (/Permission denied|publickey/i.test(content))
        diag.push("检测到认证失败：密钥可能失配");
    if (/Address already in use/i.test(content))
        diag.push("端口被占用：可能有残留隧道进程，建议 disconnect 后重连");
    return await persistToolResult("logs", {
        success: true,
        envId: targetId,
        logFile,
        sizeBytes,
        tailLines: Math.min(lines, 500),
        content: content.split("\n").slice(-Math.min(lines, 500)).join("\n"),
        diagnostics: diag
    });
}

/** 自定义本地端口转发：local_port -> remote_host:remote_port（复用环境 SSH 隧道） */
async function huaweiDevForward(params) {
    const localPort = Number(params?.local_port);
    const remotePort = Number(params?.remote_port);
    const remoteHost = asText(params?.remote_host).trim() || "127.0.0.1";
    const action = asText(params?.action).trim().toLowerCase() || "start";
    if (action !== "start" && action !== "stop" && action !== "list") {
        throw new Error("action must be 'start' | 'stop' | 'list'");
    }
    // 列出当前所有转发
    if (action === "list") {
        const r = await runShell(`pgrep -af 'ssh.*-L.*${PORT_POOL_END}' 2>/dev/null; pgrep -af 'socat TCP-LISTEN' 2>/dev/null; true`, 8000, "fwd-mgr");
        return await persistToolResult("forward", {
            success: true,
            forwards: r.output.trim().split("\n").filter(l => l.indexOf("-L") >= 0 || l.indexOf("TCP-LISTEN") >= 0),
            hint: "每条形如: ssh ... -L local:host:port user@..."
        });
    }
    if (!localPort || localPort < 1024 || localPort > 65535)
        throw new Error("local_port must be 1024-65535");
    if (action !== "stop" && (!remotePort || remotePort < 1 || remotePort > 65535))
        throw new Error("remote_port must be 1-65535");
    if (!(await isTunnelAlive())) {
        throw new Error("tunnel not running, call huawei_dev_connect first");
    }
    const env = await resolveTarget({});
    const { args } = await sshBaseArgsFor(env.id);
    const user = await getCurrentUser(env);
    if (!user)
        throw new Error("no working login user; run connect first");
    if (action === "stop") {
        // 杀掉匹配该本地端口的转发进程
        const kill = await runShell(`pkill -f '\\-L ${localPort}:' 2>/dev/null; sleep 0.5; pgrep -f '\\-L ${localPort}:' >/dev/null && echo STILL_ALIVE || echo KILLED`, 10000, "fwd-mgr");
        const ok = kill.output.indexOf("KILLED") >= 0;
        return await persistToolResult("forward", {
            success: ok,
            action: "stop",
            localPort,
            failReason: ok ? "" : "没有找到该端口的转发进程，或已被终止"
        });
    }
    // start：setsid 后台启动 ssh -N -L
    const fwdArgs = [...args];
    fwdArgs[0] = "ssh -N";
    const fwdCmd = `DBUS_SESSION_BUS_ADDRESS=\${DBUS_ADDRESS} setsid nohup ${fwdArgs.join(" ")} -L ${localPort}:${remoteHost}:${remotePort} ${user}@127.0.0.1 > /tmp/hds-forward-${localPort}.log 2>&1 < /dev/null & sleep 0.3; echo FWD_PID=$!`;
    const launch = await runShell(fwdCmd, 12000, "fwd-mgr");
    await new Promise(res => setTimeout(res, 2500));
    const opened = await waitPortOpenOnce(localPort);
    return await persistToolResult("forward", {
        success: opened,
        action: "start",
        envId: env.id,
        user,
        localPort,
        remoteHost,
        remotePort,
        accessHint: `手机浏览器/应用访问 http://127.0.0.1:${localPort} 即可到达远端 ${remoteHost}:${remotePort}`,
        failReason: opened ? "" : `转发未就绪：${firstLine(launch.output).slice(-150)}；检查远端服务是否在 ${remoteHost}:${remotePort} 监听`
    });
}

async function huaweiDevDisconnect(params) {
    const stopEnv = params?.stop_env !== false;
    const steps = [];
    // 目标解析：显式 id/num > 隧道指向 > current-env
    let targetId = "";
    if (params?.id != null || params?.num != null) {
        try {
            const env = await resolveTarget(params);
            targetId = env.id;
        }
        catch (e) {
            throw new Error(`target env not found: ${asText(e.message).slice(0, 150)}`);
        }
    }
    else {
        targetId = (await getAliveTunnelIds())[0] || (await readState("hds-current-env")) || "";
    }
    if (!targetId && !stopEnv) {
        invalidateStatusCache();
    return await persistToolResult("disconnect", {
            success: false,
            stoppedEnv: false,
            targetId: null,
            failReason: "没有可断开的连接：无活动隧道也无历史记录",
            steps: ["no tunnel and no history"]
        });
    }
    // 杀指定环境的隧道；未指定目标时杀全部（显式断开语义）
    const killed = targetId ? await killTunnel(targetId) : await killTunnel();
    steps.push(killed ? `tunnel killed${targetId ? ` (${targetId.slice(0, 8)})` : ""}` : "tunnel already dead");
    if (targetId)
        await unmarkAutoKeep(targetId);
    let stopped = "";
    if (stopEnv) {
        if (!targetId) {
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
// status 缓存：30 秒内的重复查询直接返回缓存（省探测时间与 token）
let statusCache = null;
async function huaweiDevStatus(params) {
    const forceRefresh = !!(params && params.refresh);
    if (!forceRefresh && statusCache && (Date.now() - statusCache._cachedAt) < 30000) {
        return Object.assign({}, statusCache, { cached: true });
    }
    const steps = [];
    // ===== 多环境连接总览 =====
    const assigned = await listAssignedPorts();
    const connections = [];
    for (const a of assigned) {
        const tunnelAlive = await isTunnelAliveFor(a.envId);
        const portOpen = tunnelAlive ? await waitPortOpenOnce(a.port) : false;
        let user = "";
        if (tunnelAlive && portOpen) {
            const probe = await sshEchoProbe(a.envId, "");
            user = probe.ok ? (probe.user || "") : "";
        }
        // 环境名从缓存/列表补齐
        const envName = firstNonBlank(await readState(`hds-name-${a.envId}`));
        connections.push({
            envId: a.envId,
            envName,
            port: a.port,
            tunnelAlive,
            portOpen,
            sshOk: !!user,
            user
        });
    }
    steps.push(`active tunnels: ${connections.filter(c => c.tunnelAlive).length}/${assigned.length} registered`);
    // ===== 当前环境详情（兼容旧字段）=====
    const alive = await isTunnelAlive();
    const currentTarget = (await getAliveTunnelIds())[0] || (await readState("hds-current-env")) || "";
    let port = 0;
    let portOpen = false;
    if (currentTarget) {
        port = await getEnvPort(currentTarget).catch(() => 0);
        if (port && alive)
            portOpen = await waitPortOpenOnce(port);
    }
    else {
        port = TUNNEL_PORT;
    }
    steps.push(`current: ${currentTarget.slice(0, 8)} @${port} ${portOpen ? "OPEN" : "CLOSED"}`);
    let envState = "unknown";
    let envName = "";
    let envId = currentTarget;
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
    const statusResult = await persistToolResult("status", {
        success: true,
        connected: alive && portOpen && sshOk,
        tunnelAlive: alive,
        tunnelTarget: currentTarget,
        port,
        portOpen,
        sshOk,
        user,
        envState, envName, envId, envType,
        connections,
        lastOkTs: await getLastOk(),
        steps
    });
    statusCache = Object.assign({}, statusResult, { _cachedAt: Date.now() });
    return statusResult;
}
/** 操作后清 status 缓存，保证下次查询拿到最新状态 */
function invalidateStatusCache() {
    statusCache = null;
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
    const port = await getEnvPort(env.id);
    let user = await getCurrentUser(env);
    if (!user)
        throw new Error("no working login user; run huawei_dev_connect first");
    const escaped = command.replace(/'/g, `'\\''`);
    const buildCmd = async () => {
        const { args } = await sshBaseArgsFor(env.id, port);
        const parts = [...args];
        parts.push(`${user}@127.0.0.1`);
        parts.push(`'${escaped}'`);
        return parts.join(" ");
    };
    let r = await runShell(await buildCmd(), Math.max(timeoutMs + 10000, 20000), "ssh-exec");
    let success = r.exitCode === 0 && !r.timedOut;
    // 隧道自愈：半开/端口死 → 重建后重试一次（用户无感）
    const tunnelDead = !success
        && (r.output.indexOf("Connection refused") >= 0
            || r.output.indexOf("Connection timed out") >= 0
            || r.output.indexOf("kex_exchange_identification") >= 0);
    if (tunnelDead) {
        const t = await startTunnelWithRetry(env.id, port);
        if (t.ok) {
            r = await runShell(await buildCmd(), Math.max(timeoutMs + 10000, 20000), "ssh-exec");
            success = r.exitCode === 0 && !r.timedOut;
            if (success)
                await markLastOk(env.id);
        }
    }
    // 自愈：指纹变化 / 密钥失配
    if (!success) {
        if (r.output.indexOf("REMOTE HOST IDENTIFICATION HAS CHANGED") >= 0) {
            await healKnownHosts(env.id, port);
            r = await runShell(await buildCmd(), Math.max(timeoutMs + 10000, 20000), "ssh-exec");
            success = r.exitCode === 0 && !r.timedOut;
        }
        else if (r.output.indexOf("Permission denied") >= 0) {
            const reprobe = await probeUser(env);
            if (reprobe.user && reprobe.user !== user) {
                user = reprobe.user;
                r = await runShell(await buildCmd(), Math.max(timeoutMs + 10000, 20000), "ssh-exec");
                success = r.exitCode === 0 && !r.timedOut;
            }
        }
    }
    return await persistToolResult("exec_output", output(params, {
        success,
        user,
        output: r.output.slice(0, 2000),
        exitCode: r.exitCode
    }, {
        success,
        user,
        exitCode: r.exitCode,
        timedOut: r.timedOut,
        output: r.output,
        error: success ? "" : `exit=${r.exitCode}`,
        failReason: success ? "" : buildExecFailReason(r, success)
    }));
}
/** exec 失败原因归类 */
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
    const { args } = await sshBaseArgsFor(env.id);
    const cmdParts = [...args];
    cmdParts.push(`${workingUser}@127.0.0.1`);
    cmdParts.push(`'${remoteScript.replace(/'/g, `'\\''`)}'`);
    const r = await runShell(cmdParts.join(" "), 45000, "ssh-exec");
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
        steps: result.steps,
        failReason: result.success ? "" : (result.steps.join(" | ").indexOf("sudo needs password") >= 0
            ? "当前登录用户无免密 sudo 权限，无法自动注入 root 公钥；请用 root 用户连接后重试"
            : `root 启用失败：${result.steps.slice(-3).join(" | ").slice(-200)}`)
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
        error,
        failReason: (success && verified !== false) ? "" : (
            error.indexOf("rejected by Huawei Cloud") >= 0
                ? "AK/SK 被华为云拒绝：凭据无效或已停用，请到 IAM 控制台核对"
                : !keyringOk
                    ? "密钥环不可用：请先在终端执行 hds-env-setup.sh"
                    : verified === false
                        ? `凭据已保存但验证失败：${error}`
                        : error)
    });
}
async function huaweiDevShell(params) {
    const input = asText(params?.input).trim();
    if (!(await isTunnelAlive())) {
        throw new Error("tunnel not running, call huawei_dev_connect first");
    }
    const env = await resolveTarget({});
    const user = await getCurrentUser(env);
    if (!user)
        throw new Error("no working login user; run connect first");
    const { args } = await sshBaseArgsFor(env.id);
    const sshCmd = [...args];
    sshCmd[0] = "ssh -t -o ConnectTimeout=10"; // 强制 TTY
    sshCmd.push(`${user}@127.0.0.1`);
    // 按环境隔离会话名，避免多环境/重复调用互相覆盖
    const sessionName = `hds_shell_${env.id.slice(0, 8)}`;
    const session = await Tools.System.terminal.create(sessionName);
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
        sessionName,
        user,
        envId: env.id,
        hint: `后续用 terminal_input/terminal_screen 或 super_admin 终端工具与会话 '${sessionName}' 交互`,
        screen: asText(screen.content || screen.output || "")
    });
}
// ==================== 导出 ====================
const huaweiDevspaceTools = {
    huawei_dev_connect: huaweiDevConnect,
    huawei_dev_disconnect: huaweiDevDisconnect,
    huawei_dev_list: huaweiDevList,
    huawei_dev_status: huaweiDevStatus,
    huawei_dev_exec: huaweiDevExec,
    huawei_dev_config: huaweiDevConfig,
    huawei_dev_shell: huaweiDevShell,
    huawei_dev_enable_root: huaweiDevEnableRoot,
    huawei_dev_power: huaweiDevPower,
    huawei_dev_keepalive: huaweiDevKeepalive,
    huawei_dev_upload: huaweiDevUpload,
    huawei_dev_download: huaweiDevDownload,
    huawei_dev_logs: huaweiDevLogs,
    huawei_dev_forward: huaweiDevForward,
    huawei_dev_quick: huaweiDevQuick
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
exports.huawei_dev_upload = huaweiDevUpload;
exports.huawei_dev_download = huaweiDevDownload;
exports.huawei_dev_logs = huaweiDevLogs;
exports.huawei_dev_forward = huaweiDevForward;
exports.huawei_dev_quick = huaweiDevQuick;
