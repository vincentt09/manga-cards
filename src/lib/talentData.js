export const TALENT_TREE = {
  economy: {
    name: "Économie", icon: "💰", color: "from-yellow-500 to-amber-600",
    description: "Des revenus réguliers sans casser l'économie",
    talents: [
      { id: "economy_1", name: "Épargne", description: "+5% de revenus passifs", cost: 1, minLevel: 5, effect: { type: "income_bonus", value: 0.05 }, prerequisites: [] },
      { id: "economy_2", name: "Négociateur", description: "-5% sur le prix des boosters", cost: 2, minLevel: 15, effect: { type: "booster_discount", value: 0.05 }, prerequisites: ["economy_1"] },
      { id: "economy_3", name: "Banquier", description: "+10% de revenus passifs", cost: 3, minLevel: 30, effect: { type: "income_bonus", value: 0.10 }, prerequisites: ["economy_2"] },
      { id: "economy_4", name: "Magnat", description: "+10% de revenus passifs (total : +25%)", cost: 4, minLevel: 50, effect: { type: "income_bonus", value: 0.10 }, prerequisites: ["economy_3"] },
    ],
  },
  collection: {
    name: "Collection", icon: "📚", color: "from-purple-500 to-indigo-600",
    description: "Progresse plus vite, mais avec patience",
    talents: [
      { id: "collection_1", name: "Étudiant", description: "+5% d'XP gagnée dans les boosters", cost: 1, minLevel: 5, effect: { type: "xp_bonus", value: 0.05 }, prerequisites: [] },
      { id: "collection_2", name: "Érudit", description: "+10% d'XP gagnée dans les boosters", cost: 2, minLevel: 15, effect: { type: "xp_bonus", value: 0.10 }, prerequisites: ["collection_1"] },
      { id: "collection_3", name: "Savant", description: "+10% d'XP gagnée (total : +25%)", cost: 3, minLevel: 30, effect: { type: "xp_bonus", value: 0.10 }, prerequisites: ["collection_2"] },
      { id: "collection_4", name: "Légende", description: "+1 carte tous les 25 boosters payants", cost: 4, minLevel: 50, effect: { type: "extra_card", every: 25 }, prerequisites: ["collection_3"] },
    ],
  },
  chance: {
    name: "Chance", icon: "🍀", color: "from-emerald-500 to-teal-600",
    description: "De petits avantages sur les tirages les plus rares",
    talents: [
      { id: "chance_1", name: "Chanceux", description: "+5% relatif sur le taux Légendaire", cost: 1, minLevel: 5, effect: { type: "legendary_weight", value: 0.05 }, prerequisites: [] },
      { id: "chance_2", name: "Béni", description: "+8% relatif sur le taux Secret", cost: 2, minLevel: 15, effect: { type: "secret_weight", value: 0.08 }, prerequisites: ["chance_1"] },
      { id: "chance_3", name: "Élu", description: "+10% relatif sur le taux Manga God", cost: 3, minLevel: 30, effect: { type: "god_weight", value: 0.10 }, prerequisites: ["chance_2"] },
      { id: "chance_4", name: "Divin", description: "Le compteur de malchance progresse 25% plus vite", cost: 4, minLevel: 50, effect: { type: "pity_bonus", value: 0.25 }, prerequisites: ["chance_3"] },
    ],
  },
};

export function getTalent(talentId) {
  for (const branch of Object.values(TALENT_TREE)) {
    const talent = branch.talents.find((item) => item.id === talentId);
    if (talent) return talent;
  }
  return null;
}

export function canUnlockTalent(talentId, unlockedTalents, playerLevel = 1) {
  const talent = getTalent(talentId);
  return Boolean(talent
    && !unlockedTalents.has(talentId)
    && playerLevel >= talent.minLevel
    && talent.prerequisites.every((id) => unlockedTalents.has(id)));
}
