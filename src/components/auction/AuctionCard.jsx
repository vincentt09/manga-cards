import React, { useState, useEffect } from "react";
import { Clock, Coins, TrendingUp, AlertCircle, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RARITY_CONFIG } from "@/lib/gameData";

export default function AuctionCard({ auction, onBid, currentTime, imageOverrides = [] }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const end = new Date(auction.ends_at).getTime();
      const now = currentTime.getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Terminé");
        setIsUrgent(false);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
        setIsUrgent(hours < 1);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
        setIsUrgent(minutes < 5);
      } else {
        setTimeLeft(`${seconds}s`);
        setIsUrgent(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction.ends_at, currentTime]);

  const rarityConfig = RARITY_CONFIG[auction.card_rarity] || RARITY_CONFIG.common;
  const minBid = auction.current_bid + Math.ceil(auction.current_bid * 0.1);
  
  // Get override image (match by name + rarity suffix)
  const raritySuffixes = {
    "normale": ["_n", "_b"],
    "legendaire": ["_l"], 
    "secrète": ["_s"],
    "manga_god": ["_mg"]
  }[auction.card_rarity] || ["_n"];
  
  const override = imageOverrides.find(o => 
    o.card_name && 
    o.card_name.toLowerCase() === auction.card_name.toLowerCase() &&
    o.card_id &&
    raritySuffixes.some(suffix => o.card_id.endsWith(suffix))
  );
  const displayImageUrl = override?.image_url || auction.card_image_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all"
    >
      {/* Card Image */}
      <div className={`relative h-40 bg-gradient-to-br ${rarityConfig.gradient} p-3`}>
        {displayImageUrl ? <img src={displayImageUrl} alt={auction.card_name} className="w-full h-full object-contain drop-shadow-lg" /> : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-white/65"><ImageOff className="h-8 w-8 opacity-50" /><span className="text-xs font-bold">Illustration à venir</span></div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold bg-black/60 backdrop-blur-sm ${rarityConfig.color}`}>
          {rarityConfig.label}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-3 sm:p-4">
        <div>
          <h3 className="font-display font-bold text-sm truncate">{auction.card_name}</h3>
          <p className="text-xs text-muted-foreground">Vendu par {auction.seller_name}</p>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isUrgent ? 'bg-red-500/20 border border-red-500/40' : 'bg-secondary/50'}`}>
          <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-400' : 'text-muted-foreground'}`} />
          <span className={`text-sm font-semibold ${isUrgent ? 'text-red-400' : 'text-foreground'}`}>
            {timeLeft}
          </span>
        </div>

        {/* Bids */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Mise actuelle</span>
            <div className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-bold text-yellow-400">{auction.current_bid.toLocaleString()}</span>
            </div>
          </div>
          
          {auction.highest_bidder_name && (
            <p className="text-xs text-muted-foreground">
            Meilleure offre : <span className="text-foreground font-medium">{auction.highest_bidder_name}</span>
            </p>
          )}
        </div>

        {/* Bid Button */}
        <Button
          onClick={() => onBid(auction, minBid)}
          disabled={auction.status !== "active"}
          className="w-full bg-primary hover:bg-primary/90"
        >
          <TrendingUp className="w-4 h-4 mr-1.5" />
          Miser {minBid.toLocaleString()} 🪙
        </Button>

        {auction.buyout_price && (
          <Button
            variant="outline"
            className="w-full border-accent text-accent hover:bg-accent/10"
            onClick={() => onBid(auction, auction.buyout_price)}
          >
            Achat immédiat : {auction.buyout_price.toLocaleString()} 🪙
          </Button>
        )}

        {auction.status !== "active" && (
          <div className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1.5 rounded">
            <AlertCircle className="w-3 h-3" />
            {auction.status === "sold" ? "Vendue" : auction.status === "expired" ? "Expirée" : "Annulée"}
          </div>
        )}
      </div>
    </motion.div>
  );
}
