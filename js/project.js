/* ===== PROJECT PAGE ===== */
(function(){
  const urlParams = new URLSearchParams(location.search);
  const root = document.documentElement;
  /* 作品 id 有两个来源，不是二选一而是「先静态后参数」：
     目录式生成页把它写在 <html data-project>（HTML 里写死，解析阶段就在，不吃 JS 缓存），
     旧地址 project-template.html?project=… 仍走查询参数（见 scripts/gen-projects.mjs）。 */
  const projectId = root.dataset.project || urlParams.get('project');
  /* 目录式页面（生成页）带 data-lang-fixed：语言由路径决定，见 js/i18n.js 文件头。
     这类页面的正文与主图已烤进 HTML，下面的 baked 分支据此跳过重复渲染。 */
  const FIXED_LANG = root.hasAttribute('data-lang-fixed');
  const project   = App.projects[projectId];
  const layoutMap = { grid:'layout-grid', ecce:'layout-ecce', wwhbh:'layout-wwhbh', edge:'layout-edge', gallery:'layout-gallery', mixer:'layout-mixer' };
  const hideSelector = '.project-grid,.wwhbh-panel,.ecce-panel,.edge-panel,.gallery-panel,.mixer-panel';
  let descRequest = 0;          // 递增序号：语言快速切换时只采纳最后一次请求
  let descAbort = null;         // 取消上一次仍在途的描述请求
  let mediaRendered = false;    // 媒体 DOM 只渲染一次；切换语言不打断播放/滚动位置

  /** 该容器（主图 / YouTube 内嵌页）是否已由生成器烤进 HTML。
   *  烤进去的元素扫描器在 JS 之前就发现并下载了，再用 JS 重建一遍等于让图片重新入队、
   *  让 iframe 重新装载。属性写在 HTML 上，不依赖脚本执行顺序。 */
  function isBaked(id){
    const el = document.getElementById(id);
    return !!(el && el.dataset.baked === '1');
  }

  /* ---- Gallery 分组渲染 ---- */
  let galleryImages = [];   // 扁平图集：Lightbox 在全部图上前后切换，索引与点击处一致
  let galleryLabels = [];   // [{el, label}]：切语言时只改文字，不重建网格

  /** 分组标题。文字是可见内容，故登记下来，切语言时原地更新。 */
  function addGalleryLabel(parent, label, className){
    if (!label) return;
    const el = document.createElement('h3');
    el.className = className;
    el.textContent = label[App.I18n.currentLang];
    galleryLabels.push({ el, label });
    parent.appendChild(el);
  }

  /** 一组等宽网格。每张图在扁平图集里登记自己的下标，点击即从该张打开。 */
  function buildGalleryGrid(images, alt){
    const grid = document.createElement('div');
    grid.className = 'gallery-grid';
    images.forEach(src => {
      const idx = galleryImages.push(src) - 1;
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt;
      /* 网格里只有首屏可见，其余懒加载 */
      img.loading = 'lazy';
      img.decoding = 'async';
      img.dataset.index = String(idx);
      img.addEventListener('click', () => openLightbox(galleryImages, idx, alt));
      grid.appendChild(img);
    });
    return grid;
  }

  /** 现场资料块：可播放音频（可选）＋ 照片网格（可选）。edge／ecce／wwhbh 三个布局共用。
   *  网格交给 buildGalleryGrid，所以 Lightbox 的索引、翻页与计数与画廊页同源；
   *  容器在烤好的页面里是空的（没有 data-baked），因此这一块不吃 isBaked 的判断，
   *  由运行时补建。altBase 一般是作品名，后缀取自 i18n 的 livePhoto。 */
  function renderLive(hostId, project, altBase){
    const host = document.getElementById(hostId);
    if (!host) return;
    if (project.audio) {
      const au = document.createElement('audio');
      au.className = 'work-audio';
      au.controls = true;
      au.preload = 'none';   /* 十几 MB 的音频不在首屏即拉取，点播放才下载 */
      au.src = project.audio;
      host.appendChild(au);
    }
    const photos = (project.media && project.media.photos) || [];
    if (photos.length) {
      host.appendChild(buildGalleryGrid(photos, altBase + ' — ' + App.I18n.t('livePhoto')));
    }
  }

  App.renderBackNav();

  /* ---- 404 fallback ---- */
  if (!project) {
    document.querySelectorAll(hideSelector).forEach(el => {
      el.style.display = 'none';
    });
    document.getElementById('layout-grid').style.display = 'grid';
    const render404 = () => {
      document.getElementById('grid-title').textContent = App.I18n.t('notFoundTitle');
      document.getElementById('grid-desc').textContent  = App.I18n.t('notFoundDesc');
      document.title = '404 — ' + App.I18n.t('notFoundTitle');
    };
    App.I18n.init(App.PROJECT_I18N, render404, { inPlace: true });
    render404();
    return;
  }

  /* ---- show active layout, hide the rest ---- */
  document.querySelectorAll(hideSelector).forEach(el => {
    el.style.display = 'none';
  });
  const activeEl = document.getElementById(layoutMap[project.layout]);
  activeEl.style.display = (project.layout === 'grid') ? 'grid' : 'flex';
  if (project.lowercase) activeEl.classList.add('lowercase');

  /* ---- 旧地址声明规范地址 ----
     旧地址 project-template.html?project=… 继续可用（已发出的链接不能断），但同一份内容
     不该有两个地址争索引：这里补一条 canonical 指向目录式地址。project-template.html 里
     另有一条静态的 noindex，给不执行 JS 的抓取者同样的结论 —— 两条一起，旧地址在两种
     抓取方式下都不会被当成正式页面。只在旧地址上做：生成页的 canonical 是静态写好的。 */
  if (!FIXED_LANG && typeof App.projectHref === 'function') {
    try {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = new URL(App.projectHref(projectId, App.I18n.currentLang), location.href).href;
      document.head.appendChild(link);
    } catch(e) {}
  }

  /* ---- get the desc element for the active layout ---- */
  function getDescEl(){
    const layout = project.layout;
    if (layout === 'grid')    return document.getElementById('grid-desc');
    if (layout === 'wwhbh')   return document.getElementById('wwhbh-desc');
    if (layout === 'ecce')    return document.getElementById('ecce-desc');
    if (layout === 'edge')    return document.getElementById('edge-desc');
    if (layout === 'gallery') return document.getElementById('gallery-desc');
    if (layout === 'mixer')  return document.getElementById('mixer-desc');
    return null;
  }

  /* ---- 原地换语言后，把 <head> 里与语言绑定的那几项同步过来 ----
     生成页把它们按语言烤死在 HTML 里（scripts/gen-projects.mjs 第 ④ 步）。语言按钮
     不再跳转之后（见 js/i18n.js 的 _inPlace），这些值若不同步，就会与屏幕上的文字、
     与 replaceState 换过的地址自相矛盾。
     绝对地址一律从 head 里的 hreflang 现取 —— 那是与给搜索引擎的同一份数据，
     不在这里另存一张 id→URL 映射表（两份表早晚漂移）。

     **og:site_name 与 og:locale／og:locale:alternate 不在这里同步**：它们的值
     （站点名、en_US／zh_CN）只定义在 scripts/gen-projects.mjs 里，搬进 JS 就成了
     第二份真相；而运行时没有任何东西读它们 —— 社交预览读的是服务器返回的静态 HTML，
     爬虫不点按钮、看不到这份改动。宁可不改，也不复制一张表。 */
  function syncHead(title, sub){
    const lang = App.I18n.currentLang;
    const altOf = l => {
      const el = document.querySelector('link[rel="alternate"][hreflang="' + l + '"]');
      return el ? el.getAttribute('href') : null;
    };
    const canonical = altOf(lang);
    const setMeta = (sel, val) => {
      if (!val) return;
      const el = document.head.querySelector(sel);
      if (el) el.setAttribute('content', val);
    };
    setMeta('meta[name="description"]', sub);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', sub);
    setMeta('meta[property="og:image:alt"]', title);
    setMeta('meta[property="og:url"]', canonical);
    if (canonical){
      const link = document.head.querySelector('link[rel="canonical"]');
      if (link) link.setAttribute('href', canonical);
    }
    /* <html data-lang> 只在脚本启动时被读一次，改它不影响本次运行；
       留着不改则是文档自己说了假话 —— lang 属性已经被 apply() 改成新语言了。 */
    root.dataset.lang = lang;
    /* 返回栏的地址也带语言（'./' 与 './zh/'）。它由 js/nav.js 现生成，而 apply()
       只换文字、不换 href —— 不同步就会「在中文页面上点返回，回到英文首页」。 */
    const back = document.querySelector('.back a[data-i18n="back"]');
    if (back) back.setAttribute('href', App.pageHref('index'));
  }

  /* ---- 换语言时的滚动锚点：**按比例**（作者 2026-10-03 定）----
     中文译文比英文短约三成，而滚动位置记的是「从文档顶部往下多少像素」——内容一变短，
     同一个像素数就落到更靠后的段落。实测 /works/wwhbh/：读者停在照片那一屏切语言，
     文档从 8277px 缩到 6248px，浏览器自己的滚动锚定（overflow-anchor:auto）只补回
     880px，剩下 1149px 让照片直接从眼前跑掉。

     做法：切之前记下「视口顶部落在正文的百分之几」，切完把同一个百分比换算回新的文档
     坐标。**按比例而不是按像素**，是因为中英是同一篇的两个版本、段落一一对应，同一个
     百分比最接近「还在读同一段」。
     三种候选在 tmp/scroll-anchor.html 上实测过（两个场景各跑一遍）：
       · 按比例（本实现）：读者在正文中段时落回同一百分比；停在照片处时照片只偏 84px
       · 按像素：两种场景下都与「不干预」结果相同 —— 目标要么超出新文档的最大滚动位置
                 被钳回，要么就等于不动，等于没做
       · 锚住正文之后那块：照片纹丝不动，但你正在读的正文会被抽走
     读者本来就在正文之上（含页面顶端）时**不补**：他上方的内容没变，硬滚一下反而
     莫名其妙 —— 而且按比例算出来的目标会把他往上带一点（实测约 160px）。 */
  function anchorOf(descEl){
    const r = descEl.getBoundingClientRect();
    const top = r.top + window.scrollY;
    return { frac: (window.scrollY - top) / Math.max(1, r.height) };
  }

  function restoreAnchor(descEl, a){
    if (!a || a.frac < 0) return;
    const r = descEl.getBoundingClientRect();
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const y = Math.max(0, Math.min(max, Math.round(r.top + window.scrollY + a.frac * Math.max(1, r.height))));
    if (Math.abs(y - window.scrollY) < 2) return;          // 已经在位，别动
    window.scrollTo(0, y);
    /* 浏览器自己的滚动锚定认的是另一个锚点元素，可能在我之后又调一下；下一帧与 200ms 后
       各确认一次。**读者自己滚走了就不动** —— 按差量区分：锚定纠偏只有几像素到几十像素，
       人手一滚就是几百像素。 */
    const reapply = () => { if (Math.abs(window.scrollY - y) < 200) window.scrollTo(0, y); };
    requestAnimationFrame(reapply);
    setTimeout(reapply, 200);
  }

  /* ---- fill content (only active layout) ---- */
  function fillContent(){
    App.I18n.apply();
    const t = project.title[App.I18n.currentLang];
    document.title = t;

    /* 标题 + 副标题：副标题嵌在 h2 内部，位于标题文字与 h2 下边框之间，
       使两者成为一个整体（参考 Works 页 .works-title + .works-brief 的配对）。
       作品未单独给 subtitle 时退回 brief。每次调用先清空 h2，故切语言安全。 */
    const sub = ((project.subtitle || project.brief || {})[App.I18n.currentLang]) || '';
    syncHead(t, sub);
    const setTitle = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = t;
      if (!sub) return;
      const sp = document.createElement('span');
      sp.className = 'work-sub';
      sp.textContent = sub;
      el.appendChild(sp);
    };

    const layout = project.layout;
    if (layout === 'grid') {
      setTitle('grid-title');
      /* render media area (single image) */
      if (project.media && !mediaRendered && !isBaked('grid-media')) {
        const mediaEl = document.getElementById('grid-media');
        if (mediaEl) {
          mediaEl.innerHTML = '';
          if (project.media.type === 'image') {
            const img = document.createElement('img');
            img.src = project.media.src;
            img.alt = t;
            img.decoding = 'async';
            img.fetchPriority = 'high';
            mediaEl.appendChild(img);
          }
        }
      }
    } else if (layout === 'edge') {
      setTitle('edge-title');
      /* render media area */
      if (project.media && !mediaRendered && !isBaked('edge-media')) {
        const mediaEl = document.getElementById('edge-media');
        if (mediaEl) {
          mediaEl.innerHTML = '';
          /* YouTube 内嵌：autoplay=0 不自动播，rel=0 播完不推别家视频。
             与生成器（scripts/gen-projects.mjs 第 ⑦ 步）烤进 HTML 的那段必须一致，
             否则「烤好的页面」与「运行时重建」会给出两个不同的播放器。 */
          if (project.media.type === 'youtube') {
            const iframe = document.createElement('iframe');
            /* nocookie 域：不写 cookie、不做个性化追踪（作者 2026-10-02 定）。
               与 scripts/gen-projects.mjs 里烤入的那份必须逐字一致。 */
            iframe.src = 'https://www.youtube-nocookie.com/embed/' + project.media.videoId + '?autoplay=0&rel=0';
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('title', t);
            mediaEl.appendChild(iframe);
          } else if (project.media.type === 'image') {
            const img = document.createElement('img');
            img.src = project.media.src;
            img.alt = t;
            img.decoding = 'async';
            img.fetchPriority = 'high';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
            mediaEl.appendChild(img);
          }
        }
      }
      /* 现场资料：录音 + 照片网格，紧接媒体区（视频）之下。 */
      if (!mediaRendered) renderLive('edge-live', project, t);
    } else if (layout === 'gallery') {
      setTitle('gallery-title');
      /* render gallery sections → groups → grids */
      if (!mediaRendered && project.media && project.media.type === 'gallery' && !isBaked('gallery-sections')) {
        const rootEl = document.getElementById('gallery-sections');
        if (rootEl) {
          rootEl.innerHTML = '';
          galleryImages = [];
          galleryLabels = [];
          /* 老数据只有扁平 images（the-induction-mixer）；归一成同一形状后共用下面这套渲染 */
          const sections = project.media.sections || [{ images: project.media.images }];
          sections.forEach(sec => {
            const secEl = document.createElement('div');
            secEl.className = 'gallery-section';
            addGalleryLabel(secEl, sec.label, 'gallery-section-title');
            if (sec.images) secEl.appendChild(buildGalleryGrid(sec.images, t));
            (sec.groups || []).forEach(grp => {
              const grpEl = document.createElement('div');
              grpEl.className = 'gallery-group';
              addGalleryLabel(grpEl, grp.label, 'gallery-group-title');
              grpEl.appendChild(buildGalleryGrid(grp.images, t));
              secEl.appendChild(grpEl);
            });
            rootEl.appendChild(secEl);
          });
        }
      }
      /* 分组标题与 alt 是文字，切语言必须跟着换；网格不重建 —— 重建会丢滚动位置、
         也会让已经解码的图片重新入队下载（媒体只渲染一次的原因见文件头变量注释）。 */
      const galleryLang = App.I18n.currentLang;
      galleryLabels.forEach(item => { item.el.textContent = item.label[galleryLang]; });
      if (galleryImages.length) {
        const gridRoot = document.getElementById('gallery-sections');
        if (gridRoot) gridRoot.querySelectorAll('img').forEach(im => { im.alt = t; });
      }
    } else if (layout === 'wwhbh') {
      setTitle('wwhbh-title');
      /* 现场资料：2024.12.14「硬糖」@ Trigger（上海）那一场的录音与照片。
         视频位留待作者上传 YouTube 后再接。 */
      if (!mediaRendered) renderLive('wwhbh-live', project, t);
    } else if (layout === 'mixer') {
      setTitle('mixer-title');
    } else if (layout === 'ecce') {
      setTitle('ecce-title');
      /* render top image (+ optional audio) */
      if (!mediaRendered && !isBaked('ecce-media')) {
        const mediaEl = document.getElementById('ecce-media');
        if (mediaEl) {
          mediaEl.innerHTML = '';
          if (project.media && project.media.type === 'image') {
            const img = document.createElement('img');
            img.className = 'ecce-still';
            img.src = project.media.src;
            img.alt = t;
            img.decoding = 'async';
            img.fetchPriority = 'high';
            mediaEl.appendChild(img);
          }
          if (project.audio) {
            const audio = document.createElement('audio');
            audio.className = 'ecce-audio';
            audio.controls = true;
            audio.preload = 'none';   /* 12MB 音频不在首屏即拉取，点播放才下载 */
            audio.src = project.audio;
            mediaEl.appendChild(audio);
          }
        }
      }
      /* 现场剧照网格：**放在正文之后**（容器在 .ecce-text 之外），与画廊页同一信息结构，
         这样 8 张不会把正文推到十几屏之后。 */
      if (!mediaRendered) renderLive('ecce-live', project, t);
    }
    mediaRendered = true;

    /* 主图／内嵌页只在首次渲染时建一次（切语言不重建，见 mediaRendered 的注释），
       所以它的 alt／title 会停在烤进 HTML 时那一版语言。原地换语言时补一次 ——
       它们不显示在屏幕上，但屏幕阅读器读得到。画廊网格的 alt 在 gallery 分支里
       已经跟着换了，这里只管单媒体那几个布局。 */
    const mediaHostId = { grid:'grid-media', edge:'edge-media', ecce:'ecce-media' }[project.layout];
    if (mediaHostId){
      const host = document.getElementById(mediaHostId);
      if (host){
        host.querySelectorAll('img').forEach(im => { im.alt = t; });
        host.querySelectorAll('iframe').forEach(fr => { fr.title = t; });
      }
    }

    /* desc: fetch from HTML fragment or use inline string */
    const descEl = getDescEl();
    if (!descEl) return;

    /* 生成页：正文已经烤在 HTML 里，`data-desc-lang` 记的就是烤进去的那一版语言。
       与当前语言一致时直接用，不再发一次 fetch —— 少一次往返，也不会先清空再填回
       （爬虫不跑 JS，正文必须本来就在 HTML 里，见 scripts/gen-projects.mjs）。
       不一致时（语言切换、或将来出现页内换语言）仍走下面的 fetch，行为与改动前一致。 */
    if (descEl.dataset.descLang === App.I18n.currentLang) {
      appendRelated(descEl);
      return;
    }

    if (project.desc.file) {
      const reqId = ++descRequest;
      /* 记下这次请求要的是哪种语言：回调回来时 currentLang 可能已经又变了 */
      const wantLang = App.I18n.currentLang;
      if (descAbort) { try { descAbort.abort(); } catch(e) {} }
      descAbort = new AbortController();
      /* 切语言前记下滚动锚点 —— 必须**在正文被换掉之前**记，之后就晚了 */
      const anchor = anchorOf(descEl);
      /* 占位符**只在容器本来就是空的时候**给（首次加载、旧地址进来时它本来就是空的）。
         原地换语言时容器里是上一门语言的整篇正文，清成 '…' 会让它当场塌掉：
         实测 /works/wwhbh/ 的正文容器从 6239px 塌到 34px，排在它后面的现场资料块
         （录音 + 照片网格）从 6528px 窜到 326px —— 窜到内容最上面、fetch 回来再弹回去，
         看起来就是「下面的图片闪到上面一瞬间」（作者 2026-10-02 报的）。
         留着旧文案、等新文案到位再整体换掉，是原地换语言下唯一不闪的做法。
         代价是慢网下会先看到 ~300ms 的上一门语言正文，那比整块窜动好得多。 */
      if (!descEl.textContent.trim()) descEl.textContent = '…';
      fetch('data/' + projectId + '/' + wantLang + '.html', { signal: descAbort.signal })
        .then(r => r.ok ? r.text() : Promise.reject(r.statusText))
        .then(html => {
          if (reqId !== descRequest) return;   // 已有更新语言的请求，丢弃过期响应
          descEl.innerHTML = html;
          /* **必须把 data-desc-lang 一起改掉。** 它是「这份正文是哪种语言」的标记，
             生成页上等于烤进 HTML 的那一版。原地换语言会把它换成另一种语言的正文，
             标记却不跟着走 —— 于是切回来时 `dataset.descLang === currentLang` 成立，
             上面的 baked 分支会**直接返回**，把上一次那门语言的正文当成这一门用。
             （跳转式的页面不会踩到：每次都是新文档、标记与正文天生一致。） */
          descEl.dataset.descLang = wantLang;
          appendRelated(descEl);
          restoreAnchor(descEl, anchor);
        })
        .catch(() => {
          if (reqId !== descRequest) return;
          descEl.textContent = '';
          appendRelated(descEl);
        });
    } else {
      descEl.innerHTML = project.desc[App.I18n.currentLang];
      appendRelated(descEl);
    }
  }

  /* ---- related works (cross-links, e.g. riverrun ↔ The Induction Mixer) ---- */
  function appendRelated(descEl){
    if (!project.related || !project.related.length) return;
    /* 幂等：正文烤在 HTML 里时本函数会被调用不止一次（初始化 + 语言回调 + 上面的
       baked 分支），不去重会叠出两组「相关作品」链接。 */
    descEl.querySelectorAll(':scope > .project-related').forEach(n => n.remove());
    const lang = App.I18n.currentLang;
    const wrap = document.createElement('div');
    wrap.className = 'project-related';
    project.related.forEach(r => {
      const target = App.projects[r.id];
      if (!target) return;
      const a = document.createElement('a');
      a.className = 'project-related-link';
      /* 判空：新旧 JS 混用时退化为旧的 ?project= 链接（仍可用；成因见 js/nav.js
         顶部注释）。地址自带语言，故不再套 App.langHref。 */
      a.href = (typeof App.projectHref === 'function')
        ? App.projectHref(r.id)
        : 'project-template.html?project=' + r.id;
      const role = r.role ? r.role[lang] + ' ' : '';
      a.textContent = role + target.title[lang] + ' →';
      wrap.appendChild(a);
    });
    descEl.appendChild(wrap);
  }

  /* { inPlace: true }：作品页是**唯一**声明「能原地换语言」的页面类型。
     这里能成立，是因为本文件的 fillContent() 本来就把整套文案按 App.I18n.currentLang
     现渲染（旧地址 ?project= 一直在跑这条路径），而作品本身的状态（音频图、墨层累积）
     只活在这个文档里 —— 跳一次就等于把它清掉。其余页面不传这个参数，行为一字不改。 */
  App.I18n.init(App.PROJECT_I18N, () => {
    fillContent();
    if (projectId === 'wwhbh') App.refreshWwhbhUI();
    if (project.layout === 'mixer') App.refreshRiverrunMixer();
  }, { inPlace: true });
  fillContent();

  /* ---- WWHBH audio ---- */
  if (projectId === 'wwhbh') {
    App.initWwhbh(document.getElementById('btn-mic'), document.getElementById('wwhbh-status'));
  }

  /* ---- RIVERRUN spatial mixer ---- */
  if (project.layout === 'mixer') {
    App.initRiverrunMixer(document.getElementById('layout-mixer'), {
      audioDir: project.audioDir,
      tracks: project.tracks
    });
  }

  /* ---- Gallery lightbox ---- */
  let lbOverlay = null;
  let lbImages = [];
  let lbIndex = 0;
  let lbImg = null;
  let lbCount = null;
  let lbAlt = '';

  function openLightbox(images, index, alt) {
    lbImages = images;
    lbIndex = index;
    lbAlt = alt;
    if (!lbOverlay) {
      lbOverlay = document.createElement('div');
      lbOverlay.className = 'lightbox';
      lbImg = document.createElement('img');
      lbImg.alt = alt;
      const prev = document.createElement('button');
      prev.className = 'lightbox-nav lightbox-prev';
      prev.textContent = '‹';
      const next = document.createElement('button');
      next.className = 'lightbox-nav lightbox-next';
      next.textContent = '›';
      const close = document.createElement('button');
      close.className = 'lightbox-close';
      close.textContent = '×';
      /* 位置指示：网格化之后一次可以从 21 张里的任意一张进入，没有「第几张」会迷路。
         纯装饰性文字，不进 aria（读屏靠左右按钮的 aria-label 就够）。 */
      lbCount = document.createElement('div');
      lbCount.className = 'lightbox-count';
      lbCount.setAttribute('aria-hidden', 'true');
      prev.type = 'button'; prev.setAttribute('aria-label', App.I18n.t('lightboxPrev'));
      next.type = 'button'; next.setAttribute('aria-label', App.I18n.t('lightboxNext'));
      close.type = 'button'; close.setAttribute('aria-label', App.I18n.t('lightboxClose'));

      lbOverlay.appendChild(lbImg);
      lbOverlay.appendChild(prev);
      lbOverlay.appendChild(next);
      lbOverlay.appendChild(close);
      lbOverlay.appendChild(lbCount);
      document.body.appendChild(lbOverlay);

      lbOverlay.addEventListener('click', e => {
        if (e.target === lbOverlay) closeLightbox();
      });
      prev.addEventListener('click', e => { e.stopPropagation(); lbStep(-1); });
      next.addEventListener('click', e => { e.stopPropagation(); lbStep(1); });
      close.addEventListener('click', closeLightbox);
      document.addEventListener('keydown', lbKeyHandler);
    }
    lbShow();
    lbOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function lbShow() {
    lbImg.src = lbImages[lbIndex];
    lbImg.alt = lbAlt;
    lbCount.textContent = (lbIndex + 1) + ' / ' + lbImages.length;
    const prev = lbOverlay.querySelector('.lightbox-prev');
    const next = lbOverlay.querySelector('.lightbox-next');
    const close = lbOverlay.querySelector('.lightbox-close');
    prev.setAttribute('aria-label', App.I18n.t('lightboxPrev'));
    next.setAttribute('aria-label', App.I18n.t('lightboxNext'));
    close.setAttribute('aria-label', App.I18n.t('lightboxClose'));
    const multi = lbImages.length > 1;
    prev.style.display = multi ? '' : 'none';
    next.style.display = multi ? '' : 'none';
  }

  function lbStep(dir) {
    lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
    lbShow();
  }

  function closeLightbox() {
    if (lbOverlay) lbOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function lbKeyHandler(e) {
    if (!lbOverlay || !lbOverlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') lbStep(-1);
    else if (e.key === 'ArrowRight') lbStep(1);
  }
})();
