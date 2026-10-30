# Music Theory Lab 架构文档

交互式乐理学习网站：五线谱、节拍与节奏、调式与音阶。

## 技术栈

- 构建：Vite 8 + React 19 + TypeScript 5.9（纯 CSS，不用 Tailwind）
- 路由：React Router v7
- 测试：Vitest 5（引擎层纯函数单测）
- 谱面：VexFlow 5（已接入；StaffView 组件负责渲染 + 点击热区 + 音名标注）
- 音频：Web Audio API（AudioEngine 单例封装）

## 目录结构

```
music-theory-lab/
├── index.html · vite.config.ts · tsconfig.json · package.json
├── public/                 静态资源（favicon）
├── src/
│   ├── main.tsx            入口：挂载 RouterProvider
│   ├── router.tsx          路由表（/notation /rhythm /scales）
│   ├── App.tsx             应用壳：导航 + Outlet
│   ├── styles/             设计令牌 + 全局样式 + 布局组件样式
│   ├── data/               ① 单一数据源：notes / timeSignatures / scales / exercises
│   ├── engine/             ② 纯逻辑层：notation / rhythm / scale / audio
│   ├── components/         ③ UI 组件层：staff / piano / metronome / quiz / ui
│   ├── pages/              ④ 页面层：Home / Notation / Rhythm / Scales
│   └── hooks/              与引擎联动的最小 hook（useMetronome / useAudioEngine）
├── tests/engine/           引擎单测
└── docs/architecture.md    本文档
```

## 分层与依赖规则

依赖方向（自上而下，单向）：

```
pages → components → engine → data
```

- 数据流向与依赖方向相反：data → engine → components → pages。
- 引擎层是纯函数，不碰 DOM / AudioContext / React，可直接单测。
- 组件层只负责渲染与交互，不写业务计算；谱面组件内部封装 VexFlow。
- 新增学习模块 = 新增 page + 新增/扩展 data，引擎与组件全部复用。
- 唯一例外：`engine/audio` 封装浏览器音频（必然有副作用），已收敛为单一 AudioEngine 类，
  组件只调用 `audioEngine.playMidi()` 等接口，禁止各自创建 AudioContext。

## 学习闭环范式

每个页面复用 `PageShell`，按「讲 → 看 → 听 → 练」四段组织：

1. 讲：概念讲解（文字 + 动画，后续丰富）
2. 看：五线谱 / 表格可视化
3. 听：点击发声、节拍器
4. 练：小测验 + 即时对错反馈（QuizCard，反馈逻辑 M2 实现）

## 阶段计划

| 阶段 | 内容 | 状态 |
| --- | --- | --- |
| M0 | 工程骨架：目录、路由、设计令牌、四层占位 | 完成 |
| M1 | 引擎与数据：rhythm/scale/notation 纯函数 + 单测，AudioEngine 发声 | 完成（题库待 M3 前扩展） |
| M2 | 第一个闭环：节拍模块（节拍器打拍、强弱拍高亮、拍号练习答题反馈） | 完成 |
| M3 | 复制范式：五线谱（VexFlow 谱面 + 点谱发声）、音阶（键盘高亮播放 + 听音辨调） | 完成 |
| 二期 | 音程、和弦、视唱练耳、移调与转调 | 待做 |

## 关键决策记录

- TypeScript 固定 5.x（最新 7.x 为新原生编译器，待生态稳定后再评估）。
- 调式音名拼写按调号规则实现（♭B 大调写作 Bb C D Eb F G A），不走简单升号表——这本身就是教学点。
- 拍号 / 时值换算全部落在 engine/rhythm，保证节拍器、演示、练习三处口径一致。
- 节拍器使用 lookahead 调度（提前 0.12s 用 AudioContext 时钟排拍），避免 setInterval 累积抖动；
  BPM / 拍号通过 ref 即时生效。强弱拍提示音由 engine/rhythm 的 `beatPattern` / `tickMidi` 决定。

## 开发命令

```bash
npm install
npm run dev        # 启动开发服务器
npm run build      # tsc --noEmit + vite build
npm test           # Vitest 单测
npm run preview    # 预览构建产物
```
