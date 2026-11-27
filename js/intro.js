/* ===== 首访幕布（逻辑） =====
   只在 <head> 里那段同步脚本给 <html> 加上 data-intro 时才启动：
   没有 data-intro 说明这台浏览器已经看过（localStorage 有 intro-v1），或者没有 JS。

   背景墙的图源＝App.projects（js/project-data.js）里每件作品的全部图片，
   缩略图在 img/collage/。以后加作品＝加进 project-data + 跑一次
   scripts/gen-collage.py，这里不用改，也不维护第二份清单。

   抽图：整池洗牌、不放回。早先试过「按作品轮流抽」，结果图少的作品
   （riverrun 1 张、Spectral 1 张、Induction Mixer 2 张）每屏必然全部出现，
   看起来就像没洗过。 */
(function () {
  var el = document.getElementById('intro');
  if (!el || !document.documentElement.dataset.intro) return;

  /* 与 scripts/gen-collage.py 的 EXCLUDE 必须一致：棚拍产品图、平板光产品照、
     插件界面工程截图，在照片墙里读作"空格"或"软件截图"。 */
  var EXCLUDE = /^img\/(6u104hp(-\d+)?|the-induction-mixer-2|spectral-dissector(-\d+)?)\.webp$/;

  function thumbOf(src) { return 'img/collage/' + src.split('/').pop(); }

  function srcsOf(p) {
    var m = (p && p.media) || {}, out = [];
    if (m.src) out.push(m.src);
    if (m.poster) out.push(m.poster);        /* riverrun 的海报在 video/ 下 */
    if (m.images) out = out.concat(m.images);
    if (m.photos) out = out.concat(m.photos);
    (m.sections || []).forEach(function (s) {
      if (s.images) out = out.concat(s.images);
      (s.groups || []).forEach(function (g) { if (g.images) out = out.concat(g.images); });
    });
    /* 只收 webp：media.src 有时指向视频（riverrun.mp4），留着会变成永远加载不出的空格 */
    return out.filter(function (s) { return /\.webp$/.test(s) && !EXCLUDE.test(s); });
  }

  function shuffle(a) {
    for (var k = a.length - 1; k > 0; k--) {
      var j = Math.floor(Math.random() * (k + 1)), t = a[k]; a[k] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildWall() {
    var wall = el.querySelector('.intro-wall');
    if (!wall) return;
    var narrow = window.innerWidth <= 640;
    var cols = narrow ? 3 : 6, rows = narrow ? 7 : 4;
    wall.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    wall.style.gridTemplateRows = 'repeat(' + rows + ',1fr)';

    var pool = [], seen = {};
    var projects = (window.App && App.projects) || null;
    if (projects) {
      (App.projectOrder || Object.keys(projects)).forEach(function (id) {
        srcsOf(projects[id]).forEach(function (s) {
          if (!seen[s]) { seen[s] = 1; pool.push(s); }
        });
      });
    }
    /* 兜底：project-data 没加载上，就用页面已有的卡片封面 */
    if (!pool.length) {
      pool = [].map.call(document.querySelectorAll('.card-image'), function (im) {
        return im.getAttribute('src');
      }).filter(Boolean);
    }
    if (!pool.length) return;

    shuffle(pool);
    var total = cols * rows;
    while (pool.length && wall.childElementCount < total) {
      var s = pool.pop();
      var cell = document.createElement('div');
      var img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      (function (full) {
        /* 缩略图没生成（新作品还没跑脚本）时退回原图，不至于空一格 */
        img.onerror = function () { this.onerror = null; this.src = full; };
      })(s);
      img.src = thumbOf(s);
      cell.appendChild(img);
      wall.appendChild(cell);
    }
  }

  /* project-data.js 与 intro.js 都是 defer，DOMContentLoaded 时已按序执行完 */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildWall);
  else buildWall();

  el.focus();

  var closing = false;
  function close() {
    if (closing) return;
    closing = true;
    el.classList.add('is-closing');
    try { localStorage.setItem('intro-v1', '1'); } catch (e) {}
    setTimeout(function () {
      el.remove();
      document.documentElement.removeAttribute('data-intro');
    }, 140);
  }
  el.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
