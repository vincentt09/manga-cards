import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RARITY_CONFIG } from "@/lib/gameData";
import { Star, Zap, Shield, Wind, Sparkles, ArrowUp, Crown, Package } from "lucide-react";

const RARITY_PARTICLE_COLORS = {
  "secrète": ["#f43f5e", "#fb7185", "#fda4af", "#ffffff", "#fde68a"],
  legendaire: ["#fbbf24", "#f59e0b", "#fde68a", "#fffbeb"],
  manga_god: ["#22d3ee", "#67e8f9", "#a5f3fc", "#0891b2"],
  secret: ["#f43f5e", "#fb7185", "#fda4af", "#ffffff", "#fde68a"],
  legendary: ["#fbbf24", "#f59e0b", "#fde68a", "#fffbeb"],
  epic: ["#a855f7", "#c084fc", "#e9d5ff", "#7c3aed"],
  ultra_rare: ["#22d3ee", "#67e8f9", "#a5f3fc", "#0891b2"],
  rare: ["#3b82f6", "#60a5fa", "#bfdbfe"],
  common: ["#94a3b8", "#cbd5e1"],
};

function Particles({ rarity, isActive }) {
  const colors = RARITY_PARTICLE_COLORS[rarity] || RARITY_PARTICLE_COLORS.common;
  const isHighRarity = ["secret", "legendary", "epic"].includes(rarity);
  const count = rarity === "secret" ? 32 : rarity === "legendary" ? 24 : isHighRarity ? 18 : 12;

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {[...Array(count)].map((_, i) => {
        const color = colors[i % colors.length];
        const isLarge = isHighRarity && i % 4 === 0;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 1, x: "50%", y: "50%", scale: 0 }}
            animate={{
              opacity: [1, 1, 0],
              x: `${50 + (Math.random() - 0.5) * 280}%`,
              y: `${50 + (Math.random() - 0.5) * 280}%`,
              scale: [0, isLarge ? 2 : 1.2, 0],
              rotate: Math.random() * 360,
            }}
            transition={{ duration: isHighRarity ? 1.4 : 1, delay: i * 0.03 }}
            className="absolute rounded-full"
            style={{
              width: isLarge ? 8 : 5,
              height: isLarge ? 8 : 5,
              backgroundColor: color,
              boxShadow: isHighRarity ? `0 0 6px ${color}` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function BoosterOpeningAnimation({ booster, onOpenComplete }) {
  const [stage, setStage] = useState("shaking");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("glowing"), 800);
    const t2 = setTimeout(() => setStage("exploding"), 1400);
    const t3 = setTimeout(() => onOpenComplete(), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onOpenComplete]);

  return (
    <motion.div
      animate={
        stage === "shaking" ? { rotate: [-2, 2, -2, 2, 0], scale: 1, transition: { duration: 0.8 } } :
        stage === "glowing" ? { scale: [1, 1.15, 1.05], filter: ["brightness(1)", "brightness(1.5)", "brightness(1.3)"], transition: { duration: 0.6 } } :
        { scale: [1.05, 2, 3], opacity: [1, 0.8, 0], transition: { duration: 0.4 } }
      }
      className="relative w-64 h-80 flex items-center justify-center"
    >
      <div className={`relative w-64 h-80 rounded-2xl overflow-hidden border-4 border-primary/50 bg-gradient-to-br ${booster.color} shadow-2xl`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1s_infinite]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <Package className="w-20 h-20 text-white/80" />
          <span className="font-display text-2xl font-bold text-white tracking-wider">{booster.name}</span>
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <motion.div key={i} animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }} className="w-2 h-2 rounded-full bg-white" />
            ))}
          </div>
        </div>
        {stage === "glowing" && <div className="absolute inset-0 bg-white/30 animate-pulse" />}
      </div>
      {stage === "exploding" && <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0 bg-white rounded-full" />}
    </motion.div>
  );
}

function SingleCardReveal({ card, index, onRevealed, forceReveal = false, imageOverrides = [] }) {
  const [revealed, setRevealed] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.common;
  const isHighRarity = ["legendaire", "secrète", "manga_god"].includes(card.rarity);
  const isEpicPlus = isHighRarity;
  
  // Get override image (match by name + rarity suffix)
  const raritySuffixes = {
    "normale": ["_n", "_b"],
    "legendaire": ["_l"], 
    "secrète": ["_s"],
    "manga_god": ["_mg"]
  }[card.rarity] || ["_n"];
  
  const override = imageOverrides.find(o => 
    o.card_name && 
    o.card_name.toLowerCase() === card.name.toLowerCase() &&
    o.card_id &&
    raritySuffixes.some(suffix => o.card_id.endsWith(suffix))
  );
  const displayImageUrl = override?.image_url || card.image_url;

  const handleClick = () => {
    if (revealed) return;
    setRevealed(true);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1600);
    onRevealed?.(card, index);
  };

  useEffect(() => {
    if (!forceReveal || revealed) return;
    setRevealed(true);
    setShowParticles(true);
    const timer = setTimeout(() => setShowParticles(false), 1600);
    onRevealed?.(card, index);
    return () => clearTimeout(timer);
  }, [forceReveal, revealed, card, index, onRevealed]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50, rotateY: -20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
        transition={{ delay: index * 0.15, duration: 0.55, type: "spring", bounce: 0.4 }}
        onClick={handleClick}
        className="cursor-pointer relative"
        style={{ perspective: "800px" }}
      >
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div
              key="back"
              exit={{ rotateY: 90, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="w-40 h-56 sm:w-44 sm:h-60 rounded-xl overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/20 via-card to-accent/10 flex flex-col items-center justify-center gap-3 relative"
            >
              <div className="absolute inset-0 shimmer rounded-xl" />
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary/10">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </motion.div>
              <p className="text-[10px] text-muted-foreground font-medium text-center px-3 leading-tight">Toucher pour révéler</p>
            </motion.div>
          ) : (
            <motion.div
              key="front"
              initial={{ rotateY: -90, opacity: 0, scale: 1.1 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, type: "spring" }}
              className={`w-40 h-56 sm:w-44 sm:h-60 rounded-xl overflow-hidden border-2 ${rarity.borderColor} relative ${isHighRarity ? "legendary-glow" : ""}`}
            >
              <img src={displayImageUrl} alt={card.name} className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              {isEpicPlus && <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />}
              <Particles rarity={card.rarity} isActive={showParticles} />

              <div className={`absolute top-3 right-3 ${rarity.bgColor} ${rarity.color} border ${rarity.borderColor} rounded-full px-3 py-1 text-[10px] font-bold flex items-center gap-1 shadow-lg`}>
                {rarity.label}
              </div>

              {isHighRarity && (
                <motion.div className="absolute top-3 left-3" animate={{ scale: [1, 1.3, 1], rotate: [-5, 5, -5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Crown className={`w-5 h-5 ${card.rarity === "secrète" ? "text-rose-300" : card.rarity === "manga_god" ? "text-cyan-300" : "text-yellow-300"}`} style={{ filter: card.rarity === "secrète" ? "drop-shadow(0 0 6px #f43f5e)" : card.rarity === "manga_god" ? "drop-shadow(0 0 6px #22d3ee)" : "drop-shadow(0 0 6px #fbbf24)" }} />
                </motion.div>
              )}

              {card.isDuplicate && (
                <div className="absolute top-10 left-3">
                  <div className="bg-green-500/90 rounded-full px-2 py-1 text-[10px] font-bold text-white flex items-center gap-1 shadow-lg">
                    <ArrowUp className="w-3 h-3" />{card.levelsGained > 0 ? "NIVEAU +" : "EMPILÉE"}
                  </div>
                </div>
              )}

              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 to-transparent">
                <p className="font-heading font-bold text-white text-sm truncate mb-1">{card.name}</p>
                <p className="text-[10px] text-white/60 mb-2">{card.anime}</p>
                {card.isDuplicate ? (
                  <div className="bg-green-500/25 rounded-lg px-2 py-1.5 text-[10px] text-green-300 font-bold border border-green-500/30">
                    {card.levelsGained > 0
                      ? `Amélioration automatique · Niveau ${card.level}`
                      : `Duplicata empilé · ×${card.stackCount || 2} exemplaires`}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-[10px] text-white font-bold">{card.attack}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[10px] text-white font-bold">{card.defense}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-[10px] text-white font-bold">{card.speed}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1 bg-yellow-500/20 rounded-full px-2 py-0.5 border border-yellow-500/30">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-[11px] text-white font-display font-bold">{card.power}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

export default function ImmersiveCardReveal({ cards, onComplete, booster, imageOverrides = [], onOpenAnother, onCardRevealed }) {
  const [isOpening, setIsOpening] = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);
  const [revealAll, setRevealAll] = useState(false);
  const allRevealed = revealedCount >= cards.length;

  const handleOpenComplete = () => setIsOpening(false);

  if (isOpening) {
    return <BoosterOpeningAnimation booster={booster} onOpenComplete={handleOpenComplete} />;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">Cartes Obtenues !</h2>
        <p className="text-muted-foreground text-sm">Touche chaque carte pour la révéler</p>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-4">
        {cards.map((card, i) => (
          <SingleCardReveal
            key={i}
            card={card}
            index={i}
            forceReveal={revealAll}
            onRevealed={(revealedCard, revealedIndex) => {
              setRevealedCount(n => n + 1);
              onCardRevealed?.(revealedCard, revealedIndex);
            }}
            imageOverrides={imageOverrides}
          />
        ))}
      </div>

      {!allRevealed && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: cards.length * 0.15 + 0.4 }} onClick={() => setRevealAll(true)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
          Tout révéler
        </motion.button>
      )}

      <AnimatePresence>
        {allRevealed && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
            <motion.button onClick={onComplete} className="px-12 py-3.5 bg-gradient-to-r from-primary to-accent rounded-full font-heading font-bold text-sm text-white hover:opacity-90 transition-opacity shadow-lg hover:shadow-primary/50">
              Continuer →
            </motion.button>
            {onOpenAnother && (
              <motion.button 
                onClick={onOpenAnother} 
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-heading font-bold text-sm text-white hover:opacity-90 transition-opacity shadow-lg hover:shadow-green-500/50 flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Ouvrir un autre
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
