// ─── CARD POOL ────────────────────────────────────────────────────────────────
// Chaque personnage a 4 versions : Normale, Légendaire, Secrète, Manga God
import { CARD_IMAGE_URLS } from './cardImages.js';

export const CARD_POOL = [

  // ══════════════════ NARUTO ══════════════════
  { id: "naruto_hinata_n",      name: "Hinata Hyuga",          anime: "Naruto", rarity: "normale",    basePower: 42, baseAttack: 38, baseDefense: 45, baseSpeed: 40, image_url: CARD_IMAGE_URLS.naruto_hinata },
  { id: "naruto_hinata_l",      name: "Hinata Hyuga",          anime: "Naruto", rarity: "legendaire", basePower: 88, baseAttack: 85, baseDefense: 82, baseSpeed: 86, image_url: CARD_IMAGE_URLS.naruto_hinata },
  { id: "naruto_hinata_s",      name: "Hinata Hyuga",          anime: "Naruto", rarity: "secrète",    basePower: 102, baseAttack: 98, baseDefense: 95, baseSpeed: 100, image_url: CARD_IMAGE_URLS.naruto_hinata },
  { id: "naruto_hinata_mg",     name: "Hinata Hyuga",          anime: "Naruto", rarity: "manga_god",  basePower: 115, baseAttack: 112, baseDefense: 108, baseSpeed: 110, image_url: CARD_IMAGE_URLS.naruto_hinata },

  { id: "naruto_sasuke_n",      name: "Sasuke Uchiha",         anime: "Naruto", rarity: "normale",    basePower: 48, baseAttack: 45, baseDefense: 42, baseSpeed: 46, image_url: CARD_IMAGE_URLS.naruto_sasuke_b },
  { id: "naruto_sasuke_l",      name: "Sasuke Uchiha",         anime: "Naruto", rarity: "legendaire", basePower: 94, baseAttack: 95, baseDefense: 85, baseSpeed: 92, image_url: CARD_IMAGE_URLS.naruto_sasuke_b },
  { id: "naruto_sasuke_s",      name: "Sasuke Uchiha",         anime: "Naruto", rarity: "secrète",    basePower: 108, baseAttack: 110, baseDefense: 95, baseSpeed: 105, image_url: CARD_IMAGE_URLS.naruto_sasuke_b },
  { id: "naruto_sasuke_mg",     name: "Sasuke Uchiha",         anime: "Naruto", rarity: "manga_god",  basePower: 120, baseAttack: 118, baseDefense: 105, baseSpeed: 115, image_url: CARD_IMAGE_URLS.naruto_sasuke_b },

  { id: "naruto_naruto_n",      name: "Naruto Uzumaki",        anime: "Naruto", rarity: "normale",    basePower: 45, baseAttack: 42, baseDefense: 40, baseSpeed: 44, image_url: CARD_IMAGE_URLS.naruto_naruto_b },
  { id: "naruto_naruto_l",      name: "Naruto Uzumaki",        anime: "Naruto", rarity: "legendaire", basePower: 95, baseAttack: 92, baseDefense: 85, baseSpeed: 90, image_url: CARD_IMAGE_URLS.naruto_naruto_b },
  { id: "naruto_naruto_s",      name: "Naruto Uzumaki",        anime: "Naruto", rarity: "secrète",    basePower: 110, baseAttack: 108, baseDefense: 98, baseSpeed: 105, image_url: CARD_IMAGE_URLS.naruto_naruto_b },
  { id: "naruto_naruto_mg",     name: "Naruto Uzumaki",        anime: "Naruto", rarity: "manga_god",  basePower: 122, baseAttack: 120, baseDefense: 105, baseSpeed: 112, image_url: CARD_IMAGE_URLS.naruto_naruto_b },

  { id: "naruto_kakashi_n",     name: "Kakashi Hatake",        anime: "Naruto", rarity: "normale",    basePower: 44, baseAttack: 42, baseDefense: 40, baseSpeed: 46, image_url: CARD_IMAGE_URLS.naruto_kakashi },
  { id: "naruto_kakashi_l",     name: "Kakashi Hatake",        anime: "Naruto", rarity: "legendaire", basePower: 90, baseAttack: 88, baseDefense: 82, baseSpeed: 92, image_url: CARD_IMAGE_URLS.naruto_kakashi },
  { id: "naruto_kakashi_s",     name: "Kakashi Hatake",        anime: "Naruto", rarity: "secrète",    basePower: 105, baseAttack: 102, baseDefense: 95, baseSpeed: 108, image_url: CARD_IMAGE_URLS.naruto_kakashi },
  { id: "naruto_kakashi_mg",    name: "Kakashi Hatake",        anime: "Naruto", rarity: "manga_god",  basePower: 118, baseAttack: 115, baseDefense: 102, baseSpeed: 116, image_url: CARD_IMAGE_URLS.naruto_kakashi },

  { id: "naruto_itachi_n",      name: "Itachi Uchiha",         anime: "Naruto", rarity: "normale",    basePower: 46, baseAttack: 44, baseDefense: 42, baseSpeed: 48, image_url: CARD_IMAGE_URLS.naruto_itachi },
  { id: "naruto_itachi_l",      name: "Itachi Uchiha",         anime: "Naruto", rarity: "legendaire", basePower: 92, baseAttack: 90, baseDefense: 85, baseSpeed: 94, image_url: CARD_IMAGE_URLS.naruto_itachi },
  { id: "naruto_itachi_s",      name: "Itachi Uchiha",         anime: "Naruto", rarity: "secrète",    basePower: 106, baseAttack: 104, baseDefense: 96, baseSpeed: 108, image_url: CARD_IMAGE_URLS.naruto_itachi },
  { id: "naruto_itachi_mg",     name: "Itachi Uchiha",         anime: "Naruto", rarity: "manga_god",  basePower: 119, baseAttack: 117, baseDefense: 103, baseSpeed: 114, image_url: CARD_IMAGE_URLS.naruto_itachi },

  // ══════════════════ ONE PIECE ══════════════════
  { id: "op_luffy_n",           name: "Monkey D. Luffy",       anime: "One Piece", rarity: "normale",    basePower: 48, baseAttack: 45, baseDefense: 42, baseSpeed: 46, image_url: CARD_IMAGE_URLS.op_luffy_b },
  { id: "op_luffy_l",           name: "Monkey D. Luffy",       anime: "One Piece", rarity: "legendaire", basePower: 96, baseAttack: 94, baseDefense: 86, baseSpeed: 92, image_url: CARD_IMAGE_URLS.op_luffy_b },
  { id: "op_luffy_s",           name: "Monkey D. Luffy",       anime: "One Piece", rarity: "secrète",    basePower: 112, baseAttack: 110, baseDefense: 98, baseSpeed: 106, image_url: CARD_IMAGE_URLS.op_luffy_b },
  { id: "op_luffy_mg",          name: "Monkey D. Luffy",       anime: "One Piece", rarity: "manga_god",  basePower: 125, baseAttack: 122, baseDefense: 108, baseSpeed: 118, image_url: CARD_IMAGE_URLS.op_luffy_b },

  { id: "op_zoro_n",            name: "Roronoa Zoro",          anime: "One Piece", rarity: "normale",    basePower: 46, baseAttack: 44, baseDefense: 40, baseSpeed: 44, image_url: CARD_IMAGE_URLS.op_zoro },
  { id: "op_zoro_l",            name: "Roronoa Zoro",          anime: "One Piece", rarity: "legendaire", basePower: 92, baseAttack: 95, baseDefense: 82, baseSpeed: 88, image_url: CARD_IMAGE_URLS.op_zoro },
  { id: "op_zoro_s",            name: "Roronoa Zoro",          anime: "One Piece", rarity: "secrète",    basePower: 108, baseAttack: 112, baseDefense: 95, baseSpeed: 102, image_url: CARD_IMAGE_URLS.op_zoro },
  { id: "op_zoro_mg",           name: "Roronoa Zoro",          anime: "One Piece", rarity: "manga_god",  basePower: 120, baseAttack: 118, baseDefense: 102, baseSpeed: 112, image_url: CARD_IMAGE_URLS.op_zoro },

  { id: "op_sanji_n",           name: "Sanji",                 anime: "One Piece", rarity: "normale",    basePower: 44, baseAttack: 42, baseDefense: 38, baseSpeed: 48, image_url: CARD_IMAGE_URLS.op_sanji },
  { id: "op_sanji_l",           name: "Sanji",                 anime: "One Piece", rarity: "legendaire", basePower: 88, baseAttack: 86, baseDefense: 78, baseSpeed: 94, image_url: CARD_IMAGE_URLS.op_sanji },
  { id: "op_sanji_s",           name: "Sanji",                 anime: "One Piece", rarity: "secrète",    basePower: 104, baseAttack: 102, baseDefense: 92, baseSpeed: 110, image_url: CARD_IMAGE_URLS.op_sanji },
  { id: "op_sanji_mg",          name: "Sanji",                 anime: "One Piece", rarity: "manga_god",  basePower: 117, baseAttack: 115, baseDefense: 98, baseSpeed: 118, image_url: CARD_IMAGE_URLS.op_sanji },

  { id: "op_nami_n",            name: "Nami",                  anime: "One Piece", rarity: "normale",    basePower: 40, baseAttack: 38, baseDefense: 35, baseSpeed: 46, image_url: CARD_IMAGE_URLS.op_nami },
  { id: "op_nami_l",            name: "Nami",                  anime: "One Piece", rarity: "legendaire", basePower: 82, baseAttack: 78, baseDefense: 72, baseSpeed: 90, image_url: CARD_IMAGE_URLS.op_nami },
  { id: "op_nami_s",            name: "Nami",                  anime: "One Piece", rarity: "secrète",    basePower: 98, baseAttack: 94, baseDefense: 86, baseSpeed: 106, image_url: CARD_IMAGE_URLS.op_nami },
  { id: "op_nami_mg",           name: "Nami",                  anime: "One Piece", rarity: "manga_god",  basePower: 112, baseAttack: 108, baseDefense: 95, baseSpeed: 116, image_url: CARD_IMAGE_URLS.op_nami },

  // ══════════════════ DRAGON BALL ══════════════════
  { id: "db_goku_n",            name: "Son Goku",              anime: "Dragon Ball", rarity: "normale",    basePower: 50, baseAttack: 48, baseDefense: 45, baseSpeed: 50, image_url: CARD_IMAGE_URLS.db_goku_b },
  { id: "db_goku_l",            name: "Son Goku",              anime: "Dragon Ball", rarity: "legendaire", basePower: 99, baseAttack: 97, baseDefense: 90, baseSpeed: 98, image_url: CARD_IMAGE_URLS.db_goku_b },
  { id: "db_goku_s",            name: "Son Goku",              anime: "Dragon Ball", rarity: "secrète",    basePower: 115, baseAttack: 112, baseDefense: 102, baseSpeed: 116, image_url: CARD_IMAGE_URLS.db_goku_b },
  { id: "db_goku_mg",           name: "Son Goku",              anime: "Dragon Ball", rarity: "manga_god",  basePower: 128, baseAttack: 125, baseDefense: 110, baseSpeed: 122, image_url: CARD_IMAGE_URLS.db_goku_b },

  { id: "db_vegeta_n",          name: "Vegeta",                anime: "Dragon Ball", rarity: "normale",    basePower: 48, baseAttack: 46, baseDefense: 44, baseSpeed: 48, image_url: CARD_IMAGE_URLS.db_vegeta },
  { id: "db_vegeta_l",          name: "Vegeta",                anime: "Dragon Ball", rarity: "legendaire", basePower: 96, baseAttack: 98, baseDefense: 88, baseSpeed: 94, image_url: CARD_IMAGE_URLS.db_vegeta },
  { id: "db_vegeta_s",          name: "Vegeta",                anime: "Dragon Ball", rarity: "secrète",    basePower: 112, baseAttack: 115, baseDefense: 100, baseSpeed: 108, image_url: CARD_IMAGE_URLS.db_vegeta },
  { id: "db_vegeta_mg",         name: "Vegeta",                anime: "Dragon Ball", rarity: "manga_god",  basePower: 125, baseAttack: 122, baseDefense: 108, baseSpeed: 118, image_url: CARD_IMAGE_URLS.db_vegeta },

  { id: "db_gohan_n",           name: "Gohan",                 anime: "Dragon Ball", rarity: "normale",    basePower: 46, baseAttack: 44, baseDefense: 42, baseSpeed: 46, image_url: CARD_IMAGE_URLS.db_gohan },
  { id: "db_gohan_l",           name: "Gohan",                 anime: "Dragon Ball", rarity: "legendaire", basePower: 92, baseAttack: 94, baseDefense: 85, baseSpeed: 90, image_url: CARD_IMAGE_URLS.db_gohan },
  { id: "db_gohan_s",           name: "Gohan",                 anime: "Dragon Ball", rarity: "secrète",    basePower: 108, baseAttack: 110, baseDefense: 96, baseSpeed: 104, image_url: CARD_IMAGE_URLS.db_gohan },
  { id: "db_gohan_mg",          name: "Gohan",                 anime: "Dragon Ball", rarity: "manga_god",  basePower: 120, baseAttack: 118, baseDefense: 102, baseSpeed: 114, image_url: CARD_IMAGE_URLS.db_gohan },

  { id: "db_freezer_n",         name: "Freezer",               anime: "Dragon Ball", rarity: "normale",    basePower: 47, baseAttack: 45, baseDefense: 43, baseSpeed: 47, image_url: CARD_IMAGE_URLS.db_freezer },
  { id: "db_freezer_l",         name: "Freezer",               anime: "Dragon Ball", rarity: "legendaire", basePower: 94, baseAttack: 96, baseDefense: 86, baseSpeed: 92, image_url: CARD_IMAGE_URLS.db_freezer },
  { id: "db_freezer_s",         name: "Freezer",               anime: "Dragon Ball", rarity: "secrète",    basePower: 110, baseAttack: 112, baseDefense: 98, baseSpeed: 106, image_url: CARD_IMAGE_URLS.db_freezer },
  { id: "db_freezer_mg",        name: "Freezer",               anime: "Dragon Ball", rarity: "manga_god",  basePower: 122, baseAttack: 120, baseDefense: 105, baseSpeed: 115, image_url: CARD_IMAGE_URLS.db_freezer },

  // ══════════════════ ATTACK ON TITAN ══════════════════
  { id: "aot_eren_n",           name: "Eren Yeager",           anime: "Attack on Titan", rarity: "normale",    basePower: 44, baseAttack: 42, baseDefense: 40, baseSpeed: 44, image_url: CARD_IMAGE_URLS.aot_eren },
  { id: "aot_eren_l",           name: "Eren Yeager",           anime: "Attack on Titan", rarity: "legendaire", basePower: 88, baseAttack: 90, baseDefense: 82, baseSpeed: 86, image_url: CARD_IMAGE_URLS.aot_eren },
  { id: "aot_eren_s",           name: "Eren Yeager",           anime: "Attack on Titan", rarity: "secrète",    basePower: 104, baseAttack: 106, baseDefense: 95, baseSpeed: 100, image_url: CARD_IMAGE_URLS.aot_eren },
  { id: "aot_eren_mg",          name: "Eren Yeager",           anime: "Attack on Titan", rarity: "manga_god",  basePower: 118, baseAttack: 115, baseDefense: 105, baseSpeed: 110, image_url: CARD_IMAGE_URLS.aot_eren },

  { id: "aot_levi_n",           name: "Levi Ackerman",         anime: "Attack on Titan", rarity: "normale",    basePower: 48, baseAttack: 46, baseDefense: 44, baseSpeed: 50, image_url: CARD_IMAGE_URLS.aot_levi_b },
  { id: "aot_levi_l",           name: "Levi Ackerman",         anime: "Attack on Titan", rarity: "legendaire", basePower: 96, baseAttack: 98, baseDefense: 86, baseSpeed: 100, image_url: CARD_IMAGE_URLS.aot_levi_b },
  { id: "aot_levi_s",           name: "Levi Ackerman",         anime: "Attack on Titan", rarity: "secrète",    basePower: 112, baseAttack: 114, baseDefense: 98, baseSpeed: 115, image_url: CARD_IMAGE_URLS.aot_levi_b },
  { id: "aot_levi_mg",          name: "Levi Ackerman",         anime: "Attack on Titan", rarity: "manga_god",  basePower: 124, baseAttack: 122, baseDefense: 105, baseSpeed: 120, image_url: CARD_IMAGE_URLS.aot_levi_b },

  { id: "aot_mikasa_n",         name: "Mikasa Ackerman",       anime: "Attack on Titan", rarity: "normale",    basePower: 46, baseAttack: 44, baseDefense: 42, baseSpeed: 48, image_url: CARD_IMAGE_URLS.aot_mikasa },
  { id: "aot_mikasa_l",         name: "Mikasa Ackerman",       anime: "Attack on Titan", rarity: "legendaire", basePower: 92, baseAttack: 94, baseDefense: 84, baseSpeed: 96, image_url: CARD_IMAGE_URLS.aot_mikasa },
  { id: "aot_mikasa_s",         name: "Mikasa Ackerman",       anime: "Attack on Titan", rarity: "secrète",    basePower: 108, baseAttack: 110, baseDefense: 96, baseSpeed: 110, image_url: CARD_IMAGE_URLS.aot_mikasa },
  { id: "aot_mikasa_mg",        name: "Mikasa Ackerman",       anime: "Attack on Titan", rarity: "manga_god",  basePower: 120, baseAttack: 118, baseDefense: 102, baseSpeed: 116, image_url: CARD_IMAGE_URLS.aot_mikasa },

  // ══════════════════ DEMON SLAYER ══════════════════
  { id: "ds_tanjiro_n",         name: "Tanjiro Kamado",        anime: "Demon Slayer", rarity: "normale",    basePower: 46, baseAttack: 44, baseDefense: 42, baseSpeed: 46, image_url: CARD_IMAGE_URLS.ds_tanjiro },
  { id: "ds_tanjiro_l",         name: "Tanjiro Kamado",        anime: "Demon Slayer", rarity: "legendaire", basePower: 92, baseAttack: 94, baseDefense: 86, baseSpeed: 90, image_url: CARD_IMAGE_URLS.ds_tanjiro },
  { id: "ds_tanjiro_s",         name: "Tanjiro Kamado",        anime: "Demon Slayer", rarity: "secrète",    basePower: 108, baseAttack: 110, baseDefense: 98, baseSpeed: 104, image_url: CARD_IMAGE_URLS.ds_tanjiro },
  { id: "ds_tanjiro_mg",        name: "Tanjiro Kamado",        anime: "Demon Slayer", rarity: "manga_god",  basePower: 120, baseAttack: 118, baseDefense: 105, baseSpeed: 112, image_url: CARD_IMAGE_URLS.ds_tanjiro },

  { id: "ds_zenitsu_n",         name: "Zenitsu Agatsuma",      anime: "Demon Slayer", rarity: "normale",    basePower: 42, baseAttack: 40, baseDefense: 38, baseSpeed: 48, image_url: CARD_IMAGE_URLS.ds_zenitsu },
  { id: "ds_zenitsu_l",         name: "Zenitsu Agatsuma",      anime: "Demon Slayer", rarity: "legendaire", basePower: 86, baseAttack: 88, baseDefense: 78, baseSpeed: 96, image_url: CARD_IMAGE_URLS.ds_zenitsu },
  { id: "ds_zenitsu_s",         name: "Zenitsu Agatsuma",      anime: "Demon Slayer", rarity: "secrète",    basePower: 102, baseAttack: 104, baseDefense: 92, baseSpeed: 112, image_url: CARD_IMAGE_URLS.ds_zenitsu },
  { id: "ds_zenitsu_mg",        name: "Zenitsu Agatsuma",      anime: "Demon Slayer", rarity: "manga_god",  basePower: 116, baseAttack: 114, baseDefense: 98, baseSpeed: 120, image_url: CARD_IMAGE_URLS.ds_zenitsu },

  { id: "ds_nezuko_n",          name: "Nezuko Kamado",         anime: "Demon Slayer", rarity: "normale",    basePower: 44, baseAttack: 42, baseDefense: 40, baseSpeed: 46, image_url: CARD_IMAGE_URLS.ds_nezuko },
  { id: "ds_nezuko_l",          name: "Nezuko Kamado",         anime: "Demon Slayer", rarity: "legendaire", basePower: 88, baseAttack: 86, baseDefense: 82, baseSpeed: 90, image_url: CARD_IMAGE_URLS.ds_nezuko },
  { id: "ds_nezuko_s",          name: "Nezuko Kamado",         anime: "Demon Slayer", rarity: "secrète",    basePower: 104, baseAttack: 102, baseDefense: 96, baseSpeed: 106, image_url: CARD_IMAGE_URLS.ds_nezuko },
  { id: "ds_nezuko_mg",         name: "Nezuko Kamado",         anime: "Demon Slayer", rarity: "manga_god",  basePower: 118, baseAttack: 116, baseDefense: 104, baseSpeed: 114, image_url: CARD_IMAGE_URLS.ds_nezuko },

  { id: "ds_rengoku_n",         name: "Rengoku Kyojuro",       anime: "Demon Slayer", rarity: "normale",    basePower: 48, baseAttack: 46, baseDefense: 44, baseSpeed: 48, image_url: CARD_IMAGE_URLS.ds_rengoku },
  { id: "ds_rengoku_l",         name: "Rengoku Kyojuro",       anime: "Demon Slayer", rarity: "legendaire", basePower: 94, baseAttack: 96, baseDefense: 88, baseSpeed: 92, image_url: CARD_IMAGE_URLS.ds_rengoku },
  { id: "ds_rengoku_s",         name: "Rengoku Kyojuro",       anime: "Demon Slayer", rarity: "secrète",    basePower: 110, baseAttack: 112, baseDefense: 100, baseSpeed: 106, image_url: CARD_IMAGE_URLS.ds_rengoku },
  { id: "ds_rengoku_mg",        name: "Rengoku Kyojuro",       anime: "Demon Slayer", rarity: "manga_god",  basePower: 122, baseAttack: 120, baseDefense: 108, baseSpeed: 114, image_url: CARD_IMAGE_URLS.ds_rengoku },

  // ══════════════════ JUJUTSU KAISEN ══════════════════
  { id: "jjk_gojo_n",           name: "Gojo Satoru",           anime: "Jujutsu Kaisen", rarity: "normale",    basePower: 50, baseAttack: 48, baseDefense: 46, baseSpeed: 50, image_url: CARD_IMAGE_URLS.jjk_gojo_b },
  { id: "jjk_gojo_l",           name: "Gojo Satoru",           anime: "Jujutsu Kaisen", rarity: "legendaire", basePower: 100, baseAttack: 98, baseDefense: 94, baseSpeed: 98, image_url: CARD_IMAGE_URLS.jjk_gojo_b },
  { id: "jjk_gojo_s",           name: "Gojo Satoru",           anime: "Jujutsu Kaisen", rarity: "secrète",    basePower: 116, baseAttack: 114, baseDefense: 104, baseSpeed: 112, image_url: CARD_IMAGE_URLS.jjk_gojo_b },
  { id: "jjk_gojo_mg",          name: "Gojo Satoru",           anime: "Jujutsu Kaisen", rarity: "manga_god",  basePower: 128, baseAttack: 126, baseDefense: 112, baseSpeed: 120, image_url: CARD_IMAGE_URLS.jjk_gojo_b },

  { id: "jjk_yuji_n",           name: "Itadori Yuji",          anime: "Jujutsu Kaisen", rarity: "normale",    basePower: 46, baseAttack: 44, baseDefense: 42, baseSpeed: 48, image_url: CARD_IMAGE_URLS.jjk_yuji },
  { id: "jjk_yuji_l",           name: "Itadori Yuji",          anime: "Jujutsu Kaisen", rarity: "legendaire", basePower: 92, baseAttack: 94, baseDefense: 84, baseSpeed: 92, image_url: CARD_IMAGE_URLS.jjk_yuji },
  { id: "jjk_yuji_s",           name: "Itadori Yuji",          anime: "Jujutsu Kaisen", rarity: "secrète",    basePower: 108, baseAttack: 110, baseDefense: 96, baseSpeed: 106, image_url: CARD_IMAGE_URLS.jjk_yuji },
  { id: "jjk_yuji_mg",          name: "Itadori Yuji",          anime: "Jujutsu Kaisen", rarity: "manga_god",  basePower: 120, baseAttack: 118, baseDefense: 102, baseSpeed: 114, image_url: CARD_IMAGE_URLS.jjk_yuji },

  { id: "jjk_sukuna_n",         name: "Ryomen Sukuna",         anime: "Jujutsu Kaisen", rarity: "normale",    basePower: 48, baseAttack: 46, baseDefense: 44, baseSpeed: 48, image_url: CARD_IMAGE_URLS.jjk_sukuna_b },
  { id: "jjk_sukuna_l",         name: "Ryomen Sukuna",         anime: "Jujutsu Kaisen", rarity: "legendaire", basePower: 96, baseAttack: 98, baseDefense: 88, baseSpeed: 94, image_url: CARD_IMAGE_URLS.jjk_sukuna_b },
  { id: "jjk_sukuna_s",         name: "Ryomen Sukuna",         anime: "Jujutsu Kaisen", rarity: "secrète",    basePower: 114, baseAttack: 118, baseDefense: 102, baseSpeed: 108, image_url: CARD_IMAGE_URLS.jjk_sukuna_b },
  { id: "jjk_sukuna_mg",        name: "Ryomen Sukuna",         anime: "Jujutsu Kaisen", rarity: "manga_god",  basePower: 126, baseAttack: 124, baseDefense: 110, baseSpeed: 118, image_url: CARD_IMAGE_URLS.jjk_sukuna_b },

  { id: "jjk_megumi_n",         name: "Megumi Fushiguro",      anime: "Jujutsu Kaisen", rarity: "normale",    basePower: 44, baseAttack: 42, baseDefense: 40, baseSpeed: 46, image_url: CARD_IMAGE_URLS.jjk_megumi },
  { id: "jjk_megumi_l",         name: "Megumi Fushiguro",      anime: "Jujutsu Kaisen", rarity: "legendaire", basePower: 88, baseAttack: 86, baseDefense: 80, baseSpeed: 90, image_url: CARD_IMAGE_URLS.jjk_megumi },
  { id: "jjk_megumi_s",         name: "Megumi Fushiguro",      anime: "Jujutsu Kaisen", rarity: "secrète",    basePower: 104, baseAttack: 102, baseDefense: 94, baseSpeed: 104, image_url: CARD_IMAGE_URLS.jjk_megumi },
  { id: "jjk_megumi_mg",        name: "Megumi Fushiguro",      anime: "Jujutsu Kaisen", rarity: "manga_god",  basePower: 118, baseAttack: 116, baseDefense: 102, baseSpeed: 112, image_url: CARD_IMAGE_URLS.jjk_megumi },

  // ══════════════════ MY HERO ACADEMIA ══════════════════
  { id: "mha_deku_n",           name: "Izuku Midoriya",        anime: "My Hero Academia", rarity: "normale",    basePower: 46, baseAttack: 44, baseDefense: 42, baseSpeed: 46, image_url: CARD_IMAGE_URLS.mha_deku },
  { id: "mha_deku_l",           name: "Izuku Midoriya",        anime: "My Hero Academia", rarity: "legendaire", basePower: 92, baseAttack: 94, baseDefense: 86, baseSpeed: 90, image_url: CARD_IMAGE_URLS.mha_deku },
  { id: "mha_deku_s",           name: "Izuku Midoriya",        anime: "My Hero Academia", rarity: "secrète",    basePower: 110, baseAttack: 112, baseDefense: 98, baseSpeed: 106, image_url: CARD_IMAGE_URLS.mha_deku },
  { id: "mha_deku_mg",          name: "Izuku Midoriya",        anime: "My Hero Academia", rarity: "manga_god",  basePower: 122, baseAttack: 120, baseDefense: 106, baseSpeed: 114, image_url: CARD_IMAGE_URLS.mha_deku },

  { id: "mha_bakugo_n",         name: "Katsuki Bakugo",        anime: "My Hero Academia", rarity: "normale",    basePower: 48, baseAttack: 46, baseDefense: 40, baseSpeed: 50, image_url: CARD_IMAGE_URLS.mha_bakugo },
  { id: "mha_bakugo_l",         name: "Katsuki Bakugo",        anime: "My Hero Academia", rarity: "legendaire", basePower: 94, baseAttack: 98, baseDefense: 82, baseSpeed: 96, image_url: CARD_IMAGE_URLS.mha_bakugo },
  { id: "mha_bakugo_s",         name: "Katsuki Bakugo",        anime: "My Hero Academia", rarity: "secrète",    basePower: 112, baseAttack: 116, baseDefense: 94, baseSpeed: 110, image_url: CARD_IMAGE_URLS.mha_bakugo },
  { id: "mha_bakugo_mg",        name: "Katsuki Bakugo",        anime: "My Hero Academia", rarity: "manga_god",  basePower: 124, baseAttack: 122, baseDefense: 100, baseSpeed: 118, image_url: CARD_IMAGE_URLS.mha_bakugo },

  { id: "mha_allmight_n",       name: "All Might",             anime: "My Hero Academia", rarity: "normale",    basePower: 50, baseAttack: 48, baseDefense: 46, baseSpeed: 48, image_url: CARD_IMAGE_URLS.mha_allmight_b },
  { id: "mha_allmight_l",       name: "All Might",             anime: "My Hero Academia", rarity: "legendaire", basePower: 98, baseAttack: 100, baseDefense: 92, baseSpeed: 94, image_url: CARD_IMAGE_URLS.mha_allmight_b },
  { id: "mha_allmight_s",       name: "All Might",             anime: "My Hero Academia", rarity: "secrète",    basePower: 114, baseAttack: 116, baseDefense: 102, baseSpeed: 108, image_url: CARD_IMAGE_URLS.mha_allmight_b },
  { id: "mha_allmight_mg",      name: "All Might",             anime: "My Hero Academia", rarity: "manga_god",  basePower: 126, baseAttack: 124, baseDefense: 110, baseSpeed: 116, image_url: CARD_IMAGE_URLS.mha_allmight_b },

];

// ─── RARITY CONFIG ────────────────────────────────────────────────────────────
export const RARITY_CONFIG = {
  normale:     { label: "Normale",     color: "text-slate-400",  bgColor: "bg-slate-500/20",   borderColor: "border-slate-500/40",   gradient: "from-slate-600 to-slate-800",    shimmer: false },
  legendaire:  { label: "✦ Légendaire",  color: "text-yellow-300", bgColor: "bg-yellow-500/20",  borderColor: "border-yellow-400/70",  gradient: "from-yellow-500 to-amber-900",   shimmer: true  },
  secrète:     { label: "⚡ Secrète",     color: "text-rose-300",   bgColor: "bg-rose-500/20",    borderColor: "border-rose-400/80",    gradient: "from-rose-600 to-pink-950",      shimmer: true  },
  manga_god:   { label: "🔥 Manga God",   color: "text-cyan-300",   bgColor: "bg-cyan-500/20",    borderColor: "border-cyan-400/90",    gradient: "from-cyan-500 to-blue-950",      shimmer: true  },
};

export const RARITY_ORDER = { manga_god: 4, secrète: 3, legendaire: 2, normale: 1 };

// ─── PASSIVE INCOME ──────────────────────────────────────────────────────────
// Revenu par minute. Seules les 12 meilleures cartes produisent afin de
// récompenser la qualité d'une collection sans créer une inflation infinie.
export const INCOME_BASE = {
  normale:     1,        // 60 pièces / heure
  legendaire:  3,        // 180 pièces / heure
  secrète:     8,        // 480 pièces / heure
  manga_god:   16,       // 960 pièces / heure
};

function getRawCardIncome(card, talentBonus = 0) {
  const base = INCOME_BASE[card.rarity] || 2;
  const level = card.level || 1;
  const levelMult = 1 + (Math.min(level, 100) - 1) * 0.01;
  return base * levelMult * (1 + talentBonus);
}

export function getCardIncome(card, talentBonus = 0) {
  return Math.round(getRawCardIncome(card, talentBonus));
}

export function getTotalIncome(cards, talentBonus = 0, playerLevel = 1) {
  const cardIncome = cards
    .map((card) => getRawCardIncome(card, talentBonus))
    .sort((a, b) => b - a)
    .slice(0, 12)
    .reduce((sum, income) => sum + income, 0);
  // +0,5 % par niveau joueur, plafonné à +50 % au niveau 100.
  const playerLevelBonus = Math.min(0.50, Math.max(0, Number(playerLevel || 1) - 1) * 0.005);
  return Math.round(cardIncome * (1 + playerLevelBonus));
}

// ─── BOOSTER TYPES ────────────────────────────────────────────────────────────
export const BOOSTER_TYPES = [
  { id: "naruto",         name: "Booster Naruto",           anime: "Naruto",           cards: 3, basePrice: 1500,  currency: "coins", icon: "🍥", guaranteed: "legendaire", description: "3 cartes Naruto", color: "from-orange-500 to-orange-900", accentColor: "border-orange-500/40", bgCard: "bg-orange-500/5", unlockLevel: 1 },
  { id: "onepiece",       name: "Booster One Piece",        anime: "One Piece",        cards: 3, basePrice: 1500,  currency: "coins", icon: "🏴‍☠️", guaranteed: "legendaire", description: "3 cartes One Piece", color: "from-red-500 to-red-900",    accentColor: "border-red-500/40",    bgCard: "bg-red-500/5",    unlockLevel: 1 },
  { id: "dragonball",     name: "Booster Dragon Ball",      anime: "Dragon Ball",      cards: 3, basePrice: 3000,  currency: "coins", icon: "⚡", guaranteed: "legendaire", description: "3 cartes Dragon Ball", color: "from-yellow-500 to-yellow-900", accentColor: "border-yellow-500/40", bgCard: "bg-yellow-500/5", unlockLevel: 2 },
  { id: "aot",            name: "Booster Attack on Titan",  anime: "Attack on Titan",  cards: 3, basePrice: 6000,  currency: "coins", icon: "⚔️", guaranteed: "legendaire", description: "3 cartes AoT", color: "from-emerald-600 to-emerald-900", accentColor: "border-emerald-500/40", bgCard: "bg-emerald-500/5", unlockLevel: 3 },
  { id: "demonslayer",    name: "Booster Demon Slayer",     anime: "Demon Slayer",     cards: 3, basePrice: 12000, currency: "coins", icon: "🌊", guaranteed: "legendaire", description: "3 cartes Demon Slayer", color: "from-cyan-500 to-cyan-900", accentColor: "border-cyan-500/40", bgCard: "bg-cyan-500/5", unlockLevel: 4 },
  { id: "jjk",            name: "Booster Jujutsu Kaisen",   anime: "Jujutsu Kaisen",   cards: 3, basePrice: 20000, currency: "coins", icon: "👁️", guaranteed: "legendaire", description: "3 cartes JJK", color: "from-violet-500 to-violet-900", accentColor: "border-violet-500/40", bgCard: "bg-violet-500/5", unlockLevel: 5 },
  { id: "mha",            name: "Booster My Hero Academia", anime: "My Hero Academia", cards: 3, basePrice: 32000, currency: "coins", icon: "💥", guaranteed: "legendaire", description: "3 cartes MHA", color: "from-green-500 to-green-900", accentColor: "border-green-500/40", bgCard: "bg-green-500/5", unlockLevel: 6 },
  { id: "premium_secret",   name: "Booster Secrète",    anime: null, cards: 3, basePrice: 25, currency: "gems", icon: "🔮", guaranteed: "secrète",    description: "Toutes séries · Secrète garantie", color: "from-rose-500 to-pink-900",   accentColor: "border-rose-400/60",  bgCard: "bg-rose-500/5",  unlockLevel: 10 },
  { id: "premium_god",      name: "Booster Manga God",  anime: null, cards: 3, basePrice: 75, currency: "gems", icon: "👑", guaranteed: "manga_god",description: "Toutes séries · Manga God garantie (ultra rare !)", color: "from-cyan-500 to-blue-900", accentColor: "border-cyan-400/70", bgCard: "bg-cyan-500/5", unlockLevel: 15 },
];

export function getBoosterPrice(booster, timesOpened, discount = 0) {
  const price = booster.basePrice;
  return Math.round(price * (1 - discount));
}

// ─── XP / LEVEL ───────────────────────────────────────────────────────────────
// Système de leveling extrêmement lent et difficile - progression sur plusieurs mois
export function getXpForLevel(level) {
  // Niveaux 1-10: Début progressif mais déjà exigeant
  if (level <= 10) return Math.round(800 * Math.pow(1.6, level - 1));
  // Niveaux 11-25: Courbe très raide
  if (level <= 25) return Math.round(8000 * Math.pow(1.85, level - 11));
  // Niveaux 26-40: Extrêmement difficile
  if (level <= 40) return Math.round(180000 * Math.pow(2.1, level - 26));
  // Niveaux 41-60: Presque impossible sans dedication
  if (level <= 60) return Math.round(3500000 * Math.pow(2.3, level - 41));
  // Niveaux 60+: Légendaire - réservé aux meilleurs joueurs
  return Math.round(250000000 * Math.pow(2.5, level - 61));
}

export function getLevelFromXp(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (true) {
    const needed = getXpForLevel(level);
    if (remaining < needed) break;
    remaining -= needed;
    level++;
    if (level > 100) break;
  }
  return { level, currentXp: remaining, xpToNext: getXpForLevel(level) };
}

// ─── COIN REWARDS ────────────────────────────────────────────────────────────
export function getCoinReward(rarity, cardLevel = 1, talentBonus = 0) {
  // Balanced coin rewards
  const base = { normale: 3, legendaire: 40, secrète: 150, manga_god: 500 };
  const b = base[rarity] || 3;
  const reward = Math.round(b * (1 + (cardLevel - 1) * 0.1));
  return Math.round(reward * (1 + talentBonus));
}

export function getXpReward(rarity, talentBonus = 0) {
  // Reduced XP rewards for slower progression
  const r = { normale: 5, legendaire: 150, secrète: 500, manga_god: 1200 };
  const xp = r[rarity] || 5;
  return Math.round(xp * (1 + talentBonus));
}

// ─── UPGRADE SYSTEM ───────────────────────────────────────────────────────────
export function getDuplicateBonus(rarity) {
  const bonuses = {
    normale:     { power: 1,  attack: 1,  defense: 1,  speed: 1  },
    legendaire:  { power: 10, attack: 8,  defense: 7,  speed: 8  },
    secrète:     { power: 15, attack: 13, defense: 11, speed: 12 },
    manga_god:   { power: 25, attack: 20, defense: 18, speed: 20 },
  };
  return bonuses[rarity] || bonuses.normale;
}

export function getUpgradeCost(cardLevel, rarity) {
  const rarityMult = { normale: 1, legendaire: 20, secrète: 50, manga_god: 100 };
  return Math.round(500 * cardLevel * (rarityMult[rarity] || 1));
}

export function getDuplicatesForUpgrade(cardLevel) {
  return Math.min(10, 1 + Math.floor(Math.max(1, cardLevel) / 10));
}

export const MAX_CARD_LEVEL = 100;

// ─── ROLL LOGIC ───────────────────────────────────────────────────────────────
// Taux de drop ultra-faibles - Toutes les hautes raretés sont extrêmement rares
export function rollRarity(guaranteed, pity = 0) {
  const rand = Math.random();
  const pityBonus = Math.min(pity * 0.00005, 0.001); // Pity très faible

  // Taux ultra-bas pour les hautes raretés
  const rates = {
    manga_god:   0.0000001,  // 0.00001% - quasi impossible
    secrète:     0.000001,   // 0.0001% - ultra rare
    legendaire:  0.00001,    // 0.001% - très rare (1 sur 10000)
    normale:     1.0,
  };

  if (guaranteed === "manga_god") {
    if (rand < 0.0002) return "manga_god";
    if (rand < 0.001) return "secrète";
    if (rand < 0.005) return "legendaire";
    return "normale";
  }
  if (guaranteed === "secrète") {
    if (rand < 0.0001) return "manga_god";
    if (rand < 0.0015 + pityBonus * 0.005) return "secrète";
    if (rand < 0.008) return "legendaire";
    return "normale";
  }
  if (guaranteed === "legendaire") {
    if (rand < 0.00005 + pityBonus * 0.002) return "manga_god";
    if (rand < 0.0004 + pityBonus * 0.02) return "secrète";
    if (rand < 0.0025 + pityBonus * 0.25) return "legendaire"; // ~0.25% base
    return "normale";
  }
  
  // Roll normal - chance infinitésimale d'avoir du très haut
  const cumMangaGod = rates.manga_god;
  const cumSecrete = cumMangaGod + rates.secrète;
  const cumLegendaire = cumSecrete + rates.legendaire;

  if (rand < cumMangaGod) return "manga_god";
  if (rand < cumSecrete) return "secrète";
  if (rand < cumLegendaire) return "legendaire";
  return "normale";
}

export function rollCard(rarity, anime) {
  let pool = CARD_POOL.filter(c => c.rarity === rarity);
  if (anime) pool = pool.filter(c => c.anime === anime);
  if (!pool.length) pool = CARD_POOL.filter(c => c.rarity === rarity);
  if (!pool.length) {
    const order = ["manga_god", "secrète", "legendaire", "normale"];
    const idx = order.indexOf(rarity);
    for (let i = idx + 1; i < order.length; i++) {
      let fb = CARD_POOL.filter(c => c.rarity === order[i]);
      if (anime) fb = fb.filter(c => c.anime === anime);
      if (fb.length) return fb[Math.floor(Math.random() * fb.length)];
    }
    pool = CARD_POOL;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function openBooster(boosterType) {
  const booster = BOOSTER_TYPES.find(b => b.id === boosterType);
  if (!booster) return [];

  const cards = [];
  const order = ["normale", "legendaire", "secrète", "manga_god"];
  
  // Déterminer aléatoirement la position de la carte garantie (0, 1, ou 2)
  const guaranteedPosition = booster.guaranteed ? Math.floor(Math.random() * booster.cards) : -1;
  
  for (let i = 0; i < booster.cards; i++) {
    const isGuaranteedSlot = i === guaranteedPosition && booster.guaranteed;
    let rarity;
    
    if (isGuaranteedSlot && booster.guaranteed) {
      // Slot garanti : on roll NORMAL, mais on force le minimum au guaranteed si le roll est inférieur
      const rolled = rollRarity(null);
      // Seulement 10% de chance d'obtenir le garanti ou mieux sur le slot garanti
      const hasGuaranteed = Math.random() < 0.10;
      if (hasGuaranteed) {
        rarity = order.indexOf(rolled) >= order.indexOf(booster.guaranteed) ? rolled : booster.guaranteed;
      } else {
        rarity = rolled;
      }
    } else {
      // Slot normal : roll très faible chance d'avoir du haut
      rarity = rollRarity(null);
    }
    
    const card = rollCard(rarity, booster.anime);
    if (card) {
      cards.push({
        ...card,
        power:   card.basePower,
        attack:  card.baseAttack,
        defense: card.baseDefense,
        speed:   card.baseSpeed,
      });
    }
  }
  return cards;
}
