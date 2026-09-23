#!/usr/bin/env node
/* ============================================================================
 * 站内页面静态生成器（首页／作品列表／简介／进程日志）
 * ============================================================================
 *
 * 与 scripts/gen-projects.mjs 同一套思路，解决同一类问题：
 *
 *   ① **地址**：这四页原先靠 `works.html`、`?lang=zh` 表达页面与语言，与作品页的
 *      `works/<id>/`、`works/<id>/zh/` 是两套机制。现在统一为目录式：
 *          首页 / 与 /zh/            作品列表 /works/ 与 /works/zh/
 *          简介 /about/ 与 /about/zh/  进程日志 /changelog/ 与 /changelog/zh/
 *   ② **内容**：这四页的正文原先全由 JS 注入，不跑 JS 的抓取者只看到空容器，
 *      而硬编码的占位文字还是中文（英文读者看到「关于」「作品列表」「进程日志」）。
 *      生成时把该语言的内容直接写进 HTML：简介的 8 段正文、作品列表的 8 条链接、
 *      导航里的站内链接（含首页那条静态作品链接行，见下）。
 *
 * 模板就是根目录那四个 HTML 本身（它们同时仍是可用的旧地址页面）：
 *   index.html / works.html / about.html / changelog.html
 * `<!-- gen:legacy-only:… -->` 标出的区块只在旧地址里生效（按 ?lang= 定语言、
 * 绘制前定文案等），生成页把它们换成「写死语言」的版本。
 *
 * 首页的英文规范地址就是 `/`，也就是 index.html 自己 —— 所以生成器**不写 index.html**，
 * 只从它派生出 `zh/index.html`；index.html 上以 `gen:legacy-only` 标出的
 * `?lang=zh → /zh/` 兼容跳转只在它自己身上保留。
 *
 * 用法：
 *   node scripts/gen-pages.mjs            # 生成
 *   node scripts/gen-pages.mjs --check    # 只比对不写入，漂移时退出码 1
 * ==========================================================================*/

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const PAGES = [
  {
    name: 'index', template: 'index.html', i18n: ['js/index-i18n.js', 'INDEX_I18N'],
    title: { en: 'Xiehuo — Cao Haoxuan', zh: '泻火 曹浩轩' },
    desc: {
      en: 'Sound art, instrument design and interactive work by Cao Haoxuan (Xiehuo): eight works, from a spectral separation plugin to an electromagnetic mixer.',
      zh: '曹浩轩（泻火）的声音作品、乐器设计与交互作品：从频谱分离插件到电磁感应混音器，共八件。'
    },
    /* index.html 自己就是英文规范地址，故只生成中文那份 */
    outputs: [{ lang: 'zh', path: 'zh/index.html' }],
    cornerNav: true
  },
  {
    name: 'works', template: 'works.html', i18n: ['js/works-i18n.js', 'WORKS_I18N'],
    title: { en: 'WORKS', zh: '作品列表' },
    desc: {
      en: 'All works by Cao Haoxuan (Xiehuo) with one-line summaries: instruments, plugins, sound works and installations.',
      zh: '曹浩轩（泻火）的全部作品与一句话简介：乐器、插件、声音作品与装置。'
    },
    outputs: [{ lang: 'en', path: 'works/index.html' }, { lang: 'zh', path: 'works/zh/index.html' }],
    backNav: true, bakeWorksList: true
  },
  {
    name: 'about', template: 'about.html', i18n: ['js/about-i18n.js', 'ABOUT_I18N'],
    title: { en: 'ABOUT', zh: '关于' },
    desc: {
      en: 'About Cao Haoxuan (Xiehuo): background, practice and contact.',
      zh: '关于曹浩轩（泻火）：经历、创作方向与联系方式。'
    },
    outputs: [{ lang: 'en', path: 'about/index.html' }, { lang: 'zh', path: 'about/zh/index.html' }],
    backNav: true
  },
  {
    name: 'changelog', template: 'changelog.html', i18n: ['js/changelog-i18n.js', 'CHANGELOG_I18N'],
    title: { en: 'CHANGELOG', zh: '进程日志' },
    desc: {
      en: 'A dated log of work on this site and on the works themselves, with the reasons behind each change.',
      zh: '本站与作品本身的带日期进程日志，含每处改动的原因。'
    },
    /* 正文（98 条日志）刻意不烤：日志页靠点进来读，不靠搜索发现；
       全烤会让 HTML 涨到约 200KB × 2 语言。标题与元信息照旧烤好。 */
    outputs: [{ lang: 'en', path: 'changelog/index.html' }, { lang: 'zh', path: 'changelog/zh/index.html' }],
    backNav: true
  }
];

const LANG_DIR = { en: '', zh: 'zh/' };
const OG_LOCALE = { en: 'en_US', zh: 'zh_CN' };
const SITE_NAME = { en: 'Xiehuo — Cao Haoxuan', zh: '泻火 曹浩轩' };

const failures = [];
const must = (cond, msg) => { if (!cond) failures.push(msg); return cond; };
const fail = msg => failures.push(msg);

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- 读输入 ---------- */

function readOrigin() {
  const host = readFileSync(join(ROOT, 'CNAME'), 'utf8').trim();
  must(/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host), `CNAME 内容不像域名：${JSON.stringify(host)}`);
  return 'https://' + host;
}

function evalApp(file) {
  const ctx = { App: {} };
  vm.createContext(ctx);
  try {
    vm.runInContext(readFileSync(join(ROOT, file), 'utf8'), ctx, { filename: file });
  } catch (e) {
    fail(`${file} 求值失败：${e.message}`);
  }
  return ctx.App;
}

/* 公共字符串（返回、语言切换、四角导航里的站内链接）也要用，故从 js/i18n.js 里取出来 */
function readCommonI18n() {
  const src = readFileSync(join(ROOT, 'js', 'i18n.js'), 'utf8');
  const block = /App\.COMMON_I18N\s*=\s*\{([\s\S]*?)\n  \};/.exec(src);
  if (!must(block, 'js/i18n.js 里找不到 App.COMMON_I18N 区块')) return {};
  const ctx = { App: {} };
  vm.createContext(ctx);
  vm.runInContext('App.COMMON_I18N = {' + block[1] + '\n};', ctx);
  return ctx.App.COMMON_I18N;
}

/* ---------- 通用替换工具 ---------- */

function replaceOnce(html, needle, replacement, what) {
  const n = html.split(needle).length - 1;
  must(n === 1, `${what}：匹配到 ${n} 处（应为 1 处）：${JSON.stringify(String(needle).slice(0, 50))}`);
  return n === 1 ? html.replace(needle, replacement) : html;
}

/* ---------- 页面骨架 ---------- */

/** 主字体 URL（含 ?v=），**从 css/base.css 现读**，不在这里硬编码。
 *  理由见 scripts/gen-projects.mjs 里同名函数的注释：版本号原有四份副本，
 *  漏同步一处就白下 274KB 字体。剩下三处（base.css 自身与五个手写模板）
 *  由 scripts/verify/verify.mjs 第十二节逐字比对兜住。 */
function mainFontHref(){
  const css = readFileSync(join(ROOT, 'css', 'base.css'), 'utf8');
  const m = css.match(/url\('fonts\/(SourceHanSansSC-Regular\.woff2\?v=\d+)'\)/);
  if (!m) fail('css/base.css 里找不到带版本号的主字体 URL —— 预载 URL 无从生成');
  return '/css/fonts/' + (m ? m[1] : '');
}

const FONT_PRELOAD = `<script>
/* 生成页：语言由路径写死，只保留「中文界面才预载中日韩字体」这一条性能决策。
   预载 URL 由 mainFontHref() 从 css/base.css 现读，不在这里硬编码版本号。 */
(function(){try{if(document.documentElement.dataset.lang!=='zh')return;var f=document.createElement('link');f.rel='preload';f.as='font';f.type='font/woff2';f.crossOrigin='anonymous';f.href='${mainFontHref()}';document.head.appendChild(f);}catch(e){}})();
</script>`;

function applyLegacyRegions(html, where) {
  let out = html;
  for (const name of ['lang', 'prepaint']) {
    const re = new RegExp('<!-- gen:legacy-only:' + name + ' -->[\\s\\S]*?<!-- /gen:legacy-only:' + name + ' -->');
    const hits = out.match(new RegExp(re.source, 'g'));
    if (!must(hits && hits.length === 1,
      `${where}：模板里 gen:legacy-only:${name} 标记应恰好 1 处，实际 ${hits ? hits.length : 0} 处`)) continue;
    out = out.replace(re, name === 'lang'
      ? FONT_PRELOAD
      : '<!-- 绘制前定文案的内联脚本已由生成器删除：文案在生成时按语言烤好，不需要运行时再定 -->');
  }
  must(!/gen:legacy-only/.test(out), `${where}：生成结果里残留 gen:legacy-only 标记`);
  return out;
}

/* 把 [data-i18n="key"] 元素的文本烤成目标语言（元素本身保留 data-i18n，运行时切换仍由 apply() 接管） */
function bakeI18nText(html, data, lang, where) {
  let out = html;
  const re = /<([a-z][a-z0-9]*)([^>]*\bdata-i18n="([A-Za-z0-9_]+)"[^>]*)>([\s\S]*?)<\/\1>/g;
  let missing = [];
  out = out.replace(re, (m, tag, attrs, key, inner) => {
    const entry = data[key];
    if (!entry || typeof entry[lang] !== 'string') { missing.push(key); return m; }
    return `<${tag}${attrs}>${esc(entry[lang])}</${tag}>`;
  });
  if (missing.length) fail(`${where}：i18n 数据里没有这些键，无法烤入：${[...new Set(missing)].join(', ')}`);
  return out;
}

/* 首尾导航也烤成静态链接：不跑 JS 的抓取者因此能沿着 首页 → 作品列表 → 各作品 走 */
function bakeBackNav(html, c, lang) {
  const bar = `<div class="back" data-baked="1">` +
    `<a href="${esc(pageHref('index', lang))}" data-i18n="back">${esc(c.back[lang])}</a>` +
    `<a href="#" id="lang-toggle" data-i18n="langToggle">${esc(c.langToggle[lang])}</a>` +
    `</div>\n`;
  return replaceOnce(html, '<body>\n', '<body>\n\n' + bar, '生成页：插入返回栏');
}

function pageHref(name, lang) {
  const base = (name === 'index') ? './' : name + '/';
  return base + (lang === 'zh' ? 'zh/' : '');
}

/* 作品页在 works/ 下，与四个站内页不是同一层 */
function projectHref(id, lang) {
  return 'works/' + id + '/' + (lang === 'zh' ? 'zh/' : '');
}

function bakeCornerNav(html, c, lang) {
  const topLeft =
    `<a href="${esc(pageHref('about', lang))}" data-i18n="about">${esc(c.about[lang])}</a>` +
    `<a href="${esc(pageHref('changelog', lang))}" data-i18n="changelog">${esc(c.changelog[lang])}</a>`;
  const bottomLeft =
    `<a href="${esc(projectHref('ecce-homo', lang))}" data-i18n="linkEcce">${esc(c.linkEcce[lang])}</a>` +
    `<a href="${esc(projectHref('riverrun', lang))}" class="nav-lowercase" data-i18n="linkRiverrun">${esc(c.linkRiverrun[lang])}</a>` +
    `<a href="${esc(projectHref('spectral-dissector', lang))}" data-i18n="linkSpectral">${esc(c.linkSpectral[lang])}</a>` +
    `<a href="${esc(pageHref('works', lang))}" class="nav-all-works" data-i18n="allWorks">${esc(c.allWorks[lang])}</a>`;
  const toggle = `<a href="#" id="lang-toggle" data-i18n="langToggle">${esc(c.langToggle[lang])}</a>`;

  /* 首页（index.html）自己写死了一份英文四角导航当骨架，故这里替换其内容而不是再插一份；
     其余页面的模板里没有导航，整套插在 </body> 前。 */
  if (html.includes('class="nav-top-left"')) {
    const fill = (cls, inner) => {
      const re = new RegExp('(<div class="' + cls + '"[^>]*>)[\\s\\S]*?(</div>)');
      must(re.test(html), `生成页：替换 ${cls} 内容时找不到容器`);
      html = html.replace(re, '$1' + inner + '$2');
    };
    fill('nav-top-left', topLeft);
    fill('nav-bottom-left', bottomLeft);
    fill('nav-bottom-right', toggle);
    return html;
  }
  const wrap = `<div class="nav-top-left">${topLeft}</div>\n` +
    `<div class="nav-top-right" id="name-easter">泻火 曹浩轩</div>\n` +
    `<div class="nav-bottom-left">${bottomLeft}</div>\n` +
    `<div class="nav-bottom-right">${toggle}</div>\n`;
  return replaceOnce(html, '</body>', wrap + '\n</body>', '生成页：插入四角导航');
}

/* 作品列表：8 条静态 <a>，爬虫因此能从这里走到每个作品页 */
function bakeWorksList(html, app, lang) {
  const items = app.projectOrder.map(id => {
    const p = app.projects[id];
    if (!p) { fail(`projectOrder 里的 ${id} 不在 projects 里`); return ''; }
    const cls = 'works-title' + (p.lowercase ? ' lowercase' : '');
    const brief = (p.brief && p.brief[lang]) ? `<span class="works-brief">${esc(p.brief[lang])}</span>` : '';
    return `<a class="works-item" href="${esc(projectHref(id, lang))}">` +
      `<span class="${cls}">${esc(p.title[lang])}</span>${brief}</a>`;
  }).join('\n');
  const out = replaceOnce(html, '<div id="works-list"></div>',
    `<div id="works-list" data-baked-lang="${lang}">\n${items}\n</div>`, '生成页：烤入作品列表');
  return out;
}

/* ---------- 单页生成 ---------- */

function renderPage({ page, app, common, origin, template, lang }) {
  const where = `${page.outputs.find(o => o.lang === lang).path}`;
  const [i18nFile, i18nKey] = page.i18n;
  const pageApp = evalApp(i18nFile);
  const data = { ...common, ...(pageApp[i18nKey] || {}) };
  must(pageApp[i18nKey], `${where}：${i18nFile} 里没有 ${i18nKey}`);

  let html = template;

  /* ① html 标签：语言写死；② <base>：页面在子目录里，相对路径按站点根解析 */
  html = html.replace(/<html[^>]*>/, `<html lang="${lang}" data-lang="${lang}" data-lang-fixed>`);
  if (!html.includes('<base href="/">')) {
    html = replaceOnce(html, '<meta charset="UTF-8">', '<meta charset="UTF-8">\n<base href="/">', where + '：meta charset');
  }

  /* ③ 模板里「只在旧地址生效」的区块 */
  html = applyLegacyRegions(html, where);

  /* ④ 导航（静态链接，爬虫可见） */
  html = page.cornerNav ? bakeCornerNav(html, data, lang) : html;
  html = page.backNav ? bakeBackNav(html, data, lang) : html;

  /* ⑤ 正文 */
  if (page.bakeWorksList && app) html = bakeWorksList(html, app, lang);
  html = bakeI18nText(html, data, lang, where);

  /* ⑥ 标题与元信息 */
  const canonical = `${origin}/${page.name === 'index' ? '' : page.name + '/'}${LANG_DIR[lang]}`;
  const alt = l => `${origin}/${page.name === 'index' ? '' : page.name + '/'}${LANG_DIR[l]}`;
  const cover = page.name === 'index' ? 'img/spectral-dissector.webp' : `${page.name === 'works' ? 'img/6u104hp.webp' : page.name === 'about' ? 'img/logo/shuihuo-180.png' : 'img/riverrun.webp'}`;
  must(existsSync(join(ROOT, cover)), `${where}：找不到 og:image 用的图 ${cover}`);
  const meta = [
    `<meta name="description" content="${esc(page.desc[lang])}">`,
    `<link rel="canonical" href="${esc(canonical)}">`,
    `<link rel="alternate" hreflang="en" href="${esc(alt('en'))}">`,
    `<link rel="alternate" hreflang="zh" href="${esc(alt('zh'))}">`,
    `<link rel="alternate" hreflang="x-default" href="${esc(alt('en'))}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(SITE_NAME[lang])}">`,
    `<meta property="og:title" content="${esc(page.title[lang])}">`,
    `<meta property="og:description" content="${esc(page.desc[lang])}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:image" content="${esc(origin + '/' + cover)}">`,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}">`,
    `<meta property="og:locale:alternate" content="${OG_LOCALE[lang === 'zh' ? 'en' : 'zh']}">`,
    `<meta name="twitter:card" content="summary_large_image">`
  ].join('\n');
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title[lang])}</title>\n${meta}`);

  return html;
}

/* ---------- 写入 / 比对 ---------- */

const written = [];
const produced = {};
function emit(relPath, content) {
  written.push(relPath);
  produced[relPath] = content;
  const abs = join(ROOT, relPath);
  if (CHECK) return;
  mkdirSync(dirname(abs), { recursive: true });
  if (existsSync(abs) && readFileSync(abs, 'utf8') === content) return;
  writeFileSync(abs, content);
}

/* ---------- 主流程 ---------- */

const origin = readOrigin();
const common = readCommonI18n();
const app = evalApp('js/project-data.js');

if (failures.length === 0) {
  for (const page of PAGES) {
    const templatePath = join(ROOT, page.template);
    if (!must(existsSync(templatePath), `找不到模板 ${page.template}`)) continue;
    const template = readFileSync(templatePath, 'utf8');
    if (!must(/gen:legacy-only:lang/.test(template), `${page.template}：缺少 gen:legacy-only:lang 标记`)) continue;
    for (const out of page.outputs) {
      const html = renderPage({ page, app, common, origin, template, lang: out.lang });
      if (html) emit(out.path, html);
    }
  }
}

if (failures.length) {
  console.error('✗ 生成中止，未写入任何文件：\n');
  for (const f of failures) console.error('  · ' + f);
  console.error(`\n共 ${failures.length} 处问题。`);
  process.exit(1);
}

if (CHECK) {
  const stale = written.filter(rel => {
    const abs = join(ROOT, rel);
    return !existsSync(abs) || readFileSync(abs, 'utf8') !== produced[rel];
  });
  if (stale.length) {
    console.error('✗ 产物与模板／数据不一致（改了内容却忘了重新生成？）：');
    for (const s of stale) console.error('  · ' + s);
    console.error('\n跑 `node scripts/gen-pages.mjs` 重新生成。');
    process.exit(1);
  }
  console.log(`✓ ${written.length} 个站内页产物与源一致。`);
  process.exit(0);
}

console.log(`✓ 已生成 ${written.length} 个站内页：`);
for (const f of written) console.log('  · ' + f);
