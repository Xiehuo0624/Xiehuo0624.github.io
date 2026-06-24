/* ===== AUTOSPACE：中英/中数之间自动插入窄空格 =====
 * 在 CJK 与 [A-Za-z0-9] 边界插入 thin space（U+2009）。
 * DejaVu Sans Mono 中 U+2009 的字宽已改为 0.2em（见 css/base.css 注释），
 * 故间距明显但不显宽。插入幂等（重复处理不会叠加）。
 * MutationObserver 监听 body，覆盖 i18n 切换、data 片段 fetch、changelog 渲染等动态注入。
 */
App.autospace = (function(){
  const SP = '\u2009';
  const CJK = '\\u4e00-\\u9fff\\u3400-\\u4dbf';
  const reA = new RegExp('([' + CJK + '])([A-Za-z0-9])', 'g');   // 中文 → 英数
  const reB = new RegExp('([A-Za-z0-9])([' + CJK + '])', 'g');   // 英数 → 中文
  const HAS_CJK = new RegExp('[' + CJK + ']');
  const HAS_AN = /[A-Za-z0-9]/;

  function spaced(s){
    return s.replace(reA, '$1' + SP + '$2').replace(reB, '$1' + SP + '$2');
  }

  const SKIP = {SCRIPT:1, STYLE:1, NOSCRIPT:1, TEXTAREA:1, INPUT:1, SELECT:1, OPTION:1};

  function walk(node){
    if(node.nodeType === 3){                     // 文本节点
      const t = node.nodeValue;
      if(t && HAS_CJK.test(t) && HAS_AN.test(t)){
        const nt = spaced(t);
        if(nt !== t) node.nodeValue = nt;
      }
      return;
    }
    if(node.nodeType !== 1) return;              // 其余跳过
    if(SKIP[node.nodeName]) return;
    for(let c = node.firstChild; c; c = c.nextSibling) walk(c);
  }

  let obs = null, processing = false;

  function onMutate(muts){
    if(processing) return;
    processing = true;
    obs.disconnect();                            // 处理期间断开，避免自身改文本触发递归
    for(const m of muts){
      if(m.type === 'characterData') walk(m.target);
      else m.addedNodes.forEach(n => walk(n));
    }
    processing = false;
    obs.observe(document.body, {childList:true, subtree:true, characterData:true});
  }

  function init(){
    if(!document.body) return;
    walk(document.body);                         // 先处理已有内容
    obs = new MutationObserver(onMutate);
    obs.observe(document.body, {childList:true, subtree:true, characterData:true});
  }

  return { init, spaced, walk };
})();

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', App.autospace.init);
} else {
  App.autospace.init();
}
