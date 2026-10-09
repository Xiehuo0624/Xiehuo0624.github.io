/* ===== PROJECT DATA ===== */
App.projects = {
  '6u104hp': {
    layout: 'gallery',
    title: { zh:'6U104HP', en:'6U104HP' },
    brief: { zh:'与Ciiyte共同设计的6/7U 104HP Eurorack电源箱', en:'A 6/7U 104HP Eurorack power case co-designed with Ciiyte' },
    desc: { file: true },
    /* 图片按「段 → 组 → 图」组织：段给出大类，组把参展照按活动分开。
       21 张（11 产品 + 10 参展）走原来的等高横滑胶片条要拖约 15000px，
       且看不出还剩多少张，故改为纵向网格；点开仍是同一个 Lightbox。
       老式的扁平 media.images（the-induction-mixer 仍在用）由 js/project.js
       归一成同一形状，两件画廊作品共用一套渲染与样式。
       参展照的出处由「组标题」承担，所以不逐张写题注。 */
    media: {
      type: 'gallery',
      sections: [
        {
          label: { zh:'产品图', en:'Product' },
          images: ['img/6u104hp.webp','img/6u104hp-11.webp','img/6u104hp-2.webp','img/6u104hp-3.webp','img/6u104hp-4.webp','img/6u104hp-5.webp','img/6u104hp-6.webp','img/6u104hp-7.webp','img/6u104hp-8.webp','img/6u104hp-9.webp','img/6u104hp-10.webp']
        },
        {
          label: { zh:'参展记录', en:'Exhibition record' },
          groups: [
            { label: { zh:'上海国际乐器展 2024 · 第二版', en:'Music China 2024 · second version' },
              images: ['img/6u104hp-expo-1.webp','img/6u104hp-expo-2.webp','img/6u104hp-expo-3.webp'] },
            { label: { zh:'交流方式 2024 · 第二版', en:'Modular Commune 2024 · second version' },
              images: ['img/6u104hp-expo-4.webp','img/6u104hp-expo-5.webp','img/6u104hp-expo-6.webp'] },
            { label: { zh:'上海国际乐器展 2025 · 第三版', en:'Music China 2025 · third version' },
              images: ['img/6u104hp-expo-7.webp','img/6u104hp-expo-8.webp'] },
            { label: { zh:'交流方式 2025 · 第三版', en:'Modular Commune 2025 · third version' },
              images: ['img/6u104hp-expo-9.webp','img/6u104hp-expo-10.webp'] }
          ]
        }
      ]
    }
  },

  'the-just-type-study': {
    layout: 'ecce',
    title: { zh:'The JustType Study', en:'The JustType Study' },
    brief: { zh:'以 JustType 为核心的模块合成器系统设计', en:'A modular synthesizer system designed around JustType' },
    desc: { file: true },
    /* 2026.10.04 Cedar Land（上海 CPARK）那一场的海报与两张现场照：
       海报由作者提供的手机照片透视矫正裁切而来（绿色墙全部去掉，698×932）；
       两张剧照从 21 秒现场录像里抽帧。三张都走 buildGalleryGrid，图注见 App.imageCaptions。 */
    media: {
      type: 'image',
      /* crop: 'card' —— 顶部这张与首页卡片封面是同一张照片（卡片用 img/the-just-type-study.webp，
         1200×901；这里是 1600×1201 的同构图）。作者 2026-10-09 定：内页也用卡片那套裁切
         （cover + object-position 50% 72.5%），见 css/project.css 的 .ecce-still--card。 */
      crop: 'card',
      src: 'img/the-just-type-study-still.webp',
      photos: [
        'img/the-just-type-study-cedarland-poster.webp',
        'img/the-just-type-study-cedarland-live-1.webp',
        'img/the-just-type-study-cedarland-live-2.webp'
      ]
    },
    audio: 'audio/the-just-type-study.m4a'
  },

  'the-induction-mixer': {
    layout: 'gallery',
    title: { zh:'THE INDUCTION MIXER', en:'THE INDUCTION MIXER' },
    subtitle: { zh:'基于近场电磁感应的交互式矩阵电子混音器的乐器设计', en:'An interactive matrix electronic mixer built on near-field electromagnetic induction' },
    brief: { zh:'基于近场电磁感应的12输入4输出空间混音器', en:'A 12-in 4-out spatial mixer based on near-field electromagnetic induction' },
    desc: { file: true },
    media: { type: 'gallery', images: ['img/the-induction-mixer.webp','img/the-induction-mixer-2.webp','img/the-induction-mixer-3.webp'] },
    related: [ { id:'riverrun', role:{ zh:'应用于', en:'Used in' } } ]
  },

  'riverrun': {
    layout: 'mixer',
    title: { zh:'riverrun', en:'riverrun' },
    lowercase: true,
    brief: { zh:'基于《芬尼根的守灵夜》多义性的交互式声音作品', en:'An interactive sound work on the polysemy of Finnegans Wake' },
    desc: { file: true },
    audioDir: 'audio/riverrun',
    tracks: 12,
    related: [ { id:'the-induction-mixer', role:{ zh:'本作品使用', en:'Created with' } } ]
  },

  'edgedgedge': {
    layout: 'edge',
    title: { zh:'EDGEDGEDGE', en:'EDGEDGEDGE' },
    brief: { zh:'与钢铁大腿共同创作的回授声音演出，关于模糊的边缘与失控', en:'A feedback sound performance co-created with 钢铁大腿, about blurred edges and loss of control' },
    desc:  { file: true },
    /* 2025.06.28 Trigger 的现场资料：录音走顶层 audio（与 ecce-homo／just-type 同一机制），
       照片走 media.photos —— 由 js/project.js 的 edge 分支交给 buildGalleryGrid，
       与 6U104HP 共用同一套网格与 Lightbox，所以这里只是纯 src 列表。
       规格：1600px 长边、cwebp -q 80；原图（4240×2832、无 EXIF 方向）不入库。 */
    audio: 'audio/edgedgedge.m4a',
    media: {
      type: 'youtube',
      /* 2025.06.28 Trigger 现场录像，作者自己的频道。
         内嵌 URL 由 js/project.js 与 scripts/gen-projects.mjs 各自拼出，两处必须一致。 */
      videoId: 'p418kifEC_4',
      photos: [
        'img/edgedgedge-live-01.webp', 'img/edgedgedge-live-05.webp', 'img/edgedgedge-live-07.webp',
        'img/edgedgedge-live-08.webp', 'img/edgedgedge-live-11.webp', 'img/edgedgedge-live-12.webp'
      ]
    }
  },

  'spectral-dissector': {
    layout: 'ecce',
    title: { zh:'SPECTRAL DISSECTOR', en:'SPECTRAL DISSECTOR' },
    brief: { zh:'基于频谱噪声门、HPSS 与倒谱的基频、谐波、瞬态与噪音分离插件', en:'A fundamental, harmonic, transient, and noise separation plugin based on Spectral Noise Gate, HPSS, and Cepstrum' },
    desc:  { file: true },
    media: { type: 'image', src: 'img/spectral-dissector-2.webp' }
  },

  'ecce-homo': {
    layout: 'ecce',
    title: { zh:'瞧！这个人', en:'ECCE HOMO' },
    brief: { zh:'与 Allen 共同创作的声音剧场作品，交织《圣经》与卡夫卡的文本', en:'A sound theatre piece co-created with Allen, interweaving Biblical and Kafkaesque texts' },
    desc: { file: true },
    /* 2025.01.05「声东击西」（学术厅）的剧照：2026-10-07 作者从 40 张里筛出 8 张，
       放在正文之后，交给 buildGalleryGrid，与 6U104HP／edgedgedge 共用同一套网格与
       Lightbox，所以这里只是纯 src 列表。
       规格：1600px 长边、cwebp -q 80；原图 8192×5464、无 EXIF 方向，不入库。 */
    media: {
      type: 'image',
      src: 'img/ecce-homo-still.webp',
      photos: [
        'img/ecce-homo-live-01.webp', 'img/ecce-homo-live-05.webp', 'img/ecce-homo-live-15.webp', 'img/ecce-homo-live-16.webp',
        'img/ecce-homo-live-22.webp', 'img/ecce-homo-live-25.webp', 'img/ecce-homo-live-38.webp', 'img/ecce-homo-live-40.webp'
      ]
    },
    audio: 'audio/ecce-homo.m4a'
  },

  'wwhbh': {
    layout: 'wwhbh',
    title: { zh:'我们将会曾经在这里', en:'WE WILL HAVE BEEN HERE' },
    brief: { zh:'基于麦克风与扬声器回授的声音概念，关于时间、记忆与易失性', en:'A microphone-loudspeaker feedback concept piece about time, memory, and volatility' },
    desc: { file: true },
    /* 2024.12.14「硬糖」@ Trigger（上海）那一场的现场资料：
       外录（房间）走顶层 audio —— 这件作品说的就是房间本身，内录另有留档；
       6 张照片（2026-10-07 从 24 张里筛出）走 media.photos，交给 buildGalleryGrid，
       与画廊页共用网格与 Lightbox。
       U 盘上还有 C0001–C0006 六段机位视频，等作者上传 YouTube 后再接。 */
    audio: 'audio/wwhbh-live.m4a',
    media: {
      photos: [
        'img/wwhbh-live-02.webp', 'img/wwhbh-live-03.webp', 'img/wwhbh-live-05.webp', 'img/wwhbh-live-19.webp', 'img/wwhbh-live-20.webp',
        'img/wwhbh-live-23.webp'
      ]
    }
  }
};

/** 图片图注（2026-10-09 作者逐张口述，我整理）。
 *  键是图片路径，必须与 media 里的 src 逐字相同；值是 { zh, en }。
 *  渲染位置：画廊网格里每张图下方（`<figcaption>`）与 Lightbox 底部；没有条目的图片不显示图注。
 *  口径：三件现场照（ecce-homo／wwhbh／edgedgedge，共 21 张）统一写「日期 + 场地」的场次级；
 *  6U104HP 的 21 张仍按展会分组，出处由组标题承担，不逐张写。
 *  有图注的图片，alt 直接用图注文字（比「作品名 — 现场照片」有信息量，见 js/project.js 的 applyGalleryLang）。 */
App.imageCaptions = {
  /* ECCE HOMO —— 2025.01.05「声东击西」，上音学术厅（剧照来自这一场） */
  'img/ecce-homo-still.webp': { zh: '2025.01.05「声东击西」汇报演出，上音学术厅', en: '2025.01.05, "Sheng Dong Ji Xi" presentation concert, Academic Hall, Shanghai Conservatory of Music' },
  'img/ecce-homo-live-01.webp': { zh: '2025.01.05「声东击西」汇报演出，上音学术厅', en: '2025.01.05, "Sheng Dong Ji Xi" presentation concert, Academic Hall, Shanghai Conservatory of Music' },
  'img/ecce-homo-live-05.webp': { zh: '2025.01.05「声东击西」汇报演出，上音学术厅', en: '2025.01.05, "Sheng Dong Ji Xi" presentation concert, Academic Hall, Shanghai Conservatory of Music' },
  'img/ecce-homo-live-15.webp': { zh: '2025.01.05「声东击西」汇报演出，上音学术厅', en: '2025.01.05, "Sheng Dong Ji Xi" presentation concert, Academic Hall, Shanghai Conservatory of Music' },
  'img/ecce-homo-live-16.webp': { zh: '2025.01.05「声东击西」汇报演出，上音学术厅', en: '2025.01.05, "Sheng Dong Ji Xi" presentation concert, Academic Hall, Shanghai Conservatory of Music' },
  'img/ecce-homo-live-22.webp': { zh: '2025.01.05「声东击西」汇报演出，上音学术厅', en: '2025.01.05, "Sheng Dong Ji Xi" presentation concert, Academic Hall, Shanghai Conservatory of Music' },
  'img/ecce-homo-live-25.webp': { zh: '2025.01.05「声东击西」汇报演出，上音学术厅', en: '2025.01.05, "Sheng Dong Ji Xi" presentation concert, Academic Hall, Shanghai Conservatory of Music' },
  'img/ecce-homo-live-38.webp': { zh: '2025.01.05「声东击西」汇报演出，上音学术厅', en: '2025.01.05, "Sheng Dong Ji Xi" presentation concert, Academic Hall, Shanghai Conservatory of Music' },
  'img/ecce-homo-live-40.webp': { zh: '2025.01.05「声东击西」汇报演出，上音学术厅', en: '2025.01.05, "Sheng Dong Ji Xi" presentation concert, Academic Hall, Shanghai Conservatory of Music' },

  /* WE WILL HAVE BEEN HERE —— 2024.12.14「硬糖」，Trigger（上海） */
  'img/wwhbh-live-02.webp': { zh: '2024.12.14「硬糖」，Trigger（上海）', en: '2024.12.14, "Hard Candy", Trigger, Shanghai' },
  'img/wwhbh-live-03.webp': { zh: '2024.12.14「硬糖」，Trigger（上海）', en: '2024.12.14, "Hard Candy", Trigger, Shanghai' },
  'img/wwhbh-live-05.webp': { zh: '2024.12.14「硬糖」，Trigger（上海）', en: '2024.12.14, "Hard Candy", Trigger, Shanghai' },
  'img/wwhbh-live-19.webp': { zh: '2024.12.14「硬糖」，Trigger（上海）', en: '2024.12.14, "Hard Candy", Trigger, Shanghai' },
  'img/wwhbh-live-20.webp': { zh: '2024.12.14「硬糖」，Trigger（上海）', en: '2024.12.14, "Hard Candy", Trigger, Shanghai' },
  'img/wwhbh-live-23.webp': { zh: '2024.12.14「硬糖」，Trigger（上海）', en: '2024.12.14, "Hard Candy", Trigger, Shanghai' },

  /* EDGEDGEDGE —— 2025.06.28 Trigger（上海）（与 wwhbh 那场不是同一场） */
  'img/edgedgedge-live-01.webp': { zh: '2025.06.28 Trigger（上海）', en: '2025.06.28, Trigger, Shanghai' },
  'img/edgedgedge-live-05.webp': { zh: '2025.06.28 Trigger（上海）', en: '2025.06.28, Trigger, Shanghai' },
  'img/edgedgedge-live-07.webp': { zh: '2025.06.28 Trigger（上海）', en: '2025.06.28, Trigger, Shanghai' },
  'img/edgedgedge-live-08.webp': { zh: '2025.06.28 Trigger（上海）', en: '2025.06.28, Trigger, Shanghai' },
  'img/edgedgedge-live-11.webp': { zh: '2025.06.28 Trigger（上海）', en: '2025.06.28, Trigger, Shanghai' },
  'img/edgedgedge-live-12.webp': { zh: '2025.06.28 Trigger（上海）', en: '2025.06.28, Trigger, Shanghai' },

  /* The JustType Study —— 2026.10.04 Cedar Land（上海 CPARK），受邀拼盘 */
  'img/the-just-type-study-cedarland-poster.webp': { zh: '2026.10.04 Cedar Land（上海 CPARK）演出海报', en: 'Poster for 2026.10.04, Cedar Land at CPARK, Shanghai' },
  'img/the-just-type-study-cedarland-live-1.webp': { zh: '2026.10.04 Cedar Land（上海 CPARK）现场', en: '2026.10.04, Cedar Land at CPARK, Shanghai' },
  'img/the-just-type-study-cedarland-live-2.webp': { zh: '2026.10.04 Cedar Land（上海 CPARK）现场', en: '2026.10.04, Cedar Land at CPARK, Shanghai' }
};

/** 作品显示顺序：按研究方向排列（2026-09-30 作者定），不按时间。
    研究线 = 传输媒介与乐器界面作为作曲材料；6U104HP 是支撑全部创作的工具，故置末。 */
App.projectOrder = [
  'the-induction-mixer',
  'riverrun',
  'wwhbh',
  'the-just-type-study',
  'spectral-dissector',
  'edgedgedge',
  'ecce-homo',
  '6u104hp'
];
