// @ts-nocheck
// core/result.ts — 工具结果输出（摘要/详情双模式，省 token）
import { asText } from "./shell";

/** 持久化最近一次工具结果到插件配置目录 */
export async function persistToolResult(key, data) {
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

/**
 * 摘要输出封装：
 * - 默认返回 summary（关键字段，省 token）
 * - params.verbose === true 时返回完整 detail（排障用）
 */
export function output(params, summary, detail) {
    if (params && params.verbose === true) {
        return Object.assign({ verbose: true }, detail);
    }
    return summary;
}

/** exec 失败原因归类 */
export function buildExecFailReason(r, recovered) {
    const out = r.output || "";
    if (r.timedOut)
        return "命令执行超时：可加大 timeout_ms 或检查命令是否交互式阻塞";
    if (out.indexOf("Connection refused") >= 0)
        return "隧道端口拒绝连接：隧道已尝试自动重建，若仍失败请调用 huawei_dev_connect";
    if (out.indexOf("Connection timed out") >= 0 || out.indexOf("kex_exchange_identification") >= 0)
        return "SSH 连接超时：隧道疑似僵死已自动重建，重试仍失败请 huawei_dev_connect";
    if (out.indexOf("Permission denied") >= 0)
        return "SSH 登录被拒：密钥失配，建议重新 connect（会自动探测用户/启用root）";
    if (out.indexOf("REMOTE HOST IDENTIFICATION HAS CHANGED") >= 0)
        return "远端主机指纹变化：已自动清理 known_hosts 并重试";
    if (r.exitCode !== 0)
        return `命令执行失败（exit=${r.exitCode}）：命令本身返回非零，详见 output`;
    return recovered ? "" : out.slice(-200);
}