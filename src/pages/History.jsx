import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { History, ArrowUpRight, Package, Zap, Gift, ShoppingBag } from "lucide-react";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import { RARITY_CONFIG } from "@/lib/gameData";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const TX_CONFIG = {
  buy:     { icon: ShoppingBag, color: "text-red-400",    bg: "bg-red-500/10",    label: "Achat" },
  sell:    { icon: ArrowUpRight, color: "text-green-400", bg: "bg-green-500/10",  label: "Vente" },
  booster: { icon: Package,      color: "text-primary",   bg: "bg-primary/10",    label: "Booster" },
  upgrade: { icon: Zap,          color: "text-yellow-400",bg: "bg-yellow-500/10", label: "Amélioration" },
  reward:  { icon: Gift,         color: "text-accent",    bg: "bg-accent/10",     label: "Récompense" },
};

function TxRow({ tx, index }) {
  const cfg = TX_CONFIG[tx.type] || TX_CONFIG.reward;
  const Icon = cfg.icon;
  const isGain = tx.amount > 0;
  const rarity = tx.card_rarity ? RARITY_CONFIG[tx.card_rarity] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/50 hover:bg-secondary/40 transition-colors"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{tx.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          {rarity && (
            <span className={`text-[10px] font-semibold ${rarity.color}`}>{rarity.label}</span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {tx.created_date ? formatDistanceToNow(new Date(tx.created_date), { addSuffix: true, locale: fr }) : ""}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        {tx.amount !== 0 && (
          <p className={`font-bold text-sm ${isGain ? "text-green-400" : "text-red-400"}`}>
            {isGain ? "+" : ""}{tx.amount.toLocaleString()} 🪙
          </p>
        )}
        {tx.gems_amount !== 0 && tx.gems_amount != null && (
          <p className={`font-bold text-xs ${(tx.gems_amount > 0) ? "text-cyan-400" : "text-red-400"}`}>
            {tx.gems_amount > 0 ? "+" : ""}{tx.gems_amount} 💎
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: profiles = [] } = useQuery({
    queryKey: ["profile"],
    queryFn: () => appClient.entities.PlayerProfile.list(),
  });
  const { data: myCards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: () => appClient.entities.Card.list("-created_date", 100),
  });
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => appClient.entities.Transaction.list("-created_date", 100),
  });

  const profile = profiles[0];

  const filtered = typeFilter === "all" ? transactions : transactions.filter(t => t.type === typeFilter);

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
      <Navbar />
      <CurrencyBar profile={profile} cards={myCards} />

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-5">
          <History className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl font-bold tracking-wide">Historique</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { id: "all", label: "Tout" },
            { id: "booster", label: "Boosters" },
            { id: "buy", label: "Achats" },
            { id: "sell", label: "Ventes" },
            { id: "upgrade", label: "Améliorations" },
            { id: "reward", label: "Récompenses" },
          ].map(f => (
            <button key={f.id} onClick={() => setTypeFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${typeFilter === f.id ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">Aucune transaction</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Tes achats, ventes et ouvertures de boosters apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx, i) => <TxRow key={tx.id} tx={tx} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}