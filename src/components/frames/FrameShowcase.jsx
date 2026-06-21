import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Star, Shield } from "lucide-react";

const FRAME_RARITY_CONFIG = {
  common: { label: "Commun", color: "text-slate-400", bgColor: "bg-slate-500/20", borderColor: "border-slate-500/40", gradient: "from-slate-600 to-slate-800" },
  rare: { label: "Rare", color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-400/60", gradient: "from-blue-600 to-blue-800" },
  epic: { label: "Épique", color: "text-purple-400", bgColor: "bg-purple-500/20", borderColor: "border-purple-400/70", gradient: "from-purple-600 to-purple-800" },
  legendary: { label: "Légendaire", color: "text-yellow-400", bgColor: "bg-yellow-500/20", borderColor: "border-yellow-400/80", gradient: "from-yellow-600 to-amber-800" },
  secret: { label: "Secret", color: "text-rose-400", bgColor: "bg-rose-500/20", borderColor: "border-rose-400/90", gradient: "from-rose-600 to-pink-900" },
  manga_god: { label: "Manga God", color: "text-cyan-400", bgColor: "bg-cyan-500/20", borderColor: "border-cyan-400/90", gradient: "from-cyan-600 to-blue-900" },
};

export default function FrameShowcase({ frame, isUnlocked, onClick }) {
  const rarity = FRAME_RARITY_CONFIG[frame.rarity] || FRAME_RARITY_CONFIG.common;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative rounded-2xl border-2 ${rarity.borderColor} bg-gradient-to-b ${rarity.gradient} overflow-hidden cursor-pointer group`}
    >
      {/* Frame preview area */}
      <div className="relative flex h-40 items-center justify-center p-2 sm:h-48 sm:p-4">
        {/* Locked overlay */}
        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <Shield className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Sample card placeholder */}
        <div className="relative aspect-[2/3] w-24 overflow-hidden rounded-lg border-2 border-white/20 bg-black/30 sm:w-28">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-amber-950 to-black" />
          {frame.image_url && <img src={frame.image_url} alt="" className="absolute inset-0 z-10 w-full h-full object-fill pointer-events-none" />}
          {frame.effect !== "none" && (
            <div className={`absolute inset-0 ${
              frame.effect === "shimmer" ? "shimmer" :
              frame.effect === "sparkle" ? "animate-pulse" :
              frame.effect === "glow" ? "shadow-lg" :
              "animate-bounce"
            }`} />
          )}
          
          {/* Rarity badge */}
          <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${rarity.bgColor} ${rarity.color}`}>
            {rarity.label}
          </div>
          
          {/* Effect indicator */}
          {frame.effect !== "none" && (
            <div className="absolute top-2 left-2">
              <Sparkles className="w-3 h-3 text-white/80" />
            </div>
          )}
        </div>
        
        {/* Frame name overlay */}
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <p className="text-xs font-bold text-white drop-shadow-lg">{frame.name}</p>
          <p className="text-[9px] text-white/70">{frame.effect !== "none" ? `• ${frame.effect}` : "Classique"}</p>
        </div>
      </div>
      
      {/* Info section */}
      <div className="p-3 bg-black/40 backdrop-blur-sm">
        <div className="mb-2 flex flex-col items-start gap-1 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
          <span className="text-[10px] text-muted-foreground">Coût</span>
          <div className="flex min-w-0 items-start gap-1 min-[430px]:justify-end">
            <Star className="w-3 h-3 text-cyan-400 fill-cyan-400" />
            <span className="break-words text-left text-xs font-bold text-cyan-300 min-[430px]:text-right">
              {Number(frame.price_coins || 0) > 0 && `${Number(frame.price_coins).toLocaleString("fr-FR")} 🪙 `}
              {Number(frame.price_gems || 0) > 0 && `${Number(frame.price_gems).toLocaleString("fr-FR")} 💎`}
              {Number(frame.price_eur || 0) > 0 && `${Number(frame.price_eur).toFixed(2)} €`}
              {frame.source_type === "gift" && "Gratuit"}
              {frame.source_type === "event" && `${Number(frame.drop_chance || 0)}% / booster`}
            </span>
          </div>
        </div>
        
        {frame.source_type && (
          <div className="text-[9px] text-muted-foreground text-center">
            {frame.source_type === "shop" && "🏪 Boutique"}
            {frame.source_type === "booster" && "📦 Boosters"}
            {frame.source_type === "quest" && "⚔️ Quêtes"}
            {frame.source_type === "achievement" && "🏆 Succès"}
            {frame.source_type === "endgame" && "👑 End-game"}
            {frame.source_type === "gift" && "🎁 Cadeau"}
            {frame.source_type === "event" && "✨ Événement"}
          </div>
        )}
      </div>
    </motion.div>
  );
}
