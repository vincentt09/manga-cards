import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { BatteryCharging, Check, Coins, Heart, Lock, Shield, Sparkles, Swords, X, Zap } from "lucide-react";
import { appClient } from "@/api/appClient";
import Navbar from "@/components/game/Navbar";
import CurrencyBar from "@/components/game/CurrencyBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PVE_BOSSES, PVE_MAX_ENERGY, getPvePowerRating, getPveTeamPower } from "@/lib/pveData";
import { RARITY_CONFIG, RARITY_ORDER } from "@/lib/gameData";

function TeamCard({ card, onRemove }) {
  const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.normale;
  return (
    <motion.button layout type="button" onClick={onRemove} className={`group relative aspect-[2/3] overflow-hidden rounded-xl border-2 ${rarity.borderColor} bg-gradient-to-b ${rarity.gradient}`}>
      {card.image_url ? <img src={card.image_url} alt={card.name} className="h-full w-full object-cover object-top" /> : <div className="grid h-full place-items-center px-2 text-xs font-bold text-white">{card.name}</div>}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent px-2 pb-2 pt-7 text-left">
        <p className="truncate text-[11px] font-bold text-white">{card.name}</p>
        <p className="text-[9px] text-white/70">Niv. {card.level || 1} · ⚡{card.power}</p>
      </div>
      <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 opacity-70 transition-opacity group-hover:opacity-100"><X className="h-3 w-3 text-white" /></span>
    </motion.button>
  );
}

function BossCard({ boss, locked, cleared, stars = 0, dailyWins = 0, dailyLimit = 3, selected, onSelect }) {
  return (
    <button type="button" disabled={locked} onClick={onSelect} className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${selected ? "border-primary ring-2 ring-primary/30" : "border-border/60"} ${locked ? "opacity-45" : "hover:-translate-y-0.5 hover:border-primary/50"}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${boss.color} opacity-30`} />
      <div className="relative">
        <div className="mb-3 flex items-start justify-between">
          <span className="text-3xl">{boss.icon}</span>
          {locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : cleared ? <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/20"><Check className="h-3.5 w-3.5 text-emerald-400" /></span> : <span className="rounded-full bg-primary/15 px-2 py-1 text-[9px] font-bold text-primary">NOUVEAU</span>}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Palier {boss.stage} · {boss.anime}</p>
        <h3 className="mt-1 font-display text-sm font-bold">{boss.name}</h3>
        <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground"><span>❤️ {boss.hp.toLocaleString()}</span><span>⚔️ {boss.attack}</span><span>🛡️ {boss.defense}</span></div>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[9px]">
          <span className="text-yellow-300">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</span>
          <span className="text-muted-foreground">Reco. {boss.recommendedPower.toLocaleString()}</span>
          {cleared && <span className="text-cyan-300">{dailyWins}/{dailyLimit} aujourd’hui</span>}
        </div>
      </div>
    </button>
  );
}

function BattleResult({ result, boss, onClose }) {
  const lastRound = result.rounds[result.rounds.length - 1];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] grid place-items-center bg-black/85 p-4 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.75, y: 30 }} animate={{ scale: 1, y: 0 }} className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-white/15 bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className={`relative bg-gradient-to-br ${result.victory ? "from-emerald-600/50 to-cyan-900/40" : "from-red-700/50 to-slate-950"} p-7 text-center`}>
          <span className="text-5xl">{result.victory ? "🏆" : "💥"}</span>
          <h2 className="mt-3 font-display text-3xl font-black">{result.victory ? "VICTOIRE" : "DÉFAITE"}</h2>
          <p className="mt-1 text-sm text-white/70">contre {boss.name} · {result.rounds.length} tours</p>
          {result.first_clear && <span className="mt-3 inline-block rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-bold text-yellow-300">PREMIÈRE VICTOIRE</span>}
          {result.victory && <p className="mt-2 text-xl tracking-widest text-yellow-300">{"★".repeat(result.stars || 1)}{"☆".repeat(3 - (result.stars || 1))}</p>}
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-secondary/50 p-3"><p className="text-[10px] text-muted-foreground">Équipe restante</p><p className="font-bold text-emerald-400">{result.player_hp.toLocaleString()} PV</p></div>
            <div className="rounded-xl bg-secondary/50 p-3"><p className="text-[10px] text-muted-foreground">Boss restant</p><p className="font-bold text-red-400">{result.boss_hp.toLocaleString()} PV</p></div>
          </div>
          {result.victory ? (
            <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/10 p-4 text-center">
              <p className="text-xs text-muted-foreground">Récompenses</p>
              <p className="mt-1 font-bold text-yellow-300">+{result.rewards.coins.toLocaleString()} pièces · +{result.rewards.xp.toLocaleString()} XP{result.rewards.gems ? ` · +${result.rewards.gems} gemmes` : ""}</p>
            </div>
          ) : <p className="text-center text-xs text-muted-foreground">Améliore tes cartes ou adapte ton équipe avant de retenter le combat.</p>}
          {lastRound && <p className="text-center text-[10px] text-muted-foreground">Dernier tour : {lastRound.playerDamage} dégâts infligés · {lastRound.bossDamage} reçus</p>}
          {result.synergies?.length > 0 && <div className="flex flex-wrap justify-center gap-1.5">{result.synergies.map(synergy => <span key={synergy.id} className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[9px] text-primary">{synergy.label} · {synergy.bonus}</span>)}</div>}
          <Button className="w-full" onClick={onClose}>Continuer</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Pve() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedBossId, setSelectedBossId] = useState(PVE_BOSSES[0].id);
  const [battleResult, setBattleResult] = useState(null);
  const [now, setNow] = useState(Date.now());

  const { data: profiles = [] } = useQuery({ queryKey: ["profile"], queryFn: () => appClient.entities.PlayerProfile.list() });
  const { data: cards = [] } = useQuery({ queryKey: ["cards"], queryFn: () => appClient.entities.Card.list("-power", 1000) });
  const { data: pveResponse, isLoading } = useQuery({ queryKey: ["pve-state"], queryFn: () => appClient.functions.invoke("getPveState"), refetchInterval: 60_000 });
  const profile = profiles[0];
  const state = pveResponse?.data;

  useEffect(() => {
    if (state?.deck) setSelectedIds(state.deck.map((card) => card.id));
  }, [state?.deck]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedCards = selectedIds.map((id) => cards.find((card) => card.id === id)).filter(Boolean);
  const availableCards = useMemo(() => [...cards].sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0) || Number(b.power || 0) - Number(a.power || 0)), [cards]);
  const selectedBoss = PVE_BOSSES.find((boss) => boss.id === selectedBossId) || PVE_BOSSES[0];
  const teamPower = getPveTeamPower(selectedCards);
  const powerRating = getPvePowerRating(teamPower, selectedBoss.recommendedPower);
  const deckChanged = state && selectedIds.join("|") !== state.deck.map((card) => card.id).join("|");
  const nextEnergySeconds = state?.nextEnergyAt ? Math.max(0, Math.ceil((new Date(state.nextEnergyAt).getTime() - now) / 1000)) : 0;

  const saveDeck = useMutation({
    mutationFn: () => appClient.functions.invoke("setPveDeck", { card_ids: selectedIds }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pve-state"] }); toast({ title: "Équipe enregistrée", description: "Tes cartes sont prêtes au combat." }); },
    onError: (error) => toast({ title: "Équipe invalide", description: error.message, variant: "destructive" }),
  });
  const fight = useMutation({
    mutationFn: async () => {
      if (deckChanged) await appClient.functions.invoke("setPveDeck", { card_ids: selectedIds });
      return appClient.functions.invoke("fightPveBoss", { boss_id: selectedBoss.id });
    },
    onSuccess: (response) => {
      setBattleResult(response.data);
      queryClient.invalidateQueries({ queryKey: ["pve-state"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast({ title: "Combat impossible", description: error.message, variant: "destructive" }),
  });

  const toggleCard = (cardId) => setSelectedIds((current) => current.includes(cardId) ? current.filter((id) => id !== cardId) : current.length < 5 ? [...current, cardId] : current);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-red-950/10 pb-24 md:pb-8 md:pt-14">
      <Navbar />
      <CurrencyBar profile={profile} cards={cards} />
      <main className="mx-auto max-w-6xl space-y-6 px-3 py-5 sm:px-4 sm:py-7">
        <section className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/40 via-card to-primary/10 p-5 sm:p-7">
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-red-500/15 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">Mode aventure</p><h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-black"><Swords className="h-8 w-8 text-red-400" />Arène PvE</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Compose ton équipe, affronte les boss du multivers et débloque les paliers suivants.</p></div>
            <div className="flex gap-2">
              <div className="rounded-2xl border border-border bg-background/50 px-4 py-3 text-center"><p className="text-[10px] text-muted-foreground">Victoires / étoiles</p><p className="font-display text-xl font-bold text-emerald-400">{state?.wins || 0} <span className="text-sm text-yellow-300">· {Object.values(state?.stars || {}).reduce((sum, value) => sum + Number(value || 0), 0)}★</span></p></div>
              <div className="min-w-32 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3"><p className="flex items-center gap-1 text-[10px] text-cyan-300"><BatteryCharging className="h-3 w-3" />Énergie</p><p className="font-display text-xl font-bold text-cyan-300">{state?.energy ?? "-"}/{PVE_MAX_ENERGY}</p>{nextEnergySeconds > 0 && <p className="text-[9px] text-muted-foreground">+1 dans {Math.floor(nextEnergySeconds / 60)}:{String(nextEnergySeconds % 60).padStart(2, "0")}</p>}</div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card/70 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold">Ton équipe</h2><p className="text-xs text-muted-foreground">5 cartes : équipe complète +8 % · 3 d’une série +6 % · 4 séries +5 % vitesse</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">Puissance {teamPower.toLocaleString()}</span><Button size="sm" disabled={!deckChanged || selectedIds.length === 0 || saveDeck.isPending} onClick={() => saveDeck.mutate()}>{saveDeck.isPending ? "Sauvegarde…" : "Enregistrer"}</Button></div></div>
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {selectedCards.map((card) => <TeamCard key={card.id} card={card} onRemove={() => toggleCard(card.id)} />)}
            {Array.from({ length: 5 - selectedCards.length }).map((_, index) => <div key={index} className="grid aspect-[2/3] place-items-center rounded-xl border-2 border-dashed border-border bg-secondary/20"><span className="text-xl text-muted-foreground/40">+</span></div>)}
          </div>
          <div className="mt-5 border-t border-border pt-4"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Choisir les combattants ({selectedIds.length}/5)</p><div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
            {availableCards.map((card) => { const active = selectedIds.includes(card.id); const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.normale; return <button key={card.id} type="button" onClick={() => toggleCard(card.id)} className={`relative overflow-hidden rounded-xl border-2 text-left ${active ? "border-primary ring-2 ring-primary/30" : rarity.borderColor}`}><div className={`aspect-[2/3] bg-gradient-to-b ${rarity.gradient}`}>{card.image_url ? <img src={card.image_url} alt={card.name} loading="lazy" className="h-full w-full object-cover object-top" /> : <div className="grid h-full place-items-center p-1 text-center text-[9px] font-bold text-white">{card.name}</div>}</div><div className="absolute inset-x-0 bottom-0 bg-black/80 px-1.5 py-1"><p className="truncate text-[9px] font-bold text-white">{card.name}</p><p className="text-[8px] text-white/60">Niv.{card.level || 1} · {card.power} PWR</p></div>{active && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-primary"><Check className="h-3 w-3 text-white" /></span>}</button>; })}
          </div></div>
        </section>

        <section><div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-display text-xl font-bold">Campagne du multivers</h2><p className="text-xs text-muted-foreground">12 boss en 3 chapitres · première victoire 100 %, répétitions 15 % · 3 récompenses quotidiennes par boss.</p></div><span className="text-xs font-bold text-primary">Palier max {state?.maxStage || 1}/{PVE_BOSSES.length}</span></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{PVE_BOSSES.map((boss) => <BossCard key={boss.id} boss={boss} locked={boss.stage > (state?.maxStage || 1)} cleared={state?.clearedStages?.includes(boss.stage)} stars={Number(state?.stars?.[boss.stage] || 0)} dailyWins={Number(state?.dailyWins?.[boss.id] || 0)} dailyLimit={state?.dailyReplayLimit || 3} selected={selectedBoss.id === boss.id} onSelect={() => setSelectedBossId(boss.id)} />)}</div></section>

        <section className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${selectedBoss.stage <= (state?.maxStage || 1) ? "border-primary/30 bg-primary/5" : "border-border bg-card/50 opacity-60"}`}>
          <div className="flex flex-col items-center justify-between gap-5 sm:flex-row"><div className="flex items-center gap-4"><div className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${selectedBoss.color} text-3xl shadow-xl`}>{selectedBoss.icon}</div><div><p className="text-[10px] font-bold uppercase tracking-widest text-primary">Chapitre {selectedBoss.chapter} · Palier {selectedBoss.stage}</p><h3 className="font-display text-xl font-bold">{selectedBoss.name}</h3><div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Heart className="h-3 w-3 text-red-400" />{selectedBoss.hp.toLocaleString()} PV</span><span className="flex items-center gap-1"><Swords className="h-3 w-3" />{selectedBoss.attack}</span><span className="flex items-center gap-1"><Shield className="h-3 w-3" />{selectedBoss.defense}</span><span className="flex items-center gap-1"><Zap className="h-3 w-3" />{selectedBoss.speed}</span></div><p className={`mt-2 text-xs font-bold ${powerRating.color}`}>{powerRating.label} · estimation {powerRating.percent} % · recommandé {selectedBoss.recommendedPower.toLocaleString()}</p>{selectedBoss.weaknessAnime && <p className="mt-1 text-[10px] text-cyan-300">Avantage : 2 cartes {selectedBoss.weaknessAnime} donnent +8 % dégâts</p>}</div></div><div className="w-full sm:w-auto sm:text-right"><p className="mb-2 text-xs text-muted-foreground"><Coins className="mr-1 inline h-3 w-3 text-yellow-400" />{selectedBoss.rewardCoins.toLocaleString()} · <Sparkles className="mx-1 inline h-3 w-3 text-primary" />{selectedBoss.rewardXp} XP</p><Button size="lg" className="w-full bg-gradient-to-r from-red-600 to-orange-500 font-display font-bold sm:w-52" disabled={isLoading || fight.isPending || selectedIds.length === 0 || (state?.energy || 0) < selectedBoss.energyCost || selectedBoss.stage > (state?.maxStage || 1) || (state?.clearedStages?.includes(selectedBoss.stage) && Number(state?.dailyWins?.[selectedBoss.id] || 0) >= (state?.dailyReplayLimit || 3))} onClick={() => fight.mutate()}>{fight.isPending ? "Combat en cours…" : <><Swords className="mr-2 h-5 w-5" />Combattre · {selectedBoss.energyCost} ⚡</>}</Button></div></div>
        </section>
      </main>
      <AnimatePresence>{battleResult && <BattleResult result={battleResult} boss={PVE_BOSSES.find((boss) => boss.id === battleResult.boss_id)} onClose={() => setBattleResult(null)} />}</AnimatePresence>
    </div>
  );
}
