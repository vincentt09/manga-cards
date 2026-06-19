// Idées de cadres à ajouter dans CardFrame entity

export const FRAME_IDEAS = [
  // Cadres gratuits / communs
  {
    name: "Classique",
    rarity: "common",
    effect: "none",
    price_gems: 0,
    source_type: "shop",
    description: "Cadre standard sans effet spécial",
    gradient: "from-slate-600 to-slate-800",
    borderColor: "border-slate-500/40",
  },
  {
    name: "Ninja",
    rarity: "common",
    effect: "none",
    price_gems: 50,
    source_type: "shop",
    description: "Cadre sombre style ninja",
    gradient: "from-gray-800 to-black",
    borderColor: "border-gray-600",
  },
  
  // Cadres rares
  {
    name: "Samouraï",
    rarity: "rare",
    effect: "shimmer",
    price_gems: 150,
    source_type: "shop",
    description: "Lueur rougeoyante du bushido",
    gradient: "from-red-700 to-red-900",
    borderColor: "border-red-500/60",
  },
  {
    name: "Dragon",
    rarity: "rare",
    effect: "glow",
    price_gems: 200,
    source_type: "booster",
    description: "Flamme draconienne",
    gradient: "from-orange-600 to-red-700",
    borderColor: "border-orange-500/70",
  },
  {
    name: "Océan",
    rarity: "rare",
    effect: "sparkle",
    price_gems: 150,
    source_type: "shop",
    description: "Profondeurs marines scintillantes",
    gradient: "from-blue-600 to-cyan-700",
    borderColor: "border-blue-400/60",
  },
  
  // Cadres épiques
  {
    name: "Tonerre",
    rarity: "epic",
    effect: "shimmer",
    price_gems: 400,
    source_type: "quest",
    description: "Énergie électrique pure",
    gradient: "from-yellow-500 to-amber-600",
    borderColor: "border-yellow-400/80",
  },
  {
    name: "Lunaire",
    rarity: "epic",
    effect: "sparkle",
    price_gems: 450,
    source_type: "achievement",
    description: "Mystère de la lune",
    gradient: "from-indigo-600 to-purple-700",
    borderColor: "border-indigo-400/70",
  },
  {
    name: "Phénix",
    rarity: "epic",
    effect: "glow",
    price_gems: 500,
    source_type: "booster",
    description: "Renaissance flamboyante",
    gradient: "from-rose-600 to-orange-500",
    borderColor: "border-rose-400/80",
  },
  
  // Cadres légendaires
  {
    name: "Roi des Pirates",
    rarity: "legendary",
    effect: "shimmer",
    price_gems: 1000,
    source_type: "quest",
    description: "Couronne du roi des mers",
    gradient: "from-amber-500 to-yellow-600",
    borderColor: "border-yellow-300",
  },
  {
    name: "Dieu Shinobi",
    rarity: "legendary",
    effect: "glow",
    price_gems: 1200,
    source_type: "achievement",
    description: "Puissance divine ninja",
    gradient: "from-violet-600 to-purple-800",
    borderColor: "border-purple-300",
  },
  {
    name: "Empereur",
    rarity: "legendary",
    effect: "sparkle",
    price_gems: 1500,
    source_type: "booster",
    description: "Autorité impériale absolue",
    gradient: "from-red-600 to-rose-700",
    borderColor: "border-red-300",
  },
  
  // Cadres secrets / manga god
  {
    name: "Hokage",
    rarity: "secret",
    effect: "animated",
    price_gems: 2500,
    source_type: "achievement",
    description: "Le protecteur du village caché",
    gradient: "from-white to-amber-400",
    borderColor: "border-white",
  },
  {
    name: "Roi des Ténèbres",
    rarity: "secret",
    effect: "glow",
    price_gems: 3000,
    source_type: "quest",
    description: "Puissance obscure ultime",
    gradient: "from-slate-900 to-purple-950",
    borderColor: "border-purple-500",
  },
  {
    name: "Manga God",
    rarity: "manga_god",
    effect: "animated",
    price_gems: 5000,
    source_type: "achievement",
    description: "Transcendance ultime",
    gradient: "from-cyan-400 via-pink-500 to-purple-600",
    borderColor: "border-cyan-300",
  },
];

// Idées d'obtention gratuites (quêtes, succès)
export const FREE_FRAME_OBTENTION = [
  {
    frame: "Ninja",
    method: "Niveau 5",
    description: "Atteindre le niveau 5",
  },
  {
    frame: "Samouraï",
    method: "Première fusion",
    description: "Fusionner 5 cartes",
  },
  {
    frame: "Océan",
    method: "Collectionneur",
    description: "Avoir 20 cartes différentes",
  },
  {
    frame: "Tonerre",
    method: "Quête hebdo",
    description: "Compléter 10 quêtes hebdomadaires",
  },
  {
    frame: "Lunaire",
    method: "Succès nocturne",
    description: "Ouvrir 50 boosters",
  },
  {
    frame: "Roi des Pirates",
    method: "Légende des mers",
    description: "Obtenir 5 légendaires",
  },
  {
    frame: "Dieu Shinobi",
    method: "Voie du ninja",
    description: "Maximiser 10 cartes",
  },
  {
    frame: "Hokage",
    method: "Protecteur",
    description: "Avoir 100 cartes dans la collection",
  },
  {
    frame: "Roi des Ténèbres",
    method: "Maître obscur",
    description: "Gagner 10 enchères",
  },
  {
    frame: "Manga God",
    method: "Transcendance",
    description: "Collectionner toutes les cartes secrètes",
  },
];

// Idées d'événements spéciaux
export const SPECIAL_EVENTS = [
  {
    name: "Événement Naruto",
    duration: "7 jours",
    frames: ["Ninja", "Hokage", "Dieu Shinobi"],
    description: "Boosters Naruto avec cadres exclusifs",
  },
  {
    name: "Événement One Piece",
    duration: "7 jours",
    frames: ["Roi des Pirates", "Océan", "Dragon"],
    description: "Cadres pirates en édition limitée",
  },
  {
    name: "Événement Dragon Ball",
    duration: "10 jours",
    frames: ["Tonerre", "Phénix", "Empereur"],
    description: "Transformation Super Saiyan",
  },
  {
    name: "Halloween Spécial",
    duration: "14 jours",
    frames: ["Roi des Ténèbres"],
    description: "Cadre effrayant exclusif",
  },
  {
    name: "Nouvel An",
    duration: "5 jours",
    frames: ["Lunaire", "Manga God"],
    description: "Célébration avec cadres rares",
  },
];