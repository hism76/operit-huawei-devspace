#!/bin/bash
# hdspace 密钥环环境自愈脚本（幂等）
# 用 setsid 让 daemon 完全脱离调用者的进程组/会话，避免命令结束后被清理
DBUS_ADDR="unix:path=/tmp/hds-dbus.sock"
export DBUS_SESSION_BUS_ADDRESS="$DBUS_ADDR"

probe() {
  echo -n '' | timeout 5 secret-tool store --label=probe service hds-probe >/dev/null 2>&1 \
    && { secret-tool clear service hds-probe 2>/dev/null; return 0; } || return 1
}

if [ -S /tmp/hds-dbus.sock ]; then
  if probe; then echo "KEYRING_OK"; exit 0; fi
fi

pkill -f 'dbus-daemon.*hds-dbus' 2>/dev/null
pkill -f 'gnome-keyring-daemon' 2>/dev/null
sleep 1
rm -f /tmp/hds-dbus.sock
setsid dbus-daemon --session --nofork --address="$DBUS_ADDR" >/tmp/hds-dbus.log 2>&1 < /dev/null &
disown 2>/dev/null
sleep 1
setsid gnome-keyring-daemon --daemonize --components=secrets >/dev/null 2>&1 < /dev/null &
disown 2>/dev/null
sleep 2
if probe; then
  echo "KEYRING_OK"
  exit 0
fi
echo "KEYRING_FAIL"
exit 1