#!/usr/bin/env python3
"""生成首访幕布背景墙用的 480px 缩略图（img/collage/）。

输入：js/project-data.js 里引用的全部 img/*.webp，去掉棚拍产品图。
输出：img/collage/<同名>.webp，长边 480、q 72。墙上一格桌面端 288×225、手机端 130×120，
      480 的长边在 2× 屏上略欠一点，但作为装饰性底图足够，换来的是单格 ~25KB。

用法：
  python3 scripts/gen-collage.py            # 生成/增量更新
  python3 scripts/gen-collage.py --check    # 只检查，有缺或有漂移时退出码 1

为什么排除棚拍图：6U104HP 的产品照是白背景棚拍，灰度化后整格接近纯白，
贴在展签的纸旁边会读成"没加载出来"。展览现场照（6u104hp-expo-*）保留。
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTDIR = ROOT / "img" / "collage"
LONG_EDGE = 480
QUALITY = 72
# 每格固定裁成这个宽高比（桌面 6 列 × 4 行时格子约 237×225）
ASPECT = 1.05
# 只取「cover 裁切」的 62%：所有格子看到的是同样比例的画面，
# 不会再出现有的格子是整张舞台全景、有的只是一个旋钮 —— 这就是"尺寸忽大忽小"的来源
FRACTION = 0.62
# 竖向取景略偏上（人脸/器材通常在中间偏上）
Y_BIAS = 0.46
# 不进背景墙的图（手工维护的名单，理由见下）：
#  6u104hp 产品图 —— 白背景棚拍，灰度化后整格接近纯白
#  the-induction-mixer-2 —— 平板光产品照（均值 0.62、标准差 0.11），同样读作"空格"
#  spectral-dissector —— 插件界面工程截图，在照片墙里读作"软件截图"，不是作品现场
EXCLUDE = re.compile(r"^img/(6u104hp(-\d+)?|the-induction-mixer-2|spectral-dissector(-\d+)?)\.webp$")


def pool():
    data = (ROOT / "js" / "project-data.js").read_text(encoding="utf-8")
    paths = sorted({m for m in re.findall(r"'((?:img|video)/[^']+\.webp)'", data)})
    return [p for p in paths if not EXCLUDE.match(p)]


def probe_size(path):
    """用 sips 读尺寸：本机 cwebp 没有 -info，Pillow 又不在系统 python3 里。"""
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
                         capture_output=True, text=True).stdout
    w = re.search(r"pixelWidth:\s*(\d+)", out)
    h = re.search(r"pixelHeight:\s*(\d+)", out)
    return (int(w.group(1)), int(h.group(1))) if w and h else None


def main():
    check = "--check" in sys.argv
    srcs = pool()
    if not srcs:
        print("没有找到图源（js/project-data.js 的路径格式变了？）", file=sys.stderr)
        return 1

    OUTDIR.mkdir(parents=True, exist_ok=True)
    missing, stale, built = [], [], []
    for rel in srcs:
        src = ROOT / rel
        dst = OUTDIR / Path(rel).name   # 输出只留文件名，海报也落到 img/collage/
        if not src.exists():
            missing.append(rel)
            continue
        if not dst.exists():
            stale.append(dst.name)
        elif dst.stat().st_mtime < src.stat().st_mtime:
            stale.append(dst.name)
        else:
            continue
        if check:
            continue

        w, h = probe_size(src) or (0, 0)
        if not w or not h:
            print(f"  ✗ 读不出尺寸：{rel}", file=sys.stderr)
            continue
        # 先按格子的宽高比居中裁一块，再按固定比例缩到 480：每格取景范围一致
        cover_w = min(w, h * ASPECT)
        cover_h = cover_w / ASPECT
        cw = max(2, round(cover_w * FRACTION))
        ch = max(2, round(cover_h * FRACTION))
        x = max(0, (w - cw) // 2)
        y = max(0, int((h - ch) * Y_BIAS))
        args = ["cwebp", "-quiet", "-q", str(QUALITY), "-m", "6",
                "-crop", str(x), str(y), str(cw), str(ch),
                "-resize", str(LONG_EDGE), "0"]
        subprocess.run(args + [str(src), "-o", str(dst)], check=True)
        built.append(dst.name)

    if check:
        if missing:
            print(f"缺源文件 {len(missing)} 个：" + ", ".join(missing))
        if stale:
            print(f"缩略图缺失或过期 {len(stale)} 个：" + ", ".join(stale[:8])
                  + (" …" if len(stale) > 8 else ""))
        if missing or stale:
            print("跑一次 python3 scripts/gen-collage.py")
            return 1
        total = sum((OUTDIR / d).stat().st_size for d in [Path(p).name for p in srcs])
        print(f"✓ {len(srcs)} 张缩略图齐备，合计 {total/1048576:.2f} MB")
        return 0

    total = sum((OUTDIR / Path(p).name).stat().st_size for p in srcs
                if (OUTDIR / Path(p).name).exists())
    # 清掉已经不在池子里的旧缩略图（改了排除名单之后会留下孤儿文件）
    keep = {Path(p).name for p in srcs}
    orphans = [f for f in OUTDIR.glob("*.webp") if f.name not in keep]
    for f in orphans:
        f.unlink()

    print(f"图源 {len(srcs)} 张（已排除棚拍/平板光产品图）；本次生成 {len(built)} 张")
    if orphans:
        print(f"清理孤儿缩略图 {len(orphans)} 张：" + ", ".join(f.name for f in orphans))
    print(f"img/collage/ 合计 {total/1048576:.2f} MB，平均 {total/max(1,len(srcs))/1024:.0f} KB")
    if missing:
        print(f"⚠ 有 {len(missing)} 个源文件不存在：" + ", ".join(missing), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
