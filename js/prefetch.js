/* ===== PREFETCH ON HOVER：站内链接悬停预取 =====
 * 当用户悬停/聚焦/触摸站内 .html 链接时，用 <link rel="prefetch"> 预取目标文档，
 * 使点击跳转近乎即时。仅对同源 .html 生效；省流量模式或慢速网络下自动禁用；去重。
 * 策略保守：只预取目标 HTML 文档本身（不递归其子资源），成本极低。
 */
(function(){
  var conn = navigator.connection;
  if (conn && (conn.saveData ||
      conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) return;

  var prefetched = new Set();
  var queue = [];
  var scheduled = false;

  function run(){
    scheduled = false;
    while (queue.length){
      var href = queue.shift();
      if (prefetched.has(href)) continue;
      prefetched.add(href);
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = 'document';
      document.head.appendChild(link);
    }
  }

  function schedule(href){
    queue.push(href);
    if (scheduled) return;
    scheduled = true;
    if ('requestIdleCallback' in window){
      requestIdleCallback(run, { timeout: 1500 });
    } else {
      setTimeout(run, 200);
    }
  }

  function qualify(a){
    if (a.target && a.target !== '_self') return null;
    if (a.origin !== location.origin) return null;
    if (!/\.html$/.test(a.pathname)) return null;
    if (a.href === location.href) return null;
    return a.href;
  }

  function onIntent(e){
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = qualify(a);
    if (href) schedule(href);
  }

  document.addEventListener('pointerover', onIntent, { passive: true, capture: true });
  document.addEventListener('focusin', onIntent, { capture: true });
  document.addEventListener('touchstart', onIntent, { passive: true, capture: true });
})();
