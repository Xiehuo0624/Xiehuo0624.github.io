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
          project.media.images.forEach(src => {
            const slide = document.createElement('div');
            slide.className = 'gallery-slide';
            const img = document.createElement('img');
            img.src = src;
            img.alt = t;
            slide.appendChild(img);
            slider.appendChild(slide);
          });
        }
      }
    } else if (layout === 'wwhbh') {
      document.getElementById('wwhbh-title').textContent = t;
    } else if (layout === 'ecce') {
      document.getElementById('ecce-title').textContent = t;
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
})();
