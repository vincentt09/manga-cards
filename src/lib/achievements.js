import { Layers, Star, Zap, Crown, Trophy, Package, ShoppingBag, TrendingUp, Gem, Heart, Shield, Wind, BookOpen } from "lucide-react";

// Achievement definitions — evaluated at runtime against live data
export const ACHIEVEMENTS = [
  // Collection
  { id: "cards_10",     label: "Collectionneur",     desc: "Possède 10 cartes",          icon: Layers,      check: (d) => d.cards >= 10 },
  { id: "cards_50",     label: "Grand Collectionneur",desc: "Possède 50 cartes",          icon: Layers,      check: (d) => d.cards >= 50 },
  { id: "cards_100",    label: "Légende Vivante",     desc: "Possède 100 cartes",         icon: Layers,      check: (d) => d.cards >= 100 },
  // Rarities
  { id: "rare_5",       label: "Chasseur de Rare",    desc: "Possède 5 cartes Rares",     icon: Star,        check: (d) => d.rarityCount.rare >= 5 },
  { id: "epic_3",       label: "Puissance Épique",    desc: "Possède 3 cartes Épiques",   icon: Zap,         check: (d) => d.rarityCount.epic >= 3 },
  { id: "legendary_1",  label: "L'Élu",               desc: "1 carte Légendaire",          icon: Crown,       check: (d) => d.rarityCount.legendary >= 1 },
  { id: "legendary_5",  label: "Gardien des Légendes",desc: "5 cartes Légendaires",        icon: Crown,       check: (d) => d.rarityCount.legendary >= 5 },
  { id: "secret_1",     label: "Porteur du Secret",   desc: "1 carte Secrète",             icon: BookOpen,    check: (d) => d.rarityCount.secret >= 1 },
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

export function getAchievementData({ cards, profile, playerLevel }) {
  const rarityCount = { common: 0, rare: 0, ultra_rare: 0, epic: 0, legendary: 0, secret: 0 };
  cards.forEach(c => { if (rarityCount[c.rarity] !== undefined) rarityCount[c.rarity]++; });
  const maxLevel = cards.reduce((max, c) => Math.max(max, c.level || 1), 0);
  const favorites = cards.filter(c => c.is_favorite).length;

  return {
    cards: cards.length,
    rarityCount,
    maxLevel,
    boostersOpened: profile?.boosters_opened || 0,
    sold: 0, // tracked via transactions
    playerLevel: playerLevel || 1,
    gems: profile?.gems || 0,
    favorites,
  };
}