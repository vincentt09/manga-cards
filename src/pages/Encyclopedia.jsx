import React, { useState, useMemo } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Search, Lock, CheckCircle, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import { CARD_POOL, RARITY_CONFIG, RARITY_ORDER } from "@/lib/gameData";

function CardEntry({ cardDef, owned }) {
  const rarity = RARITY_CONFIG[cardDef.rarity] || RARITY_CONFIG.common;
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-xl overflow-hidden border-2 ${owned ? rarity.borderColor : "border-border/30"} group`}
    >
      <div className="relative h-36 overflow-hidden">
        {!owned || imgErr ? (
          <div className={`w-full h-full flex items-center justify-center ${owned ? "bg-secondary" : "bg-secondary/30"}`}>
            {owned ? (
              <span className="text-3xl font-display font-black opacity-20 text-white">?</span>
            ) : (
              <Lock className="w-8 h-8 text-muted-foreground/30" />
            )}
          </div>
        ) : (
          <img
            src={cardDef.image_url}
            alt={cardDef.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgErr(true)}
          />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${owned ? "from-black/80 via-transparent" : "from-black/95 via-black/60 to-black/30"}`} />

        {owned && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500/90 flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        )}

        <div className={`absolute top-1.5 left-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold border ${owned ? `${rarity.bgColor} ${rarity.color} ${rarity.borderColor}` : "bg-border/20 text-muted-foreground/50 border-border/20"}`}>
          {rarity.label}
        </div>

        {cardDef.variant && owned && (
          <div className="absolute bottom-6 left-1.5 bg-yellow-500/70 rounded-full px-1.5 py-0.5 text-[7px] font-bold text-black">
            {cardDef.variant === "awakened" ? "★ ÉVL" : "◈ BASE"}
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 px-2 pb-1.5">
          <p className={`font-heading font-bold text-[9px] truncate ${owned ? "text-white" : "text-muted-foreground/40"}`}>
            {owned ? cardDef.name : "???"}
          </p>
          <p className={`text-[7px] truncate ${owned ? "text-white/60" : "text-muted-foreground/30"}`}>
            {owned ? cardDef.anime : "Série inconnue"}
          </p>
        </div>
      </div>

      {owned && (
        <div className="px-2 py-1.5 flex items-center justify-between">
          <span className={`text-[8px] font-bold ${rarity.color}`}>{cardDef.rarity === "secret" ? "✦ Secrète" : rarity.label}</span>
          <span className="text-[8px] text-muted-foreground font-mono">{cardDef.basePower} PWR</span>
        </div>
      )}
    </motion.div>
  );
}

export default function Encyclopedia() {
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [animeFilter, setAnimeFilter] = useState("all");
  const [ownedFilter, setOwnedFilter] = useState("all"); // all | owned | missing

  const { data: profiles = [] } = useQuery({
    queryKey: ["profile"],
    queryFn: () => appClient.entities.PlayerProfile.list(),
  });
  const { data: myCards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: () => appClient.entities.Card.list("-created_date", 500),
  });
  const { data: catalogCards = CARD_POOL } = useQuery({
    queryKey: ["card_definitions"],
    queryFn: () => appClient.entities.CardDefinition.list("anime"),
  });
  const { data: imageOverrides = [] } = useQuery({
    queryKey: ["cardImageOverrides"],
    queryFn: () => appClient.entities.CardImageOverride.list(),
  });
  const visibleCatalog = useMemo(() => catalogCards.map(card => {
    const override = imageOverrides.find(item => item.card_id === card.id);
    return override ? { ...card, image_url: override.image_url } : card;
  }), [catalogCards, imageOverrides]);

  const profile = profiles[0];

  // Set of card IDs owned by the player (by card name+anime+variant combo)
  const ownedSet = useMemo(() => {
    const s = new Set();
    myCards.forEach(c => s.add(`${c.name}|${c.anime}|${c.rarity}|${c.variant || ""}`));
    return s;
  }, [myCards]);

  const animes = useMemo(() => [...new Set(visibleCatalog.map(c => c.anime))], [visibleCatalog]);

  const filtered = useMemo(() => {
    return visibleCatalog
      .filter(c => {
        const key = `${c.name}|${c.anime}|${c.rarity}|${c.variant || ""}`;
        const owned = ownedSet.has(key);
        if (ownedFilter === "owned" && !owned) return false;
        if (ownedFilter === "missing" && owned) return false;
        if (rarityFilter !== "all" && c.rarity !== rarityFilter) return false;
        if (animeFilter !== "all" && c.anime !== animeFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!c.name.toLowerCase().includes(q) && !c.anime.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0));
  }, [search, rarityFilter, animeFilter, ownedFilter, ownedSet, visibleCatalog]);

  const totalOwned = useMemo(() =>
    CARD_POOL.filter(c => ownedSet.has(`${c.name}|${c.anime}|${c.rarity}|${c.variant || ""}`)).length
  , [ownedSet]);

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
      <Navbar />
      <CurrencyBar profile={profile} cards={myCards} />

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-accent" />Encyclopédie
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="text-accent font-bold">{totalOwned}</span> / {CARD_POOL.length} cartes découvertes
            </p>
          </div>
          {/* Completion badge */}
          <div className="text-right">
            <div className="text-2xl font-display font-black text-accent">
              {Math.round((totalOwned / CARD_POOL.length) * 100)}%
            </div>
            <div className="text-[10px] text-muted-foreground">complété</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5 h-2.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(totalOwned / CARD_POOL.length) * 100}%` }}
            transition={{ duration: 1, type: "spring" }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
          </div>
          <Select value={animeFilter} onValueChange={setAnimeFilter}>
            <SelectTrigger className="w-36 bg-secondary/50">
              <SelectValue placeholder="Anime" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les animes</SelectItem>
              {animes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={rarityFilter} onValueChange={setRarityFilter}>
            <SelectTrigger className="w-32 bg-secondary/50">
              <Filter className="w-3.5 h-3.5 mr-1.5" /><SelectValue placeholder="Rareté" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {Object.entries(RARITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            {[
              { id: "all", label: "Tout" },
              { id: "owned", label: "✓ Possédé" },
              { id: "missing", label: "🔒 Manquant" },
            ].map(o => (
              <button key={o.id} onClick={() => setOwnedFilter(o.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${ownedFilter === o.id ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {filtered.map(cardDef => {
            const key = `${cardDef.name}|${cardDef.anime}|${cardDef.rarity}|${cardDef.variant || ""}`;
            return (
              <CardEntry key={cardDef.id} cardDef={cardDef} owned={ownedSet.has(key)} />
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">Aucune carte trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}
