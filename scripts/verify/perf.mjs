#!/usr/bin/env node
/* 作品页首屏实测：冷缓存 + 150ms RTT / 1.6Mbps（与 PERFORMANCE.md 既有口径一致），
 * 对比「旧地址 project-template.html?project=…」与「生成页 works/<id>/」的首屏时刻与请求数。
 * 用法：先起本地服务（python3 -m http.server 8765），再 node scripts/verify/perf.mjs [重复次数]
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT_TMP = join(HERE, '..', '..', 'tmp', 'verify-artifacts');   // 运行产物（profile／假 HOME）落在 gitignore 的 tmp/ 下
mkdirSync(ROOT_TMP, { recursive: true });
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const PORT = 9334;
const RUNS = Number(process.argv[2] || 3);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--no-sandbox', '--disable-breakpad',
  /* 不碰真实钥匙串：否则 Chrome 会去读写 macOS 的「Chrome Safe Storage」条目，
     每启动一次就在屏幕上弹一次系统授权框（约束见 AGENTS.md §3）。 */
  '--use-mock-keychain', '--password-store=basic',
  `--user-data-dir=${join(ROOT_TMP, 'profile-perf')}`, '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--window-size=1280,900', 'about:blank'
], { stdio: 'ignore', env: { ...process.env, HOME: join(ROOT_TMP, 'home') } });

let version = null;
for (let i = 0; i < 80 && !version; i++) {
  try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(250); }
}
if (!version) { console.error('Chrome 起不来'); process.exit(2); }

const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pending = new Map(); const listeners = [];
ws.onmessage = ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else for (const fn of listeners) fn(msg);
};
const send = (method, params = {}, sessionId) => new Promise(res => {
  const id = ++seq; pending.set(id, res);
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});
const evaluate = async (sid, expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }, sid);
  return r.result?.result?.value;
};

async function measure(path) {
  const { result: { browserContextId } } = await send('Target.createBrowserContext');
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  /* LCP 必须先装观察器才会被记录；用 addScriptToEvaluateOnNewDocument 保证它在页面脚本之前跑。 */
  await send('Page.addScriptToEvaluateOnNewDocument', { source:
    "window.__lcp=0;window.__heroEnd=0;" +
    "try{new PerformanceObserver(function(l){for(const e of l.getEntries())window.__lcp=Math.round(e.startTime);})" +
    ".observe({type:'largest-contentful-paint',buffered:true});}catch(e){}" +
    "window.addEventListener('load',function(){try{" +
    "const r=performance.getEntriesByType('resource').filter(function(x){return /spectral-dissector-2|grid-media|ecce-media/.test(x.name);});" +
    "if(r.length)window.__heroEnd=Math.round(Math.max.apply(null,r.map(function(x){return x.responseEnd;})));" +
    "}catch(e){}});"
  }, sessionId);
  await send('Network.enable', {}, sessionId);
  await send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId);
  await send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 96 * 1024
  }, sessionId);

  const reqs = [];
  const onMsg = msg => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Network.responseReceived') reqs.push({ url: msg.params.response.url, type: msg.params.type });
  };
  listeners.push(onMsg);

  const loaded = new Promise(res => listeners.push(m => { if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') res(); }));
  await send('Page.navigate', { url: BASE + path }, sessionId);
  await Promise.race([loaded, sleep(30000)]);
  await sleep(600);

  const data = await evaluate(sessionId, `(function(){
    const paints = {};
    performance.getEntriesByType('paint').forEach(e => paints[e.name] = Math.round(e.startTime));
    const lcp = performance.getEntriesByType('largest-contentful-paint');
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const res = performance.getEntriesByType('resource');
    return {
      fcp: paints['first-contentful-paint'] ?? null,
      lcp: window.__lcp || (lcp.length ? Math.round(lcp[lcp.length - 1].startTime) : null),
      heroEnd: window.__heroEnd || null,
      htmlKB: Math.round((nav.transferSize || 0) / 1024),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
      load: Math.round(nav.loadEventEnd || 0),
      requests: res.length + 1,
      transferKB: Math.round((res.reduce((s, r) => s + (r.transferSize || 0), 0) + (nav.transferSize || 0)) / 1024),
      descFetched: res.some(r => /\\/data\\/[^/]+\\/(en|zh)\\.html$/.test(r.name)),
      heroInHTML: !!document.querySelector('#ecce-media img[src*="spectral-dissector-2"]')
    };
  })()`);
  await send('Target.disposeBrowserContext', { browserContextId });
  return data;
}

const median = xs => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

const cases = [
  ['旧地址  project-template.html?project=spectral-dissector', '/project-template.html?project=spectral-dissector'],
  ['生成页  works/spectral-dissector/', '/works/spectral-dissector/']
];

console.log(`冷缓存 + 150ms RTT / 1.6Mbps，每项 ${RUNS} 次取中位数（单位 ms）\n`);
const rows = {};
for (const [label, path] of cases) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(await measure(path));
  const m = {
    fcp: median(runs.map(r => r.fcp)),
    lcp: median(runs.map(r => r.lcp)),
    hero: median(runs.map(r => r.heroEnd).filter(Boolean)) || null,
    html: median(runs.map(r => r.htmlKB)),
    dcl: median(runs.map(r => r.domContentLoaded)),
    load: median(runs.map(r => r.load)),
    req: median(runs.map(r => r.requests)),
    kb: median(runs.map(r => r.transferKB)),
    desc: runs[0].descFetched,
    hero: runs[0].heroInHTML
  };
  rows[label] = m;
  console.log(`${label}`);
  console.log(`   FCP ${m.fcp}ms   LCP ${m.lcp}ms   主图完成 ${m.hero}ms   DCL ${m.dcl}ms   load ${m.load}ms`);
  console.log(`   HTML ${m.html}KB`);
  console.log(`   请求 ${m.req} 条   传输 ${m.kb}KB   正文片段另发 fetch：${m.desc ? '是' : '否'}   主图已在 HTML 里：${m.hero ? '是' : '否'}\n`);
}

const [a, b] = Object.values(rows);
console.log('差值（生成页 − 旧地址）：');
console.log(`   FCP ${b.fcp - a.fcp}ms   LCP ${b.lcp - a.lcp}ms   主图 ${(b.hero && a.hero) ? b.hero - a.hero : '—'}ms   DCL ${b.dcl - a.dcl}ms   load ${b.load - a.load}ms   请求 ${b.req - a.req} 条   传输 ${b.kb - a.kb}KB`);

await send('Browser.close').catch(() => {});
chrome.kill();
