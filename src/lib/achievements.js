import { Layers, Star, Zap, Crown, Trophy, Package, ShoppingBag, TrendingUp, Gem, Heart, Shield, Wind, BookOpen } from "lucide-react";

// Achievement definitions — evaluated at runtime against live data
export const ACHIEVEMENTS = [
  // Collection
  { id: "cards_10",     label: "Collectionneur",     desc: "Possède 10 cartes",          icon: Layers,      check: (d) => d.cards >= 10 },
  { id: "cards_50",     label: "Grand Collectionneur",desc: "Possède 50 cartes",          icon: Layers,      check: (d) => d.cards >= 50 },
  { id: "cards_100",    label: "Légende Vivante",     desc: "Possède 100 cartes",         icon: Layers,      check: (d) => d.cards >= 100 },
  // Rarities
  { id: "rare_5",       label: "Chasseur de Légendes",desc: "Possède 5 Légendaires",       icon: Star,        check: (d) => d.rarityCount.legendaire >= 5 },
  { id: "epic_3",       label: "Maître des Secrets",  desc: "Possède 3 cartes Secrètes",   icon: Zap,         check: (d) => d.rarityCount["secrète"] >= 3 },
  { id: "legendary_1",  label: "L'Élu",               desc: "Possède 1 Manga God",          icon: Crown,       check: (d) => d.rarityCount.manga_god >= 1 },
  { id: "legendary_5",  label: "Gardien des Dieux",   desc: "Possède 5 Manga God",          icon: Crown,       check: (d) => d.rarityCount.manga_god >= 5 },
  { id: "secret_1",     label: "Collection Parfaite", desc: "Possède chaque rareté",        icon: BookOpen,    check: (d) => ["normale", "legendaire", "secrète", "manga_god"].every((rarity) => d.rarityCount[rarity] >= 1) },
  // Upgrade
  { id: "level5",       label: "Forgeron",            desc: "Niv.5 sur une carte",         icon: Trophy,      check: (d) => d.maxLevel >= 5 },
  { id: "level10",      label: "Maître Forgeron",     desc: "Niv.10 sur une carte",        icon: Trophy,      check: (d) => d.maxLevel >= 10 },
  { id: "level20",      label: "Perfection",          desc: "Niv.20 sur une carte",        icon: Trophy,      check: (d) => d.maxLevel >= 20 },
  // Boosters
  { id: "boosters_10",  label: "Ouvreur de Packs",    desc: "10 boosters ouverts",         icon: Package,     check: (d) => d.boostersOpened >= 10 },
  { id: "boosters_50",  label: "Accro aux Boosters",  desc: "50 boosters ouverts",         icon: Package,     check: (d) => d.boostersOpened >= 50 },
  { id: "boosters_100", label: "Dépendant",           desc: "100 boosters ouverts",        icon: Package,     check: (d) => d.boostersOpened >= 100 },
  // Market
  { id: "sell_1",       label: "Marchand",            desc: "Vends ta 1ère carte",         icon: ShoppingBag, check: (d) => d.sold >= 1 },
  { id: "sell_10",      label: "Négociant",           desc: "Vends 10 cartes",             icon: ShoppingBag, check: (d) => d.sold >= 10 },
  // Level
  { id: "level_10",     label: "Combattant",          desc: "Atteins le niveau 10",        icon: TrendingUp,  check: (d) => d.playerLevel >= 10 },
  { id: "level_20",     label: "Maître",              desc: "Atteins le niveau 20",        icon: TrendingUp,  check: (d) => d.playerLevel >= 20 },
  { id: "level_50",     label: "Grand Maître",        desc: "Atteins le niveau 50",        icon: TrendingUp,  check: (d) => d.playerLevel >= 50 },
  // Gems
  { id: "gems_50",      label: "Trésorier",           desc: "Possède 50 gemmes",           icon: Gem,         check: (d) => d.gems >= 50 },
  // Favorites
  { id: "fav_5",        label: "Coeur Généreux",      desc: "5 cartes en favoris",         icon: Heart,       check: (d) => d.favorites >= 5 },
];

export const PROFILE_TITLES = [
  { id: "rookie", label: "Nouveau Collectionneur", achievementId: null },
  ...ACHIEVEMENTS.map((achievement) => ({
    id: `achievement_${achievement.id}`,
    label: achievement.label,
    achievementId: achievement.id,
  })),
];

export function getAchievementData({ cards, profile, playerLevel, transactions = [] }) {
  const rarityCount = { normale: 0, legendaire: 0, "secrète": 0, manga_god: 0 };
  cards.forEach(c => { if (rarityCount[c.rarity] !== undefined) rarityCount[c.rarity]++; });
  const maxLevel = cards.reduce((max, c) => Math.max(max, c.level || 1), 0);
  const favorites = cards.filter(c => c.is_favorite).length;

  return {
    cards: cards.length,
    rarityCount,
    maxLevel,
    boostersOpened: profile?.boosters_opened || 0,
    sold: transactions.filter((transaction) => transaction.type === "sell").length,
    playerLevel: playerLevel || 1,
    gems: profile?.gems || 0,
    favorites,
  };
}
