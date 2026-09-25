/* ===== CHANGELOG PAGE ===== */
(function(){

/* 旧地址（changelog.html）声明规范地址：目录式地址才是正式的，语言随当前语言。
   静态的 noindex 覆盖不跑 JS 的抓取者，这一条覆盖跑 JS 的。 */
if (typeof App.injectCanonical === 'function' && typeof App.pageHref === 'function') {
  App.injectCanonical(App.pageHref('changelog'));
}

  /* ========================================================
   *  📝 录入区 — 只需编辑这个数组，新条目加在最前面
   *  每条只有 title + brief（中文 ≤50 字、英文 ≤30 词），brief 是公开页渲染的全部文字。
   *  全文不在这里：写完全文 → 跑 `node scripts/changelog-split.mjs` 存进本地
   *  docs/工程决策记录.md（docs/ 已 gitignore，不部署）→ 再压成 brief 留在本文件。
   * ======================================================== */
  const entries = [
    {
      date: '2026-09-24',
      title: {
        zh: 'riverrun 动机首句改写、删掉「关系」一节；存档两处数字定案',
        en: 'The riverrun motivation gets a new opening line, the relation section goes, and two archive figures are settled'
      },
      brief: {
        zh: 'riverrun 动机首句改写、删掉「关系」一节；存档 376→384 断言、1447／1450 注明是两次快照',
        en: 'A new opening line for the riverrun motivation and the removal of the relation section; two archive figures settled at 384 assertions and 1447 to 1450 characters.'
      },
      media: ''
    },
    {
      date: '2026-09-24',
      title: {
        zh: '公开 changelog 每条只留 title + brief：全文移入本地存档，中文字体子集随之缩小',
        en: 'The public changelog renders title and brief only, full texts move into a local archive, and the Chinese font subset shrinks with them'
      },
      brief: {
        zh: '公开日志每条只留 title + brief，全文移入本地存档；js/changelog.js 272,843 → 64,816 字节，中文主字体 Regular 279,588 → 239,608 字节',
        en: 'The public log keeps only title and brief, with full texts archived locally; js/changelog.js fell from 272,843 to 64,816 bytes and the Chinese font from 279,588 to 239,608.'
      },
      media: ''
    },
    {
      date: '2026-09-23',
      title: {
        zh: '三件作品页的简介与动机改由具体经历承担；6U104HP 公开记录补入展会现场',
        en: 'Overviews and motivations on three project pages now carried by concrete experience, and the 6U104HP exhibition record gains what happened on the floor'
      },
      brief: {
        zh: '三件作品页简介与动机按作者口述逐句改稿；「——」密度 2.31／2.12／4.51‰；字体、生成器与 verify、coverage 均复核',
        en: 'Three project pages were rewritten sentence by sentence from the author\'s account; dash rates are 2.31, 2.12 and 4.51 per thousand, with the fonts, generators and all checks rerun.'
      },
      media: ''
    },
    {
      date: '2026-09-23',
      title: {
        zh: 'THE INDUCTION MIXER 的「装置态」改为设想口径（作者确认从未展出过）',
        en: 'The installed state of THE INDUCTION MIXER becomes a stated intention rather than a fact'
      },
      brief: {
        zh: '装置态从未展出，正文与英文改为设想口径；verify 补 2 项断言后 653 项全过，并抓住六份 HTML 的 base.css 号漂移',
        en: 'The installed state was never exhibited, so the page was rewritten as imagined; verify added 2 assertions and all 653 pass, catching base.css version drift across six pages.'
      },
      media: ''
    },
    {
      date: '2026-09-23',
      title: {
        zh: '旧地址与 404 的返回按钮指向自己：pageHref 的空串改成 ./，404 页补上 base',
        en: 'The back button on the legacy addresses and the 404 page pointed at the page itself: pageHref stops returning an empty string and the 404 page declares a base'
      },
      brief: {
        zh: '旧地址五页英文返回按钮指向自身，pageHref 空串改 ./，404 页补 base；verify 651 项全过',
        en: 'Back buttons on five legacy pages pointed at themselves; pageHref now writes ./ and 404 gains a base tag, with all 651 verify assertions passing.'
      },
      media: ''
    },
    {
      date: '2026-09-23',
      title: {
        zh: '子页面按 Esc 返回：目标读返回按钮自己的 href，Lightbox 打开时先让路',
        en: 'Escape returns from any sub-page by following the back button own href, and yields to an open lightbox'
      },
      brief: {
        zh: 'Esc 在带返回栏的子页面回首页，目标读按钮自己的 href，Lightbox 打开时先让路；verify 572→638 项全过',
        en: 'Escape returns from any sub-page with a back bar, reading the button\'s own href and yielding to an open lightbox; verify grew from 572 to 638 assertions.'
      },
      media: ''
    },
    {
      date: '2026-09-22',
      title: {
        zh: '字体版本号链条改成自动：gen-cjk-main.py 用内容哈希一次写全，改中文只需跑一条命令',
        en: 'The font version chain becomes automatic: gen-cjk-main.py writes every reference from a content hash, so changing Chinese copy takes one command'
      },
      brief: {
        zh: '字体版本号改由脚本按字形 sha256 前 8 位哈希自动写全；改中文只需跑一条命令，该链一天漏过三次',
        en: 'Font versions now come from the first 8 hex digits of a glyph sha256, written by one command; the chain had been missed three times in a day.'
      },
      media: ''
    },
    {
      date: '2026-09-22',
      title: {
        zh: '主字体 URL 版本号不再靠记性：两份副本改为现读 base.css，并加 verify 第十二节逐字比对',
        en: 'The main font URL version no longer relies on memory: two copies now read base.css, and a new verifier section compares every reference'
      },
      brief: {
        zh: '生成器改为现读 base.css，31 处字体 URL 归一为 ?v=4；verify 第十二节逐字比对，子集提到 1459 字',
        en: 'Both generators now read the font URL from base.css, all 31 references became ?v=4, and verify section twelve checks every reference; the subset grew to 1459 characters.'
      },
      media: ''
    },
    {
      date: '2026-09-22',
      title: {
        zh: '删除作品信息栏的「本页文字」一行（三件作品），并补回上一次漏掉的字体子集重切',
        en: 'The Page text metadata row is removed from three works, and the CJK subset missed by the previous commit is rebuilt'
      },
      brief: {
        zh: '作品页信息栏删掉「本页文字」一行，三件作品共删 6 行；补跑漏掉的字体子集重切，1453→1456 字，verify 585 项全过',
        en: 'The Page text row was dropped from three works, six lines in all; the font subset rerun took it from 1453 to 1456 characters, with all 585 assertions passing.'
      },
      media: ''
    },
    {
      date: '2026-09-22',
      title: {
        zh: '6U104HP 参展记录入册：画廊从横滑胶片条改为分组网格，21 张一屏可见',
        en: 'The 6U104HP exhibition record joins the gallery, which moves from a horizontal film strip to grouped grids'
      },
      brief: {
        zh: '画廊由横滑胶片条改为分组网格，21 张分两段、参展 10 张按四个活动分组，Lightbox 加 n / 21 指示',
        en: 'Gallery switched from a horizontal film strip to a grouped grid: 21 images in two sections, the 10 exhibition shots in four event groups, plus an n-of-21 lightbox counter.'
      },
      media: ''
    },
    {
      date: '2026-09-22',
      title: {
        zh: '作品页字体预载 URL 补上 `?v=`：中文作品页冷缓存少下 267.7KB',
        en: 'The work-page font preload gets its ?v=, saving 267.7KB on a Chinese work page'
      },
      brief: {
        zh: '作品页预载 URL 漏了 ?v= 导致主字体重复下载，补成 ?v=3 后中文作品页冷缓存 809.5KB→541.8KB',
        en: 'Work-page preload URL was missing ?v=, so the main font downloaded twice; adding ?v=3 cut a cold Chinese work page from 809.5KB to 541.8KB.'
      },
      media: ''
    },
    {
      date: '2026-09-22',
      title: {
        zh: 'THE INDUCTION MIXER 规格栏补上尺寸：面板322×188mm、箱体厚43.5mm',
        en: 'The Induction Mixer spec line filled in: panel 322×188mm, case 43.5mm thick'
      },
      brief: {
        zh: '规格栏的【尺寸待补】填成面板322×188mm、箱体厚43.5mm，中英同步，字体补入「凸」字1452→1453',
        en: 'The Specs placeholder became panel 322×188mm and case thickness 43.5mm; the subset grew 1452 to 1453 glyphs for the character 凸.'
      },
      media: ''
    },
    {
      date: '2026-09-22',
      title: {
        zh: '站内四页也改目录式地址：/zh/、/works/、/about/、/changelog/，并把正文烤进 HTML（含首页的爬取路径）',
        en: 'The four site pages move to directory addresses and bake their content into the HTML, giving crawlers a path from the homepage'
      },
      brief: {
        zh: '站内四页改目录式地址并保留旧地址，正文烤进 HTML：8 段简介、8 条作品链接，日志 98 条仍走 JS',
        en: 'Four site pages moved to directory URLs with old addresses kept, and their text is baked into HTML: eight paragraphs, eight work links; the 98-entry changelog stays in JavaScript.'
      },
      media: ''
    },
    {
      date: '2026-09-22',
      title: {
        zh: '中文全量自托管：主字体按站内用字重做（1447 字、更小），导航标签与正文统一字形',
        en: 'All Chinese glyphs are self-hosted again: the main font rebuilt from the site own character set, and the navigation labels unified with the body typeface'
      },
      brief: {
        zh: '旧子集只 1023 码位、234 字落到系统字体；重切主字体 1447→1450 字／274KB，覆盖率差集为空',
        en: 'The old 1023-codepoint subset left 234 characters in the system font; the rebuilt main font went from 1447 to 1450 characters at 274KB and the coverage difference is now empty.'
      },
      media: ''
    },
    {
      date: '2026-09-22',
      title: {
        zh: '英文页不再为几个汉字下载 295KB 思源：新增 SiteCJK 微型子集与音标 local() 面',
        en: 'English pages stop downloading the 295KB Source Han file for a few characters, via a tiny SiteCJK subset and a local IPA face'
      },
      brief: {
        zh: '新增 SiteCJK 12 字子集（Regular/Bold 各 4.0KB）与音标 local() 面，英文页不再为几个汉字拉整份 295KB 思源',
        en: 'A 12-character SiteCJK subset at 4.0KB each plus a local() IPA face stop English pages from pulling the 295KB Source Han file.'
      },
      media: ''
    },
    {
      date: '2026-09-22',
      title: {
        zh: '英文界面导航文案修复；英文页不再为两个汉字下载 295KB 字体；生成页按布局只挂需要的脚本',
        en: 'English navigation labels fixed, English pages no longer pull a 295KB font for two characters, and generated pages load only the scripts their layout needs'
      },
      brief: {
        zh: '英文导航中文文案因脚本加载顺序少两个键，改由 i18n.js 合并修复；英文页字体 295KB→0KB，三个脚本 81KB 按布局摘除',
        en: 'English nav labels fell back to Chinese when load order dropped two keys; English pages went from 295KB to 0KB of CJK font, and three scripts (81KB) are layout-scoped.'
      },
      media: ''
    },
    {
      date: '2026-09-22',
      title: {
        zh: '作品页地址改为目录式 works/<id>/：静态生成 16 页、补全 meta 与预览信息，旧地址保持可用',
        en: 'Work pages move to directory addresses under /works/<id>/: sixteen generated pages with real metadata, old links still work'
      },
      brief: {
        zh: '作品页改由脚本生成 works/<id>/ 静态页 16 个，meta 与主图烤进 HTML，旧地址保留；首屏 LCP 1760→592ms',
        en: 'Work pages became 16 generated static works/<id>/ pages with baked metadata and hero images; the old address still works and LCP fell from 1760ms to 592ms.'
      },
      media: ''
    },
    {
      date: '2026-09-21',
      title: {
        zh: '首屏文案闪烁：4 个 HTML 的绘制前定文案落地；导航静态化、图片淡入、封面降级经审计否决',
        en: 'First-paint text flashes fixed by deciding text before paint on four pages; static navigation, image fade and cover demotion rejected by audit'
      },
      brief: {
        zh: '4 个 HTML 在首次绘制前写入 h1 文案，JS 与 CSS 零改动；changelog 中文标题闪烁 1838ms 归零',
        en: 'Four HTML files write their headings before first paint with no JS or CSS change, cutting the changelog heading flash from 1838ms to zero.'
      },
      media: ''
    },
    {
      date: '2026-09-21',
      title: {
        zh: '作品页首屏不再闪出「预设样板」：布局改在首次绘制前定下',
        en: 'The project page no longer flashes its placeholder template: the layout is decided before first paint'
      },
      brief: {
        zh: '作品页布局决定提到首次绘制前，6 个面板默认全隐藏，停留 719ms 的样板不再出现；首屏 479ms',
        en: 'The layout decision moved before first paint: all six panels start hidden, killing the 719ms placeholder flash, with first paint at 479ms against 494ms.'
      },
      media: ''
    },
    {
      date: '2026-09-21',
      title: {
        zh: '事故：新旧 JS 混用导致导航整块不渲染；语言参数传播加兜底，公共字符串并入 i18n.js',
        en: 'Incident: mixed old and new JavaScript left the navigation unrendered; the language helper gained a fallback and the shared strings moved into i18n.js'
      },
      brief: {
        zh: '线上旧 app.js 只有 63 字节、缺 App.langHref，导航整块不渲染；加兜底并把 i18n-common.js 并入 i18n.js，只提 2 个号',
        en: 'A cached old app.js of 63 bytes lacked App.langHref and killed the whole navigation; a fallback was added, i18n-common.js folded into i18n.js, and only two versions bumped.'
      },
      media: ''
    },
    {
      date: '2026-09-21',
      title: {
        zh: '语言优先级改为 URL 参数 > localStorage > 默认英文；链接带语言传播，标签页标题随语言切换',
        en: 'Language priority is now URL parameter, then localStorage, then English by default; links carry the language and the tab title follows it'
      },
      brief: {
        zh: '语言优先级改为 ?lang= 优先、其次 localStorage、默认 en；新增 App.langHref，5 处链接带上语言参数',
        en: 'Language priority is now the ?lang= parameter, then localStorage, then English by default, with a new App.langHref carrying it through links on five pages.'
      },
      media: ''
    },
    {
      date: '2026-09-21',
      title: {
        zh: '英文界面不再预加载中日韩字体：首屏少下载 599KB',
        en: 'The CJK font is no longer preloaded on the English interface, saving 599KB on first paint'
      },
      brief: {
        zh: '思源黑体 Regular 与 Bold 合计 599KB 此前在 4 个页面无条件预载，改为仅中文界面注入 preload',
        en: 'The 599KB SourceHanSansSC preload on four pages is now injected only for Chinese, whose Latin faces total just 46KB.'
      },
      media: ''
    },
    {
      date: '2026-09-21',
      title: {
        zh: '首页四角署名保持汉字；标签页标题用罗马字',
        en: 'The corner signature stays in Chinese characters; the tab title is romanised'
      },
      brief: {
        zh: '首页四角署名还原为固定的「泻火 曹浩轩」，仅标签页标题按语言给罗马字；审计文档 §3 的说法不适用于署名',
        en: 'The homepage corner signature stays the fixed characters, only the tab title goes roman, and the audit\'s section 3 does not cover an author\'s own signature.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '公开记录更正：两件作品的汇报日期均为 2026.07.01；《声音设计》期末考核不再计入公开记录',
        en: 'Public records corrected: both works were presented on 2026.07.01, and the Sound Design assessment is no longer a public showing'
      },
      brief: {
        zh: '两件作品的公开汇报日期由 06.30 改为 2026.07.01，中英共 8 处；riverrun 删去 2026.06.26 的课程考核',
        en: 'Both works\' presentation date changed from 06.30 to 2026.07.01 in eight places across two languages, and riverrun dropped the 2026.06.26 course assessment.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '导航栏白底改为竖向渐隐并加磨砂：从文字底边开始淡出，底部不再有硬线',
        en: 'Nav bar background changed to a vertical fade with a matching backdrop blur, fading from the text baseline down'
      },
      brief: {
        zh: '导航栏白底改为 33px 起渐隐、44px 过渡带的竖向遮罩，磨砂共用同一遮罩；5 个页面 nav.css 加 ?v=1',
        en: 'The nav bar background now fades vertically from 33px across a 44px band with the blur sharing one mask, and nav.css is versioned on five pages.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '接入个人印记 favicon（小篆「水 × 火」白文方印）：站点首次有图标，favicon.ico 的 404 随之消失',
        en: 'Personal mark favicon added, a seal-script water-and-fire white-on-black seal; the site has an icon for the first time and the favicon.ico 404 is gone'
      },
      brief: {
        zh: '新增小篆「水 × 火」白文方印 favicon：横拉 1.25、笔宽 5.2，根目录 ico 含 16/32/48 三种尺寸，404 消失',
        en: 'A seal-script water-and-fire mark became the favicon, stretched 1.25 with a 5.2 stroke width and 16/32/48 sizes in the root ico, ending the 404.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '补齐改名那批漏掉的缓存版本号：回访者曾会拿到旧的 project-data.js，作品列表仍显示旧名且描述为空',
        en: 'Missing cache versions from the rename batch filled in; returning visitors would have received the old project-data.js with the old name and an empty description'
      },
      brief: {
        zh: '改名后四个资源的缓存号没跟着动，回访者会拿到旧的 project-data.js；现补齐 v3 与 v5，两个脚本补 v1',
        en: 'Four renamed assets kept stale cache versions, so returning visitors got the old project-data.js; they now read v3 and v5, and two scripts gained v1.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '作品信息栏上下两条分割线改为等距：描述以信息栏开头时，标题下边距由 24px 收窄为 14px（移动 12px）',
        en: 'Equalised the two rules around the work-metadata block: when a description opens with the block, the heading margin-bottom drops from 24px to 14px (12px on mobile)'
      },
      brief: {
        zh: '信息栏上下分割线不等距，标题下边距由 24px 收到 14px（移动 12px）；实测中文 28/19px 变 18/19px',
        en: 'The rules above and below the metadata bar were uneven; the heading margin drops from 24px to 14px (12px mobile), taking Chinese from 28/19px to 18/19px.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '首页支持鼠标拖拽翻牌（与触摸同一套判定），含五层防误触',
        en: 'Homepage card stack now supports mouse-drag flipping (same logic as touch) with five anti-mistouch safeguards'
      },
      brief: {
        zh: '鼠标拖拽与触摸共用 swipeBy 判定，阈值 50px，另有 8px 手抖门槛等 5 层防误触',
        en: 'Mouse drag now shares swipeBy with touch at a 50px threshold and an 8px tremor guard, in five anti-mistouch layers.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '修复语言切换「点到中文/English 字样切不了，只是在拖」与首页卡片图片可被鼠标拖拽',
        en: 'Fixed the language toggle ("clicking 中文/English drags instead of switching") and draggable homepage card images'
      },
      brief: {
        zh: '原生拖拽吞掉 click，语言按钮移 5px 就切不动；禁掉导航与全站图片拖拽后 zh→en 恢复',
        en: 'Native drag-and-drop swallowed the click, so a 5px move on the language toggle did nothing; blocking drags on nav UI and all images restores zh to en.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '作品改名 THE FET MIXER → THE INDUCTION MIXER',
        en: 'The work is renamed THE FET MIXER → THE INDUCTION MIXER'
      },
      brief: {
        zh: 'FET 会被读成场效应管，作品改名 THE INDUCTION MIXER，显示名与图片名共 4 处同步改',
        en: 'FET reads as field effect transistor, so the work became THE INDUCTION MIXER, with four display names plus image filenames changed.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '新增作品信息栏与副标题组件',
        en: 'Work-meta bar and subtitle components added'
      },
      brief: {
        zh: '新增八行信息栏，两列 grid、标签 88px（移动 72px），因容器是 p 只能用 span 构造',
        en: 'Added an eight-row metadata bar in a two-column grid with an 88px label column (72px on mobile), built from spans because the container is a p.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '6U104HP 与 THE INDUCTION MIXER 介绍重写；关于页专业名修正',
        en: 'The 6U104HP and THE INDUCTION MIXER introductions rewritten; the About page degree corrected'
      },
      brief: {
        zh: '6U104HP 补回 8 项个人参与与 2023–2025 三版开发史（空箱与满载同为 3.5kg）；关于页专业名改为艺术与科技',
        en: '6U104HP gained eight missing contribution items and its 2023-2025 revision history (3.5kg empty, 3.5kg fully loaded); the About degree became Art and Technology.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: 'riverrun 介绍重写、事实性更正，并新增「引子」一节',
        en: 'riverrun rewritten, factually corrected, and given a new introduction section'
      },
      brief: {
        zh: 'riverrun 删掉方案里从未搭建的四组扬声器与 5×5m 空间，形态改为声音作品，另补四节与引子',
        en: 'riverrun dropped the never-built four speaker groups and 5 by 5 metre space, its type became sound work, and four missing sections plus a preface were added.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '重写内容完整性复核与补正',
        en: 'Completeness review of the rewrites'
      },
      brief: {
        zh: '对着 git 原始版本逐项比对，补回 6 处遗漏：6U104HP 订购联系方式、portmanteau 术语与一个核心命题',
        en: 'Comparing against the git originals item by item turned up six omissions, restored: the 6U104HP ordering contact, the term portmanteau, and one core proposition.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '作品副标题改为嵌在标题内',
        en: 'The work subtitle moves inside the title'
      },
      brief: {
        zh: '副标题原本落在 h2 下边框之下，现新增 project.subtitle 字段，由 setTitle() 嵌进标题内，8 件作品启用',
        en: 'The subtitle used to fall below the h2 bottom border; a new project.subtitle field has setTitle embed it inside the heading, enabled for all eight works.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: 'SnH → S&H 记法统一；作品形态词修正',
        en: 'SnH unified to S&H; work type words corrected'
      },
      brief: {
        zh: 'SnH 全站 6 处统一为 S&H；EDGEDGEDGE 与 WE WILL HAVE BEEN HERE 的形态词改为与正文一致',
        en: 'SnH became S&H in all six places site-wide, and the type words for EDGEDGEDGE and WE WILL HAVE BEEN HERE were corrected to match their bodies.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: 'WE WILL HAVE BEEN HERE 改为自动申请麦克风权限',
        en: 'WE WILL HAVE BEEN HERE switched to automatic microphone permission'
      },
      brief: {
        zh: '页面加载即调 getUserMedia，状态行五态并移到标题下；开篇 329 字对应作品 90 秒延时',
        en: 'The page now calls getUserMedia on load, with a five-state status line moved under the title; the 329-character opening matches the work\'s 90-second delay.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '作品正文的分节小标题统一为七段固定槽位',
        en: 'Body section headings unified into seven fixed slots'
      },
      brief: {
        zh: '分节小标题统一为七个固定槽位（含生造词后完成）；6U104HP 仍缺 4 节、riverrun 缺 2 节',
        en: 'Section headings are now seven fixed slots, including the coined Postlude; 6U104HP still lacks four, riverrun two, and four works have none.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: 'WWHBH 新增实时晕染层（第一版）',
        en: 'WWHBH gains a live ink-bleed layer, first version'
      },
      brief: {
        zh: '新增实时晕染层：90 秒铺满、单次生成 25–40ms、生长锁 15fps；起点由屏外 16% 收到 5%',
        en: 'A live ink-bleed layer fills in 90 seconds at 25–40ms per render and 15fps; the origin moved from 16% off-canvas to 5%.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '晕染层重做：从「像一杯水泼上去」改为真正的毛细渗流',
        en: 'Ink layer rebuilt from a splash of water into real capillary flow'
      },
      brief: {
        zh: '晕染层改用程函方程解输运，前缘沿快通道分叉；种子半径写死 26，480px 画布下 27px 一颗都种不下',
        en: 'The ink layer now solves an eikonal transport problem so the front branches along fast channels; a hardcoded seed radius of 26 failed at 480px canvases.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '取消浓度上限；墨改为分层累积',
        en: 'Density cap removed; ink becomes layered accumulation'
      },
      brief: {
        zh: '取消浓度上限，墨分累积层与当前层 alpha 合并；连续 5 轮峰值 25%→43%→56%',
        en: 'The density cap was dropped and ink became a base layer plus the current cycle merged by alpha; five cycles peaked at 25%→43%→56%.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '墨深换成域扭曲 fBm，再改为纯 fBm 的颗粒质感',
        en: 'Ink depth moved to a domain-warped fBm, then to a granular plain fBm'
      },
      brief: {
        zh: '墨深换成域扭曲 fBm，覆盖由 90 秒周期驱动；D_WARP 0.35→0.08、单轮最深 0.34→0.68，重启不 bake',
        en: 'Ink depth moved to a domain-warped fBm driven by the 90-second cycle, with warp 0.35→0.08 and single-cycle depth 0.34→0.68; restart deliberately does not bake.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '墨深第四版改为面积指标；查明长时间后的饱和',
        en: 'Ink depth becomes area targets; the long-run saturation explained'
      },
      brief: {
        zh: '墨深按面积指标切档：70% 浅、10% 留白、20% 深，用直方图 p10/p80 定位；实测每轮增量 +38→+23→+5→+1 后饱和',
        en: 'Ink depth now cuts three bands by area — 70% light, 10% palest, 20% dark — via histogram percentiles; the per-cycle gain measured +38, +23, +5, +1 before saturating.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '就墨效提十二个问题逐条落定',
        en: 'Twelve questions on the ink settled one by one'
      },
      brief: {
        zh: '修掉重启只洗掉最新一轮的 bug，褪色时累积层也乘 alpha；单轮最深 68%→50%，手机端 MOBILE_SCALE 0.72',
        en: 'Restart now fades the accumulation layer too, not just the newest cycle; single-cycle depth dropped from 68% to 50% and mobile scales to 0.72.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '墨改为盖在整个页面之上',
        en: 'The ink now covers the whole page'
      },
      brief: {
        zh: '墨层 z-index 由 0 提到 200 盖住全页，按钮处仍可点击；矩形测量曾因按钮 display:none 失效，改为每 500ms 兜底',
        en: 'Ink now sits at z-index 200 over the whole page, still clickable through; a display:none button broke the dimming rect, so the tick refreshes it every 500ms.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '录音设备排查，与「失败状态不晕染」的设计定案',
        en: 'Audio device troubleshooting, and the decision that failure states do not bleed'
      },
      brief: {
        zh: '排查音频链路：source 只接 delay、delay 才接 destination，前 90 秒必然静音；三种失败状态实测非零像素均为 0',
        en: 'The audio chain has no direct path — source feeds only the delay — so the first 90 seconds are silent; three failure states all measured zero non-zero pixels.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '消除像素感；旧墨随时间晕染的动态平衡',
        en: 'Pixelation removed, and a dynamic equilibrium for ageing ink'
      },
      brief: {
        zh: '内部画布 SCALE 3.0→2.0 消除 11 像素疙瘩；每轮加一次衰减，8 轮峰值稳定在 76–84%、不到纯黑',
        en: 'Internal canvas scale went 3.0→2.0 to kill 11-pixel clumps; a per-cycle decay holds the peak at 76–84% over eight cycles, never pure black.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '关闭按钮失去视觉豁免；时间晕染减到四分之一',
        en: 'The close button loses its exemption; bleeding cut to a quarter'
      },
      brief: {
        zh: '关闭按钮遮罩机制整套删除，扫描线无凹口；旧墨时间晕染 AGE_STEPS_MAX 60→15，摊开距离只能 ÷2',
        en: 'The close-button dimming mechanism was deleted and a scan line shows no notch; ageing steps fell 60→15, quartering the lightening but only halving the spread.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '扩散节奏铺满整轮；重启溶解减半速度',
        en: 'Diffusion paced across a whole cycle; the restart dissolve halved'
      },
      brief: {
        zh: '扩散步间隔由写死 1500ms 改为 90000÷15=6000ms 铺满整轮；重启溶解 FADE_MS 1500→3000、每帧步数 2→1',
        en: 'The diffusion step interval is derived as 90000÷15=6000ms instead of a hardcoded 1500ms, and the restart dissolve went 1500→3000ms with one diffusion step per frame.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '换轮那一帧的「瞬间全屏阶梯式变浅」已消除',
        en: 'The instantaneous full-screen step at the cycle handover removed'
      },
      brief: {
        zh: '换轮时 bake 与衰减同帧，整屏一帧掉 8%（均值 41.169→37.500）；0.92 摊进 15 步，实测每轮恰好 15 步',
        en: 'Bake and decay ran in one frame at handover, dropping the screen 8% (mean 41.169→37.500); the 0.92 now spreads over 15 diffusion steps per cycle.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '两项设计定案：终态不是三档结构、隐藏标签页照常计时',
        en: 'Two decisions: the end state has no tiers, and a hidden tab keeps counting'
      },
      brief: {
        zh: '两项定案：终态收敛为中间灰（实测约 66%），三档结构不保留；隐藏标签页照常计时，文档相反说法已改正',
        en: 'Two decisions: the end state converges to middle grey (measured mean about 66%), so the three-tier structure is dropped, and a hidden tab keeps counting.'
      },
      media: ''
    },
    {
      date: '2026-09-20',
      title: {
        zh: '两份文档与两个代码注释一次性对齐到代码',
        en: 'Both guides and two code comments brought into line with the code'
      },
      brief: {
        zh: '文档与代码注释对齐：生成耗时实测 52ms（原写 106ms），V_GAIN 10→8、画布钳位 220–460→300–800，并清掉三个已不存在的常量',
        en: 'Docs and code comments realigned to the code: generation cost measures 52ms, not the documented 106ms, and V_GAIN goes 10 to 8 with the canvas clamp now 300–800.'
      },
      media: ''
    },
    {
      date: '2026-09-12',
      title: {
        zh: 'SPECTRAL DISSECTOR 更新 26.09.12：新增 Dry 开关，修复 Perc Band 在 Band 1-9 中的信号复制',
        en: 'SPECTRAL DISSECTOR update 26.09.12: Dry switch added; Perc Band duplication in Bands 1-9 fixed'
      },
      brief: {
        zh: '作品页追加 26.09.12 条目并只留最新包（约 62KB）；插件新增 Dry 开关消除 84ms 时差，并修掉 Perc Band 在 Band 1-9 里的信号复制',
        en: 'Page gains a 26.09.12 entry with only the ~62KB latest archive; the plugin adds a Dry switch removing an 84ms offset and fixes Perc Band duplication in Bands 1–9.'
      },
      media: ''
    },
    {
      date: '2026-08-26',
      title: {
        zh: '首页 The JustType Study 卡片封面裁切上移：机箱上下留白对齐',
        en: 'Homepage card cover for The JustType Study cropped upward: equal margins above and below the case'
      },
      brief: {
        zh: '首页卡片封面裁切上移，按封面 1200×901 中机箱中心 y≈478.5 取 object-position 72.5%，移动端 65% 时误差不超 1.8px',
        en: 'Homepage card cover crop moved up: object-position 72.5% from the case centre at y≈478.5 in the 1200×901 image; mobile 65% holds error under 1.8px.'
      },
      media: ''
    },
    {
      date: '2026-08-16',
      title: {
        zh: '安全与稳定性修复：本地服务器路径绕过、WWHBH 双击竞态、项目页空白回归、清除历史中的本地私钥',
        en: 'Security & stability fixes: local server path bypass, WWHBH double-click race, project page blank regression, and removal of localhost private key from Git history'
      },
      brief: {
        zh: '本地服务器黑名单大小写绕过已堵，WWHBH 加 starting 锁避免双击建两套回授图；project.js 误删 fillContent 的空白回归修好，历史里的 key/cert 用 git-filter-repo 清除',
        en: 'Closed the local server\'s case-insensitive blacklist bypass, gave WWHBH a starting lock against double feedback graphs, fixed the fillContent regression that blanked project pages, and purged key/cert from history.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: 'SPECTRAL DISSECTOR 更新 26.08.13：附下载链接与 Bug 修复声明', en: 'SPECTRAL DISSECTOR update 26.08.13: download link & bug-fix note' },
      brief: {
        zh: '作品页末尾追加 26.08.13 条目，声明已知功能性 Bug 已修复，并附 42KB 的 7z 包下载链接，样式沿用 tt-download',
        en: 'Appended a 26.08.13 entry stating all known functional bugs are fixed, with a download link to the ~42KB 7z archive using the existing tt-download style.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: '统一合作作品的开头署名格式（中英文）', en: 'Unified the opening credit format of collaborative works (zh & en)' },
      brief: {
        zh: 'ECCE HOMO、EDGEDGEDGE、SPECTRAL DISSECTOR、6U104HP 开头署名统一为「与[名字]共同创作/设计的作品。」，封面致谢同为「封面图由[名字]拍摄/设计」',
        en: 'Standardised the opening credit on four collaborative works as a work co-created or co-designed with the partner, and the cover credit as photographed or designed by them.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: 'riverrun 混音器：延迟拆为双平行（短 + 长），各自带反馈与微抖', en: 'riverrun mixer: delay split into two parallel lines (short + long), each with its own feedback & detune' },
      brief: {
        zh: 'FX 链单延迟拆成两条平行延迟：长延迟 0.9–1.4s 约 2.2× 短延迟，各自反馈 0.08–0.19 与 0.6 倍，并配 ±12ms/±15ms 独立微抖',
        en: 'Split the single FX delay into two parallel lines, the long one at 0.9–1.4s (about 2.2x the short), each with its own feedback and a ±12ms or ±15ms detune.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: 'riverrun 混音器：反馈降低并去单音化 + drone 音量下限抬高', en: 'riverrun mixer: feedback lowered & de-tonalized + drone volume floor raised' },
      brief: {
        zh: '共振反馈 0.24–0.36 降到 0.11–0.19，drone 下限从约 0 提到 0.2，并去掉干声相对钳制、改为 RMS 超 0.35 才压',
        en: 'Resonance feedback dropped from 0.24–0.36 to 0.11–0.19, the drone floor rose from about 0 to 0.2, and the dry-relative clamp became an absolute guard above 0.35 RMS.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: 'riverrun 混音器：FX 输出电平提升（-12dB → -6dB，包络满度参考降低）', en: 'riverrun mixer: FX output level raised (-12dB → -6dB, lower envelope reference)' },
      brief: {
        zh: 'FX 输出电平从约 -12dB 提到 -6dB：包络系数 0.25→0.5，干声满度参考 0.25→0.2，硬顶放宽到干声×0.5',
        en: 'FX output raised from about -12dB to -6dB: the envelope scale went 0.25 to 0.5, the dry full-scale reference 0.25 to 0.2, and the hard ceiling to dry×0.5.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: 'riverrun 混音器：干声包络跟随控制 FX 输出音量（attack 50ms / decay 150ms）', en: 'riverrun mixer: dry-signal envelope follower drives FX output volume (attack 50ms / decay 150ms)' },
      brief: {
        zh: 'FX 音量改由干声包络跟随控制，满度 0.25 RMS、起 50ms 落 150ms，fxReturn 增益 0.25×包络；阶跃实测 63% 分别落在 50ms 与 150ms',
        en: 'FX volume now follows a dry envelope: full scale 0.25 RMS, 50ms rise and 150ms fall, gain 0.25×envelope; step tests hit 63% at about 50ms and 150ms.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: 'riverrun 混音器：三个共振效果圈互相重叠（拾取半径动态加大）', en: 'riverrun mixer: the three resonance zones now overlap (pickup radius enlarged dynamically)' },
      brief: {
        zh: '三点位置收拢到 0.30–0.70，半径按最大两两间距 ×1.25 动态计算（下限 0.15×min(W,H)），200 轮桌面与手机画布重叠全成立',
        en: 'The three resonance points moved to 0.30–0.70 with radii sized from the largest pairwise distance ×1.25 (floor 0.15×min(W,H)); 200 desktop and mobile rounds all overlap.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: 'riverrun 混音器：3 个高反馈共振点（音色差异大，每次启动随机）', en: 'riverrun mixer: three high-feedback resonance points (distinct timbres, randomized every start)' },
      brief: {
        zh: 'makeFxZones() 每次启动随机放 3 个高反馈音色点（反馈 0.24–0.36），暗长/亮闪/中雾按距离 smoothstep 混合；200 次实测延迟约 0.2/0.45/0.7s',
        en: 'makeFxZones() drops 3 high-feedback timbre points (0.24–0.36) at random each start, blending dark-long, bright-shimmer and mid-mist by smoothstep distance; 200 runs separate delays at about 0.2/0.45/0.7s.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: 'riverrun 混音器：效果器位置映射每次启动随机化', en: 'riverrun mixer: effects-position mapping randomized on every start' },
      brief: {
        zh: 'makeFxMap() 让 9 个参数的坐标与斜率每次启动重新随机，取值仍在既有区间内；300 次启动实测画像全部不同',
        en: 'makeFxMap() rerandomizes the coordinate and slope of 9 parameters on every start, keeping values inside their existing ranges; 300 starts all produced distinct profiles.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: 'riverrun 作品页：交互式空间混音器（复现 The FET Mixer）与手机端自动播放修复', en: 'riverrun work page: interactive spatial mixer (recreating The FET Mixer) + mobile auto-play fix' },
      brief: {
        zh: 'riverrun 作品页做成交互式空间混音器：12 条音轨按 4×3 排布，素材转成约 17MB 的 m4a；另修掉手机端点击即全部自动播放的问题',
        en: 'Built the riverrun spatial mixer: 12 tracks laid out 4x3, sources converted to about 17MB of m4a, plus a fix for mobile auto-playing every track on tap.'
      },
      media: 'img/riverrun.webp'
    },
    {
      date: '2026-08-13',
      title: { zh: 'riverrun 混音器：布局与增益 UI 迭代（桌面左右/手机上下，增益控件最终移除）', en: 'riverrun mixer: layout and gain-UI iterations (desktop side-by-side / mobile stacked; gain control eventually removed)' },
      brief: {
        zh: '桌面左交互右 380px 说明、手机 40dvh 舞台；增益控件从 40px 分段条一路减到全部移除，点簇格距 min(W,H)×0.26',
        en: 'Desktop puts a 380px description beside the stage, mobile stacks a 40dvh stage, and the gain control shrank from a 40px segmented bar to nothing; dot spacing is min(W,H)×0.26.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: 'riverrun 混音器：内置效果器（drone FX 链）与交互/性能优化', en: 'riverrun mixer: built-in effects (drone FX chain) + interaction & performance' },
      brief: {
        zh: '内置黑箱 drone FX 链（2.6s 混响、0.28–0.62s 延迟、12–24% 反馈）恒不静默；空闲降帧到约 10fps，低端机（≤4 核）用 512 的 analyser',
        en: 'The built-in black-box drone FX chain (2.6s reverb, 0.28–0.62s delay, 12–24% feedback) never goes silent; idle frames fall to about 10fps and low-end devices (≤4 cores) use 512 analysers.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: '作品页互链：riverrun ↔ The FET Mixer', en: 'Cross-linked work pages: riverrun ↔ The FET Mixer' },
      brief: {
        zh: 'riverrun 与 The FET Mixer 两页互加跳转链接，做法是 project-data.js 新增通用 related 字段、project.js 的 appendRelated() 在描述加载后渲染',
        en: 'The riverrun and The FET Mixer pages now cross-link, via a generic related field in project-data.js and an appendRelated() in project.js that renders the block after the description loads.'
      },
      media: ''
    },
    {
      date: '2026-08-13',
      title: { zh: '新增作品《6U104HP》并重构 Gallery 为等高胶片条布局', en: 'Added new work "6U104HP" and refactored Gallery into an equal-height film-strip layout' },
      brief: {
        zh: '新增 6U104HP 作品页与 11 张 WebP 图；Gallery 改等高胶片条，消除 352↔1067px 的每屏高度跳动',
        en: 'Added the 6U104HP work page with 11 WebP photos; the Gallery became an equal-height film strip, ending the 352 to 1067px height jumps.'
      },
      media: 'img/6u104hp.webp'
    },
    {
      date: '2026-08-10',
      title: { zh: '更新作品简介：The JustType Study 与 SPECTRAL DISSECTOR', en: 'Updated work briefs: The JustType Study and SPECTRAL DISSECTOR' },
      brief: {
        zh: '作品列表页改 2 条简介：JustType 由乐器改称合成器，SPECTRAL DISSECTOR 补上一句话简介',
        en: 'Updated two works-page briefs: JustType now reads synthesizer instead of instrument, and SPECTRAL DISSECTOR gained its one-line brief.'
      },
      media: ''
    },
    {
      date: '2026-08-09',
      title: { zh: '新增作品《The JustType Study》', en: 'Added new work "The JustType Study"' },
      brief: {
        zh: '新增 The JustType Study 作品页；1930×1448 封面出两档 WebP，录音转 178kbps 的 m4a',
        en: 'Added the JustType Study page: two WebP covers from the 1930×1448 original and a 22:51 recording encoded to a 178kbps m4a.'
      },
      media: 'img/the-just-type-study.webp'
    },
    {
      date: '2026-08-05',
      title: { zh: '观看了电影《痴迷》', en: 'Watched the film Obsession' },
      brief: {
        zh: '看了心理恐怖片《痴迷》（Obsession），对细节丰满的这类片子毫无抵抗力',
        en: 'Watched the psychological horror film Obsession, whose richly detailed texture is exactly what I cannot resist.'
      },
      media: ''
    },
    {
      date: '2026-07-22',
      title: { zh: '青海之旅', en: 'Trip to Qinghai' },
      brief: {
        zh: '7 月 17 日出发去青海，7 月 24 日回上海，青海非常美丽',
        en: 'Went to Qinghai on July 17 and returned to Shanghai on July 24; Qinghai is very beautiful.'
      },
      media: ''
    },
    {
      date: '2026-07-04',
      title: { zh: '修复 SPECTRAL DISSECTOR 工程的 Cepstrum 算法 bug', en: 'Fixed a Cepstrum algorithm bug in the SPECTRAL DISSECTOR project' },
      brief: {
        zh: '修好 Cepstrum 的谐波分离 bug；介绍末尾加 2026.07.04 一段：I hate Cepstrum.',
        en: 'Fixed the Cepstrum bug that broke harmonic separation, and appended a 2026.07.04 note reading I hate Cepstrum.'
      },
      media: ''
    },
    {
      date: '2026-07-02',
      title: { zh: '重写 SPECTRAL DISSECTOR 项目介绍', en: 'Rewrote the SPECTRAL DISSECTOR project introduction' },
      brief: {
        zh: 'SPECTRAL DISSECTOR 介绍换成作者技术自述，配 1497×252 截图（WebP 13KB），日期改 2026.07.02',
        en: 'Replaced the SPECTRAL DISSECTOR intro with the author\'s own technical account, adding a 1497×252 screenshot as a 13KB WebP and the date 2026.07.02.'
      },
      media: ''
    },
    {
      date: '2026-07-02',
      title: { zh: '配置 Tiliqua macOS 开发环境（PDM + OSS CAD Suite 工具链）', en: 'Set up Tiliqua macOS dev environment (PDM + OSS CAD Suite toolchain)' },
      brief: {
        zh: '配好 Tiliqua 工具链：PDM 2.28.0 与 OSS CAD Suite，下载被截断在 81MB 后重下 482MB',
        en: 'Set up the Tiliqua toolchain with PDM 2.28.0 and OSS CAD Suite after a download truncated at 81MB of 482MB was re-fetched.'
      },
      media: ''
    },
    {
      date: '2026-06-29',
      title: { zh: '全站性能优化：脚本 defer、媒体懒加载、字体预载、跳转预取', en: 'Site-wide performance: defer scripts, lazy media, font preload, navigation prefetch' },
      brief: {
        zh: '六项加载优化：五个页面脚本加 defer，ecce-homo 的 12MB 音频改 preload=none',
        en: 'Six loading fixes: scripts on five pages moved to defer, and ecce-homo\'s 12MB audio switched to preload=none.'
      },
      media: ''
    },
    {
      date: '2026-06-29',
      title: { zh: '根治首页四角导航纵向对齐（统一偏移变量）', en: 'Root-fixed homepage four-corner vertical alignment (unified offset variable)' },
      brief: {
        zh: '四角对齐改由一个 --nav-y 变量决定（桌面 2px、移动 4px），偏移仍是 20+2=22px',
        en: 'Corner alignment now comes from one --nav-y variable (2px desktop, 4px mobile), keeping the offset at 20+2=22px.'
      },
      media: ''
    },
    {
      date: '2026-06-29',
      title: { zh: '对齐首页顶部一对导航的纵向位置', en: 'Aligned the top pair of homepage nav vertically' },
      brief: {
        zh: '右上容器 padding-top 由 4px 改 2px，顶部一对名字与链接不再差约 2px',
        en: 'Changed .nav-top-right padding-top from 4px to 2px, removing the roughly 2px offset in the top nav pair.'
      },
      media: ''
    },
    {
      date: '2026-06-29',
      title: { zh: 'SPECTRAL DISSECTOR 改用 Ecce 布局并添加顶部介绍图', en: 'SPECTRAL DISSECTOR switched to Ecce layout with a top intro image' },
      brief: {
        zh: 'SPECTRAL DISSECTOR 由 Grid 改 Ecce 布局，顶部加 1142×412 横幅（WebP 17KB）',
        en: 'SPECTRAL DISSECTOR moved from the Grid to the Ecce layout with a 1142×412 top banner as a 17KB WebP.'
      },
      media: 'img/spectral-dissector-2.webp'
    },
    {
      date: '2026-06-29',
      title: { zh: '为 SPECTRAL DISSECTOR 介绍补充 Max for Live 版使用方法', en: 'Added Max for Live usage guide to the SPECTRAL DISSECTOR introduction' },
      brief: {
        zh: '介绍后补一段 Max for Live 用法，逐个说明 Band 1–7 Offset 等参数与拆解顺序',
        en: 'Appended a Max for Live usage section covering parameters such as Band 1–7 Offset and the order for dissecting a sample.'
      },
      media: 'img/spectral-dissector.webp'
    },
    {
      date: '2026-06-29',
      title: { zh: '撰写 SPECTRAL DISSECTOR 项目介绍', en: 'Wrote the SPECTRAL DISSECTOR project introduction' },
      brief: {
        zh: '空描述补上中英文介绍：声音拆成 8 层持续音、1 层噪声与 1 层打击，各层可开关路由',
        en: 'Wrote the empty Chinese and English intro: any sound splits into eight sustained-tone layers, one noise layer and one percussion layer, each switchable and routable.'
      },
      media: 'img/spectral-dissector.webp'
    },
    {
      date: '2026-06-29',
      title: { zh: '为 riverrun 添加封面与项目页图片', en: 'Added cover and project-page image for riverrun' },
      brief: {
        zh: 'riverrun 补齐 1200px 卡片封面与 1600px 项目页竖图，Grid 支持 media.type=image',
        en: 'Filled in riverrun\'s missing 1200px card cover and 1600px portrait, and taught Grid to render media.type=image.'
      },
      media: 'img/riverrun.webp'
    },
    {
      date: '2026-06-25',
      title: { zh: '为 EDGEDGEDGE 添加作品简介', en: 'Added brief for EDGEDGEDGE' },
      brief: {
        zh: '作品列表页为 EDGEDGEDGE 补 1 条简介：与钢铁大腿共同创作的回授声音装置',
        en: 'Added the missing one-line brief for EDGEDGEDGE on the works page: a feedback sound installation co-created with Gangtie Datui.'
      },
      media: ''
    },
    {
      date: '2026-06-25',
      title: { zh: '修复首页 [全部作品 →] 与 [en] English 垂直高度不一致', en: 'Fixed vertical alignment between [ALL WORKS →] and [en] English on homepage' },
      brief: {
        zh: '右下语言切换改成与左下一致的 flex 列，同以 bottom:20px 锚定，消掉 2px 基线差',
        en: 'Made the bottom-right language toggle a flex column like the left one, both anchored at bottom:20px, removing the 2px baseline gap.'
      },
      media: ''
    },
    {
      date: '2026-06-25',
      title: { zh: '中文换思源黑体自托管 + 中英自动间距 + 纯净 0', en: 'Self-hosted Source Han Sans SC for CJK + auto CJK↔Latin spacing + plain zero' },
      brief: {
        zh: '中文换自托管思源黑体（Regular/Bold 各约 300KB），加 autospace.js 插 0.2em 空格与纯净 0 字体',
        en: 'CJK switched to self-hosted Source Han Sans SC (~300KB per weight), plus autospace.js inserting 0.2em thin spaces and a PlainZero webfont.'
      },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: '引入 DejaVu Sans Mono webfont 保证跨平台字体一致', en: 'Self-hosted DejaVu Sans Mono webfont for cross-platform font consistency' },
      brief: {
        zh: '等宽字体改自托管 DejaVu Sans Mono，子集化后 Regular/Bold 各约 22KB',
        en: 'System monospace gave way to self-hosted DejaVu Sans Mono, subsetted to about 22KB each for Regular and Bold.'
      },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: '首页卡片顺序每次随机', en: 'Homepage cards shuffled on each load' },
      brief: {
        zh: '首页卡片堆叠顺序改为每次打开随机打乱，初始化时用 Fisher-Yates 洗牌',
        en: 'Homepage card stack order is now shuffled with Fisher-Yates at init, so every refresh gives a new order.'
      },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: 'Gallery 图片点击放大（Lightbox）', en: 'Gallery image lightbox (click to zoom)' },
      brief: {
        zh: 'Gallery 加纯 JS 的 Lightbox：点图全屏放大，可左右切换、方向键与 ESC 关闭',
        en: 'Added a dependency-free lightbox to the Gallery: click an image to zoom, with prev/next, arrow keys and ESC to close.'
      },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: '图片压缩为 WebP 并原图留档', en: 'Compressed images to WebP with originals archived' },
      brief: {
        zh: '全部图片转 WebP q80，按 1200px 与 1600px 两档缩放，总体积由约 31MB 降到约 0.8MB',
        en: 'All images became WebP at q80 in two widths, 1200px and 1600px, cutting total size from about 31MB to about 0.8MB.'
      },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: '首页标签页标题改为「泻火 曹浩轩」', en: 'Homepage tab title changed to "泻火 曹浩轩"' },
      brief: {
        zh: '首页 title 由「泻火」改为「泻火 曹浩轩」，浏览器标签页同时显示笔名与本名',
        en: 'Changed the homepage title from 泻火 to 泻火 曹浩轩 so the browser tab shows both the pen name and the real name.'
      },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: 'SPECTRAL DISSECTOR 封面与频谱图生成', en: 'SPECTRAL DISSECTOR cover & spectrogram generation' },
      brief: {
        zh: '6 条分轨各生成半透明单色频谱图，叠成黑底 3:2 封面；生成脚本放 tmp/ 不入部署',
        en: 'Six tracks each got a translucent single-color spectrogram, composited into a black 3:2 cover; the generator script stays in tmp/ and is not deployed.'
      },
      media: 'img/spectral-dissector.webp'
    },
    {
      date: '2026-06-24',
      title: { zh: 'riverrun 作品介绍', en: 'riverrun description' },
      brief: {
        zh: '为 riverrun 写作品介绍：三重解构加 3 条轨道的原文与译文对照，用左边框引用块排',
        en: 'Wrote the riverrun statement: the triple deconstruction plus original and translated text for 3 tracks, set in left-border quote blocks.'
      },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: 'The FET Mixer 作品介绍与 Gallery 布局', en: 'The FET Mixer description & Gallery layout' },
      brief: {
        zh: 'The FET Mixer 补作品介绍与 3 张作品图；新增横向滑动的 Gallery 布局取代 Grid；EDGEDGEDGE 加拍摄者署名',
        en: 'Added the FET Mixer statement and 3 project images; introduced a horizontally scrolling Gallery layout in place of Grid, and credited the EDGEDGEDGE cover photographer.'
      },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: '修复了2026-06-10的个人介绍的语法错误', en: 'Fixed grammar errors in 2026-06-10 bio' },
      brief: {
        zh: '改掉 2026-06-10 个人介绍里并列词语间的逗号，并删去重复的「可以在我生日的时候可以」',
        en: 'Fixed commas that should be enumeration marks and removed the repeated phrase in the 2026-06-10 bio.'
      },
      media: ''
    },
    {
      date: '2026-06-24',
      title: { zh: 'EDGEDGEDGE 作品介绍、Edge 布局与关于页更新', en: 'EDGEDGEDGE description, Edge layout & About page updates' },
      brief: {
        zh: 'EDGEDGEDGE 补含 2025.10.09 随笔的作品介绍并嵌入 Bilibili 视频；新增视频在上文字在下的 Edge 布局取代 Grid，修移动端可见性',
        en: 'Added the EDGEDGEDGE statement with the 2025.10.09 essay and a Bilibili embed; the new Edge layout replaces Grid and fixes mobile video visibility.'
      },
      media: ''
    },
    {
      date: '2026-06-23',
      title: { zh: '文件目录整理、本地服务器修复与排版优化', en: 'File structure reorganization, local server fix & layout refinements' },
      brief: {
        zh: '文档归 docs/、脚本归 scripts/；server.py 补 HTTP Range 让音频可拖进度；works 页宽 640px→960px、条目固定 48px 并居中，移动端竖排修复',
        en: 'Moved docs to docs/ and scripts to scripts/; server.py gained HTTP Range for audio seeking; the works page widened 640px→960px with fixed 48px rows.'
      },
      media: ''
    },
    {
      date: '2026-06-23',
      title: { zh: '代码审查与重构', en: 'Code audit & refactoring' },
      brief: {
        zh: '首页标题 WORKS 改回「泻火」；.page 拆成 .about-page 与 .changelog-page；WWHBH 音频按钮改由 i18n 驱动，并删 ECCE HOMO 的 B 站 iframe 死代码',
        en: 'Homepage title corrected from WORKS to 泻火; .page split into .about-page/.changelog-page; WWHBH audio button is now i18n-driven; dead ECCE HOMO Bilibili iframe removed.'
      },
      media: ''
    },
    {
      date: '2026-06-23',
      title: { zh: '移动端适配与作品列表页', en: 'Mobile adaptation & works list page' },
      brief: {
        zh: '手机端四角导航改用 left:50vw 加 safe-area-inset 适配刘海屏；新增 works.html 作品列表页；卡片缩到 80vw×46vw，maxSpreadX 70→40',
        en: 'Mobile four-corner nav switched to left:50vw with safe-area-inset for notched screens; added works.html; cards shrunk to 80vw×46vw, maxSpreadX 70→40.'
      },
      media: ''
    },
    {
      date: '2026-06-22',
      title: { zh: '通关了游戏武士零', en: 'Completed the game Katana ZERO' },
      brief: {
        zh: '通关了游戏武士零（Katana ZERO）',
        en: 'Completed Katana ZERO.'
      },
      media: ''
    },
    {
      date: '2026-06-22',
      title: { zh: '新增作品与网站部署', en: 'New projects & site deployment' },
      brief: {
        zh: 'new-work 更名 EDGEDGEDGE，新增 2 个作品 The FET Mixer 与 riverrun；Ecce Homo 换本地音频播放器，首页卡片改扇形展开并部署到 GitHub Pages',
        en: 'Renamed new-work to EDGEDGEDGE, added 2 works (The FET Mixer, riverrun); Ecce Homo switched to a local audio player; cards fanned out; deployed to GitHub Pages.'
      },
      media: ''
    },
    {
      date: '2026-06-21',
      title: { zh: '观看了电影《撒旦探戈》', en: 'Watched the film Sátántangó' },
      brief: {
        zh: '观看贝拉·塔尔执导的《撒旦探戈》（Sátántangó）',
        en: 'Watched Béla Tarr\'s Sátántangó.'
      },
      media: ''
    },
    {
      date: '2026-06-20',
      title: { zh: '观看了电影《噬草者》', en: 'Watched the film The Grass Eater' },
      brief: {
        zh: '观看电影《噬草者》（The Grass Eater）',
        en: 'Watched The Grass Eater.'
      },
      media: ''
    },
    {
      date: '2026-06-18',
      title: { zh: '观看了电影《拯救地球》', en: 'Watched the film Bugonia' },
      brief: {
        zh: '观看欧格斯·兰斯莫斯执导的《拯救地球》（Bugonia）',
        en: 'Watched Yorgos Lanthimos\'s Bugonia.'
      },
      media: ''
    },
    {
      date: '2026-06-15',
      title: { zh: '为《我们将会曾经在这里》增加了作品封面', en: 'Added cover image for We Will Have Been Here' },
      brief: {
        zh: '为首页卡片增加封面图，作品是《我们将会曾经在这里》',
        en: 'Added a cover image to the homepage card for We Will Have Been Here.'
      },
      media: ''
    },
    {
      date: '2026-06-15',
      title: { zh: '修改了 Ecce Homo 的作品介绍', en: 'Updated Ecce Homo description' },
      brief: {
        zh: '重写 Ecce Homo 作品介绍，加入圣经拉丁文与卡夫卡德语原文的引用标注',
        en: 'Rewrote the Ecce Homo statement and added citations of the Latin Vulgate and Kafka\'s German original.'
      },
      media: ''
    },
    {
      date: '2026-06-15',
      title: { zh: '新增模块', en: 'New modules' },
      brief: {
        zh: '入手 2 块模块：Frequency Central 的 Wonderland 与 NLC 的 Divide & Conquer',
        en: 'Got 2 new modules: Frequency Central\'s Wonderland and NLC\'s Divide & Conquer.'
      },
      media: ''
    },
    {
      date: '2026-06-15',
      title: { zh: '更新了作品介绍页面', en: 'Updated project description pages' },
      brief: {
        zh: '《我们将会曾经在这里》介绍拆成独立 HTML 片段文件，重排版式与可读性',
        en: 'Split the We Will Have Been Here statement into standalone HTML fragment files and reworked the page layout.'
      },
      media: ''
    },
    {
      date: '2026-06-13',
      title: { zh: '看了两部电影', en: 'Watched two films' },
      brief: {
        zh: '看了 2 部电影《接近终点》与《我们的土地》',
        en: 'Watched 2 films: Sirât and Nuestra Tierra.'
      },
      media: ''
    },
    {
      date: '2026-06-10',
      title: { zh: '制作了个人网站', en: 'Made a personal website' },
      brief: {
        zh: '个人网站第 1 版发布，包含项目展示与多语言支持',
        en: 'Released the first version of the personal site with a project showcase and multilingual support.'
      },
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

      const bodyEl = document.createElement('div');
      bodyEl.className = 'body';   /* 类名沿用 css/changelog.css 的 `details .body` */
      /* brief 是纯文本摘要：用 textContent，摘要里的 `works/<id>/` 这类尖括号才不会被当成标签 */
      bodyEl.textContent = entry.brief[lang];

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
          bodyEl.appendChild(video);
        } else {
          const img = document.createElement('img');
          img.src = entry.media;
          img.alt = '';
          img.loading = 'lazy';
          img.decoding = 'async';
          bodyEl.appendChild(img);
        }
      }

      details.appendChild(summary);
      details.appendChild(bodyEl);
      div.appendChild(details);
      page.appendChild(div);
    });
  }

  /* ---- init ---- */
  App.renderBackNav();
  App.I18n.init(App.CHANGELOG_I18N, () => render());
  render();
})();
