import huaweiTools from "../packages/huawei_devspace.js";

const PACKAGE_NAME = "huawei_devspace";

type StatusInfo = {
    connected: boolean;
    tunnelAlive: boolean;
    portOpen: boolean;
    sshOk: boolean;
    envState: string;
    envName: string;
    envId: string;
};

function asText(value: unknown): string {
    return String(value == null ? "" : value);
}

function parseRecord(result: unknown): Record<string, any> {
    if (result && typeof result === "object" && !Array.isArray(result)) {
        return result as Record<string, any>;
    }
    if (typeof result === "string") {
        try {
            const parsed = JSON.parse(result.trim());
            if (parsed && typeof parsed === "object") return parsed as Record<string, any>;
        } catch {
            // not json
        }
    }
    return {};
}

export default function Screen(ctx: ComposeDslContext): ComposeNode {
    const busyState = ctx.useState<boolean>("busy", false);
    const busy = busyState[0];
    const setBusy = busyState[1];

    const statusState = ctx.useState<StatusInfo | null>("status", null);
    const status = statusState[0];
    const setStatus = statusState[1];

    const msgState = ctx.useState<string>("msg", "点击按钮开启或关闭连接");
    const message = msgState[0];
    const setMessage = msgState[1];

    const logState = ctx.useState<string>("log", "");
    const logText = logState[0];
    const setLog = logState[1];

    async function callPackageTool(toolName: string, params: Record<string, unknown>): Promise<unknown> {
        const candidates = [
            `${PACKAGE_NAME}:${toolName}`,
            `com.operit.huawei_devspace:${toolName}`
        ];
        let lastErr = "";
        for (const candidate of candidates) {
            try {
                return await ctx.callTool(candidate, params);
            } catch (e) {
                lastErr = asText((e as Error).message);
            }
        }
        throw new Error(lastErr || `tool call failed: ${toolName}`);
    }

    const runAction = async (title: string, action: () => Promise<unknown>): Promise<void> => {
        if (busy) return;
        setBusy(true);
        setMessage(`${title}中...`);
        try {
            await action();
            setMessage(`${title}完成`);
        } catch (e) {
            setMessage(`${title}失败`);
            setLog(asText((e as Error).message));
        } finally {
            setBusy(false);
        }
    };

    const refreshStatus = async (): Promise<StatusInfo> => {
        const result = parseRecord(await callPackageTool("huawei_dev_status", {}));
        const info: StatusInfo = {
            connected: !!result.connected,
            tunnelAlive: !!result.tunnelAlive,
            portOpen: !!result.portOpen,
            sshOk: !!result.sshOk,
            envState: asText(result.envState),
            envName: asText(result.envName),
            envId: asText(result.envId)
        };
        setStatus(info);
        return info;
    };

    const connectAction = () => runAction("开连接", async () => {
        await callPackageTool("huawei_dev_connect", {});
        await refreshStatus();
        ctx.showToast("连接已建立");
    });

    const disconnectAction = () => runAction("关连接", async () => {
        await callPackageTool("huawei_dev_disconnect", {});
        await refreshStatus();
        ctx.showToast("已断开");
    });

    const statusCheckAction = () => runAction("状态检查", async () => {
        await refreshStatus();
    });

    const listEnvAction = () => runAction("环境列表", async () => {
        const result = parseRecord(await callPackageTool("huawei_dev_list", {}));
        const table = asText(result.table);
        setLog(table || "(empty)");
    });

    const execProbeAction = () => runAction("远程测试", async () => {
        const result = parseRecord(await callPackageTool("huawei_dev_exec", {
            command: "echo __UI_PROBE_OK__ && hostname"
        }));
        const ok = asText(result.output).indexOf("__UI_PROBE_OK__") >= 0;
        setLog(ok ? "远程命令执行正常" : `执行异常: ${asText(result.output).slice(0, 200)}`);
    });

    // ===== 凭据配置面板 =====
    const credExpandedState = ctx.useState<boolean>("credExpanded", false);
    const credExpanded = credExpandedState[0];
    const setCredExpanded = credExpandedState[1];

    const akState = ctx.useState<string>("credAk", "");
    const akValue = akState[0];
    const setAk = akState[1];

    const skState = ctx.useState<string>("credSk", "");
    const skValue = skState[0];
    const setSk = skState[1];

    const saveCredAction = () => runAction("保存凭据", async () => {
        if (!akValue.trim() || !skValue.trim()) {
            throw new Error("AK 和 SK 都不能为空");
        }
        const result = parseRecord(await callPackageTool("huawei_dev_config", {
            ak: akValue.trim(),
            sk: skValue.trim(),
            verify: true
        }));
        if (result.success) {
            setSk("");
            ctx.showToast("凭据已更新并验证通过");
        } else {
            throw new Error(asText(result.error) || "保存失败");
        }
    });

    const connected = !!(status && status.connected);

    return ctx.UI.LazyColumn(
        {
            onLoad: async () => {
                if (!status) {
                    try { await refreshStatus(); } catch { /* ignore */ }
                }
            },
            fillMaxSize: true,
            padding: { horizontal: 16, vertical: 12 },
            spacing: 10
        },
        [
            // 标题卡
            ctx.UI.Card({ fillMaxWidth: true, shape: { cornerRadius: 12 }, containerColor: "primaryContainer" }, [
                ctx.UI.Column({ padding: 14, spacing: 6 }, [
                    ctx.UI.Row({ verticalAlignment: "center", spacing: 8 }, [
                        ctx.UI.Icon({ name: "cloud", tint: "onPrimaryContainer", size: 22 }),
                        ctx.UI.Text({
                            text: "华为云开发空间",
                            style: "titleMedium",
                            fontWeight: "bold",
                            color: "onPrimaryContainer"
                        })
                    ]),
                    ctx.UI.Text({
                        text: "通过 hdspace CLI 管理开发环境连接",
                        style: "bodySmall",
                        color: "onPrimaryContainer"
                    })
                ])
            ]),

            // 状态卡
            ctx.UI.Card({ fillMaxWidth: true, shape: { cornerRadius: 12 }, containerColor: "surfaceVariant" }, [
                ctx.UI.Column({ padding: 14, spacing: 4 }, [
                    ctx.UI.Row({ horizontalArrangement: "spaceBetween", fillMaxWidth: true }, [
                        ctx.UI.Text({ text: "当前状态", style: "labelLarge", fontWeight: "bold" }),
                        ctx.UI.Text({
                            text: status ? (connected ? "● 已连接" : "○ 未连接") : "…",
                            style: "labelLarge",
                            fontWeight: "bold",
                            color: connected ? "primary" : "onSurfaceVariant"
                        })
                    ]),
                    status ? ctx.UI.Column({ spacing: 2 }, [
                        ctx.UI.Text({ text: `环境: ${status.envName} (${status.envState})`, style: "bodySmall" }),
                        ctx.UI.Text({ text: `隧道: ${status.tunnelAlive ? "运行中" : "停止"} | 端口: ${status.portOpen ? "开放" : "关闭"} | SSH: ${status.sshOk ? "正常" : "未验证"}`, style: "bodySmall" })
                    ]) : ctx.UI.Text({ text: "正在获取状态...", style: "bodySmall", color: "onSurfaceVariant" })
                ])
            ]),

            // 开/关 连接按钮
            ctx.UI.Row({ spacing: 12, fillMaxWidth: true }, [
                ctx.UI.Button(
                    {
                        weight: 1,
                        enabled: !busy,
                        onClick: connectAction,
                        shape: { cornerRadius: 10 }
                    },
                    [ctx.UI.Text({ text: busy ? "处理中..." : "开连接", fontWeight: "bold" })]
                ),
                ctx.UI.Button(
                    {
                        weight: 1,
                        enabled: !busy,
                        onClick: disconnectAction,
                        shape: { cornerRadius: 10 }
                    },
                    [ctx.UI.Text({ text: "关连接", fontWeight: "bold" })]
                )
            ]),

            // 辅助操作行
            ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
                ctx.UI.Button({ weight: 1, enabled: !busy, onClick: statusCheckAction, shape: { cornerRadius: 8 } }, [
                    ctx.UI.Text({ text: "刷新状态", style: "bodySmall" })
                ]),
                ctx.UI.Button({ weight: 1, enabled: !busy, onClick: listEnvAction, shape: { cornerRadius: 8 } }, [
                    ctx.UI.Text({ text: "环境列表", style: "bodySmall" })
                ]),
                ctx.UI.Button({ weight: 1, enabled: !busy, onClick: execProbeAction, shape: { cornerRadius: 8 } }, [
                    ctx.UI.Text({ text: "远程测试", style: "bodySmall" })
                ])
            ]),

            // 凭据配置面板（可折叠）
            ctx.UI.Card({ fillMaxWidth: true, shape: { cornerRadius: 12 }, containerColor: "surface" }, [
                ctx.UI.Column({ padding: { horizontal: 14, vertical: 10 }, spacing: credExpanded ? 10 : 0 }, [
                    ctx.UI.Row({
                        fillMaxWidth: true,
                        horizontalArrangement: "spaceBetween",
                        verticalAlignment: "center",
                        onClick: () => setCredExpanded(!credExpanded)
                    }, [
                        ctx.UI.Row({ verticalAlignment: "center", weight: 1, spacing: 8 }, [
                            ctx.UI.Icon({ name: "key", tint: "primary", size: 20 }),
                            ctx.UI.Text({ text: "AK/SK 凭据配置", style: "titleSmall", fontWeight: "bold" })
                        ]),
                        ctx.UI.Icon({ name: credExpanded ? "expand_less" : "expand_more", tint: "onSurfaceVariant" })
                    ]),
                    ...(credExpanded ? [
                        ctx.UI.Text({
                            text: "更换华为云账号时填写新的 Access Key。保存后自动写入密钥环并验证。",
                            style: "bodySmall",
                            color: "onSurfaceVariant"
                        }),
                        ctx.UI.TextField({
                            value: akValue,
                            onValueChange: setAk,
                            singleLine: true,
                            placeholder: "Access Key ID (AK)",
                            style: { fontSize: 14 }
                        }),
                        ctx.UI.TextField({
                            value: skValue,
                            onValueChange: setSk,
                            singleLine: true,
                            isPassword: true,
                            placeholder: "Secret Access Key (SK)",
                            style: { fontSize: 14 }
                        }),
                        ctx.UI.Button(
                            {
                                fillMaxWidth: true,
                                enabled: !busy,
                                onClick: saveCredAction,
                                shape: { cornerRadius: 8 }
                            },
                            [ctx.UI.Text({ text: busy ? "验证中..." : "保存并验证", fontWeight: "bold" })]
                        )
                    ] : [])
                ])
            ]),

            // 提示信息
            ifMessage(message, ctx, message),

            // 日志输出区
            logText ? ctx.UI.Card({ fillMaxWidth: true, shape: { cornerRadius: 10 }, containerColor: "surface" }, [
                ctx.UI.Column({ padding: 12 }, [
                    ctx.UI.Text({ text: logText, style: "bodySmall", fontFamily: "monospace" })
                ])
            ]) : ctx.UI.Spacer({})
        ]
    );
}

function ifMessage(cond: string, ctx: ComposeDslContext, message: string): ComposeNode {
    if (!cond) return ctx.UI.Spacer({});
    return ctx.UI.Surface({ fillMaxWidth: true, shape: { cornerRadius: 8 }, containerColor: "secondaryContainer" }, [
        ctx.UI.Row({ padding: 10, verticalAlignment: "center", spacing: 8 }, [
            ctx.UI.Icon({ name: "info", size: 16, tint: "onSecondaryContainer" }),
            ctx.UI.Text({ text: message, style: "bodySmall", color: "onSecondaryContainer" })
        ])
    ]);
}