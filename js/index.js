/* ===== INDEX PAGE ===== */
App.renderIndexNav();
App.I18n.init(App.INDEX_I18N, function onLangToggle() {
  App._updateToggleText();
});

/* easter egg */
document.getElementById('name-easter').addEventListener('click', () => alert('我爱你'));

/* ---- card stack interaction ---- */
(function(){
  const stack = document.getElementById('stack');
  let isAnimating = false;
  const ANIM_MS = 300;

  function reindex(){
    const children = [...stack.children];
    const len = children.length;
    const isMobile = window.innerWidth <= 768;
    const maxSpreadX = isMobile ? 70 : 110;
    const maxSpreadY = isMobile ? 12 : 20;
    const maxStepX = isMobile ? 14 : 22;
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
    bottom.style.zIndex     = '999';
    stack.append(bottom);
    const children = [...stack.children];
    void bottom.offsetHeight;
    children.forEach(c => c.style.transition = `transform ${ANIM_MS}ms ease-out`);
    reindex();
    setTimeout(() => {
      children.forEach(c => c.style.transition = 'none');
      isAnimating = false;
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

  /* ---- TOUCH ---- */
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartOnNav = null;

  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartOnNav = e.target.closest('.nav-top-left, .nav-bottom-left, .nav-top-right, .nav-bottom-right');
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!touchStartOnNav) e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', e => {
    if(isAnimating || touchStartOnNav) return;
    touchStartOnNav = null;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if(Math.abs(dx) < 50 && Math.abs(dy) < 50) return;

    if(Math.abs(dx) >= Math.abs(dy)){
      if(dx < 0) nextCard();
      else       prevCard();
    } else {
      if(dy < 0) nextCard();
      else       prevCard();
    }
  }, { passive: true });

  /* ---- CLICK ---- */
  stack.addEventListener('click', e => {
    const card = e.target.closest('.card');
    if(!card || isAnimating) return;
    if(card === stack.lastElementChild){
      window.location.href = card.dataset.href;
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
