import React from "react";
import { motion } from "framer-motion";
import { Coins, Gem, Star, Gift, Lock, CheckCircle2 } from "lucide-react";
import { getLevelFromXp } from "@/lib/gameData";
import { LEVEL_REWARDS } from "@/lib/levelRewards";

export default function LevelRewards({ profile, onClaim }) {
  if (!profile) return null;
  const { level: currentLevel } = getLevelFromXp(profile.xp || 0);
  const claimed = profile.claimed_rewards || [];

  return (
    <div className="space-y-2">
      {LEVEL_REWARDS.map((reward) => {
        const isUnlocked = currentLevel >= reward.level;
        const isClaimed = claimed.includes(reward.level);
        const isClaimable = isUnlocked && !isClaimed;

        return (
          <motion.div
            key={reward.level}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              isClaimed ? "bg-secondary/20 border-border opacity-60" :
              isClaimable ? "bg-primary/5 border-primary/30 shadow-sm shadow-primary/10" :
              "bg-secondary/20 border-border opacity-40"
            }`}
          >
            {/* Level badge */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 font-display font-bold text-sm ${
              isClaimed ? "border-green-500/50 bg-green-500/10 text-green-400" :
              isClaimable ? "border-primary/60 bg-primary/20 text-primary animate-pulse" :
              "border-border bg-secondary text-muted-foreground"
            }`}>
              {isClaimed ? <CheckCircle2 className="w-5 h-5" /> : reward.level}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isClaimable ? "text-foreground" : "text-muted-foreground"}`}>
                {reward.label}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {reward.coins > 0 && (
                  <span className="text-[10px] flex items-center gap-0.5 text-yellow-400 font-semibold">
                    <Coins className="w-3 h-3" />+{reward.coins.toLocaleString()}
                  </span>
                )}
                {reward.gems > 0 && (
                  <span className="text-[10px] flex items-center gap-0.5 text-cyan-400 font-semibold">
                    <Gem className="w-3 h-3" />+{reward.gems}
                  </span>
                )}
                {reward.talentPoints > 0 && (
                  <span className="text-[10px] flex items-center gap-0.5 text-primary font-semibold">
                    <Star className="w-3 h-3" />+{reward.talentPoints} pts
                  </span>
                )}
              </div>
            </div>

            {/* Action */}
            {isClaimed ? (
              <span className="text-[10px] text-green-400 font-semibold shrink-0">Réclamé</span>
            ) : isClaimable ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onClaim(reward)}
                className="shrink-0 flex items-center gap-1.5 bg-primary text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                <Gift className="w-3.5 h-3.5" />Réclamer
              </motion.button>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-xs">Niv.{reward.level}</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
