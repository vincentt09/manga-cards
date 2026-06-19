import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Coins } from "lucide-react";

export default function BidModal({ auction, currentCoins, onConfirm, onClose }) {
  const [bidAmount, setBidAmount] = useState("");
  const minBid = auction.current_bid + Math.ceil(auction.current_bid * 0.1);

  useEffect(() => {
    setBidAmount(minBid.toString());
  }, [minBid]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(bidAmount.replace(/,/g, ""));
    if (amount >= minBid && amount <= currentCoins) {
      onConfirm(auction, amount);
    }
  };

  const isValidBid = parseInt(bidAmount) >= minBid;
  const canAfford = parseInt(bidAmount) <= currentCoins;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            Enchérir sur {auction.card_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Mise actuelle: <span className="text-yellow-400 font-bold">{auction.current_bid.toLocaleString()} 🪙</span>
            </label>
            <label className="text-sm text-muted-foreground">
              Mise minimum: <span className="text-accent font-bold">{minBid.toLocaleString()} 🪙</span>
            </label>
          </div>

          <div className="relative">
            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
            <Input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="pl-9 bg-secondary/50 border-border h-11 text-lg font-semibold"
              min={minBid}
              max={currentCoins}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Vos pièces: <span className="text-foreground font-medium">{currentCoins.toLocaleString()}</span>
          </div>

          {!isValidBid && (
            <p className="text-sm text-red-400">
              La mise doit être au minimum de {minBid.toLocaleString()} 🪙
            </p>
          )}

          {!canAfford && (
            <p className="text-sm text-red-400">
              Vous n'avez pas assez de pièces
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!isValidBid || !canAfford}
              className="bg-primary hover:bg-primary/90"
            >
              Confirmer l'enchère
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}