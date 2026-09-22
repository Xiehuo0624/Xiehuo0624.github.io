#!/usr/bin/env node
/* 新旧 JS 混用演练：把 app.js 替换成「没有 App.projectHref 的那一版」（模拟访问者浏览器里
 * 4 小时缓存中的旧文件），验证 nav.js 顶部的兜底真的把链接退化成旧的 ?project= 形式，
 * 而不是 TypeError / 死链 / 整块导航不渲染。
 * 用法：先起本地服务，再 node scripts/verify/mixed-gen.mjs
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT_TMP = join(HERE, '..', '..', 'tmp', 'verify-artifacts');   // 运行产物（profile／假 HOME）落在 gitignore 的 tmp/ 下
mkdirSync(ROOT_TMP, { recursive: true });
const ROOT = join(HERE, '..', '..');
const BASE = 'http://127.0.0.1:8765', PORT = 9338;

/* 旧版 app.js = 现版本去掉「作品页地址」整节 */
/* 旧版 i18n.js = 现版本去掉「init() 合并公共字符串」这一手（即 2026-09-22 之前的行为） */
const i18nNow = readFileSync(join(ROOT, 'js', 'i18n.js'), 'utf8');
const OLD_I18N_JS = i18nNow.replace('Object.assign({}, App.COMMON_I18N, data)', 'data');
if (OLD_I18N_JS === i18nNow) { console.error('构造旧版 i18n.js 失败：没找到合并那一行'); process.exit(2); }

const current = readFileSync(join(ROOT, 'js', 'app.js'), 'utf8');
const cut = current.indexOf('/* ===== 作品页地址');
const OLD_APP_JS = cut === -1 ? current : current.slice(0, cut);
if (/projectHref/.test(OLD_APP_JS)) { console.error('构造旧版失败：仍含 projectHref'); process.exit(2); }
console.log(`旧版 app.js 已构造：${OLD_APP_JS.length} 字节（现版 ${current.length} 字节），不含 projectHref ✓`);

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-sandbox', '--disable-breakpad',
   '--use-mock-keychain', '--password-store=basic', `--user-data-dir=${join(ROOT_TMP,'profile-mixed')}`,
   '--no-first-run', '--no-default-browser-check', 'about:blank'],
  { stdio: 'ignore', env: { ...process.env, HOME: join(ROOT_TMP, 'home') } });
let v = null;
for (let i = 0; i < 80 && !v; i++) { try { v = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(250); } }
const ws = new WebSocket(v.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let seq = 0; const pending = new Map(); const listeners = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else listeners.forEach(f => f(m)); };
const send = (method, params = {}, sessionId) => new Promise(res => { const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });

let pass = 0, fail = 0; const failures = [];
const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; failures.push(`${name}: 实际 ${JSON.stringify(got)} 期望 ${JSON.stringify(want)}`); } };

/* 两种混用情形：A=旧 app.js（缺 projectHref）；B=旧 i18n.js（不合并公共字符串）。
   两种都要求：页面照常渲染、无 JS 异常；退化只应体现在「地址是旧的」或「文案回落到硬编码中文」。 */
const CASES = [
  ['A 旧 app.js', 'app.js', OLD_APP_JS, ['/index.html?lang=zh', '/works.html?lang=zh', '/project-template.html?project=riverrun&lang=zh', '/works/riverrun/zh/']],
  ['B 旧 i18n.js', 'i18n.js', OLD_I18N_JS, ['/works.html?lang=en', '/about.html?lang=en', '/changelog.html?lang=en', '/works/spectral-dissector/']]
];
for (const [label, intercept, body, paths] of CASES) {
  console.log(`\n########## ${label}（拦截 js/${intercept} 换成旧版）##########`);
  for (const path of paths) {
  const { result: { browserContextId } } = await send('Target.createBrowserContext');
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const errors = [];
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Fetch.enable', { patterns: [{ urlPattern: '*js/' + intercept + '*', requestStage: 'Request' }] }, sessionId);
  listeners.push(msg => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Fetch.requestPaused') {
      send('Fetch.fulfillRequest', {
        requestId: msg.params.requestId, responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/javascript; charset=utf-8' }],
        body: Buffer.from(body).toString('base64')
      }, sessionId);
    }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push('console.error');
  });
  const loaded = new Promise(res => listeners.push(m => { if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') res(); }));
  await send('Page.navigate', { url: BASE + path }, sessionId);
  await Promise.race([loaded, sleep(15000)]); await sleep(900);

  const raw = await send('Runtime.evaluate', { expression: `JSON.stringify({
    hasFn: typeof App.projectHref === 'function',
    navBack: !!document.querySelector('.back a'),
    navLinks: [...document.querySelectorAll('.nav-bottom-left a')].map(a=>a.getAttribute('href')),
    cardHref: (document.querySelector('.card')||{}).dataset ? document.querySelector('.card').dataset.href : null,
    workLinks: [...document.querySelectorAll('.works-item, .project-related-link')].map(a=>a.getAttribute('href')),
    title: document.title,
    backText: (document.querySelector('.back a')||{}).textContent || null,
    toggleText: (document.querySelector('#lang-toggle')||{}).textContent || null,
    descLen: ((document.querySelector('[data-desc-lang]')||{}).textContent||'').trim().length
  })`, returnByValue: true }, sessionId);
  if (raw.result?.result?.value === undefined) {
    console.log('\n' + path + '\n  求值失败:', JSON.stringify(raw.result).slice(0, 300));
    check(`${path} 页面可求值`, false, true);
    await send('Target.disposeBrowserContext', { browserContextId });
    continue;
  }
  const d = JSON.parse(raw.result.result.value);
  console.log('\n' + path);
  console.log('  ' + JSON.stringify(d));
  check(`${path} 无 JS 异常`, errors, []);
  if (label.startsWith('A')) {
    check(`${path} 导航已渲染`, d.navBack || d.navLinks.length > 0, true);
    check(`${path} 兜底函数存在`, d.hasFn, true);
    /* 导航分两种：烤在 HTML 里的静态导航（首页、/zh/、生成页）不受 JS 世代影响，
       仍是新的目录式地址；由 nav.js 动态创建的（旧地址页面）在新旧混用时退化为旧链接。
       两种都必须是指向正确目标的可用链接 —— 这一条才是关键。 */
    const navProjects = d.navLinks.filter(h => !/^(works|about|changelog)\.html/.test(h) && h !== '#' && h !== './');
    if (navProjects.length) check(`${path} 导航里的作品链接可用`,
      navProjects.every(h => /^(project-template\.html\?project=|works\/[^/]+\/)/.test(h)), true);
    if (d.workLinks.length) check(`${path} 作品链接退化为旧链接`, d.workLinks.every(h => /^project-template\.html\?project=/.test(h)), true);
    const navPages = d.navLinks.filter(h => /^(about|changelog|works)\.html/.test(h));
    if (navPages.length) check(`${path} 站内页链接退化为旧地址`, navPages.every(h => /^(about|changelog|works)\.html(\?lang=zh)?$/.test(h)), true);
    if (path.startsWith('/works/')) check(`${path} 作品页仍正常渲染`, d.descLen > 200, true);
  } else {
    /* 旧引擎不合并公共字符串：导航文案应回落到 HTML 里的硬编码中文，但绝不该崩 */
    check(`${path} 导航仍渲染`, d.navBack || d.navLinks.length > 0, true);
    check(`${path} 文案回落到硬编码默认值`, [d.backText, d.toggleText], ['[<- 返回]', '[en] English']);
    check(`${path} 页面内容仍在`, d.title.length > 0, true);
  }
  await send('Target.disposeBrowserContext', { browserContextId });
  }
}
console.log(`\n==== 混用演练：通过 ${pass}，失败 ${fail} ====`);
for (const f of failures) console.log('  ✗ ' + f);
await send('Browser.close').catch(()=>{}); chrome.kill();
process.exit(fail ? 1 : 0);
