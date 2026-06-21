import React from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, Lock, Check, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import { TALENT_TREE, getTalent } from "@/lib/talentData";
import { getLevelFromXp } from "@/lib/gameData";
import { LEVEL_REWARDS } from "@/lib/levelRewards";

export default function Talents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profiles = [] } = useQuery({
    queryKey: ["profile"],
    queryFn: () => appClient.entities.PlayerProfile.list(),
  });

  const { data: talents = [] } = useQuery({
    queryKey: ["talents"],
    queryFn: () => appClient.entities.PlayerTalent.list(),
  });

  const profile = profiles[0];
  const playerLevel = getLevelFromXp(profile?.xp || 0).level;
  const unlockedTalentIds = new Set(talents.filter(t => t.is_unlocked).map(t => t.talent_id));
  const nextTalentReward = LEVEL_REWARDS.find((reward) => reward.talentPoints > 0 && reward.level > playerLevel);

  const unlockTalent = useMutation({
    mutationFn: (talentId) => appClient.functions.invoke("unlockTalent", { talent_id: talentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["talents"] });
      toast({ title: "✅ Talent débloqué !", description: "Bonus actif immédiatement" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const canUnlock = (talent) => {
    if (!profile) return false;
    if (unlockedTalentIds.has(talent.id)) return false;
    if ((profile.talent_points || 0) < talent.cost) return false;
    if (playerLevel < talent.minLevel) return false;
    for (const prereq of talent.prerequisites) {
      if (!unlockedTalentIds.has(prereq)) return false;
    }
    return true;
  };

  const isLocked = (talent) => {
    if (playerLevel < talent.minLevel) return true;
    for (const prereq of talent.prerequisites) {
      if (!unlockedTalentIds.has(prereq)) return true;
    }
    return false;
  };

  if (!profile) {
    return (
      <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
      <Navbar />
      <CurrencyBar profile={profile} cards={[]} />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Arbre de Talents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Débloque des bonus passifs pour améliorer ta collection
          </p>
          <div className="flex items-center gap-2 mt-3 bg-secondary/50 rounded-xl p-3 w-fit">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Points disponibles : </span>
            <span className="text-lg font-bold text-primary">{profile.talent_points || 0}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Les points sont obtenus dans les récompenses de niveau. Un arbre complet demande 10 points.
          </p>
          {nextTalentReward && <p className="mt-1 text-xs font-semibold text-primary">Prochain point au niveau {nextTalentReward.level}.</p>}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {Object.values(TALENT_TREE).map((branch, branchIdx) => (
            <motion.div
              key={branch.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: branchIdx * 0.1 }}
              className={`rounded-2xl border-2 overflow-hidden bg-gradient-to-b ${branch.color}`}
            >
              <div className="p-4 bg-black/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{branch.icon}</span>
                  <h2 className="font-display font-bold text-lg text-white">{branch.name}</h2>
                </div>
                <p className="text-xs text-white/70">{branch.description}</p>
              </div>

              <div className="p-4 space-y-3 bg-card/50">
                {branch.talents.map((talent, idx) => {
                  const isUnlocked = unlockedTalentIds.has(talent.id);
                  const locked = !isUnlocked && isLocked(talent);
                  const canAfford = canUnlock(talent);

                  return (
                    <motion.div
                      key={talent.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: branchIdx * 0.1 + idx * 0.05 }}
                      className={`relative p-3 rounded-xl border ${
                        isUnlocked
                          ? "bg-primary/10 border-primary/30"
                          : locked
                          ? "bg-muted/30 border-border opacity-50"
                          : "bg-secondary/50 border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold text-sm ${isUnlocked ? "text-primary" : "text-foreground"}`}>
                            {talent.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{talent.description}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <Coins className="w-3 h-3 text-primary" />
                            <span className="text-xs font-bold text-primary">{talent.cost} pts</span>
                            <span className="text-xs text-muted-foreground ml-2">Niv. {talent.minLevel}</span>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                        ) : locked ? (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!canAfford || unlockTalent.isPending}
                            onClick={() => unlockTalent.mutate(talent.id)}
                            className="text-xs px-3"
                          >
                            {unlockTalent.isPending && unlockTalent.variables === talent.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              "Débloquer"
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Active bonuses summary */}
        {unlockedTalentIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 rounded-xl bg-secondary/30 border border-border"
          >
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              Bonus actifs
            </h3>
            <div className="grid md:grid-cols-2 gap-2">
              {Array.from(unlockedTalentIds).map(talentId => {
                const talent = getTalent(talentId);
                return talent ? (
                  <div key={talentId} className="text-xs flex items-center gap-2">
                    <span className="text-primary">✦</span>
                    <span>{talent.name}</span>
                    <span className="text-muted-foreground">— {talent.description}</span>
                  </div>
                ) : null;
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
