import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gavel, Clock, Coins, AlertCircle } from "lucide-react";
import { RARITY_CONFIG } from "@/lib/gameData";

export default function CreateAuctionModal({ cards, profile, onCreate, onClose }) {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [buyoutPrice, setBuyoutPrice] = useState("");
  const [duration, setDuration] = useState("24");

  const selectedCard = cards.find(c => c.id === selectedCardId);
  
  // Economy system - fees
  const listingFeeRate = 0.05; // 5% listing fee
  const listingFee = selectedCard && startingPrice ? Math.round(parseInt(startingPrice) * listingFeeRate) : 0;
  const finalFeeRate = 0.10; // 10% final sale fee
  const estimatedFinalFee = selectedCard && startingPrice ? Math.round(parseInt(startingPrice) * finalFeeRate) : 0;
  const totalFees = listingFee + estimatedFinalFee;

  const handleSubmit = () => {
    if (!selectedCard || !startingPrice) return;
    
    const startPrice = parseInt(startingPrice);
    if (profile.coins < listingFee) {
      alert(`Pièces insuffisantes. Frais de mise : ${listingFee.toLocaleString()} 🪙`);
      return;
    }

    onCreate({
      card_id: selectedCard.id,
      starting_price: startPrice,
      buyout_price: buyoutPrice ? parseInt(buyoutPrice) : undefined,
      duration_hours: parseInt(duration),
    });

    onClose();
  };

  const canSubmit = selectedCard && startingPrice && parseInt(startingPrice) > 0 && profile.coins >= listingFee;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Gavel className="w-5 h-5 text-primary" />
            Créer une enchère
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Card Selection */}
          <div className="space-y-2">
            <Label>Carte à enchérir</Label>
            <Select value={selectedCardId} onValueChange={setSelectedCardId}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Sélectionnez une carte" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {cards.map((card) => {
                  const rarityConfig = RARITY_CONFIG[card.rarity];
                  return (
                    <SelectItem key={card.id} value={card.id}>
                      <span className={rarityConfig?.color}>{card.name}</span>
                      <span className="text-muted-foreground ml-2">({rarityConfig?.label})</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedCard && (
              <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                <img
                  src={selectedCard.image_url}
                  alt={selectedCard.name}
                  className="w-16 h-20 object-cover rounded"
                />
                <div>
                  <p className="font-bold text-sm">{selectedCard.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Puissance: {selectedCard.power} • Niveau {selectedCard.level}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Starting Price */}
          <div className="space-y-2">
            <Label>Prix de départ (pièces)</Label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
              <Input
                type="number"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="pl-9 bg-secondary/50"
                placeholder="1000"
                min="1"
              />
            </div>
            {startingPrice && (
              <div className="text-xs text-muted-foreground space-y-1 p-2 bg-secondary/30 rounded-lg">
                <p>Frais de mise (5%) : <span className="text-yellow-400 font-bold">{listingFee.toLocaleString()} 🪙</span></p>
                <p>Frais de vente estimés (10%) : <span className="text-yellow-400 font-bold">{estimatedFinalFee.toLocaleString()} 🪙</span></p>
                <p className="border-t border-border pt-1 mt-1">Total frais : <span className="text-destructive font-bold">{totalFees.toLocaleString()} 🪙</span></p>
              </div>
            )}
          </div>

          {/* Buyout Price */}
          <div className="space-y-2">
            <Label>Prix d'achat immédiat (optionnel)</Label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
              <Input
                type="number"
                value={buyoutPrice}
                onChange={(e) => setBuyoutPrice(e.target.value)}
                className="pl-9 bg-secondary/50"
                placeholder="5000"
                min="1"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Durée
            </Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 heure</SelectItem>
                <SelectItem value="6">6 heures</SelectItem>
                <SelectItem value="12">12 heures</SelectItem>
                <SelectItem value="24">24 heures</SelectItem>
                <SelectItem value="48">48 heures</SelectItem>
                <SelectItem value="72">72 heures</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || (profile.coins < listingFee)}
            className="bg-primary hover:bg-primary/90"
          >
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Créer (frais: {listingFee.toLocaleString()} 🪙)
            </div>
          </Button>
        </DialogFooter>
        {profile.coins < listingFee && (
          <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>Pièces insuffisantes. Il vous faut {listingFee.toLocaleString()} 🪙 pour les frais de mise.</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
