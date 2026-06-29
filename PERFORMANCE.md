# 性能优化方案

> 目标：在不引入构建步骤、不改变视觉与交互的前提下，显著降低首屏时间与体感延迟。
> 部署环境：GitHub Pages（静态、HTTP/2、Brotli/Gzip、无法自定义响应头）。

---

## 一、现状与瓶颈分析

### 1. 资源体积（部署态，已排除 `.gitignore` 项）

| 类别 | 体积 | 说明 |
|---|---|---|
| CJK 字体（思源黑体 SC Reg+Bold） | **613 KB** | 每个页面都会拉取，首次访问最大单项 |
| 英文/数字字体（DejaVu+PlainZero） | ~48 KB | 体积小，可忽略 |
| 首页 6 张卡片封面（WebP） | 348 KB | 全部首屏可见 |
| `audio/ecce-homo.m4a` | **12 MB** | 仅 ecce-homo 项目页用 |
| `js/changelog.js`（内联数据） | 33 KB | 仅 changelog 页 |
| 单页 JS 总量 | 12–43 KB | 多个小文件，HTTP/2 下非瓶颈 |

### 2. 加载链路上的问题（优化前）

1. **脚本阻塞 + 发现晚**：所有 `<script>` 放在 `<body>` 末尾、无 `defer`。虽然浏览器预扫描会提前发现，但执行阶段仍串行阻塞，且无法与 CSS 并行下载做到最优。
2. **12 MB 音频立即拉取**：ecce-homo 页 `<audio controls>` 默认 `preload="auto"`，进入页面即下载 12 MB。
3. **B 站播放器整页加载**：Edge 布局（EDGEDGEDGE）一进入就加载 `player.bilibili.com` 的 iframe 及其全部 JS/资源，无 `preconnect`。
4. **非首屏媒体全部 eager**：Gallery 水平 slider 里的后续帧、Changelog `<details>` 折叠区里的图片/视频，都立即下载。
5. **字体发现晚**：`@font-face` 在 `base.css` 内，浏览器要等 CSS 解析后才发起字体请求（多一跳）；虽有 `font-display:swap` 不阻塞文字，但 swap 时机偏晚。
6. **跳转无预取**：点首页卡片 → 项目页，每次都是冷启动，无任何 `prefetch`。

---

## 二、已实施优化（Tier 1：零构建、低风险）

### A. 脚本全部 `defer` 置于 `<head>`（全站 5 个 HTML）

`<script defer>` 与 CSS 并行下载、按文档顺序执行、不阻塞渲染。`defer` 脚本在文档解析完成后、`DOMContentLoaded` 前执行，`document.body` 已存在，故各页 IIFE 直接操作 DOM 与原先放 body 末尾等效，但下载时机更早。

- 涉及：`index.html` / `works.html` / `about.html` / `changelog.html` / `project-template.html`
- 核心脚本顺序：`app → i18n → i18n-common → autospace → nav → prefetch → 页面数据 → 页面逻辑`

### B. 12 MB 音频改为按需加载

`js/project.js` 中 ecce 音频加 `audio.preload = 'none'`：进入 ecce-homo 项目页不再下载 12 MB，用户点播放才拉取。**该页首屏从 12 MB+ 降到 ~0（音频部分）**。

### C. 非首屏媒体懒加载

- Gallery 后续帧：`img.loading = 'lazy'` + `decoding = 'async'`（水平 slider 内只有首帧可见）
- Changelog 媒体：图片 `loading="lazy"`，视频 `preload="none"`（在折叠的 `<details>` 内，展开并播放前不拉取）

### D. 首屏图片优先级提升

- 首页 6 张卡片封面：`decoding="async" fetchpriority="high"`（均为首屏可见，提高与字体/JS 的抢带宽优先级）
- 项目页 hero 图（Grid/Edge/Ecce 单图）：`decoding="async"` + `fetchPriority="high"`

### E. 关键字体预载

`about / works / changelog / project` 四个文字为主的页面，在 `<head>` 加：
```html
<link rel="preload" as="font" type="font/woff2" crossorigin href="css/fonts/SourceHanSansSC-Regular.woff2">
```
让字体与 CSS 并行下载、`swap` 更早发生。`crossorigin` 必填（字体按 CORS 模式请求，否则预载不会被复用 → 重复下载）。
**首页不预载字体**：首页图片是 LCP 主角，预载 300 KB 字体会与之争抢带宽，得不偿失；少量 CJK 文字靠 `swap` 即可。

### F. 站内跳转悬停预取（新文件 `js/prefetch.js`）

监听 `pointerover / focusin / touchstart`，对同源 `.html` 链接在 `requestIdleCallback` 内注入 `<link rel="prefetch" as="document">` 预取目标文档。去重、省流量模式（`navigator.connection.saveData` / 2g）自动禁用。**悬停 → 点击之间通常有 100–300 ms，足以预取完成，跳转近乎即时**。已加入全站核心脚本。

### 预期收益（首屏，相对优化前）

| 页面 | 主要节省 |
|---|---|
| index | 脚本并行下载更早；卡片图优先级提升 |
| project（ecce-homo） | **−12 MB**（音频改按需） |
| project（gallery） | 后续帧懒加载 |
| changelog | 折叠区媒体懒加载；字体预载 |
| works / about | 字体预载，swap 更早 |
| 全站跳转 | 悬停预取，体感即时 |

---

## 三、进一步建议（未实施，需决策或构建步骤）

### Tier 2 —— 中等收益，可手工或半自动

1. **重新编码 `ecce-homo.m4a`**：12 MB 偏大。转为 Opus（`.opus`/`.webm`）或低码率 AAC，可压到 2–3 MB，音质对该场景足够。需手动转码并更新 `project-data.js` 的 `audio` 字段（注意浏览器兼容：`.m4a` 兼容性最好，`.opus` 需 Safari 17+）。
2. **字体子集化拆分**：用 `pyftsubset` 把 613 KB 的思源黑体按使用频率拆成「常用字 + 罕用字」两个 `unicode-range` 子集。常用子集 ~120 KB 覆盖 99% 文字、首屏即载；罕用字按需加载。需一次性脚本，不改变现有 `@font-face` 结构（多声明一条 `unicode-range` 即可）。
3. **首页卡片 LQIP（低质量占位）**：每张封面再生成一个 ~1 KB 的模糊缩略图，图片加载前先显示模糊占位、加载完替换。需生成脚本 + 改 `index.html`/`index.css`。
4. **CSS 合并**：当前每页 3 个 CSS（base+nav+page）。HTTP/2 下非瓶颈，且 base/nav 跨页可缓存。如要极致可合并为单页一个 `*.min.css`，但破坏模块化，**不建议**。

### Tier 3 —— 高收益但引入运行时/构建

1. **Service Worker 缓存**：注册 SW 预缓存字体、CSS、JS、图片，二次访问全部走缓存、可离线。GitHub Pages 无法自定义头，SW 是唯一能控制缓存策略的方式。注意部署更新时的缓存失效（版本号 + 清单）。
2. **`changelog.js` 数据外置 + 按需**：33 KB 内联数据每次进 changelog 页都全量下载。可拆为 JSON 按年/按需 fetch，或保留现状（33 KB 在 HTTP/2+Brotli 下 ~10 KB，影响有限）。
3. **图片响应式 `srcset`**：项目页 hero 图可提供多分辨率，按 DPR/视口选最合适的一档，移动端省流量。需生成多档图。

---

## 四、验证方法

1. **Chrome DevTools → Lighthouse**：对每个页面跑 Mobile/Desktop，关注 LCP / TBT / TTI。
2. **Network 面板**：「Disable cache」+「Slow 4G」节流，对比优化前后：
   - ecce-homo 页：进入时不应出现 12 MB 的 `ecce-homo.m4a` 请求（点播放才出现）。
   - 首页：6 张卡片图应带「High」优先级；字体不应在首页被 `preload`。
   - works/about/changelog/project：应见 `SourceHanSansSC-Regular.woff2` 的 `(preload)` 请求。
3. **悬停预取**：Network 面板勾选后，鼠标悬停首页卡片，应见一条 `prefetch` 类型的 `project-template.html` 请求。
4. **CLS**：卡片图在固定尺寸容器内 `object-fit:cover`，无布局偏移；Gallery 首帧之外懒加载，注意观察 slider 是否因懒加载图高度跳动（已用 `flex:0 0 100%` 约束宽度，高度由首帧撑起）。

---

## 五、改动清单

| 文件 | 改动 |
|---|---|
| `js/prefetch.js` | **新增**：站内链接悬停预取 |
| `js/project.js` | 音频 `preload=none`；Gallery 图懒加载；hero 图 `fetchPriority=high` |
| `js/changelog.js` | 媒体图懒加载、视频 `preload=none` |
| `index.html` | 脚本 `defer` 入 head；卡片图 `decoding`/`fetchpriority` |
| `works.html` / `about.html` / `changelog.html` | 脚本 `defer` 入 head；字体 `preload` |
| `project-template.html` | 脚本 `defer` 入 head；字体 `preload` |
| `STYLEGUIDE.md` | 更新「脚本加载规则」；新增「性能与加载策略」 |

> 回滚：所有改动为增量、无破坏性。若预取出现问题，单独移除对应片段即可，不影响其余。
