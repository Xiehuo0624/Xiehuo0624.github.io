/* ===== SHARED I18N STRINGS ===== */
/* langToggle 显示的是「切换后会变成的语言」：
   默认英文界面上写 [zh] 中文，中文界面上写 [en] English。
   本站主版本是英文（申请语境），中文为可选版本。 */
App.COMMON_I18N = {
  back:       { zh:'[<- 返回]',    en:'[<- BACK]' },
  langToggle: { zh:'[en] English', en:'[zh] 中文' }
};
/* 四角署名（js/nav.js 的 .nav-top-right）保持汉字，不走 i18n：
   它是作者标识，与「水火」汉字 logo 同属签名，不是待翻译的正文。
   标签页标题另见 js/index-i18n.js 的 siteTitle。 */
