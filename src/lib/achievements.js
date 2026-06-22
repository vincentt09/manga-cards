import { Layers, Star, Zap, Crown, Trophy, Package, ShoppingBag, TrendingUp, Gem, Heart, BookOpen, Swords, Flame } from "lucide-react";

export const ACHIEVEMENTS = [
  { id: "cards_10", label: "Collectionneur", desc: "Possède 10 cartes", icon: Layers, check: d => d.cards >= 10 },
  { id: "cards_50", label: "Grand Collectionneur", desc: "Possède 50 cartes", icon: Layers, check: d => d.cards >= 50 },
  { id: "cards_100", label: "Légende Vivante", desc: "Possède 100 cartes", icon: Layers, check: d => d.cards >= 100 },
  { id: "cards_250", label: "Archiviste du Multivers", desc: "Possède 250 cartes", icon: BookOpen, check: d => d.cards >= 250 },
  { id: "rare_5", label: "Chasseur de Légendes", desc: "Possède 5 Légendaires", icon: Star, check: d => d.rarityCount.legendaire >= 5 },
  { id: "rare_25", label: "Seigneur Doré", desc: "Possède 25 Légendaires", icon: Star, check: d => d.rarityCount.legendaire >= 25 },
  { id: "epic_3", label: "Maître des Secrets", desc: "Possède 3 cartes Secrètes", icon: Zap, check: d => d.rarityCount["secrète"] >= 3 },
  { id: "epic_15", label: "Gardien des Arcanes", desc: "Possède 15 cartes Secrètes", icon: Zap, check: d => d.rarityCount["secrète"] >= 15 },
  { id: "legendary_1", label: "L'Élu", desc: "Possède 1 Manga God", icon: Crown, check: d => d.rarityCount.manga_god >= 1 },
  { id: "legendary_5", label: "Gardien des Dieux", desc: "Possède 5 Manga God", icon: Crown, check: d => d.rarityCount.manga_god >= 5 },
  { id: "legendary_15", label: "Souverain Manga", desc: "Possède 15 Manga God", icon: Crown, check: d => d.rarityCount.manga_god >= 15 },
  { id: "secret_1", label: "Collection Parfaite", desc: "Possède chaque rareté", icon: BookOpen, check: d => ["normale", "legendaire", "secrète", "manga_god"].every(r => d.rarityCount[r] >= 1) },
  { id: "level5", label: "Forgeron", desc: "Niveau 5 sur une carte", icon: Trophy, check: d => d.maxLevel >= 5 },
  { id: "level10", label: "Maître Forgeron", desc: "Niveau 10 sur une carte", icon: Trophy, check: d => d.maxLevel >= 10 },
  { id: "level25", label: "Artisan Mythique", desc: "Niveau 25 sur une carte", icon: Trophy, check: d => d.maxLevel >= 25 },
  { id: "level50_card", label: "Éveilleur", desc: "Niveau 50 sur une carte", icon: Flame, check: d => d.maxLevel >= 50 },
  { id: "level100_card", label: "Transcendant", desc: "Niveau 100 sur une carte", icon: Flame, check: d => d.maxLevel >= 100 },
  { id: "boosters_10", label: "Ouvreur de Packs", desc: "10 boosters ouverts", icon: Package, check: d => d.boostersOpened >= 10 },
  { id: "boosters_50", label: "Accro aux Boosters", desc: "50 boosters ouverts", icon: Package, check: d => d.boostersOpened >= 50 },
  { id: "boosters_100", label: "Briseur de Scellés", desc: "100 boosters ouverts", icon: Package, check: d => d.boostersOpened >= 100 },
  { id: "boosters_500", label: "Invocateur Éternel", desc: "500 boosters ouverts", icon: Package, check: d => d.boostersOpened >= 500 },
  { id: "sell_1", label: "Marchand", desc: "Vends ta première carte", icon: ShoppingBag, check: d => d.sold >= 1 },
  { id: "sell_10", label: "Négociant", desc: "Vends 10 cartes", icon: ShoppingBag, check: d => d.sold >= 10 },
  { id: "sell_50", label: "Magnat du Marché", desc: "Vends 50 cartes", icon: ShoppingBag, check: d => d.sold >= 50 },
  { id: "level_10", label: "Combattant", desc: "Atteins le niveau 10", icon: TrendingUp, check: d => d.playerLevel >= 10 },
  { id: "level_25", label: "Maître", desc: "Atteins le niveau 25", icon: TrendingUp, check: d => d.playerLevel >= 25 },
  { id: "level_50", label: "Grand Maître", desc: "Atteins le niveau 50", icon: TrendingUp, check: d => d.playerLevel >= 50 },
  { id: "level_75", label: "Ascendant", desc: "Atteins le niveau 75", icon: TrendingUp, check: d => d.playerLevel >= 75 },
  { id: "level_100", label: "Immortel", desc: "Atteins le niveau 100", icon: Crown, check: d => d.playerLevel >= 100 },
  { id: "gems_50", label: "Trésorier", desc: "Possède 50 gemmes", icon: Gem, check: d => d.gems >= 50 },
  { id: "gems_250", label: "Banquier Céleste", desc: "Possède 250 gemmes", icon: Gem, check: d => d.gems >= 250 },
  { id: "fav_5", label: "Cœur Généreux", desc: "5 cartes en favoris", icon: Heart, check: d => d.favorites >= 5 },
  { id: "pve_1", label: "Premier Sang", desc: "Remporte 1 combat PvE", icon: Swords, check: d => d.pveWins >= 1 },
  { id: "pve_25", label: "Vétéran de l'Arène", desc: "Remporte 25 combats PvE", icon: Swords, check: d => d.pveWins >= 25 },
  { id: "pve_100", label: "Conquérant du Multivers", desc: "Remporte 100 combats PvE", icon: Swords, check: d => d.pveWins >= 100 },
  { id: "pve_stage_4", label: "Briseur de Chapitre", desc: "Termine le chapitre 1 du PvE", icon: Trophy, check: d => d.pveStage >= 5 },
  { id: "pve_stage_8", label: "Fléau des Empereurs", desc: "Termine le chapitre 2 du PvE", icon: Trophy, check: d => d.pveStage >= 9 },
  { id: "pve_stage_12", label: "Dieu de l'Arène", desc: "Termine toute la campagne PvE", icon: Crown, check: d => d.pveCleared.includes(12) },
];

export const PROFILE_TITLES = [
  { id: "rookie", label: "Nouveau Collectionneur", achievementId: null },
  ...ACHIEVEMENTS.map(a => ({ id: `achievement_${a.id}`, label: a.label, achievementId: a.id })),
];

export function getAchievementData({ cards, profile, playerLevel, transactions = [] }) {
  const rarityCount = { normale: 0, legendaire: 0, "secrète": 0, manga_god: 0 };
  cards.forEach(c => { if (rarityCount[c.rarity] !== undefined) rarityCount[c.rarity] += 1; });
  return {
    cards: cards.length,
    rarityCount,
    maxLevel: cards.reduce((max, c) => Math.max(max, c.level || 1), 0),
    boostersOpened: profile?.boosters_opened || 0,
    sold: transactions.filter(t => t.type === "sell").length,
    playerLevel: playerLevel || 1,
    gems: profile?.gems || 0,
    favorites: cards.filter(c => c.is_favorite).length,
    pveWins: Number(profile?.pve_wins || 0),
    pveStage: Number(profile?.pve_max_stage || 1),
    pveCleared: Array.isArray(profile?.pve_cleared_stages) ? profile.pve_cleared_stages : [],
  };
}
