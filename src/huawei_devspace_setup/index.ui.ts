const PACKAGE_NAME = "huawei_devspace";

type StatusInfo = {
    connected: boolean;
    tunnelAlive: boolean;
    tunnelTarget: string;
    portOpen: boolean;
    sshOk: boolean;
    user: string;
    envState: string;
    envName: string;
    envId: string;
    envType: string;
    port: number;
    connections: ConnInfo[];
};

type ConnInfo = {
    envId: string;
    envName: string;
    port: number;
    tunnelAlive: boolean;
    portOpen: boolean;
    sshOk: boolean;
    user: string;
};

type EnvItem = {
    num: string;
    id: string;
    name: string;
    state: string;
    type: string;
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

function envTypeIcon(type: string): string {
    const t = type.toLowerCase();
    if (t === "vm") return "memory";
    if (t === "desktop") return "desktop_windows";
    return "dns";
}

function stateHex(state: string): string {
    const s = state.toLowerCase();
    if (s === "running") return "#4CAF50";      // green
    if (s === "starting" || s === "stopping") return "#FF9800"; // orange
    return "#9E9E9E";                            // grey (ready/others)
}

function stateLabel(state: string): string {
    const s = state.toLowerCase();
    if (s === "running") return "运行中";
    if (s === "starting") return "启动中";
    if (s === "stopping") return "停止中";
    return "已就绪";
}

export default function Screen(ctx: ComposeDslContext): ComposeNode {
    const busyState = ctx.useState<boolean>("busy", false);
    const busy = busyState[0];
    const setBusy = busyState[1];

    const statusState = ctx.useState<StatusInfo | null>("status", null);
    const status = statusState[0];
    const setStatus = statusState[1];

    const msgState = ctx.useState<string>("msg", "");
    const message = msgState[0];
    const setMessage = msgState[1];

    const logState = ctx.useState<string>("log", "");
    const logText = logState[0];
    const setLog = logState[1];

    const envsState = ctx.useState<EnvItem[]>("envs", []);
    const envs = envsState[0];
    const setEnvs = envsState[1];

    const selectedIdState = ctx.useState<string>("selectedId", "");
    const selectedId = selectedIdState[0];
    const setSelectedId = selectedIdState[1];

    const configExpandedState = ctx.useState<boolean>("configExpanded", false);
    const configExpanded = configExpandedState[0];
    const setConfigExpanded = configExpandedState[1];
    const akInputState = ctx.useState<string>("akInput", "");
    const akInput = akInputState[0];
    const setAkInput = akInputState[1];
    const skInputState = ctx.useState<string>("skInput", "");
    const skInput = skInputState[0];
    const setSkInput = skInputState[1];

    async function callPackageTool(toolName: string, params: Record<string, unknown>): Promise<unknown> {
        try {
            return await ctx.callTool(`${PACKAGE_NAME}:${toolName}`, params);
        } catch (e) {
            throw new Error(asText((e as Error).message) || `tool call failed: ${toolName}`);
        }
    }

    const runAction = (title: string, action: () => Promise<unknown>, opts?: { readOnly?: boolean }) => {
        const readOnly = !!(opts && opts.readOnly);
        return async (): Promise<void> => {
            if (busy && !readOnly) return;
            if (!readOnly) setBusy(true);
            setMessage(`${title}中...`);
            try {
                await action();
                setMessage(`${title}完成`);
            } catch (e) {
                const errText = asText((e as Error).message) || "未知错误";
                const short = errText.length > 60 ? errText.slice(0, 60) + "…" : errText;
                setMessage(`${title}失败 · ${short}`);
                setLog(errText);
            } finally {
                if (!readOnly) setBusy(false);
            }
        };
    };

    const refreshStatus = async (force?: boolean): Promise<void> => {
        const result = parseRecord(await callPackageTool("huawei_dev_status", { refresh: force !== false }));
        const conns: ConnInfo[] = Array.isArray(result.connections)
            ? (result.connections as any[]).map((c: any) => ({
                envId: asText(c.envId),
                envName: asText(c.envName),
                port: Number(c.port) || 0,
                tunnelAlive: !!c.tunnelAlive,
                portOpen: !!c.portOpen,
                sshOk: !!c.sshOk,
                user: asText(c.user)
            }))
            : [];
        const info: StatusInfo = {
            connected: !!result.connected,
            tunnelAlive: !!result.tunnelAlive,
            tunnelTarget: asText(result.tunnelTarget),
            portOpen: !!result.portOpen,
            sshOk: !!result.sshOk,
            user: asText(result.user),
            envState: asText(result.envState),
            envName: asText(result.envName),
            envId: asText(result.envId),
            envType: asText(result.envType),
            port: Number(result.port) || 0,
            connections: conns
        };
        setStatus(info);
    };

    const loadEnvs = async (): Promise<void> => {
        const result = parseRecord(await callPackageTool("huawei_dev_list", {}));
        const list: EnvItem[] = Array.isArray(result.envs)
            ? (result.envs as any[]).map((e: any) => ({
                num: asText(e.num),
                id: asText(e.id),
                name: asText(e.name),
                state: asText(e.state),
                type: asText(e.type)
            }))
            : [];
        setEnvs(list);
        if (!selectedId && status?.envId) {
            for (const item of list) {
                if (item.id === status.envId) {
                    setSelectedId(item.id);
                    break;
                }
            }
        }
    };

    const connectToSelected = runAction("连接", async () => {
        if (!selectedId) throw new Error("请先在列表中选择一个环境");
        await callPackageTool("huawei_dev_connect", { id: selectedId });
        await refreshAllSilent();
        ctx.showToast("连接已建立");
    });

    const disconnectAction = runAction("断开当前", async () => {
        const targetDisconnectId = selectedId || currentTargetId || undefined;
        await callPackageTool("huawei_dev_disconnect", { stop_env: false, id: targetDisconnectId });
        await refreshAllSilent();
        ctx.showToast("已断开，环境保持运行");
    });

    const disconnectAllAction = runAction("全部断开", async () => {
        await callPackageTool("huawei_dev_disconnect", { stop_env: false });
        await refreshAllSilent();
        ctx.showToast("已断开所有隧道");
    });

    /** 按环境直连/断开（列表行内按钮用） */
    const connectEnv = (envId: string) => runAction("连接", async () => {
        await callPackageTool("huawei_dev_connect", { id: envId });
        await refreshAllSilent();
        ctx.showToast("连接已建立");
    })();

    const disconnectEnv = (envId: string) => runAction("断开", async () => {
        await callPackageTool("huawei_dev_disconnect", { stop_env: false, id: envId });
        await refreshAllSilent();
        ctx.showToast("已断开该隧道");
    })();

    const keepaliveAllAction = runAction("全部保活", async () => {
        const result = parseRecord(await callPackageTool("huawei_dev_keepalive", {}));
        await refreshAllSilent();
        const checked = Number(result.checked) || 0;
        if (result.success) {
            setLog(`✓ 保活完成 · 检查 ${checked} 个连接`);
            ctx.showToast(`保活完成 (${checked})`);
        } else {
            throw new Error(`保活部分失败：${asText(result.steps && (result.steps as string[]).slice(-2).join(" | "))}`);
        }
    }, { readOnly: true });

    const powerOnAction = runAction("开机", async () => {
        if (!selectedId) throw new Error("请先选择环境");
        await callPackageTool("huawei_dev_power", { action: "start", id: selectedId });
        await refreshAllSilent();
        ctx.showToast("已开机 (Running)");
    });

    const shutdownAction = runAction("关机", async () => {
        if (!selectedId) throw new Error("请先选择环境");
        const result = parseRecord(await callPackageTool("huawei_dev_power", { action: "stop", id: selectedId }));
        const finalState = asText(result.finalState);
        setEnvs(envs.map((e: EnvItem) => e.id === selectedId ? Object.assign({}, e, { state: finalState }) : e));
        await refreshAllSilent();
        ctx.showToast(`已关机 (${finalState})`);
    });

    const refreshAllSilent = async (): Promise<void> => {
        try {
            const listResult = parseRecord(await callPackageTool("huawei_dev_list", {}));
            if (Array.isArray(listResult.envs)) {
                setEnvs((listResult.envs as any[]).map((e: any) => ({
                    num: asText(e.num),
                    id: asText(e.id),
                    name: asText(e.name),
                    state: asText(e.state),
                    type: asText(e.type)
                })));
            }
            await refreshStatus();
        } catch { /* ignore */ }
    };

    const refreshAllAction = runAction("刷新", async () => {
        await loadEnvs();
        await refreshStatus();
    }, { readOnly: true });

    const statusOnlyAction = runAction("状态", async () => {
        await refreshStatus();
    }, { readOnly: true });

    const execProbeAction = runAction("远程测试", async () => {
        const result = parseRecord(await callPackageTool("huawei_dev_exec", {
            command: "echo __UI_PROBE_OK__ && whoami"
        }));
        const lines = asText(result.output).trim().split("\n");
        const ok = lines.some(l => l.indexOf("__UI_PROBE_OK__") >= 0);
        if (ok) {
            const whoamiLine = lines.filter(l => l.indexOf("__UI_PROBE_OK__") < 0).pop() || "";
            setLog(`✓ 执行正常 · 用户 ${asText(result.user)} · 输出: ${whoamiLine}`);
        } else {
            setLog(`✗ 异常: ${asText(result.output).slice(-200)}`);
        }
    });

    const enableRootAction = runAction("启用root", async () => {
        const result = parseRecord(await callPackageTool("huawei_dev_enable_root", {}));
        if (result.success) {
            await refreshStatus();
            ctx.showToast("root SSH 已启用");
        } else {
            throw new Error(asText(result.steps && (result.steps as string[]).slice(-2).join(" | ")) || "启用失败");
        }
    });

    const saveConfigAction = runAction("保存凭据", async () => {
        if (!akInput || !skInput) throw new Error("请填写 AK 和 SK");
        const result = parseRecord(await callPackageTool("huawei_dev_config", { ak: akInput, sk: skInput }));
        if (result.success) {
            setSkInput("");
            ctx.showToast("AK/SK 已保存并验证通过");
            setLog(`✓ 凭据已更新 · 存于密钥环`);
        } else {
            throw new Error(asText(result.failReason) || asText(result.error) || "配置失败");
        }
    });

    const connected = !!(status && status.connected);
    const currentTargetId = status?.envId || "";
    const hasSelection = !!selectedId;

    // ===== 环境条目构建 =====
    const connMap: Record<string, ConnInfo> = {};
    for (const c of (status?.connections || [])) {
        connMap[c.envId] = c;
    }
    const envItems: ComposeNode[] = [];
    if (envs.length > 0) {
        for (let i = 0; i < envs.length; i += 1) {
            const env = envs[i];
            const isSelected = selectedId === env.id;
            const isDesktop = env.type.toLowerCase() === "desktop";
            const conn = connMap[env.id];
            const isTunneled = !!(conn && conn.tunnelAlive);
            const isSshOk = !!(conn && conn.sshOk);
            envItems.push(
                ctx.UI.Surface(
                    {
                        fillMaxWidth: true,
                        shape: { cornerRadius: 10 },
                        containerColor: isSelected ? "#E3F2FD" : "surfaceVariant",
                        alpha: isSelected ? 1 : 0.6,
                        onClick: () => setSelectedId(env.id),
                        contentPadding: 0
                    } as any,
                    [
                        ctx.UI.Row(
                            {
                                padding: { horizontal: 12, vertical: 10 },
                                fillMaxWidth: true,
                                verticalAlignment: "center",
                                spacing: 10
                            },
                            [
                                // 状态指示灯
                                ctx.UI.Box({ width: 10, height: 40 }, [
                                    ctx.UI.Surface(
                                        { width: 8, height: 8, shape: { type: "circle" }, containerColor: stateHex(env.state) },
                                        []
                                    )
                                ]),
                                // 图标
                                ctx.UI.Icon({ name: envTypeIcon(env.type), tint: isSelected ? "#1565C0" : "onSurfaceVariant", size: 20 }),
                                // 名称+类型
                                ctx.UI.Column({ weight: 1, spacing: 1 }, [
                                    ctx.UI.Row({ verticalAlignment: "center", spacing: 6 }, [
                                        ctx.UI.Text({
                                            text: env.name,
                                            style: "bodyMedium",
                                            fontWeight: "bold",
                                            color: isSelected ? "#1565C0" : "onSurface"
                                        }),
                                        ...(isSshOk ? [ctx.UI.Text({ text: `已连接:${conn!.port}`, style: "labelSmall", color: "#4CAF50", fontWeight: "bold" })] : []),
                                        ...(isTunneled && !isSshOk ? [ctx.UI.Text({ text: `隧道中:${conn!.port}`, style: "labelSmall", color: "#FF9800", fontWeight: "bold" })] : []),
                                        ...(isDesktop ? [ctx.UI.Text({ text: "暂不支持", style: "labelSmall", color: "#FF9800" })] : [])
                                    ]),
                                    ctx.UI.Text({
                                        text: `${env.type} · ${stateLabel(env.state)}${isSshOk && conn!.user ? ` · ${conn!.user}` : ""}`,
                                        style: "bodySmall",
                                        color: stateHex(env.state)
                                    })
                                ]),
                                // 行内连接/断开快捷按钮
                                ...(!isDesktop ? [
                                    isTunneled
                                        ? ctx.UI.IconButton({ icon: "link_off", enabled: true, onClick: () => disconnectEnv(env.id) })
                                        : ctx.UI.IconButton({ icon: "link", enabled: true, onClick: () => connectEnv(env.id) })
                                ] : [])
                            ]
                        )
                    ]
                )
            );
            if (i < envs.length - 1) {
                envItems.push(ctx.UI.Spacer({ height: 6 }));
            }
        }
    }

    return ctx.UI.LazyColumn(
        {
            onLoad: async () => {
                if (!status) {
                    try {
                        const listResult = parseRecord(await callPackageTool("huawei_dev_list", {}));
                        const list: EnvItem[] = Array.isArray(listResult.envs)
                            ? (listResult.envs as any[]).map((e: any) => ({
                                num: asText(e.num),
                                id: asText(e.id),
                                name: asText(e.name),
                                state: asText(e.state),
                                type: asText(e.type)
                            }))
                            : [];
                        setEnvs(list);
                        await refreshStatus();
                    } catch { /* ignore */ }
                }
            },
            fillMaxSize: true,
            padding: { horizontal: 14, vertical: 10 },
            spacing: 8
        },
        [
            // ===== 顶部：标题 + 连接状态徽章 =====
            (() => {
                const conns = status?.connections || [];
                const activeCount = conns.filter(c => c.tunnelAlive).length;
                const sshCount = conns.filter(c => c.sshOk).length;
                const subtitle = !status
                    ? "加载中..."
                    : sshCount > 0
                        ? `${sshCount} 个环境已连接 · ${activeCount} 条隧道活跃`
                        : (status.envState === "Running" ? "环境运行中 · 未建立隧道" : (status.envState ? "未连接" : "加载中..."));
                return ctx.UI.Row(
                    { fillMaxWidth: true, verticalAlignment: "center", padding: 2 },
                    [
                        ctx.UI.Icon({ name: sshCount > 0 ? "cloud_done" : "cloud_off", tint: sshCount > 0 ? "#4CAF50" : "onSurfaceVariant", size: 24 }),
                        ctx.UI.Spacer({ width: 8 }),
                        ctx.UI.Column({ weight: 1, spacing: 0 }, [
                            ctx.UI.Row({ verticalAlignment: "center", spacing: 6 }, [
                                ctx.UI.Text({ text: "华为云开发空间", style: "titleMedium", fontWeight: "bold" }),
                                ctx.UI.Text({ text: "v0.2.5", style: "labelSmall", color: "onSurfaceVariant" })
                            ]),
                            ctx.UI.Text(
                                {
                                    text: subtitle,
                                    style: "labelMedium",
                                    color: sshCount > 0 ? "#4CAF50" : "onSurfaceVariant"
                                }
                            )
                        ]),
                        ...(busy ? [ctx.UI.CircularProgressIndicator({ strokeWidth: 2.5, color: "#1565C0" })] : [])
                    ]
                );
            })(),

            // ===== 当前目标信息条 =====
            status ? ctx.UI.Surface(
                {
                    fillMaxWidth: true,
                    shape: { cornerRadius: 10 },
                    containerColor: "surfaceVariant",
                    alpha: 0.7
                },
                [
                    ctx.UI.Row(
                        { padding: { horizontal: 12, vertical: 8 }, fillMaxWidth: true, verticalAlignment: "center" },
                        [
                            ctx.UI.Icon({ name: envTypeIcon(status.envType), size: 16, tint: "primary" }),
                            ctx.UI.Spacer({ width: 8 }),
                            ctx.UI.Text({
                                text: `${status.envName} [${status.envType}]`,
                                style: "labelLarge",
                                fontWeight: "bold"
                            }),
                            ctx.UI.Spacer({ width: 8 }),
                            ctx.UI.Text({ text: stateLabel(status.envState), style: "labelMedium", color: stateHex(status.envState), fontWeight: "bold" }),
                            ctx.UI.Spacer({}),
                            ...(status.sshOk ? [ctx.UI.Icon({ name: "check_circle", size: 16, tint: "#4CAF50" }), ctx.UI.Spacer({ width: 4 }), ctx.UI.Text({ text: `SSH ${status.user}`, style: "labelSmall", color: "#4CAF50" })] : []),
                            ...(status.portOpen ? [ctx.UI.Icon({ name: "swap_horiz", size: 16, tint: "#FF9800" }), ctx.UI.Text({ text: ":10022", style: "labelSmall", color: "#FF9800" })] : [])
                        ]
                    )
                ]
            ) : ctx.UI.Spacer({}),

            // ===== 操作按钮区 =====
            ctx.UI.Row({ spacing: 8, fillMaxWidth: true, verticalAlignment: "center" }, [
                ctx.UI.Button(
                    {
                        weight: 1,
                        enabled: !busy && hasSelection,
                        onClick: connectToSelected,
                        shape: { cornerRadius: 12 }
                    },
                    [
                        ctx.UI.Row({ verticalAlignment: "center", horizontalArrangement: "center", spacing: 5 }, [
                            ctx.UI.Icon({ name: "link", size: 16 }),
                            ctx.UI.Text({ text: busy ? "处理中" : "连接", fontWeight: "bold" })
                        ])
                    ]
                ),
                ctx.UI.FilledTonalButton(
                    {
                        weight: 1,
                        enabled: !busy && (hasSelection || connected),
                        onClick: disconnectAction,
                        shape: { cornerRadius: 12 }
                    },
                    [
                        ctx.UI.Row({ verticalAlignment: "center", horizontalArrangement: "center", spacing: 5 }, [
                            ctx.UI.Icon({ name: "link_off", size: 16 }),
                            ctx.UI.Text({ text: "断开" })
                        ])
                    ]
                ),
                ctx.UI.FilledTonalButton(
                    {
                        weight: 1,
                        enabled: true,
                        onClick: keepaliveAllAction,
                        shape: { cornerRadius: 12 }
                    },
                    [
                        ctx.UI.Row({ verticalAlignment: "center", horizontalArrangement: "center", spacing: 5 }, [
                            ctx.UI.Icon({ name: "autorenew", size: 16 }),
                            ctx.UI.Text({ text: "保活" })
                        ])
                    ]
                )
            ]),

            // ===== 电源操作行 =====
            ctx.UI.Row({ spacing: 8, fillMaxWidth: true, verticalAlignment: "center" }, [
                ctx.UI.FilledTonalButton(
                    {
                        weight: 1,
                        enabled: !busy && !!selectedId,
                        onClick: powerOnAction,
                        shape: { cornerRadius: 12 },
                        containerColor: "#E8F5E9"
                    },
                    [
                        ctx.UI.Row({ verticalAlignment: "center", horizontalArrangement: "center", spacing: 5 }, [
                            ctx.UI.Icon({ name: "power_settings_new", size: 16, tint: "#2E7D32" }),
                            ctx.UI.Text({ text: "开机", color: "#2E7D32" })
                        ])
                    ]
                ),
                ctx.UI.FilledTonalButton(
                    {
                        weight: 1,
                        enabled: !busy && !!selectedId,
                        onClick: shutdownAction,
                        shape: { cornerRadius: 12 },
                        containerColor: "#FFEBEE"
                    },
                    [
                        ctx.UI.Row({ verticalAlignment: "center", horizontalArrangement: "center", spacing: 5 }, [
                            ctx.UI.Icon({ name: "power_settings_new", size: 16, tint: "#C62828" }),
                            ctx.UI.Text({ text: "关机", color: "#C62828" })
                        ])
                    ]
                ),
                ctx.UI.FilledTonalButton(
                    {
                        weight: 1,
                        enabled: true,
                        onClick: refreshAllAction,
                        shape: { cornerRadius: 12 }
                    },
                    [
                        ctx.UI.Row({ verticalAlignment: "center", horizontalArrangement: "center", spacing: 5 }, [
                            ctx.UI.Icon({ name: "sync", size: 16 }),
                            ctx.UI.Text({ text: "刷新" })
                        ])
                    ]
                )
            ]),

            // ===== 环境列表卡片 =====
            ctx.UI.Card(
                {
                    fillMaxWidth: true,
                    shape: { cornerRadius: 12 },
                    containerColor: "surface",
                    elevation: 1,
                    border: { width: 0.7, color: "outlineVariant", alpha: 0.4 }
                },
                [
                    ctx.UI.Column({ padding: { horizontal: 10, vertical: 8 }, spacing: 4 }, [
                        ctx.UI.Row({ fillMaxWidth: true, horizontalArrangement: "spaceBetween", verticalAlignment: "center" }, [
                            ctx.UI.Row({ verticalAlignment: "center", spacing: 6 }, [
                                ctx.UI.Icon({ name: "dns", tint: "primary", size: 16 }),
                                ctx.UI.Text({ text: "开发环境", style: "labelLarge", fontWeight: "bold" }),
                                ...(envs.length > 0 ? [ctx.UI.Text({ text: `${envs.length}`, style: "labelSmall", color: "onSurfaceVariant" })] : [])
                            ]),
                            ctx.UI.Row({ verticalAlignment: "center", spacing: 2 }, [
                                ctx.UI.IconButton({ icon: "link_off", enabled: true, onClick: disconnectAllAction }),
                                ctx.UI.IconButton({ icon: "refresh", enabled: !busy, onClick: refreshAllAction })
                            ])
                        ]),
                        ...(envItems.length > 0 ? envItems : [
                            ctx.UI.Column({ padding: { horizontal: 12, vertical: 16 }, horizontalAlignment: "center", spacing: 6 }, [
                                ctx.UI.Icon({ name: "cloud_queue", size: 28, tint: "onSurfaceVariant" }),
                                ctx.UI.Text({
                                    text: busy ? "正在加载环境列表…" : "暂无数据 · 点右上角 ⟳ 拉取列表",
                                    style: "bodySmall",
                                    color: "onSurfaceVariant"
                                })
                            ])
                        ])
                    ])
                ]
            ),

            // ===== 工具行 =====
            ctx.UI.Row({ spacing: 8, fillMaxWidth: true, verticalAlignment: "center" }, [
                ctx.UI.FilledTonalButton({ weight: 1, enabled: !busy && connected, onClick: execProbeAction, shape: { cornerRadius: 12 } }, [
                    ctx.UI.Row({ verticalAlignment: "center", horizontalArrangement: "center", spacing: 5 }, [
                        ctx.UI.Icon({ name: "terminal", size: 16 }),
                        ctx.UI.Text({ text: "测试" })
                    ])
                ]),
                ctx.UI.FilledTonalButton({ weight: 1, enabled: !busy && connected, onClick: enableRootAction, shape: { cornerRadius: 12 } }, [
                    ctx.UI.Row({ verticalAlignment: "center", horizontalArrangement: "center", spacing: 5 }, [
                        ctx.UI.Icon({ name: "admin_panel_settings", size: 16 }),
                        ctx.UI.Text({ text: "root" })
                    ])
                ])
            ]),

            // ===== AK/SK 凭据配置面板（可折叠） =====
            configExpanded ? ctx.UI.Card(
                {
                    fillMaxWidth: true,
                    shape: { cornerRadius: 12 },
                    containerColor: "surface",
                    elevation: 1,
                    border: { width: 0.7, color: "outlineVariant", alpha: 0.4 }
                },
                [
                    ctx.UI.Column({ padding: { horizontal: 10, vertical: 8 }, spacing: 8 }, [
                        ctx.UI.Row({ verticalAlignment: "center", spacing: 6 }, [
                            ctx.UI.Icon({ name: "key", tint: "primary", size: 16 }),
                            ctx.UI.Text({ text: "AK/SK 凭据配置", style: "labelLarge", fontWeight: "bold" }),
                            ctx.UI.Spacer({})
                        ]),
                        ctx.UI.TextField({
                            label: "Access Key ID",
                            placeholder: "输入 AK",
                            value: akInput,
                            onValueChange: (v) => setAkInput(v),
                            singleLine: true
                        } as any),
                        ctx.UI.TextField({
                            label: "Secret Access Key",
                            placeholder: "输入 SK",
                            value: skInput,
                            onValueChange: (v) => setSkInput(v),
                            singleLine: true,
                            isPassword: true
                        } as any),
                        ctx.UI.Row({ spacing: 8, fillMaxWidth: true, verticalAlignment: "center" }, [
                            ctx.UI.Button({
                                weight: 1,
                                enabled: !busy && !!akInput && !!skInput,
                                onClick: saveConfigAction,
                                shape: { cornerRadius: 10 }
                            }, [ctx.UI.Text({ text: busy ? "验证中…" : "保存并验证", fontWeight: "bold" })])
                        ]),
                        ctx.UI.Text({
                            text: "凭据仅存于 Linux 密钥环，不落盘明文",
                            style: "labelSmall",
                            color: "onSurfaceVariant"
                        })
                    ])
                ]
            ) : ctx.UI.Spacer({}),

            // ===== 展开配置入口 =====
            !configExpanded ? ctx.UI.Row({ fillMaxWidth: true, horizontalArrangement: "center" }, [
                ctx.UI.FilledTonalButton({
                    enabled: !busy,
                    onClick: () => setConfigExpanded(true),
                    shape: { cornerRadius: 10 }
                }, [
                    ctx.UI.Row({ verticalAlignment: "center", spacing: 5 }, [
                        ctx.UI.Icon({ name: "key", size: 15 }),
                        ctx.UI.Text({ text: "凭据配置", style: "labelLarge" })
                    ])
                ])
            ]) : ctx.UI.Row({ fillMaxWidth: true, horizontalArrangement: "center" }, [
                ctx.UI.FilledTonalButton({
                    enabled: !busy,
                    onClick: () => { setConfigExpanded(false); setSkInput(""); },
                    shape: { cornerRadius: 10 }
                }, [
                    ctx.UI.Row({ verticalAlignment: "center", spacing: 5 }, [
                        ctx.UI.Icon({ name: "expand_less", size: 15 }),
                        ctx.UI.Text({ text: "收起配置", style: "labelLarge" })
                    ])
                ])
            ]),

            // ===== 提示条 =====
            message ? ctx.UI.Surface(
                {
                    fillMaxWidth: true,
                    shape: { cornerRadius: 8 },
                    containerColor: message.indexOf("失败") >= 0 ? "#FFEBEE" : "secondaryContainer"
                },
                [
                    ctx.UI.Row({ padding: { horizontal: 10, vertical: 8 }, verticalAlignment: "center", spacing: 6 }, [
                        ctx.UI.Icon({
                            name: message.indexOf("失败") >= 0 ? "error_outline" : "info_outline",
                            size: 15,
                            tint: message.indexOf("失败") >= 0 ? "#D32F2F" : "onSecondaryContainer"
                        }),
                        ctx.UI.Text({
                            text: message,
                            style: "bodySmall",
                            color: message.indexOf("失败") >= 0 ? "#D32F2F" : "onSecondaryContainer",
                            maxLines: 2
                        })
                    ])
                ]
            ) : ctx.UI.Spacer({}),

            // ===== 日志 =====
            logText ? ctx.UI.Surface(
                {
                    fillMaxWidth: true,
                    shape: { cornerRadius: 8 },
                    containerColor: "#263238"
                },
                [
                    ctx.UI.Column({ padding: 10 }, [
                        ctx.UI.Text({ text: logText, style: "bodySmall", color: "#A5D6A7", fontFamily: "monospace" })
                    ])
                ]
            ) : ctx.UI.Spacer({})
        ]
    );
}
