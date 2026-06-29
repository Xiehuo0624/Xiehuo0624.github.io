# 排版标准文档

> 断点：**768px**（≤768px 为移动端）

---

## 1. 全局基础

| 属性 | 值 |
|------|------|
| 字体 | 英文/数字：`'DejaVu Sans Mono'`（自托管 webfont，与 macOS Menlo 同源，跨平台一致）；中文：`'Source Han Sans SC'`（思源黑体 SC，自托管子集化，Regular/Bold 各约 300KB）；`'PlainZero'`（仅 U+0030，用同家族 DejaVu Sans 的纯净 0 覆盖 DejaVu Sans Mono 的点 0）。字体栈：`'PlainZero','DejaVu Sans Mono','Source Han Sans SC',Menlo,Consolas,monospace` |
| 中英/中数间距 | `js/autospace.js` 自动在 CJK↔英数 边界插入 thin space（U+2009）；DejaVu Sans Mono 中 U+2009 的字宽已单独改为 0.2em（等宽字体默认 0.6em 会过宽）。全站自动生效，幂等，覆盖动态注入内容 |
| 背景色 | `#fff` |
| 前景色 | `#000` |
| 重置 | 全局 `margin:0; padding:0; box-sizing:border-box` |
| 标题行高 | 所有页面标题（h1/h2）统一 `line-height:1`，消除中英文字体基线差异导致切换语言时横线位置偏移 |
| viewport | `viewport-fit=cover`（所有页面，启用 `env(safe-area-inset-*)`） |
| 标签页 `<title>` | 首页 `泻火 曹浩轩`；内页 `ABOUT`/`WORKS`/`CHANGELOG`/`PROJECT`（项目页运行时动态设为作品标题，404 时为 `404 — 未找到`） |

### 移动端弹性滚动

首页 `html, body` 均设置 `position:fixed; top:0; left:0; right:0; bottom:0; overflow:hidden`，阻止 iOS Safari rubber-band 滚动。内页无需此处理。

---

## 2. 导航栏

### 内页导航（`.back`：返回 + 语言切换）

| | 桌面端 | 移动端 |
|--|--------|--------|
| 位置 | `fixed; top:0; left:0; width:100%` | 同左 |
| 背景 | `rgba(255,255,255,.75)` | 同左 |
| padding | `8px 24px` | `8px 12px; padding-top:max(8px, env(safe-area-inset-top))` |
| 链接间距 | `gap:16px` | `gap:8px` |
| 字号 | `14px` | 同左 |
| z-index | `100` | 同左 |
| 交互 | hover → 黑底白字 | 同左 |

### 首页导航（四角布局）

四角统一竖向偏移机制：竖向 padding 由**容器**承担（`--nav-y` 单一变量，桌面 `2px`/移动 `4px`），`<a>` 竖向 padding 归零（仅留水平点击区 `0 6px`），`line-height` 统一 `1.5` 补偿 hover 黑底高度。这样"文字到锚边的偏移"只看容器一层，改 `--nav-y` 四角联动，不再各角分散凑数。顶部角用 `padding-top`、底部角用 `padding-bottom`。

| | 桌面端 | 移动端 |
|--|--------|--------|
| 统一竖向偏移 `--nav-y` | `2px` | `4px` |
| 统一 line-height | `1.5`（补偿 `<a>` 竖向 padding 归零后的 hover 黑底高度） | 同左 |
| top-left 位置 | `top:20px; left:20px` | `top:max(10px, env(safe-area-inset-top)); left:max(10px, env(safe-area-inset-left)); max-width:40vw` |
| top-left 内容 | `[+] 简介与联系` `[>] 进程日志` | 同左，字号 `12px` |
| top-left 链接间距 | `margin-bottom:8px` | `margin-bottom:6px` |
| top-right 位置 | `top:20px; right:20px` | `top:max(10px, env(safe-area-inset-top)); right:max(10px, env(safe-area-inset-right)); left:50vw` |
| top-right 内容 | `泻火 曹浩轩`（点击彩蛋） | 同左，字号 `12px` |
| top-right letter-spacing | `1px` | 同左 |
| top-right cursor | `pointer` | 同左 |
| top-right 换行 | — | `word-break:break-all; overflow-wrap:break-word` |
| bottom-left 位置 | `bottom:20px; left:20px` | `bottom:max(10px, env(safe-area-inset-bottom)); left:max(10px, env(safe-area-inset-left))` |
| bottom-left 内容 | SELECT WORKS 直达链接 + `[ALL WORKS →]` | 同左，字号 `12px` |
| bottom-left 排列 | `flex-direction:column; gap:4px` | 同左 |
| bottom-left 小写微调 | `.nav-lowercase{position:relative; top:-1px}` | 同左 |
| bottom-right 位置 | `bottom:20px; right:20px` | `bottom:max(10px, env(safe-area-inset-bottom)); right:max(10px, env(safe-area-inset-right)); left:50vw` |
| bottom-right 内容 | 语言切换 `[en] English` | 同左，字号 `12px` |
| `<a>` padding（水平点击区） | `0 6px`（竖向归零，由容器 `--nav-y` 承担偏移） | 同左 |

---

## 3. 首页 — Card Stack

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 卡片尺寸 | `min(460px, 85vw) × min(300px, 50vw)` | `80vw × 46vw`（max `380×240`） |
| 卡片边框 | `3px solid #000` | `2px solid #000` |
| 水平偏移步长 | `22px`（卡片多时自动缩小，最大展开 `110px`） | `8px`（最大展开 `40px`） |
| 垂直偏移步长 | `4px`（卡片多时自动缩小，最大展开 `20px`） | `2px`（最大展开 `10px`） |
| 偏移方向 | 右下展开 `translate(+x, +y)` | 同左 |
| 卡片居中偏移 | `translate(calc(-50% - 22px), calc(-50% - 28px))` | `translate(calc(-50% - 12px), calc(-50% - 28px))` |
| Fallback 字号 | `22px` | `16px` |
| Fallback letter-spacing | `2px` | `1px` |
| 卡片图片 `.card-image` | `position:absolute; inset:0; z-index:2; object-fit:cover` | 同左 |
| 动画 | `300ms ease-out`（所有卡片同步过渡） | 同左 |

### 卡片封面图

每张卡片为 `card-fallback`（文字层，白底）+ `card-image`（图片层，`object-fit:cover` 盖住文字）双层结构。无图片的卡片仅显示文字 fallback。

| 卡片 | 封面图 | 说明 |
|------|--------|------|
| the-fet-mixer | `img/the-fet-mixer.webp` | 实物照片 |
| riverrun | `img/riverrun.webp` | |
| edgedgedge | `img/edgedgedge.webp` | 拍摄者：段立言 |
| spectral-dissector | `img/spectral-dissector.webp` | 6 条分轨半透明叠加频谱图（黑底，程序生成） |
| ecce-homo | `img/ecce-homo.webp` | |
| wwhbh | `img/wwhbh.webp` | |

### 图片压缩规范

- 部署图片统一使用 **WebP** 格式（`cwebp -q 80`）
- 卡片封面（首页，显示≤460px）缩到 **1200px 宽**
- Gallery/剧照（显示≤800px）缩到 **1600px 宽**
- 原图留档于 `img/originals/`，不部署（`.gitignore` 排除）
- 生成命令示例：`cwebp -resize 1200 0 -q 80 img/originals/xx.jpg -o img/xx.webp`

### 卡片顺序

每次打开首页时，卡片顺序由 Fisher-Yates 洗牌算法随机打乱（在 `js/index.js` 初始化时执行，`reindex()` 之前）。刷新页面即得到新顺序。HTML 中的初始顺序仅作 fallback。

### Card Stack 偏移算法
```js
const isMobile = window.innerWidth <= 768;
const maxSpreadX = isMobile ? 40 : 110;
const maxSpreadY = isMobile ? 10 : 20;
const maxStepX = isMobile ? 8 : 22;
const maxStepY = isMobile ? 2 : 4;
const stepX = len > 1 ? Math.min(maxStepX, maxSpreadX / (len - 1)) : maxStepX;
const stepY = len > 1 ? Math.min(maxStepY, maxSpreadY / (len - 1)) : maxStepY;
// 每张卡片: translate(fromTop * stepX, fromTop * stepY)
// 卡片数量增加时 stepX/Y 自动缩小，最大展开范围不变
```

---

## 4. About 页

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 容器类 | `.about-page` | — |
| 内容区最大宽 | `640px` | 100% |
| 内容区 padding | `80px 24px 48px` | `80px 5vw 48px` |
| 标题 h1 字号 | `22px` | `18px` |
| 标题 h1 letter-spacing | `3px` | `2px` |
| 标题 h1 装饰 | `border-bottom:3px solid #000; padding-bottom:12px; margin-bottom:20px` | 同左 |
| 标题 h1 text-transform | `uppercase` | 同左 |
| 正文 p 字号 | `13px` | `12px` |
| 正文 line-height | `1.9` | 同左 |
| 小标题 h2 字号 | `16px` | `14px` |
| 小标题 h2 letter-spacing | `2px` | 同左 |
| 小标题 h2 text-transform | `uppercase` | 同左 |
| 联系链接字号 | `16px` | `14px` |
| 区块间距 | `border-bottom:3px solid #000; padding-bottom:32px; margin-bottom:32px` | 同左 |
| 日期 `.bio-date` | `display:block; text-align:right; font-size:13px; margin-bottom:16px` | 同左 |

### About 页内容规则

- 日期 `.bio-date` 标注在段落组末尾，右对齐
- 连续段落共享同一日期时只标注一个日期，不逐条重复

---

## 5. Changelog 页

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 容器类 | `.changelog-page` | — |
| 内容区最大宽 | `680px` | 100% |
| 内容区 padding | `80px 24px 48px 60px` | `80px 16px 48px 44px` |
| 标题 h1 类 | `.changelog-title` | — |
| 标题 h1 字号 | `22px` | 同左 |
| 标题 h1 letter-spacing | `3px` | 同左 |
| 标题 h1 text-transform | `uppercase` | 同左 |
| 标题 h1 装饰 | `border-bottom:3px solid #000; padding-bottom:10px; margin-bottom:28px` | 同左 |
| 时间线位置 | `left:36px` | `left:20px` |
| 时间线宽度 | `2px` | 同左 |
| 圆点尺寸 | `10×10px` / `left:-30px` | `8×8px` / `left:-18px` |
| 折叠框边框 | `2px solid #000` | 同左 |
| summary 字号 | `13px` | `12px` |
| summary padding | `10px 14px` | `8px 10px` |
| summary letter-spacing | `1px` | 同左 |
| 日期字号 | `11px; color:#888` | `10px` |
| 展开正文字号 | `12px` | `11px` |
| 展开正文 line-height | `1.8` | 同左 |
| 展开正文 padding | `14px` | `10px` |
| 条目间距 | `24px` | 同左 |

### Changelog 录入规则

1. 在 `js/changelog.js` 的 `entries` 数组中添加
2. **新条目放最前**（数组顺序 = 页面显示顺序）
3. **必须严格按日期降序排列**：`2026-06-23 → 2026-06-22 → 2026-06-21 → ...`，同一天多条按时间倒序
4. **每条必须有 `date` 字段**，格式 `YYYY-MM-DD`，不得遗漏
5. 录入新条目前先检查前一条的日期，确认不会打乱降序

### Changelog 录入格式

```js
{
  date: 'YYYY-MM-DD',  // 必填
  title: { zh: '中文标题', en: 'English Title' },
  body:  { zh: '中文正文（支持HTML）', en: 'English body (HTML ok)' },
  media: ''  // 可选：图片或视频路径，留空则不显示
}
```

---

## 6. Works 页

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 内容区最大宽 | `960px` | 100% |
| 内容区 padding | `80px 24px 48px` | `80px 5vw 48px` |
| 标题 h1 | `22px; letter-spacing:3px; uppercase; border-bottom:3px solid #000; padding-bottom:12px; margin-bottom:2px; line-height:1` | `18px; letter-spacing:2px` |
| 条目 `.works-item` | `flex; justify-content:space-between; align-items:center; gap:16px; border-bottom:2px solid #000; padding:0 4px; height:48px` | `flex-direction:column; gap:4px; padding:12px 4px; height:auto; align-items:flex-start` |
| 条目标题 `.works-title` | `16px; letter-spacing:2px; uppercase; white-space:nowrap; line-height:1` | `14px; letter-spacing:1px` |
| 小写标题 `.works-title.lowercase` | `text-transform:none` | 同左 |
| 条目简介 `.works-brief` | `12px; color:#888; text-align:right; letter-spacing:0.5px; max-width:50%; line-height:1.3` | `12px; text-align:left; max-width:none` |
| hover | 黑底白字（简介变白） | 同左 |

---

## 7. Project 页 — 五种布局共用标准

### 视频布局规则

**视频不得左右排列，一律上下排列：视频在上，文字在下。** 移动端尤其需要保证视频可见。

### 日期格式规则

所有日期统一使用 **YYYY.MM.DD** 格式，月和日的个位数前补零（如 `06`、`09`），不得省略。示例：`2025.10.09`，而非 `2025.10.9`。

### 通用

| 属性 | 值 |
|------|------|
| 标题 h2 字号 | `20px`（桌面）/ `16px`（移动 info-area） |
| 标题 h2 letter-spacing | `2px` |
| 标题 h2 text-transform | `uppercase` |
| 正文长文本 line-height | `2.4` |
| 正文长文本字号 | `14px` |
| 正文长文本 letter-spacing | `0.5px` |
| 遮蔽块 `.redact` | `background:#000; color:#000; padding:0 4px; letter-spacing:2px; margin:0 2px` |

### 7a. Grid 布局（默认）

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 布局 | `grid; 1fr 1fr` | `1fr` 纵向 |
| 高度 | `100vh` | `auto; min-height:100vh` |
| 媒体区边框 | `border-right:3px solid #000` | `border-bottom:3px solid #000` |
| 媒体区最小高度 | — | `40vw` |
| 媒体区背景 | `#f0f0f0` | 同左 |
| 占位文字 | `14px; letter-spacing:1px; uppercase; color:#888` | 同左 |
| 信息区 padding | `32px` | `20px 16px` |
| 信息区正文字号 | `13px` | 同左 |
| 信息区 line-height | `1.7` | 同左 |
| 标题下边框 | `3px solid #000; padding-bottom:8px; margin-bottom:24px` | 同左 |

### 7b. WWHBH 布局

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 主体 padding | `80px 40px 40px` | `70px 16px 24px` |
| 标题下间距 | `margin-bottom:32px` | 同左 |
| 正文最大宽 | `800px` | 同左 |
| 按钮区 padding | `0 0 32px` | 同左 |
| 按钮 | `width:100%; border:3px solid #000; padding:12px; 14px/700/2px` | 同左 |
| 按钮 i18n | `btnActivate` / `btnDeactivate` / `btnDenied` | 同左 |
| 按钮激活态 | 黑底白字 (`.on`) | 同左 |

### 7c. Ecce 布局（顶部单图 + 可选音频 + 文字）

顶部一张全宽图、下方文字的纵向布局；若项目带 `audio` 字段，则在图下嵌入 HTML5 音频。图片来自 `project.media`（`type:'image'`），音频来自 `project.audio`，均由 `js/project.js` 的 ecce 分支动态渲染（无 audio 字段则不渲染音频，如 SPECTRAL DISSECTOR）。

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 整体 padding | `80px 40px 40px` | `70px 16px 24px` |
| 顶部图 `.ecce-still` | `width:100%; max-width:800px; border-bottom:3px solid #000` | 同左 |
| 音频 `.ecce-audio` | `width:100%; max-width:800px`（HTML5 `<audio>`，可选） | 同左 |
| 文字区 padding | `24px 0 0` | 同左 |
| 文字区最大宽 | `800px` | 同左 |

### 7d. Edge 布局（视频 + 文字，上下排列）

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 整体 padding | `80px 40px 40px` | `70px 16px 24px` |
| 媒体区 `.edge-media` | `width:100%; max-width:800px; aspect-ratio:16/9; background:#f0f0f0` | 同左 |
| 媒体区 iframe | `width:100%; height:100%; border:none` | 同左 |
| 文字区 `.edge-body` | `max-width:800px; padding-top:24px` | 同左 |
| 标题装饰 | `border-bottom:3px solid #000; padding-bottom:8px; margin-bottom:24px` | 同左 |
| 正文行高 | `2.4` | 同左 |

### 7e. Gallery 布局（文字在上，图片横向滑动切换）

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 整体 padding | `80px 40px 40px` | `70px 16px 24px` |
| 文字区 `.gallery-body` | `max-width:800px` | 同左 |
| 标题装饰 | `border-bottom:3px solid #000; padding-bottom:8px; margin-bottom:24px` | 同左 |
| 正文行高 | `2.4` | 同左 |
| 滑动区 `.gallery-slider` | `max-width:800px; scroll-snap-type:x mandatory` | 同左 |
| 滑动条样式 | `scrollbar-height:3px; thumb:#000; track:#f0f0f0` | 同左 |
| 单张 `.gallery-slide` | `flex:0 0 100%; scroll-snap-align:start` | 同左 |
| 图片 | `width:100%; height:auto; object-fit:contain` | 同左 |

### 7e-补. Gallery Lightbox（点击放大）

点击 Gallery 任一图片打开全屏 Lightbox，支持左右切换、键盘方向键、ESC/点击空白关闭。

| 属性 | 值 |
|------|------|
| 遮罩 `.lightbox` | `position:fixed; inset:0; z-index:200; background:rgba(0,0,0,.92)` |
| 图片 | `max-width:92vw; max-height:88vh; object-fit:contain` |
| 左右切换 `.lightbox-nav` | 绝对垂直居中，`48×64px`，透明背景白字 |
| 关闭 `.lightbox-close` | 右上角，`44×44px` |
| 交互 | 点击空白/ESC 关闭；←/→ 切换；多图才显示导航钮 |
| 逻辑位置 | `js/project.js` 的 `openLightbox()`，gallery 渲染时绑定 click |

> Gallery 布局适用于有多张图片需要展示的作品（如硬件作品），图片从 `project-data.js` 的 `media.images` 数组渲染，不在描述 HTML 中内嵌。

> **布局选择规则**：含视频的作品统一使用 Edge 布局（`layout:'edge'`），含多张图片的作品使用 Gallery 布局（`layout:'gallery'`），单张图片置于文字上方用 Ecce 布局（`layout:'ecce'`），均不得使用 Grid 布局的左右分栏。Grid 布局仅用于无媒体或单张图片（左右分栏）的场景。

---

## 8. i18n 系统

| 规则 | 说明 |
|------|------|
| 存储 | `localStorage.getItem('lang')`，默认 `'zh'` |
| 切换 | 点击 `#lang-toggle`，zh ↔ en 互切 |
| 标记 | HTML 元素加 `data-i18n="key"` 属性 |
| 初始化 | 各页面调用 `I18n.init(data, onToggle?)` |
| 回调 | 需要语言切换后额外刷新内容时，传入 `onToggle` 回调 |

---

## 9. 文件结构

```
├── index.html                 首页 HTML
├── about.html                 关于页 HTML
├── works.html                 作品列表页 HTML
├── changelog.html             日志页 HTML
├── project-template.html      项目页 HTML
├── .gitignore                 Git 忽略规则（含 docs/、preview-cards.html）
│
├── preview-cards.html          卡片堆叠预览工具（仅本地开发，不部署）
│
├── css/
│   ├── base.css               全局 reset + 基础 + @font-face
│   ├── nav.css                导航栏（两种变体）
│   ├── index.css              首页卡片堆叠
│   ├── about.css              关于页
│   ├── works.css              作品列表页
│   ├── changelog.css          日志页时间线
│   ├── project.css            项目页五种布局
│   └── fonts/                 自托管 webfont（DejaVu Sans Mono + 思源黑体 SC + PlainZero woff2，子集化）
│
├── data/                        作品描述 HTML 片段（运行时 fetch 加载）
│   ├── ecce-homo/
│   │   ├── zh.html
│   │   └── en.html
│   ├── edgedgedge/
│   │   ├── zh.html
│   │   └── en.html
│   ├── riverrun/
│   │   ├── zh.html
│   │   └── en.html
│   ├── spectral-dissector/
│   │   ├── zh.html
│   │   └── en.html
│   ├── the-fet-mixer/
│   │   ├── zh.html
│   │   └── en.html
│   └── wwhbh/
│       ├── zh.html
│       └── en.html
│
├── audio/                        音频资源
│   └── ecce-homo.m4a
│
├── img/                         图片资源（部署用 WebP，原图留档于 originals/）
│   ├── ecce-homo.webp
│   ├── ecce-homo-still.webp
│   ├── edgedgedge.webp
│   ├── riverrun.webp           卡片封面
│   ├── riverrun-2.webp         项目页媒体区单图
│   ├── spectral-dissector.webp
│   ├── spectral-dissector-2.webp    项目页顶部介绍图
│   ├── the-fet-mixer.webp      卡片封面 + Gallery 首图共用
│   ├── the-fet-mixer-2.webp
│   ├── the-fet-mixer-3.webp
│   ├── wwhbh.webp
│   └── originals/             原图留档（不部署，.gitignore 排除）
│
├── docs/                        杂项文档（不部署，.gitignore 排除）
│   ├── Ecce Homo朗读稿.docx
│   └── 我们将会曾经在这里 2026.06.15.docx
│
├── scripts/                     开发工具与本地服务器
│   ├── server.py               本地 HTTP/HTTPS 服务器（支持 Range 请求）
│   ├── start-https.sh          启动脚本（默认 HTTP 8888，--https 启用 4443）
│   ├── push.sh                 GitHub 推送助手脚本
│   ├── localhost-cert.pem      SSL 证书（本地 HTTPS 用）
│   ├── localhost-key.pem       SSL 密钥
│   └── localhost-san.cnf       SSL 配置
│
└── js/                         （全局命名空间 App.*，按序加载）
    ├── app.js                 命名空间声明
    ├── i18n.js                App.I18n 公共 i18n 引擎
    ├── i18n-common.js         App.COMMON_I18N 公共字符串
    ├── autospace.js           App.autospace 中英/中数自动间距（U+2009）
    ├── nav.js                 App.renderBackNav / renderIndexNav
    ├── prefetch.js            站内链接悬停预取（link rel=prefetch）
    │
    ├── index-i18n.js          App.INDEX_I18N 首页 i18n 数据
    ├── index.js               首页逻辑
    │
    ├── works-i18n.js          App.WORKS_I18N 作品列表页 i18n 数据
    ├── works.js               作品列表页逻辑
    │
    ├── about-i18n.js          App.ABOUT_I18N 关于页 i18n 数据
    ├── about.js               关于页
    │
    ├── changelog-i18n.js      App.CHANGELOG_I18N 日志页 i18n 数据
    ├── changelog.js           日志页数据 + 渲染
    │
    ├── project-i18n.js        App.PROJECT_I18N 项目页 UI i18n 数据
    ├── project-data.js        App.projects 项目内容数据
    ├── audio-wwhbh.js         App.initMicButton WWHBH 音频交互
    └── project.js             项目页逻辑
```

### 作品描述加载规则

- `project-data.js` 中 `desc: { file: true }` 表示文本在 `data/{projectId}/{lang}.html` 中
- 运行时 `fillContent()` 检测 `desc.file`，fetch 对应 HTML 片段并设置 `innerHTML`
- 加载中显示 `…` 占位，加载失败则清空
- 语言切换时重新 fetch 对应语言文件
- HTML 片段为纯 HTML（无 `<html>/<body>`），源文件按句换行、空行分段，渲染时换行被浏览器折叠，段落由 `<br><br>` 控制
- 文本引用块使用 `border-left:3px solid #000; background:#f9f9f9; padding:12px 16px; font-size:13px; line-height:1.8` 的内联样式
- 引用块内外文原文（拉丁/德/英等）斜体（`<span style="font-style:italic">`），中文翻译正常显示
- 中文强调改为加粗而非斜体（`<span style="font-weight:700">`），因思源黑体等 CJK 字体无真正的斜体字形
- 轨道/章节标题加粗（`<span style="font-weight:700">`）

### 脚本加载规则

每个 HTML 的所有 `<script>` 统一放在 `<head>` 中并加 `defer`：浏览器并行下载、按文档顺序执行、不阻塞渲染。
加载顺序仍为 **app → i18n → i18n-common → autospace → nav → prefetch → 页面数据 → 页面逻辑**，
确保 `App.*` 引用在被使用前已声明。`defer` 脚本在文档解析完成后、`DOMContentLoaded` 前执行，
故 `document.body` 已存在，各页 IIFE 直接操作 DOM 安全（与原先放在 `<body>` 末尾等效但更早开始下载）。

### 性能与加载策略

详见 `PERFORMANCE.md`。要点：

- **首屏图片（卡片封面 / 项目页 hero 图）**：`decoding="async"` + `fetchpriority="high"`，保持默认 eager。
- **非首屏图片（Gallery 其余帧、Changelog 媒体）**：`loading="lazy"` + `decoding="async"`，进入视口才下载。
- **音频 / 视频**：`preload="none"`。`audio/ecce-homo.m4a`（12MB）与 Changelog `<details>` 内视频在用户点播放前不拉取。
- **字体**：`@font-face` 全部 `font-display:swap`（不阻塞首屏文字）；文字为主的页（about/works/changelog/project）
  在 `<head>` `<link rel="preload" as="font" crossorigin>` 预载 `SourceHanSansSC-Regular.woff2`；首页图片为主故不预载字体以免争抢带宽。
- **站内跳转预取**：`js/prefetch.js` 监听 `pointerover/focusin/touchstart`，对同源 `.html` 链接用
  `<link rel="prefetch" as="document">` 预取目标文档（`requestIdleCallback` 内、去重、省流量模式禁用），点击跳转近乎即时。
- **脚本**：全部 `defer` 置于 `<head>`，与 CSS 并行下载、不阻塞渲染。
