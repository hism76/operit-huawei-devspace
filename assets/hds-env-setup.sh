#!/bin/bash
# hdspace 密钥环环境自愈脚本（幂等且极速）
DBUS_ADDR="unix:path=/tmp/hds-dbus.sock"
export DBUS_SESSION_BUS_ADDRESS="$DBUS_ADDR"

probe() {
  echo -n '' | timeout 2 secret-tool store --label=probe service hds-probe >/dev/null 2>&1 \
    && { secret-tool clear service hds-probe >/dev/null 2>&1; return 0; } || return 1
}

# 快速检查 socket 与存活
if [ -S /tmp/hds-dbus.sock ]; then
  if probe; then
    echo "KEYRING_OK"
    exit 0
  fi
fi

# 损坏或未启动：强力清理旧进程与旧 socket
pkill -9 -f 'dbus-daemon.*hds-dbus' 2>/dev/null
pkill -9 -f 'gnome-keyring-daemon' 2>/dev/null
rm -f /tmp/hds-dbus.sock /tmp/hds-dbus.log
sleep 0.3

# 启动 dbus-daemon
setsid dbus-daemon --session --nofork --address="$DBUS_ADDR" >/tmp/hds-dbus.log 2>&1 < /dev/null &
disown 2>/dev/null
sleep 0.5

# 启动 gnome-keyring-daemon
setsid gnome-keyring-daemon --daemonize --components=secrets >/dev/null 2>&1 < /dev/null &
disown 2>/dev/null
sleep 0.8

if probe; then
  echo "KEYRING_OK"
  exit 0
fi

# 二次短延时重试（冷启动保护）
sleep 1
if probe; then
  echo "KEYRING_OK"
  exit 0
fi

echo "KEYRING_FAIL"
exit 1
exit 1