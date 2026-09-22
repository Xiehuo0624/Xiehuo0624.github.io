/* ===== WORKS PAGE ===== */
(function(){
  App.renderBackNav();

  function render(){
    const lang = App.I18n.currentLang;
    document.title = App.I18n.t('pageTitle');

    const list = document.getElementById('works-list');
    /* 生成页里列表已在 HTML 里烤好（含静态 <a>，爬虫可见）：同语言时直接用，不重建 */
    if (list.dataset.bakedLang === lang) return;
    list.innerHTML = '';

    App.projectOrder.forEach(id => {
      const p = App.projects[id];
      if (!p) return;
      const a = document.createElement('a');
      a.className = 'works-item';
      /* 作品页地址走 App.projectHref()：它自带语言（中文界面上是 works/<id>/zh/），
         所以不能再套一层 App.langHref。判空：新旧 JS 混用时退化为旧的 ?project=
         链接（旧地址仍可用；成因见 js/nav.js 顶部注释）。 */
      a.href = (typeof App.projectHref === 'function')
        ? App.projectHref(id)
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

/* 旧地址（works.html）声明规范地址：目录式地址才是正式的，语言随当前语言。
   静态的 noindex 覆盖不跑 JS 的抓取者，这一条覆盖跑 JS 的。 */
if (typeof App.injectCanonical === 'function' && typeof App.pageHref === 'function') {
  App.injectCanonical(App.pageHref('works'));
}
