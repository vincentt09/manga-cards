import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const FRAME_RARITY_CONFIG = {
  common: { label: "Commun", color: "text-slate-400", bgColor: "bg-slate-500/20", borderColor: "border-slate-500/40", gradient: "from-slate-600 to-slate-800" },
  rare: { label: "Rare", color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-400/60", gradient: "from-blue-600 to-blue-800" },
  epic: { label: "Épique", color: "text-purple-400", bgColor: "bg-purple-500/20", borderColor: "border-purple-400/70", gradient: "from-purple-600 to-purple-800" },
  legendary: { label: "Légendaire", color: "text-yellow-400", bgColor: "bg-yellow-500/20", borderColor: "border-yellow-400/80", gradient: "from-yellow-600 to-amber-800" },
  secret: { label: "Secret", color: "text-rose-400", bgColor: "bg-rose-500/20", borderColor: "border-rose-400/90", gradient: "from-rose-600 to-pink-900" },
  manga_god: { label: "Manga God", color: "text-cyan-400", bgColor: "bg-cyan-500/20", borderColor: "border-cyan-400/90", gradient: "from-cyan-600 to-blue-900" },
};

export default function FramePreviewModal({ isOpen, onClose, frame, card, onApply, ownedFrames = [] }) {
  const [selectedCard, setSelectedCard] = useState(card);
  const rarity = FRAME_RARITY_CONFIG[frame?.rarity] || FRAME_RARITY_CONFIG.common;

  if (!frame || !isOpen) return null;

  const isOwned = ownedFrames.some(f => f.frame_id === frame.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center justify-between">
            <span>Appliquer le Cadre : {frame.name}</span>
            <Badge className={`${rarity.bgColor} ${rarity.color} border ${rarity.borderColor}`}>
              {rarity.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prévisualisation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Aperçu</h3>
            <div className="relative flex items-center justify-center p-8 bg-secondary/30 rounded-2xl border border-border">
              {/* Carte avec cadre */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`relative rounded-xl border-4 ${rarity.borderColor} overflow-hidden`}
                style={{ width: 220, height: 330 }}
              >
                {/* Effet du cadre */}
                <div className={`absolute inset-0 bg-gradient-to-b ${rarity.gradient} opacity-20`} />
                
                {/* Effets spéciaux */}
                {frame.effect === "shimmer" && (
                  <div className="absolute inset-0 shimmer opacity-50" />
                )}
                {frame.effect === "sparkle" && (
                  <div className="absolute inset-0 animate-pulse bg-white/5" />
                )}
                {frame.effect === "glow" && (
                  <div className={`absolute inset-0 shadow-lg ${rarity.color.replace('text-', 'shadow-')}`} />
                )}
                
                {/* Image de la carte */}
                <div className="relative z-10 h-full">
                  {selectedCard?.image_url ? (
                    <img
                      src={selectedCard.image_url}
                      alt={selectedCard.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-b ${rarity.gradient} flex items-center justify-center p-4`}>
                      <p className="text-xs font-bold text-white/80 text-center">{selectedCard?.name || "Carte"}</p>
                    </div>
                  )}
                </div>

                {/* Overlay d'infos */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                  <p className="text-xs font-bold text-white">{selectedCard?.name || "Carte"}</p>
                  <p className="text-[10px] text-white/70">{frame.name}</p>
                </div>
              </motion.div>
            </div>

            {/* Infos du cadre */}
            <div className="p-4 bg-card rounded-xl border border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Effet</span>
                <span className="font-medium capitalize">{frame.effect === "none" ? "Aucun" : frame.effect}</span>
              </div>
              {frame.description && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Description</span>
                  <span className="font-medium text-right max-w-[200px]">{frame.description}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium capitalize">
                  {frame.source_type === "shop" && "🏪 Boutique"}
                  {frame.source_type === "booster" && "📦 Booster"}
                  {frame.source_type === "quest" && "⚔️ Quête"}
                  {frame.source_type === "achievement" && "🏆 Succès"}
                </span>
              </div>
            </div>
          </div>

          {/* Sélection de carte */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Sélectionner une carte</h3>
            
            {selectedCard && (
              <div className="p-4 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-16 rounded-lg border-2 ${rarity.borderColor} overflow-hidden`}>
                    {selectedCard.image_url ? (
                      <img src={selectedCard.image_url} alt={selectedCard.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-b ${rarity.gradient}`} />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{selectedCard.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCard.anime}</p>
                    <p className="text-xs font-bold text-primary">⚡ {selectedCard.power}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => onApply(frame, selectedCard)}
                disabled={!isOwned}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Check className="w-4 h-4 mr-2" />
                {isOwned ? "Appliquer le cadre" : "Cadre non possédé"}
              </Button>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
