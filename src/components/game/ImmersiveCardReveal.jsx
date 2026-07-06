import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, Crown, Package, Shield, Sparkles, Star, Wind, Zap } from "lucide-react";
import { RARITY_CONFIG } from "@/lib/gameData";

const highRarities = new Set(["legendaire", "secrète", "manga_god"]);

const particleColors = {
  normale: ["#94a3b8", "#cbd5e1"],
  legendaire: ["#fbbf24", "#f59e0b", "#fde68a", "#fff7ed"],
  "secrète": ["#f43f5e", "#fb7185", "#fda4af", "#ffffff"],
  manga_god: ["#22d3ee", "#67e8f9", "#a5f3fc", "#ffffff"],
};

function getDisplayImage(card, imageOverrides = []) {
  const suffixes = {
    normale: ["_n", "_b"],
    legendaire: ["_l"],
    "secrète": ["_s"],
    manga_god: ["_mg"],
  }[card.rarity] || ["_n"];

  const override = imageOverrides.find(item =>
    item.card_name?.toLowerCase() === card.name?.toLowerCase()
    && item.card_id
    && suffixes.some(suffix => item.card_id.endsWith(suffix))
  );
  return override?.image_url || card.image_url;
}

function FloatingParticles({ rarity, active = true }) {
  const reduceMotion = useReducedMotion();
  const colors = particleColors[rarity] || particleColors.normale;
  const count = rarity === "manga_god" ? 12 : highRarities.has(rarity) ? 8 : 0;
  const particles = useMemo(() => [...Array(count)].map((_, index) => ({
    x: `${50 + (Math.random() - 0.5) * 260}%`,
    y: `${50 + (Math.random() - 0.5) * 260}%`,
    rotate: Math.random() * 360,
    large: index % 5 === 0,
  })), [count]);
  if (!active || reduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {particles.map((particle, index) => {
        const color = colors[index % colors.length];
        return (
          <motion.span
            key={index}
            className="absolute rounded-full"
            style={{ width: particle.large ? 8 : 5, height: particle.large ? 8 : 5, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            initial={{ x: "50%", y: "50%", opacity: 0, scale: 0 }}
            animate={{
              x: particle.x,
              y: particle.y,
              opacity: [0, 1, 0],
              scale: [0, 1.35, 0],
              rotate: particle.rotate,
            }}
            transition={{ duration: 0.8, delay: index * 0.018 }}
          />
        );
      })}
    </div>
  );
}

function BoosterOpeningAnimation({ booster, onOpenComplete }) {
  const [stage, setStage] = useState("sealed");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      const timer = window.setTimeout(onOpenComplete, 80);
      return () => window.clearTimeout(timer);
    }
    const timers = [
      window.setTimeout(() => setStage("charge"), 60),
      window.setTimeout(() => setStage("crack"), 140),
      window.setTimeout(() => setStage("explode"), 220),
      window.setTimeout(() => onOpenComplete(), 340),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [onOpenComplete, reduceMotion]);

  return (
    <div className="relative flex min-h-[520px] w-full flex-col items-center justify-center overflow-hidden text-center">
      <motion.p initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-3 text-[11px] font-black uppercase tracking-[0.34em] text-primary">
        Ouverture du booster
      </motion.p>
      <motion.h2 initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 max-w-lg font-display text-3xl font-black text-white sm:text-5xl">
        {stage === "explode" ? "Explosion de rareté !" : booster?.name || "Booster"}
      </motion.h2>

      {[...Array(1)].map((_, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full border border-primary/25"
          initial={{ width: 180, height: 180, opacity: 0, scale: 0.2 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.2, 1.8 + index * 0.35, 2.4 + index * 0.5] }}
          transition={{ duration: 0.34, delay: index * 0.1 }}
        />
      ))}

      <motion.div
        animate={
          stage === "sealed" ? { y: [0, -10, 0], rotate: [0, -1, 1, 0] } :
          stage === "shake" ? { rotate: [-5, 5, -4, 4, -2, 2, 0], x: [-8, 8, -6, 6, 0], scale: 1.02 } :
          stage === "charge" ? { scale: [1, 1.12, 1.06], filter: ["brightness(1)", "brightness(2.2)", "brightness(1.6)"] } :
          stage === "crack" ? { rotate: [-2, 2, -3, 3, 0], scale: [1.06, 1.18, 1.08] } :
          { scale: [1.1, 1.8, 3.5], opacity: [1, 0.8, 0], rotate: [0, 12, -16] }
        }
        transition={{ duration: 0.12 }}
        className="relative grid aspect-[3/4] w-60 place-items-center overflow-hidden rounded-[2rem] border-4 border-white/20 shadow-2xl shadow-primary/30 sm:w-72"
        style={{ willChange: "transform, opacity" }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${booster?.color || "from-primary to-accent"}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.34),transparent_28%),linear-gradient(to_top,rgba(0,0,0,0.75),transparent_55%)]" />
        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" animate={{ x: ["-140%", "140%"] }} transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.15 }} />
        {stage === "crack" && (
          <div className="absolute inset-0">
            <motion.div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-white/80 shadow-[0_0_28px_white]" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} />
            <motion.div className="absolute left-[35%] top-[28%] h-24 w-1 rotate-[-38deg] bg-white/70 shadow-[0_0_20px_white]" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} />
            <motion.div className="absolute right-[34%] top-[44%] h-28 w-1 rotate-[42deg] bg-white/70 shadow-[0_0_20px_white]" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} />
          </div>
        )}
        <div className="relative z-10 flex flex-col items-center gap-4 px-6">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="grid h-24 w-24 place-items-center rounded-full border border-white/35 bg-black/25 backdrop-blur">
            <Package className="h-14 w-14 text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.85)]" />
          </motion.div>
          <span className="font-display text-2xl font-black tracking-wide text-white drop-shadow-lg">{booster?.icon || "📦"}</span>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">{stage === "charge" ? "Concentration..." : stage === "crack" ? "Le sceau se brise" : "Scellé"}</span>
        </div>
      </motion.div>

      {stage === "explode" && (
        <>
          <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: 8, opacity: 0 }} transition={{ duration: 0.16 }} className="absolute h-28 w-28 rounded-full bg-white" />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }} transition={{ duration: 0.14 }} className="fixed inset-0 bg-white" />
        </>
      )}
    </div>
  );
}

function SingleCardReveal({ card, index, onRevealed, forceReveal = false, imageOverrides = [] }) {
  const [revealed, setRevealed] = useState(false);
  const [particles, setParticles] = useState(false);
  const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.normale;
  const imageUrl = getDisplayImage(card, imageOverrides);
  const special = highRarities.has(card.rarity);

  const reveal = () => {
    if (revealed) return;
    setRevealed(true);
    setParticles(true);
    window.setTimeout(() => setParticles(false), 900);
    onRevealed?.(card, index);
  };

  useEffect(() => {
    if (forceReveal) reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceReveal]);

  return (
    <motion.button type="button" aria-label={revealed ? `${card.name}, carte révélée` : `Révéler la carte ${index + 1}`} initial={{ opacity: 0, y: 10, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.14 }} onClick={reveal} className="relative cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-black" style={{ perspective: "1000px", willChange: "transform, opacity" }}>
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div key="back" exit={{ rotateY: 90, opacity: 0, scale: 0.9 }} className="relative grid h-60 w-40 place-items-center overflow-hidden rounded-2xl border-2 border-primary/35 bg-gradient-to-br from-primary/25 via-card to-accent/10 sm:h-72 sm:w-48">
            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" animate={{ x: ["-130%", "130%"] }} transition={{ duration: 1.4, repeat: Infinity }} />
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="grid h-20 w-20 place-items-center rounded-full border border-primary/40 bg-primary/15">
              <Sparkles className="h-10 w-10 text-primary" />
            </motion.div>
            <p className="absolute bottom-5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Toucher</p>
          </motion.div>
        ) : (
          <motion.div key="front" initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} className={`relative h-60 w-40 overflow-hidden rounded-2xl border-2 shadow-2xl sm:h-72 sm:w-48 ${rarity.borderColor} ${special ? "shadow-primary/40" : "shadow-black/40"}`}>
            {imageUrl ? <img src={imageUrl} alt={card.name} className="h-full w-full object-cover object-top" /> : <div className="grid h-full w-full place-items-center bg-slate-950"><Sparkles className="h-12 w-12 text-primary" /></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-white/10" />
            {special && <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" initial={{ x: "-130%" }} animate={{ x: "130%" }} transition={{ duration: 0.65 }} />}
            <FloatingParticles rarity={card.rarity} active={particles} />
            {special && <Crown className="absolute left-3 top-3 h-5 w-5 text-yellow-200 drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]" />}
            <div className={`absolute right-3 top-3 rounded-full border px-2 py-1 text-[10px] font-black ${rarity.bgColor} ${rarity.color} ${rarity.borderColor}`}>{rarity.label}</div>
            {card.isDuplicate && (
              <div className="absolute left-3 top-10 rounded-full border border-green-400/30 bg-green-500/85 px-2 py-1 text-[10px] font-black text-white">
                <ArrowUp className="mr-1 inline h-3 w-3" />{card.levelsGained > 0 ? "NIVEAU +" : "PILE"}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="truncate font-heading text-sm font-bold text-white">{card.name}</p>
              <p className="mb-2 truncate text-[10px] text-white/60">{card.anime}</p>
              {card.isDuplicate ? (
                <div className="rounded-lg border border-green-500/30 bg-green-500/20 px-2 py-1 text-[10px] font-bold text-green-300">
                  {card.levelsGained > 0 ? `Niveau ${card.level}` : `Empilee x${card.stackCount || 2}`}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white">
                  <Zap className="h-3 w-3 text-red-400" /><span className="text-[10px] font-bold">{card.attack}</span>
                  <Shield className="h-3 w-3 text-blue-400" /><span className="text-[10px] font-bold">{card.defense}</span>
                  <Wind className="h-3 w-3 text-green-400" /><span className="text-[10px] font-bold">{card.speed}</span>
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-black"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{card.power}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function ImmersiveCardReveal({ cards, onComplete, booster, imageOverrides = [], onOpenAnother, onCardRevealed }) {
  const reduceMotion = useReducedMotion();
  const [isOpening, setIsOpening] = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);
  const [revealAll, setRevealAll] = useState(false);
  const allRevealed = revealedCount >= cards.length;
  const particles = useMemo(() => reduceMotion ? [] : [...Array(8)].map(() => ({ x: Math.random() * 100, d: Math.random() * 0.3, t: 2.5 + Math.random() })), [reduceMotion]);

  useEffect(() => {
    const scrollY = window.scrollY;
    const previous = {
      overflow: document.documentElement.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.documentElement.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <motion.div role="dialog" aria-modal="true" aria-label="Ouverture du booster" className="fixed inset-0 z-[110] overflow-hidden overscroll-none bg-black/94 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.23),transparent_36%),radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.15),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(251,191,36,0.13),transparent_28%)]" />
      {particles.map((particle, index) => (
        <motion.span key={index} className="pointer-events-none fixed h-1 w-1 rounded-full bg-white/80" initial={{ x: `${particle.x}vw`, y: "105vh", opacity: 0, scale: 0 }} animate={{ y: ["105vh", "-10vh"], opacity: [0, 0.75, 0], scale: [0, 1.2, 0] }} transition={{ duration: particle.t, delay: particle.d, repeat: Infinity }} />
      ))}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center overflow-y-auto overscroll-contain px-3 py-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-8">
        {isOpening ? (
          <BoosterOpeningAnimation booster={booster} onOpenComplete={() => setIsOpening(false)} />
        ) : (
          <div className="flex w-full flex-col items-center gap-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.35em] text-primary">Résultat du tirage</p>
              <h2 className="mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text font-display text-3xl font-black text-transparent sm:text-5xl">Cartes obtenues !</h2>
              <p className="text-sm text-white/65">Touche chaque carte pour la révéler</p>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
              {cards.map((card, index) => (
                <SingleCardReveal
                  key={`${card.id || card.name}-${index}`}
                  card={card}
                  index={index}
                  forceReveal={revealAll}
                  imageOverrides={imageOverrides}
                  onRevealed={(revealedCard, revealedIndex) => {
                    setRevealedCount(count => Math.min(cards.length, count + 1));
                    onCardRevealed?.(revealedCard, revealedIndex);
                  }}
                />
              ))}
            </div>
            {!allRevealed && <button onClick={() => setRevealAll(true)} className="text-xs text-white/55 underline underline-offset-2 transition-colors hover:text-white">Tout révéler</button>}
            <AnimatePresence>
              {allRevealed && (
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                  <button onClick={onComplete} className="rounded-full bg-gradient-to-r from-primary to-accent px-12 py-3.5 font-heading text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90 hover:shadow-primary/50">Continuer →</button>
                  {onOpenAnother && <button onClick={onOpenAnother} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 font-heading text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90 hover:shadow-green-500/50"><Package className="h-4 w-4" />Ouvrir un autre</button>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
