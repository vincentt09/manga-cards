import React from "react";
import { Coins, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EconomyPanel({ stats }) {
  if (!stats) return null;

  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          Économie du Jeu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-muted-foreground">Pièces en circulation</span>
          </div>
          <span className="text-sm font-bold text-yellow-400">
            {(stats.total_coins_in_circulation || 0).toLocaleString()} 🪙
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-muted-foreground">Revenus boosters</span>
          </div>
          <span className="text-sm font-bold text-green-400">
            {(stats.total_booster_revenue || 0).toLocaleString()} 🪙
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Frais collectés</span>
          </div>
          <span className="text-sm font-bold text-primary">
            {(stats.total_auction_fees || 0).toLocaleString()} 🪙
          </span>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Taux de frais :</span>
            <div className="flex gap-3">
              <span className="text-yellow-400 font-semibold">Mise: 5%</span>
              <span className="text-yellow-400 font-semibold">Vente: 10%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}