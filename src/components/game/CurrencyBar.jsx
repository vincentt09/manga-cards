import React, { useState, useEffect, useRef } from "react";
import { Coins, Gem, TrendingUp } from "lucide-react";
import { getLevelFromXp, getTotalIncome } from "@/lib/gameData";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

const TICK_MS = 60000;

export default function CurrencyBar({ profile, cards = [], unlockedTalents = [] }) {
  const { level, currentXp, xpToNext } = getLevelFromXp(profile?.xp || 0);
  const xpPercent = (currentXp / xpToNext) * 100;

  // Calculate income with talent bonuses
  const talentBonus = (unlockedTalents.includes('economy_1') ? 0.05 : 0)
    + (unlockedTalents.includes('economy_3') ? 0.10 : 0)
    + (unlockedTalents.includes('economy_4') ? 0.10 : 0);
  const incomePerTick = getTotalIncome(cards, talentBonus, level);

  // Animated coin counter with smooth interpolation
  const [displayCoins, setDisplayCoins] = useState(profile?.coins || 0);
  const targetRef = useRef(profile?.coins || 0);

  useEffect(() => {
    const startCoins = displayCoins;
    const targetCoins = profile?.coins || 0;
    const diff = targetCoins - startCoins;
    
    if (diff === 0) return;
    
    const duration = 1000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setDisplayCoins(Math.floor(startCoins + diff * easeProgress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [profile?.coins]);

  // Show +income popup every minute
  const [showIncome, setShowIncome] = useState(false);
  useEffect(() => {
    if (!profile || incomePerTick <= 0 || cards.length === 0) return;
    const interval = setInterval(() => {
      setShowIncome(true);
      setTimeout(() => setShowIncome(false), 1800);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [incomePerTick, cards.length, profile]);

  if (!profile) return null;

  return (
    <div className="sticky top-14 z-30 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-2.5">
        <div className="flex items-center gap-4">
          {/* Level Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <span className="text-xs font-display font-bold text-white">{level}</span>
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Niveau</p>
              <Progress value={xpPercent} className="h-1.5 w-20" />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Passive income indicator */}
            {incomePerTick > 0 && (
              <motion.div 
                className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-full px-3 py-1.5 relative shadow-lg shadow-yellow-500/10"
                animate={{ 
                  boxShadow: ['0 0 10px rgba(234, 179, 8, 0.2)', '0 0 20px rgba(234, 179, 8, 0.4)', '0 0 10px rgba(234, 179, 8, 0.2)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
                </motion.div>
                <span className="text-xs font-bold text-yellow-300" title="12 meilleures cartes + niveaux + talents économiques">+{incomePerTick.toLocaleString()}/min</span>
                <AnimatePresence>
                  {showIncome && (
                    <motion.span
                      key="pop"
                      initial={{ opacity: 1, y: 0, scale: 0.8 }}
                      animate={{ opacity: 0, y: -24, scale: 1.2 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-yellow-300 pointer-events-none whitespace-nowrap drop-shadow-lg"
                    >
                      +{incomePerTick.toLocaleString()} 🪙
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            <div className="flex items-center gap-1.5 bg-secondary/50 rounded-full px-3 py-1.5 relative">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold">{(displayCoins || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-secondary/50 rounded-full px-3 py-1.5">
              <Gem className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold">{profile.gems || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
