import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, TrendingUp, Gift, Coins, Gem, 
  Sword, ShoppingBag, Gavel, Sparkles, BookOpen, 
  Trophy, Users, Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLevelFromXp, getTotalIncome } from "@/lib/gameData";

export default function Dashboard({ profile, cards, talents, quests }) {
  const levelInfo = getLevelFromXp(profile?.xp || 0);
  const xpPercent = (levelInfo.currentXp / levelInfo.xpToNext) * 100;
  const totalPower = cards.reduce((sum, c) => sum + (c.power || 0), 0);
  const incomeBonus = (talents.includes('economy_1') ? 0.05 : 0)
    + (talents.includes('economy_3') ? 0.10 : 0)
    + (talents.includes('economy_4') ? 0.10 : 0);
  const incomePerTick = getTotalIncome(cards, incomeBonus);
  const completedQuests = quests.filter(q => q.completed && !q.claimed).length;
  const legendaryCount = cards.filter(c => ['legendaire', 'secrète', 'manga_god'].includes(c.rarity)).length;

  const quickActions = [
    { path: "/boosters", icon: Package, label: "Boosters", color: "from-orange-500 to-red-500", description: "Ouvre des boosters" },
    { path: "/marketplace", icon: ShoppingBag, label: "Marché", color: "from-green-500 to-emerald-500", description: "Achète & vends" },
    { path: "/auctions", icon: Gavel, label: "Enchères", color: "from-purple-500 to-pink-500", description: "Enchéris maintenant" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border border-primary/30 p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="font-display text-2xl font-bold mb-2">
            Bienvenue, Collectionneur ! 👋
          </h1>
          <p className="text-muted-foreground mb-4">
            Prêt à étendre ta collection de cartes légendaires ?
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="px-3 py-1.5 border-yellow-500/30 bg-yellow-500/10">
              <Coins className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />
              <span className="font-bold text-yellow-300">{(profile?.coins || 0).toLocaleString()}</span>
            </Badge>
            <Badge variant="outline" className="px-3 py-1.5 border-cyan-500/30 bg-cyan-500/10">
              <Gem className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              <span className="font-bold text-cyan-300">{profile?.gems || 0}</span>
            </Badge>
            <Badge variant="outline" className="px-3 py-1.5 border-primary/30 bg-primary/10">
              <Star className="w-3.5 h-3.5 mr-1.5 text-primary" />
              <span className="font-bold">Niveau {levelInfo.level}</span>
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Level Progress */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Progression de Niveau
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-xl font-display font-bold text-white">{levelInfo.level}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">XP: {levelInfo.currentXp.toLocaleString()} / {levelInfo.xpToNext.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">{xpPercent.toFixed(1)}%</span>
              </div>
              <Progress value={xpPercent} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard 
          icon={Sword} 
          label="Puissance Totale" 
          value={totalPower.toLocaleString()} 
          color="text-red-400"
          bgColor="bg-red-500/10"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Revenus / 30s" 
          value={`+${incomePerTick.toLocaleString()}`} 
          color="text-yellow-400"
          bgColor="bg-yellow-500/10"
          highlight
        />
        <StatCard 
          icon={Star} 
          label="Cartes Rares" 
          value={legendaryCount} 
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
        <StatCard 
          icon={Gift} 
          label="Quêtes Prêtes" 
          value={completedQuests} 
          color="text-green-400"
          bgColor="bg-green-500/10"
          alert={completedQuests > 0}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Actions Rapides
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <Link key={action.path} to={action.path}>
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-4 h-full"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <action.icon className="w-8 h-8 mb-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                <h3 className="font-semibold text-sm mb-1">{action.label}</h3>
                <p className="text-[10px] text-muted-foreground">{action.description}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Income Info */}
      {incomePerTick > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Revenus Passifs Actifs</p>
                <p className="text-xs text-muted-foreground">
                  {cards.length} cartes génèrent des pièces automatiquement
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-yellow-300">+{incomePerTick.toLocaleString()} 🪙</p>
              <p className="text-[10px] text-muted-foreground">toutes les 30s</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* More Features */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/fusion" className="p-4 rounded-2xl border border-border bg-card/50 hover:bg-secondary/30 transition-colors">
          <Sparkles className="w-6 h-6 text-primary mb-2" />
          <h3 className="font-semibold text-sm">Fusion</h3>
          <p className="text-[10px] text-muted-foreground">Combine tes cartes</p>
        </Link>
        <Link to="/frames" className="p-4 rounded-2xl border border-border bg-card/50 hover:bg-secondary/30 transition-colors">
          <BookOpen className="w-6 h-6 text-accent mb-2" />
          <h3 className="font-semibold text-sm">Cadres</h3>
          <p className="text-[10px] text-muted-foreground">Personnalise tes cartes</p>
        </Link>
        <Link to="/talents" className="p-4 rounded-2xl border border-border bg-card/50 hover:bg-secondary/30 transition-colors">
          <Users className="w-6 h-6 text-green-400 mb-2" />
          <h3 className="font-semibold text-sm">Talents</h3>
          <p className="text-[10px] text-muted-foreground">Bonus passifs</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor, highlight, alert }) {
  return (
    <Card className={`border-border/50 ${highlight ? 'ring-2 ring-yellow-500/30' : ''} ${alert ? 'ring-2 ring-green-500/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
            <p className={`font-display text-lg font-bold ${color}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
