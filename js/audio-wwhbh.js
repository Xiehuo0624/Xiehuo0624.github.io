/* ===== WWHBH: 90s digital delay / -18dB feedback =====
 *
 * 页面加载即自动申请麦克风权限（不再需要点击按钮启动）。
 *
 * 关于浏览器限制：getUserMedia 无需用户手势即可调用（浏览器直接弹授权框），
 * 但 AudioContext 受自动播放策略约束，无用户激活时可能处于 suspended。
 * 因此启动流程为：自动申请权限 → 建立音频图 → 尝试立即 resume；
 * 若仍挂起，则监听页面任意首次手势（pointerdown/keydown/touchend）恢复。
 * 挂起期间状态行显示「▶ 点击开始聆听」，整页任意处点一下即可。
 *
 * 因为麦克风是自动开启的，必须始终提供显式关闭入口：运行中按钮为「关闭」。
 */
(function(){
  const DELAY_S   = 90;      // 与作品说明一致：90 秒延时
  const FB_DB     = -18;     // 反馈量 -18dB（作品说明里的 -12 ~ -18dB 区间下限）

  const FB_LINEAR = Math.pow(10, FB_DB / 20);
  const GESTURES  = ['pointerdown', 'keydown', 'touchend'];

  let audioCtx  = null;
  let micStream = null;
  let source    = null;
  let running   = false;     // 音频图已建立
  let starting  = false;     // 申请权限／初始化中，防重复
  let state     = '';
  let btn       = null;
  let statusEl  = null;
  let gestureHandler = null;

  /* ---------- 状态呈现 ---------- */
  const TEXT = {
    requesting:  'micRequesting',
    suspended:   'micSuspended',
    running:     'micRunning',
    idle:        'micIdle',
    denied:      'micDenied',
    unavailable: 'micUnavailable'
  };

  function setState(s){
    state = s;
    if (statusEl){
      statusEl.textContent = App.I18n.t(TEXT[s] || 'micRequesting');
      statusEl.classList.toggle('on', s === 'running');
      statusEl.classList.toggle('clickable', s === 'suspended');
    }
    // 晕染层（js/ink-wwhbh.js）跟着聆听状态走：running 才开始长，其余冻住。
    // resume()/pause() 自带去重，切语言重刷状态行不会把它重新触发一遍。
    if (App.wwhbhInk){
      if (s === 'running') App.wwhbhInk.resume();
      else App.wwhbhInk.pause();
    }
    if (!btn) return;
    if (s === 'running'){
      btn.style.display = '';
      btn.textContent = App.I18n.t('btnDeactivate');
      btn.classList.add('on');
    } else if (s === 'denied'){
      btn.style.display = '';
      btn.textContent = App.I18n.t('btnRetry');
      btn.classList.remove('on');
    } else if (s === 'idle'){
      // 用户主动关闭：必须留一个重新开始的入口，否则页面回不到聆听状态
      btn.style.display = '';
      btn.textContent = App.I18n.t('btnStart');
      btn.classList.remove('on');
    } else {
      // requesting / suspended / unavailable：不显示按钮（挂起时点页面任意处即可）
      btn.style.display = 'none';
      btn.classList.remove('on');
    }
  }

  /* ---------- 音频图 ---------- */
  function buildGraph(){
    source = audioCtx.createMediaStreamSource(micStream);

    const delay = audioCtx.createDelay(DELAY_S + 1);
    delay.delayTime.value = DELAY_S;

    const fbGain = audioCtx.createGain();
    fbGain.gain.value = FB_LINEAR;

    source.connect(delay);
    delay.connect(audioCtx.destination);   // 干路输出
    delay.connect(fbGain);
    fbGain.connect(delay);                 // 反馈回路
  }

  /* ---------- 首次手势恢复 ---------- */
  function waitGestureResume(){
    if (gestureHandler) return;
    gestureHandler = async () => {
      GESTURES.forEach(e => window.removeEventListener(e, gestureHandler, true));
      gestureHandler = null;
      if (!audioCtx) return;
      try { await audioCtx.resume(); } catch(e) {}
      setState(audioCtx.state === 'running' ? 'running' : 'suspended');
      if (audioCtx.state !== 'running') waitGestureResume();   // 仍未成功则继续等
    };
    GESTURES.forEach(e => window.addEventListener(e, gestureHandler, true));
  }

  /* ---------- 启动 ---------- */
  async function start(){
    if (running || starting) return;
    starting = true;
    setState('requesting');

    if (window.isSecureContext === false ||
        !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)){
      // 非安全上下文（局域网 http:// 访问）没有 mediaDevices，
      // 与用户拒绝权限是两回事，不要误报「权限被拒」。
      starting = false;
      setState('unavailable');
      return;
    }

    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch(err){
      starting = false;
      setState('denied');
      return;
    }

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(err){
      starting = false;
      stop();
      setState('denied');
      return;
    }

    buildGraph();
    running = true;
    starting = false;

    // 先尝试直接恢复（部分浏览器允许）；失败则等首次手势
    try { await audioCtx.resume(); } catch(e) {}
    if (audioCtx.state === 'running'){
      setState('running');
    } else {
      setState('suspended');
      waitGestureResume();
    }
  }

  /* ---------- 停止 ---------- */
  function stop(){
    if (gestureHandler){
      GESTURES.forEach(e => window.removeEventListener(e, gestureHandler, true));
      gestureHandler = null;
    }
    if (source)    { try { source.disconnect(); } catch(e){} }
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    if (audioCtx)  { try { audioCtx.close(); } catch(e){} }
    audioCtx = null; micStream = null; source = null;
    running = false; starting = false;
  }

  /* ---------- 对外接口 ---------- */
  App.initWwhbh = function(btnEl, statusElement){
    btn = btnEl;
    statusEl = statusElement;
    btn.addEventListener('click', () => {
      if (running && audioCtx && audioCtx.state === 'running'){
        stop();
        setState('idle');
        return;
      }
      // 被拒后重试；挂起时点击由全局手势监听处理，这里兜底再试一次
      start();
    });
    start();          // 页面加载即自动申请权限
  };

  /** 语言切换后刷新状态行与按钮文本（不改动运行状态） */
  App.refreshWwhbhUI = function(){
    if (!state) return;
    setState(state);
  };
})();
