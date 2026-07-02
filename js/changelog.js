/* ===== CHANGELOG PAGE ===== */
(function(){

  /* ========================================================
   *  📝 录入区 — 只需编辑这个数组，新条目加在最前面
   * ======================================================== */
  const entries = [
    {
      date: '2026-07-02',
      title: { zh: '重写 SPECTRAL DISSECTOR 项目介绍', en: 'Rewrote the SPECTRAL DISSECTOR project introduction' },
      body:  { zh: '将 SPECTRAL DISSECTOR 的项目介绍由原 GLM-5.2 撰写的概念性描述（按“成分构成”解剖声音、十层结构、各控制参数的听感说明与从零拆解流程）替换为作者亲撰的技术性自述：说明它是基于 Spectral Noise Gate、HPSS 与 Cepstrum 的基频/谐波/瞬态/噪音分离插件，灵感来自模拟 Filterbanks、SPEAR、Bitwig Loud Split/Harmonic Split、Ircam iana~ 等；回顾 2025 年 6 月的初版形态（6 个并联 Spectral Gates、Thresholds 首尾相连）与 2026 年 4 月的架构重构（引入 HPSS 与 Cepstrum、参照 Bitwig Loud Split 加入 Rise/Fall、以 Main Threshold + Spacing + Tilt 重做接口逻辑、新增 Focus 参数、因与 Cepstrum/HPSS 冲突而暂去包络补偿算法），并注明新版 Max for Live 插件的实现与 UI 由闫开完成。保留开头“本作品与闫开共同创作”的署名，移除原 GLM-5.2 撰写署名，修改日期更新为 2026.07.02。正文中提及的「图1」配入初版 M4L 插件截图（原图 1497×252 PNG 留档于 img/originals/，转 WebP q80 约 13KB 部署为 img/spectral-dissector-1.webp），内嵌于第一段之后。', en: 'Replaced SPECTRAL DISSECTOR’s project introduction — originally the conceptual description written by GLM-5.2 (dissecting sound by “composition”, the ten-layer structure, per-parameter listening notes and the from-scratch dissection workflow) — with a technical self-statement by the author: explaining it is a fundamental/harmonic/transient/noise separation plugin based on Spectral Noise Gate, HPSS, and Cepstrum, inspired by analog filterbanks, SPEAR, Bitwig Loud Split/Harmonic Split, Ircam iana~, etc.; recounting the initial June 2025 form (six parallel Spectral Gates with chained thresholds) and the April 2026 architecture refactor (introducing HPSS and Cepstrum, adding Rise/Fall after Bitwig Loud Split, reworking the interface logic around a Main Threshold + Spacing + Tilt, adding the Focus parameter, and temporarily removing envelope compensation due to conflicts with Cepstrum/HPSS), and noting the new Max for Live device’s implementation and UI were done by Yan Kai. Kept the opening “Co-created with Yan Kai” credit, removed the GLM-5.2 authorship credit, and updated the modification date to 2026.07.02. The “Figure 1” referenced in the text was filled in with the initial-version M4L device screenshot (original 1497×252 PNG archived under img/originals/, converted to WebP q80 ~13KB deployed as img/spectral-dissector-1.webp), embedded after the first paragraph.' },
      media: ''
    },
    {
      date: '2026-07-02',
      title: { zh: '配置 Tiliqua macOS 开发环境（PDM + OSS CAD Suite 工具链）', en: 'Set up Tiliqua macOS dev environment (PDM + OSS CAD Suite toolchain)' },
      body:  { zh: '为 Tiliqua 音频 FPGA 模块在 macOS（Apple Silicon M5）上配置开发环境，完成基础工具链（第 1-3 步）。① 安装 PDM 2.28.0（brew install pdm），与 Tiliqua CI 使用的 Python 包管理器一致，保证本地依赖与云端构建环境一致。② 安装 OSS CAD Suite FPGA 工具链：查阅仓库 CI 配置（gateware/scripts/Dockerfile）确认 CI 使用 2025-11-02 版本，本机为 Apple Silicon 故下载对应的 darwin-arm64 版本，安装至 /opt/oss-cad-suite（与 CI 路径一致）并在 ~/.zshrc 添加 PATH。首次下载文件被截断（81MB / 预期 482MB）导致 tar 解压报错，改用带重试与断点续传的 curl（--retry 5 -C -）重新下载，gzip -t 验证完整性后再解压。③ 验证全部工具版本通过：PDM 2.28.0、Yosys 0.58+98、openFPGALoader v1.0.0、Verilator 5.041、nextpnr-ecp5 0.9-38。后续待 Tiliqua 模块到手再做第 4 步 USB 连接测试（openFPGALoader --scan-usb）、第 5 步克隆代码与 pdm install、第 6 步按需安装 Rust 工具链（仅修改带软核 CPU 的 SoC 固件时需要，纯音频 DSP 开发可跳过）。', en: 'Set up the development environment for the Tiliqua audio FPGA module on macOS (Apple Silicon M5), completing the base toolchain (steps 1-3). ① Installed PDM 2.28.0 (brew install pdm), matching Tiliqua\'s CI Python package manager so local dependencies align with cloud builds. ② Installed the OSS CAD Suite FPGA toolchain: checked the repo\'s CI config (gateware/scripts/Dockerfile) to confirm CI uses the 2025-11-02 release, then downloaded the matching darwin-arm64 build for Apple Silicon, installed to /opt/oss-cad-suite (same path as CI) and added it to PATH in ~/.zshrc. The first download was truncated (81MB / expected 482MB) causing a tar error; re-downloaded with retry + resume curl (--retry 5 -C -), verified integrity with gzip -t before extracting. ③ Verified all tool versions pass: PDM 2.28.0, Yosys 0.58+98, openFPGALoader v1.0.0, Verilator 5.041, nextpnr-ecp5 0.9-38. Remaining steps pending the Tiliqua module arriving: step 4 USB connection test (openFPGALoader --scan-usb), step 5 clone the repo and run pdm install, step 6 optionally install the Rust toolchain (only needed when modifying SoC firmware with a soft-core CPU; pure audio DSP work can skip it).' },
      media: ''
    },
    {
      date: '2026-06-29',
      title: { zh: '全站性能优化：脚本 defer、媒体懒加载、字体预载、跳转预取', en: 'Site-wide performance: defer scripts, lazy media, font preload, navigation prefetch' },
      body:  { zh: '在不引入构建步骤的前提下做了六项加载优化（详见新增 PERFORMANCE.md）。① 全站五个 HTML 的 <script> 从 <body> 末尾移至 <head> 并加 defer，与 CSS 并行下载、不阻塞渲染，执行顺序不变（defer 保证按文档顺序、DOMContentLoaded 前执行）。② ecce-homo 的 12MB 音频由默认 preload="auto" 改为 preload="none"，进入页面不再立即下载，点播放才拉取，该页首屏大幅减重。③ 非首屏媒体懒加载：Gallery 水平 slider 的后续帧与 Changelog <details> 折叠区内的图片加 loading="lazy" + decoding="async"，视频加 preload="none"，进入视口/展开播放前不下载。④ 首屏图片提优先级：首页六张卡片封面与项目页 hero 图加 decoding="async" + fetchpriority="high"。⑤ 关键字体预载：about/works/changelog/project 四个文字为主的页在 <head> 加 <link rel="preload" as="font" crossorigin> 预载 SourceHanSansSC-Regular.woff2，使其与 CSS 并行下载、font-display:swap 更早发生；首页图片为主故不预载以免争抢带宽。⑥ 新增 js/prefetch.js：监听 pointerover/focusin/touchstart，对同源 .html 链接在 requestIdleCallback 内注入 <link rel="prefetch" as="document"> 预取目标文档，去重、省流量模式与 2g 自动禁用，点击跳转近乎即时。期间还尝试过给 EDGEDGEDGE 的 B 站视频做 facade（先显示封面 + 播放按钮、点击才加载播放器 iframe）并在 localhost 加 preconnect，但本地加载不出来且不满意该交互逻辑，已回退为原始进入即加载 iframe。', en: 'Six loading optimizations without introducing a build step (see the new PERFORMANCE.md). ① Moved all <script> tags of the five HTML pages from end of <body> into <head> with defer — downloaded in parallel with CSS, non-render-blocking, execution order unchanged (defer guarantees document order, runs before DOMContentLoaded). ② The 12MB audio for ecce-homo switched from the default preload="auto" to preload="none", so entering the page no longer downloads it immediately — it is fetched only on play, greatly reducing that page’s first paint. ③ Lazy-load offscreen media: subsequent frames of the Gallery horizontal slider and images inside collapsed Changelog <details> get loading="lazy" + decoding="async", videos get preload="none", nothing is downloaded until in view / expanded-and-played. ④ Prioritize above-the-fold images: homepage card covers and project-page hero images get decoding="async" + fetchpriority="high". ⑤ Preload the critical font: the four text-heavy pages (about/works/changelog/project) add <link rel="preload" as="font" crossorigin> for SourceHanSansSC-Regular.woff2 in <head> so it downloads in parallel with CSS and font-display:swap happens earlier; the image-led homepage skips it to avoid bandwidth contention. ⑥ New js/prefetch.js: listens for pointerover/focusin/touchstart on same-origin .html links and injects <link rel="prefetch" as="document"> inside requestIdleCallback to prefetch the target document — deduped, auto-disabled under save-data / 2g, making navigations near-instant. Also tried a facade for the EDGEDGEDGE Bilibili video (show a cover + play button, load the player iframe only on click) with a localhost preconnect, but it failed to load locally and the interaction felt wrong, so it was reverted to the original load-iframe-on-entry behavior.' },
      media: ''
    },
    {
      date: '2026-06-29',
      title: { zh: '根治首页四角导航纵向对齐（统一偏移变量）', en: 'Root-fixed homepage four-corner vertical alignment (unified offset variable)' },
      body:  { zh: '此前四角纵向对齐靠各角分散凑 padding（容器 padding 与 <a> padding 两套机制混用，top-right 是文本节点靠容器 padding、其余三角是 <a> 列表靠 <a> padding），改任一角即可能破坏对齐，已反复修补两次（2026-06-25 修底部一对、本日修顶部一对）。本次根治：引入 CSS 变量 --nav-y（桌面2px/移动4px），四角容器的竖向 padding 统一引用它（顶部角 padding-top、底部角 padding-bottom），<a> 竖向 padding 归零仅留水平点击区 0 6px，line-height 统一 1.5 补偿 <a> 竖向 padding 归零后的 hover 黑底高度。如此"文字到锚边的偏移"只由容器一层决定，改 --nav-y 四角联动，不再分散凑数。数值上与已对齐状态完全一致（偏移仍为 锚边20+2=22px），仅结构重构 + 变量化 + line-height 统一，回归风险低。', en: 'The four-corner vertical alignment previously relied on scattered padding values across each corner (two mechanisms mixed: top-right is a text node using container padding, the other three are <a> lists using <a> padding), so editing any one corner could break alignment — it had been patched twice (2026-06-25 the bottom pair, today the top pair). This root fix introduces a CSS variable --nav-y (desktop 2px / mobile 4px); all four corner containers reference it for their vertical padding (top corners padding-top, bottom corners padding-bottom), <a> vertical padding is zeroed leaving only the horizontal click area 0 6px, and line-height is unified at 1.5 to compensate the hover background height lost from zeroing <a> vertical padding. Now the “text-to-anchor-edge offset” is decided by the container layer alone; changing --nav-y moves all four corners together, no more scattered padding arithmetic. The values are identical to the already-aligned state (offset still anchor 20 + 2 = 22px) — only a structural refactor + variable binding + unified line-height — so regression risk is low.' },
      media: ''
    },
    {
      date: '2026-06-29',
      title: { zh: '对齐首页顶部一对导航的纵向位置', en: 'Aligned the top pair of homepage nav vertically' },
      body:  { zh: '修复首页顶部一对（左上 [+] 简介与联系 / 右上 泻火 曹浩轩）的纵向错位：此前右上的 .nav-top-right 容器 padding-top 为 4px，而左上第一个导航链接 <a> 的 padding-top 为 2px，导致右上名字比左上首条链接低约 2px。将桌面端 .nav-top-right 的 padding 从 4px 6px 0 改为 2px 6px 0；移动端显式补声明 padding:4px 6px 0，与移动端左上链接 padding-top(4px) 对齐。底部一对已于 2026-06-25 对齐，此次补齐顶部一对，四角在盒子层面完全对齐。', en: 'Fixed the vertical misalignment of the homepage top pair (top-left [+] 简介 / top-right 泻火 曹浩轩): the .nav-top-right container had padding-top:4px while the top-left first nav link <a> had padding-top:2px, so the top-right name sat ~2px lower than the top-left first link. Changed the desktop .nav-top-right padding from 4px 6px 0 to 2px 6px 0; explicitly added padding:4px 6px 0 on mobile to match the mobile top-left link padding-top (4px). The bottom pair was already aligned on 2026-06-25; this completes the top pair, so all four corners now align at the box level.' },
      media: ''
    },
    {
      date: '2026-06-29',
      title: { zh: 'SPECTRAL DISSECTOR 改用 Ecce 布局并添加顶部介绍图', en: 'SPECTRAL DISSECTOR switched to Ecce layout with a top intro image' },
      body:  { zh: '为 SPECTRAL DISSECTOR 项目页添加一张顶部介绍图（1142×412 横幅，转 WebP 17KB，原图留档 img/originals/），并调整布局：由 Grid 左右分栏改为 Ecce 布局，图片置于最上方、文字在下，类似 ECCE HOMO 的剧照排版。为此将 Ecce 布局通用化：原先 project-template.html 中硬编码的 ecce-homo-still 图片与 ecce-homo 音频改为由 JS 动态渲染——图片从 project.media（type:image）读取、音频从 project.audio 读取（无该字段则不渲染音频）。同步为 ecce-homo 配置补上 media 与 audio 字段以保持向后兼容。更新 STYLEGUIDE 的 Ecce 布局说明、布局选择规则与文件结构树。', en: 'Added a top intro image to the SPECTRAL DISSECTOR project page (1142×412 banner, WebP 17KB, original archived under img/originals/) and changed its layout from the Grid left-right split to the Ecce layout, placing the image at the top with the text below — similar to ECCE HOMO’s still placement. Generalized the Ecce layout to enable this: the previously hard-coded ecce-homo-still image and ecce-homo audio in project-template.html are now rendered dynamically by JS — the image from project.media (type:image), the audio from project.audio (omitted when absent). Added media and audio fields to the ecce-homo config for backward compatibility. Updated the STYLEGUIDE Ecce layout section, layout-selection rule, and file-structure tree accordingly.' },
      media: 'img/spectral-dissector-2.webp'
    },
    {
      date: '2026-06-29',
      title: { zh: '为 SPECTRAL DISSECTOR 介绍补充 Max for Live 版使用方法', en: 'Added Max for Live usage guide to the SPECTRAL DISSECTOR introduction' },
      body:  { zh: '在 SPECTRAL DISSECTOR 项目介绍（概念部分）之后，追加一段 Max for Live 版本的使用说明。逐一说明全部控制参数（Threshold、Spacing、Focus、Band 1–7 Offset、Blur、Perc、Gate、Detail、Slide Rise/Fall、Tilt、Dry、各层开关与路由、循环调制）如何主观地影响听感，并给出从零拆解一个采样的操作顺序：先以 Dry 听原声，依次调 Threshold 校准、Spacing 分层、Focus 定边界、Blur/Perc 处理瞬态、Gate 分离底噪、Slide 调响应、Tilt 偏向频段、Band Offset 逐层微调，最后开关与独奏各层完成拆解。刻意不从信号/DSP 角度分析，全部以经验化听感描述。', en: 'Appended a Max for Live usage section after the SPECTRAL DISSECTOR conceptual introduction. Walks through every control parameter (Threshold, Spacing, Focus, Band 1–7 Offset, Blur, Perc, Gate, Detail, Slide Rise/Fall, Tilt, Dry, per-layer switches & routing, cyclic modulation) in terms of subjective listening effect rather than signal/DSP analysis, and gives a from-scratch sample-dissection workflow: start with Dry to hear the original, then calibrate with Threshold, layer with Spacing, set boundaries with Focus, handle transients with Blur/Perc, separate the noise floor with Gate, set responsiveness with Slide, bias the spectrum with Tilt, fine-tune per layer with Band Offset, and finish by muting/soloing/routing each layer. Deliberately experiential throughout, no signal-path analysis.' },
      media: 'img/spectral-dissector.webp'
    },
    {
      date: '2026-06-29',
      title: { zh: '撰写 SPECTRAL DISSECTOR 项目介绍', en: 'Wrote the SPECTRAL DISSECTOR project introduction' },
      body:  { zh: '此前 SPECTRAL DISSECTOR 的项目页描述为空，现为其撰写中英文介绍。基于项目架构文档提炼设计理念，刻意略去全部技术细节（FFT、Max for Live、gen~、HPSS、倒谱、阈值参数、声道数等），只面向普通读者阐明其设计目的与作用：传统声音工具按「音高」切分声音，而 Spectral Dissector 按「成分构成」切分——把任何声音解剖为八层由强到弱的持续音、一层噪声与一层打击，每层可独立开关与路由。以「解剖」为隐喻，强调它把混音的起点从「合并」倒转为「拆开」。介绍末尾注明由 GLM-5.2 撰写。', en: 'The SPECTRAL DISSECTOR project page description was previously empty; wrote its Chinese and English introductions. Distilled the design concept from the project architecture doc while deliberately omitting all technical details (FFT, Max for Live, gen~, HPSS, cepstrum, threshold parameters, channel counts, etc.), aiming only to convey its design purpose and function to a general audience: where conventional sound tools split sound by "pitch," Spectral Dissector splits it by "composition" — dissecting any sound into eight layers of sustained tones graded from strongest to weakest, one layer of noise, and one layer of percussion, each independently switchable and routable. Uses "dissection" as a metaphor, emphasizing how it inverts the starting point of mixing from "combining" to "taking apart." The introduction notes it was written by GLM-5.2.' },
      media: 'img/spectral-dissector.webp'
    },
    {
      date: '2026-06-29',
      title: { zh: '为 riverrun 添加封面与项目页图片', en: 'Added cover and project-page image for riverrun' },
      body:  { zh: '为 riverrun 补齐了此前缺失的图片：首页卡片封面（横图，1200px 宽 WebP）与项目页 Grid 布局媒体区的内部图片（竖图，1600px 宽 WebP）。原图留档于 img/originals/。同时扩展了 Grid 布局：此前 Grid 仅渲染标题与文字描述、媒体区恒为占位符，现支持 media.type="image" 渲染单张图片（与 Edge 布局的 image 渲染一致）。给 project-template.html 的 .media-area 加上 id="grid-media" 以供 project.js 定位。', en: 'Filled in the previously missing images for riverrun: a homepage card cover (landscape, 1200px-wide WebP) and an internal image in the project page Grid layout media area (portrait, 1600px-wide WebP). Originals archived under img/originals/. Also extended the Grid layout: previously Grid only rendered the title and description with a permanent placeholder in the media area, it now supports media.type="image" to render a single image (consistent with the Edge layout image rendering). Added id="grid-media" to the .media-area in project-template.html so project.js can target it.' },
      media: 'img/riverrun.webp'
    },
    {
      date: '2026-06-25',
      title: { zh: '为 EDGEDGEDGE 添加作品简介', en: 'Added brief for EDGEDGEDGE' },
      body:  { zh: '在作品列表页（works）为 EDGEDGEDGE 补充了一句话简介：与钢铁大腿共同创作的回授声音装置，关于模糊的边缘与失控。此前该条目仅有标题无简介，与其它作品不统一。', en: 'Added a one-line brief for EDGEDGEDGE on the works list page: a feedback sound installation co-created with Gangtie Datui, about blurred edges and loss of control. Previously the entry had only a title with no brief, inconsistent with other works.' },
      media: ''
    },
    {
      date: '2026-06-25',
      title: { zh: '修复首页 [全部作品 →] 与 [en] English 垂直高度不一致', en: 'Fixed vertical alignment between [ALL WORKS →] and [en] English on homepage' },
      body:  { zh: '首页右下角语言切换 [en] English 的 <a> 原为 inline，竖向 padding 不影响行盒高度；而左下角 [全部作品 →] 的 <a> 为 display:block，竖向 padding 真实撑高盒子。两者虽同以 bottom:20px 锚定底部，但文字基线与 hover 黑底高度差约 2px（移动端 4px）。将 .nav-bottom-right 改为与 .nav-bottom-left 一致的 flex 列（display:flex; flex-direction:column; align-items:flex-end，移动端去掉多余的 text-align:right），<a> blockify 后 padding 行为两侧一致，底部与文字基线对齐。', en: 'The homepage bottom-right lang toggle [en] English used an inline <a>, whose vertical padding does not affect the line box height; whereas the bottom-left [ALL WORKS →] used display:block, whose vertical padding genuinely enlarges the box. Both were anchored at bottom:20px, but the text baselines and hover backgrounds differed by ~2px (4px on mobile). Changed .nav-bottom-right to match .nav-bottom-left as a flex column (display:flex; flex-direction:column; align-items:flex-end; dropped the redundant text-align:right on mobile) so the <a> is blockified and padding behaves identically on both sides, aligning their bottoms and text baselines.' },
      media: ''
    },
    {
      date: '2026-06-25',
      title: { zh: '中文换思源黑体自托管 + 中英自动间距 + 纯净 0', en: 'Self-hosted Source Han Sans SC for CJK + auto CJK↔Latin spacing + plain zero' },
      body:  { zh: '三处排版升级：① 中文字体由系统 PingFang SC 换为自托管思源黑体 SC（Source Han Sans SC，子集化 woff2，Regular/Bold 各约 300KB），保证跨平台一致。② 新增 js/autospace.js，在中文↔英文/数字边界自动插入 thin space（U+2009，0.2em），覆盖 i18n 切换等动态注入；因等宽字体空格默认 0.6em 过宽，已将 DejaVu 中 U+2009 字宽单独改为 0.2em。③ 新增 PlainZero webfont（unicode-range:U+0030），用同家族 DejaVu Sans 的纯净 0 覆盖 DejaVu Sans Mono 的点 0，同高度同基线仅去点。另将中文行内强调的斜体统一改为加粗，外文原文斜体保留。', en: 'Three typographic upgrades: ① CJK font switched from system PingFang SC to self-hosted Source Han Sans SC (subsetted woff2, ~300KB each Regular/Bold) for cross-platform consistency. ② Added js/autospace.js to auto-insert thin space (U+2009, 0.2em) at CJK↔Latin/numeric boundaries, covering dynamic i18n content; since monospace spaces default to 0.6em (too wide), U+2009 advance in the DejaVu subset was narrowed to 0.2em. ③ Added PlainZero webfont (unicode-range:U+0030) using DejaVu Sans plain zero to override DejaVu Sans Mono dotted zero — same height/baseline, dot removed. Inline CJK emphasis italics changed to bold; foreign-language italics preserved.' },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: '引入 DejaVu Sans Mono webfont 保证跨平台字体一致', en: 'Self-hosted DejaVu Sans Mono webfont for cross-platform font consistency' },
      body:  { zh: '原 font-family: monospace 依赖各平台系统默认等宽字体（macOS/iOS 为 Menlo、Windows 为 Consolas），导致跨平台显示不一致。改为自托管 DejaVu Sans Mono（与 Menlo 同源于 Bitstream Vera Sans Mono，开源可分发），子集化后仅 ASCII+拉丁扩展+标点，Regular 与 Bold 各约 22KB（woff2）。中文回退系统字体。font-family 改为 \'DejaVu Sans Mono\', Menlo, Consolas, monospace。', en: 'The original font-family: monospace relied on each platform\'s default monospaced font (Menlo on macOS/iOS, Consolas on Windows), causing cross-platform inconsistency. Switched to a self-hosted DejaVu Sans Mono (same lineage as Menlo via Bitstream Vera Sans Mono, open-source and redistributable), subset to ASCII + Latin Extended + punctuation, ~22KB each for Regular and Bold (woff2). CJK falls back to system fonts. font-family changed to \'DejaVu Sans Mono\', Menlo, Consolas, monospace.' },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: '首页卡片顺序每次随机', en: 'Homepage cards shuffled on each load' },
      body:  { zh: '首页卡片堆叠顺序改为每次打开网页随机打乱，使用 Fisher-Yates 洗牌算法在初始化时执行。刷新页面即得到新的卡片顺序。', en: 'Homepage card stack order is now randomly shuffled on each page load using the Fisher-Yates algorithm at init. Refreshing the page yields a new card order.' },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: 'Gallery 图片点击放大（Lightbox）', en: 'Gallery image lightbox (click to zoom)' },
      body:  { zh: '为 Gallery 布局增加点击放大功能：点击任一图片打开全屏 Lightbox，支持左右切换、键盘方向键、ESC/点击空白关闭。纯 JS 实现，无依赖。', en: 'Added a click-to-zoom lightbox for the Gallery layout: clicking any image opens a fullscreen overlay with prev/next navigation, keyboard arrows, and ESC/click-outside to close. Pure JS, no dependencies.' },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: '图片压缩为 WebP 并原图留档', en: 'Compressed images to WebP with originals archived' },
      body:  { zh: '将全部图片转为 WebP 格式（质量 80）并按用途分两档缩放：卡片封面 1200px 宽、Gallery/剧照 1600px 宽。图片总体积从约 31MB 降至约 0.8MB。原图留档于 img/originals/ 并加入 .gitignore 不随部署。合并了重复的 the-fet-mixer.jpg 与 the-fet-mixer-1.jpg（同一张图），卡片封面与 Gallery 首图共用 the-fet-mixer.webp。同步更新所有 HTML/JS 引用与 STYLEGUIDE。', en: 'Converted all images to WebP (quality 80) and resized by use case: card covers to 1200px wide, gallery/still images to 1600px wide. Total image size dropped from ~31MB to ~0.8MB. Originals archived under img/originals/ and git-ignored so they are not deployed. Merged the duplicate the-fet-mixer.jpg and the-fet-mixer-1.jpg (identical image) so the card cover and gallery first slide share the-fet-mixer.webp. Updated all HTML/JS references and STYLEGUIDE accordingly.' },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: '首页标签页标题改为「泻火 曹浩轩」', en: 'Homepage tab title changed to "泻火 曹浩轩"' },
      body:  { zh: '将首页 &lt;title&gt; 从「泻火」改为「泻火 曹浩轩」，使浏览器标签页同时显示笔名与本名。', en: 'Changed the homepage &lt;title&gt; from "泻火" to "泻火 曹浩轩" so the browser tab shows both the pen name and real name.' },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: 'SPECTRAL DISSECTOR 封面与频谱图生成', en: 'SPECTRAL DISSECTOR cover & spectrogram generation' },
      body:  { zh: '为 SPECTRAL DISSECTOR 添加了封面图：将 6 条分轨音频各自生成半透明单色 2D 频谱图（红/青绿/蓝/金黄/紫/橙），叠加成一张黑底合成图作为首页卡片封面（3:2，无坐标轴）。同期编写了本地频谱图生成脚本（2D 频谱图 / 3D 声谱图 / 瀑布图 / 半透明叠加），置于 tmp/ 并加入 .gitignore 不随部署。', en: 'Added a cover image for SPECTRAL DISSECTOR: generated a semi-transparent single-color 2D spectrogram for each of 6 audio tracks (red/teal/blue/gold/purple/orange), composited into a black-background overlay used as the homepage card cover (3:2, no axes). Also wrote local spectrogram-generation scripts (2D spectrogram / 3D surface / waterfall / translucent overlay) kept under tmp/ and git-ignored so they are not deployed.' },
      media: 'img/spectral-dissector.webp'
    },
    {
      date: '2026-06-24',
      title: { zh: 'riverrun 作品介绍', en: 'riverrun description' },
      body:  { zh: '为 riverrun 添加了完整作品介绍，包含《芬尼根的守灵夜》多轨有声书文本说明、riverrun 的三重解构（river run / reverend / Erinnerung）及三条轨道的原文与翻译对照，使用左边框引用块排版。', en: 'Added full artist statement for riverrun, including multi-track audiobook text explanation, the triple deconstruction of riverrun (river run / reverend / Erinnerung), and three track texts with original and translation, formatted with left-border quote blocks.' },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: 'The FET Mixer 作品介绍与 Gallery 布局', en: 'The FET Mixer description & Gallery layout' },
      body:  { zh: '为 The FET Mixer 添加了完整作品介绍及简介；添加了封面图与3张作品图（实物照片、建模图、渲染图）；新增 Gallery 布局（文字在上、图片横向滑动切换），替代 Grid 布局用于多图展示；为 EDGEDGEDGE 添加了封面图拍摄者（段立言）致谢。', en: 'Added full artist statement and brief for The FET Mixer; added cover image and 3 project images (photo, 3D model, render); introduced Gallery layout (text above, horizontally scrollable image slider) replacing Grid layout for multi-image projects; added cover photo credit (Duan Liyan) to EDGEDGEDGE.' },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: '修复了2026-06-10的个人介绍的语法错误', en: 'Fixed grammar errors in 2026-06-10 bio' },
      body:  { zh: '修复了顿号误用（并列词语应用顿号而非逗号）、重复词语（"可以在我生日的时候可以"）等语法问题。', en: 'Fixed incorrect use of commas instead of enumeration commas (、) for parallel items, and removed redundant word ("可以在我生日的时候可以").' },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: 'EDGEDGEDGE 作品介绍、Edge 布局与关于页更新', en: 'EDGEDGEDGE description, Edge layout & About page updates' },
      body:  { zh: '为 EDGEDGEDGE 添加了完整作品介绍（2025.10.09 随笔、作品构思、2026.06.24 后续感想）及 Bilibili 视频嵌入；新增 Edge 布局（视频在上文字在下，取代 Grid 布局的左右分栏），移动端视频可见性修复；为关于页段落组添加日期标注；新增「我妈说我标点用错了」。', en: 'Added full artist statement for EDGEDGEDGE (2025.10.09 essay, original concept, 2026.06.24 afterthoughts) with Bilibili video embed; introduced Edge layout (video above, text below, replacing Grid layout side-by-side), fixing mobile video visibility; added date annotations to About page paragraph groups; added "My mom says I used the wrong punctuation."' },
      media: ''
    },
    {
      date: '2026-06-23',
      title: { zh: '文件目录整理、本地服务器修复与排版优化', en: 'File structure reorganization, local server fix & layout refinements' },
      body:  { zh: '将杂项文档（docx）移入 docs/ 目录，开发脚本与 SSL 证书移入 scripts/ 目录，根目录仅保留部署页面与样式指南；修复本地服务器不支持 HTTP Range 请求导致音频无法拖动进度条的问题，将服务器 Python 代码提取为独立 server.py；works 页排版全面优化：宽度 640px→960px 适配英文简介长度，条目固定高度 48px 统一行间距，标题和简介居中对齐（line-height:1 消除中英文字体基线差异），h1 标题间距缩小（margin-bottom 2px），移动端竖排布局修复（标题居中、简介不溢出）；about/changelog 页标题加 line-height:1 修复中英文切换横线偏移；首页四角导航左右对齐微调；为 riverrun 作品标题添加小写显示支持。', en: 'Moved doc files to docs/ and dev scripts + SSL certs to scripts/, keeping only deployable pages and styleguide in root; fixed local server lacking HTTP Range request support which prevented audio seek, extracted server code into standalone server.py; comprehensive works page layout refinements: widened to 960px to accommodate English briefs, fixed 48px row height for consistent line spacing, centered title and brief alignment (line-height:1 to eliminate font baseline differences), reduced h1 margin-bottom to 2px, fixed mobile vertical layout (title centered, brief not overflowing); added line-height:1 to about/changelog titles to fix border shift on lang switch; adjusted index page four-corner nav alignment; added lowercase display support for riverrun title.' },
      media: ''
    },
    {
      date: '2026-06-23',
      title: { zh: '代码审查与重构', en: 'Code audit & refactoring' },
      body:  { zh: '对全站代码进行了系统性审查并修复所有问题：修复首页标题错误（WORKS → 泻火）；消除 about/changelog 页面 .page 类名冲突（拆分为 .about-page / .changelog-page）；清理 ECCE HOMO 已停用的 B站 iframe 死代码（CSS + HTML + JS + 数据）；修复 WWHBH 音频按钮硬编码英文文本，改为 i18n 驱动（启动/关闭/权限被拒）；修复 works 页标题手动硬编码与 i18n 脱节问题；将过时键名 cardNewWork 重命名为 cardEdgedgedge；移除 prevCard() 中无效的 zIndex 覆盖；重构 preview-cards.html 导航为动态渲染；将 preview-cards.html 加入 .gitignore 排除部署；同步更新 STYLEGUIDE.md。', en: 'Conducted a systematic code audit and fixed all issues: fixed homepage title (WORKS → 泻火); eliminated .page class name collision between about/changelog pages (split into .about-page / .changelog-page); removed dead Bilibili iframe code for ECCE HOMO (CSS + HTML + JS + data); fixed WWHBH audio button hardcoded English text, now i18n-driven (activate/deactivate/permission denied); fixed works page title hardcoded separately from i18n; renamed stale key cardNewWork to cardEdgedgedge; removed ineffective zIndex override in prevCard(); refactored preview-cards.html navigation to use dynamic rendering; added preview-cards.html to .gitignore; synchronized STYLEGUIDE.md.' },
      media: ''
    },
    {
      date: '2026-06-23',
      title: { zh: '移动端适配与作品列表页', en: 'Mobile adaptation & works list page' },
      body:  { zh: '修复了首页四角导航在手机上被裁切或不可见的问题；禁止移动端弹性滚动（html/body position:fixed）；右侧导航文字裁切修复（用 left:50vw 替代 max-width）；添加 viewport-fit=cover 与 safe-area-inset 适配刘海屏；左下角改为 SELECT WORKS 直达链接（ECCE HOMO / riverrun / SPECTRAL DISSECTOR）加 [ALL WORKS →] 按钮；新增作品列表页（works.html）；为 ECCE HOMO 和 WWHBH 添加了简介；桌面端与移动端卡片视觉逻辑重做：桌面端上移+左偏补偿右视觉重心，移动端卡片尺寸缩小(80vw×46vw)、边框变细、间距缩小(maxSpreadX 70→40, maxStepX 14→8)并左移保证右侧不溢出；riverrun 小写视觉重心微调。', en: 'Fixed four-corner navigation being clipped on mobile; disabled mobile rubber-band scrolling (html/body position:fixed); fixed right-side nav text clipping (replaced max-width with left:50vw); added viewport-fit=cover and safe-area-inset support for notched screens; bottom-left now shows SELECT WORKS direct links (ECCE HOMO / riverrun / SPECTRAL DISSECTOR) plus [ALL WORKS →] button; added works list page (works.html); added briefs for ECCE HOMO and WWHBH; rebuilt desktop and mobile card visual logic: desktop shifted up and left to compensate right visual weight, mobile card size reduced (80vw×46vw), thinner borders, tighter spacing (maxSpreadX 70→40, maxStepX 14→8), shifted left to keep right edge within screen; adjusted riverrun lowercase visual alignment.' },
      media: ''
    },
    {
      date: '2026-06-22',
      title: { zh: '通关了游戏武士零', en: 'Completed the game Katana ZERO' },
      body:  { zh: '通关了武士零。', en: 'Completed Katana ZERO.' },
      media: ''
    },
    {
      date: '2026-06-22',
      title: { zh: '新增作品与网站部署', en: 'New projects & site deployment' },
      body:  { zh: '将项目 new-work 正式命名为 EDGEDGEDGE；新增作品 The FET Mixer 与 riverrun；为 Ecce Homo 和 EDGEDGEDGE 增加了卡片封面图；Ecce Homo 改用本地音频播放器替代 B站视频嵌入；首页卡片堆叠改为水平扇形展开布局，卡片数量增加时自动缩小间距；首页整体偏左上补偿重心；更新了首页左下角导航链接；创建了本地 HTTPS 预览脚本和 GitHub 推送脚本；将网站部署至 GitHub Pages。', en: 'Renamed project new-work to EDGEDGEDGE; added new projects The FET Mixer and riverrun; added cover images for Ecce Homo and EDGEDGEDGE cards; replaced Bilibili video embed with local audio player for Ecce Homo; changed homepage card stack to horizontal fan layout with auto-shrinking spacing; shifted stack upper-left for center compensation; updated bottom-left navigation links; created local HTTPS preview script and GitHub push script; deployed the site to GitHub Pages.' },
      media: ''
    },
    {
      date: '2026-06-21',
      title: { zh: '观看了电影《撒旦探戈》', en: 'Watched the film Sátántangó' },
      body:  { zh: '观看了贝拉·塔尔执导的《撒旦探戈》。', en: 'Watched Sátántangó directed by Béla Tarr.' },
      media: ''
    },
    {
      date: '2026-06-20',
      title: { zh: '观看了电影《噬草者》', en: 'Watched the film The Grass Eater' },
      body:  { zh: '观看了《噬草者》。', en: 'Watched The Grass Eater.' },
      media: ''
    },
    {
      date: '2026-06-18',
      title: { zh: '观看了电影《拯救地球》', en: 'Watched the film Bugonia' },
      body:  { zh: '观看了欧格斯·兰斯莫斯执导的《拯救地球》。', en: 'Watched Bugonia directed by Yorgos Lanthimos.' },
      media: ''
    },
    {
      date: '2026-06-15',
      title: { zh: '为《我们将会曾经在这里》增加了作品封面', en: 'Added cover image for We Will Have Been Here' },
      body:  { zh: '为首页卡片增加了封面图。', en: 'Added a cover image to the homepage card.' },
      media: ''
    },
    {
      date: '2026-06-15',
      title: { zh: '修改了 Ecce Homo 的作品介绍', en: 'Updated Ecce Homo description' },
      body:  { zh: '重写了作品介绍文本，加入了圣经拉丁文原文与卡夫卡德语原文的引用标注。', en: 'Rewrote the artist statement, added Latin Vulgate and Kafka German original text citations.' },
      media: ''
    },
    {
      date: '2026-06-15',
      title: { zh: '新增模块', en: 'New modules' },
      body:  { zh: '得到了 Frequency Central 的 Wonderland 和 NLC 的 Divide & Conquer 两块模块。', en: 'Got two new modules: Frequency Central\'s Wonderland and NLC\'s Divide & Conquer.' },
      media: ''
    },
    {
      date: '2026-06-15',
      title: { zh: '更新了作品介绍页面', en: 'Updated project description pages' },
      body:  { zh: '修改了《我们将会曾经在这里》的作品介绍；将作品描述拆分为独立 HTML 片段文件，优化了作品介绍页面的排版与可读性。', en: 'Updated the artist statement for We Will Have Been Here; split project descriptions into standalone HTML fragment files, improved layout and readability of project description pages.' },
      media: ''
    },
    {
      date: '2026-06-13',
      title: { zh: '看了两部电影', en: 'Watched two films' },
      body:  { zh: '看了《接近终点》和《我们的土地》。', en: 'Watched Sirât and Nuestra Tierra.' },
      media: ''
    },
    {
      date: '2026-06-10',
      title: { zh: '制作了个人网站', en: 'Made a personal website' },
      body:  { zh: '第一个版本发布，包含项目展示与多语言支持。', en: 'First release with project showcase and i18n support.' },
      media: ''  // 可选：图片/视频路径，如 'img/changelog/2025-06-10.webp'
    },
    // 继续往上加新条目 …
  ];

  /* ========================================================
   *  渲染逻辑 — 一般不需要修改
   * ======================================================== */

  function render() {
    const page = document.querySelector('.changelog-page');
    // 保留 timeline 和 h1，清除旧条目
    page.querySelectorAll('.log-entry').forEach(el => el.remove());

    const lang = App.I18n.currentLang;

    entries.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'log-entry';

      const details = document.createElement('details');
      const summary = document.createElement('summary');
      // title 用 textContent 防止 XSS
      summary.textContent = entry.title[lang];

      const dateSpan = document.createElement('span');
      dateSpan.className = 'date';
      dateSpan.textContent = entry.date;
      summary.appendChild(dateSpan);

      const body = document.createElement('div');
      body.className = 'body';
      // body 按 STYLEGUIDE 约定支持 HTML
      body.innerHTML = entry.body[lang];

      // media 用 DOM 创建，防止注入
      if (entry.media) {
        const ext = entry.media.split('.').pop().toLowerCase();
        if (['mp4','webm','ogg'].includes(ext)) {
          const video = document.createElement('video');
          video.controls = true;
          video.preload = 'none';   /* 在 <details> 折叠区内，点开并播放前不拉取 */
          const source = document.createElement('source');
          source.src = entry.media;
          source.type = 'video/' + ext;
          video.appendChild(source);
          body.appendChild(video);
        } else {
          const img = document.createElement('img');
          img.src = entry.media;
          img.alt = '';
          img.loading = 'lazy';
          img.decoding = 'async';
          body.appendChild(img);
        }
      }

      details.appendChild(summary);
      details.appendChild(body);
      div.appendChild(details);
      page.appendChild(div);
    });
  }

  /* ---- init ---- */
  App.renderBackNav();
  App.I18n.init(App.CHANGELOG_I18N, () => render());
  render();
})();
