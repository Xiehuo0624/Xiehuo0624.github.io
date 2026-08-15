/* ===== PROJECT DATA ===== */
App.projects = {
  '6u104hp': {
    layout: 'gallery',
    title: { zh:'6U104HP', en:'6U104HP' },
    brief: { zh:'与Ciiyte共同设计的6/7U 104HP Eurorack电源箱', en:'A 6/7U 104HP Eurorack power case co-designed with Ciiyte' },
    desc: { file: true },
    media: { type: 'gallery', images: ['img/6u104hp.webp','img/6u104hp-11.webp','img/6u104hp-2.webp','img/6u104hp-3.webp','img/6u104hp-4.webp','img/6u104hp-5.webp','img/6u104hp-6.webp','img/6u104hp-7.webp','img/6u104hp-8.webp','img/6u104hp-9.webp','img/6u104hp-10.webp'] }
  },

  'the-just-type-study': {
    layout: 'ecce',
    title: { zh:'The JustType Study', en:'The JustType Study' },
    brief: { zh:'以 JustType 为核心的模块合成器系统设计', en:'A modular synthesizer system designed around JustType' },
    desc: { file: true },
    media: { type: 'image', src: 'img/the-just-type-study-still.webp' },
    audio: 'audio/the-just-type-study.m4a'
  },

  'the-fet-mixer': {
    layout: 'gallery',
    title: { zh:'THE FET MIXER', en:'THE FET MIXER' },
    brief: { zh:'12输入4输出的空间混音器，基于电磁波传输与拾取', en:'A 12-in 4-out spatial mixer based on electromagnetic wave transmission and pickup' },
    desc: { file: true },
    media: { type: 'gallery', images: ['img/the-fet-mixer.webp','img/the-fet-mixer-2.webp','img/the-fet-mixer-3.webp'] },
    related: [ { id:'riverrun', role:{ zh:'应用于', en:'Used in' } } ]
  },

  'riverrun': {
    layout: 'mixer',
    title: { zh:'riverrun', en:'riverrun' },
    lowercase: true,
    brief: { zh:'基于《芬尼根的守灵夜》与 The FET Mixer 的交互式声音装置', en:'An interactive sound installation based on Finnegans Wake and The FET Mixer' },
    desc: { file: true },
    audioDir: 'audio/riverrun',
    tracks: 12,
    related: [ { id:'the-fet-mixer', role:{ zh:'本作品使用', en:'Created with' } } ]
  },

  'edgedgedge': {
    layout: 'edge',
    title: { zh:'EDGEDGEDGE', en:'EDGEDGEDGE' },
    brief: { zh:'与钢铁大腿共同创作的回授声音装置，关于模糊的边缘与失控', en:'A feedback sound installation co-created with Gangtie Datui, about blurred edges and loss of control' },
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
    brief: { zh:'基于麦克风与扬声器回授的声音装置，关于时间、记忆与易失性', en:'A microphone-loudspeaker feedback installation about time, memory, and volatility' },
    desc: { file: true }
  }
};

/** 作品显示顺序（从新到旧） */
App.projectOrder = [
  '6u104hp',
  'the-just-type-study',
  'the-fet-mixer',
  'riverrun',
  'edgedgedge',
  'spectral-dissector',
  'ecce-homo',
  'wwhbh'
];
