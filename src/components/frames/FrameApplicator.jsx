import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles, Star } from "lucide-react";
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

export default function FrameApplicator({ card, ownedFrames = [], onApplyFrame }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(null);

  const handleApply = (frame) => {
    if (onApplyFrame) {
      onApplyFrame(frame, card);
    }
    setIsOpen(false);
  };

  const rarity = selectedFrame ? FRAME_RARITY_CONFIG[selectedFrame.rarity] : null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1 text-xs"
      >
        <Star className="w-3 h-3" />
        Cadre
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              Appliquer un Cadre à {card?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Prévisualisation */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Aperçu</h3>
              <div className="relative flex items-center justify-center p-8 bg-secondary/30 rounded-2xl border border-border min-h-[400px]">
                <AnimatePresence mode="wait">
                  {selectedFrame ? (
                    <motion.div
                      key={selectedFrame.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`relative rounded-xl border-4 ${rarity.borderColor} overflow-hidden shadow-2xl`}
                      style={{ width: 220, height: 330 }}
                    >
                      {/* Effet du cadre */}
                      <div className={`absolute inset-0 bg-gradient-to-b ${rarity.gradient} opacity-20`} />
                      
                      {/* Effets spéciaux */}
                      {selectedFrame.effect === "shimmer" && (
                        <div className="absolute inset-0 shimmer opacity-50" />
                      )}
                      {selectedFrame.effect === "sparkle" && (
                        <div className="absolute inset-0 animate-pulse bg-white/5" />
                      )}
                      {selectedFrame.effect === "glow" && (
                        <div className={`absolute inset-0 shadow-lg`} style={{ boxShadow: `0 0 30px ${rarity.color.replace('text-', '')}` }} />
                      )}
                      
                      {/* Image de la carte */}
                      <div className="relative z-10 h-full">
                        {card?.image_url ? (
                          <img
                            src={card.image_url}
                            alt={card.name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-b ${rarity.gradient} flex items-center justify-center p-4`}>
                            <p className="text-xs font-bold text-white/80 text-center">{card?.name}</p>
                          </div>
                        )}
                      </div>

                      {/* Overlay d'infos */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                        <p className="text-xs font-bold text-white">{card?.name}</p>
                        <p className="text-[10px] text-white/70">{selectedFrame.name}</p>
                        {selectedFrame.effect !== "none" && (
                          <div className="flex items-center gap-1 mt-1">
                            <Sparkles className="w-2 h-2 text-white/60" />
                            <span className="text-[9px] text-white/60 capitalize">{selectedFrame.effect}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-muted-foreground"
                    >
                      <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Sélectionnez un cadre pour prévisualiser</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sélection des cadres */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                Vos Cadres ({ownedFrames.length})
              </h3>
              
              {ownedFrames.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Vous ne possédez aucun cadre</p>
                  <p className="text-xs mt-1">Explorez la boutique pour en acquérir !</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {ownedFrames.map((userFrame) => {
                    const frame = userFrame;
                    const frameRarity = FRAME_RARITY_CONFIG[frame.rarity] || FRAME_RARITY_CONFIG.common;
                    const isApplied = userFrame.card_id === card?.id;

                    return (
                      <motion.button
                        key={frame.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedFrame(frame)}
                        className={`w-full p-3 rounded-xl border transition-all text-left ${
                          selectedFrame?.id === frame.id
                            ? `bg-primary/10 border-primary/50 ring-2 ring-primary/30`
                            : "bg-card border-border hover:border-primary/30"
                        } ${isApplied ? "ring-2 ring-green-500/50" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-14 rounded-lg border-2 ${frameRarity.borderColor} bg-gradient-to-b ${frameRarity.gradient} overflow-hidden`}>
                              {card?.image_url ? (
                                <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{frame.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {frame.effect === "none" ? "Sans effet" : frame.effect}
                              </p>
                              <Badge className={`mt-1 ${frameRarity.bgColor} ${frameRarity.color} text-[9px]`}>
                                {frameRarity.label}
                              </Badge>
                            </div>
                          </div>
                          
                          {isApplied ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApply(frame);
                              }}
                              className="text-xs"
                            >
                              Appliquer
                            </Button>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
