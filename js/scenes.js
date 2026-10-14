window.DS = window.DS || {};

DS.gates = {
  steps: { img: 'gate-steps', w: 836, h: 647, o: { l: 0.3983, r: 0.5993, t: 0.1638, b: 0.4575 }, draw: 700, bottom: 800 },
  sand: { img: 'gate-sand', w: 1097, h: 620, o: { l: 0.4357, r: 0.5889, t: 0.1726, b: 0.4839 }, draw: 860, bottom: 800 },
  cliff: { img: 'gate-cliff', w: 768, h: 609, o: { l: 0.4323, r: 0.5703, t: 0.1232, b: 0.2972 }, draw: 800, bottom: 810 }
};

DS.peds = {
  boulder: { img: 'ped-boulder', w: 793, h: 450, cx: 0.5, top: 0.12, draw: 580 },
  rope: { img: 'ped-rope', w: 673, h: 452, cx: 0.5, top: 0.1, draw: 500 },
  sand: { img: 'ped-sand', w: 903, h: 323, cx: 0.5, top: 0.3, draw: 640 },
  pier: { img: 'ped-pier', w: 881, h: 653, cx: 0.5, top: 0.3, draw: 560 },
  ledge: { img: 'ped-ledge', w: 976, h: 741, cx: 0.62, top: 0.37, draw: 760 }
};

DS.strips = {
  calm: { img: 'sea-calm', w: 1573, h: 376 },
  calmb: { img: 'sea-calm-b', w: 1573, h: 376 },
  storm: { img: 'sea-storm', w: 1573, h: 444 }
};

DS.farSets = [
  [{ img: 'rock-stack', w: 511, h: 892, cx: 250, bottom: 650, draw: 230 }, { img: 'cliff-wall', w: 1281, h: 465, cx: 1620, bottom: 600, draw: 700 }],
  [{ img: 'cliff-wall', w: 1281, h: 465, cx: 330, bottom: 598, draw: 640, flip: true }, { img: 'rock-stack', w: 511, h: 892, cx: 1720, bottom: 655, draw: 210, flip: true }],
  [{ img: 'rock-cluster', w: 784, h: 379, cx: 300, bottom: 625, draw: 360 }, { img: 'rock-stack', w: 511, h: 892, cx: 1660, bottom: 645, draw: 250, flip: true }],
  [{ img: 'rock-stack', w: 511, h: 892, cx: 200, bottom: 640, draw: 270, flip: true }, { img: 'rock-cluster', w: 784, h: 379, cx: 1650, bottom: 620, draw: 330, flip: true }]
];

DS.scenes = [
  { bg: 'bg-01', jp: '朝凪', en: 'Morning calm', weather: 'sparkle', filter: 'none', exposure: 1.0, strip: 'calm', gate: 'steps', ped: 'boulder', side: 'R', clouds: false, dark: false,
    model: { src: 'home/iphone_16_pro_max.glb', name: 'iPhone 16 Pro Max', price: 1199, desc: '6.9-inch display, titanium frame, A18 Pro chip.' } },
  { bg: 'bg-02', jp: '快晴', en: 'Clear sky', weather: 'sparkle', filter: 'saturate(1.1) brightness(1.04)', exposure: 1.1, strip: 'calm', gate: 'sand', ped: 'pier', side: 'L', clouds: true, dark: false,
    model: { src: 'home/galaxy_a56.glb', name: 'Samsung Galaxy A56', price: 499, desc: '6.7-inch Super AMOLED screen and a 5000 mAh battery.' } },
  { bg: 'bg-03', jp: '強風', en: 'Strong wind', weather: 'none', filter: 'brightness(0.95) saturate(0.9)', exposure: 0.95, strip: 'calmb', gate: 'cliff', ped: 'sand', side: 'R', clouds: true, dark: false,
    model: { src: 'home/pixel_9a_rumored_design.glb', name: 'Google Pixel 9a', price: 499, desc: '6.3-inch display, Tensor G4 chip, seven years of updates.' } },
  { bg: 'bg-04', jp: '嵐', en: 'Storm', weather: 'storm', filter: 'brightness(0.62) contrast(1.05) saturate(0.85)', exposure: 0.6, strip: 'storm', gate: 'steps', ped: 'rope', side: 'L', clouds: false, dark: true,
    model: { src: 'home/nothing_phone_2a.glb', name: 'Nothing Phone (2a)', price: 349, desc: 'Glyph lights on the back, 6.7-inch AMOLED, clean software.' } },
  { bg: 'bg-05', jp: '雨', en: 'Rain', weather: 'rain', filter: 'brightness(0.8) saturate(0.7)', exposure: 0.75, strip: 'calmb', gate: 'sand', ped: 'boulder', side: 'R', clouds: false, dark: false,
    model: { src: 'home/one_plus_13s_3d_model.glb', name: 'OnePlus 13s', price: 649, desc: 'A compact flagship with the Snapdragon 8 Elite chip.' } },
  { bg: 'bg-06', jp: '夕焼け', en: 'Sunset', weather: 'leaves', filter: 'sepia(0.35) saturate(1.3) brightness(0.95)', exposure: 0.95, strip: 'calm', gate: 'cliff', ped: 'ledge', side: 'L', clouds: false, dark: false,
    model: { src: 'home/iphone_air.glb', name: 'iPhone Air', price: 999, desc: 'Ultra-thin titanium design with a 6.5-inch display.' } },
  { bg: 'bg-07', jp: '黄昏', en: 'Dusk', weather: 'lights', filter: 'brightness(0.6) saturate(0.75) sepia(0.2)', exposure: 0.6, strip: 'calm', gate: 'steps', ped: 'pier', side: 'R', clouds: false, dark: true,
    model: { src: 'home/vivo_x300_iris_purple.glb', name: 'vivo X300', price: 799, desc: 'A flagship camera phone in Iris Purple.' } },
  { bg: 'bg-08', jp: '霧', en: 'Fog', weather: 'fog', filter: 'brightness(1.05) saturate(0.45) contrast(0.8)', exposure: 0.9, strip: 'calmb', gate: 'sand', ped: 'rope', side: 'L', clouds: false, dark: false,
    model: { src: 'home/redmi_note_14__realistic_smartphone_3d_model.glb', name: 'Redmi Note 14', price: 249, desc: 'A big AMOLED display and a 108-megapixel main camera.' } },
  { bg: 'bg-09', jp: '月夜', en: 'Moonlit night', weather: 'stars', filter: 'brightness(0.5) saturate(0.6)', exposure: 0.45, strip: 'calm', gate: 'cliff', ped: 'sand', side: 'R', clouds: false, dark: true,
    model: { src: 'home/iphone_16_plus_green.glb', name: 'iPhone 16 Plus', price: 899, desc: '6.7-inch display, A18 chip and a battery that lasts all day.' } },
  { bg: 'bg-10', jp: '雪', en: 'Snow', weather: 'snow', filter: 'brightness(1.08) saturate(0.5)', exposure: 0.95, strip: 'calmb', gate: 'steps', ped: 'boulder', side: 'L', clouds: false, dark: false,
    model: { hit: { w: 600, h: 260 }, dy: 270, src: 'home/keychron_q1_pro.glb', name: 'Keychron Q1 Pro', price: 199, desc: 'A wireless 75% mechanical keyboard with an aluminium body.' } },
  { bg: 'bg-11', jp: '夜明け', en: 'Dawn', weather: 'snowlight', filter: 'saturate(0.8) sepia(0.1)', exposure: 0.9, strip: 'none', pedBottom: 870, gate: 'sand', ped: 'rope', side: 'R', clouds: false, dark: false,
    model: { hit: { w: 220, h: 420 }, zoom: '146%', orient: '90deg 0deg 0deg', float: true, dy: 25, src: 'home/m.2_nvme_ssd_samsung_990_pro_1tb_3d_model.glb', name: 'Samsung 990 Pro 1TB', price: 149, desc: 'NVMe M.2 SSD with read speeds up to 7,450 MB/s.' } }
];
