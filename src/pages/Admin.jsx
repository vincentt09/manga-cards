import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Image as ImageIcon, BarChart3, Coins, Package, Layers,
  Search, Crown, Trash2, AlertTriangle, TrendingUp, Activity, Zap, Save, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { RARITY_CONFIG } from "@/lib/gameData";
import Navbar from "@/components/game/Navbar";
import { Navigate } from "react-router-dom";
import CardManager from "@/components/admin/CardManager";
import DuplicateCleanup from "@/components/admin/DuplicateCleanup";
import ResetAllCardsButton from "@/components/admin/ResetAllCardsButton";
import UserManagement from "@/components/admin/UserManagement";
import GlobalStats from "@/components/admin/GlobalStats";
import InventoryDashboard from "@/components/admin/InventoryDashboard";
import AnimeCollectionsManager from "@/components/admin/AnimeCollectionsManager";
import DropEventsManager from "@/components/admin/DropEventsManager";
import FramesManager from "@/components/admin/FramesManager";

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "stats",     label: "Vue d'ensemble", icon: BarChart3 },
  { id: "users",     label: "Utilisateurs",   icon: Users },
  { id: "inventory", label: "Stocks & Ventes",icon: Package },
  { id: "players",   label: "Joueurs",        icon: Shield },
  { id: "cards",     label: "Cartes",         icon: ImageIcon },
  { id: "collections", label: "Collections",  icon: Package },
  { id: "events",    label: "Événements",     icon: Zap },
  { id: "frames",    label: "Cadres",         icon: Crown },
  { id: "economy",   label: "Économie",       icon: Coins },
];

// ─── Cleanup Duplicate Cards Function ─────────────────────────────────────────
async function cleanupDuplicateCards() {
  const response = await appClient.functions.invoke('cleanupDuplicateCards', {});
  return response.data;
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────
function StatsOverview({ profiles, cards, transactions }) {
  const totalCoins = profiles.reduce((s, p) => s + (p.coins || 0), 0);
  const totalGems  = profiles.reduce((s, p) => s + (p.gems || 0), 0);
  const totalBoostersOpened = profiles.reduce((s, p) => s + (p.boosters_opened || 0), 0);

  const rarityBreak = Object.keys(RARITY_CONFIG).reduce((acc, k) => {
    acc[k] = cards.filter(c => c.rarity === k).length;
    return acc;
  }, {});

  const txByType = transactions.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Joueurs Actifs" 
          value={profiles.length} 
          icon={Users} 
          color="from-primary to-accent"
          trend="+12%"
        />
        <StatCard 
          label="Cartes en Circulation" 
          value={cards.length} 
          icon={Layers} 
          color="from-cyan-500 to-blue-600"
          trend="+24%"
        />
        <StatCard 
          label="Boosters Ouverts" 
          value={totalBoostersOpened} 
          icon={Package} 
          color="from-yellow-500 to-orange-600"
          trend="+8%"
        />
        <StatCard 
          label="Transactions" 
          value={transactions.length} 
          icon={Activity} 
          color="from-green-500 to-emerald-600"
          trend="+15%"
        />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Economy Overview */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
            </div>
            <h3 className="font-heading text-sm font-bold uppercase">Économie Globale</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🪙</span>
                <span className="text-sm text-muted-foreground">Pièces en circulation</span>
              </div>
              <span className="font-display text-lg font-bold text-yellow-300">{totalCoins.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <span className="text-sm text-muted-foreground">Gemmes en circulation</span>
              </div>
              <span className="font-display text-lg font-bold text-cyan-300">{totalGems.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <span className="text-sm text-muted-foreground">Moy. boosters/joueur</span>
              </div>
              <span className="font-display text-lg font-bold">{profiles.length ? Math.round(totalBoostersOpened / profiles.length) : 0}</span>
            </div>
          </div>
        </div>

        {/* Rarity Distribution */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="font-heading text-sm font-bold uppercase">Distribution par Rareté</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(rarityBreak).reverse().map(([rarity, count]) => {
              const cfg = RARITY_CONFIG[rarity];
              const percentage = cards.length > 0 ? Math.round((count / cards.length) * 100) : 0;
              return (
                <div key={rarity} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
                    <span className="font-bold text-muted-foreground">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction Stats */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="font-heading text-sm font-bold uppercase">Transactions par Type</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(txByType).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2 bg-secondary/30 rounded-xl px-4 py-2.5 text-sm border border-border/50">
              <span className="font-semibold capitalize">{type}</span>
              <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, trend }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${color} opacity-10 rounded-bl-full transition-opacity group-hover:opacity-20`} />
      <div className="relative">
        <Icon className={`w-5 h-5 mb-3 bg-gradient-to-br ${color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
        <p className="font-display text-3xl font-bold mb-1">{typeof value === "number" && value > 999 ? value.toLocaleString() : value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        {trend && (
          <p className="text-[10px] text-green-400 mt-2 font-semibold">{trend}</p>
        )}
      </div>
    </div>
  );
}

// ─── Players Tab ──────────────────────────────────────────────────────────────
function PlayersTab({ profiles, users, onEditCoins, onResetPlayer }) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editCoins, setEditCoins] = useState("");

  const displayed = profiles.filter(p => {
    const user = users.find(u => u.id === p.created_by_id);
    if (!search) return true;
    const name = user?.full_name || "";
    const email = user?.email || "";
    return name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Rechercher un joueur..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="pl-11 bg-secondary/30 border-border h-11" 
        />
      </div>

      <div className="space-y-3">
        {displayed.map(profile => {
          const user = users.find(u => u.id === profile.created_by_id);
          const isEditing = editingId === profile.id;

          return (
            <div key={profile.id} className="p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg">
                    <span className="text-sm font-bold text-white">{(user?.full_name || "?")[0].toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base truncate">{user?.full_name || "Joueur inconnu"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || profile.created_by_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-9 px-3 text-xs border-border hover:bg-primary/10 hover:text-primary" 
                    onClick={() => { setEditingId(profile.id); setEditCoins(String(profile.coins || 0)); }}
                  >
                    <Coins className="w-3.5 h-3.5 mr-1.5" />Modifier
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-9 px-3 text-destructive hover:bg-destructive/10" 
                    onClick={() => onResetPlayer(profile)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Badge icon="🪙" value={(profile.coins || 0).toLocaleString()} color="bg-yellow-500/10 text-yellow-300" />
                <Badge icon="💎" value={profile.gems || 0} color="bg-cyan-500/10 text-cyan-300" />
                <Badge icon="⚡" value={`XP ${(profile.xp || 0).toLocaleString()}`} color="bg-primary/10 text-primary" />
                <Badge icon="📦" value={`${profile.boosters_opened || 0} boosters`} color="bg-secondary/50 text-muted-foreground" />
              </div>

              {isEditing && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Input 
                    type="number" 
                    value={editCoins} 
                    onChange={e => setEditCoins(e.target.value)}
                    placeholder="Nouveau solde de pièces" 
                    className="flex-1 h-10 bg-secondary/30" 
                  />
                  <Button 
                    size="sm" 
                    className="h-10 px-4 bg-primary hover:bg-primary/90" 
                    onClick={() => { onEditCoins(profile, Number(editCoins)); setEditingId(null); }}
                  >
                    <Save className="w-4 h-4 mr-1.5" />Sauvegarder
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-10 px-4" 
                    onClick={() => setEditingId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Badge({ icon, value, color }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${color}`}>
      <span>{icon}</span>
      <span>{value}</span>
    </div>
  );
}

// ─── Economy Tab ──────────────────────────────────────────────────────────────
function EconomyTab({ profiles, onGiveCoinsAll, onGiveGemsAll }) {
  const [coins, setCoins] = useState("");
  const [gems, setGems] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🪙</span>
            <h3 className="font-heading font-bold text-sm">Donner des pièces à tous</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Ajoute un montant de pièces au solde de chaque joueur.</p>
          <div className="flex gap-2">
            <Input 
              type="number" 
              placeholder="ex: 1000" 
              value={coins} 
              onChange={e => setCoins(e.target.value)} 
              className="bg-secondary/30 h-11" 
            />
            <Button 
              onClick={() => { onGiveCoinsAll(Number(coins)); setCoins(""); }} 
              disabled={!coins || Number(coins) <= 0}
              className="h-11 px-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold"
            >
              Donner à tous
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">💎</span>
            <h3 className="font-heading font-bold text-sm">Donner des gemmes à tous</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Ajoute des gemmes au solde de chaque joueur.</p>
          <div className="flex gap-2">
            <Input 
              type="number" 
              placeholder="ex: 10" 
              value={gems} 
              onChange={e => setGems(e.target.value)} 
              className="bg-secondary/30 h-11" 
            />
            <Button 
              onClick={() => { onGiveGemsAll(Number(gems)); setGems(""); }} 
              disabled={!gems || Number(gems) <= 0}
              className="h-11 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold"
            >
              Donner à tous
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h3 className="font-heading font-bold text-sm text-destructive">Zone sensible</h3>
        </div>
        <p className="text-xs text-muted-foreground">Les actions économiques sont irréversibles. Agis avec précaution.</p>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("stats");

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: () => appClient.entities.PlayerProfile.list("-created_date", 200),
  });
  const { data: users = [] } = useQuery({
    queryKey: ["admin_users"],
    queryFn: () => appClient.entities.User.list(),
  });
  const { data: cards = [] } = useQuery({
    queryKey: ["admin_cards"],
    queryFn: () => appClient.entities.Card.list("-created_date", 500),
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ["admin_transactions"],
    queryFn: () => appClient.entities.Transaction.list("-created_date", 500),
  });
  const { data: overrides = [] } = useQuery({
    queryKey: ["card_overrides"],
    queryFn: () => appClient.entities.CardImageOverride.list(),
  });
  const { data: cardDefinitions = [] } = useQuery({
    queryKey: ["card_definitions"],
    queryFn: () => appClient.entities.CardDefinition.list("anime"),
  });
  const { data: listings = [] } = useQuery({
    queryKey: ["admin_listings"],
    queryFn: () => appClient.entities.LimitedCardListing.list("-created_date", 200),
  });

  // Guard: admin only
  if (user && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const handleSaveImageOverride = async (cardId, cardName, imageUrl) => {
    await appClient.functions.invoke("setCardImage", { card_id: cardId, image_url: imageUrl });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["card_overrides"] }),
      queryClient.invalidateQueries({ queryKey: ["cardImageOverrides"] }),
      queryClient.invalidateQueries({ queryKey: ["cards"] }),
      queryClient.invalidateQueries({ queryKey: ["card_definitions"] }),
      queryClient.invalidateQueries({ queryKey: ["all_cards_for_preview"] }),
    ]);
    toast({ title: "✅ Image sauvegardée", description: `${cardName} est synchronisée partout dans le jeu.` });
  };

  const handleResetImageOverride = async (cardId) => {
    await appClient.functions.invoke("clearCardImage", { card_id: cardId });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["card_overrides"] }),
      queryClient.invalidateQueries({ queryKey: ["cardImageOverrides"] }),
      queryClient.invalidateQueries({ queryKey: ["cards"] }),
      queryClient.invalidateQueries({ queryKey: ["card_definitions"] }),
    ]);
    toast({ title: "🔄 Image réinitialisée partout" });
  };

  const handleEditCoins = async (profile, newCoins) => {
    await appClient.entities.PlayerProfile.update(profile.id, { coins: newCoins });
    queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
    toast({ title: `💰 Coins mis à jour`, description: `Nouveau solde : ${newCoins.toLocaleString()} pièces` });
  };

  const handleResetPlayer = async (profile) => {
    if (!window.confirm("Réinitialiser ce joueur ? Cette action est irréversible.")) return;
    await appClient.entities.PlayerProfile.update(profile.id, { coins: 500, gems: 10, xp: 0, boosters_opened: 0, total_cards: 0, boosters_count: {}, pity_counter: 0, claimed_rewards: [] });
    queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
    toast({ title: "🔄 Joueur réinitialisé" });
  };

  const handleGiveCoinsAll = async (amount) => {
    await Promise.all(profiles.map(p => appClient.entities.PlayerProfile.update(p.id, { coins: (p.coins || 0) + amount })));
    queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
    toast({ title: `🪙 +${amount.toLocaleString()} pièces donnés à ${profiles.length} joueurs` });
  };

  const handleGiveGemsAll = async (amount) => {
    await Promise.all(profiles.map(p => appClient.entities.PlayerProfile.update(p.id, { gems: (p.gems || 0) + amount })));
    queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
    toast({ title: `💎 +${amount} gemmes donnés à ${profiles.length} joueurs` });
  };

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14 bg-gradient-to-b from-background to-background/80">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border bg-card/50 backdrop-blur-sm">
          <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl sm:text-3xl font-bold mb-1">Espace Admin</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Connecté en tant que {user?.email}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 border border-primary/20">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">ADMINISTRATEUR</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-[calc(3.75rem+env(safe-area-inset-top))] z-30 -mx-4 mb-6 flex gap-2 overflow-x-auto border-y border-border/50 bg-background/90 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:flex-wrap sm:border-0 sm:bg-transparent sm:p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)}
                className={`shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  tab === t.id 
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20" 
                    : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-border/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={tab} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "stats"    && (
              <>
                <GlobalStats profiles={profiles} cards={cards} transactions={transactions} users={users} listings={listings} />
                <div className="mt-6 space-y-4">
                  <DuplicateCleanup onComplete={() => queryClient.invalidateQueries({ queryKey: ["admin_cards"] })} />
                  <ResetAllCardsButton onComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ["admin_cards"] });
                    queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
                  }} />
                </div>
              </>
            )}
            {tab === "users"    && <UserManagement users={users} profiles={profiles} currentUser={user} onUserUpdate={() => Promise.all([queryClient.invalidateQueries({ queryKey: ["admin_users"] }), queryClient.invalidateQueries({ queryKey: ["admin_profiles"] })])} />}
            {tab === "inventory" && <InventoryDashboard listings={listings} profiles={profiles} transactions={transactions} />}
            {tab === "players"  && <PlayersTab profiles={profiles} users={users} onEditCoins={handleEditCoins} onResetPlayer={handleResetPlayer} />}
            {tab === "cards"    && <CardManager cardDefinitions={cardDefinitions} overrides={overrides} onSave={handleSaveImageOverride} onReset={handleResetImageOverride} />}
            {tab === "collections" && <AnimeCollectionsManager />}
            {tab === "events"   && <DropEventsManager />}
            {tab === "frames"   && <FramesManager />}
            {tab === "economy"  && <EconomyTab profiles={profiles} onGiveCoinsAll={handleGiveCoinsAll} onGiveGemsAll={handleGiveGemsAll} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
