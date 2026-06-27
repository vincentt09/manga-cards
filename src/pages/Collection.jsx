import React, { useEffect, useState, useMemo } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Star, Grid, List, Layers, Filter, SlidersHorizontal, TrendingUp, RotateCcw, Frame as FrameIcon, Sparkles, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import CardComponent from "@/components/game/CardComponent";
import CardDetail from "@/components/game/CardDetail";
import CardSkeleton from "@/components/ui/CardSkeleton";
import usePassiveIncome from "@/hooks/usePassiveIncome";
import RewardRevealOverlay from "@/components/game/RewardRevealOverlay";

export default function Collection() {
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [animeFilter, setAnimeFilter] = useState("all");
  const [sortBy, setSortBy] = useState(() => localStorage.getItem("collection_sort") || "collection_rarity");
  const [selectedCard, setSelectedCard] = useState(null);
  const [giftReward, setGiftReward] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("collection_view") || "grid");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading: isLoadingCards } = useQuery({
    queryKey: ["cards"],
    queryFn: () => appClient.entities.Card.list("-created_date", 1000),
  });

  const { data: collections = [] } = useQuery({
    queryKey: ["anime_collections"],
    queryFn: () => appClient.entities.AnimeCollection.list("name"),
  });

  const { data: imageOverrides = [] } = useQuery({
    queryKey: ["cardImageOverrides"],
    queryFn: () => appClient.entities.CardImageOverride.list(),
  });

  const { data: frames = [] } = useQuery({
    queryKey: ["frames"],
    queryFn: () => appClient.entities.CardFrame.list(),
  });
  const { data: playerFrames = [] } = useQuery({
    queryKey: ["myFrames"],
    queryFn: () => appClient.entities.PlayerFrame.list(),
  });
  const { data: giftInboxResponse } = useQuery({
    queryKey: ["giftInbox"],
    queryFn: () => appClient.functions.invoke("getMyGiftInbox"),
    refetchInterval: 30000,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profile"],
    queryFn: () => appClient.entities.PlayerProfile.list(),
  });
  const profile = profiles[0];
  const giftInbox = giftInboxResponse?.data?.gifts || [];
  const ownedFrames = useMemo(() => playerFrames.filter(owned => owned.is_unlocked).map(owned => ({ ...owned, definition: frames.find(frame => frame.id === owned.frame_id) })).filter(owned => owned.definition), [playerFrames, frames]);

  useEffect(() => localStorage.setItem("collection_sort", sortBy), [sortBy]);
  useEffect(() => localStorage.setItem("collection_view", viewMode), [viewMode]);

  const hasActiveFilters = Boolean(search || rarityFilter !== "all" || animeFilter !== "all" || showFavoritesOnly);
  const resetFilters = () => {
    setSearch("");
    setRarityFilter("all");
    setAnimeFilter("all");
    setShowFavoritesOnly(false);
  };

  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }) => appClient.entities.Card.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards"] }),
  });
  const claimGiftMutation = useMutation({
    mutationFn: (giftId) => appClient.functions.invoke("claimPlayerGift", { gift_id: giftId }),
    onSuccess: async (response) => {
      setGiftReward(response.data?.claimed || null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["giftInbox"] }),
        queryClient.invalidateQueries({ queryKey: ["cards"] }),
        queryClient.invalidateQueries({ queryKey: ["myFrames"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
    },
  });

  const animes = useMemo(() => {
    const set = new Set(cards.map((c) => c.anime).filter(Boolean));
    return Array.from(set).sort();
  }, [cards]);

  const filtered = useMemo(() => {
    let result = [...cards];
    if (search) result = result.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.anime?.toLowerCase().includes(search.toLowerCase()));
    if (rarityFilter !== "all") result = result.filter((c) => c.rarity === rarityFilter);
    if (animeFilter !== "all") result = result.filter((c) => c.anime === animeFilter);
    if (showFavoritesOnly) result = result.filter((c) => c.is_favorite);
    
    result.sort((a, b) => {
      const rarityOrder = { manga_god: 4, "secrète": 3, legendaire: 2, normale: 1 };
      if (sortBy === "collection_rarity") {
        const collectionA = collections.find((collection) => collection.id === a.collection_id)?.name || a.anime || "Autres";
        const collectionB = collections.find((collection) => collection.id === b.collection_id)?.name || b.anime || "Autres";
        return collectionA.localeCompare(collectionB, "fr")
          || (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
          || (a.name || "").localeCompare(b.name || "", "fr");
      }
      if (sortBy === "power") return (b.power || 0) - (a.power || 0);
      if (sortBy === "level") return (b.level || 1) - (a.level || 1);
      if (sortBy === "rarity") {
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
          || (a.anime || "").localeCompare(b.anime || "", "fr")
          || (a.name || "").localeCompare(b.name || "", "fr");
      }
      return (b.power || 0) - (a.power || 0);
    });
    return result;
  }, [cards, collections, search, rarityFilter, animeFilter, sortBy, showFavoritesOnly]);

  usePassiveIncome(profile, cards);

  const handleToggleFavorite = (card) => {
    updateCardMutation.mutate({ id: card.id, data: { is_favorite: !card.is_favorite } });
    setSelectedCard((prev) => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);
  };

  const stats = useMemo(() => {
    return {
      total: cards.length,
      copies: cards.reduce((sum, card) => sum + Math.max(1, Number(card.duplicates || 1)), 0),
      manga_god: cards.filter((c) => c.rarity === "manga_god").length,
      secrète: cards.filter((c) => c.rarity === "secrète").length,
      legendaire: cards.filter((c) => c.rarity === "legendaire").length,
      normale: cards.filter((c) => c.rarity === "normale").length,
      totalPower: cards.reduce((sum, c) => sum + (c.power || 0), 0),
    };
  }, [cards]);

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14 bg-gradient-to-b from-background via-background to-secondary/10">
      <Navbar />
      <CurrencyBar profile={profile} cards={cards} />

      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* En-tête avec statistiques */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 sm:mb-8 bg-gradient-to-br from-card via-card to-secondary/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border/50 shadow-2xl"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Ma Collection
              </h1>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <span className="font-semibold text-foreground">{stats.total}</span> cartes uniques · {stats.copies} exemplaires empilés
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="px-4 py-2 border-cyan-500/30 bg-cyan-500/10">
                <TrendingUp className="w-4 h-4 mr-2 text-cyan-400" />
                <span className="text-sm font-bold text-cyan-400">Total: {stats.totalPower} PWR</span>
              </Badge>
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={showFavoritesOnly ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/30" : ""}
              >
                <Star className={`w-4 h-4 mr-2 ${showFavoritesOnly ? "fill-yellow-400" : ""}`} />
                Favoris ({cards.filter(c => c.is_favorite).length})
              </Button>
            </div>
          </div>
          
          {/* Barres de progression par rareté */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {[
              { key: "manga_god", label: "Manga God", color: "from-cyan-500 to-blue-500", count: stats.manga_god, textColor: "text-cyan-400" },
              { key: "secrète", label: "Secrète", color: "from-rose-500 to-pink-500", count: stats.secrète, textColor: "text-rose-400" },
              { key: "legendaire", label: "Légendaire", color: "from-yellow-500 to-amber-500", count: stats.legendaire, textColor: "text-yellow-400" },
              { key: "normale", label: "Normale", color: "from-slate-500 to-gray-500", count: stats.normale, textColor: "text-slate-400" },
            ].map((rarity) => (
              <motion.div 
                key={rarity.key}
                whileHover={{ scale: 1.03 }}
                className="bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-xl p-3 sm:p-4 border border-border/40 shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{rarity.label}</span>
                  <span className={`text-lg font-bold ${rarity.textColor}`}>{rarity.count}</span>
                </div>
                <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total > 0 ? (rarity.count / stats.total) * 100 : 0}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full bg-gradient-to-r ${rarity.color} shadow-lg`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {giftInbox.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 overflow-hidden rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-500/10 via-card to-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-display font-bold"><Gift className="h-5 w-5 text-yellow-400" />Coffre cadeaux</h2>
                <p className="mt-1 text-xs text-muted-foreground">Les cartes et cadres offerts arrivent ici avant de rejoindre ton inventaire.</p>
              </div>
              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">{giftInbox.length} cadeau{giftInbox.length > 1 ? "x" : ""}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {giftInbox.map((gift) => {
                const item = gift.kind === "card" ? gift.card : gift.frame;
                const imageUrl = item?.image_url;
                const label = gift.kind === "card" ? `${item?.anime || "Carte"} · ${item?.rarity || ""}` : `${item?.rarity || "Cadre"} · Cadre`;
                return (
                  <article key={gift.id} className="flex gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                    <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <Gift className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-yellow-300" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold">{gift.title || item?.name || "Cadeau"}</p>
                      <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{label}{gift.quantity > 1 ? ` · ×${gift.quantity}` : ""}</p>
                      {gift.message && <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/80">{gift.message}</p>}
                      <Button size="sm" className="mt-2 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 text-xs text-black hover:from-yellow-400 hover:to-amber-400" disabled={claimGiftMutation.isPending} onClick={() => claimGiftMutation.mutate(gift.id)}>
                        Réclamer
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </motion.section>
        )}

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-card to-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-display font-bold"><FrameIcon className="h-5 w-5 text-cyan-400" />Mes cadres</h2><p className="mt-1 text-xs text-muted-foreground">Les cadres débloqués font partie de ta collection et peuvent être appliqués à tes cartes.</p></div><span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">{ownedFrames.length}</span></div>
          {ownedFrames.length ? <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">{ownedFrames.map(owned => <article key={owned.id} className="flex w-44 shrink-0 items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-2.5"><div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded bg-gradient-to-br from-slate-800 to-black"><Sparkles className="absolute left-1 top-1 h-3 w-3 text-cyan-300" />{owned.definition.image_url && <img src={owned.definition.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-fill" />}</div><div className="min-w-0"><p className="line-clamp-2 text-xs font-bold">{owned.definition.name}</p><p className="mt-1 text-[10px] capitalize text-cyan-300">{owned.definition.rarity || "cadre"}</p></div></article>)}</div> : <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">Aucun cadre débloqué pour le moment.</div>}
        </motion.section>

        {/* Contrôles de filtres et tri */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une carte ou un anime..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary/30 border-border/50 h-11 focus:bg-secondary/50 transition-colors"
              />
            </div>
            
            {/* Filtres */}
            <div className="flex flex-wrap gap-3">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-11 px-3 text-xs" onClick={resetFilters}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />Réinitialiser
                </Button>
              )}
              <Select value={rarityFilter} onValueChange={setRarityFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-secondary/30 border-border/50 h-11">
                  <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Rareté" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes raretés</SelectItem>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="legendaire">Légendaire</SelectItem>
                  <SelectItem value="secrète">Secrète</SelectItem>
                  <SelectItem value="manga_god">Manga God</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={animeFilter} onValueChange={setAnimeFilter}>
                <SelectTrigger className="w-full sm:w-44 bg-secondary/30 border-border/50 h-11">
                  <SelectValue placeholder="Anime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les animes</SelectItem>
                  {animes.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40 bg-secondary/30 border-border/50 h-11">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Trier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collection_rarity">📚 Manga puis rareté</SelectItem>
                  <SelectItem value="power">⚡ Puissance</SelectItem>
                  <SelectItem value="level">⭐ Niveau</SelectItem>
                  <SelectItem value="rarity">💎 Rareté</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Toggle Grille/Liste */}
            <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-1 border border-border/50">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-9 px-3"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-9 px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Grille de cartes */}
        {isLoadingCards ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5 sm:gap-4">
            {Array.from({ length: 14 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 bg-card/30 rounded-2xl border border-border/50"
          >
            <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-lg text-muted-foreground font-medium">Aucune carte trouvée</p>
            <p className="text-sm text-muted-foreground/60 mt-2">Ouvre des boosters pour enrichir ta collection !</p>
          </motion.div>
        ) : (
          <motion.div
            className={viewMode === "grid" 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5 sm:gap-4"
              : "flex flex-col gap-3"
            }
            layout
          >
            <AnimatePresence>
              {filtered.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <CardComponent 
                    card={card} 
                    onClick={setSelectedCard} 
                    imageOverrides={imageOverrides}
                    appliedFrame={frames.find((frame) => frame.id === card.applied_frame_id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        
        {/* Résultat du filtrage */}
        {!isLoadingCards && filtered.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center text-xs text-muted-foreground"
          >
            {filtered.length} carte{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
            {sortBy === "collection_rarity" && <span className="ml-2 text-primary font-semibold">• Triées par manga et rareté</span>}
            {sortBy === "power" && <span className="ml-2 text-cyan-400 font-semibold">• Trié par puissance</span>}
          </motion.div>
        )}
      </div>

      {/* Modal de détails */}
      <AnimatePresence>
        {selectedCard && (
          <CardDetail
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onToggleFavorite={handleToggleFavorite}
            appliedFrame={frames.find((frame) => frame.id === selectedCard?.applied_frame_id)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {giftReward && <RewardRevealOverlay reward={giftReward} title="Coffre cadeaux" onClose={() => setGiftReward(null)} />}
      </AnimatePresence>
    </div>
  );
}
