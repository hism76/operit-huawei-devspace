# operit-huawei-devspace

[English](README.md) | [简体中文](README.zh-CN.md)

Operit sandbox package for managing Huawei Cloud CodeArts DevSpace (dev environments) via the `hdspace` CLI:

- **Connect / disconnect** (auto-start env → SSH port-forward tunnel → verify SSH)
- **Power on / off** any environment without opening a tunnel
- Environment list & status query
- Remote command execution over SSH (auto user probing, auto root enablement)
- Interactive remote shell inside the Operit terminal
- Self-service AK/SK credential setup (stored in the system keyring and verified)

Two flavors are provided:

| Artifact | Description |
|---|---|
| `huawei_devspace.toolpkg` | ToolPkg with toolbox UI (recommended) |
| `huawei_devspace.js` | Plain sandbox package (tools only, no UI) |

## Prerequisites

1. **Huawei Cloud dev environment**: create one in the [CodeArts DevSpace console](https://console.huaweicloud.com/devcloud/)
2. **Access keys**: get AK/SK from the [IAM access key page](https://console.huaweicloud.com/iam/?#/mine/accessKey)
3. **Operit** with:
   - `super_admin` package enabled (proot Linux environment used to run the `hdspace` CLI)
   - Linux-side packages: `dbus`, `gnome-keyring`, `python3`, `openssh-client`
     (install as needed: `apt install -y dbus gnome-keyring python3 openssh-client`)

## One-time setup

### 1. Place the hdspace CLI

Download `hdspace` (ARM64 Linux static binary) from official Huawei Cloud channels and put it at:

```
/storage/emulated/0/Download/hdspace
```

The package tools copy it to `/root/.local/bin/hdspace` and chmod it automatically.

### 2. Initialize the keyring environment (optional sanity check)

Run once in the Operit Linux terminal (the package tools do this automatically on every call):

```bash
bash /sdcard/Download/Operit/dev_package/huawei_devspace/assets/hds-env-setup.sh
# KEYRING_OK means ready
```

> `hdspace` stores AK/SK in the D-Bus Secret Service (gnome-keyring).
> proot has no such services by default; this package starts `dbus-daemon` + `gnome-keyring-daemon`
> on a fixed socket `/tmp/hds-dbus.sock` with a passwordless login keyring, and self-heals it before every tool call.

### 3. Install the package

Put `huawei_devspace.toolpkg` into Operit's external packages directory and refresh,
or use the debug-install tool inside Operit.

## Usage

### Via chat commands

| Example instruction | Tool |
|---|---|
| "连接华为云开发环境" | `huawei_dev_connect` |
| "断开华为云连接" | `huawei_dev_disconnect` |
| "列出我的开发环境" | `huawei_dev_list` |
| "看看当前连接状态" | `huawei_dev_status` |
| "把 2 号环境开机" | `huawei_dev_power` (`action=start`, `num=2`) |
| "关掉当前环境" | `huawei_dev_power` (`action=stop`) |
| "在云环境里执行 df -h" | `huawei_dev_exec` |
| "上传 xxx 到云环境 /tmp/" | `huawei_dev_upload` |
| "下载云环境的 ~/a.log" | `huawei_dev_download` |
| "隧道又掉了？看看日志" | `huawei_dev_logs` |
| "把远端 8080 转发到本地" | `huawei_dev_forward` |
| "帮我把 AK/SK 换成 xxx/yyy" | `huawei_dev_config` |
| "打开云环境的终端" | `huawei_dev_shell` |
| "给环境启用 root SSH" | `huawei_dev_enable_root` |

### Multi-env parallel tunnels

Each environment gets its own local port from a pool (10022-10079), fully isolated:

- Tap the inline 🔗 icon on any list row to connect/disconnect that env; keep multiple tunnels alive simultaneously
- `huawei_dev_keepalive` patrols **all** registered envs and self-heals zombie tunnels (recommended: scheduled task every 5 min)
- `disconnect` accepts id/num to tear down a single tunnel; omit to kill all

### Toolbox UI

Operit Toolbox → 「华为云开发空间管理」:

- Action row: **连接** (selected env) / **断开** (selected env) / **保活** (patrol all)
- Power row: **开机 / 关机 / 刷新**
- Env list card: state dots + inline 🔗 toggle per row + header ⟳ refresh and 🔗‍💨 disconnect-all
- Connected envs show port & login user; utility row: **测试 / root**

### Manual credential rotation (terminal)

```bash
bash /root/.local/bin/hds-env-setup.sh && \
python3 /root/.local/bin/hds-config.py 'YOUR_AK' 'YOUR_SK'
# CONFIG_SUCCESS means done
```

## Security & privacy notes

- **No plaintext AK/SK on disk**: credentials live only in the Linux keyring (gnome-keyring); the helper script passes them via argv through pty, writing nothing to files
- **No credentials in repo**: source contains zero hardcoded AK/SK or instance IDs; users configure their own locally
- **Sanitized error output**: config failure prints only an error category (e.g. `CONFIG_FAILED: failed to configure`), never echoing credential fragments
- **Local-only tunnel**: port forward binds `127.0.0.1:10022`, not exposed to LAN
- **SSH key self-heal**: on publickey mismatch the official hdspace `ssh-key-reset` flow is used

## Development

Layout:

```text
src/
├── main.ts                                  # ToolPkg entry: registers the toolbox UI module
├── packages/huawei_devspace.ts              # subpackage core (METADATA + tool implementations)
└── huawei_devspace_setup/index.ui.ts        # Compose DSL toolbox UI
assets/
├── hds-config.py                            # AK/SK pty auto-answer helper
└── hds-env-setup.sh                         # dbus+keyring self-healing script
dist/                                        # tsc output
tsconfig.json                                # typeRoots -> ../types (Operit types)
```

Build with TypeScript 5.x (requires Operit types at `../types`, see SandboxPackage_DEV skill):

```bash
tsc
# pack .toolpkg (-X -D: no directory entries)
mkdir -p pkgroot/dist pkgroot/src
cp manifest.json tsconfig.json pkgroot/
cp dist/main.js pkgroot/dist/main.js
cp -r dist/huawei_devspace_setup dist/packages pkgroot/dist/
cp src/main.ts pkgroot/src/main.ts
cp -r src/huawei_devspace_setup src/packages pkgroot/src/
cd pkgroot && zip -rqX -D ../huawei_devspace.toolpkg .
```

## License

MIT