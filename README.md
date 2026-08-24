# operit-huawei-devspace

English | [简体中文](README.zh-CN.md)

Operit sandbox package: Huawei Cloud DevSpace (dev environment) management via hdspace CLI.

- **Connect / Disconnect** (auto env start -> SSH port-forward tunnel -> SSH verify)
- Env list & status
- Remote command execution (SSH as root)
- Interactive remote shell inside Operit terminal
- Self-service AK/SK credential config (stored in system keyring, auto-verified)

Two artifacts:

| Artifact | Description |
|---|---|
| `huawei_devspace.toolpkg` | ToolPkg bundle with toolbox UI (connect/disconnect buttons + AK/SK panel). **Recommended.** |
| `huawei_devspace.js` | Plain sandbox package (tools only, no UI) |

## Requirements

1. A Huawei Cloud dev environment (CodeArts DevSpace)
2. Access Key from [IAM console](https://console.huaweicloud.com/iam/?#/mine/accessKey)
3. Operit with the `super_admin` package (proot Linux terminal), plus Linux packages: `dbus`, `gnome-keyring`, `python3`, `openssh-client`
   (`apt install -y dbus gnome-keyring python3 openssh-client`)

## First-time setup

### 1. Place hdspace CLI

Download `hdspace` (ARM64 Linux static binary) from official Huawei Cloud channel and put it at:

```
/storage/emulated/0/Download/hdspace
```

The package copies it to `/root/.local/bin/hdspace` and chmods automatically.

### 2. Initialize keyring environment (one-time)

Run once in Operit Linux terminal (package tools also self-heal this automatically):

```bash
bash /sdcard/Download/Operit/dev_package/huawei_devspace/assets/hds-env-setup.sh
# expect KEYRING_OK
```

> hdspace stores AK/SK in D-Bus Secret Service (gnome-keyring).
> proot lacks this by default; this package starts dbus-daemon + gnome-keyring-daemon on a fixed address `/tmp/hds-dbus.sock` and provisions a passwordless login keyring.

### 3. Configure credentials

Any of:

- **Chat**: just tell the AI "change my Huawei AK/SK to xxx / yyy"
- **Toolbox UI**: Operit toolbox -> "华为云开发空间管理" -> expand the AK/SK card, fill and save
- **Terminal**:
  ```bash
  bash /root/.local/bin/hds-env-setup.sh && \
  python3 /root/.local/bin/hds-config.py 'YOUR_AK' 'YOUR_SK'
  # CONFIG_SUCCESS means done
  ```

### 4. Install the package

Put `huawei_devspace.toolpkg` into Operit external packages directory and refresh.

## Usage

### Chat tools

| Example instruction | Tool |
|---|---|
| connect to my dev env | `huawei_dev_connect` |
| disconnect | `huawei_dev_disconnect` |
| list environments | `huawei_dev_list` |
| connection status | `huawei_dev_status` |
| run df -h on the cloud env | `huawei_dev_exec` |
| change AK/SK to xxx/yyy | `huawei_dev_config` |
| open cloud shell | `huawei_dev_shell` |

### Toolbox UI

Operit toolbox -> "华为云开发空间管理":

- Big buttons: **Connect / Disconnect**
- Helpers: refresh status / env list / remote test
- Collapsible card: **AK/SK credential config** (SK masked, save-and-verify)

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
├── main.ts / packages/huawei_devspace.ts   # subpackage core (METADATA + tools)
├── main_toolpkg.ts                          # ToolPkg registration entry (toolbox UI)
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
cp dist/main_toolpkg.js pkgroot/dist/main.js
cp -r dist/huawei_devspace_setup dist/packages pkgroot/dist/
cp src/main_toolpkg.ts pkgroot/src/main.ts
cp -r src/huawei_devspace_setup src/packages pkgroot/src/
cd pkgroot && zip -rqX -D ../huawei_devspace.toolpkg .
```

## License

MIT