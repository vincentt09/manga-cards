// ─── Quest definitions ────────────────────────────────────────────────────────

export const DAILY_QUESTS_POOL = [
  { quest_id: "open_1_booster",  label: "Ouvre 1 booster",         description: "Ouvre n'importe quel booster aujourd'hui",     target: 1,  reward_coins: 300,  reward_gems: 0 },
  { quest_id: "open_3_boosters", label: "Ouvre 3 boosters",        description: "Ouvre 3 boosters dans la journée",             target: 3,  reward_coins: 800,  reward_gems: 0 },
  { quest_id: "collect_5_cards", label: "Collecte 5 cartes",       description: "Obtiens 5 nouvelles cartes aujourd'hui",       target: 5,  reward_coins: 500,  reward_gems: 0 },
  { quest_id: "sell_1_card",     label: "Vends 1 carte",           description: "Mets en vente une carte sur le marché",        target: 1,  reward_coins: 400,  reward_gems: 0 },
  { quest_id: "get_rare",        label: "Obtiens une Légendaire",  description: "Obtiens au moins une carte Légendaire",         target: 1,  reward_coins: 600,  reward_gems: 0 },
  { quest_id: "upgrade_card",    label: "Fais progresser une carte", description: "Obtiens assez de duplicatas pour un niveau automatique", target: 1, reward_coins: 450, reward_gems: 0 },
  { quest_id: "fav_1_card",      label: "Ajoute 1 favori",         description: "Marque une carte comme favorite",             target: 1,  reward_coins: 200,  reward_gems: 0 },
  { quest_id: "login_daily",     label: "Connexion quotidienne",   description: "Connecte-toi aujourd'hui",                     target: 1,  reward_coins: 150,  reward_gems: 0 },
  { quest_id: "get_ultra",       label: "Obtiens une Secrète",     description: "Obtiens une carte Secrète ou Manga God",        target: 1,  reward_coins: 900,  reward_gems: 0 },
  { quest_id: "spend_coins",     label: "Dépense 1000 pièces",     description: "Dépense 1000 pièces en boosters",              target: 1000, reward_coins: 700, reward_gems: 0 },
];

export const WEEKLY_QUESTS_POOL = [
  { quest_id: "w_open_10",       label: "Ouvre 10 boosters",       description: "Ouvre 10 boosters cette semaine",              target: 10, reward_coins: 3000, reward_gems: 1 },
  { quest_id: "w_collect_20",    label: "Collecte 20 cartes",      description: "Obtiens 20 cartes cette semaine",              target: 20, reward_coins: 2500, reward_gems: 0 },
  { quest_id: "w_get_epic",      label: "Obtiens 2 Secrètes",      description: "Obtiens 2 cartes Secrètes ou Manga God",        target: 2,  reward_coins: 4000, reward_gems: 1 },
  { quest_id: "w_sell_3",        label: "Vends 3 cartes",          description: "Vends 3 cartes sur le marché",                 target: 3,  reward_coins: 2000, reward_gems: 0 },
  { quest_id: "w_upgrade_3",     label: "Gagne 3 niveaux de carte", description: "Fais progresser automatiquement tes cartes",   target: 3,  reward_coins: 3500, reward_gems: 0 },
  { quest_id: "w_get_legendary", label: "Obtiens une Manga God",   description: "Obtiens la rareté ultime Manga God",            target: 1,  reward_coins: 6000, reward_gems: 2 },
  { quest_id: "w_login_5",       label: "Connecte-toi 5 jours",    description: "Connecte-toi 5 jours consécutifs",             target: 5,  reward_coins: 2000, reward_gems: 1 },
];

// Pick 3 daily + 2 weekly quests seeded by date
export function getQuestsForPeriod(type) {
  const pool = type === "daily" ? DAILY_QUESTS_POOL : WEEKLY_QUESTS_POOL;
  const count = type === "daily" ? 3 : 2;

  // Seed based on ISO week or day
  const now = new Date();
  let seed;
  if (type === "daily") {
    seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  } else {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    seed = now.getFullYear() * 100 + weekNum;
  }

  // Deterministic shuffle
  const shuffled = [...pool].sort((a, b) => {
    const ha = hashCode(a.quest_id + seed) % 1000;
    const hb = hashCode(b.quest_id + seed) % 1000;
    return ha - hb;
  });

  return shuffled.slice(0, count);
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return Math.abs(hash);
}

// Returns end-of-day (daily) or end-of-week Sunday (weekly)
export function getExpiryDate(type) {
  const now = new Date();
  if (type === "daily") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return end.toISOString();
  } else {
    const end = new Date(now);
    const daysUntilSunday = 7 - now.getDay();
    end.setDate(now.getDate() + daysUntilSunday);
    end.setHours(23, 59, 59, 999);
    return end.toISOString();
  }
}

export function getPeriodKey(type) {
  const now = new Date();
  if (type === "daily") {
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  } else {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNum}`;
  }
}
