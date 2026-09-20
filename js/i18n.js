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
 */
(function(){
  const DEFAULT_LANG = 'en';

  /* 脚本加载时的静态标题，供 apply() 在无 siteTitle 的页面回落使用。
     此刻各页的 JS（works.js / project.js 等）尚未运行，所以拿到的是 HTML 里的
     原标题（WORKS / PROJECT / ABOUT / CHANGELOG）。 */
  const ORIGINAL_TITLE = document.title;

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

    /** 注册翻译数据并立即应用，可选 onToggle 回调 */
    init(data, onToggle) {
      this._data = data;
      this._onToggle = onToggle || null;
      this._persist();   // 内联脚本未跑（如禁用 JS 的降级路径）时也能落定偏好
      this.apply();

      if (!this._listenerAttached) {
        this._listenerAttached = true;
        document.addEventListener('click', e => {
          const btn = e.target.closest('#lang-toggle');
          if (!btn) return;
          e.preventDefault();
          this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
          this._persist();
          this.apply();
          if (this._onToggle) this._onToggle(this.currentLang);
        });
      }
    },

    /** 持久化语言偏好并把当前语言同步进地址栏。
     *  localStorage 不可用（隐私模式等）时静默降级为仅 URL 携带。 */
    _persist() {
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
})();
