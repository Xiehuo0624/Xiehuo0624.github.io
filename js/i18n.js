/* ===== i18n ENGINE ===== */
(function(){
  let storedLang = 'zh';
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'zh' || saved === 'en') storedLang = saved;
  } catch(e) {}

  App.I18n = {
    currentLang: storedLang,
    _onToggle: null,
    _data: {},
    _listenerAttached: false,

    /** 注册翻译数据并立即应用，可选 onToggle 回调 */
    init(data, onToggle) {
      if (this.currentLang !== 'zh' && this.currentLang !== 'en') this.currentLang = 'zh';
      this._data = data;
      this._onToggle = onToggle || null;
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

    /** 持久化语言偏好；localStorage 不可用时静默降级为会话内记忆 */
    _persist() {
      try {
        localStorage.setItem('lang', this.currentLang);
      } catch(e) {}
    },

    /** 将所有 [data-i18n] 元素更新为当前语言，同步 <html lang> */
    apply() {
      document.documentElement.lang = this.currentLang;
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const entry = this._data[key];
        const text = entry && entry[this.currentLang];
        if (typeof text === 'string') el.textContent = text;
      });
    },

    /** 获取某条翻译 */
    t(key) {
      return this._data?.[key]?.[this.currentLang] || '';
    }
  };
})();
