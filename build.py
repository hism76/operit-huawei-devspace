#!/usr/bin/env python3
import os, re, subprocess, sys, shutil
ROOT = os.path.dirname(os.path.abspath(__file__))
DIST_PKG = os.path.join(ROOT, 'dist', 'packages')
MAIN = os.path.join(DIST_PKG, 'huawei_devspace.js')
ESBUILD = '/tmp/node_modules/.bin/esbuild'
def main():
    print('[1/4] tsc compile...')
    r = subprocess.run(["tsc"], cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0 or "error TS" in r.stdout:
        print(r.stdout[-600:])
        sys.exit(1)
    print("[2/4] esbuild bundle...")
    r = subprocess.run([
        ESBUILD,
        os.path.join("src", "packages", "huawei_devspace.ts"),
        "--bundle", "--platform=neutral", "--format=cjs",
        "--outfile=" + MAIN,
        "--log-level=warning",
    ], cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-800:])
        sys.exit(1)

    # patch named exports: esbuild 把 module.exports 替换后，named exports 丢失
    _names = ["huawei_dev_connect", "huawei_dev_disconnect", "huawei_dev_list",
              "huawei_dev_status", "huawei_dev_exec", "huawei_dev_config",
              "huawei_dev_shell", "huawei_dev_enable_root", "huawei_dev_power",
              "huawei_dev_keepalive", "huawei_dev_upload", "huawei_dev_download",
              "huawei_dev_logs", "huawei_dev_forward", "huawei_dev_quick"]
    import re as _re
    _s = open(MAIN).read()
    _s = _s.replace('module.exports = __toCommonJS(huawei_devspace_exports);\n', '', 1)
    _fix = "\n".join('module.exports.' + n + ' = huaweiDevspaceTools["' + n + '"];' for n in _names)
    _s = _s.rstrip() + "\n" + _fix + "\n"
    open(MAIN, "w").write(_s)

    # esbuild 会剥掉 METADATA 注释块，而平台靠它注册工具——必须重新注入
    src_ts = os.path.join(ROOT, "src", "packages", "huawei_devspace.ts")
    _ts = open(src_ts).read()
    _m = _re.search(r"(/\*\s*METADATA.*?\*/)", _ts, re.S)
    if not _m:
        print("ERROR: METADATA block not found in source ts")
        sys.exit(1)
    _meta = _m.group(1)
    if "METADATA" not in _s:
        _s2 = open(MAIN).read()
        open(MAIN, "w").write(_meta + "\n" + _s2)
        print("   METADATA re-injected")
    print('[3/4] verify parse...')
    vr = subprocess.run(["node", "-e", "const t = require(" + chr(39) + MAIN + chr(39) + "); console.log(1)"], capture_output=True, text=True)
    if vr.returncode != 0:
        print(vr.stderr[-500:])
        sys.exit(1)
    print('[4/4] sync to pkgroot...')
    pd = os.path.join(ROOT, 'pkgroot', 'dist')
    for src, dst in [(os.path.join(ROOT, "dist", "main.js"), os.path.join(pd, "main.js")), (os.path.join(ROOT, "dist", "huawei_devspace_setup", "index.ui.js"), os.path.join(pd, "huawei_devspace_setup", "index.ui.js")), (MAIN, os.path.join(pd, "packages", "huawei_devspace.js"))]:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
    core_dir = os.path.join(pd, "packages", "core")
    if os.path.exists(core_dir):
        shutil.rmtree(core_dir)
    print("DONE:", os.path.getsize(MAIN), "bytes")

    # 打包 toolpkg
    toolpkg = os.path.join(ROOT, "huawei_devspace.toolpkg")
    if os.path.exists(toolpkg):
        os.remove(toolpkg)
    r2 = subprocess.run(["zip", "-rqX", "-D", toolpkg, "."], cwd=os.path.join(ROOT, "pkgroot"), capture_output=True, text=True)
    if r2.returncode == 0:
        print("TOOLPKG:", toolpkg, "(" + str(os.path.getsize(toolpkg)) + " bytes)")
main()
