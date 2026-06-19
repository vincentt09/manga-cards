import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

const messages = [
  "Invocation du serveur de jeu…",
  "Réveil des gardiens de la collection…",
  "Synchronisation des cartes légendaires…",
  "Ouverture des portes du Manga TCG…",
];

export default function ServerWakeScreen({ attempt = 0 }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const message = useMemo(
    () => messages[Math.min(messages.length - 1, Math.floor(seconds / 6))],
    [seconds],
  );

  return (
    <div className="wake-screen fixed inset-0 z-[9999] overflow-hidden bg-[#05030b] text-white">
      <div className="wake-orb wake-orb-one" />
      <div className="wake-orb wake-orb-two" />
      <div className="wake-stars" />

      <div className="relative z-10 flex min-h-full flex-col items-center justify-center px-6 text-center">
        <div className="wake-card-wrap mb-9" aria-hidden="true">
          <div className="wake-card">
            <div className="wake-card-inner">
              <Sparkles className="h-12 w-12 text-amber-300" strokeWidth={1.4} />
              <span className="mt-4 text-xs font-black tracking-[0.35em] text-amber-200/90">MANGA</span>
              <strong className="text-3xl font-black tracking-tight">TCG</strong>
              <span className="mt-3 h-px w-14 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            </div>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.32em] text-amber-300">
          <Sparkles className="h-4 w-4" /> Portail en préparation
        </div>
        <h1 className="max-w-xl text-3xl font-black tracking-tight sm:text-5xl">La collection se réveille</h1>
        <p className="mt-4 min-h-6 text-sm text-white/65 sm:text-base">{message}</p>

        <div className="mt-7 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
          <div className="wake-progress h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-200 to-fuchsia-400" />
        </div>
        <p className="mt-4 text-xs text-white/40">
          Premier réveil : jusqu’à 50 secondes{attempt > 1 ? ` · tentative ${attempt}` : ""}
        </p>
      </div>
    </div>
  );
}
