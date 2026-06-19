import React from "react";
import { TrendingUp, Users, Package, 
  Zap, Crown, Activity, Layers
} from "lucide-react";
import { RARITY_CONFIG } from "@/lib/gameData";

export default function PlayerStats({ profiles, cards, transactions, users }) {
  const totalCoins = profiles.reduce((s, p) => s + (p.coins || 0), 0);
  const totalGems = profiles.reduce((s, p) => s + (p.gems || 0), 0);
  const totalBoosters = profiles.reduce((s, p) => s + (p.boosters_opened || 0), 0);
  const avgCoins = profiles.length ? Math.round(totalCoins / profiles.length) : 0;
  const avgGems = profiles.length ? Math.round(totalGems / profiles.length) : 0;

  const rarityBreak = Object.keys(RARITY_CONFIG).reduce((acc, k) => {
    acc[k] = cards.filter(c => c.rarity === k).length;
    return acc;
  }, {});

  const txByType = transactions.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {});

  const topPlayers = [...profiles]
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 5)
    .map(p => ({
      ...p,
      user: users.find(u => u.id === p.created_by_id),
    }));

  const roleDistribution = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
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
        />
        <StatCard 
          label="Cartes en Circulation" 
          value={cards.length} 
          icon={Layers} 
          color="from-cyan-500 to-blue-600"
        />
        <StatCard 
          label="Boosters Ouverts" 
          value={totalBoosters} 
          icon={Package} 
          color="from-yellow-500 to-orange-600"
        />
        <StatCard 
          label="Transactions" 
          value={transactions.length} 
          icon={Activity} 
          color="from-green-500 to-emerald-600"
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
                <span className="text-2xl">📊</span>
                <span className="text-sm text-muted-foreground">Moy. pièces/joueur</span>
              </div>
              <span className="font-display text-lg font-bold">{avgCoins.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <span className="text-sm text-muted-foreground">Moy. gemmes/joueur</span>
              </div>
              <span className="font-display text-lg font-bold">{avgGems.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Top Players */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Crown className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="font-heading text-sm font-bold uppercase">Top 5 Joueurs</h3>
          </div>
          <div className="space-y-3">
            {topPlayers.map((player, idx) => (
              <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  idx === 1 ? 'bg-slate-400/20 text-slate-400' :
                  idx === 2 ? 'bg-orange-700/20 text-orange-600' :
                  'bg-primary/10 text-primary'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{player.user?.full_name || "Joueur"}</p>
                  <p className="text-xs text-muted-foreground">Niv. {Math.floor((player.xp || 0) / 100) + 1}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="font-bold text-sm">{(player.xp || 0).toLocaleString()} XP</span>
                </div>
              </div>
            ))}
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

      {/* Role Distribution */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-green-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="font-heading text-sm font-bold uppercase">Distribution des Rôles</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(roleDistribution).map(([role, count]) => {
            const roleConfig = {
              user: { label: "Utilisateurs", color: "bg-blue-500/10 text-blue-400" },
              vip: { label: "VIP", color: "bg-yellow-500/10 text-yellow-400" },
              moderator: { label: "Modérateurs", color: "bg-purple-500/10 text-purple-400" },
              admin: { label: "Admins", color: "bg-red-500/10 text-red-400" },
            }[role] || { label: role, color: "bg-gray-500/10 text-gray-400" };
            return (
              <div key={role} className={`p-4 rounded-xl ${roleConfig.color} text-center`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-semibold uppercase">{roleConfig.label}</p>
              </div>
            );
          })}
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

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${color} opacity-10 rounded-bl-full transition-opacity group-hover:opacity-20`} />
      <div className="relative">
        <Icon className={`w-5 h-5 mb-3 bg-gradient-to-br ${color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
        <p className="font-display text-3xl font-bold mb-1">{typeof value === "number" && value > 999 ? value.toLocaleString() : value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}