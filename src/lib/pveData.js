export const PVE_MAX_ENERGY = 8;
export const PVE_ENERGY_REGEN_MS = 20 * 60 * 1000;
export const PVE_DAILY_REPLAY_LIMIT = 3;

export const PVE_BOSSES = [
  { id: "bandit", stage: 1, chapter: 1, name: "Bandit des Mers", anime: "One Piece", icon: "☠️", hp: 950, attack: 95, defense: 55, speed: 45, recommendedPower: 650, energyCost: 1, rewardCoins: 700, rewardXp: 120, weaknessAnime: "One Piece", color: "from-slate-600 to-slate-900" },
  { id: "zabuza", stage: 2, chapter: 1, name: "Démon de la Brume", anime: "Naruto", icon: "🌫️", hp: 1450, attack: 145, defense: 90, speed: 85, recommendedPower: 1050, energyCost: 1, rewardCoins: 1200, rewardXp: 210, weaknessAnime: "Naruto", color: "from-cyan-700 to-slate-950" },
  { id: "lower_moon", stage: 3, chapter: 1, name: "Lune Inférieure", anime: "Demon Slayer", icon: "🌙", hp: 2200, attack: 210, defense: 125, speed: 135, recommendedPower: 1550, energyCost: 1, rewardCoins: 2000, rewardXp: 350, weaknessAnime: "Demon Slayer", color: "from-indigo-700 to-purple-950" },
  { id: "grade_one", stage: 4, chapter: 1, name: "Fléau de Rang 1", anime: "Jujutsu Kaisen", icon: "👁️", hp: 3200, attack: 290, defense: 180, speed: 190, recommendedPower: 2200, energyCost: 1, rewardCoins: 3200, rewardXp: 520, rewardGems: 1, weaknessAnime: "Jujutsu Kaisen", color: "from-violet-700 to-black" },
  { id: "titan", stage: 5, chapter: 2, name: "Titan Cuirassé", anime: "Attack on Titan", icon: "🧱", hp: 4800, attack: 380, defense: 310, speed: 145, recommendedPower: 3100, energyCost: 2, rewardCoins: 5000, rewardXp: 800, weaknessAnime: "Attack on Titan", color: "from-orange-800 to-stone-950" },
  { id: "all_for_one", stage: 6, chapter: 2, name: "Seigneur des Alters", anime: "My Hero Academia", icon: "🦹", hp: 6800, attack: 520, defense: 350, speed: 310, recommendedPower: 4200, energyCost: 2, rewardCoins: 8000, rewardXp: 1200, weaknessAnime: "My Hero Academia", color: "from-red-800 to-slate-950" },
  { id: "frieza", stage: 7, chapter: 2, name: "Empereur Galactique", anime: "Dragon Ball", icon: "🪐", hp: 9200, attack: 720, defense: 480, speed: 520, recommendedPower: 5600, energyCost: 2, rewardCoins: 12500, rewardXp: 1800, weaknessAnime: "Dragon Ball", color: "from-fuchsia-700 to-indigo-950" },
  { id: "kaido", stage: 8, chapter: 2, name: "Empereur aux Cent Bêtes", anime: "One Piece", icon: "🐉", hp: 13200, attack: 940, defense: 650, speed: 610, recommendedPower: 7400, energyCost: 2, rewardCoins: 19000, rewardXp: 2600, rewardGems: 2, weaknessAnime: "One Piece", color: "from-purple-800 via-red-900 to-black" },
  { id: "madara", stage: 9, chapter: 3, name: "Fantôme des Uchiwa", anime: "Naruto", icon: "🌑", hp: 18000, attack: 1220, defense: 860, speed: 820, recommendedPower: 9400, energyCost: 3, rewardCoins: 28000, rewardXp: 3800, weaknessAnime: "Naruto", color: "from-red-950 via-purple-950 to-black" },
  { id: "muzan", stage: 10, chapter: 3, name: "Roi des Démons", anime: "Demon Slayer", icon: "🩸", hp: 24500, attack: 1580, defense: 1080, speed: 1120, recommendedPower: 12000, energyCost: 3, rewardCoins: 40000, rewardXp: 5200, weaknessAnime: "Demon Slayer", color: "from-rose-950 via-red-950 to-black" },
  { id: "beerus", stage: 11, chapter: 3, name: "Dieu de la Destruction", anime: "Dragon Ball", icon: "💫", hp: 33000, attack: 2100, defense: 1450, speed: 1600, recommendedPower: 15300, energyCost: 3, rewardCoins: 60000, rewardXp: 7500, rewardGems: 3, weaknessAnime: "Dragon Ball", color: "from-violet-700 via-fuchsia-950 to-black" },
  { id: "god_trial", stage: 12, chapter: 3, name: "Épreuve du Dieu Manga", anime: "Multivers", icon: "🔥", hp: 46000, attack: 2800, defense: 1950, speed: 2150, recommendedPower: 19500, energyCost: 3, rewardCoins: 90000, rewardXp: 11000, rewardGems: 6, weaknessAnime: null, color: "from-cyan-600 via-blue-800 to-black" },
];

export const getPveTeamPower = (cards = []) => cards.reduce((sum, card) => {
  const levelBonus = 1 + (Math.min(100, Number(card.level || 1)) - 1) * 0.012;
  return sum + Math.round((Number(card.power || 0) + Number(card.attack || 0) + Number(card.defense || 0) + Number(card.speed || 0)) * levelBonus);
}, 0);

export const getPvePowerRating = (teamPower, recommendedPower) => {
  const ratio = Number(teamPower || 0) / Math.max(1, Number(recommendedPower || 1));
  if (ratio >= 1.18) return { label: "Avantage", color: "text-emerald-400", percent: 88 };
  if (ratio >= 0.92) return { label: "Équilibré", color: "text-yellow-300", percent: 62 };
  if (ratio >= 0.72) return { label: "Difficile", color: "text-orange-400", percent: 38 };
  return { label: "Extrême", color: "text-red-400", percent: 15 };
};
