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
  bottomLeft.className = 'nav-bottom-left';
  bottomLeft.innerHTML =
    '<a href="project-template.html?project=spectral-dissector" data-i18n="linkSpectral">SPECTRAL DISSECTOR</a>' +
    '<a href="project-template.html?project=ecce-homo" data-i18n="linkEcce">ECCE HOMO</a>' +
    '<a href="project-template.html?project=wwhbh" data-i18n="linkWwbh">WE WILL HAVE BEEN HERE</a>';
  document.body.appendChild(bottomLeft);

  const bottomRight = document.createElement('div');
  bottomRight.className = 'nav-bottom-right';
  bottomRight.innerHTML =
    '<a href="#" id="lang-toggle" data-i18n="langToggle">[en] English</a>';
  document.body.appendChild(bottomRight);
};
