#!/usr/bin/env node
/* 作品页改造的实测验证：headless Chrome + CDP。
 * 覆盖：16 个生成页的结构/元信息/媒体/正文、旧地址、语言切换（作品页原地换语言、
 *       站内页仍跳转）、深色模式计算值、首页卡片与作品列表链接、404 页、Gallery Lightbox、字体 URL 一致性、
 *       Esc 返回（子页面 → 首页、首页不响应、Lightbox 优先、旧地址与 404 的落点）、
 *       wwhbh 墨层锚定、移动端正文行高（390×844 下 28px／桌面 33.6px），
 *       以及控制台报错与 4xx 请求。
 * 用法：先起本地服务（python3 -m http.server 8765），再 node scripts/verify/verify.mjs
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');                                  // 仓库根：字体一致性一节要直接读源文件
const ROOT_TMP = join(HERE, '..', '..', 'tmp', 'verify-artifacts');   // 运行产物（profile／假 HOME）落在 gitignore 的 tmp/ 下
mkdirSync(ROOT_TMP, { recursive: true });
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const PORT = 9333;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = join(ROOT_TMP, 'shots');
mkdirSync(SHOTS, { recursive: true });

/* ---------- CDP 极简客户端 ---------- */
class CDP {
  constructor(ws) {
    this.ws = ws; this.seq = 0; this.pending = new Map(); this.listeners = [];
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else {
        for (const fn of this.listeners) fn(msg);
      }
    };
  }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws error')); });
    return new CDP(ws);
  }
  /* 每条 CDP 调用都带超时。没有它时 Chrome 一旦不回话，整遍就**无声挂死**：
     2026-10-03 实测两次 —— 最后一份产物停在 13:30，进程活到 19:50，六个多小时零输出。
     coverage.mjs 早先踩过同一个坑并加了 15s 超时，这里补上同一套：
     超时即 reject、用例记失败，至少能看见是哪一条卡住，而不是整轮没有结论。 */
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    const TIMEOUT_MS = 20000;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`CDP ${method} 超过 ${TIMEOUT_MS}ms 无响应`));
      }, TIMEOUT_MS);
      this.pending.set(id, {
        resolve: v => { clearTimeout(timer); resolve(v); },
        reject:  e => { clearTimeout(timer); reject(e); }
      });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
}

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  /* Chrome 自己的进程沙箱在本机的外层沙箱里初始化失败（日志：Failed to initialize sandbox），
     渲染进程随即崩溃、浏览器整体挂掉。关掉 Chrome 自身的沙箱即可；此时外层沙箱仍然把
     整棵进程树锁在工作区内，所以并不比放宽容忍度更大。 */
  '--no-sandbox', '--disable-breakpad',
  /* 不碰真实钥匙串：否则 Chrome 会去读写 macOS 的「Chrome Safe Storage」条目，
     每启动一次就在屏幕上弹一次系统授权框（约束见 AGENTS.md §3）。 */
  '--use-mock-keychain', '--password-store=basic',
  /* 媒体权限同样不问系统：wwhbh 页加载即调 getUserMedia（js/audio-wwhbh.js），
     遍历全站会在屏幕上弹一次 macOS 麦克风授权框。--deny-permission-prompts 让
     Chrome 直接拒绝，页面落进它自己的「麦克风权限被拒绝」分支（探针对此无断言）。 */
  '--deny-permission-prompts',
  `--user-data-dir=${join(ROOT_TMP, 'profile')}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--hide-scrollbars', '--window-size=1280,900', 'about:blank'
], {
  stdio: 'ignore', detached: false,
  /* HOME 指进工作区：Chrome 的崩溃簿记（~/Library/Application Support/Google/Chrome/
     Crashpad）会解析到这个假 HOME 下，整条命令不再需要往工作区外写任何东西 ——
     实测不隔离时 Chrome 会因为那一步被拒而直接 SIGTRAP 崩溃。 */
  env: { ...process.env, HOME: join(ROOT_TMP, 'home') }
});

let version = null;
for (let i = 0; i < 80 && !version; i++) {
  try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); }
  catch { await sleep(250); }
}
if (!version) { console.error('Chrome 起不来'); process.exit(2); }

const browser = await CDP.connect(version.webSocketDebuggerUrl);

/* ---------- 访问一个页面并收集证据 ---------- */
async function visit(path, { waitMs = 700, clickSelector = null, afterClickMs = 900, noJs = false, scheme = null, motion = null, viewport = null } = {}) {
  /* 一个用例一个浏览器上下文：localStorage 天然是干净的，否则「本页有没有写 localStorage」
     会被上一页残留的偏好污染（同一 profile 共用存储）。 */
  const { browserContextId } = await browser.send('Target.createBrowserContext');
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const net = { failed: [], bad: [], dataFragments: [], all: [] };
  const consoleErrors = [];
  const exceptions = [];

  browser.listeners.push(msg => {
    if (msg.sessionId !== sessionId) return;
    const { method, params } = msg;
    if (method === 'Network.responseReceived') {
      const url = params.response.url;
      net.all.push(`${params.response.status} ${url}`);
      if (params.response.status >= 400) net.bad.push(`${params.response.status} ${url}`);
      if (/\/data\/[^/]+\/(en|zh)\.html$/.test(url)) net.dataFragments.push(url);
    } else if (method === 'Network.loadingFailed') {
      net.failed.push(`${params.errorText} ${params.type}`);
    } else if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
      consoleErrors.push(params.args.map(a => a.value ?? a.description).join(' '));
    } else if (method === 'Runtime.exceptionThrown') {
      exceptions.push(params.exceptionDetails.text + ' ' + (params.exceptionDetails.exception?.description || ''));
    }
  });

  if (noJs) await browser.send('Emulation.setScriptExecutionDisabled', { value: true }, sessionId);
  /* 手机视口（第十六节用）：整份探针此前只跑 --window-size=1280,900，
     从来命中不了 @media(max-width:768px) —— 而移动端正文行高那四条覆盖正写在里面。
     一个用例一个浏览器上下文，关掉时整个上下文一起销毁，不需要复位。 */
  if (viewport) {
    await browser.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width, height: viewport.height, deviceScaleFactor: 2, mobile: true
    }, sessionId);
  }
  /* 模拟深色：走 CDP 的 Emulation.setEmulatedMedia，**不是** --force-dark-mode。
     后者是 Chrome 自身的自动暗化，会把结论污染成「看起来变了」——
     那种「变了」在关掉变量化之后照样成立，验不出任何东西。 */
  /* scheme 一律**显式**给：'dark' 或 'light'。不能靠「不设就是浅色」——
     实测这条覆盖会漏到后续新建的目标上，浅色那几轮于是拿到深色值（首版踩到）。 */
  if (scheme || motion) {
    /* 两条覆盖一起给：CDP 的 features 是**整份替换**，只给 motion 会把配色覆盖清掉。 */
    const features = [];
    if (scheme) features.push({ name: 'prefers-color-scheme', value: scheme });
    /* headless Chrome 默认 prefers-reduced-motion:reduce，那一档下墨层按设计根本不启动
       （js/ink-wwhbh.js 的 resume() 直接 return 并调 blank()），量到的会是一张空画布。 */
    if (motion) features.push({ name: 'prefers-reduced-motion', value: motion });
    await browser.send('Emulation.setEmulatedMedia', { features }, sessionId);
  }
  await browser.send('Page.enable', {}, sessionId);
  await browser.send('Runtime.enable', {}, sessionId);
  await browser.send('Network.enable', {}, sessionId);
  await browser.send('Log.enable', {}, sessionId);

  const loaded = new Promise(res => {
    const fn = msg => { if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired') res(); };
    browser.listeners.push(fn);
  });
  await browser.send('Page.navigate', { url: BASE + path }, sessionId);
  await Promise.race([loaded, sleep(8000)]);
  await sleep(waitMs);

  let clickError = null;
  if (clickSelector) {
    try {
      await evaluate(sessionId, `document.querySelector(${JSON.stringify(clickSelector)}).click()`);
      await sleep(afterClickMs);
    } catch (e) { clickError = e.message; }
  }

  const evaluate_ = async expr => evaluate(sessionId, expr);

  return {
    sessionId, path, net, consoleErrors, exceptions, clickError, evaluate: evaluate_,
    /* 原始 CDP：悬停（:hover 才成立的展签）、置顶用的真实点击这类交互，程序化 .click()
       与 evaluate 里改样式都验不到，必须派发真实鼠标事件。第十七节起开始用 Input 域。 */
    raw: (method, params) => browser.send(method, params, sessionId),
    async hoverAt(x, y, waitMs = 400) {
      await browser.send('Input.dispatchMouseEvent',
        { type: 'mouseMoved', x, y, button: 'none' }, sessionId);
      await sleep(waitMs);
    },
    async clickAt(x, y) {
      await browser.send('Input.dispatchMouseEvent',
        { type: 'mouseMoved', x, y, button: 'none' }, sessionId);
      await sleep(80);
      await browser.send('Input.dispatchMouseEvent',
        { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 }, sessionId);
      await browser.send('Input.dispatchMouseEvent',
        { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 1 }, sessionId);
    },
    async shot(name) {
      const { data } = await browser.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      writeFileSync(join(SHOTS, name + '.png'), Buffer.from(data, 'base64'));
    },
    async close() { await browser.send('Target.disposeBrowserContext', { browserContextId }).catch(() => {}); }
  };
}

async function evaluate(sessionId, expr) {
  const r = await browser.send('Runtime.evaluate', {
    expression: `(function(){ try { return JSON.stringify(${expr}); } catch(e){ return JSON.stringify({__error: e.message}); } })()`,
    returnByValue: true, awaitPromise: false
  }, sessionId);
  const raw = r.result?.value;
  const val = raw === undefined ? undefined : JSON.parse(raw);
  if (val && val.__error) throw new Error(val.__error);
  return val;
}

/* ---------- 断言 ---------- */
let pass = 0, fail = 0;
const failures = [];
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else { fail++; failures.push(`${name}\n      实际 ${JSON.stringify(got)}\n      期望 ${JSON.stringify(want)}`); }
}
function checkTrue(name, got) { check(name, !!got, true); }

/* ---------- 期望表（与 js/project-data.js 同源，人工核对一遍） ---------- */
const P = [
  { id: '6u104hp',            layout: 'gallery', zh: '6U104HP',            en: '6U104HP',            media: 'gallery', n: 21 },
  /* 2026-10-09：just-type 补了 2026.10.04 Cedar Land 的海报与两张现场照（走 ecce 的现场网格），
     故从 img+audio 改为 img+audio+live，n = 3（断言里 imgs 为 n + 1，另加顶部那张 still）。 */
  { id: 'the-just-type-study', layout: 'ecce',    zh: 'The JustType Study', en: 'The JustType Study', media: 'img+audio+live', n: 3 },
  { id: 'the-induction-mixer', layout: 'gallery', zh: 'THE INDUCTION MIXER', en: 'THE INDUCTION MIXER', media: 'gallery', n: 3 },
  { id: 'riverrun',           layout: 'mixer',   zh: 'riverrun',           en: 'riverrun',           media: 'none', n: 0 },
  { id: 'edgedgedge',         layout: 'edge',    zh: 'EDGEDGEDGE',         en: 'EDGEDGEDGE',         media: 'iframe+live', n: 6 },
  { id: 'spectral-dissector', layout: 'ecce',    zh: 'SPECTRAL DISSECTOR', en: 'SPECTRAL DISSECTOR', media: 'img', n: 1 },
  { id: 'ecce-homo',          layout: 'ecce',    zh: '瞧！这个人',          en: 'ECCE HOMO',          media: 'img+audio+live', n: 8 },
  { id: 'wwhbh',              layout: 'wwhbh',   zh: '我们将会曾经在这里',   en: 'WE WILL HAVE BEEN HERE', media: 'live', n: 6 }
];

console.log('=== 一、16 个生成页 ===');
for (const p of P) {
  for (const lang of ['en', 'zh']) {
    const dir = lang === 'zh' ? 'zh/' : '';
    const path = `/works/${p.id}/${dir}`;
    const v = await visit(path);
    const tag = `${path}`;

    const info = await v.evaluate(`({
      panels: document.querySelectorAll('[id^="layout-"]').length,
      layout: document.documentElement.dataset.layout,
      project: document.documentElement.dataset.project,
      lang: document.documentElement.dataset.lang,
      fixed: document.documentElement.hasAttribute('data-lang-fixed'),
      title: document.title,
      h2: document.querySelector('h2').textContent,
      canonical: document.querySelector('link[rel=canonical]').href,
      ogImage: document.querySelector('meta[property="og:image"]').content,
      ogTitle: document.querySelector('meta[property="og:title"]').content,
      descLen: document.querySelector('meta[name=description]').content.length,
      robotsMeta: document.querySelectorAll('meta[name=robots]').length,
      search: location.search,
      lsLang: localStorage.getItem('lang'),
      descText: (document.querySelector('[data-desc-lang]')||{}).textContent?.length || 0,
      descLang: (document.querySelector('[data-desc-lang]')||{}).dataset?.descLang,
      panelVisible: getComputedStyle(document.querySelector('[id^="layout-"]')).display,
      imgs: document.querySelectorAll('[id$="-media"] img, .gallery-grid img').length,
      iframes: document.querySelectorAll('[id$="-media"] iframe').length,
      audios: document.querySelectorAll('.work-audio, .ecce-audio').length,
      related: [...document.querySelectorAll('.project-related a')].map(a=>a.getAttribute('href')),
      srcdocTitle: document.querySelector('title').textContent
    })`);

    check(`${tag} 只有一个布局面板`, info.panels, 1);
    check(`${tag} data-layout`, info.layout, p.layout);
    check(`${tag} data-project`, info.project, p.id);
    check(`${tag} data-lang`, info.lang, lang);
    check(`${tag} data-lang-fixed`, info.fixed, true);
    check(`${tag} 标签页标题`, info.title, p[lang]);
    checkTrue(`${tag} h2 以作品名开头`, info.h2.startsWith(p[lang]));
    check(`${tag} canonical`, info.canonical, `https://caohaoxuan.com/works/${p.id}/${dir}`);
    check(`${tag} og:image`, info.ogImage, `https://caohaoxuan.com/img/${p.id}.webp`);
    check(`${tag} og:title`, info.ogTitle, p[lang]);
    checkTrue(`${tag} description 非空`, info.descLen > 15);
    check(`${tag} 生成页没有 noindex`, info.robotsMeta, 0);
    check(`${tag} 地址栏没有被塞 ?lang=`, info.search, '');
    check(`${tag} 固定语言页不写 localStorage`, info.lsLang, null);
    check(`${tag} 正文语言标记`, info.descLang, lang);
    checkTrue(`${tag} 正文已烤进 HTML（>200 字符）`, info.descText > 200);
    checkTrue(`${tag} 面板可见`, info.panelVisible !== 'none');
    checkTrue(`${tag} 无控制台报错`, v.consoleErrors.length === 0 && v.exceptions.length === 0);
    checkTrue(`${tag} 无 4xx/失败请求`, v.net.bad.length === 0 && v.net.failed.length === 0);
    check(`${tag} 不再重复 fetch 正文片段`, v.net.dataFragments.length, 0);

    if (p.media === 'gallery') check(`${tag} 画廊图数量`, info.imgs, p.n);
    if (p.media === 'img') check(`${tag} 主图数量`, info.imgs, 1);
    if (p.media === 'img+audio') check(`${tag} 主图 + 音频`, [info.imgs, info.audios], [1, 1]);
    /* ecce 布局：顶部剧照 + 音频 + 正文之后的现场剧照网格。p.n 是网格张数，
       imgs 还要加上顶部那一张剧照，故为 p.n + 1。 */
    if (p.media === 'img+audio+live') check(`${tag} 顶部剧照 + 音频 + 剧照网格`,
      [info.imgs, info.audios], [p.n + 1, 1]);
    if (p.media === 'iframe') check(`${tag} 视频 iframe 数量`, info.iframes, 1);
    /* edge 布局的「现场资料」：视频 iframe + 现场录音 + 照片网格。
       网格走 .gallery-grid（与画廊页同一套渲染），故计入 imgs。 */
    if (p.media === 'iframe+live') check(`${tag} 视频 + 现场录音 + 现场照`,
      [info.iframes, info.audios, info.imgs], [1, 1, p.n]);
    /* wwhbh 的「现场资料」：只有外录音频 + 照片网格，视频位待作者给 YouTube 链接。 */
    if (p.media === 'live') check(`${tag} 现场录音 + 现场照`,
      [info.audios, info.imgs, info.iframes], [1, p.n, 0]);
    if (p.media === 'none') check(`${tag} 无静态媒体`, [info.imgs, info.iframes, info.audios], [0, 0, 0]);

    if (p.id === 'riverrun') check(`${tag} 相关作品链接`, info.related, [`works/the-induction-mixer/${dir}`]);
    if (p.id === 'the-induction-mixer') check(`${tag} 相关作品链接`, info.related, [`works/riverrun/${dir}`]);

    if ((p.id === 'spectral-dissector' && lang === 'zh') || (p.id === 'wwhbh' && lang === 'en')) {
      await v.shot(`page-${p.id}-${lang}`);
    }
    if (v.consoleErrors.length) failures.push(`${tag} 控制台报错：${JSON.stringify(v.consoleErrors)}`);
    if (v.exceptions.length) failures.push(`${tag} 异常：${JSON.stringify(v.exceptions)}`);
    if (v.net.bad.length) failures.push(`${tag} 4xx：${JSON.stringify(v.net.bad)}`);
    if (v.net.failed.length) failures.push(`${tag} 请求失败：${JSON.stringify(v.net.failed)}`);

    await v.close();
  }
}

console.log('=== 二、语言切换：作品页原地换语言，站内页仍跳到另一语言目录 ===');
{
  /* 作品页（带 data-lang-fixed，且 js/project.js 声明了 { inPlace: true }）：
     **原地换语言，不换文档**。为什么不换文档是硬要求：wwhbh 的 AudioContext、
     MediaStream、90 秒 DelayNode 的缓冲区、以及墨层的累积数组全在那个文档里，
     换一次就全没了（2026-10-02 实测：切换引发 1 次文档导航、墨层像素 4 → 0）。
     判据用 window 上的标记 —— 换了文档它就没了；只断言 location 会被
     replaceState 蒙过去（地址确实变了，但那不是跳转）。 */
  for (const [from, to, lang] of [
    ['/works/spectral-dissector/zh/', '/works/spectral-dissector/',    'en'],
    ['/works/spectral-dissector/',    '/works/spectral-dissector/zh/', 'zh']
  ]) {
    const v = await visit(from, { waitMs: 1200 });
    await v.evaluate(`(window.__langMark = 'alive', 1)`);
    await v.evaluate(`(document.querySelector('#lang-toggle').click(), 1)`);
    await sleep(1600);
    const r = await v.evaluate(`({
      path: location.pathname,
      lang: document.documentElement.dataset.lang,
      mark: window.__langMark || null,
      back: (document.querySelector('.back a[data-i18n="back"]') || {}).getAttribute
              ? document.querySelector('.back a[data-i18n="back"]').getAttribute('href') : null,
      canonical: (document.querySelector('link[rel=canonical]') || {}).getAttribute
              ? document.querySelector('link[rel=canonical]').getAttribute('href') : null
    })`);
    check(`${from} 点切换 → ${to}`, r.path, to);
    check(`${from} 落地语言为 ${lang}`, r.lang, lang);
    check(`${from} 原地换语言、没换文档（作品不被打断）`, r.mark, 'alive');
    check(`${from} 返回按钮跟着换语言目录`, r.back, lang === 'zh' ? './zh/' : './');
    checkTrue(`${from} canonical 跟着换语言目录`,
      r.canonical && r.canonical.endsWith(`/works/spectral-dissector/${lang === 'zh' ? 'zh/' : ''}`));
    await v.close();
  }

  /* 往返一次后正文必须与最初**逐字相同**。原地换语言会把正文换成另一门语言，
     而 data-desc-lang 是「这份正文是哪门语言」的标记 —— 它不跟着走的话，切回来时
     js/project.js 里「烤好的就是这一门」那条捷径会误判成立、直接 return，
     把上一门语言的正文当成这一门用。这条回归路径只有原地切换才会走到。
     **两个起始语言都测**：英文起始是「烤英文 → fetch 中文 → 再 fetch 英文」，
     中文起始是「烤中文 → fetch 英文 → 再 fetch 中文」，走的是同一段代码的两个入口。 */
  for (const [start, mid, back] of [
    ['/works/wwhbh/',    'zh', 'en'],
    ['/works/wwhbh/zh/', 'en', 'zh']
  ]) {
    const rt = await visit(start, { waitMs: 1600 });
    const READ = `((document.querySelector('#wwhbh-desc') || {}).textContent || '')`;
    const first = await rt.evaluate(READ);
    /* 换语言时正文容器**不许被清空**。清了它就从 6239px 塌到 34px，排在它后面的
       现场资料块（录音 + 照片网格）当场窜到内容最上面、fetch 回来再弹回去 ——
       作者 2026-10-02 报的「下面的图片闪到上面一瞬间」。
       观测方式：挂在容器上的 MutationObserver 记录正文长度的最小值。
       **必须看 DOM 而不是看画面** —— 本机 fetch 只要 1–5ms，塌陷态通常不足一帧，
       截图与逐帧采样都抓不到它（实测：不压网时探针测不出，压到 150ms RTT 才现形，
       那一刻容器高度是 34px、现场资料块从 6528px 窜到 326px）。 */
    await rt.evaluate(`(function(){
      var el = document.querySelector('#wwhbh-desc');
      window.__minLen = (el.textContent || '').length;
      new MutationObserver(function(){
        var n = (el.textContent || '').length;
        if (n < window.__minLen) window.__minLen = n;
      }).observe(el, { childList: true, subtree: true, characterData: true });
      return 1; })()`);
    await rt.evaluate(`(document.querySelector('#lang-toggle').click(), 1)`);
    await sleep(1800);
    const midText = await rt.evaluate(READ);
    const midMark = await rt.evaluate(`document.querySelector('#wwhbh-desc').dataset.descLang`);
    const minLen = await rt.evaluate('window.__minLen');
    await rt.evaluate(`(document.querySelector('#lang-toggle').click(), 1)`);
    await sleep(1800);
    const finalText = await rt.evaluate(READ);
    checkTrue(`${start} 切到 ${mid} 后正文确实换了（${first.length} 字 → ${midText.length} 字）`,
      midText.length > 100 && midText !== first);
    check(`${start} 正文标记 data-desc-lang 跟着语言走`, midMark, mid);
    checkTrue(`${start} 换语言过程中正文容器没被清空（最短 ${minLen} 字，两门语言各 ${first.length}／${midText.length} 字）`,
      minLen >= Math.min(first.length, midText.length) * 0.5);
    checkTrue(`${start} 往返后正文与最初逐字相同（${first.length} 字）`, finalText === first);
    await rt.close();
  }

  /* ---- 滚动锚点：换语言后，读者在正文里的**比例**必须不变（作者 2026-10-03 定「按比例」）----
     中文译文比英文短约三成，而滚动位置记的是「从文档顶部往下多少像素」——不补的话读者
     盯着的那一段会整体挪走。实测 /works/wwhbh/：停在照片那一屏切语言，文档从 8277px 缩到
     6248px，浏览器自己的滚动锚定只补回 880px，剩下 1149px 让照片直接从眼前跑掉。
     断言的是不变量本身（比例前后一致），不是某个具体像素数 —— 后者会随文案长度变动而失效。 */
  {
    const v = await visit('/works/wwhbh/', { waitMs: 1600, scheme: 'light' });
    const READ = `(function(){
      const d = document.querySelector('#wwhbh-desc');
      const r = d.getBoundingClientRect();
      const top = r.top + window.scrollY;
      return { frac: (window.scrollY - top) / Math.max(1, r.height),
               h: Math.round(r.height), live: Math.round(document.querySelector('#wwhbh-live').getBoundingClientRect().top) };
    })()`;
    const settle = async lang => {
      for (let i = 0; i < 40; i++) {
        await sleep(150);
        if (await v.evaluate(`document.querySelector('#wwhbh-desc').dataset.descLang`) === lang) break;
      }
      await sleep(700);   // 留给锚点自己那两次补正（rAF + 200ms）
    };
    for (const [name, setup] of [
      ['正文中段', `(function(){ const d=document.querySelector('#wwhbh-desc'); const r=d.getBoundingClientRect();
                    window.scrollTo(0, Math.round(r.top + window.scrollY + r.height * 0.45)); return 1; })()`],
      ['照片处',   `(function(){ const e=document.querySelector('#wwhbh-live');
                    window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 300); return 1; })()`]
    ]) {
      await v.evaluate(setup);
      await sleep(400);
      const a = await v.evaluate(READ);
      await v.evaluate(`(document.querySelector('#lang-toggle').click(), 1)`);
      await settle('zh');
      const b = await v.evaluate(READ);
      checkTrue(`换语言后「${name}」处读者在正文里的比例不变（${(a.frac * 100).toFixed(1)}% → ${(b.frac * 100).toFixed(1)}%，正文 ${a.h} → ${b.h}px）`,
        Math.abs(b.frac - a.frac) < 0.05);
      await v.evaluate(`(document.querySelector('#lang-toggle').click(), 1)`);
      await settle('en');
    }
    await v.close();
  }

  /* 对照组：**没有**声明 inPlace 的目录式页面必须仍然跳转 ——
     语言按钮在作品页以外的所有页面上行为一字未变。判据同上：标记没了就是换了文档。 */
  for (const path of ['/works/', '/about/']) {
    const v = await visit(path, { waitMs: 1100 });
    await v.evaluate(`(window.__langMark = 'alive', 1)`);
    await v.evaluate(`(document.querySelector('#lang-toggle').click(), 1)`);
    await sleep(1600);
    const r = await v.evaluate(`({ path: location.pathname, mark: window.__langMark || null })`);
    checkTrue(`${path} 仍跳到另一语言目录（${r.path}）`, r.path.endsWith('/zh/'));
    check(`${path} 确实换了文档（对照：跳转式行为一字未变）`, r.mark, null);
    await v.close();
  }
}

console.log('=== 三、旧地址仍然可用 + 声明 canonical ===');
{
  for (const lang of ['en', 'zh']) {
    const v = await visit(`/project-template.html?project=spectral-dissector&lang=${lang}`);
    const info = await v.evaluate(`({
      panels: document.querySelectorAll('[id^="layout-"]').length,
      title: document.title,
      h2: document.querySelector('#ecce-title').textContent,
      canonical: (document.querySelector('link[rel=canonical]')||{}).href || null,
      descText: (document.querySelector('.ecce-text div')||{}).textContent?.length || 0,
      robots: (document.querySelector('meta[name=robots]')||{}).content || null
    })`);
    check(`旧地址(${lang}) 六个面板都在`, info.panels, 6);
    check(`旧地址(${lang}) 标题`, info.title, 'SPECTRAL DISSECTOR');
    checkTrue(`旧地址(${lang}) h2 有内容`, info.h2.includes('SPECTRAL DISSECTOR'));
    check(`旧地址(${lang}) canonical 指向目录式地址`, info.canonical,
      `${BASE}/works/spectral-dissector/${lang === 'zh' ? 'zh/' : ''}`);
    check(`旧地址(${lang}) 仍带 noindex`, info.robots, 'noindex,follow');
    checkTrue(`旧地址(${lang}) 正文仍由 fetch 填好`, info.descText > 200);
    checkTrue(`旧地址(${lang}) 确实发起了片段请求`, v.net.dataFragments.length === 1);
    checkTrue(`旧地址(${lang}) 无报错`, v.consoleErrors.length === 0 && v.net.bad.length === 0);
    if (v.net.bad.length) failures.push(`旧地址(${lang}) 4xx：${JSON.stringify(v.net.bad)}`);
    await v.close();
  }
}
{
  const v = await visit('/project-template.html?project=does-not-exist');
  const t = await v.evaluate('document.querySelector("#grid-title").textContent');
  checkTrue('旧地址未知 id 仍走 404 文案', t && t.length > 0);
  await v.close();
}

console.log('=== 四、首页卡片与作品列表链接 ===');
{
  const v = await visit('/index.html?lang=zh', { waitMs: 1200 });
  const info = await v.evaluate(`({
    landedAt: location.pathname,
    cards: document.querySelectorAll('.card').length,
    withProject: document.querySelectorAll('.card[data-project]').length,
    hrefRiverrun: App.projectHref('riverrun'),
    hrefEn: App.projectHref('riverrun','en'),
    navLinks: [...document.querySelectorAll('.nav-bottom-left a')].map(a=>a.getAttribute('href')),
    search: location.search
  })`);
  check('旧链接 /?lang=zh 跳到 /zh/', info.landedAt, '/zh/');
  check('8 张卡片都带 data-project', info.withProject, info.cards);
  check('中文界面 riverrun 地址', info.hrefRiverrun, 'works/riverrun/zh/');
  check('强制英文 riverrun 地址', info.hrefEn, 'works/riverrun/');
  checkTrue('导航作品链接指向目录式地址', info.navLinks.slice(0,3).every(h => /^works\//.test(h)));
  check('首页固定为英文（语言写死在路径里）', info.search, '');
  await v.shot('index-zh');
  await v.close();
}
{
  const v = await visit('/works.html?lang=zh');
  const hrefs = await v.evaluate('[...document.querySelectorAll(".works-item")].map(a=>a.getAttribute("href"))');
  check('作品列表 8 条', hrefs.length, 8);
  checkTrue('作品列表链接全部目录式且带 zh', hrefs.every(h => /^works\/[^/]+\/zh\/$/.test(h)));
  await v.close();
}
{
  const v = await visit('/index.html?lang=zh');
  const top = await v.evaluate('document.querySelector("#stack .card:last-child").dataset.project');
  await v.evaluate('document.querySelector("#stack .card:last-child").click()');
  await sleep(1500);
  const url = await v.evaluate('location.pathname');
  check(`中文界面点顶层卡片（${top}）→ 中文作品页`, url, `/works/${top}/zh/`);
  await v.close();
}

/* ---------- 四之二、悬停展签（2026-10-09 加）----------
   展签完全由 CSS 的 :hover 驱动，程序化 .click() 与 evaluate 里改样式都验不到：
   必须派发**真实鼠标移动**，浏览器才会算出 :hover。 */
{
  const v = await visit('/index.html', { waitMs: 1500 });
  const info = await v.evaluate(`(() => {
    const cards = [...document.querySelectorAll('#stack .card')];
    return {
      cards: cards.length,
      children: document.getElementById('stack').children.length,
      labels: document.querySelectorAll('#stack .card > .card-label').length,
      outerLabels: document.querySelectorAll('#stack > .card-label').length,
      keys: cards.map(c => {
        const t = c.querySelector('.card-label-title'), f = c.querySelector('.card-label-facts');
        return c.dataset.project + '=' + (t ? t.dataset.i18n : '-') + '/' + (f ? f.dataset.i18n : '-');
      }).sort()
    };
  })()`);
  check('8 张卡片各带一层展签', info.labels, 8);
  check('#stack 仍只有 8 个子元素（展签不能进洗牌与翻牌用的 children）', info.children, info.cards);
  check('展签没有被放到 #stack 之下（会多出第 9 个「卡片」）', info.outerLabels, 0);
  check('展签两行的 i18n 键逐张对应', info.keys, [
    '6u104hp=card6u104hp/label6u104hp',
    'ecce-homo=cardEcce/labelEcce',
    'edgedgedge=cardEdgedgedge/labelEdgedgedge',
    'riverrun=cardRiverrun/labelRiverrun',
    'spectral-dissector=cardSpectral/labelSpectral',
    'the-induction-mixer=cardFetMixer/labelFetMixer',
    'the-just-type-study=cardJustType/labelJustType',
    'wwhbh=cardWwbh/labelWwbh'
  ]);

  const idle = await v.evaluate(`(() => { const l = document.querySelector('#stack .card:last-child .card-label');
    const cs = getComputedStyle(l); return cs.opacity + '/' + cs.visibility + '/' + cs.display; })()`);
  check('未悬停时展签不可见', idle, '0/hidden/flex');

  const topBox = await v.evaluate(`(() => { const r = document.querySelector('#stack .card:last-child').getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; })()`);
  await v.raw('Input.dispatchMouseEvent', { type: 'mouseMoved', x: topBox.x, y: topBox.y, button: 'none' });
  await sleep(60);
  check('停留期内（60ms）展签还没出来', await v.evaluate(
    `getComputedStyle(document.querySelector('#stack .card:last-child .card-label')).opacity`), '0');
  await sleep(450);
  const shown = await v.evaluate(`(() => {
    const t = document.querySelector('#stack .card:last-child');
    const on = [...document.querySelectorAll('#stack .card > .card-label')].filter(l => +getComputedStyle(l).opacity > 0.5);
    return { n: on.length, mine: on.length === 1 && on[0].closest('.card') === t,
             title: on[0] ? on[0].querySelector('.card-label-title').textContent : null,
             cardText: t.querySelector('.card-fallback').textContent.trim(),
             gap: on[0] ? Math.round(on[0].getBoundingClientRect().top - t.getBoundingClientRect().bottom) : null };
  })()`);
  check('悬停顶层：只有它的展签可见', shown.n, 1);
  checkTrue('可见的展签属于顶层卡片', shown.mine);
  check('展签首行与卡片自己的文字一致', shown.title, shown.cardText);
  check('展签与卡片外缘间距 8px（top:calc(100% + 11px) 里含 3px 边框）', shown.gap, 8);

  /* 窄条：第二张卡右缘那道约 15.7px 的竖条 —— 展签最有用的场景（只看得见一条图片边） */
  const sliver = await v.evaluate(`(() => {
    const k = [...document.querySelectorAll('#stack .card')], c = k[k.length - 2], r = c.getBoundingClientRect();
    return { id: c.dataset.project, top: document.querySelector('#stack .card:last-child').dataset.project,
             x: Math.round(r.right - 4), y: Math.round(r.y + r.height / 2) };
  })()`);
  await v.hoverAt(sliver.x, sliver.y, 500);
  const onSliver = await v.evaluate(`(() => {
    const on = [...document.querySelectorAll('#stack .card > .card-label')].filter(l => +getComputedStyle(l).opacity > 0.5);
    return { n: on.length, id: on.length === 1 ? on[0].closest('.card').dataset.project : null };
  })()`);
  checkTrue('（那条窄条确实不属于顶层卡片，这条断言才有意义）', sliver.id !== sliver.top);
  check('窄条悬停：也只出一层展签', onSliver.n, 1);
  check('窄条悬停出的是那张卡自己的展签', onSliver.id, sliver.id);

  /* 纯触摸设备：@media (any-pointer:fine) 不匹配 → 整块 display:none。
     实测 CDP 的 setTouchEmulationEnabled 能真的把这条媒体查询翻过去
     （默认 fine=true/display=flex，开触摸模拟后 fine=false/display=none）。 */
  const vt = await visit('/index.html', { waitMs: 1200 });
  await vt.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await sleep(200);
  const touch = await vt.evaluate(`(() => ({
    fine: matchMedia('(any-pointer: fine)').matches,
    display: getComputedStyle(document.querySelector('.card-label')).display
  }))()`);
  check('纯触摸设备：any-pointer:fine 不匹配、展签 display:none', [touch.fine, touch.display], [false, 'none']);
  await vt.close();
  await v.close();
}

/* ---------- 四之三、点击下层卡片 → 置顶（2026-10-09 加）----------
   三道断言：动画中途不能是瞬移（FLIP 的回归网）、落定后它成为顶层且其余顺序不变、
   按住拖过一下再松手（过 8px 臂、不到 50px 翻牌阈值）既不许置顶也不许翻牌。 */
{
  const v = await visit('/index.html', { waitMs: 1500 });
  const t = await v.evaluate(`(() => {
    const k = [...document.querySelectorAll('#stack .card')], c = k[k.length - 4], r = c.getBoundingClientRect();
    return { id: c.dataset.project, order: k.map(x => x.dataset.project),
             x: Math.round(r.right - 4), y: Math.round(r.y + r.height / 2) };
  })()`);
  await v.hoverAt(t.x, t.y, 150);
  await v.raw('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x, y: t.y, button: 'left', clickCount: 1, buttons: 1 });
  await v.raw('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x, y: t.y, button: 'left', clickCount: 1, buttons: 1 });
  await sleep(150);
  const mid = await v.evaluate(`(() => {
    const c = document.querySelector('#stack .card:last-child');
    const m = /matrix\\(([-\\d.]+), 0, 0, ([\\d.]+), ([-\\d.]+), ([-\\d.]+)\\)/.exec(getComputedStyle(c).transform);
    return m ? { x: Math.round(parseFloat(m[3])), y: Math.round(parseFloat(m[4])) } : null;
  })()`);
  checkTrue('置顶动画中途还在半路（不是瞬移；FLIP 回归网）',
    mid && (Math.abs(mid.x) > 2 || Math.abs(mid.y) > 1));
  await sleep(1000);
  const after = await v.evaluate(`(() => {
    const k = [...document.querySelectorAll('#stack .card')], top = k[k.length - 1];
    return { top: top.dataset.project, z: top.style.zIndex, transform: top.style.transform,
             order: k.map(c => c.dataset.project) };
  })()`);
  check('点击下层卡片 → 它成为顶层', after.top, t.id);
  check('置顶后 z-index = 8', after.z, '8');
  check('置顶后回到栈中心（transform 归零）', after.transform, 'translate(0px, 0px)');
  check('其余 7 张相对顺序逐字不变', after.order.filter(x => x !== t.id), t.order.filter(x => x !== t.id));
  await v.close();
}
{
  const v = await visit('/index.html', { waitMs: 1500 });
  const t = await v.evaluate(`(() => {
    const k = [...document.querySelectorAll('#stack .card')], c = k[k.length - 4], r = c.getBoundingClientRect();
    return { id: c.dataset.project, order: k.map(x => x.dataset.project),
             x: Math.round(r.right - 4), y: Math.round(r.y + r.height / 2) };
  })()`);
  await v.raw('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x, y: t.y, button: 'none' });
  await v.raw('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x, y: t.y, button: 'left', clickCount: 1, buttons: 1 });
  await v.raw('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x - 30, y: t.y, button: 'left', buttons: 1 });
  await v.raw('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x - 30, y: t.y, button: 'left', clickCount: 1, buttons: 1 });
  await sleep(900);
  const after = await v.evaluate(`[...document.querySelectorAll('#stack .card')].map(c => c.dataset.project)`);
  check('按住拖 30px 再松手：既不置顶也不翻牌（顺序逐字不变）', after, t.order);
  await v.close();
}

/* ---------- 四之四、返回栏的目标：从作品列表点进作品页时回列表（2026-10-09 加）----------
   判定用 document.referrer，所以这里必须**真的从列表页点进去** —— 程序化 location.href
   与 Page.navigate 都不带 referrer，那种写法会永远走「回首页」那一支、测不到新逻辑。
   实测：referrer 在刷新后仍然保留，因此不需要 sessionStorage 之类的补强。 */
{
  /* ① 从作品列表点进作品页 → 返回栏＝列表、文案＝「[<- 全部作品]」，Esc 跟着走 */
  {
    const v = await visit('/works/zh/', { waitMs: 1200 });
    await v.evaluate(`(document.querySelector('.works-item').click(), 1)`);
    await sleep(2200);
    const nav = await v.evaluate(`(() => { const a = document.querySelector('.back a[data-i18n="back"]');
      return { path: location.pathname, href: a && a.getAttribute('href'), text: a && a.textContent,
               referrer: document.referrer }; })()`);
    checkTrue('从列表点进作品页：referrer 就是作品列表', /\/works\/zh\/$/.test(nav.referrer));
    check('返回栏目标是中文作品列表', nav.href, 'works/zh/');
    check('返回栏文案换成「[<- 全部作品]」', nav.text, '[<- 全部作品]');
    await v.evaluate(`(document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})), 1)`);
    await sleep(1800);
    check('作品页按 Esc → 落在作品列表（Esc 读的就是这个 href）',
      await v.evaluate(`location.pathname`), '/works/zh/');
    await v.close();
  }
  /* ② 直接打开（无来路）与从另一作品页跳过来 → 都回首页，文案回到「[<- 返回]」 */
  {
    const v = await visit('/works/riverrun/zh/', { waitMs: 1500 });
    const nav = await v.evaluate(`(() => { const a = document.querySelector('.back a[data-i18n="back"]');
      return { href: a && a.getAttribute('href'), text: a && a.textContent, referrer: document.referrer }; })()`);
    check('直接打开作品页：referrer 为空', nav.referrer, '');
    check('直接打开作品页：返回栏指向主页', nav.href, './zh/');
    check('直接打开作品页：文案仍是「[<- 返回]」', nav.text, '[<- 返回]');
    await v.close();
  }
  {
    const v = await visit('/works/riverrun/zh/', { waitMs: 1500 });
    await v.evaluate(`(document.querySelector('.project-related-link').click(), 1)`);
    await sleep(2200);
    const nav = await v.evaluate(`(() => { const a = document.querySelector('.back a[data-i18n="back"]');
      return { href: a && a.getAttribute('href'), referrer: document.referrer }; })()`);
    checkTrue('从另一作品页跳过来：referrer 是那件作品页', /\/works\/[^/]+\/zh\/$/.test(nav.referrer));
    check('从另一作品页跳过来：返回栏仍指向主页（只认列表那一种来路）', nav.href, './zh/');
    await v.close();
  }
  /* ③ 原地换语言：目标与文案都按新语言重算，来路不变 */
  {
    const v = await visit('/works/zh/', { waitMs: 1200 });
    await v.evaluate(`(document.querySelector('.works-item').click(), 1)`);
    await sleep(2200);
    await v.evaluate(`(document.getElementById('lang-toggle').click(), 1)`);
    await sleep(1000);
    const nav = await v.evaluate(`(() => { const a = document.querySelector('.back a[data-i18n="back"]');
      return { href: a && a.getAttribute('href'), text: a && a.textContent, lang: document.documentElement.lang }; })()`);
    check('原地切成英文后：返回栏指向英文作品列表', nav.href, 'works/');
    check('原地切成英文后：文案「[<- ALL WORKS]」', nav.text, '[<- ALL WORKS]');
    await v.close();
  }
  /* ④ 站内页不受影响：规则只对作品页生效（作品列表也进不到简介页） */
  {
    const v = await visit('/about/zh/', { waitMs: 1200 });
    const nav = await v.evaluate(`(() => { const a = document.querySelector('.back a[data-i18n="back"]');
      return { href: a && a.getAttribute('href'), text: a && a.textContent }; })()`);
    check('简介页返回栏仍指向主页', nav.href, './zh/');
    check('简介页文案仍是「[<- 返回]」', nav.text, '[<- 返回]');
    await v.close();
  }
}

/* ---------- 四之五、作品页返回栏烤进静态 HTML（无 JS 也看得到，2026-10-09 加）----------
   此前返回栏只由 js/project.js 在运行时插入，于是不跑 JS 的作品页**一个站内链接都没有**
   （实测 links=0，正文文字倒是在）。现在由 scripts/gen-projects.mjs 与站内页同一套烤法写进
   16 个生成页；运行时 renderBackNav() 见到 .back 已存在就不再创建，只按来路升级目标。 */
{
  const L = [['en', './', 'BACK'], ['zh', './zh/', '返回']];
  const bad = [];
  let bars = 0;
  for (const { id } of P) {
    for (const [lang, href, label] of L) {
      const rel = `works/${id}/${lang === 'zh' ? 'zh/' : ''}index.html`;
      const html = readFileSync(join(ROOT, rel), 'utf8');
      const found = html.match(/<div class="back" data-baked="1">/g) || [];
      bars += found.length;
      const want = `<a href="${href}" data-i18n="back">[&lt;- ${label}]</a>`;
      if (found.length !== 1 || !html.includes(want)) {
        bad.push(`${rel}：返回栏 ${found.length} 处，锚点${html.includes(want) ? '在' : '缺失'}`);
      }
    }
  }
  check('16 个作品页各含恰好一处烤好的返回栏', bars, 16);
  check('16 页的返回栏 href 与文案逐页正确（./ 与 ./zh/）', bad, []);

  /* 不跑 JS：返回 + 语言切换两个链接都得在（此前是 0 个） */
  const v = await visit('/works/riverrun/zh/', { noJs: true, waitMs: 800 });
  const info = await v.evaluate(`(() => {
    const back = document.querySelector('.back a[data-i18n="back"]');
    return { links: document.querySelectorAll('a[href]').length,
             backText: back && back.textContent, backAbs: back && back.href,
             toggle: !!document.querySelector('#lang-toggle'),
             hasText: document.body.innerText.includes('作品简介') };
  })()`);
  check('无 JS 的作品页有 2 个站内链接（返回 + 语言切换）', info.links, 2);
  check('无 JS 时返回文案是「[<- 返回]」', info.backText, '[<- 返回]');
  checkTrue('无 JS 时返回指向该语言的主页', /\/zh\/$/.test(info.backAbs || ''));
  checkTrue('无 JS 时语言按钮也在', info.toggle);
  checkTrue('无 JS 时正文仍在（与返回栏一起构成可读可走）', info.hasText);
  await v.close();

  /* 跑 JS 之后不许出现第二处（renderBackNav 见到 .back 就早返回） */
  const v2 = await visit('/works/riverrun/zh/', { waitMs: 1200 });
  check('跑 JS 后返回栏仍只有一处（不重复创建）',
    await v2.evaluate(`document.querySelectorAll('.back').length`), 1);
  await v2.close();
}

console.log('=== 五、/works/ 转发与 404 页 ===');
{
  /* /works/ 曾经是转发到 /works.html 的薄壳，现在**它自己就是作品列表页**（英文规范地址） */
  const v = await visit('/works/', { waitMs: 800 });
  const info = await v.evaluate(`({ path: location.pathname, items: document.querySelectorAll('.works-item').length, lang: document.documentElement.dataset.lang })`);
  check('/works/ 是作品列表页本身', [info.path, info.items, info.lang], ['/works/', 8, 'en']);
  await v.close();
}
{
  /* 规范页面的语言由目录决定：?lang= 一律忽略（要中文请去 /works/zh/） */
  const v = await visit('/works/?lang=zh', { waitMs: 800 });
  const info = await v.evaluate(`({ path: location.pathname + location.search, lang: document.documentElement.dataset.lang })`);
  check('/works/?lang=zh 仍按目录显示英文', info.lang, 'en');
  await v.close();
}
{
  const v = await visit('/404.html?lang=zh');
  const info = await v.evaluate(`({
    lead: document.querySelector('[data-i18n=lead]').textContent,
    h1: document.querySelector('h1').textContent,
    links: [...document.querySelectorAll('.notfound-links a')].map(a => new URL(a.href).pathname),
    css: !!getComputedStyle(document.querySelector('.notfound-page')).maxWidth
  })`);
  checkTrue('404 中文文案', /地址/.test(info.lead));
  check('404 标题', info.h1, '404');
  /* 比的是**解析后的路径**而不是 href 的字面写法：写一半的地址（'./zh/'）与写全的
     地址（'/zh/'）对读者是一回事，而字面写法会随 App.pageHref 的实现变。
     这一条在 2026-09-23 之前是真的会失败的 —— 那时 404 页没有 <base>，
     两个出口解析成 /404.html 自身与 /works/zh/。 */
  check('404 出口指向目录式地址（随语言）', info.links, ['/zh/', '/works/zh/']);
  checkTrue('404 样式已加载', info.css);
  checkTrue('404 无报错', v.consoleErrors.length === 0 && v.net.bad.length === 0);
  await v.close();
}
{
  const v = await visit('/404.html?lang=en');
  const lead = await v.evaluate('document.querySelector("[data-i18n=lead]").textContent');
  checkTrue('404 英文文案', /Nothing lives at this address/.test(lead));
  await v.shot('404-en');
  await v.close();
}

console.log('=== 六、changelog 页（本次新增了条目并提了版本号）===');
{
  /* 期望值改为**从 js/changelog.js 现读**，不再每次手改正则。
     原先写死「最新那条的特征词」，改一次代码就要跟着改一次断言，忘改就误报 ——
     与第十二节的字体版本号是同一类问题：重复的真相迟早会漂。 */
  const src = readFileSync(join(ROOT, 'js', 'changelog.js'), 'utf8');
  const newest = {
    zh: (src.match(/const entries = \[\s*\{\s*date: '[^']*',\s*title: \{\s*zh: '([^']+)'/) || [])[1] || '',
    en: (src.match(/const entries = \[\s*\{\s*date: '[^']*',\s*title: \{\s*zh: '[^']+',\s*en: '([^']+)'/) || [])[1] || ''
  };
  checkTrue('js/changelog.js 最新一条的标题可解析', !!(newest.zh && newest.en));

  /* 版本号也改为**一致性检查**，不再写死某个数字：模板与两份生成页必须同号。
     写死数字的写法每改一次代码就要改一次断言，忘改就误报 —— 与第十二节的字体版本号同类。
     （「有没有记得提号」这件事只有 git 知道，不在本脚本的判据内。） */
  const clVersions = ['changelog.html', 'changelog/index.html', 'changelog/zh/index.html'].map(f => {
    const m = readFileSync(join(ROOT, f), 'utf8').match(/js\/changelog\.js\?v=(\d+)/);
    return [f, m ? m[1] : null];
  });
  check(`changelog 模板与生成页版本号一致`, clVersions.map(([, v]) => v),
    Array(3).fill(clVersions[0][1]));
  const clVersion = clVersions[0][1];

  for (const lang of ['zh', 'en']) {
    const v = await visit(`/changelog.html?lang=${lang}`);
    const info = await v.evaluate(`({
      entries: document.querySelectorAll('.log-entry').length,
      firstTitle: (document.querySelector('.log-entry')||{}).textContent?.slice(0, 40) || '',
      script: [...document.querySelectorAll('script[src^="js/changelog.js"]')].map(s=>s.getAttribute('src'))[0]
    })`);
    checkTrue(`changelog(${lang}) 有日志条目`, info.entries > 10);
    /* 页面渲染的第一条必须是 changelog.js 里的最新一条（前 16 字足以定位） */
    checkTrue(`changelog(${lang}) 首条 = changelog.js 最新一条`,
      !!newest[lang] && info.firstTitle.startsWith(newest[lang].slice(0, 16)));
    check(`changelog(${lang}) 脚本版本号 = 模板里的号`, info.script, `js/changelog.js?v=${clVersion}`);
    checkTrue(`changelog(${lang}) 无报错`, v.consoleErrors.length === 0 && v.net.bad.length === 0);
    if (v.net.bad.length) failures.push(`changelog(${lang}) 4xx：${JSON.stringify(v.net.bad)}`);
    if (v.consoleErrors.length) failures.push(`changelog(${lang}) 控制台：${JSON.stringify(v.consoleErrors)}`);
    await v.close();
  }
}

console.log('=== 七、导航文案 i18n 与 CJK 字体下载（2026-09-22 四项收尾改动）===');
{
  /* 英文界面：返回栏必须是 [<- BACK]、语言按钮必须是 [zh] 中文；
     中文界面反过来。同页内顺带断言「有没有发起思源黑体请求」。 */
  /* 最后一列 = 该页是否**应当**发起思源黑体请求。判据是「页面上是否真有汉字」：
     正文自带汉字的页面必须下载（否则汉字没字形），UI 标签是唯一汉字来源的页面不该下载。
     2026-09-22 二次改造后的边界：英文侧零散用到的 12 个汉字由 SiteCJK 子集（4KB）承担，
     音标 ɔ 由 LocalIPA（local()）承担，故**除 changelog 英文页外，英文页都不再请求整份思源**；
     changelog 英文条目按设计引用大量中文（约 85 字），继续用整份（304KB）是正确的。 */
  const NAV = [
    ['/works.html?lang=en',        'en', '[<- BACK]',    '[zh] 中文',       false],
    ['/about.html?lang=en',        'en', '[<- BACK]',    '[zh] 中文',       false],
    ['/changelog.html?lang=en',    'en', '[<- BACK]',    '[zh] 中文',       false],   // 折叠态只有 7 个可见汉字（SiteCJK 够）；展开含中文的条目才按需拉主字体，实测确认
    ['/works/riverrun/',           'en', '[<- BACK]',    '[zh] 中文',       false],   // 中文昵称由 SiteCJK 子集承担
    ['/works/spectral-dissector/', 'en', '[<- BACK]',    '[zh] 中文',       false],
    ['/works/wwhbh/',              'en', '[<- BACK]',    '[zh] 中文',       false],   // 同上（南美大虾）
    ['/works/6u104hp/',            'en', '[<- BACK]',    '[zh] 中文',       false],   // 英文正文里无汉字
    ['/works/the-induction-mixer/', 'en','[<- BACK]',    '[zh] 中文',       false],   // 【】已改为 []
    ['/works/edgedgedge/',         'en', '[<- BACK]',    '[zh] 中文',       false],
    ['/works/ecce-homo/',          'en', '[<- BACK]',    '[zh] 中文',       false],
    ['/works/the-just-type-study/','en', '[<- BACK]',    '[zh] 中文',       false],   // 音标 ɔ 由 LocalIPA（local()）承担
    ['/404.html?lang=en',          'en', '[<- BACK]',    '[zh] 中文',       false],
    ['/index.html?lang=en',        'en', null,           '[zh] 中文',       false],   // 汉字署名由 SiteCJK 子集承担
    ['/works.html?lang=zh',        'zh', '[<- 返回]',    '[en] English',    true],
    ['/works/spectral-dissector/zh/','zh','[<- 返回]',   '[en] English',    true]
  ];
  for (const [path, lang, back, toggle, expectFont] of NAV) {
    const v = await visit(path, { waitMs: 2500 });
    const got = await v.evaluate(`({
      back: (document.querySelector('.back a')||{}).textContent || null,
      toggle: (document.querySelector('#lang-toggle')||{}).textContent || null,
      lang: document.documentElement.dataset.lang,
      toggleStack: getComputedStyle(document.querySelector('#lang-toggle')).fontFamily,
      backStack: (document.querySelector('.back a') ? getComputedStyle(document.querySelector('.back a')).fontFamily : '')
    })`);
    const fontReq = v.net.all.some(x => /SourceHanSansSC/.test(x));
    check(`${path} 语言`, got.lang, lang);
    if (back) check(`${path} 返回栏文案`, got.back, back);
    check(`${path} 语言按钮文案`, got.toggle, toggle);
    check(`${path} 整份思源请求`, fontReq, expectFont);
    /* 2026-09-22 统一之后：导航标签回到全站字体栈，不再落到系统字体；
       而每页的导航标签里都有汉字（英文界面是「中文」、中文界面是「返回」），
       所以**每一页**都会下 SiteCJK（约 3.4KB）。 */
    check(`${path} 导航标签不再走系统字体`,
      /PingFang|YaHei|system-ui|sans-serif/.test(got.toggleStack + got.backStack), false);
    check(`${path} 下了 SiteCJK 小面`, v.net.all.some(x => /SiteCJK/.test(x)), true);
    checkTrue(`${path} 无报错/4xx`, v.consoleErrors.length === 0 && v.net.bad.length === 0);
    if (v.net.bad.length) failures.push(`${path} 4xx：${JSON.stringify(v.net.bad)}`);
    if (v.consoleErrors.length) failures.push(`${path} 控制台：${JSON.stringify(v.consoleErrors)}`);
    await v.close();
  }

  /* ---- 意图预载：英文作品页上，语言按钮一被按下就提前取中文字体 ----
     切语言在作品页是**原地换**（js/i18n.js 的 _inPlace）：不跳转，就没有新文档的 <head>
     去发预载，浏览器要到中文文案换上去那一刻才发现需要这份 245KB。
     加这条断言是因为上面那张表全是**程序化** .click() —— 它不派发 pointerdown，
     于是新增的意图预载一次都没被走到（实测：跑完整套也照样全绿）。
     两条一起断言，缺一不可：
       ① 没碰按钮时**不许**发请求（上面那张表的 expectFont=false 已经在守这条，
          但那是另一批页面，这里再对同一页守一次，免得将来把监听写成无条件触发）；
       ② 真按下之后就**必须**发请求，否则这个功能等于没接上。 */
  {
    const v = await visit('/works/6u104hp/', { waitMs: 2500 });
    check('英文作品页：没碰语言按钮时不预取中文字体',
      v.net.all.some(x => /SourceHanSansSC/.test(x)), false);
    await v.evaluate(`(function(){
      const a = document.querySelector('#lang-toggle');
      a.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
      return 1; })()`);
    await sleep(1200);
    check('英文作品页：按下语言按钮后提前取中文字体',
      v.net.all.some(x => /SourceHanSansSC/.test(x)), true);
    /* 只是按下、没抬手：语言**不该**已经切过去 */
    check('只按下没抬手时语言不变（意图预载不提前改页面）',
      await v.evaluate('document.documentElement.dataset.lang'), 'en');
    await v.close();
  }
}

console.log('=== 八、生成页按布局挂脚本 ===');
{
  const NEED = {
    'riverrun':            ['js/mixer-riverrun.js'],
    'wwhbh':               ['js/ink-wwhbh.js', 'js/audio-wwhbh.js'],
    'spectral-dissector':  [],
    '6u104hp':             [],
    'edgedgedge':          [],
    'ecce-homo':           [],
    'the-induction-mixer': [],
    'the-just-type-study': []
  };
  const ALL = ['js/ink-wwhbh.js', 'js/audio-wwhbh.js', 'js/mixer-riverrun.js'];
  for (const [id, need] of Object.entries(NEED)) {
    for (const lang of ['en', 'zh']) {
      const path = `/works/${id}/${lang === 'zh' ? 'zh/' : ''}`;
      const v = await visit(path, { waitMs: 400 });
      const srcs = await v.evaluate(`[...document.querySelectorAll('script[src]')].map(s => s.getAttribute('src').split('?')[0])`);
      const present = ALL.filter(f => srcs.includes(f));
      check(`${path} 挂载的布局专用脚本`, present.sort(), [...need].sort());
      checkTrue(`${path} project.js 仍在`, srcs.includes('js/project.js'));
      await v.close();
    }
  }
}

console.log('=== 九、站内页目录式地址：关掉 JS 后内容仍在（烤入的意义）===');
{
  const CASES = [
    ['/zh/',              { h1: null,      links: 8,  text: '作品' }],
    ['/works/',           { h1: 'WORKS',   items: 8,  text: '6U104HP' }],
    ['/works/zh/',        { h1: '作品列表', items: 8,  text: '6U104HP' }],
    ['/about/',           { h1: 'ABOUT',   paras: 8,  text: 'Cao Haoxuan' }],
    ['/about/zh/',        { h1: '关于',     paras: 8,  text: '曹浩轩' }],
    /* 日志正文刻意不烤（见 scripts/gen-pages.mjs）：无 JS 时只有烤好的标题与导航 */
    ['/changelog/',       { h1: 'CHANGELOG', text: 'CHANGELOG', minLinks: 2 }],
    ['/changelog/zh/',    { h1: '进程日志',  text: '进程日志', minLinks: 2 }]
  ];
  for (const [path, want] of CASES) {
    const v = await visit(path, { noJs: true, waitMs: 600 });
    const info = await v.evaluate(`({
      h1: (document.querySelector('h1,h2')||{}).textContent || null,
      items: document.querySelectorAll('.works-item').length,
      paras: document.querySelectorAll('.bio p').length,
      links: document.querySelectorAll('a[href]').length,
      inner: document.body.innerText.slice(0, 4000),
      lang: document.documentElement.dataset.lang,
      fixed: document.documentElement.hasAttribute('data-lang-fixed')
    })`);
    check(`${path} data-lang`, info.lang, path.includes('/zh/') || path === '/zh/' ? 'zh' : 'en');
    check(`${path} data-lang-fixed`, info.fixed, true);
    if (want.h1) checkTrue(`${path} 无 JS 也有标题「${want.h1}」`, (info.h1 || '').includes(want.h1));
    if (want.items) check(`${path} 无 JS 也有 ${want.items} 条作品链接`, info.items, want.items);
    if (want.paras) check(`${path} 无 JS 也有 ${want.paras} 段正文`, info.paras, want.paras);
    checkTrue(`${path} 无 JS 也有站内链接`, info.links >= (want.minLinks || 3));
    checkTrue(`${path} 无 JS 也有正文文字`, info.inner.includes(want.text));
    await v.close();
  }
}

console.log('=== 十、爬取路径与旧地址声明 ===');
{
  /* 首页（英文规范地址）在无 JS 时也要指向作品列表与作品页 */
  const home = await visit('/', { noJs: true, waitMs: 600 });
  const homeLinks = await home.evaluate(`[...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))`);
  checkTrue('首页无 JS 时能看到作品列表链接', homeLinks.includes('works/'));
  checkTrue('首页无 JS 时能看到作品页链接', homeLinks.some(h => /^works\/[^/]+\/$/.test(h)));
  await home.close();

  /* 跟着链接走：首页 → 作品列表 → 作品页 */
  const w = await visit('/works/', { noJs: true, waitMs: 600 });
  const wLinks = await w.evaluate(`[...document.querySelectorAll('.works-item')].map(a => a.getAttribute('href'))`);
  check('作品列表 8 条且指向目录式地址', wLinks.length, 8);
  checkTrue('作品列表链接形如 works/<id>/', wLinks.every(h => /^works\/[^/]+\/$/.test(h)));
  await w.close();

  /* 旧地址：可用 + noindex + canonical 指向目录式地址 */
  for (const [path, name] of [['/works.html?lang=zh', 'works'], ['/about.html?lang=en', 'about'], ['/changelog.html?lang=zh', 'changelog']]) {
    const v = await visit(path);
    const info = await v.evaluate(`({
      robots: (document.querySelector('meta[name=robots]')||{}).content || null,
      canonical: (document.querySelector('link[rel=canonical]')||{}).href || null,
      h1: (document.querySelector('h1,h2')||{}).textContent || null
    })`);
    check(`${path} 旧地址带 noindex`, info.robots, 'noindex,follow');
    check(`${path} canonical 指向 /${name}/${path.includes('lang=zh') ? 'zh/' : ''}`,
      info.canonical, `${BASE}/${name}/${path.includes('lang=zh') ? 'zh/' : ''}`);
    checkTrue(`${path} 页面照常可用`, (info.h1 || '').length > 0);
    await v.close();
  }
}

/* ---------- 十一、Gallery Lightbox：从网格任意一张进入，位置指示正确 ---------- */
console.log('=== 十一、Gallery Lightbox 位置指示 ===');
{
  /* 6U104HP 有 21 张（11 产品 + 10 参展），分四段五组；扁平图集跨组翻页，
     所以「点第 5 组的第一张、计数应是 18 / 21」是最能说明索引没错的一测。 */
  const v = await visit('/works/6u104hp/zh/', { waitMs: 1200 });
  const before = await v.evaluate(`({
    grids: document.querySelectorAll('.gallery-grid').length,
    sections: document.querySelectorAll('.gallery-section').length,
    groups: document.querySelectorAll('.gallery-group').length,
    titles: [...document.querySelectorAll('.gallery-section-title,.gallery-group-title')].map(e=>e.textContent),
    open: !!document.querySelector('.lightbox.open')
  })`);
  check('6u104hp 网格数（产品 1 + 参展 4）', before.grids, 5);
  check('6u104hp 段数', before.sections, 2);
  check('6u104hp 组数（四个活动）', before.groups, 4);
  check('6u104hp 分组标题（中）', before.titles,
    ['产品图', '参展记录', '上海国际乐器展 2024 · 第二版', '交流方式 2024 · 第二版',
     '上海国际乐器展 2025 · 第三版', '交流方式 2025 · 第三版']);
  checkTrue('打开前 Lightbox 不存在', before.open === false);

  // 点第三个网格（交流方式 2024）的第一张。它是扁平图集的第 15 张：
  // 产品图 11 张 + 乐器展 2024 三张 = 前 14 张，故本组为 15/16/17。
  await v.evaluate(`document.querySelectorAll('.gallery-grid')[2].querySelector('img').click()`);
  await sleep(500);
  const opened = await v.evaluate(`({
    open: !!document.querySelector('.lightbox.open'),
    count: (document.querySelector('.lightbox-count')||{}).textContent,
    src: (document.querySelector('.lightbox img')||{}).getAttribute('src')
  })`);
  checkTrue('点网格第 15 张后 Lightbox 打开', opened.open === true);
  check('位置指示 15 / 21', opened.count, '15 / 21');
  check('打开的是被点的那一张', opened.src, 'img/6u104hp-expo-4.webp');

  await v.evaluate(`document.querySelector('.lightbox-next').click()`);
  await sleep(400);
  const stepped = await v.evaluate(`({
    count: (document.querySelector('.lightbox-count')||{}).textContent,
    src: (document.querySelector('.lightbox img')||{}).getAttribute('src')
  })`);
  check('→ 之后计数 16 / 21', stepped.count, '16 / 21');
  check('→ 之后换到下一张', stepped.src, 'img/6u104hp-expo-5.webp');

  /* ---- 滚轮 / 点图 / 触屏滑动切图（2026-10-09 加）----
     滚轮手感照抄首页卡片栈：400ms 冷却 + 尖峰检测 —— 所以「连发 6 次」必须只走一张。
     当前停在第 16 张（expo-5，索引 15），邻居是 expo-4 与 expo-6。 */
  const lbCount = () => v.evaluate(`(document.querySelector('.lightbox-count')||{}).textContent`);
  const lbSrc = () => v.evaluate(`((document.querySelector('.lightbox img')||{}).getAttribute('src')||'').split('/').pop()`);
  const wheel = async (dy, n = 1, gap = 60) => {
    for (let i = 0; i < n; i++) {
      await v.raw('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 720, y: 400, deltaX: 0, deltaY: dy });
      await sleep(gap);
    }
  };

  await sleep(500);                                   // 等上一次翻页的冷却过期
  await wheel(120); await sleep(500);
  check('滚轮下滚 → 下一张（17 / 21）', await lbCount(), '17 / 21');
  check('滚轮下滚换的是下一张图', await lbSrc(), '6u104hp-expo-6.webp');
  await sleep(500);
  await wheel(-120); await sleep(500);
  check('滚轮上滚 → 上一张（16 / 21）', await lbCount(), '16 / 21');
  check('滚轮上滚换的是上一张图', await lbSrc(), '6u104hp-expo-5.webp');

  await sleep(600);
  await wheel(120, 6, 40); await sleep(700);          // 触控板惯性：6 个事件只该算一次
  check('连发 6 次下滚只走一张（400ms 冷却 + 尖峰检测）', await lbCount(), '17 / 21');

  await sleep(400);
  await v.evaluate(`document.querySelector('.lightbox img').click()`);
  await sleep(450);
  check('点图片 → 下一张（18 / 21）', await lbCount(), '18 / 21');
  check('点图片换的是下一张图', await lbSrc(), '6u104hp-expo-7.webp');

  /* 触屏左右滑动：先开触摸模拟，再派发真实的 touch 序列 */
  await v.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const swipe = async dx => {
    await v.raw('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 720, y: 400 }] });
    await v.raw('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 720 + dx, y: 400 }] });
    await v.raw('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(450);
  };
  await swipe(-90);
  check('触屏左滑 → 下一张（19 / 21）', await lbCount(), '19 / 21');
  await swipe(90);
  check('触屏右滑 → 上一张（18 / 21）', await lbCount(), '18 / 21');

  /* 预取：当前第 18 张（expo-7，索引 17）的邻居 16 / 18 都该已经进过网络 */
  const pre = await v.evaluate(`performance.getEntriesByType('resource').map(e => e.name.split('/').pop())`);
  checkTrue('相邻图已预取（expo-6 与 expo-8 都在资源条目里）',
    pre.includes('6u104hp-expo-6.webp') && pre.includes('6u104hp-expo-8.webp'));
  checkTrue('图片可点的暗示：.lightbox img 的 cursor 是 pointer',
    (await v.evaluate(`getComputedStyle(document.querySelector('.lightbox img')).cursor`)) === 'pointer');

  // ESC 关闭
  await v.evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);
  await sleep(300);
  const closed = await v.evaluate(`({
    open: !!document.querySelector('.lightbox.open'),
    overflow: document.body.style.overflow
  })`);
  checkTrue('ESC 关闭 Lightbox', closed.open === false);
  check('关闭后恢复页面滚动', closed.overflow, '');
  checkTrue(`Lightbox 无控制台报错`, v.consoleErrors.length === 0 && v.exceptions.length === 0);
  await v.close();
}

/* ---------- 十二、字体 URL 一致性（防「版本号漏同步」复发） ---------- */
console.log('=== 十二、字体 URL 一致性（必须与 css/base.css 逐字相同）===');
{
  /* 为什么单独立一节：主字体 URL 的版本号（= 字形内容的哈希）出现在多处 ——
     css/base.css 的 @font-face、五个手写模板的预载、以及全部生成页。
     漏同步任意一处，预载与 @font-face 就成了两个缓存键，同一份字体白下两遍（274KB）。
     2026-09-22 一天内漏了三次：作品页预载漏 ?v=（白下 267.7KB）、五个旧地址模板漏 ?v=、
     changelog 文案改了字体却忘提号。
     现在书写由 scripts/gen-cjk-main.py 自动完成（它是唯一入口），但**检查仍然必要**：
     手改、回滚、或脚本本身出 bug 都可能让它们重新分叉。 */
  const baseCss = readFileSync(join(ROOT, 'css', 'base.css'), 'utf8');
  const canonical = (baseCss.match(/url\('(fonts\/SourceHanSansSC-Regular\.woff2\?v=[0-9a-f]+)'\)/) || [])[1] || null;
  checkTrue('css/base.css 的主字体 URL 带版本号（权威来源可解析）', !!canonical);

  /* 会写死字体 URL 的文本文件：6 个根模板 + 2 个生成器源码 + 全部生成页 */
  const files = ['index.html', 'works.html', 'about.html', 'changelog.html', '404.html',
                 'project-template.html', 'scripts/gen-pages.mjs', 'scripts/gen-projects.mjs'];
  const walkHtml = d => readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walkHtml(join(d, e.name)) : (e.name.endsWith('.html') ? [join(d, e.name)] : []));
  for (const sub of ['works', 'zh', 'about', 'changelog']) {
    const abs = join(ROOT, sub);
    if (existsSync(abs)) files.push(...walkHtml(abs).map(f => relative(ROOT, f)));
  }

  /* 比较的是「文件名 + 查询串」这一段：各处的目录前缀本来就不该相同
     （base.css 里是 fonts/、模板里是 css/fonts/ 或 /css/fonts/），
     真正必须一致的是**版本号**，所以剥掉 fonts/ 前缀再比。
     ——首版这里忘了剥，29 处全被误报，实测抓出来的。 */
  const wantTail = canonical.replace(/^fonts\//, '');
  const mismatched = [];
  let refs = 0;
  for (const rel of files) {
    const text = readFileSync(join(ROOT, rel), 'utf8');
    for (const m of text.matchAll(/SourceHanSansSC-Regular\.woff2(\?v=[0-9a-f]+)?/g)) {
      refs++;
      const found = 'SourceHanSansSC-Regular.woff2' + (m[1] || '（无 ?v=）');
      if (found !== wantTail) mismatched.push(`${rel} → ${found}`);
    }
  }
  checkTrue(`扫到主字体 URL 引用（当前 ${refs} 处）`, refs > 0);
  check(`与 css/base.css 不一致的引用（须为空）`, mismatched, []);

  /* base.css **自身**的号（`base.css?v=N`，递增整数）：六份 HTML 必须一致。
     它是与上面那个字体哈希**不同的版本键**，所以前面那条查不到它。历史上它会静默漂：
     scripts/gen-cjk-main.py 提号时取六份里的**最大值**再统一写回，六份不一致时它既不报错、
     也不失败，只是顺手抹平（2026-09-23 实测撞上：起点是 v10 与 v11 混用，直到那次重切才归一）。
     漂着的后果与字体 URL 分叉同类 —— 六份 HTML 里有两份指向不同的 base.css 缓存键。 */
  const cssVer = ['index.html', 'works.html', 'about.html', 'changelog.html', '404.html',
                  'project-template.html'].map(f => {
    const m = readFileSync(join(ROOT, f), 'utf8').match(/base\.css\?v=(\d+)/);
    return [f, m ? m[1] : null];
  });
  const uniqVer = [...new Set(cssVer.map(x => x[1]))];
  check(`六份 HTML 的 base.css 号（当前 ${uniqVer.map(v => v ? 'v' + v : '缺失').join(' / ')}）`,
        uniqVer.length === 1 ? [] : cssVer, []);
  checkTrue('六份 HTML 都带 base.css 号', cssVer.every(x => x[1] !== null));

  /* 静态比对之外，再按**实际请求**确认一遍：漏同步的症状就是同一份字体被请求两次。
     覆盖三种页面：手写模板的旧地址、生成的作品页、生成的站内页。 */
  const expectUrl = `${BASE}/css/fonts/${canonical.replace(/^fonts\//, '')}`;
  for (const path of ['/works.html?lang=zh', '/about.html?lang=zh', '/works/6u104hp/zh/', '/zh/']) {
    const v = await visit(path, { waitMs: 2500 });
    const urls = v.net.all
      .filter(x => /SourceHanSansSC-Regular\.woff2/.test(x))
      .map(x => x.replace(/^\d+\s+/, ''));
    check(`${path} 主字体请求次数（一次=预载与 @font-face 同一个缓存键）`, urls.length, 1);
    check(`${path} 主字体请求 URL`, urls[0] || null, expectUrl);
    await v.close();
  }
}

/* ---------- 十三、Esc 返回：与页面上的「返回」按钮同目标 ---------- */
console.log('=== 十三、Esc 返回（子页面 → 首页；首页不响应；Lightbox 优先；旧地址与 404）===');
{
  /* 约定（2026-09-23 作者定）：只在有返回栏的子页面生效，目标**与可见的「返回」按钮
     完全一致**（首页，中文界面 /zh/）；首页没有返回栏故不响应；Lightbox 打开时
     先关放大图、本次按键不跳页（再按一次才返回）。
     实现读的是按钮的 href（js/nav.js），所以这里既断言**具体落点**，也断言
     「落点 = 按钮 href」这条不变量 —— 后者才是「按 Esc 等于点它」的正式表述。 */
  const esc = v => v.evaluate(`(window.__escProbe = 'alive', document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})), 1)`);
  const state = v => v.evaluate(`({
    path: location.pathname,
    href: location.href,
    probe: window.__escProbe || null,
    back: (document.querySelector('.back a[data-i18n="back"]') || {}).href || null
  })`);
  /* href → pathname；拿不到（返回栏缺失的回归）返回 null，让断言报一条失败，
     而不是让 new URL 抛错把整轮验证中断在页面中间。 */
  const pathOf = href => { try { return new URL(href).pathname; } catch { return null; } };

  /* 八页中英各半：作品页（返回栏由 JS 渲染）与三个站内页（返回栏烤在 HTML 里） */
  for (const [path, want] of [
    ['/works/6u104hp/', '/'], ['/works/6u104hp/zh/', '/zh/'],
    ['/works/', '/'],         ['/works/zh/', '/zh/'],
    ['/about/', '/'],         ['/about/zh/', '/zh/'],
    ['/changelog/', '/'],     ['/changelog/zh/', '/zh/']
  ]) {
    const v = await visit(path, { waitMs: 1000 });
    const before = await state(v);
    checkTrue(`${path} 有返回栏（Esc 才有意义）`, !!before.back);
    await esc(v);
    await sleep(900);
    const after = await state(v);
    check(`${path} 按 Esc 回首页`, after.path, want);
    check(`${path} 落点 = 返回按钮的 href`, after.path, pathOf(before.back));
    checkTrue(`${path} Esc 无控制台报错`, v.consoleErrors.length === 0 && v.exceptions.length === 0);
    await v.close();
  }

  /* 首页：没有返回栏，Esc 必须什么都不做（不跳转、不重载） */
  const home = await visit('/', { waitMs: 900 });
  const homeBefore = await state(home);
  checkTrue('首页没有返回栏', homeBefore.back === null);
  await esc(home);
  await sleep(900);
  const homeAfter = await state(home);
  checkTrue('首页按 Esc 不跳转（标记还在 = 没重载）',
    homeAfter.probe === 'alive' && homeAfter.href === homeBefore.href);
  await home.close();

  /* Lightbox 打开时：Esc 只关放大图，不离开本页；再按一次才返回 */
  const lb = await visit('/works/6u104hp/', { waitMs: 1200 });
  await lb.evaluate(`document.querySelector('.gallery-grid img').click()`);
  await sleep(400);
  const lbBefore = await state(lb);
  checkTrue('Lightbox 已打开', await lb.evaluate(`!!document.querySelector('.lightbox.open')`));
  await esc(lb);
  await sleep(900);
  const lbAfter = await lb.evaluate(`({
    open: !!document.querySelector('.lightbox.open'),
    href: location.href,
    probe: window.__escProbe || null
  })`);
  checkTrue('第一次 Esc 只关 Lightbox', lbAfter.open === false);
  checkTrue('第一次 Esc 不离开本页（标记还在）',
    lbAfter.probe === 'alive' && lbAfter.href === lbBefore.href);
  await esc(lb);
  await sleep(900);
  check('第二次 Esc 才回首页', (await state(lb)).path, '/');
  await lb.close();

  /* 旧地址（.html 与 ?project=）：返回栏由 js/nav.js 现生成，同样回首页。
     这五个页面都没有 `<base>`，所以 2026-09-23 之前英文界面的返回按钮解析回**自身**
     （App.pageHref('index') 当时返回空串，而空串 = 本页）。落点写死正是防它复发。 */
  for (const [path, want] of [
    ['/works.html?lang=en', '/'],  ['/works.html?lang=zh', '/zh/'],
    ['/about.html', '/'],          ['/changelog.html', '/'],
    ['/project-template.html?project=riverrun', '/']
  ]) {
    const v = await visit(path, { waitMs: 900 });
    const before = await state(v);
    check(`${path} 返回按钮指向首页`, pathOf(before.back), want);
    await esc(v);
    await sleep(900);
    check(`${path} 按 Esc 回首页`, (await state(v)).path, want);
    await v.close();
  }

  /* 404：它由 GitHub Pages 服务在**任意深度**的不存在路径上，所以页面必须声明
     `<base href="/">`，让脚本生成的相对地址一律从站点最外层算起（2026-09-23 修：
     修之前 /works/bogus/ 上返回链接解析回自身、出口链接解析成 /works/bogus/works/，
     英文读者被困在 404 页里出不去）。
     本地 http.server 不会把 404.html 服务在深层路径上，故这里断言两件等价的事：
     ① 页面确实声明了 base 且基准就是站点根；② 在 /404.html 上，返回栏与两个出口
     都解析成站点根的地址。深层路径的实测见 tmp/ghpages-404-server.py + tmp/esc-probe.mjs。 */
  const nf = await visit('/404.html', { waitMs: 900 });
  const nfInfo = await nf.evaluate(`({
    baseAttr: (document.querySelector('base') || {}).getAttribute ? document.querySelector('base').getAttribute('href') : null,
    baseURI: document.baseURI,
    back: (document.querySelector('.back a[data-i18n="back"]') || {}).href || null,
    exits: [...document.querySelectorAll('.notfound-links a')].map(a => a.href)
  })`);
  check('404 页声明 <base href="/">', nfInfo.baseAttr, '/');
  check('404 页基准地址 = 站点根', nfInfo.baseURI, BASE + '/');
  check('404 页返回链接 = 首页', pathOf(nfInfo.back), '/');
  check('404 页两个出口 = 首页与作品列表', nfInfo.exits.map(pathOf), ['/', '/works/']);
  await esc(nf);
  await sleep(900);
  check('404 页按 Esc 回首页', (await state(nf)).path, '/');
  await nf.close();
}

/* ---------- 十四、深色模式：计算值断言 ---------- */
console.log('=== 十四、深色模式：计算值断言（Emulation.setEmulatedMedia，不是 --force-dark-mode）===');
{
  /* 断的是**计算值**，不是截图：截图比不出「变量有没有真的落到渲染上」——
     css/base.css 里变量写错名字时页面会静默退回初始值，截图上未必看得出。
     深色一律用 CDP 的 Emulation.setEmulatedMedia 模拟；**不用 --force-dark-mode**，
     那是 Chrome 自身的自动暗化，关掉变量化之后照样「看起来变了」，验不出东西。

     覆盖按任务书 §4.1：首页、/works/、about、changelog、一个 gallery 作品页（6U104HP）、
     一个 ecce 作品页（ecce-homo）、wwhbh、riverrun。
     每页给两处选择器：一处落在 3px 硬边上，一处落在次要文字上（没有则传 null）。 */
  const LIGHT = { bg: 'rgb(255, 255, 255)', fg: 'rgb(0, 0, 0)',       rule: 'rgb(0, 0, 0)' };
  const DARK  = { bg: 'rgb(0, 0, 0)',       fg: 'rgb(255, 255, 255)', rule: 'rgb(230, 230, 230)' };  // --rule:#e6e6e6，作者 2026-10-03 定
  const MUTED = 'rgb(136, 136, 136)';   // --muted 深色下字面不变（#888）

  /* 每页给四处：3px 硬边的选择器**与它用的是哪条边**、次要文字的选择器（没有则 null）。
     **必须指明是哪条边**：`border-*-color` 即使那条边宽度为 0 也会计算成 `currentColor`，
     于是拿 `borderTopColor || borderBottomColor` 兜底是兜不住的 —— 上边框恒为真值，
     深色下拿到的是正文的纯白、不是硬边的 #e6e6e6。
     首版就栽在这里：五个只有下边框的页面全红，而四边都有边框的三页（首页卡片、
     .btn-mic、.mixer-stage）正常 —— 现象本身就指向这个口径。 */
  const PAGES = [
    /* 首页那处次要文字原先传 null；2026-10-09 起展签的事实行就是首页唯一的 --muted 文字，
       于是顺手把它纳入：展签在深色下也必须仍是 #888（--muted 不随配色反义）。 */
    ['/',                 '首页',        '.card',            'borderTopColor',    '.card-label-facts'],
    ['/works/',           '作品列表',     '.works-page h1',   'borderBottomColor', '.works-brief'],
    ['/about/',           '简介',        '.bio h1',          'borderBottomColor', null],
    ['/changelog/',       '进程日志',     '.changelog-title', 'borderBottomColor', '.date'],
    ['/works/6u104hp/',   'gallery 布局', '.gallery-body h2', 'borderBottomColor', '.work-meta-k'],
    /* 2026-10-09 展签统一标准：ecce 布局的那条 3px 硬边从「顶部图的下边框」改成
       「展签（信息栏）的上边框」——图片不再画线，线归展签。断言跟着挪到新位置。 */
    ['/works/ecce-homo/', 'ecce 布局',    '.work-meta',       'borderTopColor',    '.work-meta-k'],
    ['/works/wwhbh/',     'wwhbh 布局',   '.btn-mic',         'borderTopColor',    '.work-meta-k'],
    ['/works/riverrun/',  'mixer 布局',   '.mixer-stage',     'borderTopColor',    '.work-meta-k'],
  ];

  const probe = (ruleSel, ruleProp, mutedSel) => `(function(){
    const cs = getComputedStyle(document.documentElement);
    const v = n => cs.getPropertyValue(n).trim();
    const c = (s, p) => { const e = s && document.querySelector(s); return e ? getComputedStyle(e)[p] : null; };
    const back = document.querySelector('.back');
    return {
      vars: { bg: v('--bg'), fg: v('--fg'), rule: v('--rule'), muted: v('--muted') },
      bodyBg: getComputedStyle(document.body).backgroundColor,
      bodyFg: getComputedStyle(document.body).color,
      scheme: cs.colorScheme,
      rule: c(${JSON.stringify(ruleSel)}, ${JSON.stringify(ruleProp)}),
      muted: c(${JSON.stringify(mutedSel)}, 'color'),
      /* 例外②：nav 的 mask-image 是**遮罩 alpha**，深色下必须仍是黑（不透明），
         一旦跟着变量翻成白，返回栏的模糊渐隐会整体失效、底部出现硬边。 */
      mask: back ? (getComputedStyle(back, '::before').maskImage ||
                    getComputedStyle(back, '::before').webkitMaskImage) : null
    };
  })()`;

  for (const [path, label, ruleSel, ruleProp, mutedSel] of PAGES) {
    for (const [mode, want, opt] of [['浅色', LIGHT, { scheme: 'light' }], ['深色', DARK, { scheme: 'dark' }]]) {
      const v = await visit(path, { waitMs: 1200, ...opt });
      const g = await v.evaluate(probe(ruleSel, ruleProp, mutedSel));
      const at = `${label} ${path} ${mode}`;
      check(`${at} 页面底`, g.bodyBg, want.bg);
      check(`${at} 正文`, g.bodyFg, want.fg);
      check(`${at} 硬边`, g.rule, want.rule);
      check(`${at} --bg 变量`, g.vars.bg, mode === '深色' ? '#000' : '#fff');
      check(`${at} --fg 变量`, g.vars.fg, mode === '深色' ? '#fff' : '#000');
      /* color-scheme 两套配色下都是 light dark —— 它声明的是「本页两套都支持」，
         由系统决定用哪套，不是当前用了哪套 */
      check(`${at} color-scheme 声明`, g.scheme, 'light dark');
      if (mutedSel) check(`${at} 次要文字`, g.muted, MUTED);
      if (g.mask) checkTrue(`${at} 遮罩仍是黑（不跟随深色）`,
        /rgb\(0,\s*0,\s*0\)/.test(g.mask) && !/rgb\(255,\s*255,\s*255\)/.test(g.mask));
      await v.close();
    }
  }

  /* 例外①：Lightbox 两套配色下都该是深色遮罩（它是懒创建的，先点开一张图）。 */
  for (const [mode, opt] of [['浅色', { scheme: 'light' }], ['深色', { scheme: 'dark' }]]) {
    const v = await visit('/works/6u104hp/', { waitMs: 1500, ...opt });
    await v.evaluate(`(document.querySelector('.gallery-grid img').click(), 1)`);
    await sleep(500);
    const g = await v.evaluate(`(function(){
      const lb = document.querySelector('.lightbox');
      return { open: !!lb, bg: lb ? getComputedStyle(lb).backgroundColor : null,
               close: lb ? getComputedStyle(lb.querySelector('.lightbox-close')).color : null };
    })()`);
    checkTrue(`Lightbox ${mode} 打开`, g.open);
    check(`Lightbox ${mode} 遮罩两套配色下都是深色`, g.bg, 'rgba(0, 0, 0, 0.92)');
    check(`Lightbox ${mode} 关闭键是白字`, g.close, 'rgb(255, 255, 255)');
    await v.close();
  }
}

/* ---------- 十五、wwhbh 墨层：高度锚在大视口、贴底边，地址栏收放不重建也不平移 ---------- */
console.log('=== 十五、wwhbh 墨层：高度锚在 lvh、贴底边（地址栏收放不重建、不拉伸、不平移）===');
{
  /* 作者 2026-10-07 在 Android Chrome 上先后报了两个现象，同一套机制（**地址栏收放**）：
       「墨水被拉伸、或整体跳一下」→「位置依然会改变（整幅平移）」。
     滚动本身不动 fixed 层，这两条下面都断言了。三层成因：
        ① 墨层原先靠 inset:0 取「当前视口」，地址栏一收放它立刻变高变矮，
           而 canvas 的后备缓冲没变 —— 屏幕上就是整幅墨被纵向拉伸；
        ② 紧接着 js/ink-wwhbh.js 的 350ms 防抖按新的 innerHeight 重算，
           重建整张渗透率场、并把累积层清零 —— 画面跳一下、攒下来的墨全没；
        ③ 高度改成常量之后，墨层仍以**视口顶边**为基准（top:0），而 Android Chrome 的
           地址栏在屏幕顶部、正是从顶部撑大／缩小视口 —— 顶边跟着上下走约 56px，
           于是整幅图案随地址栏平移。底边任何时候都贴着屏幕底边。
     修法三半：css/project.css 高度写 100lvh（大视口＝常量）并**贴底边锚定**
     （@supports 里 top:auto，整块一起生效、一起退化），js/ink-wwhbh.js 的尺寸改读墨层盒子。
      本节断的是：生效的规则里真的带 height:100lvh 与 top:auto（声明被解析进 CSSOM）、
      墨层仍覆盖整个视口、滚动后几何与画面都不动、**只改 innerHeight（＝手机上地址栏
      收放那一下）时后备缓冲与墨像素指纹都不许变**。
      注意：headless 没有浏览器 UI，lvh 与 dvh 数值相同，所以「lvh 恒定」「顶边会随地址栏
      移动、底边不会」这两点都验不了 —— 前者是规范保证（CSS Values 4 的 svh/lvh/dvh），
      后者要真机。这条测试管的是**我们这边的机制**：尺寸取自盒子、不随 innerHeight 重建、
      锚定边写在声明里（改回 top:0 会让下面第二条断言变红）。 */
  const v = await visit('/works/wwhbh/', { waitMs: 900, scheme: 'light', motion: 'no-preference' });
  /* 墨层现在由**两条**规则描述：顶层那条（inset:0 兜底）与 @supports 里那条
     （height:100lvh + top:auto）。@supports 内层是 CSSSupportsRule、没有 selectorText，
     所以要递归进去收；只扫顶层会漏掉真正生效的那条（第一版就这么漏过）。 */
  const g0 = await v.evaluate(`(function(){
    const rules = [];
    const walk = list => { for (const r of list){
      if (r.selectorText === '.wwhbh-ink') rules.push(r.cssText);
      if (r.cssRules) walk(r.cssRules);
    } };
    for (const ss of document.styleSheets){ try { walk(ss.cssRules); } catch(e){} }
    const host = document.getElementById('wwhbh-ink');
    const rect = host.getBoundingClientRect();
    return { rules: rules, supports: CSS.supports('height', '100lvh'),
             top: Math.round(rect.top), bottom: Math.round(rect.bottom),
             innerH: innerHeight, h: Math.round(rect.height) };
  })()`);
  const all = (g0.rules || []).join(' ');
  checkTrue('墨层规则带 height:100lvh', /height:\s*100lvh/.test(all));
  /* 锚定边：top:auto + bottom:0（来自兜底那条的 inset:0）。
     **这一条只能断声明**：headless 没有浏览器 UI，lvh 与 dvh 数值相同，
     改锚定前后几何一模一样（都是铺满视口），所以量不出差别 —— 真机上顶边会随地址栏
     上下走、底边不会，那由作者在手机上确认。 */
  checkTrue('墨层贴底边锚定（top:auto）而不是顶边', /top:\s*auto/.test(all));
  checkTrue('格式串里仍有 inset:0 兜底（不支持 lvh 时靠它）', /inset:\s*0/.test(all));
  checkTrue('本浏览器支持 lvh（不支持时 @supports 整块不生效，下面的断言就失去意义）', g0.supports);
  check('墨层覆盖整个视口（top ≤ 0 且 bottom ≥ 视口高）', g0.top <= 0 && g0.bottom >= g0.innerH, true);

  /* 把墨强制打开：探针带 --deny-permission-prompts，正常运行下墨根本不会长。
     8 秒是留了余量的数 —— 起点在屏幕外左下，最近的可见像素归一化到达时刻约 0.05，
     而一轮 90 秒；实测 3.5 秒（≈0.039 轮）时左下角已经有非零像素，这里取约两倍，
     免得这条断言变成随机失败。 */
  await v.evaluate(`(App.wwhbhInk.resume(true), 1)`);
  await sleep(8000);
  await v.evaluate(`(App.wwhbhInk.pause(), 1)`);   // 冻住：画面从此静态，指纹才可比
  await sleep(300);

  const SNAP = `(function(){
    const host = document.getElementById('wwhbh-ink');
    const cv = document.getElementById('wwhbh-ink-cv');
    const r = host.getBoundingClientRect(), c = cv.getBoundingClientRect();
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let sum = 0, hash = 0;
    for (let p = 3; p < d.length; p += 4){ sum += d[p]; hash = (hash * 31 + d[p]) >>> 0; }
    return { top: Math.round(r.top), hostH: Math.round(r.height), hostW: Math.round(r.width),
             css: [Math.round(c.width), Math.round(c.height)], backing: [cv.width, cv.height],
             inner: [innerWidth, innerHeight], sum: sum, hash: hash };
  })()`;
  const a = await v.evaluate(SNAP);
  check('8 秒后左下角已上墨（alpha 和 > 0，否则下面比的是两张空画布）', a.sum > 0, true);

  /* 滚动：fixed 层钉在视口上，几何与画面都不该动 */
  await v.evaluate(`(window.scrollTo(0, 600), 1)`);
  await sleep(600);
  const b = await v.evaluate(SNAP);
  check('滚动后墨层 top 仍是 0', b.top, 0);
  check('滚动后墨层高／画布 CSS／后备缓冲', [b.hostH, b.css, b.backing], [a.hostH, a.css, a.backing]);
  check('滚动后墨像素指纹', b.hash, a.hash);

  /* 地址栏收放：只改 innerHeight（元素盒子不动），不许重栅格化、不许洗掉累积层。
     innerHeight 是 window 自身的访问器属性，改完**必须把原描述符放回去**（不能 delete：
     delete 会把整个属性删掉，页面后续读 innerHeight 直接 ReferenceError）。 */
  const faked = await v.evaluate(`(function(){
    window.__ihDesc = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    const real = window.innerHeight;
    Object.defineProperty(window, 'innerHeight', { configurable: true, get: function(){ return real + 56; } });
    window.dispatchEvent(new Event('resize'));
    return window.innerHeight;
  })()`);
  await sleep(1200);                                // 防抖 350ms + 生成时间
  const c = await v.evaluate(SNAP);
  check('伪地址栏后 innerHeight（＝手机上收放那一下）', faked, a.inner[1] + 56);
  check('伪地址栏后后备缓冲未变（没有重栅格化）', c.backing, a.backing);
  check('伪地址栏后墨像素指纹未变（累积层保住）', c.hash, a.hash);
  await v.close();
}

console.log('=== 十六、移动端正文行高：手机 2.0（28px）、桌面仍是 2.4（33.6px）===');
{
  /* 2026-10-07 作者定：手机 ≤768px 下，作品页长篇正文（wwhbh／edge／gallery／ecce
     四种布局）的行高从 2.4 收到 2.0，桌面一个字不改。四条覆盖写在 css/project.css
     的 @media(max-width:768px) 里，站内页（about／changelog／404）与 riverrun 说明栏
     不在范围内。
     本节防的是**静默失效** —— 它不是假设，是当天实测出来的：
       ① 覆盖规则的选择器若被简写成裸 `#ecce-desc`，特异性低于原规则
          `.ecce-text #ecce-desc`（id+class），页面上不报错、控制台干净、
          桌面看不出（桌面本来就该 2.4），只有手机上又变回 33.6px；
       ② 谁动了原规则的 2.4，桌面与移动会一起漂。
     两个视口都钉死：移动 28px（2.0 × 14px）、桌面 33.6px（2.4 × 14px）。
     改设计值时必须同时改这里 —— 那正是目的：让改动永远是有意识的。
     末条反向断言站内页没被「顺手统一」铺上 2.0，用比值而不是像素，
     免得 About 页字号将来一改就误报。 */
  const CASES = [
    { path: '/works/wwhbh/',      sel: '#wwhbh-desc',   layout: 'wwhbh' },
    { path: '/works/edgedgedge/', sel: '#edge-desc',    layout: 'edge' },
    { path: '/works/6u104hp/',    sel: '#gallery-desc', layout: 'gallery' },
    { path: '/works/ecce-homo/',  sel: '#ecce-desc',    layout: 'ecce' }
  ];
  const LH = sel => `(function(){
    const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return null;
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight), fs = parseFloat(cs.fontSize);
    return { lh: cs.lineHeight, ratio: Math.round(lh / fs * 100) / 100, fs: cs.fontSize,
             narrow: matchMedia('(max-width:768px)').matches, w: innerWidth };
  })()`;
  const MOBILE = { width: 390, height: 844 };
  for (const c of CASES) {
    const vm = await visit(c.path, { waitMs: 900, viewport: MOBILE });
    const m = await vm.evaluate(LH(c.sel));
    checkTrue(`移动端 390×844 确实命中窄栏媒体查询 · ${c.layout}`, m && m.narrow);
    check(`移动端正文行高 28px（2.0 × 14px）· ${c.layout}`, m && m.lh, '28px');
    await vm.close();

    const vd = await visit(c.path, { waitMs: 900 });
    const d = await vd.evaluate(LH(c.sel));
    checkTrue(`桌面 1280×900 不命中窄栏媒体查询 · ${c.layout}`, d && !d.narrow);
    check(`桌面正文行高仍是 33.6px（2.4 × 14px）· ${c.layout}`, d && d.lh, '33.6px');
    await vd.close();
  }
  const va = await visit('/about/', { waitMs: 900, viewport: MOBILE });
  const a = await va.evaluate(`(function(){
    const cs = getComputedStyle(document.querySelector('.bio p'));
    return Math.round(parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) * 100) / 100;
  })()`);
  check('About 页正文没被顺手统一（行高比仍是 1.9）', a, 1.9);
  await va.close();
}

/* ---------- 十七、首页展签：逐张对应 + 年份与作品页信息栏一致（静态比对） ----------
   展签的事实行是「年份 · 形态」，从作品页信息栏抄来。形态是人工压短的（有些作品的形态在
   信息栏里是一整句，例如 wwhbh），没法机器比对；**年份可以**，而年份正是最容易漂的那项
   （作品页改了创作年份、首页展签不会自己跟着变）。这里逐件拆出两边的年份串比一遍。
   静态读文件即可，不需要浏览器 —— 放在最后，与第十二节同一路数。 */
console.log('=== 十七、首页展签：8 张逐张对应，年份与 data/<id>/*.html 逐字一致 ===');
{
  const idx = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const i18n = readFileSync(join(ROOT, 'js', 'index-i18n.js'), 'utf8');

  /* 按卡片切开 index.html：切点写成正则 `<div class="card"` 或 `<div class="card `（后者是
     riverrun 那张带 lowercase 的）—— 写成 '<div class="card' 会把展签那一层
     '<div class="card-label"' 也切开，于是多出 8 段没有 data-project 的假卡片。 */
  const cards = idx.split(/<div class="card(?:"| )/).slice(1).map(ch => ({
    id:        (ch.match(/data-project="([^"]+)"/) || [])[1] || null,
    titleKey:  (ch.match(/card-label-title" data-i18n="([A-Za-z0-9_]+)"/) || [])[1] || null,
    factsKey:  (ch.match(/card-label-facts" data-i18n="([A-Za-z0-9_]+)"/) || [])[1] || null,
    fallback:  (ch.match(/card-fallback" data-i18n="([A-Za-z0-9_]+)"/) || [])[1] || null
  }));

  check('解析到 8 张卡片', cards.length, 8);
  check('每张卡片都带展签的两个键', cards.filter(c => c.titleKey && c.factsKey).length, 8);
  check('展签标题行与卡片兜底文字共用同一个键（不另抄一份文案）',
    cards.filter(c => c.titleKey === c.fallback).length, 8);
  check('8 个展签事实键互不重复', new Set(cards.map(c => c.factsKey)).size, 8);

  /* 信息栏第一行是「创作年份／Year」，第二行是「形态／Type」（STYLEGUIDE §7 的固定八行顺序） */
  const metaYear = (id, lang) => {
    const t = readFileSync(join(ROOT, 'data', id, lang + '.html'), 'utf8');
    const m = t.match(/<span class="work-meta-k">(?:创作年份|Year)<\/span><span class="work-meta-v">([^<]*)</);
    return m ? m[1].trim() : null;
  };
  /* 展签里「年份 · 形态」，年份就是第一个分隔符之前那段 */
  const labelYear = (key, lang) => {
    const m = i18n.match(new RegExp(key + ":\\s*\\{[^}]*?" + lang + ":'([^']*)'"));
    return m ? m[1].split(' · ')[0].trim() : null;
  };

  const bad = [];
  let pairs = 0;
  for (const c of cards) {
    for (const lang of ['zh', 'en']) {
      const want = metaYear(c.id, lang), got = labelYear(c.factsKey, lang);
      pairs++;
      if (!want || want !== got) bad.push(`${c.id} ${lang}: 展签「${got}」≠ 信息栏「${want}」`);
    }
  }
  check('8 件 × 中英 = 16 处年份都能解析出来', pairs, 16);
  check('16 处年份与作品页信息栏逐字一致', bad, []);
}

/* ---------- 汇总 ---------- */
console.log('\n================ 结果 ================');
console.log(`通过 ${pass} 项，失败 ${fail} 项`);
if (failures.length) {
  console.log('\n失败明细：');
  for (const f of failures) console.log('  ✗ ' + f);
}
await browser.send('Browser.close').catch(() => {});
chrome.kill();
process.exit(fail ? 1 : 0);
