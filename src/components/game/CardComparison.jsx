import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CardComparison({ cards, onClose }) {
  if (!cards || cards.length !== 2) return null;

  const [card1, card2] = cards;

  const getRarityColor = (rarity) => {
    const colors = {
      common: "from-slate-400 to-slate-600",
      rare: "from-blue-400 to-blue-600",
      ultra_rare: "from-purple-400 to-purple-600",
      epic: "from-violet-400 to-violet-600",
      legendary: "from-yellow-400 to-amber-600",
      secret: "from-rose-400 to-pink-600",
      manga_god: "from-cyan-400 to-blue-600",
    };
    return colors[rarity] || colors.common;
  };

  const StatRow = ({ label, value1, value2 }) => {
    const isBetter1 = value1 > value2;
    const isBetter2 = value2 > value1;

    return (
      <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/50 last:border-0">
        <div className={`text-center font-bold ${isBetter1 ? "text-green-400" : "text-muted-foreground"}`}>
          {value1}
        </div>
        <div className="text-center text-xs text-muted-foreground flex items-center justify-center">
          {label}
        </div>
        <div className={`text-center font-bold ${isBetter2 ? "text-green-400" : "text-muted-foreground"}`}>
          {value2}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Comparaison de Cartes</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Cards Display */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Card 1 */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="font-semibold text-lg">{card1.name}</h3>
              <p className="text-xs text-muted-foreground">{card1.anime}</p>
            </div>
            <div className={`rounded-xl overflow-hidden border-2 border-${card1.rarity === 'legendary' ? 'yellow' : card1.rarity === 'secret' ? 'rose' : 'purple'}-500/50`}>
              <img src={card1.image_url} alt={card1.name} className="w-full aspect-[2/3] object-contain bg-black" />
            </div>
            <div className={`text-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(card1.rarity)} text-white inline-block`}>
              {card1.rarity}
            </div>
          </div>

          {/* Card 2 */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="font-semibold text-lg">{card2.name}</h3>
              <p className="text-xs text-muted-foreground">{card2.anime}</p>
            </div>
            <div className={`rounded-xl overflow-hidden border-2 border-${card2.rarity === 'legendary' ? 'yellow' : card2.rarity === 'secret' ? 'rose' : 'purple'}-500/50`}>
              <img src={card2.image_url} alt={card2.name} className="w-full aspect-[2/3] object-contain bg-black" />
            </div>
            <div className={`text-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(card2.rarity)} text-white inline-block`}>
              {card2.rarity}
            </div>
          </div>
        </div>

        {/* Stats Comparison */}
        <div className="bg-secondary/30 rounded-xl p-4 border border-border">
          <h3 className="font-semibold text-sm mb-3 text-center">Statistiques</h3>
          <StatRow label="Puissance" value1={card1.power} value2={card2.power} />
          <StatRow label="Attaque" value1={card1.attack} value2={card2.attack} />
          <StatRow label="Défense" value1={card1.defense} value2={card2.defense} />
          <StatRow label="Vitesse" value1={card1.speed} value2={card2.speed} />
          <StatRow label="Niveau" value1={card1.level} value2={card2.level} />
        </div>

        {/* Winner Indicator */}
        <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
          <p className="text-sm text-muted-foreground mb-1">Meilleure carte</p>
          <p className="font-display text-xl font-bold text-primary">
            {card1.power > card2.power ? card1.name : card2.power > card1.power ? card2.name : "Égalité"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Basé sur la puissance totale
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
