(function () {
  const G = window.G;
  G.REWARDS = [
    { id: 'ddr3', level: 1, name: 'DDR3 RAM Module', jp: 'メモリ', kind: 'ram', tint: '#2f8f5a', model: 'ddr3_ram.glb', price: 39, desc: 'A classic DDR3 memory stick. Old, humble and still running strong.' },
    { id: 'cooler', level: 2, name: 'Corsair H150i Liquid Cooler', jp: '水冷', kind: 'cooler', tint: '#3d9cff', model: 'corsair_h150i_elitie_cpu_liquid_cooler.glb', price: 189, desc: 'A 360 mm liquid cooler with a glowing pump head. Keeps hot chips calm.' },
    { id: 'arctis', level: 2, name: 'SteelSeries Arctis Wireless Pro', jp: 'ヘッドセット', kind: 'headset', tint: '#ff8a2a', model: 'steelseries_arctis_wireless_pro.glb', price: 329, desc: 'A wireless headset with a clean, wide sound. Hear every footstep.' },
    { id: 'strix', level: 3, name: 'ASUS ROG Strix Keyboard', jp: 'キーボード', kind: 'keyboard', tint: '#e8553a', model: 'asus_rog_strix_keyboard.glb', price: 199, desc: 'A mechanical gaming keyboard with per-key light. Fast and loud in the best way.' },
    { id: 'blackwidow', level: 3, name: 'Razer BlackWidow Chroma', jp: 'メカニカル', kind: 'keyboard', tint: '#58e05a', model: 'razer_blackwidow_chroma.glb', price: 139, desc: 'A legendary clicky keyboard with rainbow backlight.' },
    { id: 'poco', level: 4, name: 'POCO F7', jp: 'スマホ', kind: 'phone', tint: '#f2c230', model: 'poco_f7.glb', price: 399, desc: 'A fast phone for mobile gaming, with a bright smooth screen.' },
    { id: 'r5', level: 4, name: 'AMD Ryzen 5 5600', jp: 'プロセッサ', kind: 'cpu', tint: '#e8553a', model: 'ryzen_5_5600.glb', price: 129, desc: 'Six cores of honest value. The sweet spot of a first gaming build.' },
    { id: 'swift', level: 5, name: 'ASUS ROG Swift PG279Q', jp: 'モニター', kind: 'monitor', tint: '#6fd6ff', model: 'rog_swift_pg279q_modified.glb', price: 599, desc: 'A 27 inch fast gaming monitor with a very high refresh rate.' },
    { id: 'r5070', level: 5, name: 'NVIDIA GeForce RTX 5070 Ti', jp: 'グラボ', kind: 'gpu', tint: '#76d13a', model: 'nvidia_rtx5070ti.glb', price: 749, desc: 'A strong modern graphics card for high settings at high resolution.' },
    { id: 'r4090', level: 6, name: 'ASUS ROG GeForce RTX 4090', jp: '最強グラボ', kind: 'gpu', tint: '#e8553a', model: 'asus_rog_geforce_rtx_4090_v2.0.glb', price: 1599, desc: 'A huge graphics card, one of the strongest of its generation.' },
    { id: 'r9', level: 6, name: 'AMD Ryzen 9 9950X3D', jp: 'CPU', kind: 'cpu', tint: '#f2c230', model: 'amd_ryzen_9_9950x3d_3d_model.glb', price: 699, desc: 'Sixteen cores with extra cache for games. A processor with no excuses.' },
    { id: 'r5090', level: 7, name: 'NVIDIA GeForce RTX 5090 Founders Edition', jp: '王者', kind: 'gpu', tint: '#b8e04a', model: 'nvidia_rtx_5090_founders_edition_-_free_download.glb', price: 1999, desc: 'The king of graphics cards. Dual-fan, silver, and very serious.' },
    { id: 'g9', level: 7, name: 'Samsung Odyssey OLED G9', jp: '最終報酬', kind: 'ultrawide', tint: '#8f4de0', model: 'samsung_odyssey_oled_g9.glb', price: 1299, desc: 'A super-ultrawide curved OLED monitor. The final prize of the adventure.' }
  ];
  G.rewardById = {};
  G.REWARDS.forEach(r => (G.rewardById[r.id] = r));

  G.LEVEL_NAMES = [
    { n: '1', name: 'Green Plains', jp: '草原' },
    { n: '2', name: 'Critter Town', jp: 'ようこそ' },
    { n: '3', name: 'Munch Maze', jp: 'めいろ' },
    { n: '4', name: 'Rivet Tower', jp: '塔' },
    { n: '5', name: 'Moonlit Inn', jp: 'ホテル' },
    { n: '6', name: 'Neon Maze', jp: 'めいろ 2' },
    { n: '7', name: 'Ember Castle', jp: 'お城' }
  ];
})();
