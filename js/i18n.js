/* ===== i18n ENGINE ===== */
App.I18n = {
  currentLang: localStorage.getItem('lang') || 'zh',
  _onToggle: null,
  _data: {},
  _listenerAttached: false,

  /** 注册翻译数据并立即应用，可选 onToggle 回调 */
  init(data, onToggle) {
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
        localStorage.setItem('lang', this.currentLang);
        this.apply();
        if (this._onToggle) this._onToggle(this.currentLang);
      });
    }
  },

  /** 将所有 [data-i18n] 元素更新为当前语言，同步 <html lang> */
  apply() {
    document.documentElement.lang = this.currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (this._data[key]) el.textContent = this._data[key][this.currentLang];
    });
  },

  /** 获取某条翻译 */
  t(key) {
    return this._data?.[key]?.[this.currentLang] || '';
  }
};
