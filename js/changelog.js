/* ===== CHANGELOG PAGE ===== */
(function(){

  /* ========================================================
   *  📝 录入区 — 只需编辑这个数组，新条目加在最前面
   * ======================================================== */
  const entries = [
    {
      date: '2026-06-24',
      title: { zh: '图片压缩为 WebP 并原图留档', en: 'Compressed images to WebP with originals archived' },
      body:  { zh: '将全部图片转为 WebP 格式（质量 80）并按用途分两档缩放：卡片封面 1200px 宽、Gallery/剧照 1600px 宽。图片总体积从约 31MB 降至约 0.8MB。原图留档于 img/originals/ 并加入 .gitignore 不随部署。合并了重复的 the-fet-mixer.jpg 与 the-fet-mixer-1.jpg（同一张图），卡片封面与 Gallery 首图共用 the-fet-mixer.webp。同步更新所有 HTML/JS 引用与 STYLEGUIDE。', en: 'Converted all images to WebP (quality 80) and resized by use case: card covers to 1200px wide, gallery/still images to 1600px wide. Total image size dropped from ~31MB to ~0.8MB. Originals archived under img/originals/ and git-ignored so they are not deployed. Merged the duplicate the-fet-mixer.jpg and the-fet-mixer-1.jpg (identical image) so the card cover and gallery first slide share the-fet-mixer.webp. Updated all HTML/JS references and STYLEGUIDE accordingly.' },
      media: ''
    },
      date: '2026-06-24',
      title: { zh: '首页标签页标题改为「泻火 曹浩轩」', en: 'Homepage tab title changed to "泻火 曹浩轩"' },
      body:  { zh: '将首页 <title> 从「泻火」改为「泻火 曹浩轩」，使浏览器标签页同时显示笔名与本名。', en: 'Changed the homepage <title> from "泻火" to "泻火 曹浩轩" so the browser tab shows both the pen name and real name.' },
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
          const source = document.createElement('source');
          source.src = entry.media;
          source.type = 'video/' + ext;
          video.appendChild(source);
          body.appendChild(video);
        } else {
          const img = document.createElement('img');
          img.src = entry.media;
          img.alt = '';
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
