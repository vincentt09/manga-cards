import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RARITY_CONFIG } from "@/lib/gameData";
import { Star, Zap, Shield, Wind, Sparkles, ArrowUp, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RARITY_PARTICLE_COLORS = {
  secret:     ["#f43f5e", "#fb7185", "#fda4af", "#ffffff", "#fde68a"],
  legendary:  ["#fbbf24", "#f59e0b", "#fde68a", "#fffbeb"],
  epic:       ["#a855f7", "#c084fc", "#e9d5ff", "#7c3aed"],
  ultra_rare: ["#22d3ee", "#67e8f9", "#a5f3fc", "#0891b2"],
  rare:       ["#3b82f6", "#60a5fa", "#bfdbfe"],
  common:     ["#94a3b8", "#cbd5e1"],
};

function Particles({ rarity }) {
  const colors = RARITY_PARTICLE_COLORS[rarity] || RARITY_PARTICLE_COLORS.common;
  const isHighRarity = ["secret", "legendary", "epic"].includes(rarity);
  const count = rarity === "secret" ? 32 : rarity === "legendary" ? 24 : isHighRarity ? 18 : 12;

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

// Full-screen flash effect for legendary/secret
function RarityFlash({ rarity }) {
  const colors = {
    secret: "rgba(244,63,94,0.25)",
    legendary: "rgba(251,191,36,0.2)",
    epic: "rgba(168,85,247,0.15)",
  };
  const color = colors[rarity];
  if (!color) return null;
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 0.6, times: [0, 0.3, 1] }}
      style={{ background: color }}
    />
  );
}

function SingleCardReveal({ card, index, onRevealed, imageOverrides = [] }) {
  const [revealed, setRevealed] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.common;
  const isHighRarity = ["legendary", "secret"].includes(card.rarity);
  const isEpicPlus = ["epic", "legendary", "secret"].includes(card.rarity);
  
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

  const glowClass =
    card.rarity === "secret"    ? "legendary-glow" :
    card.rarity === "legendary" ? "legendary-glow" :
    card.rarity === "epic"      ? "epic-glow" : "";

  const handleClick = () => {
    if (revealed) return;
    setRevealed(true);
    setShowParticles(true);
    if (isHighRarity) setShowFlash(true);
    setTimeout(() => setShowParticles(false), 1600);
    setTimeout(() => setShowFlash(false), 700);
    onRevealed?.();
  };

  return (
    <>
      {showFlash && <RarityFlash rarity={card.rarity} />}
      <motion.div
        initial={{ opacity: 0, y: 50, rotateY: -20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
        transition={{ delay: index * 0.18, duration: 0.55, type: "spring", bounce: 0.35 }}
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
              className="w-36 h-52 sm:w-40 sm:h-58 rounded-xl overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/20 via-card to-accent/10 flex flex-col items-center justify-center gap-2 relative"
            >
              <div className="absolute inset-0 shimmer rounded-xl" />
              <div className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary/10">
                <Sparkles className="w-7 h-7 text-primary animate-pulse" />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium text-center px-3 leading-tight">
                Toucher pour révéler
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="front"
              initial={{ rotateY: -90, opacity: 0, scale: 1.1 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, type: "spring" }}
              className={`w-36 h-52 sm:w-40 sm:h-58 rounded-xl overflow-hidden border-2 ${rarity.borderColor} relative ${glowClass}`}
            >
              <img src={displayImageUrl} alt={card.name} className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              {/* High rarity shimmer */}
              {isEpicPlus && (
                <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />
              )}

              {/* Secret particles floating */}
              {card.rarity === "secret" && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[0,1,2,3].map(i => (
                    <motion.div key={i} className="absolute w-1 h-1 rounded-full"
                      style={{ left: `${20 + i * 20}%`, background: "#f43f5e", boxShadow: "0 0 4px #f43f5e" }}
                      animate={{ y: [0, -40, 0], opacity: [0, 0.9, 0] }}
                      transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.5 }}
                    />
                  ))}
                </div>
              )}

              {/* Rarity badge */}
              <div className="absolute top-2 right-2">
                <Badge className={`${rarity.bgColor} ${rarity.color} border ${rarity.borderColor} text-[9px] px-1.5 py-0.5`}>
                  {rarity.label}
                </Badge>
              </div>

              {/* Crown for legendary/secret */}
              {isHighRarity && (
                <div className="absolute top-2 left-2">
                  <motion.div animate={{ scale: [1, 1.3, 1], rotate: [-5, 5, -5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Crown className={`w-4 h-4 drop-shadow-lg ${card.rarity === "secret" ? "text-rose-300" : "text-yellow-300"}`}
                      style={{ filter: card.rarity === "secret" ? "drop-shadow(0 0 5px #f43f5e)" : "drop-shadow(0 0 5px #fbbf24)" }} />
                  </motion.div>
                </div>
              )}

              {/* Duplicate badge */}
              {card.isDuplicate && (
                <div className="absolute top-8 left-2">
                  <div className="bg-green-500/80 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white flex items-center gap-0.5">
                    <ArrowUp className="w-2.5 h-2.5" />{card.levelsGained > 0 ? "NIVEAU +" : "EMPILÉE"}
                  </div>
                </div>
              )}

              {/* Bottom info */}
              <div className="absolute bottom-0 inset-x-0 p-2.5">
                <p className="font-heading font-bold text-white text-xs truncate">{card.name}</p>
                <p className="text-[9px] text-white/60 mb-1.5">{card.anime}</p>

                {card.isDuplicate ? (
                  <div className="bg-green-500/20 rounded-lg px-2 py-1 text-[9px] text-green-300 font-bold">
                    {card.levelsGained > 0
                      ? `Niveau ${card.level} atteint automatiquement`
                      : `Duplicata empilé · ×${card.stackCount || 2}`}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-red-400" />
                      <span className="text-[9px] text-white font-bold">{card.attack}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5 text-blue-400" />
                      <span className="text-[9px] text-white font-bold">{card.defense}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Wind className="w-2.5 h-2.5 text-green-400" />
                      <span className="text-[9px] text-white font-bold">{card.speed}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] text-white font-display font-bold">{card.power}</span>
                    </div>
                  </div>
                )}
              </div>

              {showParticles && <Particles rarity={card.rarity} />}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

export default function CardReveal({ cards, onComplete, imageOverrides = [] }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const allRevealed = revealedCount >= cards.length;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap justify-center gap-3">
        {cards.map((card, i) => (
          <SingleCardReveal
            key={i}
            card={card}
            index={i}
            onRevealed={() => setRevealedCount(n => n + 1)}
            imageOverrides={imageOverrides}
          />
        ))}
      </div>

      {!allRevealed && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: cards.length * 0.18 + 0.4 }}
          onClick={() => setRevealedCount(cards.length)}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Tout révéler
        </motion.button>
      )}

      <AnimatePresence>
        {allRevealed && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={onComplete}
            className="px-10 py-3 bg-gradient-to-r from-primary to-accent rounded-full font-heading font-bold text-sm text-white hover:opacity-90 transition-opacity shadow-lg"
          >
            Continuer →
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
