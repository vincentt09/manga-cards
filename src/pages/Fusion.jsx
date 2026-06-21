import React, { useState, useMemo } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Plus, X, Sparkles, AlertTriangle, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import { RARITY_CONFIG } from "@/lib/gameData";
import { useAuth } from "@/lib/AuthContext";

// ─── Fusion Recipes ────────────────────────────────────────────────────────────
// Sacrifice N cards of rarity X → get 1 card of rarity X+1
export const FUSION_RECIPES = {
  normale:     { count: 5, copiesEach: 5, result: "legendaire", cost: 50000,   minLevel: 10 },
  legendaire:  { count: 5, copiesEach: 3, result: "secrète",    cost: 250000,  minLevel: 15 },
  secrète:     { count: 5, copiesEach: 2, result: "manga_god",  cost: 1000000, minLevel: 25, weekly: true },
};

const getWeekKey = (date = new Date()) => {
  const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((value - yearStart) / 86400000) + 1) / 7);
  return `${value.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

function rarityBg(rarity) {
  return RARITY_CONFIG[rarity]?.gradient || "from-slate-600 to-slate-800";
}

// ─── Small card slot ──────────────────────────────────────────────────────────
function CardSlot({ card, onRemove, empty, imageOverrides = [] }) {
  const cfg = card ? RARITY_CONFIG[card.rarity] : null;
  // Get override image (match by name + rarity suffix)
  const raritySuffixes = card ? {
    "normale": ["_n", "_b"],
    "legendaire": ["_l"], 
    "secrète": ["_s"],
    "manga_god": ["_mg"]
  }[card.rarity] || ["_n"] : [];
  
  const override = imageOverrides.find(o => 
    o.card_name && 
    o.card_name.toLowerCase() === card?.name.toLowerCase() &&
    o.card_id &&
    raritySuffixes.some(suffix => o.card_id.endsWith(suffix))
  );
  const displayCard = override ? { ...card, image_url: override.image_url } : card;
  
  if (empty) {
    return (
      <div className="w-16 h-22 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-secondary/20">
        <Plus className="w-5 h-5 text-muted-foreground/40" />
      </div>
    );
  }
  return (
    <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className={`relative w-16 rounded-xl border ${cfg.borderColor} bg-gradient-to-b ${cfg.gradient} overflow-hidden cursor-pointer`}
      style={{ height: 88 }}
      onClick={onRemove}>
      {displayCard.image_url ? (
        <img src={displayCard.image_url} alt={displayCard.name} className="w-full h-full object-cover object-top" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/80 text-center px-1">{displayCard.name}</div>
      )}
      <div className="absolute top-1 right-1 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
        <X className="w-2.5 h-2.5 text-white" />
      </div>
    </motion.div>
  );
}

// ─── Selectable card in picker ────────────────────────────────────────────────
function PickerCard({ card, selected, onClick, imageOverrides = [] }) {
  const cfg = RARITY_CONFIG[card.rarity];
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
  const displayCard = override ? { ...card, image_url: override.image_url } : card;
  
  return (
    <motion.div whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${selected ? "border-primary ring-2 ring-primary/40" : cfg.borderColor}`}
      style={{ height: 100 }}>
      {displayCard.image_url ? (
        <img src={displayCard.image_url} alt={displayCard.name} className="w-full h-full object-cover object-top" />
      ) : (
        <div className={`w-full h-full bg-gradient-to-b ${cfg.gradient} flex items-center justify-center text-xs font-bold text-white/80 text-center px-1`}>{displayCard.name}</div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
        <p className="text-[9px] font-bold text-white truncate">{card.name}</p>
        {card.duplicates > 1 && <p className="text-[8px] text-yellow-300">×{card.duplicates}</p>}
      </div>
      {selected && (
        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-white">✓</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Result reveal overlay ────────────────────────────────────────────────────
function ResultOverlay({ card, onClose }) {
  if (!card) return null;
  const cfg = RARITY_CONFIG[card.rarity];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", bounce: 0.4 }}
        className={`relative rounded-3xl border-2 ${cfg.borderColor} bg-gradient-to-b ${cfg.gradient} overflow-hidden shadow-2xl`}
        style={{ width: 220, height: 310 }}
        onClick={e => e.stopPropagation()}>
        {card.image_url && (
          <img src={card.image_url} alt={card.name} className="w-full h-full object-cover object-top" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        <div className="absolute top-3 left-0 right-0 text-center">
          <span className={`text-xs font-bold ${cfg.color} bg-black/40 rounded-full px-3 py-1`}>{cfg.label}</span>
        </div>
        <div className="absolute bottom-4 left-0 right-0 text-center px-3">
          <p className="font-display text-lg font-bold text-white drop-shadow">{card.name}</p>
          <p className="text-xs text-white/70">{card.anime}</p>
          <p className={`text-sm font-bold mt-1 ${cfg.color}`}>⚡ {card.power}</p>
        </div>
        <motion.div className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: 2 }}
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)" }} />
      </motion.div>
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-white/60 text-sm">Appuie pour fermer</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Fusion() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRarity, setSelectedRarity] = useState("normale");
  const [selectedCards, setSelectedCards] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [resultCard, setResultCard] = useState(null);
  const [isFusing, setIsFusing] = useState(false);

  const { data: cards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: () => appClient.entities.Card.list(),
  });
  const { data: imageOverrides = [] } = useQuery({
    queryKey: ["cardImageOverrides"],
    queryFn: () => appClient.entities.CardImageOverride.list(),
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => appClient.entities.PlayerProfile.filter({ created_by_id: user.id }),
    enabled: Boolean(user?.id),
  });
  const profile = profiles[0];
  
  // Get card with override image if available (match by name + rarity suffix)
  const getCardWithOverride = (card) => {
    if (!card) return null;
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
    return override ? { ...card, image_url: override.image_url } : card;
  };

  const recipe = FUSION_RECIPES[selectedRarity];
  const resultCfg = recipe ? RARITY_CONFIG[recipe.result] : null;
  const inputCfg = RARITY_CONFIG[selectedRarity];

  // Cards of the selected rarity available (not already picked)
  const availableCards = useMemo(() => {
    const pickedIds = new Set(selectedCards.map(c => c.id));
    return cards.filter(c => c.rarity === selectedRarity
      && Number(c.duplicates || 1) >= Number(recipe?.copiesEach || 1)
      && Number(c.level || 1) >= Number(recipe?.minLevel || 1)
      && !pickedIds.has(c.id));
  }, [cards, recipe, selectedRarity, selectedCards]);

  const handleSelectRarity = (r) => {
    setSelectedRarity(r);
    setSelectedCards([]);
  };

  const handlePickCard = (card) => {
    if (!recipe) return;
    if (selectedCards.length >= recipe.count) return;
    setSelectedCards(prev => [...prev, card]);
    if (selectedCards.length + 1 >= recipe.count) setShowPicker(false);
  };

  const handleRemoveCard = (card) => {
    setSelectedCards(prev => prev.filter(c => c.id !== card.id));
  };

  const handleAutoSelect = () => {
    if (!recipe) return;
    const eligible = cards
      .filter((card) => card.rarity === selectedRarity
        && !card.is_favorite
        && Number(card.duplicates || 1) >= recipe.copiesEach
        && Number(card.level || 1) >= recipe.minLevel)
      .sort((a, b) => Number(a.power || 0) - Number(b.power || 0));
    setSelectedCards(eligible.slice(0, recipe.count));
  };

  const canFuse = recipe
    && selectedCards.length === recipe.count
    && profile
    && (profile.coins || 0) >= recipe.cost
    && (!recipe.weekly || profile.manga_god_fusion_week !== getWeekKey());

  const handleFuse = async () => {
    if (!canFuse || isFusing) return;
    setIsFusing(true);

    try {
      const response = await appClient.functions.invoke("fuseCards", {
        rarity: selectedRarity,
        card_ids: selectedCards.map((card) => card.id),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cards"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
      setResultCard(response.data.card);
      setSelectedCards([]);
    } catch (error) {
      toast({ title: "Fusion impossible", description: error.message, variant: "destructive" });
    } finally {
      setIsFusing(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4 md:pt-14">
      <Navbar />
      {profile && <CurrencyBar profile={profile} cards={cards} />}

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-700 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Fusion</h1>
            <p className="text-xs text-muted-foreground">Rituel endgame coûteux : sacrifie niveaux et duplicatas pour dépasser les limites</p>
          </div>
        </div>

        {/* Rarity selector */}
        <div className="flex gap-2 flex-wrap mb-5">
          {Object.keys(FUSION_RECIPES).map(r => {
            const cfg = RARITY_CONFIG[r];
            if (!cfg) return null;
            const currentRecipe = FUSION_RECIPES[r];
            const hasEnough = cards.filter(c => c.rarity === r
              && Number(c.duplicates || 1) >= currentRecipe.copiesEach
              && Number(c.level || 1) >= currentRecipe.minLevel).length >= currentRecipe.count;
            return (
              <button key={r} onClick={() => handleSelectRarity(r)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedRarity === r ? `bg-gradient-to-r ${cfg.gradient} ${cfg.borderColor} text-white` : `bg-secondary/30 border-border ${cfg.color}`}`}>
                {cfg.label}
                {!hasEnough && <Lock className="w-3 h-3 opacity-50" />}
              </button>
            );
          })}
        </div>

        {/* Recipe info */}
        {recipe && (
          <div className={`rounded-2xl border ${inputCfg.borderColor} bg-gradient-to-r from-secondary/40 to-transparent p-4 mb-5`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className={`text-center px-3 py-1.5 rounded-lg border ${inputCfg.borderColor} bg-secondary/30`}>
                  <p className={`text-lg font-display font-bold ${inputCfg.color}`}>{recipe.count}×</p>
                  <p className={`text-[10px] ${inputCfg.color}`}>{inputCfg.label}</p>
                  <p className="text-[9px] text-muted-foreground">×{recipe.copiesEach} copies · niv. {recipe.minLevel}+</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                <div className={`text-center px-3 py-1.5 rounded-lg border ${resultCfg.borderColor} bg-secondary/30`}>
                  <Sparkles className={`w-5 h-5 mx-auto ${resultCfg.color}`} />
                  <p className={`text-[10px] ${resultCfg.color} font-bold`}>{resultCfg.label}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Coût</p>
                <p className="font-bold text-yellow-300">🪙 {recipe.cost.toLocaleString()}</p>
                {recipe.weekly && <p className="text-[10px] font-bold text-cyan-300 mt-1">1 fusion Manga God / semaine</p>}
              </div>
            </div>
          </div>
        )}

        {/* Card slots */}
        {recipe && (
          <div className="rounded-2xl border border-border bg-card/60 p-4 mb-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-muted-foreground uppercase">Cartes sélectionnées ({selectedCards.length}/{recipe.count})</p>
              <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleAutoSelect}>
                <Sparkles className="mr-1 h-3 w-3" />Sélection sûre
              </Button>
            </div>
            <p className="mb-3 text-[10px] text-muted-foreground">La sélection automatique protège les favoris et choisit les cartes les moins puissantes.</p>
            <div className="flex gap-2 flex-wrap">
              {selectedCards.map(c => (
                <CardSlot key={c.id} card={c} onRemove={() => handleRemoveCard(c)} imageOverrides={imageOverrides} />
              ))}
              {Array.from({ length: recipe.count - selectedCards.length }).map((_, i) => (
                <CardSlot key={`empty-${i}`} empty />
              ))}
              {selectedCards.length < recipe.count && (
                <button onClick={() => setShowPicker(true)}
                  className="w-16 h-22 rounded-xl border-2 border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-1 text-primary hover:bg-primary/10 transition-colors"
                  style={{ height: 88 }}>
                  <Plus className="w-5 h-5" />
                  <span className="text-[9px] font-bold">Ajouter</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Insufficient coins warning */}
        {recipe && selectedCards.length === recipe.count && profile && (profile.coins || 0) < recipe.cost && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl p-3 mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Pas assez de pièces. Il te faut {recipe.cost.toLocaleString()} 🪙</span>
          </div>
        )}

        {recipe?.weekly && profile?.manga_god_fusion_week === getWeekKey() && (
          <div className="flex items-center gap-2 text-cyan-300 text-sm bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 mb-4">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Fusion Manga God déjà réalisée cette semaine. Réinitialisation lundi.</span>
          </div>
        )}

        {/* Fuse button */}
        <Button onClick={handleFuse} disabled={!canFuse || isFusing}
          className="w-full h-12 text-base font-display font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 border-0">
          {isFusing ? (
            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Fusion en cours…</span>
          ) : (
            <span className="flex items-center gap-2"><Flame className="w-5 h-5" />Fusionner</span>
          )}
        </Button>
      </div>

      {/* Card Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => setShowPicker(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-card rounded-3xl border border-border w-full max-w-lg max-h-[70vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <p className="font-display font-bold">Choisir une carte <span className={inputCfg?.color}>{inputCfg?.label}</span></p>
                <button onClick={() => setShowPicker(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="overflow-y-auto p-4">
                {availableCards.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p className="text-sm">Aucune carte ne possède le niveau et les duplicatas requis</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {availableCards.map(card => (
                      <PickerCard key={card.id} card={card}
                        selected={selectedCards.some(c => c.id === card.id)}
                        onClick={() => handlePickCard(card)}
                        imageOverrides={imageOverrides} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result overlay */}
      <AnimatePresence>
        {resultCard && <ResultOverlay card={resultCard} onClose={() => setResultCard(null)} />}
      </AnimatePresence>
    </div>
  );
}
