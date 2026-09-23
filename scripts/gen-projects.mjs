#!/usr/bin/env node
/* ============================================================================
 * 作品静态页生成器
 * ============================================================================
 *
 * 为什么需要它
 * ------------
 * 作品页原先只有一个 project-template.html，靠 ?project=<id> 在客户端拼出页面。
 * 结果是：地址是 project-template.html?project=spectral-dissector&lang=zh 这种
 * 「文件名裸露实现 + 两段查询串」的脏地址；更实际的代价是**服务器返回的 HTML 里没有
 * 任何作品内容** —— <title> 是 PROJECT，正文是 [ 演示视频 / 硬件照片 ] 样板，
 * 一切都要等 JS 跑完。于是不执行 JS 的抓取者（微信／X／Slack 的链接预览、搜索引擎）
 * 看到的是空模板，8 个作品共用同一个标题、也没有任何 og:* 元信息。
 *
 * 做法
 * ----
 * 以 project-template.html 为**唯一模板**（六个布局面板、脚本与样式引用、缓存版本号
 * 全都在那一份里），为每个作品 × 每种语言生成一份目录式静态页：
 *
 *     works/<id>/        ← 英文（默认语言）
 *     works/<id>/zh/     ← 中文
 *
 * 生成动作只有「把模板里本来就由 JS 填的东西，在生成时直接写进 HTML」这一件事：
 *   ① <html> 上写死 data-lang / data-project / data-layout（语言、作品、布局都不再依赖 JS）
 *   ② <title> 换成作品名，并补 description / canonical / hreflang / og:* / twitter:card
 *   ③ 当前布局的 <h2> 填好标题与副标题
 *   ④ 当前布局的正文容器填入 data/<id>/<lang>.html 的内容（爬虫读得到）
 *   ⑤ 主图（或 bilibili 内嵌页）写进媒体容器，并标 data-baked="1"
 *   ⑥ 头部内联脚本只保留「中文才预载中日韩字体」；末尾那段「读 ?project= 定布局」的
 *      脚本整段删掉 —— 它的活儿已经由 ① 在生成时做完了
 * 其余部分原样照抄，所以模板改了（加布局、提缓存版本号）重新生成即可，不会两边漂移。
 *
 * 运行时如何配合（改这一对文件时要一起看）
 * ----------------------------------------
 *   js/project.js  读 <html data-project> 定作品；正文容器带 data-desc-lang 时
 *                  直接用烤好的 HTML，不再 fetch；媒体容器带 data-baked 时不再重建
 *   js/i18n.js     带 data-lang-fixed 的页面不吃 localStorage、不写回 ?lang=，
 *                  切换语言改为跳到另一语言那份页面（目标读 head 里的 hreflang）
 *   js/app.js       App.projectHref() 是站内所有作品链接的唯一出处
 *
 * 旧地址怎么办
 * ------------
 * project-template.html 不删：已发出的 ?project= 链接必须一直能打开。它带静态
 * noindex，js/project.js 再补一条指向目录式地址的 canonical。它同时是本生成器的
 * 模板来源 —— 改它等于改所有作品页。
 *
 * 什么时候要跑
 * ------------
 * 改了 project-template.html、js/project-data.js 或 data/<id>/<lang>.html 之后。
 * 产物要提交进仓库（部署仍然是纯静态的 GitHub Pages，不在服务器上跑这个脚本）。
 * `node scripts/gen-projects.mjs --check` 只比对不写入，不一致时退出码 1，
 * 用来发现「改了数据忘了重新生成」的漂移。
 *
 * 失败方向
 * --------
 * 所有不变量都是**硬失败**：找不到容器、正文容器非空、片段缺文件、块级元素要被塞进
 * <p>、封面图不存在……一律报错退出，绝不生成一份「差不多能用」的页面。宁可当场报错，
 * 也不要把半成品推上线。
 * ==========================================================================*/

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const LANGS = ['en', 'zh'];
/* 目录式地址里英文占根、中文占 zh/ 子目录；hreflang 与 og:locale 跟着走 */
const LANG_DIR = { en: '', zh: 'zh/' };
const OG_LOCALE = { en: 'en_US', zh: 'zh_CN' };
const SITE_NAME = { en: 'Xiehuo — Cao Haoxuan', zh: '泻火 曹浩轩' };

let failures = [];

function fail(msg) {
  failures.push(msg);
}

function must(cond, msg) {
  if (!cond) fail(msg);
  return cond;
}

/* ---------- 读取输入 ---------- */

function readProjectData() {
  const file = join(ROOT, 'js', 'project-data.js');
  const ctx = { App: {} };
  vm.createContext(ctx);
  try {
    vm.runInContext(readFileSync(file, 'utf8'), ctx, { filename: file });
  } catch (e) {
    fail(`js/project-data.js 求值失败：${e.message}`);
    return null;
  }
  must(ctx.App.projects && typeof ctx.App.projects === 'object', 'js/project-data.js 没有 App.projects');
  must(Array.isArray(ctx.App.projectOrder), 'js/project-data.js 没有 App.projectOrder');
  return ctx.App;
}

function readOrigin() {
  const file = join(ROOT, 'CNAME');
  must(existsSync(file), '找不到 CNAME，无法确定规范域名');
  if (!existsSync(file)) return 'https://example.invalid';
  const host = readFileSync(file, 'utf8').trim();
  must(/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host), `CNAME 内容不像域名：${JSON.stringify(host)}`);
  return 'https://' + host;
}

/* ---------- 小工具 ---------- */

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function attr(s) {
  return esc(s);
}

function replaceOnce(html, needle, replacement, what) {
  const n = html.split(needle).length - 1;
  must(n === 1, `${what}：模板里匹配到 ${n} 处（应为 1 处）：${JSON.stringify(needle.slice(0, 60))}`);
  return n === 1 ? html.replace(needle, replacement) : html;
}

/* 容器（<div>/<p>，可能带别的属性）定位：只用 id 认，不认属性顺序 */
function containerTagRe(id, flags = '') {
  return new RegExp('<(div|p)\\b[^>]*\\bid="' + id + '"[^>]*>', flags);
}

/* 布局面板（模板里六个，生成页只留当前那一个） */
const LAYOUTS = ['grid', 'wwhbh', 'ecce', 'edge', 'mixer', 'gallery'];

/* 剪掉一个顶层 <div id="layout-X">…</div>（连同它前面那条只对它生效的注释）。
   不能靠正则会偷懒匹配：面板内部还有嵌套的 div，所以要按 <div / </div> 配平扫描。 */
function cutPanel(html, layout, what) {
  const id = 'layout-' + layout;
  const at = html.indexOf('id="' + id + '"');
  if (!must(at !== -1, `${what}：找不到布局面板 #${id}`)) return html;
  const start = html.lastIndexOf('<div', at);
  if (!must(start !== -1, `${what}：面板 #${id} 前面找不到 <div`)) return html;

  /* 按完整的 <div …> / </div> 计数。写成 /<\/?div\b/g 会出事：\b 在 v 与 > 之间就成立，
     匹配到的是 `</div`（少一个 `>`），于是每剪掉一个面板都在原地留下一个孤零零的 `>`。
     模板里的属性值不含 `>`，所以 [^>]* 取标签结尾是安全的。 */
  const tagRe = /<\/?div\b[^>]*>/g;
  tagRe.lastIndex = start;
  let depth = 0, end = -1, m;
  while ((m = tagRe.exec(html))) {
    depth += m[0].startsWith('</') ? -1 : 1;
    if (depth === 0) { end = m.index + m[0].length; break; }
  }
  if (!must(end !== -1, `${what}：面板 #${id} 的 </div> 不配平，模板结构有问题`)) return html;

  const before = html.slice(0, start);
  /* 注释体里不含 `-->` 才算一条注释。写成 /<!--[\s\S]*?-->\s*$/ 会出事：
     [\s\S]*? 能跨过 `-->` 继续吃，于是这条「面板前的注释」会从文档最开头那条注释
     一路匹配到这里，一次把半个 <head> 剪掉（实测：grid 面板一次删掉 1651 字符，
     <title> 连带消失）。 */
  const cm = /<!--(?:(?!-->)[\s\S])*-->\s*$/.exec(before);
  const cutStart = cm ? cm.index : start;
  return (html.slice(0, cutStart) + html.slice(end)).replace(/^\s*\n/, '\n');
}

/* 只留当前布局的面板。剪枝不只是瘦身：不剪的话，服务端返回的 HTML 里仍然躺着
   「[ 演示视频 / 硬件照片 ]」这类样板文案与另外五个布局的控件 —— 那正是本次要消掉的
   「爬虫看到的是空模板」。剪完必须自检：当前面板还在、只剩一个、div 配平。 */
function prunePanels(html, activeLayout, what) {
  let out = html;
  for (const layout of LAYOUTS) {
    if (layout === activeLayout) continue;
    out = cutPanel(out, layout, what);
  }
  must(out.includes('id="layout-' + activeLayout + '"'), `${what}：剪枝后当前布局面板不见了`);
  must((out.match(/\bid="layout-/g) || []).length === 1, `${what}：剪枝后仍有多个布局面板`);
  const open = (out.match(/<div\b/g) || []).length;
  const close = (out.match(/<\/div>/g) || []).length;
  must(open === close, `${what}：剪枝后 <div> 不配平（${open} 开 / ${close} 闭）`);
  return out;
}

/* 只有个别作品用得到的脚本：按布局剪掉，其余页面就不必下载它们。
   未压缩体积：ink-wwhbh.js 40KB、mixer-riverrun.js 35KB、audio-wwhbh.js 6KB —— 八个作品里
   有六个完全用不到这三者，却因为模板统一挂载而全部下载（实测它们正是作品页请求体积排行里的前两项）。
   js/project.js 只在 projectId 或 layout 匹配时才调用对应的 App.init*，剪掉不会抛错。
   旧地址 project-template.html 保持全挂：那一份要承载所有布局。 */
const LAYOUT_ONLY_SCRIPTS = [
  { src: 'js/ink-wwhbh.js', layout: 'wwhbh' },
  { src: 'js/audio-wwhbh.js', layout: 'wwhbh' },
  { src: 'js/mixer-riverrun.js', layout: 'mixer' }
];

function pruneScripts(html, layout, where) {
  let out = html;
  const removed = [];
  for (const { src, layout: needed } of LAYOUT_ONLY_SCRIPTS) {
    const esc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('<script defer src="' + esc + '[^"]*"></script>\\n?');
    const hits = out.match(new RegExp(re.source, 'g'));
    if (!must(hits && hits.length === 1,
      `${where}：模板里 ${src} 的 script 标签应恰好 1 处，实际 ${hits ? hits.length : 0} 处 —— 模板改了加载方式，生成器的剪枝点要跟着改`)) continue;
    if (needed !== layout) { out = out.replace(re, ''); removed.push(src); }
  }
  must(out.includes('js/project.js'), `${where}：剪枝后 project.js 不见了`);
  if (removed.length) {
    out = out.replace('<!-- page data + logic -->',
      '<!-- page data + logic（' + removed.join('、') + ' 只在 wwhbh / mixer 布局用到，本页已由\n' +
      '     生成器剪掉，见 scripts/gen-projects.mjs） -->');
  }
  return out;
}

/* 模板里用 <!-- gen:legacy-only:NAME --> … <!-- /gen:legacy-only:NAME --> 标出的区块，
   只在旧地址（project-template.html 本身）生效：那里需要「按 ?lang= 定语言」与
   「按 ?project= 定布局」两段脚本、一条 noindex，以及解释它们的注释。
   生成页把语言、作品、布局全部写死在 HTML 上，这些区块要么换成生成页自己的版本，
   要么整块删掉。标记写进模板而不是靠字符串猜位置，是为了让模板改动时生成器能当面报错，
   而不是悄悄生成一份注释与事实不符的页面。 */
const LEGACY_REGIONS = {
  lang: null,       // null = 换成下面这段生成页专用的脚本
  noindex: '<!-- 生成页不继承模板的 noindex：生成页就是规范地址，必须可被索引 -->',
  sync: '<!-- 渲染关键：与模板共用同一套同步加载策略（见 project-template.html 的说明）。\n' +
        '     生成页的布局与标题已写在 HTML 里，同步加载不再是首屏正确性的前提；\n' +
        '     保持同步只为避免两份加载策略各自漂移。 -->',
  layout: '<!-- 末尾那段「读 ?project= 定布局」的同步脚本已由生成器删除：\n' +
          '     语言、作品、布局写在 <html> 上，标题、副标题、正文都在生成时填好，\n' +
          '     首帧即成品，不依赖任何脚本。未使用的布局面板同时被剪掉。 -->'
};

/** 主字体 URL（含 ?v=），**从 css/base.css 现读**，不在这里硬编码。
 *
 *  为什么：这个版本号原本有四份副本 —— css/base.css 的 @font-face（权威）、本文件的预载常量、
 *  scripts/gen-pages.mjs 的预载常量、以及五个手写模板里的预载。漏同步任意一处，预载与
 *  @font-face 就成了两个缓存键，同一份字体白下两遍（274KB）。2026-09-22 一天内就发生了两次。
 *  本函数消掉其中两份（两个生成器）；剩下三个位置由 scripts/verify/verify.mjs 第十二节兜住：
 *  它把全站每一处字体 URL 与 base.css 逐字比对，不一致就失败。 */
function mainFontHref(){
  const css = readFileSync(join(ROOT, 'css', 'base.css'), 'utf8');
  const m = css.match(/url\('fonts\/(SourceHanSansSC-Regular\.woff2\?v=\d+)'\)/);
  if (!m) fail('css/base.css 里找不到带版本号的主字体 URL —— 预载 URL 无从生成');
  return '/css/fonts/' + (m ? m[1] : '');
}

const HEAD_SCRIPT =
  '<script>\n' +
  '/* 生成页：语言由路径写死，只保留「中文界面才预载中日韩字体」这一条性能决策。\n' +
  '   原文的 ?lang= > localStorage 解析必须去掉 —— 让 localStorage 覆盖路径语言，\n' +
  '   就会出现「打开 /works/x/ 却是中文」这种自相矛盾的页面。\n' +
  '   预载 URL 必须与 css/base.css 里 @font-face 的 URL 逐字相同（含 ?v=）：\n' +
  '   HTTP 缓存键含查询串，少一个 ?v= 就是两个条目，预载下的那份 @font-face 用不上，\n' +
  '   同一份字体白下一遍（实测中文作品页 809.5KB → 补齐后 541.8KB）。\n' +
  '   版本号**不再在这里硬编码**，由 mainFontHref() 从 base.css 现读 —— 见那个函数的注释。 */\n' +
  `(function(){try{if(document.documentElement.dataset.lang!=='zh')return;var f=document.createElement('link');f.rel='preload';f.as='font';f.type='font/woff2';f.crossOrigin='anonymous';f.href='${mainFontHref()}';document.head.appendChild(f);}catch(e){}})();\n` +
  '</script>';

function applyLegacyRegions(html, where) {
  let out = html;
  for (const [name, replacement] of Object.entries(LEGACY_REGIONS)) {
    const re = new RegExp('<!-- gen:legacy-only:' + name + ' -->[\\s\\S]*?<!-- /gen:legacy-only:' + name + ' -->');
    const hits = out.match(new RegExp(re.source, 'g'));
    if (!must(hits && hits.length === 1,
      `project-template.html：标记区块 gen:legacy-only:${name} 应恰好出现 1 次，实际 ${hits ? hits.length : 0} 次`)) continue;
    out = out.replace(re, replacement === null ? HEAD_SCRIPT : replacement);
  }
  must(!/gen:legacy-only/.test(out), `${where}：生成结果里残留 gen:legacy-only 标记`);
  return out;
}

function fillContainer(html, id, inner, what) {
  const tag = containerTagRe(id).exec(html);
  if (!must(tag, `${what}：模板里找不到容器 #${id}`)) return html;
  const open = tag[0];
  const close = `</${tag[1]}>`;
  must(open.endsWith('></' + tag[1] + '>') || html.slice(tag.index + open.length).startsWith(close),
    `${what}：容器 #${id} 在模板里不是空的，生成器只填空容器`);
  return html.slice(0, tag.index + open.length) + inner + html.slice(tag.index + open.length);
}

function markBaked(html, id, what) {
  const re = containerTagRe(id);
  const m = re.exec(html);
  if (!must(m, `${what}：找不到要标记的容器 #${id}`)) return html;
  must(!/data-baked/.test(m[0]), `${what}：容器 #${id} 已被标记过 data-baked`);
  return html.slice(0, m.index) + m[0].replace(/>$/, ' data-baked="1">') + html.slice(m.index + m[0].length);
}

/* 块级元素清单：段落容器是 <p> 时，正文里出现这些标签会让解析器提前闭合 <p>，
   页面结构当场坏掉。清单来自 HTML 的 phrasing content 反集（够用即可）。 */
const BLOCK_TAGS = ['div', 'p', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody',
  'tr', 'td', 'th', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main',
  'figure', 'figcaption', 'blockquote', 'pre', 'details', 'summary', 'form', 'hr', 'h1', 'h2',
  'h3', 'h4', 'h5', 'h6'];

function assertPhrasingOnly(fragment, where) {
  const found = BLOCK_TAGS.filter(t => new RegExp('<' + t + '\\b', 'i').test(fragment));
  must(found.length === 0,
    `${where}：正文容器是 <p>，但片段里含块级元素 <${found.join('>, <')}> —— ` +
    `浏览器解析时会提前闭合 <p>，页面结构会坏。按 STYLEGUIDE 的「作品信息栏」规则只用 <span>/<br> 等行内元素，` +
    `或把该布局的容器改成 <div>。`);
}

/* ---------- 单页生成 ---------- */

function renderPage({ template, app, origin, id, lang }) {
  const p = app.projects[id];
  const where = `works/${id}/${LANG_DIR[lang]}`;
  const title = p.title && p.title[lang];
  const sub = (p.subtitle || p.brief || {})[lang] || '';
  must(typeof title === 'string' && title, `${where}：js/project-data.js 里缺 title.${lang}`);
  must(p.layout, `${where}：js/project-data.js 里缺 layout`);
  if (!title || !p.layout) return null;

  const fragmentPath = join('data', id, `${lang}.html`);
  must(existsSync(join(ROOT, fragmentPath)), `${where}：找不到正文片段 ${fragmentPath}`);
  if (!existsSync(join(ROOT, fragmentPath))) return null;
  const fragment = readFileSync(join(ROOT, fragmentPath), 'utf8').trim();
  must(fragment.length > 0, `${where}：正文片段 ${fragmentPath} 是空的`);

  let html = template;

  /* ① <html>：语言、作品、布局三项都在生成时写死。
        生成页的 <head> 里不再有「?lang= > localStorage」那段解析，所以这三项就是最终值。 */
  html = replaceOnce(html, '<html lang="zh">',
    `<html lang="${attr(lang)}" data-lang="${attr(lang)}" data-lang-fixed data-project="${attr(id)}" data-layout="${attr(p.layout)}">`,
    where + '：<html> 标签');

  /* 生成物声明，放在 doctype 之后（doctype 之前放注释会让老 IE 进怪异模式） */
  html = replaceOnce(html, '<!DOCTYPE html>\n',
    '<!DOCTYPE html>\n<!-- 本文件由 scripts/gen-projects.mjs 生成，请勿手改。\n' +
    '     改动 project-template.html、js/project-data.js 或 data/<id>/<lang>.html 之后\n' +
    '     重新运行 `node scripts/gen-projects.mjs`；手改会在下次生成时被覆盖。 -->\n',
    where + '：doctype');

  /* ② <base href="/">：页面在 works/<id>/ 里，相对路径（css/、js/、img/、data/ 与正文片段里的
        下载链接）都要按站点根解析。放在 <meta charset> 之后、任何取 URL 的元素之前。 */
  html = replaceOnce(html, '<meta charset="UTF-8">', '<meta charset="UTF-8">\n<base href="/">',
    where + '：meta charset');

  /* ③ 模板里那些「只在旧地址生效」的区块：换成生成页自己的版本，或整块删掉。
        其中 gen:legacy-only:lang 会被换成「只按语言预载字体」的一小段；末尾那段
        「读 ?project= 定布局」的脚本整段消失 —— 布局已经写在 <html data-layout> 上，
        留着它读不到 ?project=，会把布局判成 grid，反而把正确的静态布局覆盖掉。 */
  html = applyLegacyRegions(html, where);

  /* ③b 只留当前布局的面板 */
  html = prunePanels(html, p.layout, where);

  /* ③c 只留当前布局用得上的脚本 */
  html = pruneScripts(html, p.layout, where);

  /* ④ 标题与元信息 */
  const canonical = `${origin}/works/${id}/${LANG_DIR[lang]}`;
  const alt = l => `${origin}/works/${id}/${LANG_DIR[l]}`;
  const cover = `img/${id}.webp`;
  must(existsSync(join(ROOT, cover)),
    `${where}：找不到封面图 ${cover} —— og:image 靠它（首页卡片图约定为 img/<id>.webp）`);

  const meta = [
    `<meta name="description" content="${attr(sub)}">`,
    `<link rel="canonical" href="${attr(canonical)}">`,
    `<link rel="alternate" hreflang="en" href="${attr(alt('en'))}">`,
    `<link rel="alternate" hreflang="zh" href="${attr(alt('zh'))}">`,
    `<link rel="alternate" hreflang="x-default" href="${attr(alt('en'))}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="${attr(SITE_NAME[lang])}">`,
    `<meta property="og:title" content="${attr(title)}">`,
    `<meta property="og:description" content="${attr(sub)}">`,
    `<meta property="og:url" content="${attr(canonical)}">`,
    `<meta property="og:image" content="${attr(origin + '/' + cover)}">`,
    `<meta property="og:image:alt" content="${attr(title)}">`,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}">`,
    `<meta property="og:locale:alternate" content="${OG_LOCALE[lang === 'zh' ? 'en' : 'zh']}">`,
    `<meta name="twitter:card" content="summary_large_image">`
  ].join('\n');

  html = replaceOnce(html, '<title>PROJECT</title>',
    `<!-- 标签页标题只写作品名（站内惯例，窄标签栏也不截断）；说明性的一整句放在\n` +
    `     description 与 og:description 里 —— 预览卡片本来就是「标题 + 说明行」两行结构，\n` +
    `     拼进标题既会与说明行重复，英文那半还会被截断（最长 133 字符）。 -->\n` +
    `<title>${esc(title)}</title>\n${meta}`,
    where + '：<title>');

  /* ⑤ 当前布局的标题（标题 + 副标题，与 js/project.js 的 setTitle 同构） */
  const h2Empty = `<h2 id="${p.layout}-title"></h2>`;
  html = replaceOnce(html, h2Empty,
    `<h2 id="${p.layout}-title">${esc(title)}` +
    (sub ? `<span class="work-sub">${esc(sub)}</span>` : '') + '</h2>',
    where + '：标题容器');

  /* ⑥ 正文：烤进当前布局的容器 */
  const descId = `${p.layout}-desc`;
  const descTag = containerTagRe(descId).exec(html);
  if (must(descTag, `${where}：找不到正文容器 #${descId}（布局 ${p.layout}）`)) {
    if (descTag[1] === 'p') assertPhrasingOnly(fragment, `${where}（${fragmentPath}）`);
    html = fillContainer(html, descId, fragment + `\n`, where + '：正文');
    /* 回调收到的是**匹配到的字符串**，不是 exec 那种数组：写成 m => m[0]… 拿到的是
       它的第一个字符 `<`，整个开标签会被替换成一个 `<`。 */
    html = html.replace(containerTagRe(descId),
      tag => tag.replace(/>$/, ` data-desc-lang="${attr(lang)}">`));
  }

  /* ⑦ 主图 / bilibili 内嵌页：只在生成时能静态写出的媒体才烤。
        gallery 布局不烤 —— 它的全部图（6U104HP 21 张、The Induction Mixer 3 张）
        要配灯箱点击绑定，交给 js/project.js 渲染。 */
  const media = p.media || null;
  if (p.layout === 'grid' && media && media.type === 'image') {
    html = replaceOnce(html,
      '<span class="media-placeholder" data-i18n="mediaHint">[ 演示视频 / 硬件照片 ]</span>',
      `<img src="${attr(media.src)}" alt="${attr(title)}" decoding="async" fetchpriority="high">`,
      where + '：媒体占位符');
    html = markBaked(html, 'grid-media', where);
  }
  if (p.layout === 'edge' && media) {
    let inner = '';
    if (media.type === 'bilibili') {
      inner = `<iframe src="//player.bilibili.com/player.html?bvid=${attr(media.bvid)}&amp;autoplay=0" allowfullscreen="true"></iframe>`;
    } else if (media.type === 'image') {
      inner = `<img src="${attr(media.src)}" alt="${attr(title)}" decoding="async" fetchpriority="high" style="width:100%;height:100%;object-fit:cover;">`;
    }
    if (inner) {
      html = fillContainer(html, 'edge-media', inner, where + '：媒体');
      html = markBaked(html, 'edge-media', where);
    }
  }
  if (p.layout === 'ecce') {
    let inner = '';
    if (media && media.type === 'image') {
      inner += `<img class="ecce-still" src="${attr(media.src)}" alt="${attr(title)}" decoding="async" fetchpriority="high">`;
    }
    if (p.audio) {
      inner += `<audio class="ecce-audio" controls preload="none" src="${attr(p.audio)}"></audio>`;
    }
    if (inner) {
      html = fillContainer(html, 'ecce-media', inner, where + '：媒体');
      html = markBaked(html, 'ecce-media', where);
    }
  }

  return html;
}

/* ---------- 汇总产物 ---------- */

function renderSitemap(app, origin) {
  const urls = [];
  /* 站内页的规范地址也是目录式：英文在根、中文在 /zh/（见 scripts/gen-pages.mjs）。
     旧地址（.html、?lang=）带 noindex，不进 sitemap。 */
  const staticPages = [
    { en: '/', zh: '/zh/' },
    { en: '/works/', zh: '/works/zh/' },
    { en: '/about/', zh: '/about/zh/' },
    { en: '/changelog/', zh: '/changelog/zh/' }
  ];
  for (const page of staticPages) {
    for (const loc of [page.en, page.zh]) {
      urls.push(
        '  <url>\n' +
        `    <loc>${origin}${loc}</loc>\n` +
        `    <xhtml:link rel="alternate" hreflang="en" href="${origin}${page.en}"/>\n` +
        `    <xhtml:link rel="alternate" hreflang="zh" href="${origin}${page.zh}"/>\n` +
        '  </url>'
      );
    }
  }
  for (const id of app.projectOrder) {
    if (!app.projects[id]) continue;
    urls.push(
      '  <url>\n' +
      `    <loc>${origin}/works/${id}/</loc>\n` +
      `    <xhtml:link rel="alternate" hreflang="en" href="${origin}/works/${id}/"/>\n` +
      `    <xhtml:link rel="alternate" hreflang="zh" href="${origin}/works/${id}/zh/"/>\n` +
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/works/${id}/"/>\n` +
      '  </url>',
      '  <url>\n' +
      `    <loc>${origin}/works/${id}/zh/</loc>\n` +
      `    <xhtml:link rel="alternate" hreflang="en" href="${origin}/works/${id}/"/>\n` +
      `    <xhtml:link rel="alternate" hreflang="zh" href="${origin}/works/${id}/zh/"/>\n` +
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/works/${id}/"/>\n` +
      '  </url>'
    );
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!-- 由 scripts/gen-projects.mjs 生成，请勿手改。\n' +
    '     只列规范地址：旧的 project-template.html?project=… 带 noindex，不进这里。 -->\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.join('\n') + '\n</urlset>\n';
}

/* robots.txt 也由生成器写：里面的 sitemap 地址要和 canonical / hreflang 同源，
   而域名只有一个来源（CNAME）。手工维护这份文件迟早会和域名对不上。 */
function renderRobots(origin) {
  return `# 由 scripts/gen-projects.mjs 生成，请勿手改（改 CNAME 后重新生成）。
#
# 作品页的规范地址是目录式：/works/<id>/（英文）与 /works/<id>/zh/（中文）。
# 旧的 /project-template.html?project=… 刻意不在这里屏蔽 —— 它自带 noindex，
# 屏蔽只会让已发出的旧链接无法被重新抓取、读不到那条 noindex。

User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
}

/* ---------- 写入 / 比对 ---------- */

const written = [];
const stale = [];

function emit(relPath, content) {
  written.push(relPath);
  const abs = join(ROOT, relPath);
  if (CHECK) {
    const old = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
    if (old === null) { stale.push(`${relPath}（磁盘上没有）`); return; }
    if (old !== content) { stale.push(`${relPath}（内容不一致）`); return; }
    return;
  }
  mkdirSync(dirname(abs), { recursive: true });
  const old = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  if (old === content) return;              // 内容没变就不动 mtime，免得 diff 噪声
  writeFileSync(abs, content);
}

/* ---------- 主流程 ---------- */

const app = readProjectData();
const origin = readOrigin();
const templatePath = join(ROOT, 'project-template.html');
must(existsSync(templatePath), '找不到 project-template.html（它同时是本生成器的模板来源）');
const template = existsSync(templatePath) ? readFileSync(templatePath, 'utf8') : '';

/* 模板自身必须先通过静态检查：<title>PROJECT</title> 与两段内联脚本是替换锚点 */
must(template.includes('<title>PROJECT</title>'), 'project-template.html 里找不到 <title>PROJECT</title>');

if (app && failures.length === 0) {
  for (const id of app.projectOrder) {
    must(app.projects[id], `js/project-data.js 的 projectOrder 里有 ${id}，但 projects 里没有`);
    if (!app.projects[id]) continue;
    for (const lang of LANGS) {
      const html = renderPage({ template, app, origin, id, lang });
      if (html) emit(`works/${id}/${LANG_DIR[lang]}index.html`, html);
    }
  }
  emit('sitemap.xml', renderSitemap(app, origin));
  emit('robots.txt', renderRobots(origin));

  /* 反向检查：works/ 下有生成器不认识的目录（作品删了但目录还在），报出来 */
  const worksDir = join(ROOT, 'works');
  if (existsSync(worksDir)) {
    for (const name of readdirSync(worksDir)) {
      if (!statSync(join(worksDir, name)).isDirectory()) continue;
      /* works/zh/ 是作品列表页的中文版（scripts/gen-pages.mjs 生成），不是作品目录 */
      if (name === 'zh') continue;
      if (!app.projects[name]) fail(`works/${name}/ 存在，但 js/project-data.js 里没有这个作品 —— 删掉目录或补上数据`);
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
  if (stale.length) {
    console.error('✗ 产物与源不一致（改了数据但忘记重新生成？）：\n');
    for (const s of stale) console.error('  · ' + s);
    console.error('\n跑 `node scripts/gen-projects.mjs` 重新生成。');
    process.exit(1);
  }
  console.log(`✓ ${written.length} 个产物与源一致。`);
  process.exit(0);
}

console.log(`✓ 已生成 ${written.length} 个文件：`);
const pages = written.filter(f => f.startsWith('works/') && f !== 'works/index.html');
const others = written.filter(f => !pages.includes(f));
console.log(`  · 作品页 ${pages.length} 个（${app.projectOrder.length} 作品 × ${LANGS.length} 语言）`);
for (const f of others) console.log(`  · ${f}`);
