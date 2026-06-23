/* ===== CHANGELOG PAGE ===== */
(function(){

  /* ========================================================
   *  📝 录入区 — 只需编辑这个数组，新条目加在最前面
   * ======================================================== */
  const entries = [
    {
      date: '2026-06-23',
      title: { zh: '移动端适配与作品列表页', en: 'Mobile adaptation & works list page' },
      body:  { zh: '修复了首页四角导航在手机上被裁切或不可见的问题；左下角改为 SELECT WORKS 直达链接（ECCE HOMO / riverrun / SPECTRAL DISSECTOR）加 [ALL WORKS →] 按钮；新增作品列表页（works.html）；为 ECCE HOMO 和 WWHBH 添加了简介；移动端卡片间距缩小并左移保证不溢出；禁止移动端弹性滚动；添加 safe-area 适配刘海屏；riverrun 小写视觉重心微调。', en: 'Fixed four-corner navigation being clipped on mobile; bottom-left now shows SELECT WORKS direct links (ECCE HOMO / riverrun / SPECTRAL DISSECTOR) plus [ALL WORKS →] button; added works list page (works.html); added briefs for ECCE HOMO and WWHBH; reduced mobile card spacing and shifted left; disabled mobile rubber-band scrolling; added safe-area inset support; adjusted riverrun lowercase visual alignment.' },
      media: ''
    },
    {
      date: '2026-06-22',
      title: { zh: '通关了游戏武士零', en: 'Completed the game Katana ZERO' },
      body:  { zh: '通关了武士零。', en: 'Completed Katana ZERO.' },
      media: ''
    },
    {
      date: '2026-06-18',
      title: { zh: '观看了电影拯救地球', en: 'Watched the film Save the Green Planet' },
      body:  { zh: '观看了张俊焕执导的《拯救地球》。', en: 'Watched Save the Green Planet directed by Jang Jun-hwan.' },
      media: ''
    },
    {
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
      media: ''  // 可选：图片/视频路径，如 'img/changelog/2025-06-10.png'
    },
    // 继续往上加新条目 …
  ];

  /* ========================================================
   *  渲染逻辑 — 一般不需要修改
   * ======================================================== */

  function render() {
    const page = document.querySelector('.page');
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
