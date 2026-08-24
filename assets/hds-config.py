import pty, os, sys, time, select

# hdspace AK/SK 配置辅助脚本（pty 自动应答三步输入）
DBUS = 'unix:path=/tmp/hds-dbus.sock'
os.environ['DBUS_SESSION_BUS_ADDRESS'] = DBUS

if len(sys.argv) < 3:
    print('CONFIG_FAILED: need ak and sk args')
    sys.exit(1)
ak = sys.argv[1]
sk = sys.argv[2]

pid, fd = pty.fork()
if pid == 0:
    os.environ['DBUS_SESSION_BUS_ADDRESS'] = DBUS
    os.execv('/root/.local/bin/hdspace', ['/root/.local/bin/hdspace', 'config'])

timeout = 40
start = time.time()
sent_ak = False
sent_sk = False
sent_again = False
buf = b''
while time.time() - start < timeout:
    r, _, _ = select.select([fd], [], [], 0.5)
    if r:
        try:
            data = os.read(fd, 4096)
        except OSError:
            break
        if not data:
            break
        buf += data
        text = buf.decode(errors='replace')
        if not sent_ak and 'Access Key ID' in text:
            time.sleep(0.4)
            os.write(fd, (ak + '\r').encode())
            sent_ak = True
        elif sent_ak and not sent_sk and 'Secret Access Key' in text.split('Access Key ID:', 1)[1]:
            time.sleep(0.4)
            os.write(fd, (sk + '\r').encode())
            sent_sk = True
        elif sent_sk and not sent_again and 'Secret Access Key(again)' in text.split('Secret Access Key:', 1)[-1]:
            time.sleep(0.4)
            os.write(fd, (sk + '\r').encode())
            sent_again = True
    try:
        wp, st = os.waitpid(pid, os.WNOHANG)
        if wp == pid:
            break
    except ChildProcessError:
        break

text = buf.decode(errors='replace')
if 'Config AK/SK success' in text:
    print('CONFIG_SUCCESS')
elif 'invalid' in text.lower():
    print('CONFIG_INVALID: AK/SK rejected by Huawei Cloud')
else:
    # 只输出状态行，避免把回显中的凭据片段写进日志
    tail = ''
    for line in text.strip().splitlines():
        ls = line.strip()
        if ls.startswith('failed') or ls.startswith('Error'):
            # 去掉可能内嵌的敏感内容，仅保留错误类别
            tail = ls.split(':')[0][:80]
            break
    print('CONFIG_FAILED: ' + (tail or 'unknown'))