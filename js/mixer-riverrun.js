/* ===== RIVERRUN: spatial mixer (recreates The FET Mixer interaction) =====
 *
 * 12 条音轨在二维「面板」上排布为若干点，点的直径随各轨响度脉动；所有音轨同步循环
 * 播放。用户以光标（抽象指示，非麦克风图标）在面板内移动，即为一只虚拟「麦克风」：
 * 离某轨越近，该轨混音音量越大，越远越小（距离反比衰减）。支持多只麦克风（多点触控，
 * 每根手指一只），其贡献以饱和求和的方式叠加。每只麦克风带增益控制：触控/手写笔/Force
 * Touch 设备读取 PointerEvent.pressure（按压力度）；鼠标无压力则用滚轮调节增益。
 *
 * 音频：12 个 <audio> 流式播放（MediaElementAudioSourceNode，低内存、可同步循环），
 * 每轨 source → analyser(响度可视化) → gain(距离混音) → stereoPanner(按 X 固定声像)
 *       → masterGain → limiter(DynamicsCompressor) → destination
 *       ╰ 全局并行发送 FX 链（黑箱）：干声带少量混响；send(0.08~0.5 恒有下限) →
 *         混响(合成IR) → 压缩 → EQ → 颤音(微) → drive(微) → 延迟 → 反馈(恒有) →
 *         swell(伪 reverse 包络) → 返回 limiter（drone 永不停止，swell 时长随麦克风位置）
 *         输出经 -12dB 动态约束始终小于干声
 * 可视化：Canvas 2D，RAF 常驻绘制（启动前也画静态点阵预览）。
 */
(function(){
  let state = null;   // 当前实例状态（本页仅一个 riverrun）

  App.initRiverrunMixer = function(panel, opts){
    if (state) return;                       // 防止重复初始化
    opts = opts || {};
    const AUDIO_DIR    = opts.audioDir || 'audio/riverrun';
    const TRACK_COUNT  = opts.tracks   || 12;

    /* ---- DOM ---- */
    const stage     = panel.querySelector('#mixer-stage');
    const canvas    = panel.querySelector('#mixer-canvas');
    const ctx       = canvas.getContext('2d');
    const center    = panel.querySelector('#mixer-center');
    const toggleBtn = panel.querySelector('#mixer-toggle');
    const stopBtn   = panel.querySelector('#mixer-stop');

    /* ---- runtime ---- */
    let audioCtx = null, masterGain = null, limiter = null;
    // 全局 FX 链节点（frame 中按麦克风位置调制）
    let fxSend = null, fxFb = null, fxDelay = null, fxEq = null;
    let fxTrem = null, tremLfo = null, tremAmt = null, fxDrivePre = null;
    // 干声混响 + drone 返回（-12dB 约束用）
    let dryRevSend = null, dryReverb = null, fxReturn = null;
    let dryAn = null, fxAn = null, dryBuf = null, fxBuf = null;
    // 伪 reverse（swell 包络）
    let swellLfo = null, swellDepth = null, swellBaseSrc = null;
    let tracks = [];                 // {el,src,analyser,gain,panner,smoothed,targetGain,wave,num,pos}
    let running = false, loading = false;
    let W = 0, H = 0, dpr = 1;
    let positions = [];              // {x,y,nx,ny} 与音轨索引对齐
    let slotOrder = null;            // 音轨→槽位的洗牌映射（每次启动重排）
    let raf = 0;

    /* ---- microphones ---- */
    // 鼠标：常驻一只（光标进入面板即拾音，离开即静音）；增益由滚轮调节
    const mouseMic = { x: -9999, y: -9999, gain: 0.7, type: 'mouse' };
    let mouseGain = 0.7;
    let touchGain = 1.0;             // 手机端增益固定 100%（无力度传感器，不做交互控件）
    // 触控/手写笔：按下即产生一只，抬起即消失；增益取 pressure（设备支持时为按压力度）
    const touchMics = new Map();     // pointerId -> {x,y,gain,type}
    // 纯触屏设备（手机/平板）不启用鼠标麦克风：iOS/Android 在触摸时会派发
    // "兼容性鼠标"指针事件（pointerType='mouse'），会把鼠标麦克风钉在触摸点上且
    // 手指抬起后不释放，导致无任何操作时音轨全部自动播放。
    // ⚠ 不能用 matchMedia('(pointer: fine)') 单独判断：iOS Safari 会同时报
    //   coarse 与 fine；navigator.maxTouchPoints 才是可靠的触摸设备标志
    const isCoarse = navigator.maxTouchPoints > 0 || !window.matchMedia('(pointer: fine)').matches;
    // 低端设备降级：核数 ≤ 4 时减负（analyser 尺寸、拾音连线、FX 约束分析）
    const LOW_END = (navigator.hardwareConcurrency || 8) <= 4;

    /* ============ geometry ============ */
    // Fisher-Yates 洗牌：打乱音轨与槽位的对应关系（每次启动都重新排布）
    function shuffleSlots(){
      if (!slotOrder){ slotOrder = []; for (let i = 0; i < TRACK_COUNT; i++) slotOrder[i] = i; }
      for (let i = slotOrder.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        const t = slotOrder[i]; slotOrder[i] = slotOrder[j]; slotOrder[j] = t;
      }
    }
    function computePositions(){
      const cols = 4, rows = Math.ceil(TRACK_COUNT / cols);
      // 紧凑方格簇：以正方形单元居中排布，声源彼此靠近、四周留出供光标游走的边距
      const cell = Math.min(W, H) * 0.26;
      const gw = cell * cols, gh = cell * rows;
      const ox = (W - gw) / 2, oy = (H - gh) / 2;
      if (!slotOrder){ slotOrder = []; for (let i = 0; i < TRACK_COUNT; i++) slotOrder[i] = i; }
      positions = [];
      for (let i = 0; i < TRACK_COUNT; i++){
        const slot = slotOrder[i];                    // 该音轨本次所在的（已洗牌）槽位
        const c = slot % cols, r = Math.floor(slot / cols);
        positions.push({
          x: ox + (c + 0.5) * cell,
          y: oy + (r + 0.5) * cell,
          nx: (c + 0.5) / cols,                       // 列归一坐标 → 固定声像（随槽位而定）
          ny: (r + 0.5) / rows
        });
      }
      if (tracks.length) tracks.forEach((t, i) => { t.pos = positions[i]; });
    }

    function resize(){
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      if (W < 2 || H < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, isCoarse ? 1.5 : 2);   // 移动端限 1.5，减轻画布负担
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      computePositions();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* ============ audio ============ */
    /* ---- FX 辅助：程序生成混响 IR 与软驱动曲线（无外部素材，黑箱） ---- */
    function makeImpulse(sec, decay){
      const rate = audioCtx.sampleRate, len = Math.floor(rate * sec);
      const buf = audioCtx.createBuffer(2, len, rate);
      for (let ch = 0; ch < 2; ch++){
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return buf;
    }
    function makeDriveCurve(){
      const n = 1024, c = new Float32Array(n), k = 2.2;
      for (let i = 0; i < n; i++){ const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * k) / Math.tanh(k); }
      return c;
    }
    // 锯齿 LFO → y=(x+1)/2：慢升骤降的 swell 包络（伪 reverse 渐入感）
    function makeRampCurve(){
      const n = 256, c = new Float32Array(n);
      for (let i = 0; i < n; i++){ c[i] = (i / (n - 1)); }
      return c;
    }

    async function start(){
      if (running || loading) return;
      loading = true;
      toggleBtn.disabled = true;
      toggleBtn.textContent = App.I18n.t('mixerLoading');

      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') { try { await audioCtx.resume(); } catch(e){} }

      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.5;
      limiter = audioCtx.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.knee.value = 0;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.25;
      masterGain.connect(limiter);
      limiter.connect(audioCtx.destination);

      /* ===== FX 链（黑箱，无 UI）：干声带少量混响 + 并行发送 → 永不停止的 drone =====
       * master ─┬→ limiter（干声）
       *          ├→ dryRevSend(0.15 固定) → dryReverb(1.5s IR) → limiter   干声混响，避免太干
       *          └→ fxSend(0.08~0.5 位置调制, 恒有下限) → [fxIn] → droneReverb(2.6s 高wet)
       *              → 压缩 → EQ(520Hz) → 颤音(微) → drive(微) → 延迟 → fxFb(恒有) → fxIn
       *              → fxReturn（-12dB 动态约束 ≤ 干声×0.251）→ limiter */
      // 干声混响（短而柔，固定发送）
      dryRevSend = audioCtx.createGain(); dryRevSend.gain.value = 0.15;
      dryReverb = audioCtx.createConvolver();
      dryReverb.buffer = makeImpulse(1.5, 4.0);
      masterGain.connect(dryRevSend);
      dryRevSend.connect(dryReverb);
      dryReverb.connect(limiter);
      // drone FX 链
      fxSend = audioCtx.createGain(); fxSend.gain.value = 0.08;   // 恒有下限：drone 不静默
      const fxIn = audioCtx.createGain();                 // 反馈求和点（混响输入端）
      const convolver = audioCtx.createConvolver();
      convolver.buffer = makeImpulse(2.6, 3.0);           // 2.6s 合成 IR：长尾模糊 drone
      const fxComp = audioCtx.createDynamicsCompressor();
      fxComp.threshold.value = -18; fxComp.knee.value = 12; fxComp.ratio.value = 6;
      fxComp.attack.value = 0.01; fxComp.release.value = 0.3;
      fxEq = audioCtx.createBiquadFilter();
      fxEq.type = 'peaking'; fxEq.frequency.value = 520; fxEq.Q.value = 0.8; fxEq.gain.value = 0;
      fxTrem = audioCtx.createGain(); fxTrem.gain.value = 1;
      tremLfo = audioCtx.createOscillator(); tremLfo.frequency.value = 1.2;
      tremAmt = audioCtx.createGain(); tremAmt.gain.value = 0.06;   // 颤音深度 6%（微弱）
      fxDrivePre = audioCtx.createGain(); fxDrivePre.gain.value = 1.3;
      const fxDrive = audioCtx.createWaveShaper(); fxDrive.curve = makeDriveCurve(); fxDrive.oversample = '2x';
      fxDelay = audioCtx.createDelay(1.5); fxDelay.delayTime.value = 0.42;
      fxFb = audioCtx.createGain(); fxFb.gain.value = 0.18;         // 恒有反馈：delay 一直有 feedback
      fxReturn = audioCtx.createGain(); fxReturn.gain.value = 1;    // -12dB 约束由 frame 动态调制
      dryAn = audioCtx.createAnalyser(); dryAn.fftSize = 2048;
      fxAn  = audioCtx.createAnalyser(); fxAn.fftSize = 2048;
      dryBuf = new Uint8Array(1024); fxBuf = new Uint8Array(1024);
      // 伪 reverse：锯齿 LFO → 斜坡整形 → 慢升骤降，调制 drone 输出（永不静默）
      swellLfo = audioCtx.createOscillator();
      swellLfo.type = 'sawtooth'; swellLfo.frequency.value = 0.3;
      const swellShaper = audioCtx.createWaveShaper();
      swellShaper.curve = makeRampCurve();
      swellDepth = audioCtx.createGain(); swellDepth.gain.value = 0.4;   // max-min（0.2–0.5）
      swellBaseSrc = audioCtx.createConstantSource(); swellBaseSrc.offset.value = 0.6;  // min（0.5–0.8）
      const swellGain = audioCtx.createGain(); swellGain.gain.value = 1;
      swellLfo.connect(swellShaper);
      swellShaper.connect(swellDepth);
      swellDepth.connect(swellGain.gain);
      swellBaseSrc.connect(swellGain.gain);

      masterGain.connect(fxSend);
      fxSend.connect(fxIn);
      fxIn.connect(convolver);
      convolver.connect(fxComp);
      fxComp.connect(fxEq);
      fxEq.connect(fxTrem);
      fxTrem.connect(fxDrivePre);
      fxDrivePre.connect(fxDrive);
      fxDrive.connect(fxDelay);
      fxDelay.connect(swellGain);       // 伪 reverse：输出经 swell 包络
      swellGain.connect(fxReturn);
      fxDelay.connect(fxFb);            // 反馈环路不受 swell 影响（保持稳定）
      fxFb.connect(fxIn);               // feedback 回混响前（循环 drone）
      fxReturn.connect(limiter);        // 返回同样经过限幅，防爆音
      masterGain.connect(dryAn);        // 干声电平分析（-12dB 约束参照）
      fxReturn.connect(fxAn);           // FX 输出电平分析
      tremLfo.connect(tremAmt); tremAmt.connect(fxTrem.gain);
      tremLfo.start();
      swellLfo.start();
      swellBaseSrc.start();

      tracks = [];
      shuffleSlots();              // 每次启动重新洗牌：音轨与槽位的对应关系随机化
      computePositions();
      const made = [];
      for (let i = 0; i < TRACK_COUNT; i++){
        const el = new Audio();
        el.src = AUDIO_DIR + '/' + (i + 1) + '.m4a';
        el.loop = true;
        el.preload = 'metadata';     // 弱网友好：仅先取元数据，播放时才拉流（避免 17MB 预缓冲）
        el.crossOrigin = 'anonymous';
        // 用户手势内立即 play()+pause() 解锁（iOS 要求），真正播放等加载完成后再同步起播
        try { const p = el.play(); if (p && p.catch) p.catch(()=>{}); el.pause(); } catch(e){}

        const src      = audioCtx.createMediaElementSource(el);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = LOW_END ? 512 : 1024;
        const gain     = audioCtx.createGain();
        gain.gain.value = 0;
        const panner   = audioCtx.createStereoPanner();
        panner.pan.value = positions[i].nx * 2 - 1;   // 按 X 固定声像：左轨偏左、右轨偏右
        src.connect(analyser); analyser.connect(gain); gain.connect(panner); panner.connect(masterGain);

        const t = {
          el, src, analyser, gain, panner,
          num: i + 1, pos: positions[i],
          smoothed: 0, targetGain: 0,
          wave: new Uint8Array(analyser.fftSize)
        };
        tracks.push(t);
        made.push(new Promise(res => {
          let done = false;
          const finish = () => { if (done) return; done = true; el.removeEventListener('canplaythrough', finish); el.removeEventListener('loadedmetadata', finish); res(); };
          el.addEventListener('canplaythrough', finish);
          el.addEventListener('loadedmetadata', finish);   // 部分浏览器仅触发到此
          setTimeout(finish, 12000);                       // 超时兜底
        }));
      }

      // 加载进度
      let ready = 0;
      const tick = () => { toggleBtn.textContent = App.I18n.t('mixerLoading') + ' ' + ready + '/' + TRACK_COUNT; };
      made.forEach((p, i) => p.then(() => { ready++; tick(); }));
      tick();
      await Promise.all(made);

      // 同步起播：全部 currentTime 归零后紧密连发 play()
      tracks.forEach(t => { try { t.el.currentTime = 0; } catch(e){} });
      tracks.forEach(t => { const p = t.el.play(); if (p && p.catch) p.catch(()=>{}); });

      touchMics.clear();               // 清除启动瞬间可能残留的幽灵触摸
      running = true; loading = false;
      toggleBtn.disabled = false;
      center.style.display = 'none';
      stopBtn.style.display = 'inline-block';
    }

    function stop(){
      if (!running && !loading) {
        // 即便在加载中也允许取消
        if (loading) { loading = false; toggleBtn.disabled = false; toggleBtn.textContent = App.I18n.t('mixerStart'); }
        return;
      }
      running = false;
      tracks.forEach(t => {
        try { t.el.pause(); } catch(e){}
        try { t.el.src = ''; } catch(e){}
        try { t.src.disconnect(); } catch(e){}
      });
      tracks = [];
      try { if (limiter) limiter.disconnect(); } catch(e){}
      try { if (masterGain) masterGain.disconnect(); } catch(e){}
      try { if (audioCtx) audioCtx.close(); } catch(e){}
      audioCtx = null; masterGain = null; limiter = null;

      center.style.display = '';
      stopBtn.style.display = 'none';
      toggleBtn.textContent = App.I18n.t('mixerStart');
    }

    /* ============ interaction ============ */
    // 麦克风增益：手写笔用真实压力（pressure）；鼠标用滚轮值（wheel）；
    // 手机固定 100%（现代手机没有触摸力度传感器，3D Touch 已随 iPhone 11 移除）
    function micGain(e){
      if (e.pointerType === 'pen'){
        const p = (typeof e.pressure === 'number' && e.pressure > 0) ? e.pressure : 0.5;
        return Math.max(0.15, Math.min(1, p));
      }
      return e.pointerType === 'mouse' ? mouseGain : touchGain;
    }
    // 增益控件已移除（电脑/手机都不显示）：增益只通过麦克风光标外圈半径与增益弧
    // 指示——桌面以滚轮调节（wheel），手机固定 100%，手写笔用 pressure
    function activeMics(){
      const arr = [];
      if (!isCoarse && mouseMic.x > -1000) arr.push(mouseMic);
      touchMics.forEach(m => arr.push(m));
      return arr;
    }

    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;   // 鼠标单击无任何效果：悬停即混音，按下/松开不介入
      canvas.setPointerCapture(e.pointerId);
      const x = e.offsetX, y = e.offsetY;
      touchMics.set(e.pointerId, { x, y, gain: micGain(e), type: e.pointerType });
    });
    canvas.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse' && !isCoarse){
        mouseMic.x = e.offsetX; mouseMic.y = e.offsetY; mouseMic.gain = mouseGain;
      } else if (touchMics.has(e.pointerId)){
        const m = touchMics.get(e.pointerId);
        m.x = e.offsetX; m.y = e.offsetY; m.gain = micGain(e);
      } else {
        // 鼠标未按下也能悬停拾音（仅真正有鼠标的设备）
        if (e.pointerType === 'mouse' && !isCoarse){
          mouseMic.x = e.offsetX; mouseMic.y = e.offsetY; mouseMic.gain = mouseGain;
        }
      }
    });
    function endPointer(e){
      // 鼠标抬起不处理（单击无效果）；仅清理触摸/手写笔麦克风
      if (e.pointerType !== 'mouse') touchMics.delete(e.pointerId);
    }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('lostpointercapture', endPointer);
    canvas.addEventListener('pointerleave', e => {   // 指针离开画布：悬停拾音结束
      if (e.pointerType === 'mouse'){ mouseMic.x = -9999; mouseMic.y = -9999; }
      else touchMics.delete(e.pointerId);
    });   // iOS 系统手势可能丢捕获而不发 pointerup
    window.addEventListener('blur', () => {                      // 切走应用/锁屏时清空所有麦克风
      touchMics.clear();
      mouseMic.x = -9999; mouseMic.y = -9999;
    });

    // 鼠标滚轮调节增益（无 UI 控件，光标外圈/增益弧实时指示）
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const step = e.shiftKey ? 0.04 : 0.08;
      mouseGain += e.deltaY < 0 ? step : -step;
      mouseGain = Math.max(0.05, Math.min(1, mouseGain));
      mouseMic.gain = mouseGain;
    }, { passive: false });

    /* ---- buttons ---- */
    toggleBtn.addEventListener('click', () => { if (!running && !loading) start(); });
    stopBtn.addEventListener('click', stop);

    /* ---- tab hidden: 暂停（保持各轨相对同步） ---- */
    function onVis(){
      if (!running) return;
      if (document.hidden){ tracks.forEach(t => { try { t.el.pause(); } catch(e){} }); }
      else { tracks.forEach(t => { try { if (t.el.paused) t.el.play(); } catch(e){} }); }
    }
    document.addEventListener('visibilitychange', onVis);

    /* ============ render loop ============ */
    function frame(){
      const mics = activeMics();
      const R = Math.min(W, H) * 0.26;          // 基础拾音半径（随簇增大而增大）
      const now = audioCtx ? audioCtx.currentTime : 0;

      // 响度 + 距离混音
      for (let i = 0; i < TRACK_COUNT; i++){
        const t = tracks[i];
        let loud = 0;
        if (t && running){
          t.analyser.getByteTimeDomainData(t.wave);
          const d = t.wave;
          let sum = 0;
          for (let j = 0; j < d.length; j++){ const v = (d[j] - 128) / 128; sum += v * v; }
          loud = Math.min(1, Math.sqrt(sum / d.length) * 3.2);
          const a = loud > t.smoothed ? 0.4 : 0.85;   // 起音快、释音慢
          t.smoothed = t.smoothed * a + loud * (1 - a);
        } else if (t) {
          t.smoothed *= 0.9;
        }

        // 各麦克风贡献的饱和求和：1 - ∏(1 - g)
        const pos = positions[i];
        let oneMinus = 1;
        for (const m of mics){
          const dx = pos.x - m.x, dy = pos.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const Rm = R * (0.6 + 0.4 * m.gain);        // 增益轻微影响拾音半径
          let g = dist < Rm ? (1 - dist / Rm) : 0;
          g = g * g * (3 - 2 * g);                     // smoothstep
          g *= m.gain;
          oneMinus *= (1 - g);
        }
        const tg = 1 - oneMinus;
        if (t){ t.targetGain = tg; if (running && audioCtx) t.gain.gain.setTargetAtTime(tg, now, 0.03); }
      }

      /* ---- FX 参数由麦克风位置控制（黑箱）：离簇中心越近发送越多（背景越糊）---- */
      if (fxSend && running){
        const mc = mics[0];                       // 控制器：第一只活跃麦克风（桌面=鼠标）
        if (mc){
          let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
          for (const p of positions){ if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; }
          const cxx = (minX + maxX) / 2, cyy = (minY + maxY) / 2;
          const hw = Math.max(1, (maxX - minX) / 2), hh = Math.max(1, (maxY - minY) / 2);
          const r = Math.sqrt(Math.pow((mc.x - cxx) / hw, 2) + Math.pow((mc.y - cyy) / hh, 2));
          const ux = Math.max(0, Math.min(1, (mc.x - minX) / (maxX - minX || 1)));
          const uy = Math.max(0, Math.min(1, (mc.y - minY) / (maxY - minY || 1)));
          // 发送量：恒有下限 0.08（drone 不静默），簇中心满 0.5
          fxSend.gain.setTargetAtTime(0.08 + 0.42 * Math.pow(1 - Math.min(1, r), 1.5), now, 0.15);
          fxFb.gain.setTargetAtTime(0.12 + 0.12 * uy, now, 0.3);            // 反馈恒有 12%–24%
          fxDelay.delayTime.setTargetAtTime(0.28 + 0.34 * ux, now, 0.3);    // 延迟 0.28–0.62s
          fxEq.gain.setTargetAtTime((ux - 0.5) * 6, now, 0.3);              // EQ ±3dB @520Hz
          tremLfo.frequency.setTargetAtTime(0.6 + 2.4 * (1 - uy), now, 0.3);// 颤音速率 0.6–3Hz
          tremAmt.gain.setTargetAtTime(0.04 + 0.06 * (1 - ux), now, 0.3);   // 颤音深度 4%–10%
          fxDrivePre.gain.setTargetAtTime(1.15 + 0.45 * (1 - ux), now, 0.3);// drive 输入增益 1.15–1.6
          if (swellLfo){                                                      // 伪 reverse swell
            swellLfo.frequency.setTargetAtTime(0.18 + 0.45 * ux, now, 0.3);  // 速率 0.18–0.63Hz
            swellBaseSrc.offset.setTargetAtTime(0.5 + 0.3 * (1 - uy), now, 0.3);  // 谷底 0.5–0.8
            swellDepth.gain.setTargetAtTime(0.5 - 0.3 * (1 - uy), now, 0.3); // 深度 0.2–0.5（max-min）
          }
        } else {
          // 无麦克风：仍保持下限发送/反馈，drone 由反馈环与干声持续喂养
          fxSend.gain.setTargetAtTime(0.08, now, 0.3);
          fxFb.gain.setTargetAtTime(0.12, now, 0.3);
          if (swellLfo){ swellLfo.frequency.setTargetAtTime(0.3, now, 0.3); swellBaseSrc.offset.setTargetAtTime(0.6, now, 0.3); swellDepth.gain.setTargetAtTime(0.4, now, 0.3); }
        }
      }

      /* ---- -12dB 动态约束：drone(FX) 输出始终 ≤ 干声 - 12dB（幅度比 0.251） ---- */
      if (fxReturn && running){
        dryAn.getByteTimeDomainData(dryBuf);
        fxAn.getByteTimeDomainData(fxBuf);
        let ds = 0, fs = 0;
        for (let j = 0; j < 1024; j++){
          const dv = (dryBuf[j] - 128) / 128, fv = (fxBuf[j] - 128) / 128;
          ds += dv * dv; fs += fv * fv;
        }
        const dryRms = Math.sqrt(ds / 1024), fxRms = Math.sqrt(fs / 1024);
        if (fxRms > 0.002 && dryRms > 0.002){
          fxReturn.gain.setTargetAtTime(Math.max(0.05, Math.min(1, (0.251 * dryRms) / fxRms)), now, 0.06);
        } else if (fxRms > 0.002){
          fxReturn.gain.setTargetAtTime(0.05, now, 0.1);   // 干声静默时压到最低，保持约束
        }
      }

      draw(mics, R);
      loop();
    }

    /* 调度：播放中 60fps（RAF）；空闲（未开始/已停止）降到 ~10fps 静态预览，省电 */
    function loop(){
      if (running) raf = requestAnimationFrame(frame);
      else raf = setTimeout(loop, 100);
    }

    function draw(mics, R){
      ctx.clearRect(0, 0, W, H);

      // 极淡网格（面板/蓝图感）
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      const grid = 8;
      for (let i = 1; i < grid; i++){
        const x = W * i / grid;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        const y = H * i / grid;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // 拾音连线（点之下）——低端设备跳过以减负
      if (!LOW_END){
        ctx.lineWidth = 1;
        for (const m of mics){
          for (let i = 0; i < TRACK_COUNT; i++){
            const pos = positions[i];
            const dx = pos.x - m.x, dy = pos.y - m.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const Rm = R * (0.6 + 0.4 * m.gain);
            if (dist < Rm){
              const g = m.gain * (1 - dist / Rm);
              ctx.strokeStyle = 'rgba(0,0,0,' + (0.35 * g).toFixed(3) + ')';
              ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
            }
          }
        }
      }

      // 音轨点
      const baseR = Math.max(8, Math.min(W, H) * 0.020);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < TRACK_COUNT; i++){
        const pos = positions[i];
        const t = tracks[i];
        const loud = t ? t.smoothed : 0;
        const tg = t ? t.targetGain : 0;
        const r = baseR * (1 + loud * 1.8);

        // 可听光晕
        if (tg > 0.02){
          ctx.fillStyle = 'rgba(0,0,0,' + (0.12 * tg).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 8 + tg * 18, 0, Math.PI * 2); ctx.fill();
        }
        // 点
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2); ctx.fill();
        // 编号（PCB 丝印感）
        ctx.fillStyle = tg > 0.02 ? '#fff' : 'rgba(255,255,255,0.7)';
        ctx.font = Math.max(9, baseR * 0.7) + "px 'DejaVu Sans Mono',Menlo,Consolas,monospace";
        ctx.fillText(String(i + 1).padStart(2, '0'), pos.x, pos.y + 0.5);
      }

      // 麦克风光标（抽象：十字 + 外圈 + 增益弧）
      const micR = Math.max(7, Math.min(W, H) * 0.016);
      for (const m of mics){
        const ringR = micR + m.gain * Math.min(W, H) * 0.05;
        // 外圈虚线
        ctx.strokeStyle = 'rgba(0,0,0,' + (0.25 + 0.45 * m.gain).toFixed(3) + ')';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(m.x, m.y, ringR, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        // 增益弧（实线，从顶部顺时针，长度=增益）
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(m.x, m.y, ringR, -Math.PI / 2, -Math.PI / 2 + m.gain * Math.PI * 2);
        ctx.stroke();
        // 十字
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const k = micR * 0.9;
        ctx.beginPath();
        ctx.moveTo(m.x - k, m.y); ctx.lineTo(m.x + k, m.y);
        ctx.moveTo(m.x, m.y - k); ctx.lineTo(m.x, m.y + k);
        ctx.stroke();
        // 中心点
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(m.x, m.y, micR * 0.32, 0, Math.PI * 2); ctx.fill();
      }
    }

    /* ============ i18n refresh ============ */
    App.refreshRiverrunMixer = function(){
      if (loading) toggleBtn.textContent = App.I18n.t('mixerLoading');
      else if (!running) toggleBtn.textContent = App.I18n.t('mixerStart');
    };

    /* ============ boot ============ */
    shuffleSlots();            // 首次洗牌：预览即呈打乱排布
    resize();
    cancelAnimationFrame(raf);
    loop();
    state = { stop };
  };
})();
