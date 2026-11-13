/* ===== ABOUT PAGE ===== */
App.renderBackNav();
App.I18n.init(App.ABOUT_I18N);

/* 原版 About 的展开状态跨语言切换保留。
   /about/ 与 /about/zh/ 是两份文档，切语言 = 整页导航，<details> 的 open 会丢；
   用 sessionStorage 记一次（与首页卡片顺序同一套会话级存储，关标签页即忘）。 */
const bioArchive = document.querySelector('.bio-archive');
if (bioArchive) {
  const ARCHIVE_KEY = 'aboutArchiveOpen';
  try {
    if (sessionStorage.getItem(ARCHIVE_KEY) === '1') bioArchive.open = true;
  } catch (e) {}
  bioArchive.addEventListener('toggle', () => {
    try { sessionStorage.setItem(ARCHIVE_KEY, bioArchive.open ? '1' : '0'); } catch (e) {}
  });
}

/* 作品列表链接按当前语言补 href。
   生成页（/about/、/about/zh/）由 scripts/gen-pages.mjs 按语言把 href 烤好，这里再设一次
   是幂等的；旧地址 about.html 没有生成器参与，?lang=zh 时必须靠这一步从 works/ 改成 works/zh/。 */
const worksLink = document.querySelector('[data-page-link="works"]');
if (worksLink && typeof App.pageHref === 'function') {
  worksLink.setAttribute('href', App.pageHref('works'));
}

/* 旧地址（about.html）声明规范地址：目录式地址才是正式的，语言随当前语言。
   静态的 noindex 覆盖不跑 JS 的抓取者，这一条覆盖跑 JS 的。 */
if (typeof App.injectCanonical === 'function' && typeof App.pageHref === 'function') {
  App.injectCanonical(App.pageHref('about'));
}
