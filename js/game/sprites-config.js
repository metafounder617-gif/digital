window.GAME_SPRITES = {
  hero: { cell: [32, 32], folder: 'sprites/hero/', sheets: ['idle','walk','run','jump','fall','land','hurt','surprised','happy','look_front','wait'] },
  zipp: { cell: [32, 32], folder: 'sprites/zipp/', sheets: [] },
  munch: { cell: [32, 32], folder: 'sprites/munch/', sheets: [] },
  rivet: { cell: [64, 64], folder: 'sprites/rivet/', sheets: [] },
  tyrant: { cell: [64, 64], folder: 'sprites/tyrant/', sheets: [] },
  princess: { cell: [32, 48], folder: 'sprites/princess/', sheets: [] }
};

window.GAME_SPRITE_ANIMS = {
  idle: { n: 4, fps: 6 },
  walk: { n: 6, fps: 10 },
  run: { n: 6, fps: 14 },
  jump: { n: 3, fps: 8 },
  fall: { n: 2, fps: 8 },
  land: { n: 2, fps: 12 },
  hurt: { n: 2, fps: 10 },
  attack: { n: 5, fps: 14 },
  surprised: { n: 2, fps: 8 },
  happy: { n: 4, fps: 8 },
  look_front: { n: 1, fps: 1 },
  call: { n: 3, fps: 8 },
  point: { n: 2, fps: 8 },
  wait: { n: 2, fps: 4 },
  defeat: { n: 3, fps: 6 }
};
