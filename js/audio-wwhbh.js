/* ===== WWHBH: 90s digital delay / -18dB feedback ===== */
(function(){
  const DELAY_S   = 90;
  const FB_DB     = -18;
  const FB_LINEAR = Math.pow(10, FB_DB / 20);

  let audioCtx  = null;
  let micStream = null;
  let source    = null;
  let running   = false;
  let starting  = false;   // getUserMedia/AudioContext 初始化期间防双击竞态
  let btn       = null;

  App.initMicButton = function(btnEl) {
    btn = btnEl;
    btn.textContent = App.I18n.t('btnActivate');

    btn.addEventListener('click', async () => {
      if (running) {
        stop();
        btn.textContent = App.I18n.t('btnActivate');
        btn.classList.remove('on');
        return;
      }
      if (starting) return;   // 上一次点击仍在请求权限/初始化，忽略重复点击

      if (window.isSecureContext === false || !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        // 非安全上下文（例如通过局域网 IP 以 http:// 访问）没有 mediaDevices API，
        // 与用户拒绝麦克风权限是两回事，不要误报“权限被拒”。
        btn.textContent = App.I18n.t('btnUnavailable');
        setTimeout(() => { if(!running) btn.textContent = App.I18n.t('btnActivate'); }, 2000);
        return;
      }


      starting = true;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch(err) {
        starting = false;
        btn.textContent = App.I18n.t('btnDenied');
        setTimeout(() => { if(!running) btn.textContent = App.I18n.t('btnActivate'); }, 2000);
        return;
      }

      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') await audioCtx.resume();
      } catch(err) {
        stop();   // 已获得的麦克风流/半初始化上下文需要释放
        btn.textContent = App.I18n.t('btnDenied');
        setTimeout(() => { if(!running) btn.textContent = App.I18n.t('btnActivate'); }, 2000);
        return;
      }

      source = audioCtx.createMediaStreamSource(micStream);

      const delay  = audioCtx.createDelay(DELAY_S + 1);
      delay.delayTime.value = DELAY_S;

      const fbGain = audioCtx.createGain();
      fbGain.gain.value = FB_LINEAR;

      source.connect(delay);
      delay.connect(audioCtx.destination);
      delay.connect(fbGain);
      fbGain.connect(delay);

      running = true;
      starting = false;
      btn.textContent = App.I18n.t('btnDeactivate');
      btn.classList.add('on');
    });
  };

  /** 语言切换后刷新按钮文本 */
  App.refreshMicButton = function() {
    if (!btn) return;
    btn.textContent = running ? App.I18n.t('btnDeactivate') : App.I18n.t('btnActivate');
  };

  function stop() {
    if (source)   source.disconnect();
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    if (audioCtx)  audioCtx.close();
    audioCtx = null;
    micStream = null;
    source = null;
    running = false;
    starting = false;
  }
})();
