import React from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RARITY_CONFIG } from "@/lib/gameData";

const RARITY_ICONS = {
  legendaire: { icon: Sparkles, color: "text-yellow-400" },
  secrète: { icon: Zap, color: "text-rose-400" },
  manga_god: { icon: Crown, color: "text-cyan-400" },
};

const cleanBoosterDescription = (description = "") => description
  .replace(/\s*[·•-]\s*(Légendaire|Secrète|Manga God)\s+garantie.*$/iu, "")
  .replace(/cartes rares garanties/giu, "cartes rares");

export default function BoosterPreviewModal({ booster, onClose, allCards = [], imageOverrides = [] }) {
  if (!booster) return null;

  // Get cards for this booster's anime
  const boosterCards = allCards.filter(c => {
    if (booster.collector_only && !c.is_collector) return false;
    if (booster.is_custom) return c.collection_id === booster.id;
    if (c.collection_id) return c.collection_id === booster.id;
    if (booster.is_premium) return true;
    return c.anime === booster.anime;
  });

  // Group by rarity
  const byRarity = {
    legendaire: boosterCards.filter(c => c.rarity === "legendaire"),
    secrète: boosterCards.filter(c => c.rarity === "secrète"),
    manga_god: boosterCards.filter(c => c.rarity === "manga_god"),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${booster.color} flex items-center justify-center text-2xl`}>
                  {booster.icon}
                </div>
                <div>
                  <h2 className="font-heading font-bold text-lg">{booster.name}</h2>
                  <p className="text-xs text-muted-foreground">{cleanBoosterDescription(booster.description)}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Cards by rarity */}
            <div className="space-y-6">
              {Object.entries(byRarity).map(([rarity, cards]) => {
                if (cards.length === 0) return null;
                const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.normale;
                const rarityIcon = RARITY_ICONS[rarity];
                const Icon = rarityIcon?.icon || Sparkles;

                return (
                  <div key={rarity}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`w-4 h-4 ${rarityIcon?.color || "text-muted-foreground"}`} />
                      <h3 className={`font-semibold text-sm ${rarityConfig.color}`}>
                        {rarityConfig.label} — {cards.length} carte{cards.length > 1 ? 's' : ''}
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {cards.slice(0, 12).map((card, i) => (
                        <motion.div
                          key={card.id || i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border/50 bg-secondary/30 group"
                        >
                          {(imageOverrides.find(item => item.card_id === card.id)?.image_url || card.image_url) ? (
                            <img
                              src={imageOverrides.find(item => item.card_id === card.id)?.image_url || card.image_url}
                              alt={card.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <span className="text-xs text-center p-1">{card.name}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="absolute bottom-1 left-1 right-1 text-[9px] text-white font-semibold truncate">
                              {card.name}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer info */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                {boosterCards.length} cartes au total • Toutes les cartes ont une chance d'apparaître
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
