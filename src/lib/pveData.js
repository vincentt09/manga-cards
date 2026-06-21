export const PVE_MAX_ENERGY = 5;
export const PVE_ENERGY_REGEN_MS = 30 * 60 * 1000;

export const PVE_BOSSES = [
  { id: "bandit", stage: 1, name: "Bandit des Mers", anime: "One Piece", icon: "☠️", hp: 950, attack: 95, defense: 55, speed: 45, rewardCoins: 700, rewardXp: 120, color: "from-slate-600 to-slate-900" },
  { id: "zabuza", stage: 2, name: "Démon de la Brume", anime: "Naruto", icon: "🌫️", hp: 1450, attack: 145, defense: 90, speed: 85, rewardCoins: 1200, rewardXp: 210, color: "from-cyan-700 to-slate-950" },
  { id: "lower_moon", stage: 3, name: "Lune Inférieure", anime: "Demon Slayer", icon: "🌙", hp: 2200, attack: 210, defense: 125, speed: 135, rewardCoins: 2000, rewardXp: 350, color: "from-indigo-700 to-purple-950" },
  { id: "grade_one", stage: 4, name: "Fléau de Rang 1", anime: "Jujutsu Kaisen", icon: "👁️", hp: 3200, attack: 290, defense: 180, speed: 190, rewardCoins: 3200, rewardXp: 520, color: "from-violet-700 to-black" },
  { id: "titan", stage: 5, name: "Titan Cuirassé", anime: "Attack on Titan", icon: "🧱", hp: 4800, attack: 380, defense: 310, speed: 145, rewardCoins: 5000, rewardXp: 800, color: "from-orange-800 to-stone-950" },
  { id: "all_for_one", stage: 6, name: "Seigneur des Alters", anime: "My Hero Academia", icon: "🦹", hp: 6800, attack: 520, defense: 350, speed: 310, rewardCoins: 8000, rewardXp: 1200, color: "from-red-800 to-slate-950" },
  { id: "frieza", stage: 7, name: "Empereur Galactique", anime: "Dragon Ball", icon: "🪐", hp: 9200, attack: 720, defense: 480, speed: 520, rewardCoins: 12500, rewardXp: 1800, color: "from-fuchsia-700 to-indigo-950" },
  { id: "god_trial", stage: 8, name: "Épreuve du Dieu Manga", anime: "Multivers", icon: "🔥", hp: 14000, attack: 980, defense: 680, speed: 720, rewardCoins: 25000, rewardXp: 3000, rewardGems: 3, color: "from-cyan-600 via-blue-800 to-black" },
];

export const getPveTeamPower = (cards = []) => cards.reduce((sum, card) => (
  sum + Number(card.power || 0) + Number(card.attack || 0) + Number(card.defense || 0) + Number(card.speed || 0)
), 0);
