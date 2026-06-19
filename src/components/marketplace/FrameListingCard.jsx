import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, X, Frame, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RARITY_CONFIG } from "@/lib/gameData";

export default function FrameListingCard({ listing, onBuy, onCancel, isOwnListing, isBuying }) {
  const rarity = RARITY_CONFIG[listing.frame_rarity] || RARITY_CONFIG.common;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative rounded-2xl border-2 ${rarity.borderColor} bg-gradient-to-b ${rarity.gradient} overflow-hidden group p-4`}
    >
      <div className="aspect-square rounded-xl bg-black/20 flex items-center justify-center mb-3">
        <Frame className={`w-12 h-12 ${rarity.color} opacity-60`} />
      </div>

      <div className="mb-3">
        <h3 className="font-heading font-bold text-sm truncate text-white">{listing.frame_name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-bold ${rarity.color} bg-black/30 rounded-full px-2 py-0.5`}>{rarity.label}</span>
          {listing.frame_effect && listing.frame_effect !== "none" && (
            <span className="text-[9px] text-white/60 uppercase">{listing.frame_effect}</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-yellow-500/10 rounded-lg px-2.5 py-1.5 border border-yellow-500/20">
          <Coins className="w-3.5 h-3.5 text-yellow-400" />
          <span className="font-bold text-sm text-yellow-300">{listing.price.toLocaleString()}</span>
        </div>

        {isOwnListing ? (
          <Button size="sm" variant="outline" onClick={() => onCancel(listing)}
            className="text-xs border-destructive/40 text-destructive hover:bg-destructive/10">
            <X className="w-3 h-3 mr-1" />Retirer
          </Button>
        ) : (
          <Button size="sm" onClick={() => onBuy(listing)} disabled={isBuying}
            className={`text-xs bg-gradient-to-r ${rarity.gradient} border-0 text-white`}>
            {isBuying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ShoppingBag className="w-3 h-3 mr-1" />Acheter</>}
          </Button>
        )}
      </div>

      <p className="text-[9px] text-white/60 mt-2">Par {listing.seller_name || "Inconnu"}</p>
    </motion.div>
  );
}