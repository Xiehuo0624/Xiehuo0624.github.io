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

  /** 该容器（主图 / bilibili 内嵌页）是否已由生成器烤进 HTML。
   *  烤进去的元素扫描器在 JS 之前就发现并下载了，再用 JS 重建一遍等于让图片重新入队、
   *  让 iframe 重新装载。属性写在 HTML 上，不依赖脚本执行顺序。 */
  function isBaked(id){
    const el = document.getElementById(id);
    return !!(el && el.dataset.baked === '1');
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
    App.I18n.init(App.PROJECT_I18N, render404);
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

  /* ---- fill content (only active layout) ---- */
  function fillContent(){
    App.I18n.apply();
    const t = project.title[App.I18n.currentLang];
    document.title = t;

    /* 标题 + 副标题：副标题嵌在 h2 内部，位于标题文字与 h2 下边框之间，
       使两者成为一个整体（参考 Works 页 .works-title + .works-brief 的配对）。
       作品未单独给 subtitle 时退回 brief。每次调用先清空 h2，故切语言安全。 */
    const sub = ((project.subtitle || project.brief || {})[App.I18n.currentLang]) || '';
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
          if (project.media.type === 'bilibili') {
            const iframe = document.createElement('iframe');
            iframe.src = '//player.bilibili.com/player.html?bvid=' + project.media.bvid + '&autoplay=0';
            iframe.setAttribute('allowfullscreen', 'true');
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
    } else if (layout === 'gallery') {
      setTitle('gallery-title');
      /* render gallery slider */
      if (!mediaRendered && project.media && project.media.type === 'gallery' && !isBaked('gallery-slider')) {
        const slider = document.getElementById('gallery-slider');
        if (slider) {
          slider.innerHTML = '';
          project.media.images.forEach((src, idx) => {
            const slide = document.createElement('div');
            slide.className = 'gallery-slide';
            const img = document.createElement('img');
            img.src = src;
            img.alt = t;
            /* 水平 slider 内只有首屏可见，其余懒加载 */
            img.loading = 'lazy';
            img.decoding = 'async';
            img.dataset.index = String(idx);
            img.addEventListener('click', () => openLightbox(project.media.images, idx, t));
            slide.appendChild(img);
            slider.appendChild(slide);
          });
        }
      }
    } else if (layout === 'wwhbh') {
      setTitle('wwhbh-title');
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
    }
    mediaRendered = true;

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
      if (descAbort) { try { descAbort.abort(); } catch(e) {} }
      descAbort = new AbortController();
      descEl.textContent = '…';
      fetch('data/' + projectId + '/' + App.I18n.currentLang + '.html', { signal: descAbort.signal })
        .then(r => r.ok ? r.text() : Promise.reject(r.statusText))
        .then(html => {
          if (reqId !== descRequest) return;   // 已有更新语言的请求，丢弃过期响应
          descEl.innerHTML = html;
          appendRelated(descEl);
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

  App.I18n.init(App.PROJECT_I18N, () => {
    fillContent();
    if (projectId === 'wwhbh') App.refreshWwhbhUI();
    if (project.layout === 'mixer') App.refreshRiverrunMixer();
  });
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
      prev.type = 'button'; prev.setAttribute('aria-label', App.I18n.t('lightboxPrev'));
      next.type = 'button'; next.setAttribute('aria-label', App.I18n.t('lightboxNext'));
      close.type = 'button'; close.setAttribute('aria-label', App.I18n.t('lightboxClose'));

      lbOverlay.appendChild(lbImg);
      lbOverlay.appendChild(prev);
      lbOverlay.appendChild(next);
      lbOverlay.appendChild(close);
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
