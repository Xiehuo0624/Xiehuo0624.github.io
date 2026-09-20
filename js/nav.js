/* ===== NAVIGATION RENDERING ===== */

/* 语言参数传播的兜底实现。
 *
 * 正体定义在 js/app.js，正常加载顺序下必然先于本文件就位；这里的兜底是为了
 * **新旧文件混用**的情况：GitHub Pages 的 JS 响应带 `max-age=14400`（4 小时），
 * 部署后的短时间内，访问者可能拿到新的 nav.js 与仍被缓存的旧 app.js。
 * 旧 app.js 没有 langHref，而 nav.js 在渲染四角导航时同步调用它 —— 一旦缺失就抛
 * TypeError，**整块导航连同右下角语言切换都不会出现**（2026-09-21 实际发生过）。
 * 兜底后最坏情况只是链接不带语言参数，绝不再连累导航渲染。 */
if (typeof App.langHref !== 'function') {
  App.langHref = function(href){
    const lang = (App.I18n && App.I18n.currentLang) || 'en';
    if (lang === 'en') return href;
    return href + (href.indexOf('?') === -1 ? '?' : '&') + 'lang=' + lang;
  };
}

/** 子页面：顶部全宽返回栏 + 语言切换 */
App.renderBackNav = function() {
  const nav = document.createElement('div');
  nav.className = 'back';
  nav.innerHTML =
    '<a href="' + App.langHref('index.html') + '" data-i18n="back">[<- 返回]</a>' +
    '<a href="#" id="lang-toggle" data-i18n="langToggle">[en] English</a>';
  document.body.prepend(nav);
};

/** 首页：四角导航 */
App.renderIndexNav = function() {
  const topLeft = document.createElement('div');
  topLeft.className = 'nav-top-left';
  topLeft.innerHTML =
    '<a href="' + App.langHref('about.html') + '" data-i18n="about">[+] 简介与联系</a>' +
    '<a href="' + App.langHref('changelog.html') + '" data-i18n="changelog">[>] 进程日志</a>';
  document.body.prepend(topLeft);

  const topRight = document.createElement('div');
  topRight.className = 'nav-top-right';
  topRight.id = 'name-easter';
  /* 署名保持汉字，不随语言切换。
     这是作者标识（与「水火」汉字 logo 一致），属于签名而非正文；
     审计文档 §3 所指的「英文版残留汉字」是 photographed by 等香鱼 那类
     嵌在英文句子里的他人署名，不适用于作者签自己的名字。
     罗马字姓名在 about 页与 CV 里，读者不会找不到。 */
  topRight.textContent = '泻火 曹浩轩';
  document.body.appendChild(topRight);

  const bottomLeft = document.createElement('div');
  bottomLeft.className = 'nav-bottom-left';
  bottomLeft.innerHTML =
    '<a href="' + App.langHref('project-template.html?project=ecce-homo') + '" data-i18n="linkEcce">ECCE HOMO</a>' +
    '<a href="' + App.langHref('project-template.html?project=riverrun') + '" class="nav-lowercase" data-i18n="linkRiverrun">riverrun</a>' +
    '<a href="' + App.langHref('project-template.html?project=spectral-dissector') + '" data-i18n="linkSpectral">SPECTRAL DISSECTOR</a>' +
    '<a href="' + App.langHref('works.html') + '" class="nav-all-works" data-i18n="allWorks">[ALL WORKS →]</a>';
  document.body.appendChild(bottomLeft);

  const bottomRight = document.createElement('div');
  bottomRight.className = 'nav-bottom-right';
  bottomRight.innerHTML =
    '<a href="#" id="lang-toggle" data-i18n="langToggle">[en] English</a>';
  document.body.appendChild(bottomRight);
};

/* ===== 防拖拽兜底（Firefox + 运行时插入的图片）=====
   浏览器一旦进入原生拖拽（dragstart），mouseup 就不再派发 click，表现为「点不动、只在拖」。
   CSS 侧已用 -webkit-user-drag:none 覆盖 Chrome/Safari/Edge（css/base.css 的 <img>、
   css/nav.css 的导航 UI）；Firefox 不支持该属性，且项目页图片由 JS 动态插入（不带 draggable
   属性），故在此统一兜底。只拦图片与导航 UI：正文里的下载链接、相关作品链接保持默认可拖，
   把链接拖到桌面存文件仍是有效操作。 */
document.addEventListener('dragstart', e => {
  const el = e.target;
  if (!el || el.nodeType !== 1) return;
  if (el.tagName === 'IMG' ||
      el.closest('.back, .nav-top-left, .nav-top-right, .nav-bottom-left, .nav-bottom-right')) {
    e.preventDefault();
  }
}, true);
