/* ===== PROJECT PAGE ===== */
(function(){
  const urlParams = new URLSearchParams(location.search);
  const projectId = urlParams.get('project');
  const project   = App.projects[projectId];
  const layoutMap = { grid:'layout-grid', ecce:'layout-ecce', wwhbh:'layout-wwhbh', edge:'layout-edge', gallery:'layout-gallery' };
  const hideSelector = '.project-grid,.wwhbh-panel,.ecce-panel,.edge-panel,.gallery-panel';

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

  /* ---- get the desc element for the active layout ---- */
  function getDescEl(){
    const layout = project.layout;
    if (layout === 'grid')    return document.getElementById('grid-desc');
    if (layout === 'wwhbh')   return document.getElementById('wwhbh-desc');
    if (layout === 'ecce')    return document.getElementById('ecce-desc');
    if (layout === 'edge')    return document.getElementById('edge-desc');
    if (layout === 'gallery') return document.getElementById('gallery-desc');
    return null;
  }

  /* ---- fill content (only active layout) ---- */
  function fillContent(){
    App.I18n.apply();
    const t = project.title[App.I18n.currentLang];
    document.title = t;

    const layout = project.layout;
    if (layout === 'grid') {
      document.getElementById('grid-title').textContent = t;
      /* render media area (single image) */
      if (project.media) {
        const mediaEl = document.getElementById('grid-media');
        if (mediaEl) {
          mediaEl.innerHTML = '';
          if (project.media.type === 'image') {
            const img = document.createElement('img');
            img.src = project.media.src;
            img.alt = t;
            mediaEl.appendChild(img);
          }
        }
      }
    } else if (layout === 'edge') {
      document.getElementById('edge-title').textContent = t;
      /* render media area */
      if (project.media) {
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
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
            mediaEl.appendChild(img);
          }
        }
      }
    } else if (layout === 'gallery') {
      document.getElementById('gallery-title').textContent = t;
      /* render gallery slider */
      if (project.media && project.media.type === 'gallery') {
        const slider = document.getElementById('gallery-slider');
        if (slider) {
          slider.innerHTML = '';
          project.media.images.forEach((src, idx) => {
            const slide = document.createElement('div');
            slide.className = 'gallery-slide';
            const img = document.createElement('img');
            img.src = src;
            img.alt = t;
            img.dataset.index = String(idx);
            img.addEventListener('click', () => openLightbox(project.media.images, idx, t));
            slide.appendChild(img);
            slider.appendChild(slide);
          });
        }
      }
    } else if (layout === 'wwhbh') {
      document.getElementById('wwhbh-title').textContent = t;
    } else if (layout === 'ecce') {
      document.getElementById('ecce-title').textContent = t;
      /* render top image (+ optional audio) */
      const mediaEl = document.getElementById('ecce-media');
      if (mediaEl) {
        mediaEl.innerHTML = '';
        if (project.media && project.media.type === 'image') {
          const img = document.createElement('img');
          img.className = 'ecce-still';
          img.src = project.media.src;
          img.alt = t;
          mediaEl.appendChild(img);
        }
        if (project.audio) {
          const audio = document.createElement('audio');
          audio.className = 'ecce-audio';
          audio.controls = true;
          audio.src = project.audio;
          mediaEl.appendChild(audio);
        }
      }
    }

    /* desc: fetch from HTML fragment or use inline string */
    const descEl = getDescEl();
    if (!descEl) return;

    if (project.desc.file) {
      descEl.textContent = '…';
      fetch('data/' + projectId + '/' + App.I18n.currentLang + '.html')
        .then(r => r.ok ? r.text() : Promise.reject(r.statusText))
        .then(html => { descEl.innerHTML = html; })
        .catch(() => { descEl.textContent = ''; });
    } else {
      descEl.innerHTML = project.desc[App.I18n.currentLang];
    }
  }

  App.I18n.init(App.PROJECT_I18N, () => {
    fillContent();
    if (projectId === 'wwhbh') App.refreshMicButton();
  });
  fillContent();

  /* ---- WWHBH audio ---- */
  if (projectId === 'wwhbh') {
    App.initMicButton(document.getElementById('btn-mic'));
  }

  /* ---- Gallery lightbox ---- */
  let lbOverlay = null;
  let lbImages = [];
  let lbIndex = 0;
  let lbImg = null;

  function openLightbox(images, index, alt) {
    lbImages = images;
    lbIndex = index;
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
    const multi = lbImages.length > 1;
    lbOverlay.querySelector('.lightbox-prev').style.display = multi ? '' : 'none';
    lbOverlay.querySelector('.lightbox-next').style.display = multi ? '' : 'none';
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
