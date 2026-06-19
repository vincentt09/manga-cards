// ─── Card Image System ────────────────────────────────────────────────────────
// Primary: AniList CDN (s4.anilist.co) — public, HD, no hotlink restriction
// Fallback: wsrv.nl proxy over MAL CDN for characters not on AniList

function mal(path) {
  return `https://wsrv.nl/?url=cdn.myanimelist.net${path}&w=300&h=400&fit=cover&output=jpg&q=85`;
}

export const CARD_IMAGE_URLS = {
  // ══════════ NARUTO ══════════
  naruto_hinata:      "https://s4.anilist.co/file/anilistcdn/character/large/b5114-wKkBpJApNvNz.png",
  naruto_konohamaru:  "https://s4.anilist.co/file/anilistcdn/character/large/n3889-gCUewPsRY2kD.png",
  naruto_sakura:      "https://s4.anilist.co/file/anilistcdn/character/large/b145-IorfpI8arxeX.png",
  naruto_rocklee:     "https://s4.anilist.co/file/anilistcdn/character/large/b306-oUTOO45xInXt.png",
  naruto_itachi:      "https://s4.anilist.co/file/anilistcdn/character/large/b14-9Kb1E5oel1ke.png",
  naruto_kakashi:     "https://s4.anilist.co/file/anilistcdn/character/large/b85-mkVBh2yjxjmx.png",
  naruto_pain:        "https://s4.anilist.co/file/anilistcdn/character/large/b3180-ITMGBLWNBOgV.png",
  naruto_sasuke_b:    "https://s4.anilist.co/file/anilistcdn/character/large/b13-SISLEw1oAD7a.png",
  naruto_sasuke_a:    "https://s4.anilist.co/file/anilistcdn/character/large/b13-SISLEw1oAD7a.png",
  naruto_naruto_b:    "https://s4.anilist.co/file/anilistcdn/character/large/b17-phjcWCkRuIhu.png",
  naruto_kurama_b:    mal("/images/characters/10/406295.jpg"),
  naruto_kurama_a:    mal("/images/characters/2/458980.jpg"),

  // ══════════ ONE PIECE ══════════
  op_usopp:           "https://s4.anilist.co/file/anilistcdn/character/large/b724-GFGgI9AJQkfy.jpg",
  op_chopper:         "https://s4.anilist.co/file/anilistcdn/character/large/b309-H64NhbJ2ywIQ.jpg",
  op_nami:            "https://s4.anilist.co/file/anilistcdn/character/large/b723-YhHEXAi5AMg5.jpg",
  op_law:             "https://s4.anilist.co/file/anilistcdn/character/large/b22023-K4FfSH3TKUQH.jpg",
  op_sanji:           "https://s4.anilist.co/file/anilistcdn/character/large/b721-8UbLAw7bZjDq.jpg",
  op_zoro:            "https://s4.anilist.co/file/anilistcdn/character/large/b720-GvgzPLsIw7T2.jpg",
  op_shanks:          "https://s4.anilist.co/file/anilistcdn/character/large/b1163-pjxIHLPiYqjP.jpg",
  op_luffy_b:         "https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png",
  op_luffy_a:         "https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png",
  op_g5_b:            "https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png",
  op_g5_a:            "https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png",

  // ══════════ DRAGON BALL ══════════
  db_krillin:         "https://s4.anilist.co/file/anilistcdn/character/large/b913-KgPVNaZJFBtM.png",
  db_piccolo:         "https://s4.anilist.co/file/anilistcdn/character/large/b914-E2oLAMSrjN49.png",
  db_gohan:           "https://s4.anilist.co/file/anilistcdn/character/large/b916-UqLFRcOj4Vpj.png",
  db_freezer:         "https://s4.anilist.co/file/anilistcdn/character/large/b919-JF4xAQTX1MiI.png",
  db_vegeta:          "https://s4.anilist.co/file/anilistcdn/character/large/b912-BCOlFgpRRKm9.png",
  db_beerus:          "https://s4.anilist.co/file/anilistcdn/character/large/b78679-CmRPIBFiSenp.png",
  db_goku_b:          "https://s4.anilist.co/file/anilistcdn/character/large/246-wsRRr6z1kii8.png",
  db_goku_a:          "https://s4.anilist.co/file/anilistcdn/character/large/246-wsRRr6z1kii8.png",
  db_ui_b:            "https://s4.anilist.co/file/anilistcdn/character/large/246-wsRRr6z1kii8.png",
  db_ui_a:            "https://s4.anilist.co/file/anilistcdn/character/large/246-wsRRr6z1kii8.png",

  // ══════════ ATTACK ON TITAN ══════════
  aot_armin:          "https://s4.anilist.co/file/anilistcdn/character/large/b40779-YblnYHLHE4QE.png",
  aot_hange:          "https://s4.anilist.co/file/anilistcdn/character/large/b40781-EzePMQz0XVlr.png",
  aot_mikasa:         "https://s4.anilist.co/file/anilistcdn/character/large/b40778-KEMhB2OOOZKW.png",
  aot_eren:           "https://s4.anilist.co/file/anilistcdn/character/large/b40777-GlOqBp5SqYlW.png",
  aot_titan_eren:     "https://s4.anilist.co/file/anilistcdn/character/large/b40777-GlOqBp5SqYlW.png",
  aot_levi_b:         "https://s4.anilist.co/file/anilistcdn/character/large/b40780-J7o9FKvQZjfX.png",
  aot_levi_a:         "https://s4.anilist.co/file/anilistcdn/character/large/b40780-J7o9FKvQZjfX.png",
  aot_rumbling_b:     "https://s4.anilist.co/file/anilistcdn/character/large/b40777-GlOqBp5SqYlW.png",
  aot_rumbling_a:     "https://s4.anilist.co/file/anilistcdn/character/large/b40777-GlOqBp5SqYlW.png",

  // ══════════ DEMON SLAYER ══════════
  ds_zenitsu:         "https://s4.anilist.co/file/anilistcdn/character/large/b138488-moxvVX0rFdGX.png",
  ds_inosuke:         "https://s4.anilist.co/file/anilistcdn/character/large/b138489-ZVGjMblKxUkM.png",
  ds_nezuko:          "https://s4.anilist.co/file/anilistcdn/character/large/b138486-vuHxZbYMGxNz.png",
  ds_tanjiro:         "https://s4.anilist.co/file/anilistcdn/character/large/b138485-9jQBoMKiVMSx.png",
  ds_rengoku:         "https://s4.anilist.co/file/anilistcdn/character/large/b138492-gxKXrpNtyQwN.png",
  ds_yoriichi_b:      mal("/images/characters/7/440799.jpg"),
  ds_yoriichi_a:      mal("/images/characters/7/440799.jpg"),
  ds_muzan_b:         "https://s4.anilist.co/file/anilistcdn/character/large/b138490-0kTD0p5bMpXR.png",
  ds_muzan_a:         "https://s4.anilist.co/file/anilistcdn/character/large/b138490-0kTD0p5bMpXR.png",

  // ══════════ JUJUTSU KAISEN ══════════
  jjk_nobara:         "https://s4.anilist.co/file/anilistcdn/character/large/b127694-MN53g6oBbCTR.png",
  jjk_megumi:         "https://s4.anilist.co/file/anilistcdn/character/large/b127693-WVuFpRSnJuJC.png",
  jjk_yuji:           "https://s4.anilist.co/file/anilistcdn/character/large/b127692-uZr4PApMdqxP.png",
  jjk_nanami:         "https://s4.anilist.co/file/anilistcdn/character/large/b127696-Pjb8SKyL8YFj.png",
  jjk_sukuna_ep:      "https://s4.anilist.co/file/anilistcdn/character/large/b127695-kRv2RQW2a2MN.png",
  jjk_gojo_b:         "https://s4.anilist.co/file/anilistcdn/character/large/b127691-9zqh1xpIubn7.png",
  jjk_gojo_a:         "https://s4.anilist.co/file/anilistcdn/character/large/b127691-9zqh1xpIubn7.png",
  jjk_sukuna_b:       "https://s4.anilist.co/file/anilistcdn/character/large/b127695-kRv2RQW2a2MN.png",
  jjk_sukuna_a:       "https://s4.anilist.co/file/anilistcdn/character/large/b127695-kRv2RQW2a2MN.png",

  // ══════════ MY HERO ACADEMIA ══════════
  mha_uraraka:        "https://s4.anilist.co/file/anilistcdn/character/large/b100563-K5XRdiLTsnnZ.png",
  mha_bakugo:         "https://s4.anilist.co/file/anilistcdn/character/large/b100559-fepZg4zYBCzO.png",
  mha_todoroki:       "https://s4.anilist.co/file/anilistcdn/character/large/b100562-y6TDMR3LbluQ.png",
  mha_deku:           "https://s4.anilist.co/file/anilistcdn/character/large/b100556-aX4LkiDDDLvW.png",
  mha_endeavor:       "https://s4.anilist.co/file/anilistcdn/character/large/b100571-HlbpKkp8sCqV.png",
  mha_hawks:          "https://s4.anilist.co/file/anilistcdn/character/large/b130171-cF7sPVKFKFIj.png",
  mha_allmight_b:     "https://s4.anilist.co/file/anilistcdn/character/large/b100555-AMfROEqPVKnU.png",
  mha_allmight_a:     "https://s4.anilist.co/file/anilistcdn/character/large/b100555-AMfROEqPVKnU.png",
  mha_deku_s_b:       "https://s4.anilist.co/file/anilistcdn/character/large/b100556-aX4LkiDDDLvW.png",
  mha_deku_s_a:       "https://s4.anilist.co/file/anilistcdn/character/large/b100556-aX4LkiDDDLvW.png",
};

// Per-rarity color schemes for the SVG card background fallback
export const RARITY_COLORS = {
  common:     { bg: "#1e293b", accent: "#64748b", text: "#94a3b8" },
  rare:       { bg: "#0f172a", accent: "#3b82f6", text: "#93c5fd" },
  ultra_rare: { bg: "#0e1a2b", accent: "#06b6d4", text: "#67e8f9" },
  epic:       { bg: "#1a0b2e", accent: "#a855f7", text: "#d8b4fe" },
  legendary:  { bg: "#1a0a00", accent: "#f59e0b", text: "#fde68a" },
  secret:     { bg: "#1a0010", accent: "#f43f5e", text: "#fda4af" },
};

export function getCardImageUrl(cardId) {
  return CARD_IMAGE_URLS[cardId] || null;
}