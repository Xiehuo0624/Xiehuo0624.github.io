/* ===== 404 PAGE ===== */
App.renderBackNav();
App.I18n.init(App.NOTFOUND_I18N);

/* 两个出口指向目录式地址（/ 与 /works/，中文为 /zh/ 与 /works/zh/）：
   data-page-href 写的是页面名，具体地址由 App.pageHref 按当前语言给出。
   HTML 里已经写好不带语言的 href（旧地址），JS 没跑时也能用，这里升级成规范地址。 */
document.querySelectorAll('[data-page-href]').forEach(a => {
  if (typeof App.pageHref === 'function') a.href = App.pageHref(a.dataset.pageHref);
});
