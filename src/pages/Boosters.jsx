import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Coins, Gem, Sparkles, AlertCircle, Lock, Eye, Gift, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import ImmersiveCardReveal from "@/components/game/ImmersiveCardReveal";
import BoosterPreviewModal from "@/components/boosters/BoosterPreviewModal";
import {
  BOOSTER_TYPES, getLevelFromXp
} from "@/lib/gameData";

const cleanBoosterDescription = (description = "") => description
  .replace(/\s*[·•-]\s*(Légendaire|Secrète|Manga God)\s+garantie.*$/iu, "")
  .replace(/cartes rares garanties/giu, "cartes rares");

function BoosterCard({ booster, onOpen, onPreview, canAfford, isOpening, isLocked, playerLevel, price, allCards = [] }) {
  const cardCount = allCards.filter(c => booster.is_custom ? c.collection_id === booster.id : (booster.is_premium ? true : c.anime === booster.anime)).length;
  const isUnavailable = booster.availability && booster.availability !== "available";

  return (
    <motion.div
      whileHover={!isLocked && !isUnavailable ? { scale: 1.03, y: -4 } : {}}
      whileTap={!isLocked && !isUnavailable ? { scale: 0.97 } : {}}
      className={`relative rounded-2xl overflow-hidden border-2 ${booster.accentColor} ${booster.bgCard} ${isLocked || isUnavailable ? "opacity-70" : "cursor-pointer group"}`}
    >
      {/* Lock overlay */}
      {isUnavailable ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px] gap-2 text-center px-5">
          <Clock3 className="w-8 h-8 text-orange-300" />
          <p className="text-sm text-white font-bold">{booster.availability === "upcoming" ? "Bientôt disponible" : "Événement terminé"}</p>
          <p className="text-[10px] text-white/65">{booster.availabilityDetail}</p>
        </div>
      ) : isLocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm gap-2">
          <Lock className="w-8 h-8 text-muted-foreground" />
          <p className="text-xs text-muted-foreground font-semibold">Niveau {booster.unlockLevel} requis</p>
          <p className="text-[10px] text-muted-foreground">Niveau actuel : {playerLevel}</p>
        </div>
      )}

      {/* Illustration abstraite du paquet : aucune image de carte avant le tirage. */}
      <div className={`relative h-40 bg-gradient-to-br ${booster.color} overflow-hidden`}>
        {/* Shimmer overlay for premium boosters */}
        {booster.anime === null && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50 animate-[shimmer_3s_infinite]" style={{ backgroundSize: '200% 100%' }} />
        )}
        
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-black/10 shadow-[0_0_45px_rgba(255,255,255,.2)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid h-20 w-20 place-items-center rounded-2xl border border-white/30 bg-black/20 shadow-2xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-105 group-hover:rotate-2">
            <Package className="h-11 w-11 text-white drop-shadow-[0_0_12px_rgba(255,255,255,.65)]" />
          </div>
        </div>
        <div className={`absolute inset-0 bg-gradient-to-t ${booster.color} opacity-60`} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/90" />

        <motion.div 
          className="absolute top-3 left-3 flex items-center gap-2"
          whileHover={{ scale: 1.1 }}
        >
          <span className="text-2xl drop-shadow-lg">{booster.icon}</span>
        </motion.div>
        <div className="absolute top-3 right-3">
          <motion.div 
            className="bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-bold text-white border border-white/10"
            whileHover={{ scale: 1.05 }}
          >
            {booster.cards} carte{booster.cards > 1 ? "s" : ""}
          </motion.div>
        </div>
        {booster.is_limited && !booster.is_free && (
          <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-orange-500/90 px-2 py-1.5 text-center text-[10px] font-bold text-white shadow-lg">
            ÉDITION LIMITÉE{booster.collector_only ? " · CARTES COLLECTOR" : ""}
            {booster.ends_at ? ` · jusqu'au ${new Date(booster.ends_at).toLocaleDateString()}` : ""}
          </div>
        )}
        {booster.is_free && (
          <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-emerald-500/90 px-2 py-1.5 text-center text-[10px] font-bold text-white shadow-lg">
            🎁 CADEAU SPÉCIAL · {booster.max_claims_per_player || 1} PAR JOUEUR
            {booster.ends_at ? ` · jusqu'au ${new Date(booster.ends_at).toLocaleDateString()}` : ""}
          </div>
        )}

      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-heading font-bold text-sm mb-0.5">{booster.name}</h3>
        <p className="text-xs text-muted-foreground mb-4">{cleanBoosterDescription(booster.description)}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {booster.is_free ? (
              <><Gift className="w-4 h-4 text-emerald-400" /><span className="font-bold text-sm text-emerald-400">OFFERT</span></>
            ) : booster.currency === "coins" ? (
              <Coins className="w-4 h-4 text-yellow-400" />
            ) : (
              <Gem className="w-4 h-4 text-cyan-400" />
            )}
            {!booster.is_free && <span className="font-bold text-base">{price}</span>}
            {!booster.is_free && booster.currency === "coins" && price !== booster.basePrice && (
              <span className="text-[10px] text-muted-foreground line-through">{booster.basePrice}</span>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => onOpen(booster)}
            disabled={!canAfford || isOpening || isLocked || isUnavailable}
            className={`font-heading text-xs px-4 bg-gradient-to-r ${booster.color} hover:opacity-90 border-0 text-white`}
          >
            {isOpening ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isUnavailable ? (
              <><Clock3 className="w-3.5 h-3.5 mr-1.5" />{booster.availability === "upcoming" ? "Bientôt" : "Terminé"}</>
            ) : isLocked ? (
              <><Lock className="w-3.5 h-3.5 mr-1.5" />Verrouillé</>
            ) : booster.is_free && !canAfford ? (
              <><Lock className="w-3.5 h-3.5 mr-1.5" />Déjà récupéré</>
            ) : !canAfford ? (
              <><Lock className="w-3.5 h-3.5 mr-1.5" />Bloqué</>
            ) : (
              booster.is_free
                ? <><Gift className="w-3.5 h-3.5 mr-1.5" />Recevoir</>
                : <><Package className="w-3.5 h-3.5 mr-1.5" />Ouvrir</>
            )}
          </Button>
        </div>

        {!canAfford && !isLocked && !booster.is_free && (
          <p className="text-[10px] text-destructive flex items-center gap-1 mt-2">
            <AlertCircle className="w-3 h-3" />
            {booster.currency === "coins" ? "Pièces insuffisantes" : "Gemmes insuffisantes"}
          </p>
        )}

        {/* Preview button */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground">
            {cardCount} cartes disponibles
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={(e) => { e.stopPropagation(); onPreview(booster); }}
          >
            <Eye className="w-3 h-3 mr-1" />
            Aperçu
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Boosters() {
  const [revealCards, setRevealCards] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const [openingBoosterId, setOpeningBoosterId] = useState(null);
  const [currentBooster, setCurrentBooster] = useState(null);
  const [previewBooster, setPreviewBooster] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profiles = [] } = useQuery({
    queryKey: ["profile"],
    queryFn: () => appClient.entities.PlayerProfile.list(),
  });
  const { data: existingCards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: () => appClient.entities.Card.list("-created_date", 1000),
  });

  const { data: talents = [] } = useQuery({
    queryKey: ["talents"],
    queryFn: () => appClient.entities.PlayerTalent.list(),
  });

  const { data: imageOverrides = [] } = useQuery({
    queryKey: ["cardImageOverrides"],
    queryFn: () => appClient.entities.CardImageOverride.list(),
  });

  const { data: collections = [] } = useQuery({
    queryKey: ["anime_collections"],
    queryFn: () => appClient.entities.AnimeCollection.list("-created_date"),
    refetchInterval: 30000,
  });
  const { data: dropEvents = [] } = useQuery({
    queryKey: ["drop_events"],
    queryFn: () => appClient.entities.DropEvent.list("-created_date"),
    refetchInterval: 30000,
  });

  const { data: allCards = [] } = useQuery({
    queryKey: ["all_cards_for_preview"],
    queryFn: () => appClient.entities.CardDefinition.list("anime"),
  });

  const profile = profiles[0];
  const activeDropEvent = dropEvents.find(event => event.is_active !== false && new Date(event.start_date) <= new Date() && new Date(event.end_date) > new Date());
  const eventRarityLabel = {
    legendary_boost: "Légendaire",
    secret_boost: "Secrète",
    god_boost: "Manga God",
  }[activeDropEvent?.event_type];
  const { level: playerLevel } = profile ? getLevelFromXp(profile.xp || 0) : { level: 1 };
  const boostersCount = profile?.boosters_count || {};
  const standardBoostersOpened = BOOSTER_TYPES
    .filter((booster) => booster.currency === "coins")
    .reduce((sum, booster) => sum + Number(boostersCount[booster.id] || 0), 0);
  const unlockedTalentIds = new Set(talents?.filter(t => t.is_unlocked).map(t => t.talent_id) || []);

  // Convert collections to booster format
  const boostersFromCollections = collections
    .filter(c => c.is_active !== false)
    .map(c => {
      // Extract color from gradient (e.g., "from-orange-500 to-orange-900" -> "orange")
      const colorMatch = c.color_gradient?.match(/from-(\w+)-\d+/);
      const colorBase = colorMatch ? colorMatch[1] : 'orange';
      const now = Date.now();
      const startsAt = c.starts_at ? new Date(c.starts_at).getTime() : null;
      const endsAt = c.ends_at ? new Date(c.ends_at).getTime() : null;
      const availability = startsAt && startsAt > now ? "upcoming" : endsAt && endsAt <= now ? "expired" : "available";
      const availabilityDetail = availability === "upcoming"
        ? `Ouverture le ${new Date(c.starts_at).toLocaleString("fr-FR")}`
        : availability === "expired"
          ? `Terminé le ${new Date(c.ends_at).toLocaleString("fr-FR")}`
          : null;
      
      return {
        id: c.id,
        name: c.name,
        anime: c.is_premium ? null : (c.anime || c.name),
        cards: Number(c.cards_count || 10),
        basePrice: c.base_price,
        currency: c.currency,
        icon: c.icon || '📦',
        guaranteed: c.guaranteed_rarity,
        description: c.description || `${c.name}`,
        color: c.color_gradient || 'from-orange-500 to-orange-900',
        accentColor: `border-${colorBase}-500/40`,
        bgCard: `bg-${colorBase}-500/5`,
        unlockLevel: c.unlock_level || 1,
        is_premium: c.is_premium || false,
        is_custom: true,
        is_limited: c.is_limited || false,
        collector_only: c.collector_only || false,
        is_free: c.is_free || false,
        max_claims_per_player: Number(c.max_claims_per_player || 1),
        ends_at: c.ends_at || null,
        availability,
        availabilityDetail,
      };
    });

  // Les boosters historiques restent toujours identiques et dans le même ordre.
  // Les collections créées depuis l'admin sont affichées ensuite, sans les remplacer.
  const displaySerie = BOOSTER_TYPES.filter(b => b.anime !== null);
  const displayPremium = BOOSTER_TYPES.filter(b => b.anime === null);
  const customBoosters = boostersFromCollections;

  const initProfile = useMutation({
    mutationFn: () => appClient.functions.invoke("ensurePlayerProfile"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const getBoosterCurrentPrice = (booster) => {
    if (booster.is_free) return 0;
    const openedCount = standardBoostersOpened;
    const beginnerDiscount = !booster.is_custom && booster.currency === "coins"
      ? (openedCount < 5 ? 0.60 : openedCount < 15 ? 0.30 : 0)
      : 0;
    const talentDiscount = unlockedTalentIds.has('economy_2') ? 0.05 : 0;
    const discount = Math.min(0.70, beginnerDiscount + talentDiscount);
    const price = booster.basePrice;
    return Math.round(price * (1 - discount));
  };

  const canAffordBooster = (booster) => {
    if (!profile) return false;
    if (booster.is_free) return Number(boostersCount[booster.id] || 0) < Number(booster.max_claims_per_player || 1);
    const price = getBoosterCurrentPrice(booster);
    if (booster.currency === "coins") return (profile.coins || 0) >= price;
    return (profile.gems || 0) >= price;
  };

  const isBoosterLocked = (booster) => playerLevel < booster.unlockLevel;

  const handleOpenBooster = async (booster) => {
    if (!profile) {
      await initProfile.mutateAsync();
      return;
    }
    if (!canAffordBooster(booster) || isBoosterLocked(booster)) return;

    setIsOpening(true);
    setOpeningBoosterId(booster.id);
    setCurrentBooster(booster);

    // Le tirage et les mises a jour sont atomiques cote serveur : le navigateur
    // ne peut plus modifier les taux, le solde ou les cartes obtenues.
    try {
        const response = await appClient.functions.invoke("openBooster", { booster_id: booster.id });
        const result = response.data;
        if (result.event) {
          const notificationKey = `drop_event_notified_${result.event.id}`;
          if (!localStorage.getItem(notificationKey)) {
            toast({
              title: `Événement actif : ${result.event.name}`,
              description: `Le taux ${result.event.rarity} est multiplié par ${result.event.multiplier}.`,
              duration: 5000,
            });
            localStorage.setItem(notificationKey, new Date().toISOString());
          }
        }
        if (result.frame_drop) {
          toast({ title: "🎁 CADRE D’ÉVÉNEMENT OBTENU !", description: `${result.frame_drop.name} rejoint ta collection.`, duration: 6000 });
        }
        setCurrentBooster(booster);
        setRevealCards(result.cards);
        if (result.profile) {
          queryClient.setQueryData(["profile"], [result.profile]);
        }
        // L'animation démarre dès que le tirage est confirmé. Les données de
        // fond se rafraîchissent ensuite sans retenir le joueur sur le bouton.
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: ["profile"] }),
          queryClient.invalidateQueries({ queryKey: ["cards"] }),
          queryClient.invalidateQueries({ queryKey: ["quests"] }),
          queryClient.invalidateQueries({ queryKey: ["myFrames"] }),
        ]);
    } catch (error) {
      toast({ title: "Ouverture impossible", description: error.message, variant: "destructive" });
    } finally {
      setIsOpening(false);
      setOpeningBoosterId(null);
    }
  };

  const handleCardRevealed = (card) => {
    if (card.rarity === "normale") return;
    if (card.isDuplicate) {
      const levelsGained = Number(card.levelsGained || 0);
      toast({
        title: levelsGained > 0 ? "Carte améliorée !" : "Duplicata empilé",
        description: levelsGained > 0
          ? `${card.name} passe au niveau ${card.level}.`
          : `${card.name} est ajouté à sa pile · ×${card.stackCount || 2} exemplaires.`,
        duration: 4000,
      });
      return;
    }
    const labels = {
      legendaire: "CARTE LÉGENDAIRE !",
      "secrète": "CARTE SECRÈTE !",
      manga_god: "MANGA GOD !",
    };
    toast({
      title: labels[card.rarity] || "Nouvelle carte !",
      description: `${card.name} rejoint ta collection.`,
      duration: card.rarity === "manga_god" || card.rarity === "secrète" ? 6500 : 4500,
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4 px-4">
          <Sparkles className="w-14 h-14 text-primary animate-pulse" />
          <h2 className="font-display text-2xl font-bold text-center">Bienvenue, Collectionneur !</h2>
          <p className="text-muted-foreground text-sm text-center max-w-xs">Commence ton aventure – reçois 500 pièces et 10 gemmes pour tes premiers boosters !</p>
          <Button
            onClick={() => initProfile.mutate()}
            disabled={initProfile.isPending}
            className="bg-gradient-to-r from-primary to-accent font-heading text-base px-8 py-3"
          >
            {initProfile.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Commencer à jouer !"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
      <Navbar />
      <CurrencyBar profile={profile} cards={existingCards} />

      <div className="max-w-5xl mx-auto px-4 py-4">
        <AnimatePresence>
          {isOpening && !revealCards && (
            <motion.div role="status" aria-live="polite" className="fixed inset-0 z-[109] grid place-items-center overflow-hidden bg-black/94 px-4 backdrop-blur-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center">
                <motion.div animate={{ scale: [1, 1.06, 1], rotate: [-1, 1, -1] }} transition={{ duration: 0.55, repeat: Infinity }} className={`mx-auto grid h-40 w-28 place-items-center rounded-2xl border-2 border-white/25 bg-gradient-to-br ${currentBooster?.color || "from-primary to-accent"} shadow-2xl shadow-primary/30`}>
                  <Package className="h-14 w-14 text-white drop-shadow-[0_0_14px_rgba(255,255,255,.7)]" />
                </motion.div>
                <p className="mt-5 font-heading text-sm font-bold text-white">Ouverture en cours…</p>
                <p className="mt-1 text-xs text-white/50">Tirage sécurisé et sauvegarde</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Modal d'aperçu */}
        <AnimatePresence>
          {previewBooster && (
            <BoosterPreviewModal
              booster={previewBooster}
              onClose={() => setPreviewBooster(null)}
              allCards={allCards}
              imageOverrides={imageOverrides}
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {revealCards ? (
            <motion.div key="reveal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8">
              <ImmersiveCardReveal 
                cards={revealCards} 
                booster={currentBooster} 
                onCardRevealed={handleCardRevealed}
                onComplete={() => setRevealCards(null)} 
                imageOverrides={imageOverrides}
                onOpenAnother={() => {
                  setRevealCards(null);
                  setTimeout(() => handleOpenBooster(currentBooster), 100);
                }}
              />
            </motion.div>
          ) : (
            <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {activeDropEvent && (
                <div className="mb-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 to-accent/10 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5 animate-pulse" />
                    <div className="flex-1">
                      <p className="font-heading font-bold text-primary">{activeDropEvent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Taux {eventRarityLabel} multiplié par {activeDropEvent.multiplier} jusqu'à {new Date(activeDropEvent.end_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Taux de base par carte : Légendaire 5 % · Secrète 0,5 % · Manga God 0,1 %.</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-4 px-4 py-3 rounded-xl bg-secondary/30 border border-border/60 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Probabilités officielles par carte :</span>{" "}
                Normale 94,4 % · Légendaire 5 % · Secrète 0,5 % · Manga God 0,1 %. Le pity augmente progressivement la chance Légendaire.
              </div>
              {standardBoostersOpened < 15 && (
                <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm">
                  <span className="font-semibold text-green-300">Bonus débutant actif :</span>{" "}
                  <span className="text-muted-foreground">
                    {standardBoostersOpened < 5
                      ? "−60 % sur tes 5 premiers boosters standards."
                      : "−30 % jusqu'à ton 15e booster standard."}
                  </span>
                </div>
              )}
              {/* Info pity */}
              {(profile.pity_counter || 0) > 20 && (
                <div className="mb-4 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2 text-sm">
                  <span className="text-yellow-400">⚡</span>
                  <span className="text-yellow-300 font-medium">Pity actif !</span>
                  <span className="text-muted-foreground">{profile.pity_counter} pulls sans Légendaire – les chances augmentent</span>
                </div>
              )}

              {/* Boosters par série */}
              <div className="mb-8">
                <h1 className="font-display text-2xl font-bold tracking-wide mb-1">Boosters par Série</h1>
                <p className="text-sm text-muted-foreground mb-5">3 cartes par booster</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displaySerie.map((booster) => (
                    <BoosterCard
                      key={booster.id}
                      booster={booster}
                      onOpen={handleOpenBooster}
                      onPreview={setPreviewBooster}
                      canAfford={canAffordBooster(booster)}
                      isOpening={isOpening && openingBoosterId === booster.id}
                      isLocked={isBoosterLocked(booster)}
                      playerLevel={playerLevel}
                      price={getBoosterCurrentPrice(booster)}
                      imageOverrides={imageOverrides}
                      allCards={allCards}
                    />
                  ))}
                </div>
              </div>

              {/* Boosters Premium */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gem className="w-4 h-4 text-cyan-400" />
                  <h2 className="font-display text-lg font-bold tracking-wide">Boosters Premium</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5">Utilise tes gemmes pour tenter d'obtenir des cartes rares, toutes séries</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayPremium.map((booster) => (
                    <BoosterCard
                      key={booster.id}
                      booster={booster}
                      onOpen={handleOpenBooster}
                      onPreview={setPreviewBooster}
                      canAfford={canAffordBooster(booster)}
                      isOpening={isOpening && openingBoosterId === booster.id}
                      isLocked={isBoosterLocked(booster)}
                      playerLevel={playerLevel}
                      price={getBoosterCurrentPrice(booster)}
                      imageOverrides={imageOverrides}
                      allCards={allCards}
                    />
                  ))}
                </div>
              </div>

              {customBoosters.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h2 className="font-display text-lg font-bold tracking-wide">Boosters personnalisés</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">Créations de l’administration, événements à venir et éditions archivées</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customBoosters.map((booster) => (
                      <BoosterCard
                        key={booster.id}
                        booster={booster}
                        onOpen={handleOpenBooster}
                        onPreview={setPreviewBooster}
                        canAfford={canAffordBooster(booster)}
                        isOpening={isOpening && openingBoosterId === booster.id}
                        isLocked={isBoosterLocked(booster)}
                        playerLevel={playerLevel}
                        price={getBoosterCurrentPrice(booster)}
                        imageOverrides={imageOverrides}
                        allCards={allCards}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
