/* ===== PREFETCH ON HOVER：站内链接悬停预取 =====
 * 当用户悬停/聚焦/触摸站内链接时，用 <link rel="prefetch"> 预取目标文档，
 * 使点击跳转近乎即时。只认同源的 `.html` 与目录式地址（works/<id>/、works/<id>/zh/）；
 * 省流量模式或慢速网络下自动禁用；去重。
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
    /* 目录式作品页也要预取：只认 .html 会把 works/<id>/ 与 works/<id>/zh/ 全漏掉，
       而作品页恰恰是最值得预热的一跳。 */
    if (!/\.html$/.test(a.pathname) && !/\/$/.test(a.pathname)) return null;
    if (a.href === location.href) return null;
    /* 直接用链接自己的 href，不再按当前语言重算一遍。
       旧实现取 a.pathname 再套 App.langHref，会丢掉查询串 —— 首页卡片那时是
       project-template.html?project=x，重建出来的是不带 project 的地址，预取的是
       另一个 URL（查询串**是**参与 HTTP 缓存键的，不是注释里原先写的那样）；
       目录式地址更重算不出来：中文版在 works/x/zh/ 这个路径里，追加 ?lang= 只会得到
       一个生成页并不理会的参数。链接在渲染时就已由 App.langHref() / App.projectHref()
       写好语言，照原样预取即用户真正会打开的那一版。 */
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
