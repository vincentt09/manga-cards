import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Package, TrendingUp, DollarSign, Users, ShoppingCart, 
  Calendar, Search, Eye, Trash2,
  Coins, Gem
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



export default function InventoryDashboard({ listings, profiles, transactions }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedListing, setSelectedListing] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Calcul des revenus totaux
  const totalRevenue = transactions
    .filter(t => t.type === "buy" && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCoinsSpent = transactions
    .filter(t => t.type === "buy" && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Ventes actives par type
  const activeListings = listings.filter(l => l.status === "active");
  const soldListings = listings.filter(l => l.status === "sold");

  const filteredListings = activeListings.filter(listing => {
    if (!search) return true;
    return (
      listing.card_name?.toLowerCase().includes(search.toLowerCase()) ||
      listing.seller_name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Revenus par joueur
  const playerRevenue = profiles.map(profile => {
    const playerTxs = transactions.filter(t => 
      t.created_by_id === profile.created_by_id && t.type === "sell"
    );
    const totalEarned = playerTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalSpent = playerTxs.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return {
      profile,
      totalEarned,
      totalSpent,
      netRevenue: totalEarned - totalSpent,
      transactionCount: playerTxs.length,
    };
  }).filter(p => p.transactionCount > 0)
    .sort((a, b) => b.netRevenue - a.netRevenue);

  const handleCancelListing = async (listingId) => {
    try {
      await appClient.entities.LimitedCardListing.update(listingId, { status: "cancelled" });
      toast({
        title: "✅ Vente annulée",
        description: "La vente a été annulée avec succès",
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible d'annuler la vente",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Ventes Actives" 
          value={activeListings.length} 
          icon={Package} 
          color="from-blue-500 to-cyan-500"
          trend={`${soldListings.length} vendues`}
        />
        <StatCard 
          label="Revenu Total" 
          value={`${totalRevenue.toLocaleString()} 🪙`} 
          icon={DollarSign} 
          color="from-green-500 to-emerald-500"
          trend={`+${totalCoinsSpent.toLocaleString()} dépensés`}
        />
        <StatCard 
          label="Joueurs Actifs" 
          value={profiles.length} 
          icon={Users} 
          color="from-purple-500 to-pink-500"
        />
        <StatCard 
          label="Transactions" 
          value={transactions.length} 
          icon={ShoppingCart} 
          color="from-orange-500 to-red-500"
        />
      </div>

      {/* Top Players by Revenue */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
            </div>
            <h3 className="font-heading text-sm font-bold uppercase">Top Joueurs - Revenus</h3>
          </div>
        </div>
        <div className="space-y-3">
          {playerRevenue.slice(0, 5).map((player, idx) => (
            <div key={player.profile.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                idx === 1 ? 'bg-slate-400/20 text-slate-400' :
                idx === 2 ? 'bg-orange-700/20 text-orange-600' :
                'bg-primary/10 text-primary'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {player.profile.created_by_id ? `Joueur #${player.profile.created_by_id.slice(0, 8)}` : "Joueur"}
                </p>
                <p className="text-xs text-muted-foreground">{player.transactionCount} transactions</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-green-400">+{player.totalEarned.toLocaleString()} 🪙</p>
                <p className="text-xs text-muted-foreground">-{player.totalSpent.toLocaleString()} 🪙</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Listings */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="font-heading text-sm font-bold uppercase">Ventes de Cartes Uniques</h3>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-9 bg-secondary/30 border-border h-9 w-48" 
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredListings.slice(0, 10).map(listing => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-border bg-secondary/20 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {listing.card_image_url && (
                    <img 
                      src={listing.card_image_url} 
                      alt={listing.card_name}
                      className="w-16 h-20 object-cover rounded-lg border border-border"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base truncate">{listing.card_name}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        listing.card_rarity === 'legendary' ? 'bg-yellow-500/10 text-yellow-400' :
                        listing.card_rarity === 'secrète' ? 'bg-rose-500/10 text-rose-400' :
                        listing.card_rarity === 'manga_god' ? 'bg-cyan-500/10 text-cyan-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {listing.card_rarity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Vendu par {listing.seller_name} • {listing.quantity_remaining}/{listing.quantity_total} restants
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm font-bold text-yellow-400">
                        <Coins className="w-3 h-3" />
                        {listing.price_coins?.toLocaleString() || 0}
                      </div>
                      {listing.income_coins_per_30s > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <TrendingUp className="w-3 h-3" />
                          +{listing.income_coins_per_30s}/30s
                        </div>
                      )}
                      {listing.income_gems_per_hour > 0 && (
                        <div className="flex items-center gap-1 text-xs text-cyan-400">
                          <Gem className="w-3 h-3" />
                          +{listing.income_gems_per_hour}/h
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedListing(listing); setIsDialogOpen(true); }}
                    className="border-border hover:bg-primary/10 hover:text-primary"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune vente active trouvée</p>
          </div>
        )}
      </div>

      {/* Listing Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la vente</DialogTitle>
            <DialogDescription>
              Informations complètes sur cette vente limitée
            </DialogDescription>
          </DialogHeader>

          {selectedListing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/20 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">CARTE</p>
                  <p className="font-semibold">{selectedListing.card_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedListing.card_anime}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/20 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">VENDEUR</p>
                  <p className="font-semibold">{selectedListing.seller_name}</p>
                  <p className="text-xs text-muted-foreground">ID: {selectedListing.seller_id.slice(0, 8)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <p className="text-xs text-yellow-300">PRIX</p>
                  </div>
                  <p className="font-bold text-lg text-yellow-400">
                    {selectedListing.price_coins?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-blue-300">STOCK</p>
                  </div>
                  <p className="font-bold text-lg text-blue-400">
                    {selectedListing.quantity_remaining}/{selectedListing.quantity_total}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-green-300">VENDUS</p>
                  </div>
                  <p className="font-bold text-lg text-green-400">
                    {selectedListing.quantity_total - selectedListing.quantity_remaining}
                  </p>
                </div>
              </div>

              {selectedListing.card_power && (
                <div className="p-4 rounded-xl bg-secondary/20 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">STATISTIQUES</p>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{selectedListing.card_power}</p>
                      <p className="text-[10px] text-muted-foreground">POWER</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-400">{selectedListing.card_attack}</p>
                      <p className="text-[10px] text-muted-foreground">ATK</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{selectedListing.card_defense}</p>
                      <p className="text-[10px] text-muted-foreground">DEF</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{selectedListing.card_speed}</p>
                      <p className="text-[10px] text-muted-foreground">SPD</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-yellow-300 font-semibold">Créée le {new Date(selectedListing.created_date).toLocaleDateString('fr-FR')}</p>
                    <p className="text-[10px] text-yellow-200/70">ID: {selectedListing.id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Fermer
            </Button>
            {selectedListing?.status === "active" && (
              <Button 
                variant="destructive"
                onClick={() => handleCancelListing(selectedListing.id)}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Annuler la vente
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, trend }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${color} opacity-10 rounded-bl-full transition-opacity group-hover:opacity-20`} />
      <div className="relative">
        <Icon className={`w-5 h-5 mb-3 bg-gradient-to-br ${color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
        <p className="font-display text-2xl font-bold mb-1">{value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        {trend && (
          <p className="text-[10px] text-muted-foreground mt-2">{trend}</p>
        )}
      </div>
    </div>
  );
}