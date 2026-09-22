/* ===== i18n ENGINE =====
 *
 * 语言优先级：URL 的 ?lang= 参数 > localStorage 记忆 > 默认 en。
 *
 * 默认是 en 而不是 zh，因为本站在申请语境下的主版本是英文：委员会、导师、
 * 作品集读者多数不读中文，而中文版对他们是不可读的。中文仍是一等公民，
 * 只是需要通过 ?lang=zh 或右下角按钮显式选择。
 *
 * URL 参数之所以必须存在：语言若只存 localStorage，把链接发给别人时对方
 * 打开看到的永远是默认语言，发链接的人无法控制。现在 ?lang=en 可随链接
 * 一起传递，并且切换语言会同步回地址栏，复制出来的 URL 带着当前语言。
 *
 * **作品页是例外**：它的语言写在路径里（works/<id>/ 与 works/<id>/zh/），
 * 页面带 data-lang-fixed，既不吃 localStorage 也不写 ?lang=，切换语言是跳转
 * 到另一语言那份页面。成因见 js/app.js 的 App.projectHref 与
 * scripts/gen-projects.mjs 顶部注释；静态页需要按语言各有一份可被抓取的 HTML，
 * 路径式是唯一能做到这点的形式。
 */
(function(){
  const DEFAULT_LANG = 'en';

  /* 脚本加载时的静态标题，供 apply() 在无 siteTitle 的页面回落使用。
     此刻各页的 JS（works.js / project.js 等）尚未运行，所以拿到的是 HTML 里的
     原标题（WORKS / PROJECT / ABOUT / CHANGELOG）。 */
  const ORIGINAL_TITLE = document.title;

  /* 语言由路径固定的页面（作品页生成页）：见文件头注释。
     属性写在 HTML 上，不依赖脚本执行顺序，也不受缓存世代影响。 */
  const FIXED_LANG = document.documentElement.hasAttribute('data-lang-fixed');

  /** 只接受已知语言，其余一律回落到默认语言 */
  function normalize(lang) {
    return (lang === 'zh' || lang === 'en') ? lang : DEFAULT_LANG;
  }

  /** 单一来源：<html data-lang> 由 <head> 里的前置内联脚本在绘制前写入，
   *  用于在首屏就定下语言（避免中文文案一闪而过）。没有它时退回 localStorage。 */
  let initial = '';
  try { initial = document.documentElement.dataset.lang || ''; } catch(e) {}
  if (!initial) {
    try { initial = localStorage.getItem('lang') || ''; } catch(e) {}
  }

  App.I18n = {
    currentLang: normalize(initial),
    _onToggle: null,
    _data: {},
    _listenerAttached: false,

    /** 注册翻译数据并立即应用，可选 onToggle 回调
     *
     *  **公共字符串在本方法里合并**，不由各页数据文件自己 spread：
     *  works / about / changelog / 404 四页的 `<页面>-i18n.js` 是同步 `<head>` 脚本
     *  （为「绘制前定 h1 文案」而同步，见 §8a），执行时本文件（defer）还没跑，
     *  于是那些文件里的 `...App.COMMON_I18N` 展开到 undefined —— 静默少掉 back /
     *  langToggle 两个键，apply() 找不到条目，导航就停在 HTML 里硬编码的中文上：
     *  英文界面显示「[<- 返回]」、语言按钮显示「[en] English」（2026-09-22 实测确认）。
     *  合并放到引擎里之后，公共字符串只有 i18n.js 一处定义，且与页面数据文件的
     *  加载顺序无关；页面数据即使写了同名键也会被它覆盖，不会各自漂移。 */
    init(data, onToggle) {
      this._data = Object.assign({}, App.COMMON_I18N, data);
      this._onToggle = onToggle || null;
      this._persist();   // 内联脚本未跑（如禁用 JS 的降级路径）时也能落定偏好
      this.apply();

      if (!this._listenerAttached) {
        this._listenerAttached = true;
        document.addEventListener('click', e => {
          const btn = e.target.closest('#lang-toggle');
          if (!btn) return;
          e.preventDefault();
          const target = this.currentLang === 'zh' ? 'en' : 'zh';
          /* 路径固定语言的页面：切换语言 = 跳到另一语言那份页面。
             目标直接读页面头部的 <link rel="alternate" hreflang>，与给搜索引擎的
             hreflang 是同一份数据，不在 JS 里另存一张 id→URL 映射表（两份表早晚漂移）。
             但**只取路径**：hreflang 写的是规范域名（绝对地址），照搬会把本地预览
             （scripts/start-https.sh）与 github.io 镜像上的读者甩到正式域名上，
             一次语言切换变成跨站跳转（实测：本地点一下直接跳到了 caohaoxuan.com 线上）。
             路径相同是因为本站始终部署在域名根目录。
             读不到（HTML 与 JS 世代错配、或生成器将来改了标记）时退回原地切换：
             最坏结果是地址栏不带语言目录，而不是按钮点了没反应。 */
          if (FIXED_LANG) {
            const alt = document.querySelector('link[rel="alternate"][hreflang="' + target + '"]');
            if (alt && alt.href) {
              try { location.href = new URL(alt.href, location.href).pathname; }
              catch(e) { location.href = alt.href; }
              return;
            }
          }
          this.currentLang = target;
          this._persist();
          this.apply();
          if (this._onToggle) this._onToggle(this.currentLang);
        });
      }
    },

    /** 持久化语言偏好并把当前语言同步进地址栏。
     *  localStorage 不可用（隐私模式等）时静默降级为仅 URL 携带。
     *  路径固定语言的页面直接返回：语言是路径的一部分，写回 localStorage 会让
     *  用户之后打开的根目录页面莫名变成作品页那一版的语言；写回地址栏则会立刻
     *  把干净的 works/x/ 改写成 works/x/?lang=en，把它变成需要修的那种脏地址。 */
    _persist() {
      if (FIXED_LANG) return;
      try {
        localStorage.setItem('lang', this.currentLang);
      } catch(e) {}
      this._syncUrl();
    },

    /** 把 ?lang= 写回地址栏，保留 project 等其它查询参数。
     *  用 replaceState 以免污染后退历史；file:// 下会抛错，忽略即可。 */
    _syncUrl() {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('lang') === this.currentLang) return;
        url.searchParams.set('lang', this.currentLang);
        history.replaceState(null, '', url.href);
      } catch(e) {}
    },

    /** 将所有 [data-i18n] 元素更新为当前语言，同步 <html lang> 与标签页标题 */
    apply() {
      document.documentElement.lang = this.currentLang;
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const entry = this._data[key];
        const text = entry && entry[this.currentLang];
        if (typeof text === 'string') el.textContent = text;
      });
      /* 标签页标题本地化：以 siteTitle 覆盖，其余各页回落到加载时的原标题。
         回落是必需的 —— apply() 会在 init() 时执行，而 works / project 页是在
         init() 之后才各自写 document.title 的，若不回落，init 这一次 apply
         会把它们刚写好的标题冲掉（实测英文界面下作品列表页曾被冲成首页标题）。
         回落目标 ORIGINAL_TITLE 是脚本加载时（各页 JS 尚未运行）的静态标题。 */
      const siteTitle = this._data && this._data.siteTitle;
      const localized = siteTitle && siteTitle[this.currentLang];
      document.title = localized || ORIGINAL_TITLE;
    },

    /** 获取某条翻译 */
    t(key) {
      return this._data?.[key]?.[this.currentLang] || '';
    }
  };

  /* ===== 公共字符串 =====
   * 原先单独放在 js/i18n-common.js，现并入本文件。
   *
   * 并入的原因是可缓存性：GitHub Pages 给 .js 的响应是 `max-age=14400`（4 小时），
   * 于是部署后节点上会同时存在新旧两批 JS。i18n-common.js 只有这几行数据，却被
   * 五个页面各自引用，一旦它留在缓存里，全站的「返回」「语言切换」文案就会是旧的，
   * 而引用它的页面却是新的（2026-09-21 的新旧混用事故即属此类）。
   * 并进来之后，这段数据随引擎一起走同一个 URL、同一个版本号，不会再各自漂移。
   *
   * **定义只此一处**：各页数据文件不再 `...App.COMMON_I18N`，改由 init() 合并
   * （原因见 init 的注释：页面数据文件可能先于本文件执行）。
   *
   * langToggle 显示的是「切换后会变成的语言」：默认英文界面上写 [zh] 中文，
   * 中文界面上写 [en] English。本站主版本是英文（申请语境），中文为可选版本。
   */
  App.COMMON_I18N = {
    back:       { zh:'[<- 返回]',    en:'[<- BACK]' },
    langToggle: { zh:'[en] English', en:'[zh] 中文' }
  };
  /* 四角署名（js/nav.js 的 .nav-top-right）保持汉字，不走 i18n：
     它是作者标识，与「水火」汉字 logo 同属签名，不是待翻译的正文。
     标签页标题另见 js/index-i18n.js 的 siteTitle。 */
})();
