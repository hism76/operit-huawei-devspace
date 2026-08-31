// @ts-nocheck
// core/shell.ts — 终端执行与基础工具函数
// 全局依赖（沙盒运行时注入）：Tools, getEnv
export function asText(value) {
    return String(value == null ? "" : value);
}
export function firstNonBlank(...values) {
    for (let i = 0; i < values.length; i += 1) {
        const v = values[i];
        if (typeof v === "string" && v.trim())
            return v.trim();
    }
    return "";
}
export function firstLine(text) {
    const idx = text.indexOf("\n");
    return (idx >= 0 ? text.slice(0, idx) : text).trim().slice(0, 160);
}

const RUNNER_SESSION_NAME = "hds_internal_runner";
let cachedSessionId = "";

/** 获取或创建内部 runner terminal session */
async function getRunnerSessionId() {
    if (cachedSessionId) {
        return cachedSessionId;
    }
    try {
        const sess = await Tools.System.terminal.create(RUNNER_SESSION_NAME);
        cachedSessionId = asText(sess.sessionId);
        return cachedSessionId;
    } catch (e) {
        cachedSessionId = "";
        throw e;
    }
}

/** 执行 shell 命令（基于专有 Terminal Session，毫秒级响应，真实捕获 exitCode 与纯净输出） */
export async function runShell(command, timeoutMs, executorKey) {
    const limit = typeof timeoutMs === "number" && timeoutMs > 0 ? timeoutMs : 30000;
    const marker = "__HDS_EC_VAL__";
    const wrapped = `eval '${command.replace(/'/g, `'\\''`)}'; __HDS_EC__=$?; echo "${marker}:$__HDS_EC__"`;
    try {
        let sid = await getRunnerSessionId();
        let result = await Tools.System.terminal.exec(sid, wrapped, { timeoutMs: limit });
        // 如果会话失效，重建一次并重试
        if (!result || (result.success === false && asText(result.message).indexOf("不存在或已关闭") >= 0)) {
            cachedSessionId = "";
            sid = await getRunnerSessionId();
            result = await Tools.System.terminal.exec(sid, wrapped, { timeoutMs: limit });
        }
        let rawOut = asText(result?.output || "");
        let ec = Number(result?.exitCode || 0);
        const lines = rawOut.split("\n");
        const cleanLines = [];
        for (const line of lines) {
            if (line.startsWith(marker + ":")) {
                ec = parseInt(line.slice(marker.length + 1).trim(), 10) || 0;
            } else if (line.indexOf(marker) >= 0) {
                // 忽略带 marker 的命令行回显
                continue;
            } else {
                cleanLines.push(line);
            }
        }
        return {
            exitCode: ec,
            timedOut: !!result?.timedOut,
            output: cleanLines.join("\n").trim()
        };
    } catch (e) {
        // 若 session 彻底不可用，回退到 hiddenExec
        try {
            const fb = await Tools.System.terminal.hiddenExec(command, {
                executorKey: executorKey || "huawei-devspace",
                timeoutMs: limit
            });
            return {
                exitCode: Number(fb?.exitCode || 0),
                timedOut: !!fb?.timedOut,
                output: asText(fb?.output)
            };
        } catch (err) {
            return {
                exitCode: -1,
                timedOut: false,
                output: `shell exec error: ${asText(err?.message || e?.message)}`
            };
        }
    }
}
