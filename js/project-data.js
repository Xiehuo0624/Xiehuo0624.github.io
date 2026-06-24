/* ===== PROJECT DATA ===== */
App.projects = {
  'the-fet-mixer': {
    layout: 'gallery',
    title: { zh:'THE FET MIXER', en:'THE FET MIXER' },
    brief: { zh:'12输入4输出的空间混音器，基于电磁波传输与拾取', en:'A 12-in 4-out spatial mixer based on electromagnetic wave transmission and pickup' },
    desc: { file: true },
    media: { type: 'gallery', images: ['img/the-fet-mixer-1.jpg','img/the-fet-mixer-2.png','img/the-fet-mixer-3.png'] }
  },

  'riverrun': {
    layout: 'grid',
    title: { zh:'riverrun', en:'riverrun' },
    lowercase: true,
    brief: { zh:'基于《芬尼根的守灵夜》与 The FET Mixer 的交互式声音装置', en:'An interactive sound installation based on Finnegans Wake and The FET Mixer' },
    desc: { file: true }
  },

  'edgedgedge': {
    layout: 'edge',
    title: { zh:'EDGEDGEDGE', en:'EDGEDGEDGE' },
    desc:  { file: true },
    media: { type: 'bilibili', bvid: 'BV1VbxyzaEKA', cover: 'img/edgedgedge.jpg' }
  },

  'spectral-dissector': {
    layout: 'grid',
    title: { zh:'SPECTRAL DISSECTOR', en:'SPECTRAL DISSECTOR' },
    desc:  { file: true }
  },

  'ecce-homo': {
    layout: 'ecce',
    title: { zh:'瞧！这个人', en:'ECCE HOMO' },
    brief: { zh:'与 Allen 共同创作的声音剧场作品，交织《圣经》与卡夫卡的文本', en:'A sound theatre piece co-created with Allen, interweaving Biblical and Kafkaesque texts' },
    desc: { file: true }
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
  'the-fet-mixer',
  'riverrun',
  'edgedgedge',
  'spectral-dissector',
  'ecce-homo',
  'wwhbh'
];
