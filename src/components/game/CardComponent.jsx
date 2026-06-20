import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Heart, Zap, Shield, Wind, Sparkles, TrendingUp, Coins } from "lucide-react";
import { RARITY_CONFIG, getCardIncome } from "@/lib/gameData";
import CardFrameOverlay from "@/components/frames/CardFrameOverlay";

function CardImg({ card }) {
  const [failed, setFailed] = useState(false);
  const src = card.image_url;
  useEffect(() => setFailed(false), [src]);
  
  if (failed || !src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">{card.name}</p>
        </div>
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={card.name}
      className="w-full h-full object-cover object-top"
      loading="lazy" 
      decoding="async"
      draggable="false"
      onError={() => setFailed(true)} 
    />
  );
}

export default function CardComponent({ card, onClick, imageOverrides = [], appliedFrame = null }) {
  const [isHovered, setIsHovered] = useState(false);
  const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.normale;
  
  // Trouver l'override d'image par nom de carte + correspondance de rareté dans card_id
  // Les card_id sont: op_luffy_n (normale), op_luffy_l (legendaire), op_luffy_s (secrète), op_luffy_mg (manga_god)
  // Note: certains utilisent _b comme suffixe pour "base" (= normale)
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
  const displayCard = override ? { ...card, image_url: override.image_url } : card;

  const borderColor = {
    manga_god: "border-cyan-400/60",
    secrète: "border-rose-400/60", 
    legendaire: "border-yellow-400/60",
    normale: "border-slate-500/40"
  }[card.rarity] || "border-slate-500/40";

  const glowClass = {
    manga_god: "hover:shadow-cyan-500/30",
    secrète: "hover:shadow-rose-500/30",
    legendaire: "hover:shadow-yellow-500/30",
    normale: "hover:shadow-slate-500/20"
  }[card.rarity] || "hover:shadow-slate-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -8, rotateY: 5 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick?.(card)}
      className={`relative cursor-pointer group perspective-1000`}
      style={{ perspective: "1000px" }}
    >
      <div className={`relative bg-card rounded-xl overflow-hidden border-2 ${borderColor} shadow-lg hover:shadow-2xl transition-all duration-300 ${glowClass}`}>
        {/* Image de la carte */}
        <div className="relative aspect-[2/3] overflow-hidden bg-black">
          <CardImg card={displayCard} />
          <CardFrameOverlay frame={appliedFrame} />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          
          {/* Badge de niveau */}
          <div className="absolute top-2 left-2 backdrop-blur-sm bg-black/60 rounded-full px-2 py-1 flex items-center gap-1 border border-white/10">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-white">{card.level || 1}</span>
          </div>
          
          {/* Badge favori */}
          {card.is_favorite && (
            <div className="absolute top-2 right-2">
              <Heart className="w-5 h-5 text-pink-400 fill-pink-400 drop-shadow-lg" />
            </div>
          )}
          
          {/* Badge de rareté */}
          <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold border ${rarity.bgColor} ${rarity.color} ${rarity.borderColor}`}>
            {rarity.label}
          </div>
          
          {/* Puissance affichée en permanence */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1.5 border border-white/10">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-lg font-black text-white font-display">{card.power}</span>
          </div>
        </div>
        
        {/* Informations de base */}
        <div className="p-3 bg-gradient-to-b from-card to-secondary/20">
          <h3 className="font-heading font-bold text-white text-sm truncate mb-1">{card.name}</h3>
          <p className="text-[10px] text-muted-foreground truncate">{card.anime}</p>
        </div>
        
        {/* Overlay de statistiques au survol */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 20
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/90 to-black/95 backdrop-blur-sm p-4 flex flex-col justify-center"
          style={{ pointerEvents: "none" }}
        >
          {/* En-tête */}
          <div className="text-center mb-4 pb-3 border-b border-white/10">
            <h3 className="font-heading font-bold text-white text-base mb-1">{card.name}</h3>
            <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${rarity.bgColor} ${rarity.color} ${rarity.borderColor}`}>
              {rarity.label}
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-secondary/30 rounded-lg p-2.5 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] text-muted-foreground font-semibold">ATTAQUE</span>
              </div>
              <span className="text-xl font-black text-white">{card.attack}</span>
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-2.5 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] text-muted-foreground font-semibold">DÉFENSE</span>
              </div>
              <span className="text-xl font-black text-white">{card.defense}</span>
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-2.5 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Wind className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] text-muted-foreground font-semibold">VITESSE</span>
              </div>
              <span className="text-xl font-black text-white">{card.speed}</span>
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-2.5 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] text-muted-foreground font-semibold">NIVEAU</span>
              </div>
              <span className="text-xl font-black text-white">{card.level || 1}</span>
            </div>
          </div>
          
          {/* Statistiques supplémentaires */}
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-secondary/20 rounded-lg px-3 py-2 border border-white/10">
              <span className="text-[10px] text-muted-foreground">PUISSANCE</span>
              <span className="text-lg font-black text-cyan-400">{card.power}</span>
            </div>
            
            {card.duplicates > 1 && (
              <div className="flex items-center justify-between bg-green-500/20 rounded-lg px-3 py-2 border border-green-500/30">
                <span className="text-[10px] text-green-300">EXEMPLAIRES</span>
                <span className="text-sm font-bold text-green-400">×{card.duplicates}</span>
              </div>
            )}
            
            {/* Revenu passif */}
            <div className="flex items-center justify-between bg-yellow-500/20 rounded-lg px-3 py-2 border border-yellow-500/30">
              <div className="flex items-center gap-1.5">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] text-yellow-300">REVENU / MIN</span>
              </div>
              <span className="text-sm font-bold text-yellow-400">+{getCardIncome(card)} 🪙</span>
            </div>
          </div>
          
          {/* Indice de clic */}
          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <p className="text-[10px] text-muted-foreground">Cliquez pour voir les détails</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
