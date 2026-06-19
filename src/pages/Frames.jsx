import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { motion } from "framer-motion";
import { Frame, Star, ShoppingBag, Trophy, Sparkles, X } from "lucide-react";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import FrameShowcase from "@/components/frames/FrameShowcase";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLevelFromXp } from "@/lib/gameData";

export default function Frames() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ["profile"],
    queryFn: () => appClient.entities.PlayerProfile.list(),
  });

  const { data: frames = [] } = useQuery({
    queryKey: ["frames"],
    queryFn: () => appClient.entities.CardFrame.list(),
  });

  const { data: myFrames = [] } = useQuery({
    queryKey: ["myFrames"],
    queryFn: () => appClient.entities.PlayerFrame.list(),
  });

  const { data: cards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: () => appClient.entities.Card.list(),
  });

  const profile = profiles[0];
  const unlockedFrameIds = new Set(myFrames.filter(f => f.is_unlocked).map(f => f.frame_id));
  const playerLevel = getLevelFromXp(profile?.xp || 0).level;
  const mangaGodCount = cards.filter((card) => card.rarity === "manga_god").length;
  const level100Count = cards.filter((card) => Number(card.level || 1) >= 100).length;
  const getEligibility = (frame) => {
    const requirements = frame.requirements || {};
    const checks = [
      { label: `Niveau ${requirements.min_level || 1}`, current: playerLevel, target: Number(requirements.min_level || 1) },
      { label: `${requirements.manga_god_cards || 0} Manga God différentes`, current: mangaGodCount, target: Number(requirements.manga_god_cards || 0) },
      { label: `${requirements.level_100_cards || 0} carte niveau 100`, current: level100Count, target: Number(requirements.level_100_cards || 0) },
      { label: `${Number(frame.price_coins || 0).toLocaleString("fr-FR")} pièces`, current: Number(profile?.coins || 0), target: Number(frame.price_coins || 0) },
      { label: `${Number(frame.price_gems || 0).toLocaleString("fr-FR")} gemmes`, current: Number(profile?.gems || 0), target: Number(frame.price_gems || 0) },
    ].filter((check) => check.target > 0);
    return { checks, eligible: checks.every((check) => check.current >= check.target) };
  };

  const applyFrameMutation = useMutation({
    mutationFn: async ({ frameId, cardId }) => {
      const response = await appClient.functions.invoke('applyCardFrame', { frame_id: frameId, card_id: cardId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFrames"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast({
        title: "✅ Cadre appliqué !",
        description: "Le cadre a été appliqué à votre carte.",
      });
      setShowPreview(false);
    },
    onError: (error) => {
      toast({
        title: "❌ Erreur",
        description: error.message || "Impossible d'appliquer le cadre",
        variant: "destructive",
      });
    },
  });

  const purchaseFrameMutation = useMutation({
    mutationFn: async ({ frameId }) => {
      const response = await appClient.functions.invoke('purchaseFrame', { frameId });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["myFrames"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "✅ Achat réussi !",
        description: data.message || "Le cadre a été ajouté à votre collection.",
      });
      setShowPreview(false);
    },
    onError: (error) => {
      toast({
        title: "❌ Erreur",
        description: error.message || "Impossible d'acheter le cadre",
        variant: "destructive",
      });
    },
  });

  const handleFrameClick = (frame) => {
    setSelectedFrame(frame);
    setShowPreview(true);
  };

  const [showCardSelector, setShowCardSelector] = useState(false);

  const handleApplyFrame = (frame) => {
    if (frame && unlockedFrameIds.has(frame.id)) {
      setSelectedFrame(frame);
      setShowCardSelector(true);
    }
  };

  const handlePurchaseFrame = (frame) => {
    purchaseFrameMutation.mutate({ frameId: frame.id });
  };

  // Group frames by source type
  const shopFrames = frames.filter(f => f.source_type === "shop");
  const boosterFrames = frames.filter(f => f.source_type === "booster");
  const questFrames = frames.filter(f => f.source_type === "quest");
  const achievementFrames = frames.filter(f => f.source_type === "achievement");
  const endgameFrames = frames.filter(f => f.source_type === "endgame");
  const giftFrames = frames.filter(f => f.source_type === "gift");
  const eventFrames = frames.filter(f => f.source_type === "event");

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
      <Navbar />
      {profile && <CurrencyBar profile={profile} cards={[]} />}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold tracking-wide flex items-center gap-3">
            <Frame className="w-8 h-8 text-primary" />
            Galerie des Cadres
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Collectionne des cadres exclusifs pour personnaliser tes cartes
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8 max-w-lg">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Frame className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Cadres possédés</span>
            </div>
            <p className="text-2xl font-bold text-primary">{unlockedFrameIds.size} / {frames.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Boutique</span>
            </div>
            <p className="text-2xl font-bold text-accent">{shopFrames.length}</p>
          </div>
        </div>

        {endgameFrames.length > 0 && (
          <section className="mb-10 rounded-3xl border border-yellow-400/30 bg-gradient-to-br from-yellow-500/10 via-card to-orange-950/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 className="font-display font-bold text-xl text-yellow-300">Reliques ultimes</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Ces cadres ne tombent dans aucun booster : ils récompensent l’aboutissement d’une collection.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {endgameFrames.map((frame) => (
                <FrameShowcase key={frame.id} frame={frame} isUnlocked={unlockedFrameIds.has(frame.id)} onClick={() => handleFrameClick(frame)} />
              ))}
            </div>
          </section>
        )}

        {giftFrames.length > 0 && (
          <section className="mb-10 rounded-3xl border border-green-400/30 bg-green-500/5 p-5">
            <h2 className="font-display font-bold text-xl text-green-300 mb-2">Cadeaux disponibles</h2>
            <p className="text-xs text-muted-foreground mb-5">Ces cadres sont offerts une seule fois à chaque joueur.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{giftFrames.map((frame) => <FrameShowcase key={frame.id} frame={frame} isUnlocked={unlockedFrameIds.has(frame.id)} onClick={() => handleFrameClick(frame)} />)}</div>
          </section>
        )}

        {eventFrames.length > 0 && (
          <section className="mb-10 rounded-3xl border border-pink-400/30 bg-pink-500/5 p-5">
            <h2 className="font-display font-bold text-xl text-pink-300 mb-2">Drops d’événement</h2>
            <p className="text-xs text-muted-foreground mb-5">Disponibles uniquement dans les boosters pendant leur événement associé.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{eventFrames.map((frame) => <FrameShowcase key={frame.id} frame={frame} isUnlocked={unlockedFrameIds.has(frame.id)} onClick={() => handleFrameClick(frame)} />)}</div>
          </section>
        )}

        {/* Boutique */}
        {shopFrames.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-accent" />
              <h2 className="font-heading font-bold text-lg">Boutique</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {shopFrames.map(frame => (
                <FrameShowcase
                  key={frame.id}
                  frame={frame}
                  isUnlocked={unlockedFrameIds.has(frame.id)}
                  onClick={() => handleFrameClick(frame)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Boosters */}
        {boosterFrames.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-bold text-lg">Drop Boosters</h2>
              <span className="text-xs text-muted-foreground">(Très rare)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {boosterFrames.map(frame => (
                <FrameShowcase
                  key={frame.id}
                  frame={frame}
                  isUnlocked={unlockedFrameIds.has(frame.id)}
                  onClick={() => handleFrameClick(frame)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Quêtes */}
        {questFrames.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h2 className="font-heading font-bold text-lg">Quêtes & Défis</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {questFrames.map(frame => (
                <FrameShowcase
                  key={frame.id}
                  frame={frame}
                  isUnlocked={unlockedFrameIds.has(frame.id)}
                  onClick={() => handleFrameClick(frame)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Succès */}
        {achievementFrames.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-green-400" />
              <h2 className="font-heading font-bold text-lg">Succès</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {achievementFrames.map(frame => (
                <FrameShowcase
                  key={frame.id}
                  frame={frame}
                  isUnlocked={unlockedFrameIds.has(frame.id)}
                  onClick={() => handleFrameClick(frame)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Modal de prévisualisation */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl">
            {selectedFrame && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display flex items-center justify-between">
                    <span>{selectedFrame.name}</span>
                    <Badge className={`${selectedFrame.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/80' : 'bg-primary/20 text-primary border-primary/40'} border`}>
                      {selectedFrame.rarity}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Prévisualisation */}
                  <div className="flex justify-center p-8 bg-secondary/30 rounded-2xl border border-border">
                    <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black" style={{ width: 220, height: 330 }}>
                      {cards[0]?.image_url && <img src={cards[0].image_url} alt="Carte d’aperçu" className="absolute inset-0 w-full h-full object-cover" />}
                      {selectedFrame.image_url && <img src={selectedFrame.image_url} alt="" className="absolute inset-0 z-20 w-full h-full object-fill" />}
                      {selectedFrame.effect === "shimmer" && (
                        <div className="absolute inset-0 shimmer opacity-50" />
                      )}
                      {selectedFrame.effect === "sparkle" && (
                        <div className="absolute inset-0 animate-pulse bg-white/5" />
                      )}
                      {selectedFrame.effect === "glow" && (
                        <div className="absolute inset-0 shadow-lg" />
                      )}
                      
                      {!cards[0]?.image_url && <div className="absolute inset-4 rounded-lg bg-black/40 flex items-center justify-center">
                        <p className="text-xs text-white/60 text-center">Aperçu du cadre</p>
                      </div>}

                    </div>
                  </div>

                  {/* Infos */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Prix</p>
                      <p className="font-bold text-cyan-400">
                        {selectedFrame.source_type === "gift" ? "Gratuit"
                          : selectedFrame.source_type === "event" ? `${Number(selectedFrame.drop_chance || 0)}% par booster`
                          : Number(selectedFrame.price_eur || 0) > 0
                          ? `${Number(selectedFrame.price_eur).toFixed(2)} €`
                          : `${Number(selectedFrame.price_coins || 0).toLocaleString("fr-FR")} 🪙 · ${Number(selectedFrame.price_gems || 0).toLocaleString("fr-FR")} 💎`}
                      </p>
                    </div>
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Source</p>
                      <p className="font-semibold text-sm capitalize">
                        {selectedFrame.source_type === "shop" && "🏪 Boutique"}
                        {selectedFrame.source_type === "booster" && "📦 Booster"}
                        {selectedFrame.source_type === "quest" && "⚔️ Quête"}
                        {selectedFrame.source_type === "achievement" && "🏆 Succès"}
                        {selectedFrame.source_type === "endgame" && "👑 End-game"}
                        {selectedFrame.source_type === "gift" && "🎁 Cadeau gratuit"}
                        {selectedFrame.source_type === "event" && "✨ Drop d’événement"}
                      </p>
                    </div>
                  </div>

                  {selectedFrame.description && (
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{selectedFrame.description}</p>
                    </div>
                  )}

                  {selectedFrame.is_endgame && (
                    <div className="p-3 bg-yellow-500/5 rounded-xl border border-yellow-400/20">
                      <p className="text-xs font-bold text-yellow-300 mb-2">Conditions cumulatives</p>
                      <div className="space-y-1.5">
                        {getEligibility(selectedFrame).checks.map((check) => (
                          <div key={check.label} className="flex items-center justify-between text-xs">
                            <span className={check.current >= check.target ? "text-green-400" : "text-muted-foreground"}>{check.current >= check.target ? "✓" : "🔒"} {check.label}</span>
                            <span>{Math.min(check.current, check.target).toLocaleString("fr-FR")} / {check.target.toLocaleString("fr-FR")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(false)}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Fermer
                    </Button>
                    {unlockedFrameIds.has(selectedFrame.id) ? (
                      <Button
                        onClick={() => handleApplyFrame(selectedFrame)}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        <Frame className="w-4 h-4 mr-2" />
                        Appliquer
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePurchaseFrame(selectedFrame)}
                        disabled={selectedFrame.source_type === "event" || Number(selectedFrame.price_eur || 0) > 0 || !getEligibility(selectedFrame).eligible || purchaseFrameMutation.isPending}
                        className="flex-1 bg-accent hover:bg-accent/90"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        {selectedFrame.source_type === "event" ? "Drop pendant l’événement" : selectedFrame.source_type === "gift" ? "Récupérer gratuitement" : Number(selectedFrame.price_eur || 0) > 0 ? "Paiement sécurisé à connecter" : selectedFrame.is_endgame ? "Débloquer la relique" : "Acheter"}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Sélecteur de carte */}
        <Dialog open={showCardSelector} onOpenChange={setShowCardSelector}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                Choisir une carte pour le cadre {selectedFrame?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {cards
                  .filter(card => card.image_url)
                  .map(card => (
                    <button
                      key={card.id}
                      onClick={() => {
                        applyFrameMutation.mutate({ 
                          frameId: selectedFrame.id, 
                          cardId: card.id 
                        });
                        setShowCardSelector(false);
                      }}
                      className="relative group rounded-lg overflow-hidden border border-border hover:border-primary transition-all"
                    >
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="w-full aspect-[2/3] object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Frame className="w-6 h-6 text-primary" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-xs font-bold text-white truncate">{card.name}</p>
                        <p className="text-[10px] text-white/70">{card.rarity}</p>
                      </div>
                    </button>
                  ))}
              </div>
              {cards.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Aucune carte dans votre collection
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCardSelector(false)}
              >
                Annuler
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
