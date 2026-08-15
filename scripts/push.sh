#!/bin/bash
# 推送代码到 GitHub（Pages 会自动重建）
# 运行后粘贴你的 Personal Access Token，按回车即可

cd "$(dirname "$0")/.."

# 设置代理
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export ALL_PROXY=socks5://127.0.0.1:7897

REPO="Xiehuo0624/Xiehuo0624.github.io"
GH_USER="${REPO%%/*}"
SITE_URL="https://xiehuo0624.github.io/"
ORIGINAL_REMOTE="$(git remote get-url origin 2>/dev/null || true)"

# 用 GIT_ASKPASS 向 git 提供 Token：Token 只存在于环境变量中，
# 不再拼进 URL / 命令行参数 / .git/config。
ASKPASS_FILE="$(mktemp "${TMPDIR:-/tmp}/gh-push-askpass.XXXXXX")" || exit 1
cat > "$ASKPASS_FILE" <<'EOF'
#!/bin/sh
printf '%s\n' "$GITHUB_TOKEN"
EOF
chmod 700 "$ASKPASS_FILE"

cleanup() {
    rm -f "$ASKPASS_FILE"
    if [[ -n "$ORIGINAL_REMOTE" ]]; then
        # 如果原 remote 是带凭证的 HTTP(S) URL（例如上次被中断的旧脚本留下的），
        # 不要原样恢复，统一换成无凭证 HTTPS。同时匹配大小写，并把
        # https://TOKEN@...（token 当用户名、无冒号）也视为带凭证 URL。
        if [[ "$ORIGINAL_REMOTE" =~ ^[Hh][Tt][Tt][Pp][Ss]?://[^/]+@ ]]; then
            git remote set-url origin "https://github.com/${REPO}.git"
        else
            git remote set-url origin "$ORIGINAL_REMOTE"
        fi
    else
        git remote set-url origin "https://github.com/${REPO}.git"
    fi
    unset TOKEN GITHUB_TOKEN GIT_ASKPASS GIT_TERMINAL_PROMPT
}
trap cleanup EXIT

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
read -r -s TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Token 为空，已退出"
    exit 1
fi

# 推送阶段使用带用户名、不带 Token 的 HTTPS remote；结束后由 cleanup 恢复原 remote
git remote set-url origin "https://${GH_USER}@github.com/${REPO}.git"

# ---- 推送（含重试） ----
while true; do
    echo ""
    echo "⏳ 正在推送..."
    export GITHUB_TOKEN="$TOKEN"
    export GIT_ASKPASS="$ASKPASS_FILE"
    export GIT_TERMINAL_PROMPT=0
    if git push -u origin main 2>&1; then
        echo ""
        echo "✅ 推送成功！"
        echo "🔄 GitHub Pages 将在 1-2 分钟内自动更新"
        break
    else
        echo ""
        echo "❌ 推送失败！"
        echo ""
        echo "  [r] 粘贴新 Token 重试   [q] 退出"
        echo ""
        read -r -n 1 -p "  请选择: " choice
        echo ""
        if [[ "$choice" != "r" && "$choice" != "R" ]]; then
            break
        fi
        echo "🔑 请粘贴新的 Token："
        read -r -s TOKEN
        if [ -z "$TOKEN" ]; then
            echo "❌ Token 为空，已退出"
            break
        fi
    fi
done

echo ""
echo "🔒 Token 已从本脚本中清除，remote 已恢复"
echo "👉 访问：${SITE_URL}"
echo ""
