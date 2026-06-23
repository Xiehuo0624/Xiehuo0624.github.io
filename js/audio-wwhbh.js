/* ===== WWHBH: 90s digital delay / -18dB feedback ===== */
(function(){
  const DELAY_S   = 90;
  const FB_DB     = -18;
  const FB_LINEAR = Math.pow(10, FB_DB / 20);

  let audioCtx  = null;
  let micStream = null;
  let source    = null;
  let running   = false;
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

      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch(err) {
        btn.textContent = App.I18n.t('btnDenied');
        setTimeout(() => { if(!running) btn.textContent = App.I18n.t('btnActivate'); }, 2000);
        return;
      }

      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

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
  }
})();
