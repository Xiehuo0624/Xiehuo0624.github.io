/* ===== WORKS PAGE ===== */
(function(){
  App.renderBackNav();

  function render(){
    const lang = App.I18n.currentLang;
    document.title = App.I18n.t('pageTitle');

    const list = document.getElementById('works-list');
    list.innerHTML = '';

    App.projectOrder.forEach(id => {
      const p = App.projects[id];
      if (!p) return;
      const a = document.createElement('a');
      a.className = 'works-item';
      /* 判空：新旧 JS 混用时退化为不带参数的链接（成因见 js/nav.js 顶部注释） */
      a.href = (typeof App.langHref === 'function')
        ? App.langHref('project-template.html?project=' + id)
        : 'project-template.html?project=' + id;
      const title = document.createElement('span');
      title.className = 'works-title' + (p.lowercase ? ' lowercase' : '');
      title.textContent = p.title[lang];
      a.appendChild(title);

      if (p.brief && p.brief[lang]) {
        const brief = document.createElement('span');
        brief.className = 'works-brief';
        brief.textContent = p.brief[lang];
        a.appendChild(brief);
      }

      list.appendChild(a);
    });
  }

  App.I18n.init(App.WORKS_I18N, () => render());
  render();
})();
