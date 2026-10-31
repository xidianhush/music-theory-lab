# 交接文档 · Music Theory Lab（乐谱乐理可视化教学项目）

> 用途：移交给下一位编程智能体（或后续会话）的标准交接文件。
> 打开本仓库后请**先读本文件**，再读 `docs/architecture.md` 与 `data/scores/luv-sic-pt3/QA.md`。
> 最后更新：2026-10-31（由上一任智能体撰写；git HEAD = `023e672`）。

---

## 1. 项目速览

- **是什么**：交互式乐理学习网站。五线谱 / 节拍节奏 / 调式音阶三块教学模块 + 真实曲目导入跟弹（M4）。
- **技术栈**：Vite 8 + React 19 + TypeScript 5.9 + React Router v7 + Vitest 5；谱面渲染 VexFlow 5；音频 Web Audio API；纯 CSS（深蓝幽蓝主题，不用 Tailwind）。
- **仓库**：`https://github.com/xidianhush/music-theory-lab.git`（本地工程根即本目录）。
- **线上**：`https://xidianhush.github.io/music-theory-lab/`（HashRouter，详情页 `#/pieces/luv-sic-pt3`）。
- **部署方式**：`./deploy-gh-pages.sh`（git worktree → `npm run build` → 强推 gh-pages 分支）。**GITHUB_TOKEN 无 workflow 权限，不要改用 Actions**；用户明令「勿动 xidianhush.github.io 仓库」。

## 2. 当前状态（截至 2026-10-31）

- **M0–M3 完成**：工程骨架、节拍节奏、五线谱（VexFlow）、调式音阶、跟打测验，均已部署。
- **M4 主线完成（闭环）**：真实乐谱导入 = PDF → Audiveris 5.11 OMR（MusicXML）→ `scripts/import-piece.ts` 解析入库 → 独立分包 JSON → 曲目详情页跟弹。首曲 **luv(sic)pt3 全量 5 页入库：80 小节 / 1900 音符 / 全曲 ♭A 大调（fifths=-4）**。
- **最近 8 次提交**（Conventional Commits，中文 message）：

| 提交 | 内容 |
|---|---|
| `023e672` | 声画同步：声音与高亮共用调用时刻为原点的相对延迟调度（新增 `AudioEngine.scheduleToneDelay`） |
| `0e481b7` | 连续播放整曲按钮（`playingAll`/`playAll`，绝对时间轴无缝衔接） |
| `4991b7b` | `measureOnsets` 按声部独立累积位置，左右手同拍发音合并（修听感错位） |
| `7172457` | 渲染连音线（ts/tp→StaveTie），附点确认已渲染（glyph `\ue1e7`） |
| `2519efb` | 页首小节块宽容纳 4 降号调号（音符不再被裁切），小节块加编号角标 |
| `426d391` | 跨 stave 时间对齐 + 补前两小节右手与页 5 终止小节，调号订正为全曲 ♭A |
| `3fe6265` | 双手谱表共享 Formatter，同拍音符垂直对齐 |
| `8bfc262` | 谱面渲染按发音点合并和弦、附点改 duration 后缀 |

- **测试基线**：`npm test` = **55/55 通过**（5 个文件：`tests/engine/{notation,notes,rhythm,scale,score}.test.ts`）。
- **构建**：`npm run build` ✓（base=`/music-theory-lab/`）。

## 3. 架构与关键文件地图

依赖方向（自上而下单向）：`pages → components → engine → data`；数据流向相反。

```
src/
├── pages/PieceDetail/index.tsx  曲目详情页：播放控制（单小节/整曲）、调性文案、谱面挂载
├── components/pieces/PieceStaff.tsx  VexFlow 谱面渲染（块宽、连音线、附点、跨谱表对齐）
├── components/piano/            键盘高亮
├── engine/audio/index.ts        AudioEngine 单例（scheduleTone / scheduleToneDelay）
├── engine/score/                ScoreMeasure 类型 / measureOnsets / measureSeconds / keyFromFifths
├── data/pieces.ts               曲目元数据与 loader
└── data/pieces/luv-sic-pt3.json 入库曲目（80 小节 1900 音符，全 fifths=-4）

data/scores/luv-sic-pt3/         原始 PDF、5 个分页 MusicXML、QA.md（识别质量记录）
scripts/import-piece.ts          MusicXML → JSON 入库脚本（含 CORRECTION 调号表）
tests/engine/score.test.ts       引擎单测（含左右手同拍合并用例）
deploy-gh-pages.sh               部署脚本（勿改部署通道）
docs/architecture.md             架构文档（注意：其中"1907 音符"为旧值，实测为 1900，以本文件为准）
```

## 4. 核心事实与不可回归约束

### 调号定稿（重大事实，勿推翻）
- **全曲 5 页均为 4♭（♭A 大调），无转调**。证据：250dpi 谱首字形逐页 OCR 数出 4 个 ♭（详见 QA.md 证据路径）。
- 早期「页1=3♭♭B / 页5=3♭♭E」是误判，已推翻；页面文案为「整曲调性：♭A 大调」。
- CORRECTION 表：页 1–5 全部 `fifths:-4`。**降 D 大调 = 5♭，与此谱无关**（调号含 ♭D 音但不为主音）。
- 页小节分配：页1=1–22、页2=23–38、页3=39–57、页4=58–73、页5=74–80（PDF 印刷号 2–81，差 1 未偏移）。

### PieceStaff 渲染语义（不可回归）
- 附点必须写 duration 后缀（`'qd'` 等，VexFlow 5 的 dots 选项不改 tick）。
- 和弦按 `n.c=true` 同 tick 合并共享符干。
- **绝不走 `formatToStave`**（多 voice 挂同 stave 会避让）→ 用 `System.format` 式：`noteStartX=max` + `formatter.format(voices, justifyWidth, {alignRests:false})` + 各 voice 自绘 + 自绘小节线。
- 块宽公式：`prefixExtra = showPrefix ? 270 : 0; width = Math.min(640, Math.max(160, notes*7+120+prefixExtra))`（页首须容纳调号+拍号）。
- 连音线：构造 loop 里 meta 记录 ts/tp，`flush()` 后按谱表顺序 ts→tp 就近配对 `new StaveTie(...).setContext(ctx).draw()`；tie 类名 `vf-stavetie`。
- 附点兜底：`getModifiersByType('Dot')`；附点 glyph `\ue1e7` 在 `vf-notehead` 内 text（不是独立类，检查时勿误判缺失）。
- 配色：INK=`#e8eefc`、LINE=`#b7c5e6`。

### measureOnsets 语义（不可回归）
- 各声部独立累积位置（`posByVoice`），不同声部同一拍点合并（1e-9 容差），和弦并入同声部最近发音点（`eventIdxByVoice`）。
- tieStop 且同 voice 同 midi → 不重新触发。实测小节 1：拍点 0 = [A4 D4 F2 C3 F3]（左右手同时；右手 A♭4·D♭4 为 2026-10-31 定音修正值，原 F4·C5 已推翻），1.5 = [G3]，3.0 = [F3]。

### 播放引擎（不可回归）
- `scheduleTone(freq, when)`：`when` 是 AudioContext **绝对时间**（供节拍器等外部调度用）。
- `scheduleToneDelay(freq, delay)`：调用时刻采样 `ctx.currentTime + delay` —— **曲目播放必须用它**，与 UI setTimeout 高亮共用同一时间原点（否则首次 resume 时 currentTime 冻结，声音整体提前/高亮滞后，`023e672` 已修）。
- 高亮定时器统一 `delay*1000 - 30`（音符）与 `accum*1000 - 40`（小节切换），与声音 delay 同源。

## 5. 标准工作流（下一位智能体日常执行）

```bash
# 本地预览（停止用 fuser -k 4173/tcp，勿用 pkill -f vite）
npx vite preview --port 4173 --strictPort

# 无头 DOM 验证（virtual-time-budget 必须给足，20000ms 才稳定出 80 个 SVG）
chromium --headless=new --no-sandbox --disable-gpu --dump-dom --virtual-time-budget=20000 \
  "http://localhost:4173/music-theory-lab/#/pieces/luv-sic-pt3" > /tmp/domN.html

# 截图验证
chromium --headless=new --no-sandbox --disable-gpu --window-size=W,H \
  --screenshot=/tmp/x.png --virtual-time-budget=10000 "<url>"

# 提交 + 部署（Conventional Commits 中文 message）
git commit -m "fix(pieces): ..."
./deploy-gh-pages.sh   # 完成后 curl 线上地址确认 200
```

## 6. 已验证死路（勿重试）

- GITHUB_TOKEN push 401；Pages API 切 legacy 422/403/409 → 走 `deploy-gh-pages.sh`。
- Audiveris 直吃 PDF >20MP 判废 → 必须 `pdftoppm -r300` + 1/3 下采样。
- 音级直方图 / 候选调号还原判调式证伪 → 调号只认 250dpi 谱首字形计数。
- `pkill -f vite preview` 会误杀自身 shell → 用 `fuser -k 4173/tcp`。
- 附点"缺失"误判：VexFlow 附点在符头旁（`\ue1e7`），检查时看 glyph 数而非类名。

## 7. 遗留事项与下一步建议

| 事项 | 状态 | 建议 |
|---|---|---|
| ~~页 1 前两小节补录右手音高（F4+C5 / B♭4+F4）~~ | **已定案（2026-10-31）** | 250dpi 像素线位复核 = **A4+D4 / A4+D4**（调号自动降 A♭4·D♭4），已改 JSON 并出证据图（QA.md"前两小节右手音高复核"一节） |
| 补音无 `<alter>`，依赖 fifths=-4 自动降 | 线上表现正常 | 若换调号必须重验补音 |
| 页面小节号 1–80 vs PDF 印刷 2–81 差 1 | 未偏移 | 可保持现状，或加"弱起小节"说明 |
| Ped. 踏板记号 | 未保留到 MusicXML | 属可选项；渲染层需支持 Pedal 记号再补 |
| `docs/architecture.md` 记"1907 音符" | 与实测 1900 不符 | 下次动文档时顺手改为 1900 |
| 连续播放整曲 | 已上线 | 可验证节奏变速（BPM 滑杆）下声画仍同步 |

**下一位智能体第一件事**：跑 `npm test`（55/55）→ `npm run build` → 本地 preview 打开详情页确认 80 小节 SVG / 178 附点 / 87 连音线基线，再开始新需求。

## 8. 给下一位智能体的启动提示

- 本项目的验收标准 = **谱面渲染与原谱一致、跟弹听感与原谱一致**（用户逐小节对照原谱验收）。
- 改渲染/播放前先读本节与第 4 节约束；改数据前先读 QA.md；改部署通道前先问用户。
- 用户偏好：Conventional Commits 中文 message；深蓝幽蓝高级感 UI；严谨量化验证（给证据再下结论）。
