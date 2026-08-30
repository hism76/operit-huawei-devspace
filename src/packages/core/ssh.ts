// @ts-nocheck
// core/ssh.ts — SSH/SCP 参数构造、用户探测、指纹自愈
import { runShell } from "./shell";
import { getEnvPort, IDENTITY_DIR, KNOWN_HOSTS_DIR, CANDIDATE_USERS, DBUS_ADDRESS, CLI_PATH } from "./state";
import { writeState } from "./state";

/** 异步版 SSH 参数：自动取该环境的端口池端口 */
export async function sshBaseArgsFor(envId, port) {
    const p = port || (await getEnvPort(envId));
    return {
        args: [
            "ssh -o ConnectTimeout=10",
            "-o BatchMode=yes",
            "-o IdentitiesOnly=yes",
            "-o PasswordAuthentication=no",
            "-o StrictHostKeyChecking=no",
            `-o UserKnownHostsFile=${KNOWN_HOSTS_DIR}/${envId}`,
            `-i ${IDENTITY_DIR}/${envId}`,
            `-o ServerAliveInterval=30`,
            `-o ServerAliveCountMax=3`,
            `-o TCPKeepAlive=yes`,
            `-p ${p}`
        ],
        port: p
    };
}

/** 主机指纹过期自愈 */
export async function healKnownHosts(envId, port) {
    const p = port || (await getEnvPort(envId));
    const knownHosts = `${KNOWN_HOSTS_DIR}/${envId}`;
    await runShell(`ssh-keygen -f '${knownHosts}' -R '[127.0.0.1]:${p}' >/dev/null 2>&1; rm -f '${knownHosts}' 2>/dev/null; echo HEALED`, 8000, "ssh-heal");
}

/** 以指定用户探测 SSH；失败分类：ok / hostChanged / keyMismatch / noRoute / other */
export async function trySshAs(envId, user) {
    const { args } = await sshBaseArgsFor(envId);
    const parts = [...args];
    parts.push(`${user}@127.0.0.1`);
    parts.push("'echo __SSH_OK__'");
    const r = await runShell(parts.join(" "), 25000, "probe");
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
 * 探测可用登录用户（多轮自愈）：
 * 1) 按 env.type 排候选（Container→root 优先，其他→developer 优先）
 * 2) hostChanged 清指纹重试
 * 3) 全部 keyMismatch 时执行官方 ssh-key-reset 后再试一轮
 *    注意：reset 子进程要读密钥环凭据，必须先跑 hds-env-setup.sh 自愈 dbus/keyring
 */
export async function probeUser(env) {
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
            // 关键：reset 子进程需要读密钥环凭据，必须先自愈 dbus/keyring 环境再执行
            const reset = await runShell(`bash /root/.local/bin/hds-env-setup.sh >/dev/null 2>&1; printf 'yes\\n' | DBUS_SESSION_BUS_ADDRESS=${DBUS_ADDRESS} timeout 60 ${CLI_PATH} devenv ssh-key-reset --instance-id=${env.id} 2>&1`, 90000, "ssh-heal");
            keyResetDone = true;
            const resetOk = reset.output.indexOf("success") >= 0;
            steps.push(`key-reset: ${resetOk ? "done" : reset.output.trim().split("\n").slice(-1)[0].slice(0, 100)}`);
        }
        else if (!sawKeyMismatch && keyResetDone) {
            break;
        }
    }
    return { user: "", steps };
}

/** 真实 SSH echo 探测（可发现端口通但数据不通的半开僵死隧道） */
export async function sshEchoProbe(envId, user, getCurrentUserFn, executorKey) {
    if (!user && getCurrentUserFn) {
        user = await getCurrentUserFn({ id: envId, num: "", name: "", state: "", type: "" });
    }
    if (!user)
        return { ok: false, reason: "no known login user", user: "" };
    const { args } = await sshBaseArgsFor(envId);
    const parts = [...args];
    parts.push(`${user}@127.0.0.1`);
    parts.push("'echo __KEEPALIVE_OK__'");
    const r = await runShell(parts.join(" "), 20000, executorKey || "probe");
    const ok = r.output.indexOf("__KEEPALIVE_OK__") >= 0;
    return { ok, reason: ok ? "" : r.output.trim().split("\n")[0].slice(0, 120), user };
}