import React, { useMemo } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Package, Layers, Trophy, Zap, Crown, Coins, Gem, LogOut, Gift, ScrollText, BookOpen, History, Settings, MapPin, Link2 } from "lucide-react";
import { ACHIEVEMENTS, PROFILE_TITLES, getAchievementData } from "@/lib/achievements";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import StatsSkeleton from "@/components/ui/StatsSkeleton";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import LevelRewards from "@/components/game/LevelRewards";
import { LEVEL_REWARDS } from "@/lib/levelRewards";
import DailyQuests from "@/components/game/DailyQuests";
import { getLevelFromXp, RARITY_CONFIG } from "@/lib/gameData";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import ProfileCustomization, { BANNER_COLORS, PROFILE_THEMES } from "@/components/profile/ProfileCustomization";
import FriendsPanel from "@/components/profile/FriendsPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="game-panel rounded-xl p-4 transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`font-display text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function Profile() {
  const { user, checkUserAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => appClient.entities.PlayerProfile.list(),
  });

  const { data: cards = [], isLoading: isLoadingCards } = useQuery({
    queryKey: ["cards"],
    queryFn: () => appClient.entities.Card.list("-power", 200),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => appClient.entities.Transaction.list("-created_date", 500),
  });
  const { data: titleCatalogResponse } = useQuery({ queryKey: ["title_catalog"], queryFn: () => appClient.functions.invoke("getTitleCatalog") });

  const profile = profiles[0];
  const bannerGradient = BANNER_COLORS.find(banner => banner.id === profile?.banner_id)?.gradient || BANNER_COLORS[0].gradient;
  const profileTheme = PROFILE_THEMES.find(theme => theme.id === profile?.profile_theme) || PROFILE_THEMES[0];
  const avatarUrl = profile?.avatar_url || user?.avatar_url;
  const showcaseCards = (profile?.showcase_card_ids || []).map(id => cards.find(card => card.id === id)).filter(Boolean);
  const isLoading = isLoadingProfile || isLoadingCards;
  const levelInfo = getLevelFromXp(profile?.xp || 0);
  const xpPercent = (levelInfo.currentXp / levelInfo.xpToNext) * 100;

  const claimMutation = useMutation({
    mutationFn: (reward) => appClient.functions.invoke("claimLevelReward", { level: reward.level }),
    onSuccess: (_, reward) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: `🎁 Récompense niveau ${reward.level} réclamée !`,
        description: `+${reward.coins.toLocaleString()} pièces${reward.gems > 0 ? ` · +${reward.gems} gemmes` : ""}`,
      });
    },
  });

  const stats = useMemo(() => {
    const totalPower = cards.reduce((sum, c) => sum + (c.power || 0), 0);
    const maxLevel = cards.reduce((max, c) => Math.max(max, c.level || 1), 0);
    const rarityCount = Object.keys(RARITY_CONFIG).reduce((acc, k) => {
      acc[k] = cards.filter(c => c.rarity === k).length;
      return acc;
    }, {});
    return { totalPower, maxLevel, rarityCount };
  }, [cards]);

  const achievementData = getAchievementData({ cards, profile, playerLevel: levelInfo.level, transactions });
  const achievements = ACHIEVEMENTS.map(a => ({ ...a, done: a.check(achievementData) }));
  const customTitles = titleCatalogResponse?.data || [];
  const unlockedCount = achievements.filter(a => a.done).length;
  const unlockedTitleIds = new Set([
    "rookie",
    ...achievements.filter((achievement) => achievement.done).map((achievement) => `achievement_${achievement.id}`),
    ...customTitles.filter(title => title.unlocked).map(title => `custom_${title.id}`),
  ]);
  const allTitles = [...PROFILE_TITLES, ...customTitles.map(title => ({ id: `custom_${title.id}`, label: title.label }))];
  const equippedTitle = allTitles.find((title) => title.id === profile?.equipped_title_id && unlockedTitleIds.has(title.id)) || PROFILE_TITLES[0];

  const titleMutation = useMutation({
    mutationFn: (titleId) => appClient.functions.invoke("equipTitle", { title_id: titleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Titre équipé", description: "Ton nouveau titre est maintenant visible sur ton profil." });
    },
  });

  // Claimable rewards count
  const claimed = profile?.claimed_rewards || [];
  const claimableCount = LEVEL_REWARDS.filter(r => levelInfo.level >= r.level && !claimed.includes(r.level)).length;

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
      <Navbar />
      <CurrencyBar profile={profile} cards={cards} />

      <div className="mx-auto max-w-4xl space-y-6 px-3 py-5 sm:px-4 sm:py-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`game-panel overflow-hidden rounded-2xl bg-gradient-to-b ${profileTheme.card} ${profile?.profile_effect === "pulse" ? "animate-pulse" : ""}`}
          style={{ borderColor: `${profile?.accent_color || "#8b5cf6"}66`, boxShadow: profile?.profile_effect === "glow" ? `0 0 35px ${profile?.accent_color || "#8b5cf6"}44` : undefined }}>
          <div className={`h-28 bg-gradient-to-r ${bannerGradient} relative`}>
            {profile?.banner_url && <img src={profile.banner_url} alt="Bannière du profil" className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 shimmer" />
          </div>
          <div className="relative -mt-10 px-4 pb-5 sm:px-5">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center border-4 border-slate-950 overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar du joueur" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-white" />}
              <span className={`absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-slate-950 ${profile?.presence_style === "idle" ? "bg-yellow-400" : profile?.presence_style === "dnd" ? "bg-red-500" : profile?.presence_style === "invisible" ? "bg-slate-500" : "bg-emerald-400"}`} />
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2"><h1 className="break-words font-display text-xl font-bold" style={{ color: profile?.accent_color || undefined }}>{profile?.display_name || user?.full_name || "Joueur"}</h1>{profile?.pronouns && <span className="text-[10px] text-white/40">{profile.pronouns}</span>}</div>
                <div className="inline-flex items-center gap-1.5 mt-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-bold text-yellow-300">
                  <Crown className="w-3 h-3" /> {equippedTitle.label}
                </div>
                {profile?.status_text && <p className="mt-2 inline-block rounded-lg bg-white/5 px-2 py-1 text-xs">{profile?.status_emoji || "✨"} {profile.status_text}</p>}
                {profile?.favorite_anime && <p className="text-xs text-primary mt-1">Manga préféré : {profile.favorite_anime}</p>}
                {profile?.location && <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="h-3 w-3" />{profile.location}</p>}
                {profile?.bio && <p className="text-sm text-muted-foreground mt-2 max-w-xl">{profile.bio}</p>}
                {profile?.social_links?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{profile.social_links.map((link,index) => <a key={index} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] hover:bg-white/10"><Link2 className="h-3 w-3" />{link.label}</a>)}</div>}
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0" aria-label="Personnaliser le profil">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[94vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display">Personnaliser le Profil</DialogTitle>
                  </DialogHeader>
                  <ProfileCustomization profile={profile} user={user} cards={cards} onUpdated={checkUserAuth} />
                </DialogContent>
              </Dialog>
            </div>

            {showcaseCards.length > 0 && <div className="mt-5 border-t border-white/10 pt-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Vitrine de collection</p><div className="grid max-w-md grid-cols-3 gap-3">{showcaseCards.map(card => <div key={card.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/20"><img src={card.image_url} alt={card.name} className="aspect-[2/3] w-full object-cover object-top" /><p className="truncate p-1.5 text-center text-[9px] font-bold">{card.name}</p></div>)}</div></div>}

            {/* XP Bar */}
            <div className="game-chip mt-4 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-xs font-display font-bold text-white">{levelInfo.level}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Niveau {levelInfo.level}</p>
                    <p className="text-[10px] text-muted-foreground">XP total : {(profile?.xp || 0).toLocaleString()}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{levelInfo.currentXp} / {levelInfo.xpToNext} XP</span>
              </div>
              <Progress value={xpPercent} className="h-2.5" />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Prochain niveau : {(levelInfo.xpToNext - levelInfo.currentXp).toLocaleString()} XP restants
              </p>
            </div>
          </div>
        </motion.div>

        <FriendsPanel />

        {/* Stats Grid */}
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Layers} label="Cartes" value={cards.length} color="text-primary" />
            <StatCard icon={Package} label="Boosters" value={profile?.boosters_opened || 0} color="text-accent" />
            <StatCard icon={Zap} label="Puissance" value={stats.totalPower} color="text-red-400" />
            <StatCard icon={Crown} label="Légendaires" value={(stats.rarityCount.legendary || 0) + (stats.rarityCount.secret || 0)} color="text-yellow-400" />
          </div>
        )}

        {/* Currencies */}
        <div className="grid grid-cols-2 gap-3">
          <div className="game-panel flex min-w-0 items-center gap-2 rounded-2xl p-3 sm:gap-3 sm:p-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="break-all font-display text-xl font-bold text-yellow-300 sm:text-2xl">{(profile?.coins || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pièces</p>
            </div>
          </div>
          <div className="game-panel flex min-w-0 items-center gap-2 rounded-2xl p-3 sm:gap-3 sm:p-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Gem className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="break-all font-display text-xl font-bold text-cyan-300 sm:text-2xl">{profile?.gems || 0}</p>
              <p className="text-xs text-muted-foreground">Gemmes</p>
            </div>
          </div>
        </div>

        {/* Daily Quests */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="w-4 h-4 text-primary" />
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-muted-foreground">Quêtes</h2>
          </div>
          <DailyQuests profile={profile} />
        </div>

        {/* Level Rewards */}
        <div className="game-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Gift className="w-4 h-4" />Récompenses de Niveaux
            </h2>
            {claimableCount > 0 && (
              <span className="bg-primary text-white text-xs font-bold rounded-full px-2.5 py-0.5 animate-pulse">
                {claimableCount} à réclamer !
              </span>
            )}
          </div>
          <LevelRewards profile={profile} onClaim={(reward) => claimMutation.mutate(reward)} />
        </div>

        {/* Rarity Breakdown */}
        <div className="game-panel rounded-2xl p-5">
          <h2 className="font-heading font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground">Répartition par rareté</h2>
          <div className="space-y-3">
            {Object.entries(RARITY_CONFIG).reverse().map(([key, config]) => (
              <div key={key} className="flex items-center gap-3">
                <span className={`text-xs font-semibold w-20 ${config.color}`}>{config.label}</span>
                <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: cards.length > 0 ? `${((stats.rarityCount[key] || 0) / cards.length) * 100}%` : "0%" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                  />
                </div>
                <span className="text-xs font-bold w-8 text-right">{stats.rarityCount[key] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="game-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4" />Succès
            </h2>
            <span className="text-xs font-bold text-accent">{unlockedCount} / {achievements.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {achievements.map((a, i) => {
              const AIcon = a.icon;
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${a.done ? "bg-primary/5 border-primary/20" : "bg-secondary/30 border-border/30 opacity-50"}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.done ? "bg-primary/20" : "bg-secondary"}`}>
                    <AIcon className={`w-4 h-4 ${a.done ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${a.done ? "" : "text-muted-foreground"}`}>{a.label}</p>
                    <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                    <p className={`text-[10px] mt-0.5 ${a.done ? "text-yellow-300" : "text-muted-foreground"}`}>Titre : {a.label}</p>
                  </div>
                  {a.done && (
                    <Button
                      size="sm"
                      variant={equippedTitle.id === `achievement_${a.id}` ? "default" : "outline"}
                      className="ml-auto h-7 shrink-0 px-2 text-[10px]"
                      disabled={!profile || titleMutation.isPending || equippedTitle.id === `achievement_${a.id}`}
                      onClick={() => titleMutation.mutate(`achievement_${a.id}`)}
                    >
                      {equippedTitle.id === `achievement_${a.id}` ? "Équipé" : "Équiper"}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
          {customTitles.length > 0 && <>
            <div className="my-4 border-t border-border" />
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-yellow-300">Titres spéciaux créés par l’administration</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{customTitles.map(title => {
              const titleId = `custom_${title.id}`;
              const percent = Math.min(100, Math.round(Number(title.progress || 0) / Math.max(1, Number(title.required || 1)) * 100));
              return <div key={title.id} className={`rounded-xl border p-3 ${title.unlocked ? "border-yellow-500/25 bg-yellow-500/5" : "border-border/40 bg-secondary/20 opacity-65"}`}>
                <div className="flex items-start gap-3"><span className="text-2xl">{title.icon || "👑"}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{title.label}</p><p className="text-[10px] text-muted-foreground">{title.description}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-400" style={{ width: `${percent}%` }} /></div><p className="mt-1 text-[9px] text-muted-foreground">{Number(title.progress || 0).toLocaleString()} / {Number(title.required || 1).toLocaleString()}</p></div>{title.unlocked && <Button size="sm" variant={equippedTitle.id === titleId ? "default" : "outline"} className="h-7 shrink-0 px-2 text-[10px]" disabled={titleMutation.isPending || equippedTitle.id === titleId} onClick={() => titleMutation.mutate(titleId)}>{equippedTitle.id === titleId ? "Équipé" : "Équiper"}</Button>}</div>
              </div>;
            })}</div>
          </>}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/encyclopedia" className="game-panel flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-1 hover:border-primary/40">
            <BookOpen className="w-5 h-5 text-accent" />
            <div>
              <p className="font-semibold text-sm">Encyclopédie</p>
              <p className="text-[10px] text-muted-foreground">Toutes les cartes</p>
            </div>
          </Link>
          <Link to="/history" className="game-panel flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-1 hover:border-primary/40">
            <History className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Historique</p>
              <p className="text-[10px] text-muted-foreground">Transactions</p>
            </div>
          </Link>
        </div>

        <Button variant="outline" className="w-full" onClick={() => appClient.auth.logout()}>
          <LogOut className="w-4 h-4 mr-2" />Déconnexion
        </Button>
      </div>
    </div>
  );
}
