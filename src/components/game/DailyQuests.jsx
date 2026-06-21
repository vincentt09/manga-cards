import React, { useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Star, Coins, Gem, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getQuestsForPeriod, getExpiryDate, getPeriodKey } from "@/lib/questData";
import { useToast } from "@/components/ui/use-toast";

export default function DailyQuests({ profile, onCoinsEarned }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: quests = [], isLoading } = useQuery({
    queryKey: ["quests"],
    queryFn: () => appClient.entities.Quest.list("-created_date", 50),
  });

  // Initialize missing quests for today/this week
  const initMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const toCreate = [];

      for (const type of ["daily", "weekly"]) {
        const periodKey = getPeriodKey(type);
        const periodQuests = quests.filter(q => q.type === type && q.expires_at && !isExpired(q.expires_at));

        if (periodQuests.length === 0) {
          const definitions = getQuestsForPeriod(type);
          for (const def of definitions) {
            toCreate.push({
              ...def,
              type,
              progress: def.quest_id === "login_daily" ? 1 : 0,
              completed: def.quest_id === "login_daily",
              claimed: false,
              expires_at: getExpiryDate(type),
            });
          }
        }
      }

      if (toCreate.length > 0) {
        await appClient.entities.Quest.bulkCreate(toCreate);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quests"] }),
  });

  const claimMutation = useMutation({
    mutationFn: async (quest) => {
      return appClient.functions.invoke("claimQuest", { quest_id: quest.id });
    },
    onSuccess: (_, quest) => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: `✅ Quête accomplie !`,
        description: `+${quest.reward_coins.toLocaleString()} pièces${quest.reward_gems > 0 ? ` · +${quest.reward_gems} gemmes` : ""}`,
      });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Récompense non récupérée", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isLoading && profile) {
      const hasActive = quests.some(q => !isExpired(q.expires_at));
      if (!hasActive || quests.length === 0) {
        initMutation.mutate();
      }
    }
  }, [isLoading, profile]);

  const activeQuests = quests.filter(q => !isExpired(q.expires_at));
  const dailyQuests = activeQuests.filter(q => q.type === "daily");
  const weeklyQuests = activeQuests.filter(q => q.type === "weekly");

  const pendingClaims = activeQuests.filter(q => q.completed && !q.claimed).length;

  return (
    <div className="space-y-4">
      {pendingClaims > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-300 font-semibold">{pendingClaims} récompense{pendingClaims > 1 ? "s" : ""} à réclamer !</p>
        </motion.div>
      )}

      <QuestSection
        title="Quêtes Quotidiennes"
        icon="☀️"
        quests={dailyQuests}
        type="daily"
        onClaim={q => claimMutation.mutate(q)}
        claiming={claimMutation.isPending}
      />

      <QuestSection
        title="Quêtes Hebdomadaires"
        icon="📅"
        quests={weeklyQuests}
        type="weekly"
        onClaim={q => claimMutation.mutate(q)}
        claiming={claimMutation.isPending}
      />
    </div>
  );
}

function QuestSection({ title, icon, quests, type, onClaim, claiming }) {
  const timeLeft = getTimeLeft(type);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span>{icon}</span> {title}
        </h3>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" /> {timeLeft}
        </span>
      </div>

      {quests.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {quests.map((quest, i) => (
              <QuestCard key={quest.id} quest={quest} index={i} onClaim={onClaim} claiming={claiming} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function QuestCard({ quest, index, onClaim, claiming }) {
  const progressPct = Math.min((quest.progress / quest.target) * 100, 100);
  const isDone = quest.completed;
  const isClaimed = quest.claimed;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`p-3 rounded-xl border transition-all ${
        isClaimed ? "bg-secondary/20 border-border opacity-50"
        : isDone ? "bg-primary/5 border-primary/30"
        : "bg-secondary/30 border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isClaimed ? "bg-green-900/30" : isDone ? "bg-primary/20" : "bg-secondary"
        }`}>
          {isClaimed ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : isDone ? (
            <Star className="w-4 h-4 text-yellow-400" />
          ) : (
            <span className="text-[10px] font-bold text-muted-foreground">{quest.progress}/{quest.target}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isClaimed ? "text-muted-foreground line-through" : ""}`}>
            {quest.label}
          </p>
          <p className="text-[10px] text-muted-foreground">{quest.description}</p>

          {!isClaimed && (
            <div className="mt-2">
              <Progress value={progressPct} className="h-1.5" />
              <div className="flex items-center gap-2 mt-1.5">
                <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-semibold">
                  <Coins className="w-2.5 h-2.5" /> +{quest.reward_coins.toLocaleString()}
                </span>
                {quest.reward_gems > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-semibold">
                    <Gem className="w-2.5 h-2.5" /> +{quest.reward_gems}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {isDone && !isClaimed && (
          <Button size="sm" className="shrink-0 h-8 text-xs" onClick={() => onClaim(quest)} disabled={claiming}>
            Réclamer
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function isExpired(expiresAt) {
  return new Date(expiresAt) < new Date();
}

function getTimeLeft(type) {
  const now = new Date();
  let end;
  if (type === "daily") {
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else {
    end = new Date(now);
    const daysUntilSunday = 7 - now.getDay();
    end.setDate(now.getDate() + daysUntilSunday);
    end.setHours(23, 59, 59, 999);
  }
  const diff = end - now;
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}j restants`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins}min`;
}
