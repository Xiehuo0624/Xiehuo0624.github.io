/* ===== INDEX PAGE ===== */
App.renderIndexNav();
App.I18n.init(App.INDEX_I18N);

/* easter egg */
document.getElementById('name-easter').addEventListener('click', () => alert('我爱你'));

/* ---- card stack interaction ---- */
(function(){
  const stack = document.getElementById('stack');
  let isAnimating = false;
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ANIM_MS = REDUCED_MOTION ? 0 : 300;   // 减少动态偏好下不保留动画计时
  let reindexPending = false;

  /* ---- shuffle card order on each page load ---- */
  (function shuffle(){
    const cards = [...stack.children];
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      stack.appendChild(cards[j]);            // 随机重排 DOM 顺序
      cards[j] = cards[i];                    // 交换引用，避免重复
    }
  })();

  function reindex(){
    const children = [...stack.children];
    const len = children.length;
    const isMobile = window.innerWidth <= 768;
    const maxSpreadX = isMobile ? 40 : 110;
    const maxSpreadY = isMobile ? 10 : 20;
    const maxStepX = isMobile ? 8 : 22;
    const maxStepY = isMobile ? 2 : 4;
    const stepX = len > 1 ? Math.min(maxStepX, maxSpreadX / (len - 1)) : maxStepX;
    const stepY = len > 1 ? Math.min(maxStepY, maxSpreadY / (len - 1)) : maxStepY;
    children.forEach((card, i) => {
      const fromTop = len - 1 - i;
      card.style.zIndex  = String(i + 1);
      card.style.transform = `translate(${fromTop * stepX}px, ${fromTop * stepY}px)`;
    });
  }

  reindex();

  /* 跨过 768px 断点或屏幕旋转后重算卡片间距；
     动画期间收到的事件会在动画收尾后补跑，避免最终布局停留在旧尺寸 */
  function requestReindex(){
    if (isAnimating) { reindexPending = true; return; }
    reindex();
  }
  window.addEventListener('resize', requestReindex);
  window.addEventListener('orientationchange', requestReindex);

  /* ---- next / prev ---- */
  function nextCard(){
    if(isAnimating) return;
    if(stack.children.length <= 1) return;
    isAnimating = true;

    const top = stack.lastElementChild;
    top.style.transition = `transform ${ANIM_MS}ms ease-out`;
    top.style.transform  = 'translateX(-100vw)';

    setTimeout(() => {
      top.style.transition = 'none';
      stack.prepend(top);
      const children = [...stack.children];
      children.forEach(c => c.style.transition = `transform ${ANIM_MS}ms ease-out`);
      reindex();
      setTimeout(() => {
        children.forEach(c => c.style.transition = 'none');
        isAnimating = false;
        if (reindexPending) { reindexPending = false; reindex(); }
      }, ANIM_MS);
    }, ANIM_MS);
  }

  function prevCard(){
    if(isAnimating) return;
    if(stack.children.length <= 1) return;
    isAnimating = true;

    const bottom = stack.firstElementChild;
    bottom.style.transition = 'none';
    bottom.style.transform  = 'translateX(-100vw)';
    stack.append(bottom);
    const children = [...stack.children];
    void bottom.offsetHeight;
    children.forEach(c => c.style.transition = `transform ${ANIM_MS}ms ease-out`);
    reindex();
    setTimeout(() => {
      children.forEach(c => c.style.transition = 'none');
      isAnimating = false;
      if (reindexPending) { reindexPending = false; reindex(); }
    }, ANIM_MS);
  }

  /* ---- WHEEL ---- */
  let lastScrollTime = 0;
  let previousDelta  = 0;
  const COOLDOWN_MS  = 400;

  document.addEventListener('wheel', e => {
    e.preventDefault();
    if(isAnimating) return;

    const currentDelta = Math.max(Math.abs(e.deltaX), Math.abs(e.deltaY));
    const now = Date.now();

    if(now - lastScrollTime < COOLDOWN_MS){
      previousDelta = currentDelta;
      return;
    }

    const isSpike = currentDelta > 40 && (
      (now - lastScrollTime) >= 1000 ||
      currentDelta >= previousDelta
    );

    if(isSpike){
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX)
        ? e.deltaY : e.deltaX;
      if(delta > 0) nextCard();
      else          prevCard();
      lastScrollTime = now;
    }

    previousDelta = currentDelta;
  }, { passive: false });

  /* ---- SWIPE：触摸与鼠标共用的翻牌判定 ---- */
  const SWIPE_PX = 50;          // 翻牌阈值：主导轴位移不足 50px 一律不翻（防误触）

  function swipeBy(dx, dy){
    if(Math.abs(dx) < SWIPE_PX && Math.abs(dy) < SWIPE_PX) return;

    if(Math.abs(dx) >= Math.abs(dy)){
      if(dx < 0) nextCard();
      else       prevCard();
    } else {
      if(dy < 0) nextCard();
      else       prevCard();
    }
  }

  /* ---- TOUCH ---- */
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', e => {
    if(isAnimating) return;
    swipeBy(e.changedTouches[0].clientX - touchStartX,
            e.changedTouches[0].clientY - touchStartY);
  }, { passive: true });

  /* ---- MOUSE DRAG（按住卡片拖动翻牌，与触摸同一套判定）----
     防误触三层：
     ① 只在卡片堆上起手，且只认左键 —— 页面别处的鼠标拖动是选字/拖链接，不该翻牌；
     ② 位移不足 ARM_PX 视为手抖，不进拖拽状态，click 照常派发（正常打开/翻页）；
     ③ 一旦进入拖拽状态，松手位移不足 SWIPE_PX 不翻牌，且紧随其后的一次 click
        一律丢弃 —— 否则「拖了一下但没到阈值」会顺手把顶层作品打开。 */
  const DRAG_ARM_PX = 8;
  let mouseDrag = null;         // {x, y, armed}：按下到松手之间的拖拽状态
  let suppressClick = false;    // 拖拽收尾的那次 click 不当作点击

  function endMouseDrag(){
    mouseDrag = null;
    stack.classList.remove('dragging');
  }

  stack.addEventListener('mousedown', e => {
    suppressClick = false;                    // 每次按下都重新计一次点击资格
    if(e.button !== 0 || isAnimating) return;
    mouseDrag = { x: e.clientX, y: e.clientY, armed: false };
  });

  document.addEventListener('mousemove', e => {
    if(!mouseDrag || mouseDrag.armed) return;
    if(Math.hypot(e.clientX - mouseDrag.x, e.clientY - mouseDrag.y) < DRAG_ARM_PX) return;
    mouseDrag.armed = true;
    stack.classList.add('dragging');          // 手势已识别：光标转抓取态（css/index.css）
  });

  document.addEventListener('mouseup', e => {
    if(!mouseDrag) return;
    const dx = e.clientX - mouseDrag.x;
    const dy = e.clientY - mouseDrag.y;
    const armed = mouseDrag.armed;
    endMouseDrag();
    if(!armed) return;                        // 没进拖拽 → click 走正常逻辑
    suppressClick = true;
    swipeBy(dx, dy);
  });

  /* 鼠标在窗口外松开时收不到 mouseup，兜底复位，避免光标卡在 grabbing */
  window.addEventListener('blur', endMouseDrag);

  /* ---- CLICK ---- */
  stack.addEventListener('click', e => {
    if(suppressClick){ suppressClick = false; return; }   // 拖拽收尾的 click 丢弃
    const card = e.target.closest('.card');
    if(!card || isAnimating) return;
    if(card === stack.lastElementChild){
      window.location.href = App.langHref(card.dataset.href);
    } else {
      nextCard();
    }
  });

  /* ---- KEYBOARD ---- */
  document.addEventListener('keydown', e => {
    if(e.key === 'ArrowRight') nextCard();
    if(e.key === 'ArrowLeft')  prevCard();
  });
})();
