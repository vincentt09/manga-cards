import React from "react";
import { Sparkles } from "lucide-react";
export default function RouteFallback() { return <div className="min-h-[70dvh] grid place-items-center"><div className="flex flex-col items-center gap-3 text-center"><div className="relative grid h-14 w-14 place-items-center rounded-2xl border border-primary/30 bg-primary/10"><Sparkles className="h-6 w-6 text-primary animate-pulse" /><span className="absolute inset-0 rounded-2xl border border-primary/25 animate-ping" /></div><p className="text-sm font-semibold">Chargement de la zone…</p></div></div>; }
