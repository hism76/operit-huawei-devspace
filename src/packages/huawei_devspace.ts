// @ts-nocheck
/*
METADATA
{
    "name": "huawei_devspace",
    "display_name": {
        "zh": "华为云开发空间",
        "en": "Huawei DevSpace"
    },
    "description": {
        "zh": "华为云开发环境管理：开/关连接、自由切换容器/虚拟机、列表、状态、远程执行、enable_root。",
        "en": "Huawei Cloud dev env management: connect/switch container/VM freely, list, status, exec, enable_root."
    },
    "author": ["Operit User"],
    "category": "System",
    "tools": [
        {
            "name": "usage_advice",
            "description": {
                "zh": "使用建议：\n- huawei_dev_connect 可传 num 或 id 连接任意容器/虚拟机；切换自动替换旧隧道。\n- Vm 登录用户是 developer，Container 是 root，自动探测。\n- root 被拒时自动尝试 enable_root 注入公钥。\n- 首次使用先 huawei_dev_config 配置 AK/SK。\n- 开发桌面类型暂不支持。",
                "en": "- connect accepts num/id for any container/VM; switching replaces tunnel.\n- Vm uses developer, Container uses root; auto-probed.\n- Auto enable_root when root denied.\n- First-time: huawei_dev_config.\n- Desktop type not supported yet."
            },
            "parameters": [],
            "advice": true
        },
        {
            "name": "huawei_dev_connect",
            "description": {
                "zh": "开启/切换连接：确保 Running、建隧道（校验指向并按需重建）、探测登录用户、必要时自动启用 root。",
                "en": "Open/switch connection: ensure Running, tunnel with target check, probe user, auto-enable root if denied."
            },
            "parameters": [
                {"name": "num", "description": {"zh": "NUM 列序号，与 id 二选一", "en": "NUM column"}, "type": "number", "required": false},
                {"name": "id", "description": {"zh": "实例 ID，与 num 二选一", "en": "Instance ID"}, "type": "string", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_disconnect",
            "description": {
                "zh": "断开：杀隧道；stop_env=false 仅断隧道保留环境。",
                "en": "Disconnect: kill tunnel; stop_env=false keeps env."
            },
            "parameters": [
                {"name": "stop_env", "description": {"zh": "同时关环境，默认 true", "en": "Stop env too, default true"}, "type": "boolean", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_list",
            "description": {"zh": "列出全部开发环境。", "en": "List all dev environments."},
            "parameters": [],
            "returns": true
        },
        {
            "name": "huawei_dev_status",
            "description": {"zh": "查询当前连接状态。", "en": "Query status."},
            "parameters": [],
            "returns": true
        },
        {
            "name": "huawei_dev_exec",
            "description": {"zh": "在当前环境执行命令（自动用户）。", "en": "Exec on current env."},
            "parameters": [
                {"name": "command", "description": {"zh": "命令", "en": "Command"}, "type": "string", "required": true},
                {"name": "timeout_ms", "description": {"zh": "超时毫秒", "en": "Timeout ms"}, "type": "number", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_config",
            "description": {"zh": "配置/更换 AK/SK（密钥环+验证）。", "en": "Configure/rotate AK/SK."},
            "parameters": [
                {"name": "ak", "description": {"zh": "AK", "en": "AK"}, "type": "string", "required": true},
                {"name": "sk", "description": {"zh": "SK", "en": "SK"}, "type": "string", "required": true},
                {"name": "verify", "description": {"zh": "配置后验证，默认 true", "en": "Verify after"}, "type": "boolean", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_shell",
            "description": {"zh": "交互式 SSH 会话。", "en": "Interactive SSH."},
            "parameters": [
                {"name": "input", "description": {"zh": "初始命令", "en": "Initial cmd"}, "type": "string", "required": false}
            ],
            "returns": true
        },
        {
            "name": "huawei_dev_enable_root",
            "description": {
                "zh": "为当前环境启用 root SSH：注入公钥到 /root/.ssh/authorized_keys 并确保 PermitRootLogin prohibit-password 后重载 sshd。",
                "en": "Enable root SSH: inject pubkey, PermitRootLogin prohibit-password, reload sshd."
            },
            "parameters": [],
            "returns": true
        },
        {
            "name": "huawei_dev_power",
            "description": {
                "zh": "开/关机（不建隧道）：对任意环境执行开机或关机，等待状态到位。action=start|stop，可用 id 或 num 指定环境。",
                "en": "Power on/off (no tunnel): start or stop any env, waits for state. action=start|stop, target via id or num."
            },
            "parameters": [
                {"name": "action", "description": {"zh": "start 或 stop", "en": "start or stop"}, "type": "string", "required": true},
                {"name": "id", "description": {"zh": "实例 ID，与 num 二选一", "en": "Instance ID"}, "type": "string", "required": false},
                {"name": "num", "description": {"zh": "NUM 序号，与 id 二选一", "en": "NUM column"}, "type": "number", "required": false}
            ],
            "returns": true
        }
    ]
}
*/
Object.defineProperty(exports, "__esModule", { value: true });