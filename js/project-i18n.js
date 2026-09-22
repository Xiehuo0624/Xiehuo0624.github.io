/* ===== PROJECT PAGE UI I18N DATA ===== */
App.PROJECT_I18N = {
/* 公共字符串（返回、语言切换）由 i18n 引擎在 init() 时合并，不在这里再抄一份 ——
   本文件可能是同步 <head> 脚本，执行时 js/i18n.js 还没跑，`...App.COMMON_I18N`
   会展开到 undefined 而静默少掉 back / langToggle 两个键（2026-09-22 修）。 */
  mediaHint:     { zh:'[ 演示视频 / 硬件照片 ]', en:'[ DEMO VIDEO / HARDWARE PHOTO ]' },
  notFoundTitle: { zh:'未找到',                   en:'NOT FOUND' },
  notFoundDesc:  { zh:'项目不存在或链接有误。',    en:'Project does not exist or the link is incorrect.' },
  /* ---- wwhbh 麦克风（页面加载即自动申请权限）----
     关闭之后必须留下重新开始的入口：idle 显示「已停止」+ 开始按钮。
     否则按钮会落进 setState 的兜底分支被隐藏，页面再也回不到聆听状态。 */
  btnDeactivate: { zh:'关闭',                     en:'STOP' },
  btnStart:      { zh:'开始',                     en:'START' },
  btnRetry:      { zh:'重试',                     en:'RETRY' },
  micIdle:       { zh:'■ 已停止',                 en:'■ STOPPED' },
  micRequesting: { zh:'正在申请麦克风权限…',        en:'REQUESTING MICROPHONE ACCESS…' },
  micSuspended:  { zh:'▶ 点击开始聆听',            en:'▶ TAP TO START LISTENING' },
  micRunning:    { zh:'● 正在聆听',               en:'● LISTENING' },
  micDenied:     { zh:'麦克风权限被拒绝',           en:'MICROPHONE ACCESS DENIED' },
  micUnavailable:{ zh:'此作品需要 localhost 或 HTTPS', en:'THIS WORK NEEDS LOCALHOST OR HTTPS' },
  mixerCancel:    { zh:'取消',                       en:'CANCEL' },
  lightboxPrev:   { zh:'上一张',                     en:'Previous image' },
  lightboxNext:   { zh:'下一张',                     en:'Next image' },
  lightboxClose:  { zh:'关闭',                       en:'Close' },

  /* ---- riverrun spatial mixer ---- */
  mixerStart:     { zh:'开始混音',                                  en:'START MIXING' },
  mixerStop:      { zh:'停止',                                      en:'STOP' },
  mixerLoading:   { zh:'载入音轨',                                  en:'LOADING TRACKS' },
};
