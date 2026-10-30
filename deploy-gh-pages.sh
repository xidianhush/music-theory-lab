#!/usr/bin/env bash
# 部署乐理实验室到 GitHub Pages（gh-pages 分支方式，无需 workflow 权限）
set -euo pipefail

REPO_URL="https://github.com/xidianhush/music-theory-lab.git"
SITE_URL="https://xidianhush.github.io/music-theory-lab/"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$PROJECT_DIR"

echo "▶ 构建生产包（base=/music-theory-lab/）"
npm run build

echo "▶ 准备 gh-pages 工作树"
WORKTREE="/tmp/mtl-gh-pages"
rm -rf "$WORKTREE"
git worktree add --detach "$WORKTREE" >/dev/null

echo "▶ 写入构建产物"
cd "$WORKTREE"
rm -rf ./*
cp -r "$PROJECT_DIR/dist/." ./
touch .nojekyll

git add -A
git -c user.name="xidianhush" -c user.email="23009100863@stu.xidian.edu.cn" \
  commit -m "deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >/dev/null
git branch -f gh-pages
git push -f origin gh-pages 2>&1 | tail -2

echo "▶ 清理工作树"
cd "$PROJECT_DIR"
git worktree remove "$WORKTREE"

echo "✓ 已部署 → $SITE_URL"
