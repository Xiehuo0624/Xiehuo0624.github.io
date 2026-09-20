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
