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
| 动画 | `300ms ease-out`（所有卡片同步过渡；`prefers-reduced-motion` 下 JS 计时归零并去除过渡） | 同左 |

### 卡片封面图

每张卡片为 `card-fallback`（文字层，白底）+ `card-image`（图片层，`object-fit:cover` 盖住文字）双层结构。无图片的卡片仅显示文字 fallback。

| 卡片 | 封面图 | 说明 |
|------|--------|------|
| the-just-type-study | `img/the-just-type-study.webp` | 机箱上下留白相等：`object-position:50% 72.5%`（桌面）/ `65%`（移动端，见 `css/index.css` 的 `.card-image--justtype`） |
| the-induction-mixer | `img/the-induction-mixer.webp` | 实物照片 |
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

## 7. Project 页 — 六种布局共用标准

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

### 作品副标题 `.work-sub`

**嵌在标题（h2）内部**的一行说明性副标题，位于标题文字与 h2 下边框之间，使副标题与标题成为一个整体 —— 与 Works 页 `.works-title` + `.works-brief` 的配对方式一致。

**不在描述片段里**，而是由 `js/project.js` 的 `setTitle()` 在填充标题时一并创建并 append 进 h2。这样它才会落在 h2 的下边框之上；若放在描述片段里，h2 的 `border-bottom` 会横在标题与副标题之间，两者无法成组。

| 属性 | 值 |
|------|-----|
| 选择器 | `h2 .work-sub`（后代选择器，靠 `.work-sub` 限定作用域） |
| 容器 | `display:block`（独占一行，位于标题文字之下） |
| 字号 / 字重 | `12.5px`（移动 `11.5px`）；`font-weight:400` |
| 颜色 / 间距 | `color:#888`；`letter-spacing:0.5px`；`line-height:1.5`；`margin-top:6px`（移动 `4px`） |
| **`text-transform`** | **必须显式写 `none`**，否则继承 h2 的 `uppercase`，中文副标题虽不受影响但英文副标题会全大写 |

**内容来源**：`project.subtitle[lang]`，作品未单独声明 `subtitle` 时**退回 `project.brief[lang]`**（见 `js/project.js`）：

```js
const sub = ((project.subtitle || project.brief || {})[App.I18n.currentLang]) || '';
```

因此只有需要**不同于列表简介**的副标题时才写 `subtitle` 字段。目前唯一写了该字段的是 THE INDUCTION MIXER（副标题用汇报原文「基于近场电磁感应的交互式矩阵电子混音器的乐器设计」，而 brief 是较短的「基于近场电磁感应的12输入4输出空间混音器」）；其余 7 件均由 brief 自动充当副标题。

**切语言安全**：`setTitle()` 每次都先 `el.textContent = t` 清空 h2（含上一次的副标题）再重建，因此语言切换不会累积多个副标题。

**只在作品页出现**，不进入首页卡片与 Works 列表（那两处仍只用 `project.title` / `project.brief`）。

### 作品信息栏 `.work-meta`

每件作品描述顶部的字段化事实块，在正文之前给出八项事实（年份、形态、规格、分工、公开记录、状态、本页文字、资料）。

| 属性 | 值 |
|------|-----|
| 容器 | `display:grid; grid-template-columns:88px 1fr`（移动 `72px 1fr`） |
| 间距 | `gap:3px 14px`（移动 `3px 10px`） |
| 边框 / 内距 | 上下 `3px solid #000`；`padding:14px 0`（移动 `12px 0`） |
| 字号 | `12.5px`（移动 `12px`）；`line-height:1.7`；`letter-spacing:0.5px` |
| 标签 `.work-meta-k` | `font-weight:700; color:#888; letter-spacing:1px` |
| 值 `.work-meta-v` | `color:#000; min-width:0`（允许长值在网格单元内换行） |
| 分节小标题 `.work-sec` | `display:block; font-weight:700; margin-bottom:8px` |

**实现约束**：作品描述被注入的容器在 grid / wwhbh / edge / gallery 四种布局里是 `<p>`（见 `project-template.html`），因此信息栏**只能用 `<span>` 构造** —— `display:grid` 只是 CSS，不影响 HTML 解析，`<span>` 是 phrasing content，安全。**不得使用 `<div>`／`<ul>` 等块级元素**，否则浏览器解析时会提前闭合 `<p>`，破坏页面结构。

**字段顺序**（固定八行）：创作年份 → 形态 → 规格 → 分工 → 公开记录 → 状态 → 本页文字 → 资料。

**语言**：中英各写一套标签，不共用。中文 `创作年份 / 形态 / 规格 / 分工 / 公开记录 / 状态 / 本页文字 / 资料`；英文 `Year / Type / Specs / Roles / Shown / Status / Page text / Media`。

**与正文尾部日期的关系**：`本页文字` 已记录文案撰写日期，故单篇作品说明的正文末尾**不再重复标日期**；分次撰写的笔记体作品（wwhbh、edgedgedge）正文中的日期**保留** —— 它们是"一次次回到这件作品"的记录，不是撰写时间。

**标点惯例**：正文列举特色 / 模块 / 参与项时，用**冒号引出 + 分号分隔**（沿用既有写法，如 6U104HP 的"我们在模块区上方和下方各留出了一条多功能区：……；……"、The JustType Study 的模块清单），不用顿号。

### 作品正文分节小标题：固定骨架

每件作品的正文用固定的七个小标题，顺序固定，由 `.work-sec` 承载。目的是让评审在 90 秒内能在任意一件作品上定位到同一类信息（六层标准见 `docs/研究生申请作品集审计.md`）。

| 槽位 | 中文 | 英文 |
|------|------|------|
| 1 | 作品简介 | Overview |
| 2 | 作品动机 | Motivation |
| 3 | 灵感溯源 | Where it comes from |
| 4 | 技术介绍 | How it works |
| 5 | 我的工作 | My contribution |
| 6 | 后完成 | Postlude |
| 7 | 公开记录 | Where it has been shown |

**为什么是这七个**：公开记录在最前（信息栏里）已给过一次事实，正文里再给一次出处与履历；灵感溯源单独成节，是因为"具名前人 + 我与他的差别"是评审判断作者学术坐标的主要依据，藏在动机里会被读漏。

**「后完成／Postlude」的造词说明**：中文是**生造词** —— 「后 + 完成」硬加前缀，照「后现代」（后 + 形容词）、「后摇滚」的造词法，故意在语法上别扭；词典里没有这个词。英文 Postlude 是 prelude 的对偶，指一部作品演完之后的收尾段。**不得改成「后记」「尾声」「反思」「Afterwards」等现成词** —— 现成词没有这个效果。

**允许带副标题**：当一节的内容比槽位更具体时，用「槽位名：具体说法」，如 riverrun 的「作品动机：错失感」「灵感溯源：为什么是这本书」「技术介绍：文本怎么拆」。冒号中文用全角，英文用半角 + 空格。

**允许增加作品专属节**：槽位之外可以有本作品独有的一节（如 riverrun 的「两个版本」「它和The Induction Mixer的关系」、wwhbh 的「正在发生的事」），但不得顶替任何槽位。

### 正文可折叠块 `.work-details` 与引文块 `.track-text`

用于把长引文从主叙述里移出来，保持正文可扫读。目前唯一使用者：riverrun 的三条核心轨道文本对照。

| 属性 | 值 |
|------|-----|
| 容器 `.work-details` | `border:2px solid #000; margin:0 0 16px` |
| 标题 `>summary` | `padding:10px 14px; font-size:13px; font-weight:700; letter-spacing:1px; list-style:none` |
| 标记 | `summary::before` 为 `'[+] '`，`[open]` 时为 `'[-] '`；隐藏 `::-webkit-details-marker` |
| hover | summary 黑底白字；展开时 summary 加 `border-bottom:2px solid #000` |
| 内容 `.work-details-body` | `padding:14px` |
| 引文 `.track-text` | `margin:0 0 16px; padding:12px 16px; border-left:3px solid #000; background:#f9f9f9; font-size:12.5px; line-height:1.9`（末项去下边距） |

样式与 changelog 的 `details` 一致，但用 class 作用域限定 —— `css/changelog.css` 里有裸元素选择器 `details{}`，只在 changelog 页加载，项目页若复用会形成耦合，故各自独立。

**默认收起**（不写 `open` 属性）。验证方式：`details` 渲染高度应 ≈48px（仅 summary），且内部元素 `checkVisibility()` 返回 `false`；展开后高度与可见性同步变化。

**窄栏适配**：mixer 布局的描述栏 `.mixer-desc` 只有 380px 宽（内容区 348px），信息栏的 88px 标签列在此过宽，故加 `.mixer-desc .work-meta{grid-template-columns:68px 1fr; gap:3px 10px}`。新增窄栏布局时需同样处理。

**断行检查**：中文字符间可任意断行，因此 `【…】`、`12–36V`、`2025.10.22–25` 这类不应拆开的记号必须包 `<span class="nb">`。riverrun 首版渲染中「【待确认】」曾被拆成「【待」「确认】」两行。

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
| 按钮 | `width:auto; border:3px solid #000; padding:8px 18px; 12px/700/1px` | 同左 |
| 按钮 i18n | `btnDeactivate` / `btnStart` / `btnRetry` | 同左 |
| 按钮激活态 | 黑底白字 (`.on`) | 同左 |

**麦克风状态与控制 `.wwhbh-mic`（2026-09-20 起为自动申请权限）**

页面加载即调用 `getUserMedia`，不再需要点击按钮启动。状态行紧贴标题与副标题之下，**不可移到页面末尾**：描述长达数千字，而挂起状态下「▶ 点击开始聆听」是必需的操作入口。

| 状态 | 状态行文案 | 按钮 |
|------|-----------|------|
| `requesting` | 正在申请麦克风权限… | 隐藏 |
| `suspended` | ▶ 点击开始聆听（整行可点，加 `clickable`） | 隐藏 |
| `running` | ● 正在聆听（加 `on`，黑色加粗） | 显示「关闭」 |
| `idle` | ■ 已停止 | 显示「开始」 |
| `denied` | 麦克风权限被拒绝 | 显示「重试」 |
| `unavailable` | 此作品需要 localhost 或 HTTPS | 隐藏 |

- 文案键：`micRequesting` / `micSuspended` / `micRunning` / `micIdle` / `micDenied` / `micUnavailable` / `btnDeactivate` / `btnStart` / `btnRetry`（`js/project-i18n.js`）
- **`idle` 必须是独立分支**：用户主动关闭后，按钮和状态行都要留下重新开始的入口。曾经把 `idle` 落进「requesting／suspended／unavailable」那组兜底分支（它们的处理正好相反：不显示按钮），结果按钮被 `display:none` 隐藏、状态行被清空，页面再也回不到聆听状态
- 布局：`.wwhbh-mic` 为 flex，状态行 `flex:1`，按钮 `width:auto`（不再满宽）；移动端 gap/字号/padding 另行收窄
- **浏览器限制**：`getUserMedia` 无需手势，但 `AudioContext` 受自动播放策略约束。流程为「自动申请 → 建图 → 立即 resume → 失败则等页面任意首次手势（pointerdown／keydown／touchend）恢复」。挂起期间必须保留可点提示，这是无法绕过的限制
- **隐私**：麦克风自动开启，因此运行中必须始终提供显式关闭入口（按钮为「关闭」）
- 对外接口：`App.initWwhbh(btnEl, statusEl)` 与 `App.refreshWwhbhUI()`（语言切换时刷新状态行与按钮文案，不改运行状态）

**实时晕染层 `.wwhbh-ink`（`js/ink-wwhbh.js`）**

页面背后一层灰色的、像墨在纸上毛细扩散的图，**是本页唯一的视觉元素**，与上表的聆听状态同步：`running` 时从左下屏幕外生长、90 秒铺满；`idle` 时冻住；再次 `running` 时冻住的那张一边扩散一边溶解掉（3 秒），**同时**新的一张立刻在底下开始长。

**形态**：不是「一团灰」，是**毛细渗流**。前缘沿渗透率高的通道窜出放射状的手指，手指会分叉，与起点不连通的快通道变成漂在主前缘前面的孤岛。

**做法**：脊状多重分形（ridged multifractal）造渗透率场 `v(x,y)`，极坐标采样使特征沿半径拉长，再解程函方程 `|∇T| = 1/v` 得到「前缘第几刻到达该像素」。**不要退回「距离 × 噪声」的写法** —— 普通值噪声只能让前缘变毛糙，不能让手指分叉，画出来就是一坨圆灰块（作者评语：「像一杯水泼上去」）。

| 属性 | 值 |
|------|-----|
| 层 | `position:fixed; inset:0; **z-index:200**; pointer-events:none; overflow:hidden`（200 > 导航的 100，所以**墨盖在整个页面与导航之上**） |
| canvas | `width:100%; height:100%`（内部缓冲区 = 视口的 **1/2**，由 CSS 放大铺满） |
| 关闭按钮 | **无豁免**，和别的内容一样被墨埋（作者：「不要给关闭加遮罩了，直接彻底遮住」） |
| 生成耗时 | 一次性（渗透率场 + 程函求解 + 墨深分档）。实测 **1/2 分辨率约 108ms**（画布 720×335；1440×757 视口下 720×379 约 120ms），1/3 分辨率约 52ms，基本随像素数线性。旧的「约 106ms」是错的，已改正 |
| 墨深 | **分两层**：`base` 累积层（跨 90 秒轮次加深）+ 当前层。单轮三档**连续**：最淡 10%（1–3%）、浅 70%（→26%）、深 20%（→50%），`SOAK = 1.0`。手机端整体 ×0.72 |
| 到纯黑 | 靠**每 90 秒一轮的累积**，不是一遍（单轮最深 `DARK_MAX = 0.50`）。但因为每轮有一次损失通道，它**到不了纯黑**：实测平衡态最深深在 216–226/255（85–89%）之间摆动。**累积只存在于当前页面会话，刷新即清零** |

几条不许改的硬约束（每一条都是实测踩出来的，细节见 `程序编写说明.md` §8.5）：

- **第一遍不能出现纯黑**（作者明确要求）：单轮由 `DARK_MAX = 0.50` 封住（实测第一轮满铺 max = 127/255），再深只能靠累积层一轮轮逼近 —— 而累积层又被 `DECAY_PER_CYCLE` 拉住，最后停在动态平衡。改 `DARK_MAX` 时别把它当成「总上限」
- **面积配比必须按百分位切，不能靠调噪声参数碰**：目标是「最淡 10% / 浅 70% / 深 20%」，做法是用直方图求分档场的 p10 与 p80 再切三档，面积比例精确成立。实测 10.1% / 69.7% / 20.2%
- **「留白」不是 0**（作者明确）：「我的留白要求不是数学意义上留白，而是比较淡」，第三档是 1%–3% 的淡底
- **三档之间必须是连续单调曲线，不能有跳变**（作者：改成柔和浸开）。每段的端点等于相邻段的端点，深色块因此块心最深、往外渐淡。代价：**用阈值去量面积会偏**（实测 13.1/67.1/19.8 而非 10/70/20）—— 百分位构造本身是精确的，含糊来自软边界，这是要的效果，不是 bug
- **墨盖住全部内容，且不吃点击**（作者：「全部盖住，包括标题」）：墨层 `z-index:200` 高于内容与导航，但 `pointer-events:none` 让底下一切仍可正常点击（实测按钮处 `elementFromPoint` 返回 `btn-mic`）
- **关闭按钮不做任何视觉豁免**：早先按作者要求做过「按钮处把墨压淡 40%」，后来作者改为「不要给关闭加遮罩了，直接彻底遮住」，那套机制（视口矩形换算、羽化、周期刷新、scroll 监听）已整个删除。按钮仍然**可点**（墨层 `pointer-events:none`），只是会随轮次被埋掉。**不要为了「让用户找得到关闭按钮」再加回透亮区。**
- **墨只在 `running` 时出现，这是有意为之，不是缺陷**（作者定案：「这是一个观念作品，它应该自洽」）。权限被拒 / 非安全上下文 / 音频挂起三种失败状态都实测过：非零像素为 0，canvas 连初始化都没发生（尺寸仍是默认的 300×150）。**不要为了让评审「至少看到画面」而在失败状态下也让它晕染** —— 墨是「90 秒延时正在填满」的可视化，声音没在流动时它长起来就是在撒谎
- **重启洗掉的是「整场录音」的全部痕迹，而且要用「扩散」的方式洗掉**（作者：「重启也用同一套」）：先把当前这一轮 `bake()` 进 `base`（于是 base 就是屏幕上现在的一切），再让整层一边扩散一边变淡，3 秒后清零（`FADE_MS = 3000`）。**不要退回「整体均匀淡出」**。这一条曾漏掉「累积层没参与」，作者实测「洗不掉」才发现
- **`FADE_MS` 与 `FADE_DIFFUSE_STEPS` 必须成对改**：溶解期间每帧都画（不受 `FRAME_MS` 限制），总扩散步数 = 帧数 × `FADE_DIFFUSE_STEPS`，而帧数 ∝ `FADE_MS`。只把 `FADE_MS` 翻倍会让墨在消失时多摊一倍。现值 3000 / 1；作者要求「旧墨水消失速度太快，减半」
- **两条带用两个场**：浅色带 ← 柔和场（4 倍频 pers 0.45），深色带 ← 颗粒场（6 倍频 pers **0.68**）
- **形状的两个旋钮各有一条反面教训**：`D_WARP` 大了边缘变触手（0.35 被否）、`D_PERS` 小了等值线是圆的（0.5 被否）。定稿 `D_WARP = 0.08`、`D_PERS = 0.68`。**不要用「fBm + 脊状」混合来补深色** —— 脊状成分会把触手一起带回来（实测）
- **墨深必须来自笛卡尔采样的脊状场，不能复用渗透率场** —— 渗透率场是极坐标采样的（为了放射状手指），倍频一叠就严重走样，在原来 15% 浓度下看不出来，取消上限后会显影成一圈圈木纹。纹理归纹理、流动归流动
- **长时间后画面会收敛成一片中间灰，而不是「饱和成黑板」**：旧实现没有损失通道，alpha 合成的每轮增量 ∝ `(1 − base)`、几何式递减，实测 max 每轮 +38 → +23 → +5 → +1，约 4 轮后变成一块黑板。现在每轮一次的损失通道把它换成**动态平衡**：永远在动、永远到不了纯黑，实测终态全画面均值约 66%、最深 85–89%。**三档结构在终态不存在，这是作者定案保留的，不是故障**（详见 `程序编写说明.md` §8.5.9 与 §8.5.11）
- **累积层 `base` 只在当前页面会话内**。刷新清零；改窗口尺寸也会重建（旋转屏幕会丢掉已积累的墨）
- **重新开始时绝不能让旧图冲到全屏**：现在重启是**扩散式溶解**（`FADE_MS = 3000`、`FADE_DIFFUSE_STEPS = 1`），前缘不再往前冲，只是整层一边摊开一边变淡、3 秒归零。旧版让前缘在 0.66 秒内冲到「铺满再冲出屏幕」（那套 `FADE_RATE` / `BLOOM_TO` 已整个删除），只录了几秒时一小块墨会被瞬间吹满整屏（作者明确否掉）。溶解期间**新图立刻在底下开始长**
- **`SOFT = 0.09` 是「模糊」与「看得见手指」的平衡点**：调到 0.20（屏幕上约 180px）时过渡带宽过手指间距，整个放射结构被糊成一片均匀渐变，**实测完全看不见手指**；0.09 与第一版模糊程度相当而结构保得住
- **`SCALE = 2.0`**：内部画布 = 视口 / 2（`MIN_W/MAX_W` 300/800）。沿革：4.5 → 3.0（4.5 倍放大把手指抹平）→ **2.0**（3.13 倍放大时，噪声里 grid 128 那一档只有 3.6 像素一个周期、已到奈奎斯特，屏幕上显成一簇簇「疙瘩」，作者描述为「像素和色块感」）。**这是分辨率问题的根因：噪声最高频必须远离奈奎斯特**，否则一放大就是块
- **旧墨随时间扩散 + 每轮一次衰减，两者缺一不可**：扩散（五点拉普拉斯）是**保量**的，只把墨铺开、峰值降低、面积增大 —— 所以「变浅」是扩散自然带来的，不额外减淡；但保量扩散挡不住墨量随轮次单调增加，**没有损失通道就一定会到纯黑**，而作者要的是「动态平衡、永远不到纯黑」。损失通道是每轮一次的 `DECAY_PER_CYCLE = 0.92`。固定点 `b = d·L/(1 − d + d·L)`
- **这 0.92 必须摊进本轮的 15 次扩散步，不能在换轮那一帧一次扣掉**（每步 `DECAY_PER_STEP = 0.92^(1/15) ≈ 0.99446`）。一次扣掉会让整屏在**一帧**里掉 8% —— 作者实测到的「瞬间全屏阶梯式变浅」就是这个：实测均值 41.169 → 37.500、最深 127 → 116（127 × 0.92 = 116.8）。摊开之后每轮总量不变、平衡点不动，只是把 8% 分到 90 秒里。**`DECAY_PER_STEP` 必须声明在 `AGE_STEPS_MAX` 与 `DECAY_PER_CYCLE` 之后**（暂时性死区）。`diffuseBase(steps, decay)` 的第二个参数默认 1，重启溶解时不传
- **扩散只作用于 `base`**（已沉淀的旧墨），正在长的那一轮保持清晰（作者：「只有沉淀下来的旧墨会变」）
- **扩散有步数上限**（`AGE_STEPS_MAX = 15`/轮，半径 ≈ 2.6 内部像素 ≈ 5 屏幕像素），空间上会停住；衰减没有上限。原为 60 —— 作者要求「随时间晕染开来的效果太明显了，变为现在的四分之一程度」。**注意两个量不是同一比例**：每轮转移的墨量（＝变浅多少）∝ 步数（60→15 正好 ÷4），摊开的距离 ∝ √步数（只能 ÷2）。要「距离也 ÷4」得把 `DIFFUSE_K` 一并降到 0.055
- **`AGE_STEP_MS` 必须由 `GROW_MS / AGE_STEPS_MAX` 推出来，不能写死**：作者要求「在下一轮铺满屏幕的时候完成上一轮晕染，这样上一轮和下一轮在时间上是没有间隙的」。写死 1500ms 会让 15 步在 22.5 秒内走完、剩下 67.5 秒什么都不发生
- **本轮的扩散预算必须按 `acc` 算，不能按「距上次多少毫秒」算**（`due = floor(acc / AGE_STEP_MS)`，上限 `AGE_STEPS_MAX`，再补跑 `due - ageSteps` 步）。按毫秒间隔时每一步都被帧量化往后拖几毫秒，15 步累计超过 90000ms，**第 15 步永远被换轮截掉**：实测旧写法每轮只跑成 14 步、损失通道变成 `0.994457^14 = 0.92513` 而不是 `0.92`；按 `acc` 算则恰好 15 步 = `0.92000`。`acc` 就是换轮的时钟，这样也顺带删掉了 `lastAge` 这个状态变量
- **`AGE_STEP_MS` 必须声明在 `AGE_STEPS_MAX` 之后**：它引用后者，而 `const` 有暂时性死区，写反了会在脚本加载时直接抛 `Cannot access 'AGE_STEPS_MAX' before initialization`。**`node --check` 只查语法、查不出这个，必须用浏览器实跑验证**（本轮踩了一次）
- **`ANG_K = 7`、`RAD_K = 1.15`、`V_GAIN = 8`**：角度频率（手指密度、宽度）、半径频率（越大手指越短）、通道对比。原为 10 / 0.8 / 10 —— 作者在第一轮早期看到「一排长度、宽度都均匀的细长针刺」：`ANG_K` 高使针细而密、`RAD_K` 小使针拉得长、`V_GAIN` 高把前缘切成一根根独立的长针。`V_GAIN` 取 4 时又短而糊
- **`ANG_JITTER = 0.6`**：给角度叠低频噪声以破掉「海胆」式完全对称；**调到 1.2 以上会把径向通道彻底打散，变成一团云雾**
- **打破「针刺均匀」靠的是角度调制，不是 `ANG_K`/`RAD_K`**：实测只改 `ANG_K`/`RAD_K` 而不加调制，前缘依然是一整排等长等宽的扇形细针（作者：「针刺状……长度宽度均匀并且细长」）。做法是把渗透率再乘一个低频角度包络 `r *= ANG_ENV_LO + ANG_ENV_HI · e`，手指才变得长短不一、粗细不一并且弯曲。`ANG_ENV_F = 0.72` 是试出来的：更疏（0.42）会把整排手指抹成一两道大瓣，更密则等于没有调制
- **种子半径必须由「画面内离起点最近的像素」算出来**（`dmin * 1.5 + 2`），**不可写死**：起点探出屏幕外 5%，这个距离随画布尺寸变化（320px 画布 18px、480px 画布 27px）。写死会让大画布下一颗种子都种不下去，整场求解全 INF、归一化后整屏同时上墨然后彻底不动
- **「最淡 10% / 浅 70% / 深 20%」是单轮的性质，不是终态的性质 —— 这是作者定案保留的，不是故障**。到了动态平衡画面会收敛成一片中间灰（实测全画面均值约 66%，峰值 200–225 摆动，三档结构消失）。作者原话：「合理，就这样」。**不要为了让终态保住三档而自行调 `DIFFUSE_K` / `AGE_STEPS_MAX` 或把 `base` 分层**；真要改先问
- **页面不可见时计时照常走 —— 作者定案**（「音频不应该停，墨水也应该在后台不停」）。代码里没有任何 `visibilitychange` / `document.hidden` 分支，`acc` 累计真实时间差，回前台由换轮分支的 `n` 一次补齐（上限 20）。**不要加「后台挂起」逻辑** —— 切后台时声音仍在跑，计时停下来反而与音频不一致
- **`density` 只用低频小幅度噪声**：换成脊状纹理会让上墨区域内部变成一团雾
- **起点只探出屏幕外 5%**：探太多（试过 16%）会让开头十几秒什么都看不见
- **归一化前先减最小值**：起点在屏幕外，最近的可见像素本就有约 18px 行程，不减掉开头几秒浓度会被舍入成 0
- **`GROW_TO = 1 + SOFT`**：取 1 则最远角永远停在透明；取更大值会提前铺满、末尾空转
- **生长阶段锁 ~15fps**：铺满要 90 秒，60fps 无意义；只有 3 秒的重启溶解跑满帧
- **每次结果必须不同**：种子取自 `crypto.getRandomValues()`。改窗口尺寸不换种子（那只是重新光栅化，不是「重新开始」）
- **`prefers-reduced-motion` 时整层不启动**，与首页 `js/index.js` 的处理一致
- 音频侧不受它影响：90 秒延时与反馈全部是 Web Audio 原生节点，音频路径里没有 JS


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
| 滑动区 `.gallery-slider` | `max-width:800px; height:56vh; max-height:520px; min-height:300px; scroll-snap-type:x proximity` | 移动端 `height:46vh; max-height:380px; min-height:240px` |
| 滑动条样式 | `::-webkit-scrollbar 3px; thumb:#000; track:#f0f0f0` | 同左 |
| 单张 `.gallery-slide` | `flex:0 0 auto; scroll-snap-align:start` | 同左 |
| 图片 | `height:100%; width:auto; object-fit:contain`（等高胶片条） | 同左 |

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

### 7f. Mixer 布局（riverrun 交互式空间混音）

riverrun 作品页的交互式空间混音器，复现 The Induction Mixer 的交互逻辑：12 条音轨在 Canvas 面板上排布为带编号的黑点，点半径随响度脉动；光标（虚拟麦克风）离点越近该轨音量越大。全屏面板，Web Audio API 驱动。

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 面板 `.mixer-panel` | 纵向：`flex-direction:column; height:100vh; max-width:1080px; margin:0 auto`（整体收窄居中，标题横跨顶部） | 上下分栏：`flex-direction:column; height:auto; min-height:100dvh; padding:64px 12px 48px; overflow:visible`（页面自然滚动） |
| 内容行 `.mixer-body` | `flex:1`（行：舞台 + 说明列） | `flex-direction:column; flex:none` |
| 标题区 `.mixer-header` | 横跨面板顶部，仅标题，无副标题 | 同左 |
| 舞台 `.mixer-stage` | `flex:1; border:3px solid #000; position:relative`（与说明列纵向对齐等高） | `height:40dvh; flex:none` |
| 说明列 `.mixer-desc` | 右侧 `width:380px; overflow-y:auto; border:3px solid #000`（与舞台纵向对齐） | 交互下方，无边框、透明背景、随页面滚动 |
| Canvas `.mixer-canvas` | `position:absolute; inset:0; touch-action:none; cursor:crosshair` | 同左 |
| 启动按钮 `.btn-mixer` | 黑底白字、`3px` 边框、居中覆盖 | `13px` 字号 |
| HUD 控件 | 右上角仅 STOP | 同左 |
| 增益 | 无 UI 控件：增益只由麦克风光标外圈半径 + 增益弧指示，桌面滚轮（wheel）调节、手机固定 100%、手写笔 pressure | 同左 |
| 交互 | 鼠标常驻一只麦克风（滚轮调增益）；触控每指一只（手机固定增益 100%） | 同左 |
| 逻辑位置 | `js/mixer-riverrun.js` 的 `App.initRiverrunMixer()`，`js/project.js` 的 mixer 分支初始化 | |

> Gallery 布局适用于有多张图片需要展示的作品（如硬件作品），图片从 `project-data.js` 的 `media.images` 数组渲染，不在描述 HTML 中内嵌。

> **布局选择规则**：含视频的作品统一使用 Edge 布局（`layout:'edge'`），含多张图片的作品使用 Gallery 布局（`layout:'gallery'`），单张图片置于文字上方用 Ecce 布局（`layout:'ecce'`），交互式空间混音作品使用 Mixer 布局（`layout:'mixer'`），均不得使用 Grid 布局的左右分栏。Grid 布局仅用于无媒体或单张图片（左右分栏）的场景。

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
├── .gitignore                 Git 忽略规则（含 docs/、tmp/、img/originals/、本地 HTTPS key/cert）
│
├── css/
│   ├── base.css               全局 reset + 基础 + @font-face
│   ├── nav.css                导航栏（两种变体）
│   ├── index.css              首页卡片堆叠
│   ├── about.css              关于页
│   ├── works.css              作品列表页
│   ├── changelog.css          日志页时间线
│   ├── project.css            项目页六种布局
│   └── fonts/                 自托管 webfont（DejaVu Sans Mono + 思源黑体 SC + PlainZero woff2，子集化）
│
├── data/                        作品描述 HTML 片段（运行时 fetch 加载）
│   ├── 6u104hp/
│   │   ├── zh.html
│   │   └── en.html
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
│   ├── the-induction-mixer/
│   │   ├── zh.html
│   │   └── en.html
│   ├── the-just-type-study/
│   │   ├── zh.html
│   │   └── en.html
│   └── wwhbh/
│       ├── zh.html
│       └── en.html
│
├── audio/                        音频资源
│   ├── ecce-homo.m4a
│   ├── the-just-type-study.m4a
│   └── riverrun/               riverrun 12 条音轨（1.m4a ~ 12.m4a）
│
├── img/                         图片资源（部署用 WebP，原图留档于 originals/）
│   ├── ecce-homo.webp
│   ├── ecce-homo-still.webp
│   ├── edgedgedge.webp
│   ├── riverrun.webp           卡片封面
│   ├── riverrun-2.webp         备用图（riverrun 现为 mixer 布局，不引用）
│   ├── spectral-dissector.webp
│   ├── spectral-dissector-1.webp    项目页介绍内嵌图1（初版 M4L 截图）
│   ├── spectral-dissector-2.webp    项目页顶部介绍图
│   ├── the-induction-mixer.webp      卡片封面 + Gallery 首图共用
│   ├── the-induction-mixer-2.webp
│   ├── the-induction-mixer-3.webp
│   ├── the-just-type-study.webp        卡片封面
│   ├── the-just-type-study-still.webp  项目页顶部图（Ecce 布局）
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
│   ├── localhost-cert.pem      SSL 证书（本地生成，.gitignore 忽略）
│   ├── localhost-key.pem       SSL 密钥（本地生成，.gitignore 忽略）
│   └── localhost-san.cnf       SSL 配置（--https 缺证书时据此自动生成）
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
    ├── audio-wwhbh.js         WWHBH 音频交互（自动申请权限 + 六态状态机）
    ├── ink-wwhbh.js           WWHBH 实时晕染层（与聆听状态同步的 Canvas）
    ├── mixer-riverrun.js      App.initRiverrunMixer riverrun 空间混音器
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
- **音频 / 视频**：单文件音频（`audio/ecce-homo.m4a` 12MB、JustType 录音）与 Changelog `<details>` 内视频 `preload="none"`，用户点播放前不拉取；riverrun 12 条音轨由 `js/mixer-riverrun.js` 设为 `preload="metadata"`（弱网不预缓冲 17MB，播放时才拉流）。
- **字体**：`@font-face` 全部 `font-display:swap`（不阻塞首屏文字）；文字为主的页（about/works/changelog/project）
  在 `<head>` `<link rel="preload" as="font" crossorigin>` 预载 `SourceHanSansSC-Regular.woff2`；首页图片为主故不预载字体以免争抢带宽。
- **站内跳转预取**：`js/prefetch.js` 监听 `pointerover/focusin/touchstart`，对同源 `.html` 链接用
  `<link rel="prefetch" as="document">` 预取目标文档（`requestIdleCallback` 内、去重、省流量模式禁用），点击跳转近乎即时。
- **脚本**：全部 `defer` 置于 `<head>`，与 CSS 并行下载、不阻塞渲染。
