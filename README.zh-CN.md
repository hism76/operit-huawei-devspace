# operit-huawei-devspace

[English](README.md) | 简体中文

Operit 沙盒包：华为云 CodeArts 开发空间（DevSpace）管理工具，基于 `hdspace` CLI 实现。

- **开/关连接**：自动启动环境 → 建立 SSH 端口转发隧道 → 验证 SSH 可达，一条命令完成
- 环境列表与状态查询
- 远程命令执行（SSH，root 身份）
- 在 Operit 终端内打开交互式远程 Shell
- AK/SK 凭据自助配置（写入系统密钥环并自动验证）

提供两种形态：

| 产物 | 说明 |
|---|---|
| `huawei_devspace.toolpkg` | ToolPkg 工具包（含工具箱 UI：开/关连接按钮 + AK/SK 配置面板），**推荐** |
| `huawei_devspace.js` | 普通沙盒包（仅工具，无 UI） |

## 前置要求

1. **华为云开发环境**：在 CodeArts DevSpace 控制台已创建开发环境
2. **访问密钥**：从 [IAM 控制台](https://console.huaweicloud.com/iam/?#/mine/accessKey) 获取 AK/SK
3. **Operit 环境**：
   - 已启用 `super_admin` 包（proot Linux 终端，用于运行 hdspace CLI）
   - Linux 侧已安装 `dbus`、`gnome-keyring`、`python3`、`openssh-client`
     （缺什么装什么：`apt install -y dbus gnome-keyring python3 openssh-client`）

## 首次部署（一次性）

### 1. 放置 hdspace CLI

从华为云官方渠道下载 `hdspace`（ARM64 Linux 静态二进制），放到手机存储：

```
/storage/emulated/0/Download/hdspace
```

包内工具会自动把它复制到 `/root/.local/bin/hdspace` 并赋予执行权限。

### 2. 初始化密钥环环境

在 Operit Linux 终端执行一次（包内所有工具调用前也会自动自愈该环境）：

```bash
bash /sdcard/Download/Operit/dev_package/huawei_devspace/assets/hds-env-setup.sh
# 输出 KEYRING_OK 即可
```

> 原理说明：hdspace 使用 D-Bus Secret Service（gnome-keyring）存储 AK/SK。
> proot 环境默认没有这套服务，本包会在固定地址 `/tmp/hds-dbus.sock` 拉起
> dbus-daemon + gnome-keyring-daemon，并预置无密码的 login 密钥环。

### 3. 配置凭据

任选其一：

- **对话方式**：直接对 AI 说“帮我把华为云的 AK/SK 换成 xxx / yyy”
- **工具箱 UI**：Operit 工具箱 → 「华为云开发空间管理」→ 展开「AK/SK 凭据配置」卡片填写保存
- **终端方式**：
  ```bash
  bash /root/.local/bin/hds-env-setup.sh && \
  python3 /root/.local/bin/hds-config.py '你的AK' '你的SK'
  # 输出 CONFIG_SUCCESS 即成功
  ```

### 4. 安装包

把 `huawei_devspace.toolpkg` 放入 Operit 外部包目录后刷新即可。

## 使用

### 对话调用

| 指令示例 | 工具 |
|---|---|
| “连接华为云开发环境” | `huawei_dev_connect` |
| “断开华为云连接” | `huawei_dev_disconnect` |
| “列出我的开发环境” | `huawei_dev_list` |
| “看看当前连接状态” | `huawei_dev_status` |
| “在云环境里执行 df -h” | `huawei_dev_exec` |
| “帮我把 AK/SK 换成 xxx/yyy” | `huawei_dev_config` |
| “打开云环境的终端” | `huawei_dev_shell` |

### 工具箱 UI

Operit 工具箱 → 「华为云开发空间管理」：

- 大按钮：**开连接 / 关连接**
- 辅助操作：刷新状态、环境列表、远程测试
- 可折叠卡片：**AK/SK 凭据配置**（SK 输入框密码遮盖，保存即自动验证）

## 安全与隐私说明

- **AK/SK 不落盘明文**：仅存于 Linux 密钥环（gnome-keyring 加密存储）；配置脚本通过 argv 传递、pty 自动应答，不写任何文件
- **仓库不含凭据**：源码中无任何硬编码 AK/SK/实例 ID；凭据由使用者自行配置到本地密钥环
- **错误输出脱敏**：配置失败时只输出错误类别（如 `CONFIG_FAILED: failed to configure`），不回显凭据片段
- **隧道仅监听本地**：端口转发绑定 `127.0.0.1:10022`，不对局域网暴露
- **SSH 密钥自愈**：远端公钥失配时调用 hdspace 官方 `ssh-key-reset` 流程重置，不手工搬运私钥

## 开发

目录结构：

```text
src/
├── main.ts / packages/huawei_devspace.ts   # 子包核心逻辑（METADATA + 工具实现）
├── main_toolpkg.ts                          # ToolPkg 注册入口（工具箱 UI 模块）
└── huawei_devspace_setup/index.ui.ts        # Compose DSL 工具箱界面
assets/
├── hds-config.py                            # AK/SK pty 自动应答辅助
└── hds-env-setup.sh                         # dbus+keyring 自愈脚本
dist/                                        # tsc 编译产物
tsconfig.json                                # typeRoots -> ../types（Operit types）
```

构建（TypeScript 5.x，需 `../types` 下有 Operit 类型定义，参考 SandboxPackage_DEV skill）：

```bash
tsc
# 打包 .toolpkg（注意 -X -D：不含目录条目）
mkdir -p pkgroot/dist pkgroot/src
cp manifest.json tsconfig.json pkgroot/
cp dist/main_toolpkg.js pkgroot/dist/main.js
cp -r dist/huawei_devspace_setup dist/packages pkgroot/dist/
cp src/main_toolpkg.ts pkgroot/src/main.ts
cp -r src/huawei_devspace_setup src/packages pkgroot/src/
cd pkgroot && zip -rqX -D ../huawei_devspace.toolpkg .
```

## 许可证

MIT