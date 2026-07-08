import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Gift, X, Frame as FrameIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RARITY_CONFIG } from "@/lib/gameData";

function RewardImage({ reward }) {
  const item = reward?.kind === "frame" ? reward.frame : reward?.card;
  const imageUrl = item?.image_url;
  const rarity = RARITY_CONFIG[item?.rarity] || RARITY_CONFIG.normale;

  return (
    <motion.div
      initial={{ rotateY: -90, scale: 0.6, opacity: 0 }}
      animate={{ rotateY: 0, scale: 1, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.35, duration: 0.75 }}
      className={`relative aspect-[2/3] w-48 overflow-hidden rounded-2xl border-2 shadow-2xl sm:w-60 ${reward?.kind === "frame" ? "border-cyan-300/70 shadow-cyan-500/30" : rarity.borderColor}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={item?.name || "Récompense"} className={`h-full w-full ${reward?.kind === "frame" ? "object-fill" : "object-contain"}`} />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-900 to-black">
          {reward?.kind === "frame" ? <FrameIcon className="h-16 w-16 text-cyan-300" /> : <Gift className="h-16 w-16 text-yellow-300" />}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-white/10" />
      <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/10 bg-black/65 p-3 backdrop-blur-md">
        <p className="truncate font-heading text-sm font-bold text-white">{item?.name || "Cadeau"}</p>
        <p className="mt-1 text-[11px] text-white/65">{reward?.kind === "frame" ? "Cadre débloqué" : `${item?.anime || "Carte"} · ${rarity.label || item?.rarity || ""}`}</p>
      </div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent"
        initial={{ x: "-140%" }}
        animate={{ x: "140%" }}
        transition={{ duration: 1.2, repeat: 2, repeatDelay: 0.6 }}
      />
    </motion.div>
  );
}

export default function RewardRevealOverlay({ reward, title = "Coffre cadeau", onClose }) {
  const [stage, setStage] = useState("chest");
  const reduceMotion = useReducedMotion();
  const item = reward?.kind === "frame" ? reward.frame : reward?.card;
  const particles = useMemo(() => reduceMotion ? [] : [...Array(26)].map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 1.5,
  })), [reduceMotion]);

  useEffect(() => {
    const charge = window.setTimeout(() => setStage("charge"), reduceMotion ? 0 : 650);
    const reveal = window.setTimeout(() => setStage("reveal"), reduceMotion ? 180 : 1450);
    return () => {
      window.clearTimeout(charge);
      window.clearTimeout(reveal);
    };
  }, [reduceMotion]);

  if (!reward) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/92 px-4 py-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.22),transparent_34%),radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.16),transparent_28%)]" />
        {particles.map((particle, index) => (
          <motion.span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-yellow-200"
            initial={{ x: `${particle.x}vw`, y: `${particle.y}vh`, opacity: 0, scale: 0 }}
            animate={{ y: ["100vh", "-10vh"], opacity: [0, 0.9, 0], scale: [0, 1.4, 0] }}
            transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity }}
          />
        ))}

        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white">
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
          <motion.p initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-2 text-[11px] font-black uppercase tracking-[0.35em] text-yellow-200">
            {title}
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl font-black text-white sm:text-4xl">
            {stage === "reveal" ? "Récompense obtenue !" : "Ouverture du coffre..."}
          </motion.h2>

          <div className="relative mt-10 grid min-h-[360px] place-items-center">
            {stage !== "reveal" ? (
              <motion.div
                className="relative grid h-52 w-52 place-items-center rounded-[2rem] border border-yellow-300/40 bg-gradient-to-br from-yellow-600 via-amber-900 to-black shadow-2xl shadow-yellow-500/30"
                animate={stage === "charge" ? { scale: [1, 1.08, 1], rotate: [-2, 2, -2, 2, 0], filter: ["brightness(1)", "brightness(1.8)", "brightness(1.2)"] } : { y: [0, -8, 0] }}
                transition={{ duration: stage === "charge" ? 0.65 : 1.4, repeat: stage === "charge" ? 1 : Infinity }}
              >
                <motion.div className="absolute inset-4 rounded-[1.5rem] border border-yellow-100/30" />
                <Gift className="h-24 w-24 text-yellow-100 drop-shadow-[0_0_18px_rgba(254,240,138,0.75)]" />
                <motion.div className="absolute inset-0 rounded-[2rem] bg-white/20" animate={{ opacity: stage === "charge" ? [0, 0.7, 0] : 0 }} />
              </motion.div>
            ) : (
              <RewardImage reward={reward} />
            )}

            {stage === "charge" && (
              <motion.div
                className="absolute h-72 w-72 rounded-full border border-yellow-200/50"
                initial={{ scale: 0.4, opacity: 0.9 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.85, repeat: 1 }}
              />
            )}
          </div>

          {stage === "reveal" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3">
              <p className="text-sm text-white/65">{item?.name || "La recompense"} rejoint ton inventaire.</p>
              <Button onClick={onClose} className="rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 px-10 font-heading font-bold text-black hover:from-yellow-400 hover:to-amber-400">
                Continuer
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
