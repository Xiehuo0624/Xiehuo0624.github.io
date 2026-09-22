/* ===== 404 PAGE I18N DATA ===== */
App.NOTFOUND_I18N = {
/* 公共字符串（返回、语言切换）由 i18n 引擎在 init() 时合并，不在这里再抄一份 ——
   本文件可能是同步 <head> 脚本，执行时 js/i18n.js 还没跑，`...App.COMMON_I18N`
   会展开到 undefined 而静默少掉 back / langToggle 两个键（2026-09-22 修）。 */
  /* 标题刻意不叫「页面不存在」而只写 404：这个数字是通用的，中英读者都认识；
     真正需要翻译的是下面那句解释与两个出口。 */
  title: { zh:'404', en:'404' },
  lead:  {
    zh: '这个地址上没有页面。可能是链接拼错了，也可能它已经被移走 —— 站内还有八个作品在。',
    en: 'Nothing lives at this address. The link may be mistyped, or the page may have moved — the eight works are still here.'
  },
  home:  { zh:'[<- 返回首页]',   en:'[<- HOME]' },
  works: { zh:'[全部作品 →]',    en:'[ALL WORKS →]' }
};
