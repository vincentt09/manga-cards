import React, { useEffect, useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Tag, Search, Filter, X, Plus, AlertCircle, Clock3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import { RARITY_CONFIG, RARITY_ORDER } from "@/lib/gameData";
import { logTransaction } from "@/lib/transactionLogger";
import { useAuth } from "@/lib/AuthContext";
import CardListing from "@/components/marketplace/CardListing";
import FrameListingCard from "@/components/marketplace/FrameListingCard";

export default function Marketplace() {
  const [marketTab, setMarketTab] = useState("cards"); // cards | frames
  const [tab, setTab] = useState("browse"); // browse | mine
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [showSellModal, setShowSellModal] = useState(false);
  const [buyingId, setBuyingId] = useState(null);
  const [isListing, setIsListing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: cardListings = [] } = useQuery({
    queryKey: ["card-listings"],
    queryFn: () => appClient.entities.MarketListing.filter({ status: "active" }, "-created_date", 100),
    refetchInterval: 15000,
  });

  const { data: frameListings = [] } = useQuery({
    queryKey: ["frame-listings"],
    queryFn: () => appClient.entities.FrameListing.filter({ status: "active" }, "-created_date", 50),
    refetchInterval: 15000,
  });

  const { data: systemMarketResponse } = useQuery({
    queryKey: ["system-market"],
    queryFn: () => appClient.functions.invoke("getSystemMarket"),
    refetchInterval: 60_000,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profile"],
    queryFn: () => appClient.entities.PlayerProfile.list(),
  });

  const { data: myCards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: () => appClient.entities.Card.list("-created_date", 200),
  });
  
  const { data: imageOverrides = [] } = useQuery({
    queryKey: ["cardImageOverrides"],
    queryFn: () => appClient.entities.CardImageOverride.list(),
  });

  const profile = profiles[0];
  const systemMarket = systemMarketResponse?.data;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const rotationSeconds = systemMarket?.nextRotationAt ? Math.max(0, Math.ceil((new Date(systemMarket.nextRotationAt).getTime() - now) / 1000)) : 0;
  const myCardListings = cardListings.filter(l => l.seller_id === user?.id);
  const otherCardListings = cardListings.filter(l => l.seller_id !== user?.id);
  const myFrameListings = frameListings.filter(l => l.seller_id === user?.id);
  const otherFrameListings = frameListings.filter(l => l.seller_id !== user?.id);

  const displayCardListings = (tab === "browse" ? otherCardListings : myCardListings)
    .filter(l => {
      const matchSearch = !search || l.card_name?.toLowerCase().includes(search.toLowerCase()) || l.card_anime?.toLowerCase().includes(search.toLowerCase());
      const matchRarity = rarityFilter === "all" || l.card_rarity === rarityFilter;
      return matchSearch && matchRarity;
    })
    .sort((a, b) => (RARITY_ORDER[b.card_rarity] || 0) - (RARITY_ORDER[a.card_rarity] || 0));

  const displayFrameListings = (tab === "browse" ? otherFrameListings : myFrameListings)
    .filter(l => {
      const matchSearch = !search || l.frame_name?.toLowerCase().includes(search.toLowerCase());
      const matchRarity = rarityFilter === "all" || l.frame_rarity === rarityFilter;
      return matchSearch && matchRarity;
    })
    .sort((a, b) => (RARITY_ORDER[b.frame_rarity] || 0) - (RARITY_ORDER[a.frame_rarity] || 0));

  const handleBuyCard = async (listing) => {
    if (!profile) return;
    if ((profile.coins || 0) < listing.price) {
      toast({ title: "Pièces insuffisantes", description: `Il te faut ${listing.price.toLocaleString()} pièces.`, variant: "destructive" });
      return;
    }
    setBuyingId(listing.id);
    try {
      const response = await appClient.functions.invoke("buyMarketListing", { listing_id: listing.id, kind: "card" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["card-listings"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["cards"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
      toast({ title: `✅ ${listing.card_name} achetée !`, description: `−${listing.price.toLocaleString()} pièces · taxe marché ${response.data.tax.toLocaleString()}` });
    } catch (error) {
      toast({ title: "Achat impossible", description: error.message, variant: "destructive" });
    } finally {
      setBuyingId(null);
    }
  };

  const handleBuyFrame = async (listing) => {
    if (!profile) return;
    if ((profile.coins || 0) < listing.price) {
      toast({ title: "Pièces insuffisantes", variant: "destructive" });
      return;
    }
    setBuyingId(listing.id);

    try {
      const response = await appClient.functions.invoke("buyMarketListing", { listing_id: listing.id, kind: "frame" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["frame-listings"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["myFrames"] }),
      ]);
      toast({ title: `✅ ${listing.frame_name} acheté !`, description: `−${listing.price.toLocaleString()} pièces · taxe marché ${response.data.tax.toLocaleString()}` });
    } catch (error) {
      toast({ title: "Achat impossible", description: error.message, variant: "destructive" });
    } finally {
      setBuyingId(null);
    }
  };

  const handleBuySystemCard = async (offer) => {
    if (!profile || buyingId) return;
    if (Number(profile.coins || 0) < Number(offer.price || 0)) {
      toast({ title: "Pièces insuffisantes", description: `Il te faut ${offer.price.toLocaleString()} pièces.`, variant: "destructive" });
      return;
    }
    setBuyingId(offer.id);
    try {
      await appClient.functions.invoke("buySystemMarketCard", { offer_id: offer.id });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["system-market"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["cards"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
      toast({ title: `✨ ${offer.card_name} achetée au jeu !`, description: `−${offer.price.toLocaleString()} pièces` });
    } catch (error) {
      toast({ title: "Achat impossible", description: error.message, variant: "destructive" });
    } finally {
      setBuyingId(null);
    }
  };

  const handleCancelCard = async (listing) => {
    await appClient.functions.invoke("cancelMarketListing", { listing_id: listing.id, kind: "card" });
    queryClient.invalidateQueries({ queryKey: ["card-listings"] });
    queryClient.invalidateQueries({ queryKey: ["cards"] });
    toast({ title: "Annulé", description: `${listing.card_name} rendue à ta collection.` });
  };

  const handleCancelFrame = async (listing) => {
    await appClient.functions.invoke("cancelMarketListing", { listing_id: listing.id, kind: "frame" });
    queryClient.invalidateQueries({ queryKey: ["frame-listings"] });
    toast({ title: "Annulé", description: `${listing.frame_name} rendu à ton inventaire.` });
  };

  const handleSellCard = async (card, price) => {
    setIsListing(true);
    try {
      await appClient.functions.invoke("createMarketListing", { kind: "card", item_id: card.id, price });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["card-listings"] }),
        queryClient.invalidateQueries({ queryKey: ["cards"] }),
      ]);
      setShowSellModal(false);
      logTransaction({ type: "sell", description: `Vente : ${card.name}`, amount: price, card_name: card.name, card_rarity: card.rarity });
      toast({ title: `🏷️ ${card.name} en vente !`, description: `Prix : ${price.toLocaleString()} pièces` });
    } catch (error) {
      toast({ title: "Mise en vente impossible", description: error.message, variant: "destructive" });
    } finally {
      setIsListing(false);
    }
  };

  const handleSellFrame = async (playerFrame, frameDef, price) => {
    setIsListing(true);
    try {
      await appClient.functions.invoke("createMarketListing", { kind: "frame", item_id: playerFrame.id, price });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["frame-listings"] }),
        queryClient.invalidateQueries({ queryKey: ["myFrames"] }),
      ]);
      setShowSellModal(false);
      toast({ title: `🏷️ ${frameDef.name} en vente !`, description: `Prix : ${price.toLocaleString()} pièces` });
    } catch (error) {
      toast({ title: "Mise en vente impossible", description: error.message, variant: "destructive" });
    } finally {
      setIsListing(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
      <Navbar />
      <CurrencyBar profile={profile} cards={myCards} />

      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-primary" />Hôtel des Ventes
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {marketTab === "cards" ? `${otherCardListings.length} carte${otherCardListings.length > 1 ? "s" : ""}` : `${otherFrameListings.length} cadre${otherFrameListings.length > 1 ? "s" : ""}`} en vente
            </p>
          </div>
          <Button onClick={() => setShowSellModal(true)} className="bg-gradient-to-r from-primary to-accent font-heading text-sm">
            <Plus className="w-4 h-4 mr-1.5" />Vendre
          </Button>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "cards", label: `Cartes (${otherCardListings.length})` },
              { id: "frames", label: `Cadres (${otherFrameListings.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => { setMarketTab(t.id); setTab("browse"); }}
                className={`min-w-0 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${marketTab === t.id ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[{ id: "browse", label: "Parcourir" }, { id: "mine", label: "Mes annonces" }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {marketTab === "cards" && tab === "browse" && systemMarket?.offers?.length > 0 && (
          <section className="mb-6 overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/35 via-card to-primary/10 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400"><Sparkles className="h-3.5 w-3.5" />Sélection officielle</p>
                <h2 className="mt-1 font-display text-xl font-bold">Ventes du jeu</h2>
                <p className="text-xs text-muted-foreground">5 cartes choisies aléatoirement. Chaque offre est achetable une fois par rotation.</p>
              </div>
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-right">
                <p className="flex items-center gap-1 text-[10px] text-cyan-300"><Clock3 className="h-3 w-3" />Nouvelles cartes dans</p>
                <p className="font-display text-lg font-bold text-cyan-200">{String(Math.floor(rotationSeconds / 60)).padStart(2, "0")}:{String(rotationSeconds % 60).padStart(2, "0")}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              {systemMarket.offers.map((offer) => <CardListing key={offer.id} listing={offer} onBuy={handleBuySystemCard} isOwnListing={false} isBuying={buyingId === offer.id} imageOverrides={imageOverrides} />)}
            </div>
          </section>
        )}

        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
          </div>
          <Select value={rarityFilter} onValueChange={setRarityFilter}>
            <SelectTrigger className="w-36 bg-secondary/50">
              <Filter className="w-3.5 h-3.5 mr-1.5" /><SelectValue placeholder="Rareté" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {Object.entries(RARITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {marketTab === "cards" ? (
          displayCardListings.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground font-medium">{tab === "mine" ? "Aucune annonce active" : "Aucune carte en vente"}</p>
            </div>
          ) : (
            <motion.div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" layout>
              <AnimatePresence>
                {displayCardListings.map(listing => (
                  <CardListing key={listing.id} listing={listing} onBuy={handleBuyCard} onCancel={handleCancelCard}
                    isOwnListing={listing.seller_id === user?.id} isBuying={buyingId === listing.id}
                    imageOverrides={imageOverrides} />
                ))}
              </AnimatePresence>
            </motion.div>
          )
        ) : (
          displayFrameListings.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground font-medium">{tab === "mine" ? "Aucune annonce active" : "Aucun cadre en vente"}</p>
            </div>
          ) : (
            <motion.div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4" layout>
              <AnimatePresence>
                {displayFrameListings.map(listing => (
                  <FrameListingCard key={listing.id} listing={listing} onBuy={handleBuyFrame} onCancel={handleCancelFrame}
                    isOwnListing={listing.seller_id === user?.id} isBuying={buyingId === listing.id} />
                ))}
              </AnimatePresence>
            </motion.div>
          )
        )}
      </div>

      <AnimatePresence>
        {showSellModal && (
          <SellModal
            myCards={myCards}
            myFrames={[]} // TODO: fetch unlocked frames
            activeCardListings={myCardListings}
            activeFrameListings={myFrameListings}
            onSellCard={handleSellCard}
            onSellFrame={handleSellFrame}
            marketTab={marketTab}
            onClose={() => setShowSellModal(false)}
            isListing={isListing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sell Modal (simplified) ─────────────────────────────────────────────────
function SellModal({ myCards, activeCardListings, onSellCard, onClose, isListing, marketTab }) {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [price, setPrice] = useState("");
  const listedCardIds = new Set(activeCardListings.map(l => l.card_id));
  const availableCards = myCards.filter(c => !listedCardIds.has(c.id));
  const selectedCard = availableCards.find(c => c.id === selectedCardId);
  const minPrice = selectedCard ? Math.round({ normale: 100, legendaire: 5000, "secrète": 25000, manga_god: 150000 }[selectedCard.rarity] || 100) : 1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="max-h-[calc(100dvh_-_1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg flex items-center gap-2"><Tag className="w-5 h-5 text-primary" />Vendre</h2>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        {marketTab === "cards" ? (
          availableCards.length === 0 ? (
            <div className="text-center py-8"><AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Aucune carte disponible</p></div>
          ) : (
            <>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger className="bg-secondary/50 mb-3"><SelectValue placeholder="Choisir une carte..." /></SelectTrigger>
                <SelectContent>
                  {availableCards.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — {c.power} PWR</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedCard && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-2 block">Prix (min. {minPrice})</label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-secondary/50" min={minPrice} />
                </div>
              )}
              <Button className="w-full" disabled={!selectedCardId || !price || Number(price) < minPrice || isListing}
                onClick={() => onSellCard(selectedCard, Number(price))}>
                {isListing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Vendre"}
              </Button>
            </>
          )
        ) : (
          <div className="text-center py-8 text-muted-foreground"><p>Vente de cadres bientôt disponible</p></div>
        )}
      </motion.div>
    </motion.div>
  );
}
