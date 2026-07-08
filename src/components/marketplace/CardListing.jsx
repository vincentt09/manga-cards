import React from "react";
import { motion } from "framer-motion";
import { Check, ImageOff, ShoppingBag, X, Zap, Shield, Wind, Star, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RARITY_CONFIG, RARITY_ORDER } from "@/lib/gameData";

export default function CardListing({ listing, onBuy, onCancel, isOwnListing, isBuying, imageOverrides = [] }) {
  const rarity = RARITY_CONFIG[listing.card_rarity] || RARITY_CONFIG.common;
  const isHighRarity = RARITY_ORDER[listing.card_rarity] >= 4;
  
  // Get override image (match by name + rarity suffix)
  const raritySuffixes = {
    "normale": ["_n", "_b"],
    "legendaire": ["_l"], 
    "secrète": ["_s"],
    "manga_god": ["_mg"]
  }[listing.card_rarity] || ["_n"];
  
  const override = imageOverrides.find(o => 
    o.card_name && 
    o.card_name.toLowerCase() === listing.card_name.toLowerCase() &&
    o.card_id &&
    raritySuffixes.some(suffix => o.card_id.endsWith(suffix))
  );
  const displayImageUrl = override?.image_url || listing.card_image_url;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative rounded-2xl border-2 ${rarity.borderColor} bg-card overflow-hidden group`}
    >
      <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${rarity.gradient} sm:h-44`}>
        {displayImageUrl ? <img src={displayImageUrl} alt={listing.card_name}
          className="w-full h-full object-contain bg-black group-hover:scale-[1.02] transition-transform duration-300" /> : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-white/65">
            <ImageOff className="h-8 w-8 opacity-50" />
            <span className="text-xs font-bold">Illustration à venir</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        {rarity.shimmer && <div className="absolute inset-0 shimmer opacity-10 mix-blend-overlay pointer-events-none" />}

        <div className={`absolute top-2 left-2 rounded-full px-2.5 py-1 text-[10px] font-bold border backdrop-blur-sm ${rarity.bgColor} ${rarity.color} ${rarity.borderColor}`}>
          {isHighRarity && "✦ "}{rarity.label}
        </div>

        <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-0.5 flex items-center gap-1">
          <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
          <span className="text-[9px] font-bold text-white">{listing.card_level || 1}</span>
        </div>

        {listing.is_system && <div className="absolute bottom-2 right-2 rounded-full border border-cyan-300/30 bg-cyan-500/85 px-2 py-1 text-[8px] font-black text-white">VENTE DU JEU</div>}

        {listing.card_variant === "awakened" && (
          <div className="absolute bottom-10 left-2 bg-yellow-500/80 rounded-full px-2 py-0.5 text-[8px] font-bold text-black">★ ÉVEILLÉE</div>
        )}

        <div className="absolute bottom-2 left-2">
          <span className={`font-display text-2xl font-black drop-shadow-lg ${rarity.color}`}>{listing.card_power}</span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-heading font-bold text-sm truncate">{listing.card_name}</h3>
        <p className="text-[10px] text-muted-foreground mb-2">{listing.card_anime}</p>

        <div className="flex items-center gap-3 mb-3 text-[10px]">
          <div className="flex items-center gap-0.5"><Zap className="w-3 h-3 text-red-400" /><span className="font-semibold">{listing.card_attack}</span></div>
          <div className="flex items-center gap-0.5"><Shield className="w-3 h-3 text-blue-400" /><span className="font-semibold">{listing.card_defense}</span></div>
          <div className="flex items-center gap-0.5"><Wind className="w-3 h-3 text-green-400" /><span className="font-semibold">{listing.card_speed}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-2 py-1.5">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="truncate font-bold text-xs text-yellow-300 sm:text-sm">{listing.price.toLocaleString()}</span>
          </div>

          {isOwnListing ? (
            <Button size="sm" variant="outline" onClick={() => onCancel(listing)}
              className="w-full min-w-0 px-2 text-[11px] border-destructive/40 text-destructive hover:bg-destructive/10">
              <X className="w-3 h-3 mr-1" />Retirer
            </Button>
          ) : (
            <Button size="sm" onClick={() => onBuy(listing)} disabled={isBuying || listing.purchased}
              className={`w-full min-w-0 px-2 text-[11px] bg-gradient-to-r ${RARITY_CONFIG[listing.card_rarity]?.gradient || "from-primary to-accent"} border-0 text-white`}>
              {isBuying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : listing.purchased ? <><Check className="w-3 h-3 mr-1" />Achetée</> : <><ShoppingBag className="w-3 h-3 mr-1" />Acheter</>}
            </Button>
          )}
        </div>

        <p className={`text-[9px] mt-2 ${listing.is_system ? "font-semibold text-cyan-400" : "text-muted-foreground"}`}>Par {listing.seller_name || "Inconnu"}</p>
      </div>
    </motion.div>
  );
}
