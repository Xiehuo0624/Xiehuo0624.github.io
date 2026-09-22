/* ===== ABOUT PAGE ===== */
App.renderBackNav();
App.I18n.init(App.ABOUT_I18N);

/* 旧地址（about.html）声明规范地址：目录式地址才是正式的，语言随当前语言。
   静态的 noindex 覆盖不跑 JS 的抓取者，这一条覆盖跑 JS 的。 */
if (typeof App.injectCanonical === 'function' && typeof App.pageHref === 'function') {
  App.injectCanonical(App.pageHref('about'));
}
