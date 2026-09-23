#!/usr/bin/env node
/* 作品页改造的实测验证：headless Chrome + CDP。
 * 覆盖：16 个生成页的结构/元信息/媒体/正文、旧地址、语言切换跳转、
 *       首页卡片与作品列表链接、404 页、以及控制台报错与 4xx 请求。
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
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
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
async function visit(path, { waitMs = 700, clickSelector = null, afterClickMs = 900, noJs = false } = {}) {
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
  { id: 'the-just-type-study', layout: 'ecce',    zh: 'The JustType Study', en: 'The JustType Study', media: 'img+audio', n: 1 },
  { id: 'the-induction-mixer', layout: 'gallery', zh: 'THE INDUCTION MIXER', en: 'THE INDUCTION MIXER', media: 'gallery', n: 3 },
  { id: 'riverrun',           layout: 'mixer',   zh: 'riverrun',           en: 'riverrun',           media: 'none', n: 0 },
  { id: 'edgedgedge',         layout: 'edge',    zh: 'EDGEDGEDGE',         en: 'EDGEDGEDGE',         media: 'iframe', n: 1 },
  { id: 'spectral-dissector', layout: 'ecce',    zh: 'SPECTRAL DISSECTOR', en: 'SPECTRAL DISSECTOR', media: 'img', n: 1 },
  { id: 'ecce-homo',          layout: 'ecce',    zh: '瞧！这个人',          en: 'ECCE HOMO',          media: 'img+audio', n: 1 },
  { id: 'wwhbh',              layout: 'wwhbh',   zh: '我们将会曾经在这里',   en: 'WE WILL HAVE BEEN HERE', media: 'none', n: 0 }
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
      audios: document.querySelectorAll('.ecce-audio').length,
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
    if (p.media === 'iframe') check(`${tag} bilibili iframe 数量`, info.iframes, 1);
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

console.log('=== 二、语言切换 = 跳到另一语言目录 ===');
{
  const v = await visit('/works/spectral-dissector/zh/', { clickSelector: '#lang-toggle', afterClickMs: 1200 });
  const url = await v.evaluate('location.pathname');
  check('中文页点切换 → 英文目录', url, '/works/spectral-dissector/');
  const lang = await v.evaluate('document.documentElement.dataset.lang');
  check('落地页语言为 en', lang, 'en');
  await v.close();
}
{
  const v = await visit('/works/spectral-dissector/', { clickSelector: '#lang-toggle', afterClickMs: 1200 });
  const url = await v.evaluate('location.pathname');
  check('英文页点切换 → 中文目录', url, '/works/spectral-dissector/zh/');
  await v.close();
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
    links: [...document.querySelectorAll('.notfound-links a')].map(a=>a.getAttribute('href')),
    css: !!getComputedStyle(document.querySelector('.notfound-page')).maxWidth
  })`);
  checkTrue('404 中文文案', /地址/.test(info.lead));
  check('404 标题', info.h1, '404');
  check('404 出口指向目录式地址（随语言）', info.links, ['zh/', 'works/zh/']);
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
    check(`changelog(${lang}) 脚本已提号`, info.script, 'js/changelog.js?v=19');
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
  /* 为什么单独立一节：主字体 URL 的 ?v= 被硬编码在**四处** ——
     ① css/base.css 的 @font-face（权威来源）、② scripts/gen-pages.mjs 的预载常量、
     ③ scripts/gen-projects.mjs 的预载常量、④ 五个手写模板的预载（它们由浏览器直接服务，
     没有构建步骤能替它们生成，只能手改）。四处只要有一处漏改，预载与 @font-face 就成了
     两个缓存键，同一份字体白下两遍（274KB）。
     2026-09-22 一天之内发生了两次：作品页预载漏 ?v=（白下 267.7KB）、五个旧地址模板漏 ?v=。
     人记不住，所以让脚本记住：任何一处与 base.css 不同就直接失败。 */
  const baseCss = readFileSync(join(ROOT, 'css', 'base.css'), 'utf8');
  const canonical = (baseCss.match(/url\('(fonts\/SourceHanSansSC-Regular\.woff2\?v=\d+)'\)/) || [])[1] || null;
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
    for (const m of text.matchAll(/SourceHanSansSC-Regular\.woff2(\?v=\d+)?/g)) {
      refs++;
      const found = 'SourceHanSansSC-Regular.woff2' + (m[1] || '（无 ?v=）');
      if (found !== wantTail) mismatched.push(`${rel} → ${found}`);
    }
  }
  checkTrue(`扫到主字体 URL 引用（当前 ${refs} 处）`, refs > 0);
  check(`与 css/base.css 不一致的引用（须为空）`, mismatched, []);

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
