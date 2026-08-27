#!/bin/bash
# gate_tsc.sh — 构建防回归闸门：去掉 @ts-nocheck 后用 tsc 抓“漏 import/未定义标识符”
# 用法: bash gate_tsc.sh
set +e
ROOT="$(cd "$(dirname "$0")" && pwd)"
WORK="/tmp/hds_gate"
rm -rf "$WORK"
mkdir -p "$WORK/src" "$WORK/types"

cp -r "$ROOT/src/packages" "$WORK/src/packages"
cp -r "$ROOT/src/huawei_devspace_setup" "$WORK/src/huawei_devspace_setup"
cp -f "$ROOT/src/main.ts" "$WORK/src/main.ts" 2>/dev/null
cp -r "$ROOT/../types/." "$WORK/types/" 2>/dev/null

# 去掉 @ts-nocheck（核心：这次 bug 就是它掩盖的）
find "$WORK/src" -name '*.ts' -exec sed -i 's|^// @ts-nocheck||' {} \;

cat > "$WORK/globals.d.ts" << 'EOF'
declare const Tools: any;
declare const exports: any;
declare const module: any;
declare const require: any;
declare const getEnv: (k: string) => string;
declare const getPluginConfigDir: (pid?: string) => string;
EOF

cat > "$WORK/tsconfig.gate.json" << 'EOF'
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "moduleResolution": "node10",
    "lib": ["es2020"],
    "strict": false,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "typeRoots": []
  },
  "include": ["./src/**/*.ts", "./types/**/*.d.ts", "./globals.d.ts"]
}
EOF

cd "$WORK"
OUT=$(tsc -p tsconfig.gate.json 2>&1)
RC=$?
# 只报告 TS2304（Cannot find name），忽略其他类别
TS2304=$(echo "$OUT" | grep 'TS2304')
if [ -n "$TS2304" ]; then
    echo "GATE_FAIL: 发现未定义标识符（漏 import 风险）"
    echo "$TS2304" | head -30
    exit 1
fi
echo "GATE_OK: tsc name-check passed (rc=$RC)"
exit 0