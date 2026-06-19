import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RARITY_CONFIG } from "@/lib/gameData";

export default function BoosterPreview({ booster, cards, onClose }) {
  const [selectedRarity, setSelectedRarity] = useState("all");

  const boosterCards = cards.filter(c => {
    if (!booster.anime) return true; // Premium shows all
    return c.anime === booster.anime;
  });

  const filteredCards = selectedRarity === "all" 
    ? boosterCards 
    : boosterCards.filter(c => c.rarity === selectedRarity);

  const rarityCounts = {
    normale: boosterCards.filter(c => c.rarity === "normale").length,
    legendaire: boosterCards.filter(c => c.rarity === "legendaire").length,
    secrète: boosterCards.filter(c => c.rarity === "secrète").length,
    manga_god: boosterCards.filter(c => c.rarity === "manga_god").length,
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
          <CardHeader className="sticky top-0 bg-card z-10 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${booster.color} flex items-center justify-center text-2xl`}>
                  {booster.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{booster.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{booster.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Rarity filters */}
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant={selectedRarity === "all" ? "default" : "outline"}
                onClick={() => setSelectedRarity("all")}
                className="text-xs"
              >
                Toutes ({boosterCards.length})
              </Button>
              {Object.entries(rarityCounts).map(([rarity, count]) => {
                if (count === 0) return null;
                const config = RARITY_CONFIG[rarity];
                return (
                  <Button
                    key={rarity}
                    size="sm"
                    variant={selectedRarity === rarity ? "default" : "outline"}
                    onClick={() => setSelectedRarity(rarity)}
                    className={`text-xs ${config?.color}`}
                  >
                    {config?.label} ({count})
                  </Button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="relative group"
                >
                  <div className={`aspect-[3/4] rounded-lg overflow-hidden border-2 ${RARITY_CONFIG[card.rarity]?.borderColor || 'border-slate-500/40'} bg-card/50`}>
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/200x300?text=No+Image";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-[10px] font-bold text-white truncate">{card.name}</p>
                        <p className="text-[9px] text-white/80">{card.anime}</p>
                      </div>
                    </div>
                  </div>
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${RARITY_CONFIG[card.rarity]?.bgColor || 'bg-slate-500/20'} flex items-center justify-center text-[8px]`}>
                    {RARITY_CONFIG[card.rarity]?.label?.charAt(0)}
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredCards.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Aucune carte dans cette catégorie</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}