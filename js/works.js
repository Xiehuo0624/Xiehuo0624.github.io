/* ===== WORKS PAGE ===== */
(function(){
  App.renderBackNav();
  App.I18n.init(App.WORKS_I18N, () => render());

  function render(){
    document.documentElement.lang = App.I18n.currentLang;
    document.title = App.I18n.t('pageTitle');
    document.querySelector('.works-page h1').textContent = App.I18n.t('pageTitle');

    const lang = App.I18n.currentLang;
    const list = document.getElementById('works-list');
    list.innerHTML = '';

    App.projectOrder.forEach(id => {
      const p = App.projects[id];
      if (!p) return;
      const a = document.createElement('a');
      a.className = 'works-item';
      a.href = 'project-template.html?project=' + id;
      a.innerHTML =
        '<span class="works-title">' + p.title[lang] + '</span>' +
        '<span class="works-brief">' + p.brief[lang] + '</span>';
      list.appendChild(a);
    });
  }

  render();
})();
