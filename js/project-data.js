/* ===== PROJECT DATA ===== */
App.projects = {
  'the-fet-mixer': {
    layout: 'grid',
    title: { zh:'THE FET MIXER', en:'THE FET MIXER' },
    brief: { zh:'四通道场效应管混频器', en:'4-channel FET mixer' },
    desc:  { file: true }
  },

  'riverrun': {
    layout: 'grid',
    title: { zh:'riverrun', en:'riverrun' },
    brief: { zh:'河流即音乐本身', en:'The river is the music itself' },
    desc: { file: true }
  },

  'edgedgedge': {
    layout: 'grid',
    title: { zh:'EDGEDGEDGE', en:'EDGEDGEDGE' },
    brief: { zh:'边缘即一切', en:'Edge is everything' },
    desc:  { file: true }
  },

  'spectral-dissector': {
    layout: 'grid',
    title: { zh:'SPECTRAL DISSECTOR', en:'SPECTRAL DISSECTOR' },
    brief: { zh:'频谱解剖刀', en:'Spectral dissecting tool' },
    desc:  { file: true }
  },

  'ecce-homo': {
    layout: 'ecce',
    title: { zh:'瞧！这个人', en:'ECCE HOMO' },
    brief: { zh:'声音剧场：圣经·卡夫卡·肉身', en:'Sound theatre: Bible · Kafka · Flesh' },
    desc: { file: true },
    videoUrl: 'https://player.bilibili.com/player.html?bvid=BV1EUr6YoESn&autoplay=0'
  },

  'wwhbh': {
    layout: 'wwhbh',
    title: { zh:'我们将会曾经在这里', en:'WE WILL HAVE BEEN HERE' },
    brief: { zh:'未来完成时的在场证明', en:'A proof of presence in the future perfect tense' },
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
