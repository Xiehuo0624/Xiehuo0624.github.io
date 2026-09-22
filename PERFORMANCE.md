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
| 首页 8 张卡片封面（WebP） | 约 1.5 MB（以实际构建为准） | 全部首屏可见 |
| `audio/ecce-homo.m4a` | **12 MB** | 仅 ecce-homo 项目页用 |
| `audio/riverrun/1..12.m4a` | 约 **17 MB** | 仅 riverrun 页启动混音后按需拉流（`preload="metadata"`） |
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

### A. 脚本全部 `defer` 置于 `<head>`（全站 6 个 HTML + 16 个作品生成页）

`<script defer>` 与 CSS 并行下载、按文档顺序执行、不阻塞渲染。`defer` 脚本在文档解析完成后、`DOMContentLoaded` 前执行，`document.body` 已存在，故各页 IIFE 直接操作 DOM 与原先放 body 末尾等效，但下载时机更早。

- 涉及：`index.html` / `works.html` / `about.html` / `changelog.html` / `404.html` / `project-template.html`
  （作品生成页 `works/<id>/` 沿用模板的同一套加载策略，见 §二 E）
- 核心脚本顺序：`app → i18n → autospace → nav → prefetch → 页面数据 → 页面逻辑`
- **例外（2026-09-21 补）**：用于「绘制前定布局／定文案」的同步脚本：
  `project-template.html` 的 `js/app.js` + `js/project-data.js`（4.8KB，定布局面板）、
  `works.html`／`changelog.html` 的 `js/app.js` + 该页 i18n 数据（约 0.9KB）、`about.html` 同（4.6KB）。
  不同步就会在 defer 到达之前先画出 HTML 里的默认中文，或项目页 CSS 默认可见的 grid 样板——
  实测闪烁量：项目页样板 719ms、changelog 中文标题 **1838ms**、首页标签页标题 2.7–2.9s、about 190ms、works 150ms。
  这些文件都与 CSS 并行下载，实测首屏时刻无回归（详见 STYLEGUIDE §7g、§8a）。

### B. 12 MB 音频改为按需加载

`js/project.js` 中 ecce 音频加 `audio.preload = 'none'`：进入 ecce-homo 项目页不再下载 12 MB，用户点播放才拉取。**该页首屏从 12 MB+ 降到 ~0（音频部分）**。

### C. 非首屏媒体懒加载

- Gallery 后续帧：`img.loading = 'lazy'` + `decoding = 'async'`（水平 slider 内只有首帧可见）
- Changelog 媒体：图片 `loading="lazy"`，视频 `preload="none"`（在折叠的 `<details>` 内，展开并播放前不拉取）

### D. 首屏图片优先级提升

- 首页 8 张卡片封面：`decoding="async" fetchpriority="high"`（均为首屏可见，提高与字体/JS 的抢带宽优先级）
- 项目页 hero 图（Grid/Edge/Ecce 单图）：`decoding="async"` + `fetchPriority="high"`

> **实测复核（2026-09-21，独立审计 + 复测，未改动本节的设置）**：8 张封面的 `high` 会把 defer 脚本链
> 挤出带宽 —— 首页四角导航实测 3220ms 才出现（把 8 张降为默认优先级后 621ms）；wwhbh 项目页的
> `.back` 1293ms（按需加载重脚本后 625ms）。代价在图片侧：洗牌后顶层卡是**随机的**，而浏览器按
> **体积**而非 DOM 顺序调度封面（edgedgedge 34KB 每次最先到 1578ms，6u104hp 110KB 每次最后到 3862ms），
> 所以"只给顶层一张 high"并不奏效（可见封面 p50 1789→3442ms）。另外 `fetchpriority="low"` 加在
> **defer 脚本**上完全无效：defer 必须等所有脚本下载完才执行，降优先级只改变谁先下完。
> 结论：改优先级是一个取舍而非纯收益，未采纳；若要缩短这段等待，正解是**把三个重脚本
> （ink/audio/mixer，82.9KB）从每个作品页的 defer 链上拿掉**（6/8 个作品页一行都用不到），
> 或压缩封面体积（两张图就占 568KB 的 39%）。

### E. 关键字体预载

`about / works / changelog / project` 四个文字为主的页面，在 `<head>` 加：
```html
<link rel="preload" as="font" type="font/woff2" crossorigin href="css/fonts/SourceHanSansSC-Regular.woff2">
```
让字体与 CSS 并行下载、`swap` 更早发生。`crossorigin` 必填（字体按 CORS 模式请求，否则预载不会被复用 → 重复下载）。
**首页不预载字体**：首页图片是 LCP 主角，预载 300 KB 字体会与之争抢带宽，得不偿失；少量 CJK 文字靠 `swap` 即可。

### F. 站内跳转悬停预取（新文件 `js/prefetch.js`）

监听 `pointerover / focusin / touchstart`，对同源 `.html` 链接在 `requestIdleCallback` 内注入 `<link rel="prefetch" as="document">` 预取目标文档。去重、省流量模式（`navigator.connection.saveData` / 2g）自动禁用。**悬停 → 点击之间通常有 100–300 ms，足以预取完成，跳转近乎即时**。已加入全站核心脚本。

### G. 作品页静态生成（2026-09-22）

把原先由 JS 事后组装的作品页内容（标题、副标题、正文、主图）**在生成时写进 HTML**，
作品页地址同时由 `?project=` 改为目录式（`works/<id>/`、`works/<id>/zh/`）。做法与取舍见
`STYLEGUIDE.md` §7h 与 `程序编写说明.md` §7.6。性能相关的三处变化：

1. **主图进了 HTML**：预扫描器在解析阶段就发现并下载它；旧地址要等 11 个 defer 脚本跑完、`js/project.js` 插入 `<img>` 才开始下载；
2. **正文片段不再另发一次 fetch**（实测生成页的 `data/<id>/<lang>.html` 请求数为 0）；
3. **只保留当前布局的面板**，其余五个连同样板文案一起删掉，HTML 更小。
4. **只挂当前布局需要的脚本**（2026-09-22 追加）：`js/ink-wwhbh.js`（40KB）与 `js/audio-wwhbh.js`（6KB）
   只在 wwhbh 布局挂、`js/mixer-riverrun.js`（35KB）只在 mixer 布局挂，其余六个作品页不下载。
   实测（本机未压缩口径，`load` 窗口内）：`/works/spectral-dissector/` 由 223KB / 22 请求
   降到 **150KB / 19 请求**（同页旧地址仍是 223KB：那一份要承载所有布局）。

实测方法：headless Chrome + CDP，`Network.emulateNetworkConditions` 150ms RTT / 1.6Mbps、
`setCacheDisabled`，每项 5 次取中位数，脚本 `scripts/verify/perf.mjs`（对比
`project-template.html?project=spectral-dissector` 与 `works/spectral-dissector/`）：

| 指标 | 旧地址 | 生成页 | 差 |
|------|--------|--------|-----|
| FCP | 496ms | 576ms | +80ms |
| **LCP** | **1760ms** | **592ms** | **−1168ms** |
| 主图开始下载 | 约 1.6s（等 JS） | 约 0.5s（预扫描器） | 提前约 1.1s |
| `DOMContentLoaded` | 1411ms | 1612ms | +201ms |
| `load` | 3205ms | 1613ms | −1592ms |
| 请求数 | 24 | 22 | −2 |
| 传输（`load` 窗口内） | 537KB | 238KB | −299KB ← **假象，见下** |
| 传输（完全静置后） | 527KB | 523KB | ≈0 |

- **LCP 的 −1168ms 是本次改动的主要收益**，成因是第 1 条：主图在 HTML 里。
- FCP +80ms、DCL +201ms：生成页的 HTML 多了烤进去的正文，且旧地址的首帧是「CSS 一到位就画」的轻页面；这个量级在 5 次中位数的抖动范围内，不作为结论。
- 口径说明：以上传输体积来自本机服务器，**不带 gzip**。字体那 295KB 是真实值（woff2 本身已压缩，线上不会再小）；
  JS/CSS 部分线上会经 gzip 压缩，所以**绝对值偏大、比较结论不受影响**。首屏时刻同理会比这里更快。
- **更正（同一轮实测发现）**：`load` 窗口内「省 299KB」是**测量窗口造成的假象**。等 `document.fonts.ready` + 静置 3s 后，两页总传输几乎相同（527KB vs 523KB）——
  因为**两页都会下载 295KB 的思源黑体**：英文界面上唯一可见的汉字是右下角语言切换按钮的「中文」二字，
  而 `@font-face` 没有 `unicode-range` 限制，任何一个汉字都会拉整个字体文件。详见「三、待办发现」。

### H. CJK 字体：英文页不背整份、中文全量覆盖（2026-09-22）

| 触发者 | 处理 | 结果 |
|--------|------|------|
| UI 标签：语言按钮「中文」、返回栏「返回」 | 进 `SiteCJK` 小面（16 字，3.4KB）+ 撤掉 `css/nav.css` 里的系统字体规则 | 每页 3.4KB，且**不再跨平台混排**（此前 macOS 苹方 / Windows 雅黑） |
| 英文正文里的零散汉字：署名、`此即人人`、`南美大虾` | `SiteCJK` 子集 + `local()` 优先 | 英文页不再下主字体 |
| 音标 `ɔ`（JustType Study 正文的昵称 `qoɔ`） | `LocalIPA`（只声明 U+0250-02AF 等区段，src 全 `local()`） | 0 字节；官方中文字体也没有该字形，故无法自托管 |
| 【】中日韩括号 | 改成英文方括号 | 该页 0 |
| changelog 英文条目引用的中文 | 不特殊处理 | 折叠态 3.4KB；**展开含中文的条目才按需拉主字体**（实测） |

中文主字体重做：`scripts/gen-cjk-main.py` 从官方 Noto Sans SC 按站内实际用字切出，
**1450 字、Regular 274KB / Bold 280KB**（原 1023 字、302/311KB —— 更全反而更小）。
共有字形与官方字体**轮廓逐字节相同**（sha1 全等），故替换不改变任何原本正常的字。
覆盖率复验：`scripts/verify/coverage.mjs` → 27 个页面**差集为空**（此检查暴露过
`project-data.js` 里的「阵」字漏在推导范围外）。字号文件换了内容，`css/base.css` 里补了 `?v=2` 缓存键。

### I. 站内页静态化（2026-09-22）

首页／作品列表／简介／进程日志也改成目录式规范地址 + 内容烤入（`scripts/gen-pages.mjs`，见 STYLEGUIDE §7i）：

- **简介**：8 段正文进 HTML（约 +4–6KB/页），不跑 JS 也能读；
- **作品列表**：8 条静态 `<a>`（约 +2KB/页），爬虫因此有一条从列表走到每个作品页的路径；
- **首页**：四角导航静态写死（含 `[ALL WORKS →]` 与三个作品链接），爬虫在首页不再「看不到站内链接」；
  卡片本身**没有**改成 `<a>` —— 那会动到拖拽与翻牌的事件处理，风险不对等；
- **进程日志**：只烤标题与元信息，正文仍由 JS 渲染（98 条日志全烤约 200KB × 2 语言，不值得）；
- 旧地址继续可用，带 `noindex` + canonical，故不产生重复内容。

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

### CJK 字体：英文页不背整份、中文全量自托管（2026-09-22，已完成）

两件事一起做完了，做法与实测见 §二 H；本节保留结论索引：

- **英文页**：都只下 3.4KB 的 `SiteCJK`（导航标签的汉字也进了它），不再下 273KB 主字体；
  changelog 英文页折叠态只有 7 个可见汉字，**展开含中文的条目时才按需拉主字体**（实测确认）。
- **中文**：主字体按站内实际用字重切，覆盖 1447 字（原 1023 字，导致 234 字落到系统字体）。
  覆盖率由 `scripts/verify/coverage.mjs` 复验：27 个页面渲染出的中日韩字符，差集为空。
- **IPA 例外**：官方中文字体本身没有 U+0250-02AF 等音标字形，那几个字由 `LocalIPA`（全 `local()`）承担。

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
   - 首页：8 张卡片图应带「High」优先级；字体不应在首页被 `preload`。
   - works/about/changelog/project：应见 `SourceHanSansSC-Regular.woff2` 的 `(preload)` 请求。
3. **悬停预取**：Network 面板勾选后，鼠标悬停首页卡片，应见一条 `prefetch` 类型的 `works/<id>/`（中文界面 `works/<id>/zh/`）请求。
   预取的是**链接自身的 href**：语言在渲染时就由 `App.langHref()` / `App.projectHref()` 写好了；旧实现取 `a.pathname` 重建，会把 `?project=` 丢掉。
4. **CLS**：卡片图在固定尺寸容器内 `object-fit:cover`，无布局偏移；Gallery 首帧之外懒加载，注意观察等高胶片条在图片比例差异较大时是否出现高度跳动。

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

### 2026-09-22 作品页静态生成（§二 G）

| 文件 | 改动 |
|---|---|
| `scripts/gen-projects.mjs` | **新增**：作品页静态生成器（`--check` 查漂移，遇错不写文件） |
| `works/<id>/`、`works/<id>/zh/` | **新增**：16 个生成页（主图进 HTML、正文烤入、只留当前布局面板） |
| `js/project.js` | 读 `data-project`；正文同语言时不再 fetch；媒体带 `data-baked` 时不重建；旧地址补 canonical |
| `js/app.js` | **新增** `App.projectHref()`：作品页地址唯一出口 |
| `js/i18n.js` | `data-lang-fixed` 页面不吃 localStorage、不写回 `?lang=`；切换语言跳到另一语言目录 |
| `js/prefetch.js` | 认目录式地址；预取链接自身的 href（修掉丢掉 `?project=` 的旧写法） |
| `js/nav.js` / `js/works.js` / `js/index.js` | 作品链接改走 `App.projectHref()`；首页卡片加 `data-project` |
| `project-template.html` | 加静态 `noindex`；模板内标出 `gen:legacy-only` 区块供生成器替换 |
| `404.html` / `css/404.css` / `js/404.js` / `js/404-i18n.js` | **新增**：自定义 404 |
| `sitemap.xml` / `robots.txt` | **新增**：由生成器写，域名取自 `CNAME` |
| `STYLEGUIDE.md` / `程序编写说明.md` / `PERFORMANCE.md` | 文档同步（§7h / §7.6 / §二 G） |

> 回滚：所有改动为增量、无破坏性。若预取出现问题，单独移除对应片段即可，不影响其余。
