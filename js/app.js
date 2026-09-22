/* ===== APP NAMESPACE ===== */
window.App = window.App || {};

/* ===== 语言参数传播 =====
 *
 * 全站语言由 ?lang= 决定（见 js/i18n.js）。同源 .html 链接必须把当前语言
 * 一起带过去，否则用户在中文界面点进作品页又会被打回默认英文。
 *
 * 默认语言 en 不加参数，URL 保持干净的 works.html。
 * 其它语言才附加 ?lang=zh；已有查询参数（如 ?project=riverrun）时用 & 追加。
 * 所有动态生成的站内链接都应经由 App.langHref()，不要在别处硬拼 URL。
 */
App.langHref = function(href){
  const lang = (window.App.I18n && App.I18n.currentLang) || 'en';
  if (lang === 'en') return href;
  return href + (href.indexOf('?') === -1 ? '?' : '&') + 'lang=' + lang;
};

/* ===== 作品页地址 =====
 *
 * 作品页的规范地址是**目录式**，语言写在路径里而不是查询串里：
 *   英文（默认）  works/<id>/
 *   中文          works/<id>/zh/
 * 静态页由 scripts/gen-projects.mjs 生成，旧地址的兼容策略见该文件顶部注释。
 *
 * 三条约定：
 * ① **不要**把它交给 App.langHref()。语言已经由目录表达了，再挂一个 ?lang=zh
 *    只会得到 works/x/zh/?lang=zh 这种自相矛盾的地址（生成页会忽略该参数，
 *    但复制出去的链接很难看，而难看正是本次要消掉的东西）。
 * ② 用相对路径而不是以 / 开头：带 <base href="/"> 的生成页与根目录页面都能解析到
 *    同一处，且 file:// 下也还能用。
 * ③ 目录名就是 App.projects 的键，不另设 slug 字段 —— 两个地方各存一份名字，
 *    迟早会各自漂移。 */
App.projectHref = function(id, forcedLang){
  const lang = forcedLang || (window.App.I18n && App.I18n.currentLang) || 'en';
  return 'works/' + id + '/' + (lang === 'zh' ? 'zh/' : '');
};

/* ===== 站内页面地址 =====
 *
 * 与 App.projectHref 同一套思路：**语言写在路径里**，英文在根、中文在 /zh/ 子目录：
 *     首页 / 与 /zh/     作品列表 /works/ 与 /works/zh/
 *     简介 /about/ 与 /about/zh/     进程日志 /changelog/ 与 /changelog/zh/
 * 旧地址（/about.html、?lang=zh 等）继续可用，但不再是规范地址：它们带 noindex，
 * 并由 App.injectCanonical() 声明规范地址。
 *
 * 与 App.langHref 的分工：langHref 给「仍以 ?lang= 表达语言」的旧页面用（本项目里只剩旧地址），
 * 新页面一律走 pageHref / projectHref —— 它们的返回值里已经带了语言，**不要再套 langHref**。 */
App.pageHref = function(name, forcedLang){
  const lang = forcedLang || (window.App.I18n && App.I18n.currentLang) || 'en';
  const base = (name === 'index') ? '' : name + '/';          /* 'works' → 'works/' */
  return base + (lang === 'zh' ? 'zh/' : '');
};

/* ===== 旧地址声明规范地址 =====
 *
 * 目录式地址成为规范地址之后，旧的 .html／?project= 地址都该把索引权重交出去：
 * 静态 noindex 覆盖不跑 JS 的抓取者，这条 canonical 覆盖跑 JS 的抓取者。 */
App.injectCanonical = function(href){
  try {
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = new URL(href, location.href).href;
    document.head.appendChild(link);
  } catch(e) {}
};
