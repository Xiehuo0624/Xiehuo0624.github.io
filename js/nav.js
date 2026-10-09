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

/* App.pageHref 的兜底，理由同上：新的 nav/404/works 都调它，而 app.js 没有版本号、
 * 可能仍是缓存里的旧版。退化为旧的 .html 地址（仍然可用），最坏只是地址不漂亮。 */
if (typeof App.pageHref !== 'function') {
  App.pageHref = function(name){
    const href = (name === 'index') ? 'index.html' : name + '.html';
    return (typeof App.langHref === 'function') ? App.langHref(href) : href;
  };
}

/* App.projectHref 的兜底，理由同上一条，只是这次的触发面更大：
 * 新的 nav/works/project/index 都会调用它，而**作品页地址刚由 ?project= 改成目录式**
 * （成因与取舍见 scripts/gen-projects.mjs）。陈旧 app.js 里没有这个函数，
 * 兜底成旧的 ?project= 链接 —— 旧地址依然可用（project-template.html 未删），
 * 于是混用至多退化为「地址不漂亮」，不会出现点了没反应的死链或整块导航不渲染。 */
if (typeof App.projectHref !== 'function') {
  App.projectHref = function(id){
    const href = 'project-template.html?project=' + id;
    return (typeof App.langHref === 'function') ? App.langHref(href) : href;
  };
}

/* ===== 返回栏的目标：从作品列表点进来的作品页，返回回列表 =====
 *
 * 作者 2026-10-09 定：**只认「从作品列表点进来」**这一种来路，其余一律回首页。
 * 判定用 document.referrer —— 实测（headless Chrome，本地与线上同构）从 /works/ 与
 * /works/zh/ 点进作品页时 referrer 带完整路径，而且**刷新之后仍然保留**，所以不需要
 * sessionStorage 之类的补强；referrer 被隐私设置抹掉、从外站或书签直接进来时为 ''，
 * 返回栏维持指向首页（失败方向与今天完全一致）。线上响应头没有 Referrer-Policy，
 * 浏览器默认策略下同源导航会带完整 URL。
 *
 * 只对**作品页**生效：`.back` 在站内页（作品列表/简介/进程日志/404）也指向首页，
 * 今天没有「从作品列表点到那些页」的入口，但将来若加了，这里也不会突然改道。
 * 作品页的判据是 <html data-layout> —— 只有 project-template.html 的绘制前脚本会挂它。
 *
 * 返回目标是**算出来的、不是写死的**：原地换语言后 App.syncBackNav() 会重算一遍，
 * 于是「中文页面上点返回回到英文首页」与「切完语言返回仍指旧语言」一并解决。
 * Esc 处理器读的就是这个链接的 href（见文件末尾），所以不要在别处另算一份地址。 */
App.backTarget = function(){
  const home = App.pageHref('index');
  try {
    if (!document.documentElement.hasAttribute('data-layout')) return home;
    const r = document.referrer;
    if (!r) return home;
    const u = new URL(r);
    if (u.origin !== location.origin) return home;
    /* 目录式 /works/、/works/zh/，以及仍可用的旧地址 /works.html（中文旧地址还挂 ?lang=） */
    if (/\/works\/(zh\/)?$/.test(u.pathname) || /\/works\.html$/.test(u.pathname)) {
      return App.pageHref('works');
    }
  } catch(e) {}
  return home;
};

/** 把返回栏的 href 与文案同步成 App.backTarget() 的结果。
 *  文案：目标是作品列表时用 backWorks（「[<- 全部作品]」），否则回到 back（「[<- 返回]」）。
 *  **不换 data-i18n 键** —— `[data-i18n="back"]` 同时被本文件末尾的 Esc 处理器与
 *  js/project.js 的原地换语言逻辑当选择器用，换键会让那两处一起失灵。 */
App.syncBackNav = function(){
  const a = document.querySelector('.back a[data-i18n="back"]');
  if (!a) return;
  const target = App.backTarget();
  const lang = (App.I18n && App.I18n.currentLang) || 'en';
  const C = App.COMMON_I18N || {};
  const entry = (target === App.pageHref('works')) ? C.backWorks : C.back;
  a.setAttribute('href', target);
  if (entry && entry[lang]) a.textContent = entry[lang];
};

/** 子页面：顶部全宽返回栏 + 语言切换
 *  站内页（/about/、/works/、/changelog/、404）的生成页把它静态烤在 HTML 里，爬虫才看得到
 *  「返回」与语言按钮；这种情况下本函数不再重复创建，只把目标与文案同步一次。
 *  **作品页的返回栏没有烤**（project-template.html 里没有这一段，生成器也不写），
 *  它由 js/project.js 调用本函数在运行时插入 —— 所以无 JS 的读者在作品页看不到返回链接。 */
App.renderBackNav = function() {
  if (document.querySelector('.back')) { App.syncBackNav(); return; }
  const nav = document.createElement('div');
  nav.className = 'back';
  nav.innerHTML =
    '<a href="' + App.backTarget() + '" data-i18n="back">[<- 返回]</a>' +
    '<a href="#" id="lang-toggle" data-i18n="langToggle">[en] English</a>';
  document.body.prepend(nav);
  App.syncBackNav();
};

/** 首页：四角导航
 *  首页把这四角静态烤在 HTML 里（英文），爬虫因此能从首页走到作品列表与各作品；
 *  已存在时直接返回。 */
App.renderIndexNav = function() {
  if (document.querySelector('.nav-bottom-left')) return;
  const topLeft = document.createElement('div');
  topLeft.className = 'nav-top-left';
  topLeft.innerHTML =
    '<a href="' + App.pageHref('about') + '" data-i18n="about">[+] 简介与联系</a>' +
    '<a href="' + App.pageHref('changelog') + '" data-i18n="changelog">[>] 进程日志</a>';
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
  /* 作品链接走 App.projectHref()：它自带语言（中文界面上就是 works/<id>/zh/），
     所以不能再套一层 App.langHref，否则得到 works/<id>/zh/?lang=zh。 */
  bottomLeft.innerHTML =
    '<a href="' + App.projectHref('ecce-homo') + '" data-i18n="linkEcce">ECCE HOMO</a>' +
    '<a href="' + App.projectHref('riverrun') + '" class="nav-lowercase" data-i18n="linkRiverrun">riverrun</a>' +
    '<a href="' + App.projectHref('spectral-dissector') + '" data-i18n="linkSpectral">SPECTRAL DISSECTOR</a>' +
    '<a href="' + App.pageHref('works') + '" class="nav-all-works" data-i18n="allWorks">[ALL WORKS →]</a>';
  document.body.appendChild(bottomLeft);

  const bottomRight = document.createElement('div');
  bottomRight.className = 'nav-bottom-right';
  bottomRight.innerHTML =
    '<a href="#" id="lang-toggle" data-i18n="langToggle">[en] English</a>';
  document.body.appendChild(bottomRight);
};

/* ===== Esc 返回 =====
 *
 * 子页面按 Esc 等同于点顶部那个「返回」按钮 —— 回到首页（中文界面回 /zh/）。
 * 首页没有返回栏，不响应。三条约束，每条都有理由：
 *
 * ① **目标直接读页面上那个链接的 href，不在这里把地址重算一遍。**
 *    返回栏的去向有三种写法：生成页把地址烤进 HTML（'./' 或 './zh/'，配 `<base href="/">`）、
 *    手写模板由本文件现生成（App.pageHref('index') 同样给 './' 或 './zh/'）、
 *    旧地址还挂着 ?lang=。在 JS 里重算就是第二份真相，迟早与可见按钮漂移，
 *    而「按 Esc 等于点它」正是本功能对用户的承诺 —— 读 DOM 则天然同步：
 *    按钮修好了，快捷键跟着好。
 * ② **没有返回栏就不响应**：首页是四角导航，没有「返回」这个动作。
 * ③ **Lightbox 打开时先关它，本次按键不跳页**（Esc 逐层退出）。
 *    js/project.js 的 Lightbox 只在首次打开时创建遮罩、Esc 由它自己处理；
 *    本文件的监听器注册在前（nav.js 在 project.js 之前），故这里必须先让路，
 *    否则一次 Esc 会既关掉放大图又离开整页。将来的浮层沿用同一约定：
 *    要么在这里加一条判断，要么在自己的处理器里 e.preventDefault()（下面也认）。 */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  if (document.querySelector('.lightbox.open')) return;
  const back = document.querySelector('.back a[data-i18n="back"]');
  if (back && back.href) location.href = back.href;   /* .href 是解析后的绝对地址，base 与语言都已算进去 */
});

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
