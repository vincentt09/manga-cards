import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, Zap, Shield, Wind, Heart, X, Sparkles, Move3D } from "lucide-react";
import { RARITY_CONFIG, RARITY_ORDER, MAX_CARD_LEVEL, getCardIncome } from "@/lib/gameData";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import CardFrameOverlay from "@/components/frames/CardFrameOverlay";

function StatBar({ icon: Icon, color, label, value, max = 450 }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={`w-4 h-4 ${color} shrink-0`} />
      <span className="text-xs w-14 text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
        />
      </div>
      <span className="text-xs font-bold w-10 text-right tabular-nums">{value}</span>
    </div>
  );
}

const rarityGlow = {
  normale: "rgba(148,163,184,0.28)",
  legendaire: "rgba(250,204,21,0.48)",
  "secrète": "rgba(244,63,94,0.52)",
  manga_god: "rgba(34,211,238,0.62)",
};

export default function CardDetail({ card, onClose, onToggleFavorite, appliedFrame = null }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, px: 50, py: 50, active: false });
  if (!card) return null;

  const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.normale;
  const isHighRarity = RARITY_ORDER[card.rarity] >= 2;
  const isMaxLevel = (card.level || 1) >= MAX_CARD_LEVEL;
  const income = getCardIncome(card);
  const glow = rarityGlow[card.rarity] || rarityGlow.normale;

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const py = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    setTilt({ x: ((50 - py) / 50) * 12, y: ((px - 50) / 50) * 14, px, py, active: true });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0, px: 50, py: 50, active: false });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto p-4 md:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 35 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 35 }}
        transition={{ type: "spring", bounce: 0.18 }}
        onClick={(event) => event.stopPropagation()}
        className="relative max-w-4xl mx-auto rounded-3xl border border-border bg-card/95 shadow-2xl p-5 md:p-7"
      >
        <button onClick={onClose} className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="grid md:grid-cols-[minmax(270px,360px)_1fr] gap-7 items-start">
          <div className="md:sticky md:top-8">
            <div className="px-2 pt-3" style={{ perspective: "1200px" }}>
              <motion.div
                onPointerMove={handlePointerMove}
                onPointerLeave={resetTilt}
                onPointerCancel={resetTilt}
                animate={{ rotateX: tilt.x, rotateY: tilt.y, scale: tilt.active ? 1.025 : 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 18, mass: 0.7 }}
                className={`relative aspect-[2/3] rounded-2xl overflow-hidden border-2 ${rarity.borderColor} bg-black cursor-grab active:cursor-grabbing select-none`}
                style={{
                  transformStyle: "preserve-3d",
                  touchAction: "none",
                  boxShadow: `0 24px 70px -20px ${glow}, 0 0 35px ${glow}`,
                }}
              >
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} draggable="false" className="absolute inset-0 w-full h-full object-contain" />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-b ${rarity.gradient} flex items-center justify-center`}>
                    <Sparkles className="w-20 h-20 text-white/20" />
                  </div>
                )}
                <CardFrameOverlay frame={appliedFrame} />
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-200"
                  style={{
                    opacity: tilt.active ? (isHighRarity ? 0.85 : 0.48) : (isHighRarity ? 0.32 : 0.12),
                    background: `radial-gradient(circle at ${tilt.px}% ${tilt.py}%, rgba(255,255,255,.92) 0%, ${glow} 16%, transparent 48%), conic-gradient(from 210deg at ${tilt.px}% ${tilt.py}%, transparent, rgba(34,211,238,.22), rgba(244,63,94,.2), rgba(250,204,21,.22), transparent)`,
                  }}
                />
                {isHighRarity && <div className="absolute inset-0 shimmer opacity-20 mix-blend-overlay pointer-events-none" />}
              </motion.div>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Move3D className="w-4 h-4" /> Bouge la souris ou le doigt pour examiner la carte
            </p>
          </div>

          <div className="pt-2 md:pt-5">
            <div className="mb-5 pr-9">
              <h2 className="font-heading text-2xl font-bold">{card.name}</h2>
              <p className="text-sm text-muted-foreground">{card.anime} · {rarity.label}</p>
            </div>

            <div className="mb-4 p-4 rounded-xl bg-secondary/40 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-semibold">Niveau {card.level || 1} / {MAX_CARD_LEVEL}</span>
                </div>
                <span className="text-xs text-muted-foreground">×{card.duplicates || 1} exemplaires</span>
              </div>
              <Progress value={((card.level || 1) / MAX_CARD_LEVEL) * 100} className="h-2" />
              <p className={`text-[10px] mt-2 ${isMaxLevel ? "text-yellow-400 font-bold" : "text-muted-foreground"}`}>
                {isMaxLevel ? "✦ Niveau maximum atteint" : "Les duplicatas améliorent automatiquement cette carte"}
              </p>
            </div>

            <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-yellow-300 font-semibold">💰 Revenu passif de la carte</span>
                <span className="text-xl font-black text-yellow-300">+{income} 🪙 / min</span>
              </div>
              <p className="text-xs text-yellow-400/75 mt-1 text-right">≈ {(income * 60).toLocaleString()} 🪙 / heure</p>
            </div>

            <div className="space-y-3 mb-6 rounded-xl border border-border bg-secondary/20 p-4">
              <StatBar icon={Zap} color="text-red-400" label="Attaque" value={card.attack || 0} />
              <StatBar icon={Shield} color="text-blue-400" label="Défense" value={card.defense || 0} />
              <StatBar icon={Wind} color="text-green-400" label="Vitesse" value={card.speed || 0} />
            </div>

            <Button
              variant={card.is_favorite ? "default" : "outline"}
              className={`w-full ${card.is_favorite ? "bg-pink-600 hover:bg-pink-700 border-pink-600" : ""}`}
              onClick={() => onToggleFavorite?.(card)}
            >
              <Heart className={`w-4 h-4 mr-2 ${card.is_favorite ? "fill-current" : ""}`} />
              {card.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
