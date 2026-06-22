/* ===== INDEX PAGE ===== */
App.renderIndexNav();
App.I18n.init(App.INDEX_I18N);

/* easter egg */
document.getElementById('name-easter').addEventListener('click', () => alert('我爱你'));

/* ---- card stack interaction ---- */
(function(){
  const stack = document.getElementById('stack');
  let isAnimating = false;
  const ANIM_MS = 300;

  function getOffset(){
    return window.innerWidth <= 768 ? 5 : 9;
  }

  function reindex(){
    const children = [...stack.children];
    const len = children.length;
    const step = getOffset();
    children.forEach((card, i) => {
      const fromTop = len - 1 - i;
      card.style.zIndex  = String(i + 1);
      card.style.transform = `translate(${fromTop * step}px, ${fromTop * step}px)`;
    });
  }

  reindex();

  /* ---- next / prev ---- */
  function nextCard(){
    if(isAnimating) return;
    if(stack.children.length <= 1) return;
    isAnimating = true;

    const top = stack.lastElementChild;
    top.style.transition = `transform ${ANIM_MS}ms steps(6)`;
    top.style.transform  = 'translateX(-100vw)';

    setTimeout(() => {
      top.style.transition = 'none';
      stack.prepend(top);
      reindex();
      void top.offsetHeight;
      isAnimating = false;
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
    void bottom.offsetHeight;
    bottom.style.transition = `transform ${ANIM_MS}ms steps(6)`;
    bottom.style.transform  = 'translate(0px, 0px)';

    setTimeout(() => {
      bottom.style.transition = 'none';
      reindex();
      void bottom.offsetHeight;
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

  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', e => {
    if(isAnimating) return;
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
