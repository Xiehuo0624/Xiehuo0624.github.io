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
      a.href = 'project-template.html?project=' + id;
      const title = document.createElement('span');
      title.className = 'works-title';
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
