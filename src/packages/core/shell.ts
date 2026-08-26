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

/** 执行 shell 命令。executorKey 用于并发分组（同 key 排队，不同 key 并行） */
export async function runShell(command, timeoutMs, executorKey) {
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
