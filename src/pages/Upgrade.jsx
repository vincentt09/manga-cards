import React, { useState, useMemo } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp, Coins, Star, Zap, Shield, Wind, Check, AlertCircle,
  Search, TrendingUp, Lock, ChevronUp, Swords
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import { RARITY_CONFIG, RARITY_ORDER, getUpgradeCost, getDuplicatesForUpgrade, MAX_CARD_LEVEL } from "@/lib/gameData";
import { trackCardUpgraded, trackCoinsSpent } from "@/lib/questTracker";
import { logTransaction } from "@/lib/transactionLogger";

// ─── Stat gain preview ────────────────────────────────────────────────────────
function StatRow({ icon: Icon, label, value, gain, color }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="font-bold tabular-nums">{value}</span>
        {gain > 0 && (
          <span className="text-green-400 text-xs font-bold flex items-center gap-0.5">
            <ChevronUp className="w-3 h-3" />+{gain}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Level progress bar ────────────────────────────────────────────────────────
function LevelBar({ level }) {
  const pct = (level / MAX_CARD_LEVEL) * 100;
  const isMax = level >= MAX_CARD_LEVEL;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-bold text-muted-foreground">Niveau</span>
        <span className={`font-display font-bold ${isMax ? "text-yellow-300" : "text-foreground"}`}>
          {level} / {MAX_CARD_LEVEL} {isMax && "✦ MAX"}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isMax ? "bg-gradient-to-r from-yellow-400 to-amber-500" : "bg-gradient-to-r from-primary to-accent"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {/* Level milestones */}
      <div className="flex justify-between mt-1">
        {[25, 50, 75, 100].map(m => (
          <div key={m} className="flex flex-col items-center">
            <div className={`w-1 h-1 rounded-full ${level >= m ? "bg-primary" : "bg-border"}`} />
            <span className="text-[8px] text-muted-foreground mt-0.5">{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Upgrade panel ─────────────────────────────────────────────────────────────
function UpgradePanel({ card, profile, onUpgrade, isUpgrading, upgradeSuccess }) {
  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
          <ArrowUp className="w-7 h-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Sélectionne une carte</p>
        <p className="text-xs text-muted-foreground/60 mt-1">pour voir les options d'amélioration</p>
      </div>
    );
  }

  const cfg = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.normale;
  const level = card.level || 1;
  const isMax = level >= MAX_CARD_LEVEL;
  const upgradeCost = getUpgradeCost(level, card.rarity);
  const dupsNeeded = getDuplicatesForUpgrade(level);
  const dupsAvail = Math.max(0, (card.duplicates || 1) - 1);
  const hasCoins = (profile?.coins || 0) >= upgradeCost;
  const hasDups = dupsAvail >= dupsNeeded;
  const canUpgrade = !isMax && hasCoins && hasDups;

  // Stat gains preview
  const powerGain = Math.floor(Math.random() * 0) + 3; // show fixed avg for preview
  const atkGain = 2, defGain = 2, spdGain = 1;

  return (
    <div>
      {/* Card preview */}
      <div className={`rounded-2xl border ${cfg.borderColor} bg-gradient-to-b ${cfg.gradient} p-4 mb-4 relative overflow-hidden`}>
        <div className="flex items-center gap-3">
          <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-white/10 shrink-0">
            {card.image_url ? (
              <img src={card.image_url} alt={card.name} className="w-full h-full object-contain bg-black" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black/20">
                <Zap className="w-6 h-6 text-white/40" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-white truncate">{card.name}</p>
            <p className={`text-xs ${cfg.color} font-semibold`}>{cfg.label}</p>
            <p className="text-xs text-white/50 mt-0.5">{card.anime}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs bg-black/30 text-white/80 rounded-full px-2 py-0.5 font-mono">⚡ {card.power}</span>
              {card.duplicates > 1 && (
                <span className="text-xs bg-yellow-500/20 text-yellow-300 rounded-full px-2 py-0.5 font-bold">×{card.duplicates}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Level bar */}
      <LevelBar level={level} />

      {isMax ? (
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 text-center mb-4">
          <Star className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
          <p className="text-sm font-display font-bold text-yellow-300">Niveau Maximum atteint !</p>
          <p className="text-xs text-yellow-400/70 mt-1">Cette carte est à son plein potentiel</p>
        </div>
      ) : (
        <>
          {/* Stats preview */}
          <div className="rounded-xl bg-secondary/30 border border-border/50 p-3 mb-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Statistiques → Niveau {level + 1}</p>
            <StatRow icon={Zap}    label="Puissance" value={card.power}   gain={3} color="text-red-400" />
            <StatRow icon={Swords} label="Attaque"   value={card.attack}  gain={2} color="text-orange-400" />
            <StatRow icon={Shield} label="Défense"   value={card.defense} gain={2} color="text-blue-400" />
            <StatRow icon={Wind}   label="Vitesse"   value={card.speed}   gain={1} color="text-green-400" />
          </div>

          {/* Requirements */}
          <div className="rounded-xl bg-secondary/30 border border-border/50 p-3 mb-4 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Conditions</p>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Coins className="w-3.5 h-3.5 text-yellow-400" /> Pièces
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold tabular-nums ${hasCoins ? "text-green-400" : "text-destructive"}`}>
                  {upgradeCost.toLocaleString()}
                </span>
                {hasCoins ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Lock className="w-3.5 h-3.5 text-destructive" />}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Star className="w-3.5 h-3.5 text-purple-400" /> Duplicatas
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold ${hasDups ? "text-green-400" : "text-destructive"}`}>
                  {dupsAvail}/{dupsNeeded}
                </span>
                {hasDups ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Lock className="w-3.5 h-3.5 text-destructive" />}
              </div>
            </div>
          </div>

          {/* Reason why can't upgrade */}
          {!canUpgrade && (
            <div className="text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 mb-3 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                {!hasCoins && `Il te manque ${(upgradeCost - (profile?.coins || 0)).toLocaleString()} pièces. `}
                {!hasDups && `Il te manque ${dupsNeeded - dupsAvail} duplicata(s). Ouvre des boosters !`}
              </span>
            </div>
          )}

          <Button onClick={onUpgrade} disabled={!canUpgrade || isUpgrading}
            className="w-full h-11 font-display font-bold text-sm bg-gradient-to-r from-primary to-accent hover:brightness-110 border-0 transition-all">
            {isUpgrading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Amélioration…
              </span>
            ) : upgradeSuccess ? (
              <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Améliorée !</span>
            ) : (
              <span className="flex items-center gap-2">
                <ArrowUp className="w-4 h-4" />
                Améliorer → Niv. {level + 1}
              </span>
            )}
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Card list item ────────────────────────────────────────────────────────────
function CardListItem({ card, selected, profile, onClick }) {
  const cfg = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.normale;
  const level = card.level || 1;
  const isMax = level >= MAX_CARD_LEVEL;
  const cost = getUpgradeCost(level, card.rarity);
  const dupsNeeded = getDuplicatesForUpgrade(level);
  const canUpgrade = !isMax && (profile?.coins || 0) >= cost && (card.duplicates || 1) - 1 >= dupsNeeded;

  return (
    <motion.div whileTap={{ scale: 0.97 }} onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
        selected
          ? `${cfg.borderColor} bg-gradient-to-r from-secondary/60 to-transparent ring-2 ring-primary/30`
          : "border-border bg-secondary/20 hover:bg-secondary/40"
      }`}>
      <div className={`w-12 h-16 rounded-lg overflow-hidden border ${cfg.borderColor} shrink-0`}>
        {card.image_url ? (
          <img src={card.image_url} alt={card.name} className="w-full h-full object-contain bg-black" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-b ${cfg.gradient} flex items-center justify-center`}>
            <Zap className="w-4 h-4 text-white/40" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{card.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
          {card.duplicates > 1 && <span className="text-[10px] text-yellow-300 font-bold">×{card.duplicates}</span>}
        </div>
        {/* Mini level bar */}
        <div className="h-1 rounded-full bg-border mt-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full ${isMax ? "bg-yellow-400" : "bg-primary"}`}
            style={{ width: `${(level / MAX_CARD_LEVEL) * 100}%` }}
          />
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-xs font-display font-bold">
          {isMax ? <span className="text-yellow-300">MAX</span> : `Niv. ${level}`}
        </p>
        {!isMax && (
          <div className={`mt-1 w-2 h-2 rounded-full mx-auto ${canUpgrade ? "bg-green-400" : "bg-muted"}`} title={canUpgrade ? "Améliorable" : "Conditions manquantes"} />
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Upgrade() {
  const [selected, setSelected] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | upgradable | max
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: () => appClient.entities.Card.list("-power", 1000),
  });
  const { data: imageOverrides = [] } = useQuery({
    queryKey: ["cardImageOverrides"],
    queryFn: () => appClient.entities.CardImageOverride.list(),
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["profile"],
    queryFn: () => appClient.entities.PlayerProfile.list(),
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
  
  const selectedCard = getCardWithOverride(selected ? cards.find(c => c.id === selected) : null);

  const handleUpgrade = async () => {
    if (!selectedCard || !profile) return;
    const level = selectedCard.level || 1;
    const upgradeCost = getUpgradeCost(level, selectedCard.rarity);
    const dupsNeeded = getDuplicatesForUpgrade(level);
    const canUpgrade = level < MAX_CARD_LEVEL
      && (profile.coins || 0) >= upgradeCost
      && (selectedCard.duplicates || 1) - 1 >= dupsNeeded;
    if (!canUpgrade) return;

    setIsUpgrading(true);
    const newLevel = level + 1;
    const powerBoost = Math.floor(Math.random() * 2) + 2;
    const atkBoost   = Math.floor(Math.random() * 2) + 1;
    const defBoost   = Math.floor(Math.random() * 2) + 1;
    const spdBoost   = Math.floor(Math.random() * 2) + 1;

    await appClient.entities.Card.update(selectedCard.id, {
      level: newLevel,
      power:   (selectedCard.power   || 0) + powerBoost,
      attack:  (selectedCard.attack  || 0) + atkBoost,
      defense: (selectedCard.defense || 0) + defBoost,
      speed:   (selectedCard.speed   || 0) + spdBoost,
      duplicates: Math.max(1, (selectedCard.duplicates || 1) - dupsNeeded),
    });

    await appClient.entities.PlayerProfile.update(profile.id, {
      coins: (profile.coins || 0) - upgradeCost,
      xp:    (profile.xp    || 0) + 50 + newLevel * 10,
    });

    await logTransaction("upgrade", `Amélioration de ${selectedCard.name} → Niv. ${newLevel}`, -upgradeCost, selectedCard.name, selectedCard.rarity);

    queryClient.invalidateQueries({ queryKey: ["cards"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["quests"] });

    trackCardUpgraded();
    trackCoinsSpent(upgradeCost);

    setUpgradeSuccess(true);
    setTimeout(() => setUpgradeSuccess(false), 2500);
    setIsUpgrading(false);

    toast({
      title: `⚡ ${selectedCard.name} → Niveau ${newLevel} !`,
      description: `+${powerBoost} puissance · +${atkBoost} ATK · +${defBoost} DEF · +${spdBoost} VIT`,
    });
  };

  const filteredCards = useMemo(() => {
    return [...cards]
      .filter(c => {
        if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
        const level = c.level || 1;
        const isMax = level >= MAX_CARD_LEVEL;
        const cost = getUpgradeCost(level, c.rarity);
        const dupsNeeded = getDuplicatesForUpgrade(level);
        const canUpgrade = !isMax && (profile?.coins || 0) >= cost && (c.duplicates || 1) - 1 >= dupsNeeded;
        if (filter === "upgradable" && !canUpgrade) return false;
        if (filter === "max" && !isMax) return false;
        return true;
      })
      .sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0));
  }, [cards, search, filter, profile]);

  const upgradableCount = useMemo(() => cards.filter(c => {
    const level = c.level || 1;
    const cost = getUpgradeCost(level, c.rarity);
    const dupsNeeded = getDuplicatesForUpgrade(level);
    return level < MAX_CARD_LEVEL && (profile?.coins || 0) >= cost && (c.duplicates || 1) - 1 >= dupsNeeded;
  }).length, [cards, profile]);

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
      <Navbar />
      <CurrencyBar profile={profile} cards={cards} />

      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl font-bold tracking-wide">Améliorer</h1>
          {upgradableCount > 0 && (
            <span className="bg-green-500/20 text-green-400 text-xs font-bold rounded-full px-2.5 py-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />{upgradableCount} prêtes
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-5">Dépense des pièces et des duplicatas pour renforcer tes cartes</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Card list */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {/* Filters */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <div className="relative flex-1 min-w-40">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-secondary/50 text-sm" />
              </div>
              {[
                { id: "all",        label: "Toutes" },
                { id: "upgradable", label: "✦ Améliorables" },
                { id: "max",        label: "MAX" },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filter === f.id ? "bg-primary text-white border-primary" : "bg-secondary/40 text-muted-foreground border-border"}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {filteredCards.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune carte trouvée</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredCards.map(card => (
                    <motion.div key={card.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                      <CardListItem
                        card={card}
                        selected={selected === card.id}
                        profile={profile}
                        onClick={() => setSelected(selected === card.id ? null : card.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Upgrade panel */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="sticky top-36 rounded-2xl border border-border bg-card p-5">
              <AnimatePresence mode="wait">
                <motion.div key={selected || "empty"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <UpgradePanel
                    card={selectedCard}
                    profile={profile}
                    onUpgrade={handleUpgrade}
                    isUpgrading={isUpgrading}
                    upgradeSuccess={upgradeSuccess}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
