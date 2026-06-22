#!/bin/bash
# 推送代码到 GitHub 并触发 Pages 重建
# 运行后粘贴你的 Personal Access Token，按回车即可

cd "$(dirname "$0")"

# 设置代理
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export ALL_PROXY=socks5://127.0.0.1:7897

REPO="Xiehuo0624/Xiehuo0624.github.io"
SITE_URL="https://xiehuo0624.github.io/"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 GitHub 推送助手"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查是否有未提交的更改
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "📦 检测到未提交的更改，正在提交..."
    git add -A
    git commit -m "Update $(date +%Y-%m-%d)"
    echo ""
fi

# 提示输入 Token
echo "🔑 请粘贴你的 GitHub Personal Access Token："
echo "   （输入时不会显示，粘贴后按回车）"
echo ""
read -s TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Token 为空，已退出"
    exit 1
fi

# 临时设置带 Token 的远程地址
git remote set-url origin "https://Xiehuo0624:${TOKEN}@github.com/${REPO}.git"

# ---- 推送（含重试） ----
while true; do
    echo ""
    echo "⏳ 正在推送..."
    git remote set-url origin "https://Xiehuo0624:${TOKEN}@github.com/${REPO}.git"
    if git push -u origin main 2>&1; then
        echo ""
        echo "✅ 推送成功！"
        break
    else
        echo ""
        echo "❌ 推送失败！"
        echo ""
        echo "  [r] 粘贴新 Token 重试   [q] 退出"
        echo ""
        read -n 1 -p "  请选择: " choice
        echo ""
        if [[ "$choice" != "r" && "$choice" != "R" ]]; then
            break
        fi
        echo "🔑 请粘贴新的 Token："
        read -s TOKEN
        if [ -z "$TOKEN" ]; then
            echo "❌ Token 为空，已退出"
            break
        fi
    fi
done

# ---- 触发 GitHub Pages 重建 ----
echo ""
echo "🔄 正在触发 GitHub Pages 重建..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${REPO}/pages/builds")

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ 重建已触发！1-2 分钟后生效"
else
    echo "⚠️  重建触发失败 (HTTP $HTTP_CODE)"
    echo "   可手动触发：https://github.com/${REPO}/actions"
fi

# ---- 清除 Token ----
git remote set-url origin "https://github.com/${REPO}.git"
unset TOKEN

echo ""
echo "🔒 Token 已从本脚本中清除"
echo "👉 访问：${SITE_URL}"
echo ""
