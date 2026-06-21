import React, { useState, useEffect, useMemo } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel, Clock, Filter, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import AuctionCard from "@/components/auction/AuctionCard";
import BidModal from "@/components/auction/BidModal";
import CreateAuctionModal from "@/components/auction/CreateAuctionModal";
import EconomyPanel from "@/components/economy/EconomyPanel";

export default function Auctions() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("ending_soon");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ["profile"],
    queryFn: () => appClient.entities.PlayerProfile.list(),
  });
  const profile = profiles[0];

  const { data: auctions = [] } = useQuery({
    queryKey: ["auctions"],
    queryFn: async () => (await appClient.functions.invoke("getAuctions")).data,
    refetchInterval: 15_000,
  });

  const { data: cards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: () => appClient.entities.Card.list(),
  });

  const { data: imageOverrides = [] } = useQuery({
    queryKey: ["cardImageOverrides"],
    queryFn: () => appClient.entities.CardImageOverride.list(),
  });

  const { data: economyStats = [] } = useQuery({
    queryKey: ["economy"],
    queryFn: () => appClient.entities.EconomyStats.list(),
  });
  const economyStatsData = economyStats[0];

  const createAuctionMutation = useMutation({
    mutationFn: (data) => appClient.functions.invoke("createAuction", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Enchère créée avec succès");
    },
    onError: (error) => toast.error(error.message),
  });

  const placeBidMutation = useMutation({
    mutationFn: ({ auctionId, amount }) => appClient.functions.invoke("placeAuctionBid", { auction_id: auctionId, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const handleBid = async (auction, amount) => {
    if (!profile || profile.coins < amount) {
      toast.error("Pièces insuffisantes");
      return;
    }

    try {
      await placeBidMutation.mutateAsync({ auctionId: auction.id, amount });
      toast.success(`Enchère de ${amount.toLocaleString()} 🪙 placée !`);
      setShowBidModal(false);
      setSelectedAuction(null);
    } catch { /* le message est affiché par la mutation */ }
  };

  const filteredAuctions = useMemo(() => {
    let result = auctions.filter(a => a.status === "active");
    
    if (search) {
      result = result.filter(a => 
        a.card_name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filter !== "all") {
      result = result.filter(a => a.card_rarity === filter);
    }

    result.sort((a, b) => {
      if (sortBy === "ending_soon") {
        return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime();
      }
      if (sortBy === "highest_bid") {
        return b.current_bid - a.current_bid;
      }
      if (sortBy === "newest") {
        return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
      }
      return 0;
    });

    return result;
  }, [auctions, filter, sortBy, search]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
      <Navbar />
      <CurrencyBar profile={profile} cards={cards} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header + Economy Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-wide flex items-center gap-2">
                  <Gavel className="w-6 h-6 text-primary" />
                  Salle des Ventes
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enchérissez sur des cartes rares • {filteredAuctions.length} enchères actives
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <TrendingUp className="w-4 h-4 mr-1.5" />
                Créer une enchère
              </Button>
            </div>
          </div>
          <div>
            <EconomyPanel stats={economyStatsData} />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Input
              placeholder="Rechercher une carte..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-4 bg-secondary/50 border-border h-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-secondary/50 h-10">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue placeholder="Rareté" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="legendary">Légendaire</SelectItem>
              <SelectItem value="secret">Secrète</SelectItem>
              <SelectItem value="epic">Épique</SelectItem>
              <SelectItem value="ultra_rare">Ultra Rare</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40 bg-secondary/50 h-10">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue placeholder="Trier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ending_soon">Fin bientôt</SelectItem>
              <SelectItem value="highest_bid">Plus haut prix</SelectItem>
              <SelectItem value="newest">Plus récent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auction Grid */}
        {filteredAuctions.length === 0 ? (
          <div className="text-center py-24 bg-secondary/30 rounded-xl border border-border">
            <Gavel className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground font-medium">Aucune enchère active</p>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Soyez le premier à créer une enchère !
            </p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            layout
          >
            <AnimatePresence>
              {filteredAuctions.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  currentTime={currentTime}
                  onBid={(a) => {
                    setSelectedAuction(a);
                    setShowBidModal(true);
                  }}
                  imageOverrides={imageOverrides}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Bid Modal */}
      {showBidModal && selectedAuction && (
        <BidModal
          auction={selectedAuction}
          currentCoins={profile.coins}
          onConfirm={handleBid}
          onClose={() => {
            setShowBidModal(false);
            setSelectedAuction(null);
          }}
        />
      )}

      {/* Create Auction Modal */}
      {showCreateModal && (
        <CreateAuctionModal
          cards={cards.filter(c => !c.is_favorite)}
          profile={profile}
          onCreate={(data) => createAuctionMutation.mutate(data)}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
