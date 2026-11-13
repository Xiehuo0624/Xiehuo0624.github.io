/* ===== ABOUT PAGE I18N DATA ===== */
App.ABOUT_I18N = {
/* 公共字符串（返回、语言切换）由 i18n 引擎在 init() 时合并，不在这里再抄一份 ——
   本文件可能是同步 <head> 脚本，执行时 js/i18n.js 还没跑，`...App.COMMON_I18N`
   会展开到 undefined 而静默少掉 back / langToggle 两个键（2026-09-22 修）。 */
  title:   { zh:'关于',  en:'ABOUT' },
  contact: { zh:'联系',  en:'CONTACT' },
  cv:      { zh:'CV（PDF）', en:'CV (PDF)' },
  worksLink: { zh:'[全部作品 →]', en:'[ALL WORKS →]' },
  archiveToggle: { zh:'原版 About', en:'Original About' },
  /* 2026-11-14 按作者改稿落定。正文 5 段 + 两个日期标记：
       第 1 段 身份（名字 / 生日 / 现居）      第 2 段 教育
       第 3 段 当前工作（模块合成器 / 乐器界面 / 媒介与算法 / 两件作品）
       第 4 段 履历与分工
       第 5 段 希望大家都幸福，沿用 2026.06.10
     第 1–4 段组日期 2026.11.13；第 5 段 2026.06.10。
     文末另有一个折叠的「原版 About」：重写前 HEAD 里的 8 段版（含 2026.06.10 / 2026.06.24
     两个日期），默认收起；oldBio* / oldDate* 即那 8 段原文，逐字保留，不做润色。
     verify 第九节的「无 JS 也有 N 段」只数 .bio 的直接子 p（5 段），折叠区里的 p 不计入。 */
  bio1: {
    zh: '泻火，曹浩轩、曹天予、Jerry。2004 年 6 月 24 日生于合肥，现居上海。',
    en: 'Xiehuo — also Cao Haoxuan, Cao Tianyu, Jerry. Born in Hefei on 24 June 2004; now based in Shanghai.'
  },
  bio2: {
    zh: '自 2023 年起就读于上海音乐学院音乐工程系，艺术与科技（音乐科技与艺术）专业。现在大四，预计 2027 年 6 月毕业。',
    en: 'Studying Arts and Technology (specialism: Music Technology and Arts) in the Department of Music Engineering at the Shanghai Conservatory of Music since 2023. Currently a fourth-year student; expected to graduate in June 2027.'
  },
  bio3: {
    zh: '当前的工作主要包括模块合成器和乐器界面设计，包括设计与生产 Eurorack 格式的模块合成器。在 2023–2025 年间与 Ciiyte 共同设计了一款 6U104HP 的模块合成器机箱，当前也正在设计一些数字和模拟的模块合成器硬件。其余工作则主要是非传统声音媒介与算法的探索——电磁场、房间、线缆、拼接合成、神经网络等。作品包括 THE INDUCTION MIXER 和 riverrun：一台靠电磁感应演奏的混音器和基于它创作的《芬尼根的守灵夜》交互性有声书等。',
    en: 'Current work is mainly modular synthesizers and instrument interface design, including designing and producing Eurorack modules. Co-designed the 6U104HP Eurorack case with Ciiyte between 2023 and 2025; currently also designing some digital and analogue module hardware. The rest of the work is mostly an exploration of non-traditional sound media and algorithms — electromagnetic fields, rooms, cables, concatenative synthesis, neural networks. Works include, among others, THE INDUCTION MIXER and riverrun: a mixer played through electromagnetic induction, and an interactive audiobook of Finnegans Wake built on it.'
  },
  bio4: {
    zh: '作品在上海国际乐器展（2024、2025）、交流方式（2024、2025）、Trigger、antianti、Cedar Land 等活动、场地展出与演出过。部分作品与钢铁大腿、Allen、闫开、Ciiyte 等人合作完成，具体分工请查看作品页。',
    en: 'Works have been shown and performed at Music China (2024, 2025), Modular Commune (2024, 2025), Trigger, antianti, Cedar Land and other events and venues. Some of the works were made in collaboration with 钢铁大腿, Allen, 闫开, Ciiyte and others; the credits are on each work\'s page.'
  },
  updated: { zh:'2026.11.13', en:'2026.11.13' },
  bio5: {
    zh: '希望大家都幸福。',
    en: 'I hope everyone is happy.'
  },
  hopeDate: { zh:'2026.06.10', en:'2026.06.10' },
  /* ===== 折叠的原版 About（重写前 HEAD 的 8 段，逐字保留）===== */
  oldBio1: {
    zh: '我真的非常讨厌解释我是谁，解释我做什么，解释我的作品是做什么、表达什么、关于什么。但是无论如何都还是得做这种事情，这也是没有办法的事情。我是泻火，我是曹浩轩，我是曹天予，我是Jerry，我2004年6月24日出生，你要是乐意在我生日的时候可以给我买点好玩的生日礼物，太贵的我就不要了。',
    en: 'I really hate explaining who I am, what I do, what my works are about, what they express, what they concern. But no matter what, I still have to do this sort of thing — there\'s just no way around it. I am Xiehuo, I am Cao Haoxuan, I am Cao Tianyu, I am Jerry. I was born on June 24, 2004. If you\'d like, you can get me something fun for my birthday, but nothing too expensive — I won\'t take it.'
  },
  oldBio2: {
    zh: '我最开始做艺术，或者说梦想着做艺术其实只是因为我精神实在是太差了。为什么要说"只是"呢？可能是因为似乎所有人都可以且理所应当把自己的精神稳定住。但是这当然是不可能的，这简直是这个世界上最难的事情。',
    en: 'In the beginning I made art, or rather dreamed of making art, simply because my mental state was truly terrible. Why say "simply"? Maybe because it seems like everyone can and ought to be able to stabilize their own mind. But of course that\'s impossible — it is simply the hardest thing in this world.'
  },
  oldBio3: {
    zh: '总之我其实不想做艺术，我也搞不懂自己到底在干嘛，各种事情都随便吧。无论如何我还是学了计算机音乐啊、模块合成器啊、合成法啊各种东西，还看了不少的书、电影、作品之类的，无所谓了。我在说什么呢。总之这几年蛮好的。',
    en: 'Anyway, I don\'t actually want to make art, and I can\'t even figure out what I\'m doing. Whatever, everything is whatever. Regardless, I still studied computer music, modular synthesizers, synthesis methods and all sorts of things, and read quite a few books, watched films, experienced works — whatever. What am I even saying. Anyway, these past few years have been pretty good.'
  },
  oldBio4: {
    zh: '我知道大家一般来说想看的不是这些东西。要说的话我主要就是玩一玩模块合成器，自己也会做一点，然后就是研究一些乐器界面相关的内容，研究一些合成法相关的内容，还有就是我蛮在乎艺术的政治化的，除此之外也没什么了。',
    en: 'I know that generally speaking, this isn\'t what people come here to see. If I must say, I mainly play around with modular synthesizers, build some myself, and then I research things related to musical interfaces, things related to synthesis methods, and I care quite a bit about the politicization of art. Other than that, nothing much.'
  },
  oldBio5: {
    zh: '我现在就读于上海音乐学院音乐工程系，艺术与科技专业。',
    en: 'I am currently studying at the Shanghai Conservatory of Music, Department of Music Engineering, majoring in Art and Technology.'
  },
  oldBio6: {
    zh: '希望大家都幸福。',
    en: 'I hope everyone is happy.'
  },
  oldDate1: { zh:'2026.06.10', en:'2026.06.10' },
  oldBio7: {
    zh: '我最喜欢的艺术家应该是Christina Kubisch、Cathy Van Eck。',
    en: 'My favorite artists are probably Christina Kubisch and Cathy Van Eck.'
  },
  oldBio8: {
    zh: '我妈说我标点用错了。',
    en: 'My mom says I used the wrong punctuation.'
  },
  oldDate2: { zh:'2026.06.24', en:'2026.06.24' }
};
