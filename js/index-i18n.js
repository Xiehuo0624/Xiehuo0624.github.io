/* ===== INDEX PAGE I18N DATA ===== */
App.INDEX_I18N = {
/* 公共字符串（返回、语言切换）由 i18n 引擎在 init() 时合并，不在这里再抄一份 ——
   本文件可能是同步 <head> 脚本，执行时 js/i18n.js 还没跑，`...App.COMMON_I18N`
   会展开到 undefined 而静默少掉 back / langToggle 两个键（2026-09-22 修）。 */
  /* 标签页标题用罗马字：浏览器历史与自动补全能认出 xiehuo / cao haoxuan，
     汉字标题在地址栏补全里等于不存在。
     页面内的四角署名是另一回事，保持汉字（见 js/nav.js 的 .nav-top-right）。 */
  siteTitle:   { zh:'泻火 曹浩轩',                        en:'Xiehuo — Cao Haoxuan' },
  about:       { zh:'[+] 简介与联系',                    en:'[+] About & Contact' },
  changelog:   { zh:'[>] 进程日志',                      en:'[>] Changelog' },
  allWorks:    { zh:'[全部作品 →]',                      en:'[ALL WORKS →]' },
  linkEcce:    { zh:'瞧！这个人',                         en:'ECCE HOMO' },
  linkRiverrun:{ zh:'riverrun',                                     en:'riverrun' },
  linkSpectral:{ zh:'SPECTRAL DISSECTOR',                  en:'SPECTRAL DISSECTOR' },
  cardSpectral:{ zh:'SPECTRAL DISSECTOR',                  en:'SPECTRAL DISSECTOR' },
  cardEdgedgedge:{ zh:'EDGEDGEDGE',                               en:'EDGEDGEDGE' },
  cardFetMixer:{ zh:'THE INDUCTION MIXER',                          en:'THE INDUCTION MIXER' },
  cardRiverrun:{ zh:'riverrun',                                     en:'riverrun' },
  cardEcce:    { zh:'瞧！这个人',                         en:'ECCE HOMO' },
  cardWwbh:    { zh:'我们将会曾经在这里',                 en:'WE WILL HAVE BEEN HERE' },
  cardJustType:{ zh:'The JustType Study',                 en:'The JustType Study' },
  card6u104hp: { zh:'6U104HP',                             en:'6U104HP' },

  /* ===== 悬停展签的事实行（2026-10-09 加）=====
     格式固定为「年份 · 形态」，年份取自作品页信息栏 .work-meta 的第一行（创作年份／Year）、
     形态取第二行（形态／Type），这里只是压成一行。
     · 年份由 scripts/verify/verify.mjs 第十七节逐件比对 data/<id>/{zh,en}.html，改了作品页
       忘记改这里会当场报错；**形态是人工压短的**（信息栏里有些作品的形态是一整句，
       例如 wwhbh），没有机器比对，改作品页时要人眼过一遍。
     · 键名与卡片的标题键成对（cardXxx / labelXxx），index.html 里逐张卡片对应写死。 */
  labelJustType:{ zh:'2026 · Eurorack 模块合成器系统设计与一次 Live Set', en:'2026 · A Eurorack modular system design and a live set' },
  labelFetMixer:{ zh:'2025–2026 · 空间混音器 / 可演奏的电子乐器',           en:'2025–2026 · Spatial mixer / playable electronic instrument' },
  labelRiverrun:{ zh:'2026 · 交互式声音作品',                              en:'2026 · Interactive sound work' },
  labelEdgedgedge:{ zh:'2025 · 回授声音演出，两名演奏员',                   en:'2025 · A feedback sound performance for two performers' },
  labelSpectral:{ zh:'2025–2026 · Max for Live 插件：基频、谐波、瞬态与噪音分离', en:'2025–2026 · A Max for Live plugin: fundamental, harmonic, transient and noise separation' },
  labelEcce:    { zh:'2024 · 半即兴的声音剧场，两位表演者',                  en:'2024 · A semi-improvised sound theatre piece for two performers' },
  /* wwhbh 的形态在信息栏里是一整句（中 39 字 / 英 113 词），展签只留前半句（作者 2026-10-09 定） */
  labelWwbh:    { zh:'2024 · 麦克风—扬声器回授的声音概念',                  en:'2024 · A microphone–loudspeaker feedback concept' },
  label6u104hp: { zh:'2023–2025 · 铝合金 Eurorack 电源箱，在售产品',         en:'2023–2025 · Aluminium Eurorack power case, a product on sale' }
};
