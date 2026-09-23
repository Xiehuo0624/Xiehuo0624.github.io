#!/usr/bin/env python3
"""重新生成中文主字体（`css/fonts/SourceHanSansSC-{Regular,Bold}.woff2`）。

## 为什么需要它

2026-06 切的那份子集只含 1023 个码位，而站点内容后来长过了它：实测全站中文渲染出 1170 个
中日韩字符，其中 **234 个不在子集里**，只能静默落到系统字体（macOS 苹方／Windows 雅黑）——
于是同一句话里一半字是思源、一半是系统字体。逐页缺字最多的是 changelog（82）、6u104hp（78）、
the-induction-mixer（50）。

按内容重新推导字符集后共需 1446 字，用官方字体切出来 **约 267KB（Regular）/ 272KB（Bold）**，
比现有那份 302KB/311KB 反而更小、且覆盖全量。**现有 1023 个字形与官方字体轮廓逐字节相同**
（实测 sha1 全等），所以这次替换不会改变任何已经正常的字形 —— 只把原先掉到系统字体的字补回来。

## 源字体（一次性下载，不入库）

官方 Noto Sans SC 与思源黑体 SC 是同一款字体（SIL OFL 1.1），字形轮廓实测一致：

    mkdir -p tmp/fonts-source && cd tmp/fonts-source
    for f in NotoSansSC-Regular.otf NotoSansSC-Bold.otf; do
      curl -L -o "$f" "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/SC/$f"
    done

（也可用 Adobe 的 SourceHanSansSC-{Regular,Bold}.otf 放到同一目录，脚本会按顺序找。）

## 怎么跑

    pip3 install --target tmp/pylibs fonttools brotli     # 若尚未安装
    python3 scripts/gen-cjk-main.py                       # 生成 + 走完版本号链条 + 重跑页面生成器
    python3 scripts/gen-cjk-main.py --check               # 只比对不写入，漂移时退出码 1

`--check` 用来发现「内容里又出现了子集没覆盖的字」——那正是这份子集当初失效的原因；
它同时检查**版本号链条**是否同步。

## 改了中文文案之后：只需要跑这一条命令

主字体子集是从站内文案派生的，所以**任何中文改动都可能改字形文件**。而字形一换，
它的 URL 就必须换（否则回访者吃满 4 小时旧缓存），URL 的版本号又出现在多处。这一整条链
现在由本脚本自动走完（2026-09-22 起）：

    python3 scripts/gen-cjk-main.py
      ├─ 重切子集、写入 css/fonts/SourceHanSansSC-{Regular,Bold}.woff2
      ├─ 版本号 = Regular 字形内容的 sha256 前 8 位（内容没变就一个字节都不改，幂等）
      ├─ 写进 css/base.css 的 @font-face（Regular + Bold 两处）
      ├─ 写进五个手写模板的预载 URL（works / about / changelog / 404 / project-template）
      ├─ base.css 内容变了 → 提它自身的号（6 个 HTML 引用处同步）
      └─ 重跑 scripts/gen-projects.mjs 与 scripts/gen-pages.mjs

两个页面生成器不需要手改：它们用 `mainFontHref()` 从 `base.css` 现读版本号
（`scripts/gen-pages.mjs`、`scripts/gen-projects.mjs`）。

**为什么以前老出问题**：这条链原先全靠人记，2026-09-22 一天内漏了三次 ——
作品页预载漏 `?v=`（白下 267.7KB）、五个旧地址模板漏 `?v=`、changelog 文案改了字体却忘了提号。
现在即使忘了跑本脚本，`scripts/verify/verify.mjs` 第十二节与 `coverage.mjs` 也会当场报错。

## 与 gen-cjk-extras.py 的分工

本脚本产出**主字体**（覆盖站内全部中日韩用字，兜底一切中文）。`gen-cjk-extras.py` 产出
`SiteCJK`（英文侧零散十几个字的小面，排在主字体之前，避免英文页为几个字下载主字体）。
两者的字形同源，故 SiteCJK 从主字体切即可，不需要源字体。
SiteCJK 的 URL 目前**不带版本号**（它的字符集很少变，且一变就会改写 base.css 的
`gen:site-cjk` 区块、进而由本脚本提出新的 base.css 号）；若将来它频繁变动，按同一套办法给它加哈希。
"""

import argparse
import hashlib
import io
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / 'css' / 'fonts'
SRC_CANDIDATES = {
    'Regular': ['tmp/fonts-source/NotoSansSC-Regular.otf', 'tmp/fonts-source/SourceHanSansSC-Regular.otf'],
    'Bold': ['tmp/fonts-source/NotoSansSC-Bold.otf', 'tmp/fonts-source/SourceHanSansSC-Bold.otf'],
}
OUT = {
    'Regular': FONT_DIR / 'SourceHanSansSC-Regular.woff2',
    'Bold': FONT_DIR / 'SourceHanSansSC-Bold.woff2',
}
# 手写模板里带主字体预载 URL 的（index.html 不预载字体，故不在其中）
PRELOAD_TEMPLATES = ['works.html', 'about.html', 'changelog.html', '404.html', 'project-template.html']
# 以 ?v= 引用 css/base.css 的 HTML；base.css 内容一变就要同时提它的号
BASE_CSS_REF_TEMPLATES = ['index.html', 'works.html', 'about.html', 'changelog.html', '404.html',
                          'project-template.html']
# 生成物脚本：版本号改完要把它们跑一遍，否则生成页里还是旧号
PAGE_GENERATORS = ['scripts/gen-projects.mjs', 'scripts/gen-pages.mjs']
MAIN_FONT_RE = re.compile(r'(SourceHanSansSC-(?:Regular|Bold)\.woff2)\?v=([0-9a-zA-Z]+)')
PRELOAD_RE = re.compile(r'(SourceHanSansSC-Regular\.woff2)\?v=([0-9a-zA-Z]+)')
BASE_CSS_REF_RE = re.compile(r'base\.css\?v=(\d+)')
# 判据是「渲染出来的字」：范围含中日韩统一表意文字、扩展 A、兼容表意、CJK 标点、
# 全角形式、假名（作品名里偶有）—— 不含拉丁与音标（那两个由 DejaVu 与 LocalIPA 负责）。
CJK_RE = re.compile(
    r'[\u2E80-\u303F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF]'
)

# 内容来源：能渲染出中文的地方全都要算进来。
CONTENT_GLOBS = ['data/*/*.html']
CONTENT_JS = ['js/index-i18n.js', 'js/works-i18n.js', 'js/about-i18n.js', 'js/changelog-i18n.js',
              'js/project-i18n.js', 'js/404-i18n.js', 'js/nav.js', 'js/i18n.js', 'js/changelog.js',
              # project-data.js 也要算：作品标题／副标题／简介与 related 的角色词都在这里，
              # 它们直接渲染进页面（漏掉它时「矩阵」的「阵」就掉到了系统字体 —— 实测踩到过）
              'js/project-data.js']
CONTENT_HTML = ['index.html', 'works.html', 'about.html', 'changelog.html', '404.html', 'project-template.html']


def die(msg):
    print('✗ ' + msg, file=sys.stderr)
    sys.exit(1)


def load_fonttools():
    libs = ROOT / 'tmp' / 'pylibs'
    if libs.is_dir():
        sys.path.insert(0, str(libs))
    try:
        from fontTools import subset  # noqa: F401
        import brotli  # noqa: F401
    except ImportError as e:
        die(f'缺依赖（{e.name}）。先跑：pip3 install --target tmp/pylibs fonttools brotli')
    from fontTools import subset
    return subset


def js_strings(path):
    """只取单引号字符串字面量，避免把注释里的中文也算进来（那会让子集无谓变大）。"""
    return '\n'.join(re.findall(r"'((?:[^'\\]|\\.)*)'", path.read_text(encoding='utf-8')))


def html_visible(path):
    """去掉注释、script、style 与标签，只留会被渲染的文本。"""
    t = path.read_text(encoding='utf-8')
    t = re.sub(r'<!--[\s\S]*?-->', ' ', t)
    t = re.sub(r'<(script|style)[\s\S]*?</\1>', ' ', t)
    return re.sub(r'<[^>]+>', ' ', t)


def derive_charset():
    text = ''
    for pattern in CONTENT_GLOBS:
        for f in sorted(ROOT.glob(pattern)):
            text += f.read_text(encoding='utf-8')
    for f in CONTENT_JS:
        text += js_strings(ROOT / f)
    for f in CONTENT_HTML:
        text += html_visible(ROOT / f)
    chars = set(CJK_RE.findall(text))
    if not chars:
        die('推导出的字符集是空的，推导规则要检查')
    return chars


def build(subset, src, chars):
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    font = subset.load_font(str(src), opts)
    s = subset.Subsetter(options=opts)
    s.populate(text=''.join(sorted(chars)))
    s.subset(font)
    buf = io.BytesIO()
    subset.save_font(font, buf, opts)
    data = buf.getvalue()
    from fontTools.ttLib import TTFont
    cmap = TTFont(io.BytesIO(data)).getBestCmap()
    return data, {chr(cp) for cp in cmap}


# ---------------------------------------------------------------- 版本号链条
#
# 为什么由本脚本负责：主字体子集是**从站内文案派生**的，所以任何中文改动都可能改字形文件；
# 而字体 URL 的 ?v= 原先硬编码在四处（base.css、两个页面生成器、五个手写模板），
# 每次都要人工同步 —— 2026-09-22 一天内就漏了三次（作品页预载、五个旧地址模板、
# changelog 文案改了字体却忘了提号）。人记不住，所以让生成字体的这个脚本走完整条链。
#
# 版本号用**字形内容哈希**而不是递增数字：内容没变就绝不改号（幂等），
# 也不会出现「重跑一次就白洗一遍缓存」。

def font_version():
    """主字体 URL 的版本号 = Regular 字形文件内容的 sha256 前 8 位。"""
    return hashlib.sha256(OUT['Regular'].read_bytes()).hexdigest()[:8]


def version_problems(ver):
    """只读检查：所有位置的版本号是否都等于 ver、是否都带版本号。"""
    problems = []
    css = (ROOT / 'css' / 'base.css').read_text(encoding='utf-8')
    found = MAIN_FONT_RE.findall(css)
    if len(found) != 2:
        problems.append(f'css/base.css：主字体 URL 应有 2 处（Regular/Bold），实际 {len(found)} 处')
    for _, v in found:
        if v != ver:
            problems.append(f'css/base.css：主字体 ?v={v}，应为 ?v={ver}')
    for name in PRELOAD_TEMPLATES:
        text = (ROOT / name).read_text(encoding='utf-8')
        hits = PRELOAD_RE.findall(text)
        if len(hits) != 1:
            problems.append(f'{name}：字体预载 URL 应有 1 处，实际 {len(hits)} 处')
        for _, v in hits:
            if v != ver:
                problems.append(f'{name}：字体预载 ?v={v}，应为 ?v={ver}')
        if 'SourceHanSansSC' in text and not hits and 'woff2' in text:
            problems.append(f'{name}：有字体预载但没带 ?v=')
    return problems


def sync_versions(ver):
    """写入模式：把版本号写到所有位置，并按需提 base.css 自身的号。返回做过的改动。"""
    changed = []

    css_path = ROOT / 'css' / 'base.css'
    css = css_path.read_text(encoding='utf-8')
    new_css = MAIN_FONT_RE.sub(lambda m: f'{m.group(1)}?v={ver}', css)
    if new_css == css and len(MAIN_FONT_RE.findall(css)) != 2:
        die('css/base.css 里找不到 2 处带 ?v= 的主字体 URL，无法确定要改哪里')
    if new_css != css:
        css_path.write_text(new_css, encoding='utf-8')
        changed.append('css/base.css（字体 URL）')

    for name in PRELOAD_TEMPLATES:
        p = ROOT / name
        text = p.read_text(encoding='utf-8')
        new_text = PRELOAD_RE.sub(lambda m: f'{m.group(1)}?v={ver}', text)
        if new_text == text and not PRELOAD_RE.findall(text):
            die(f'{name} 里找不到带 ?v= 的字体预载 URL，无法确定要改哪里')
        if new_text != text:
            p.write_text(new_text, encoding='utf-8')
            changed.append(f'{name}（字体预载）')

    # base.css 内容变了 → 它自身也要提号，否则回访者手里的旧 CSS 还在指旧字形 URL
    if any(c.startswith('css/base.css') for c in changed):
        files = [ROOT / n for n in BASE_CSS_REF_TEMPLATES]
        cur = 0
        for p in files:
            m = BASE_CSS_REF_RE.search(p.read_text(encoding='utf-8'))
            if m:
                cur = max(cur, int(m.group(1)))
        if cur == 0:
            die('六个 HTML 里都找不到 base.css?v=N，无法提号')
        new_ver = cur + 1
        for p in files:
            text = p.read_text(encoding='utf-8')
            new_text = BASE_CSS_REF_RE.sub(lambda m: f'base.css?v={new_ver}', text)
            if new_text != text:
                p.write_text(new_text, encoding='utf-8')
        changed.append(f'base.css 自身的号 v{cur} → v{new_ver}（6 个 HTML）')

    return changed


def run_page_generators():
    for script in PAGE_GENERATORS:
        r = subprocess.run(['node', script], cwd=ROOT, capture_output=True, text=True)
        if r.returncode != 0:
            die(f'{script} 失败：\n{r.stdout}{r.stderr}')
    print('    · 已重跑 ' + '、'.join(PAGE_GENERATORS))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()

    subset = load_fonttools()
    chars = derive_charset()

    results = {}
    for weight, candidates in SRC_CANDIDATES.items():
        src = next((ROOT / c for c in candidates if (ROOT / c).exists()), None)
        if src is None:
            die('找不到源字体。按脚本顶部注释下载到 tmp/fonts-source/ 后重试。\n'
                '    期望其中之一：' + '、'.join(candidates))
        data, covered = build(subset, src, chars)
        missing = chars - covered
        if missing:
            die(f'{weight}：源字体缺这些字形，无法覆盖：{"".join(sorted(missing))[:60]}')
        results[weight] = (data, src)

    if args.check:
        problems = []
        for weight, (data, _) in results.items():
            got = OUT[weight].read_bytes() if OUT[weight].exists() else None
            if got != data:
                problems.append(f'{OUT[weight].relative_to(ROOT)}（{"缺文件" if got is None else "内容不一致"}）')
        # 字形与内容一致之外，还要检查**版本号链条**：字形文件换了内容、URL 却没换的话，
        # 回访者会吃满 4 小时旧缓存（2026-09-22 一天内漏了三次）。
        if OUT['Regular'].exists():
            problems += version_problems(font_version())
        else:
            problems.append('主字体文件不存在')
        if problems:
            print('✗ 字体或版本号链条与内容不一致，两类原因：\n'
                  '  ① 内容里新增了中日韩字符却忘了重新生成子集；\n'
                  '  ② 字形文件换了、但某处 URL 的版本号没跟着换（回访者会吃满 4 小时旧缓存）。',
                  file=sys.stderr)
            for p in problems:
                print('  · ' + p, file=sys.stderr)
            print('\n跑 `python3 scripts/gen-cjk-main.py` 重新生成并同步版本号。', file=sys.stderr)
            sys.exit(1)
        print(f'✓ 中文主字体与内容一致（覆盖 {len(chars)} 个中日韩字符），版本号链条也已同步。')
        return

    before = OUT['Regular'].stat().st_size if OUT['Regular'].exists() else 0
    for weight, (data, src) in results.items():
        OUT[weight].write_bytes(data)
    after = OUT['Regular'].stat().st_size
    print(f'✓ 已重做中文主字体：覆盖 {len(chars)} 个中日韩字符')
    print(f'    Regular  {before} → {after} 字节')
    print(f'    Bold     {len(results["Bold"][0])} 字节')
    print(f'    源：{results["Regular"][1].relative_to(ROOT)}')

    # 版本号链条：字形文件一换，URL 必须跟着换，否则回访者吃满 4 小时旧缓存。
    # 版本号取内容哈希，所以内容没变时这里什么都不会改 —— 幂等，不会白洗缓存。
    ver = font_version()
    changed = sync_versions(ver)
    if changed:
        print(f'✓ 已同步主字体版本号 ?v={ver}：')
        for c in changed:
            print('    · ' + c)
        run_page_generators()
    else:
        print(f'    · 各处版本号已是 ?v={ver}，无需改动')
    print('    · SiteCJK 与它同源，可重新跑 gen-cjk-extras.py 保持一致')


if __name__ == '__main__':
    main()
