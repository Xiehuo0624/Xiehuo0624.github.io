/* ===== NAVIGATION RENDERING ===== */

/** 子页面：顶部全宽返回栏 + 语言切换 */
App.renderBackNav = function() {
  const nav = document.createElement('div');
  nav.className = 'back';
  nav.innerHTML =
    '<a href="index.html" data-i18n="back">[<- 返回]</a>' +
    '<a href="#" id="lang-toggle" data-i18n="langToggle">[en] English</a>';
  document.body.prepend(nav);
};

/** 首页：四角导航 */
App.renderIndexNav = function() {
  const topLeft = document.createElement('div');
  topLeft.className = 'nav-top-left';
  topLeft.innerHTML =
    '<a href="about.html" data-i18n="about">[+] 简介与联系</a>' +
    '<a href="changelog.html" data-i18n="changelog">[>] 进程日志</a>';
  document.body.prepend(topLeft);

  const topRight = document.createElement('div');
  topRight.className = 'nav-top-right';
  topRight.id = 'name-easter';
  topRight.textContent = '泻火 曹浩轩';
  document.body.appendChild(topRight);

  const bottomLeft = document.createElement('div');
  bottomLeft.className = 'nav-bottom-left collapsed';
  bottomLeft.innerHTML =
    '<button class="nav-bottom-left-toggle" id="project-toggle">[项目 ▼]</button>' +
    '<a class="nav-bottom-link" href="project-template.html?project=the-fet-mixer" data-i18n="linkFetMixer">THE FET MIXER</a>' +
    '<a class="nav-bottom-link" href="project-template.html?project=riverrun" data-i18n="linkRiverrun">riverrun</a>' +
    '<a class="nav-bottom-link" href="project-template.html?project=edgedgedge" data-i18n="linkNewWork">EDGEDGEDGE</a>' +
    '<a class="nav-bottom-link" href="project-template.html?project=spectral-dissector" data-i18n="linkSpectral">SPECTRAL DISSECTOR</a>' +
    '<a class="nav-bottom-link" href="project-template.html?project=ecce-homo" data-i18n="linkEcce">ECCE HOMO</a>' +
    '<a class="nav-bottom-link" href="project-template.html?project=wwhbh" data-i18n="linkWwbh">WE WILL HAVE BEEN HERE</a>';
  document.body.appendChild(bottomLeft);

  /* toggle project list on mobile */
  const toggle = bottomLeft.querySelector('#project-toggle');
  toggle.addEventListener('click', function(e) {
    e.stopPropagation();
    bottomLeft.classList.toggle('collapsed');
    App._updateToggleText();
  });

  const bottomRight = document.createElement('div');
  bottomRight.className = 'nav-bottom-right';
  bottomRight.innerHTML =
    '<a href="#" id="lang-toggle" data-i18n="langToggle">[en] English</a>';
  document.body.appendChild(bottomRight);
};

/** Update the project toggle button text based on collapsed state & current lang */
App._updateToggleText = function() {
  const btn = document.getElementById('project-toggle');
  const list = btn && btn.parentElement;
  if (!btn || !list) return;
  const collapsed = list.classList.contains('collapsed');
  const lang = App.I18n.currentLang;
  const arrow = collapsed ? '▼' : '▲';
  btn.textContent = lang === 'zh'
    ? '[项目 ' + arrow + ']'
    : '[PROJECTS ' + arrow + ']';
};
