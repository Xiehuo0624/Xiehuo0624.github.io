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
    media: { type: 'image', src: 'img/the-just-type-study-still.webp' },
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
    brief: { zh:'与钢铁大腿共同创作的回授声音演出，关于模糊的边缘与失控', en:'A feedback sound performance co-created with Gangtie Datui, about blurred edges and loss of control' },
    desc:  { file: true },
    media: { type: 'bilibili', bvid: 'BV1VbxyzaEKA' }
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
    media: { type: 'image', src: 'img/ecce-homo-still.webp' },
    audio: 'audio/ecce-homo.m4a'
  },

  'wwhbh': {
    layout: 'wwhbh',
    title: { zh:'我们将会曾经在这里', en:'WE WILL HAVE BEEN HERE' },
    brief: { zh:'基于麦克风与扬声器回授的声音概念，关于时间、记忆与易失性', en:'A microphone-loudspeaker feedback concept piece about time, memory, and volatility' },
    desc: { file: true }
  }
};

/** 作品显示顺序（从新到旧） */
App.projectOrder = [
  '6u104hp',
  'the-just-type-study',
  'the-induction-mixer',
  'riverrun',
  'edgedgedge',
  'spectral-dissector',
  'ecce-homo',
  'wwhbh'
];
