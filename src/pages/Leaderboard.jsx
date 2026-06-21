import React from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown } from "lucide-react";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import { PROFILE_TITLES } from "@/lib/achievements";

const getTitle = (titleId) => PROFILE_TITLES.find((title) => title.id === titleId)?.label || PROFILE_TITLES[0].label;

function LeaderboardRow({ player, rank }) {
  const isCurrentUser = player.isCurrentUser;
  
  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 rounded-xl border p-3 transition-all sm:gap-4 sm:p-4 ${
        isCurrentUser 
          ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10" 
          : "bg-card/50 border-border/50 hover:border-primary/20"
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/50 sm:h-12 sm:w-12">
        {getRankIcon(rank)}
      </div>
      {player.avatarUrl && <img src={player.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-xl border border-border object-cover sm:h-10 sm:w-10" />}

      <div className="flex-1 min-w-0">
        <div className="mb-1 flex min-w-0 items-center gap-1.5 sm:gap-2">
          <p className={`font-semibold truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
            {player.name}
          </p>
          {isCurrentUser && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
              TOI
            </span>
          )}
          {rank <= 3 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
              rank === 2 ? "bg-slate-500/20 text-slate-400" :
              "bg-amber-500/20 text-amber-600"
            }`}>
              TOP {rank}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground sm:text-xs">
          <span>Niveau {player.level}</span>
          <span>{player.collectionSize} cartes</span>
          <span>Puissance : {player.collectionPower.toLocaleString()}</span>
        </div>
        <p className="mt-1 text-[10px] font-semibold text-yellow-300">♛ {getTitle(player.titleId)}</p>
      </div>

      <div className="text-right shrink-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="font-display text-sm font-bold text-yellow-300 sm:text-lg">
            {player.score.toLocaleString()}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">points</p>
      </div>
    </motion.div>
  );
}

function StatBox({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-secondary/30 rounded-xl p-3 border border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className={`font-display text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function PodiumCard({ player, rank }) {
  const colors = {
    1: "from-yellow-500/20 to-amber-500/20 border-yellow-500/40",
    2: "from-slate-500/20 to-slate-400/20 border-slate-500/40",
    3: "from-amber-500/20 to-orange-500/20 border-amber-500/40"
  };

  const crownColors = {
    1: "text-yellow-400",
    2: "text-slate-400",
    3: "text-amber-600"
  };

  return (
    <div className={`flex min-h-40 flex-col items-center justify-end rounded-2xl border bg-gradient-to-br ${colors[rank]} p-2 sm:min-h-48 sm:p-4`}>
      <div className="mb-2 min-w-0 text-center sm:mb-3">
        {player.avatarUrl && <img src={player.avatarUrl} alt="" className="mx-auto mb-1 h-8 w-8 rounded-lg border-2 border-white/30 object-cover sm:h-11 sm:w-11 sm:rounded-xl" />}
        <Crown className={`mx-auto mb-1 h-5 w-5 sm:h-6 sm:w-6 ${crownColors[rank]}`} />
        <p className="max-w-[88px] truncate text-[11px] font-semibold sm:max-w-[120px] sm:text-sm">{player.name}</p>
        <p className="text-[9px] text-muted-foreground sm:text-xs">Niv. {player.level}</p>
        <p className="hidden max-w-[120px] truncate text-[9px] font-semibold text-yellow-300 sm:block">{getTitle(player.titleId)}</p>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <Trophy className={`w-4 h-4 ${crownColors[rank]}`} />
        <span className={`font-display text-xs font-bold sm:text-lg ${crownColors[rank]}`}>
          {player.score.toLocaleString()}
        </span>
      </div>
      <div className={`w-full rounded-lg bg-gradient-to-r py-1.5 sm:py-2 ${
        rank === 1 ? "from-yellow-500 to-amber-600" :
        rank === 2 ? "from-slate-500 to-slate-600" :
        "from-amber-500 to-orange-600"
      } text-center`}>
        <span className="text-xs font-bold text-white">#{rank}</span>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { data: leaderboardResponse, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => appClient.functions.invoke("getLeaderboard"),
    staleTime: 30_000,
  });
  const leaderboardData = leaderboardResponse?.data || [];

  const top3 = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
      <Navbar />
      <CurrencyBar />

      <div className="mx-auto max-w-4xl px-3 py-5 sm:px-4 sm:py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Classement des Joueurs</h1>
          </div>
          <p className="text-muted-foreground">
            Compète avec les autres joueurs et domine le classement !
          </p>
        </div>

        {top3.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading font-bold text-sm uppercase mb-4 text-center">🏆 Podium</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {top3[1] && <PodiumCard player={top3[1]} rank={2} />}
              {top3[0] && <PodiumCard player={top3[0]} rank={1} />}
              {top3[2] && <PodiumCard player={top3[2]} rank={3} />}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="font-heading font-bold text-sm uppercase mb-4">Classement Complet</h2>
          {rest.map((player) => (
            <LeaderboardRow key={player.id} player={player} rank={player.rank} />
          ))}
        </div>

        {isLoading && <p className="py-12 text-center text-muted-foreground">Calcul du classement...</p>}
        {!isLoading && leaderboardData.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun joueur pour le moment</p>
            <p className="text-sm text-muted-foreground/60 mt-2">Sois le premier à jouer !</p>
          </div>
        )}
      </div>
    </div>
  );
}
