#!/usr/bin/env bash
# M4-B 工具链：PDF → MusicXML（Audiveris OMR）
# 用法: ./scripts/pdf2musicxml.sh <输入.pdf> <输出目录>
#
# 已知坑位（已修复）：
# 1. Audiveris 有 2000 万像素/页上限，直接吃 PDF 会渲染成 1.3 亿像素导致整页判废。
#    → 先用 pdftoppm -r 300 预渲染，再按 1/3 下采样到 ~1500 万像素。
# 2. 调号识别有系统性误差（见 data/scores/luv-sic-pt3/QA.md），入库前必须人工核对。
set -euo pipefail

PDF="${1:?需要输入 PDF 路径}"
OUT="${2:?需要输出目录}"
AUDIVERIS="/opt/audiveris-app/opt/audiveris/bin/Audiveris"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

[ -f "$PDF" ] || { echo "找不到 PDF: $PDF"; exit 1; }
[ -x "$AUDIVERIS" ] || { echo "找不到 Audiveris: $AUDIVERIS"; exit 1; }

echo "▶ 预渲染 PDF → PNG（300 DPI）"
pdftoppm -r 300 -png "$PDF" "$TMP/pg"

echo "▶ 下采样（Audiveris 像素上限规避）"
python3 - "$TMP" <<'EOF'
import sys
from PIL import Image
import glob
Image.MAX_IMAGE_PIXELS = None
for f in sorted(glob.glob(f'{sys.argv[1]}/pg-*.png')):
    im = Image.open(f).convert('L')
    w, h = im.size
    im.resize((w // 3, h // 3), Image.LANCZOS).save(f.replace('.png', '-s.png'))
    print(f"  {f.split('/')[-1]}: {w}x{h} → {(w//3)}x{(h//3)}")
EOF

echo "▶ Audiveris 批量识别并导出 MusicXML"
mkdir -p "$OUT"
"$AUDIVERIS" -batch -export -output "$OUT" "$TMP"/pg-*-s.png >"$TMP/audiveris.log" 2>&1 \
  || { echo "识别失败，日志见 $TMP/audiveris.log"; tail -20 "$TMP/audiveris.log"; exit 1; }

echo "✓ 完成，产物："
ls -la "$OUT"/*.mxl
