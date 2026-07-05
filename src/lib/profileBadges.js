export const PROFILE_BADGES = [
  { id: "founder", label: "Pionnier", icon: "🌟", description: "A rejoint l’aventure Manga TCG.", tone: "border-violet-400/40 bg-violet-500/15 text-violet-200", check: () => true },
  { id: "collector_25", label: "Collectionneur", icon: "🃏", description: "Possède au moins 25 cartes différentes.", tone: "border-blue-400/40 bg-blue-500/15 text-blue-200", check: ({ cards }) => cards.length >= 25 },
  { id: "collector_100", label: "Archiviste", icon: "📚", description: "Possède au moins 100 cartes différentes.", tone: "border-cyan-400/40 bg-cyan-500/15 text-cyan-200", check: ({ cards }) => cards.length >= 100 },
  { id: "legend_hunter", label: "Chasseur de légendes", icon: "👑", description: "Possède 10 cartes légendaires ou supérieures.", tone: "border-amber-400/40 bg-amber-500/15 text-amber-200", check: ({ cards }) => cards.filter(card => ["legendaire", "secrète", "manga_god"].includes(card.rarity)).length >= 10 },
  { id: "manga_god", label: "Élu des dieux", icon: "⚡", description: "Possède une carte Manga God.", tone: "border-rose-400/40 bg-rose-500/15 text-rose-200", check: ({ cards }) => cards.some(card => card.rarity === "manga_god") },
  { id: "booster_100", label: "Briseur de sceaux", icon: "📦", description: "A ouvert 100 boosters.", tone: "border-orange-400/40 bg-orange-500/15 text-orange-200", check: ({ profile }) => Number(profile?.boosters_opened || 0) >= 100 },
  { id: "pve_50", label: "Vétéran PvE", icon: "⚔️", description: "A remporté 50 combats PvE.", tone: "border-red-400/40 bg-red-500/15 text-red-200", check: ({ profile }) => Number(profile?.pve_wins || 0) >= 50 },
  { id: "level_50", label: "Maître collectionneur", icon: "💠", description: "A atteint le niveau 50.", tone: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200", check: ({ level }) => level >= 50 },
];

export const getUnlockedProfileBadges = ({ profile, cards = [], level = 1 }) =>
  PROFILE_BADGES.filter(badge => badge.check({ profile, cards, level }));
