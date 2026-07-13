import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Crown, Star, Search, Edit2, Save, UserCheck, Mail, Calendar, TrendingUp, Coins, Gem, AlertTriangle, Trash2, Ban, CheckCircle2, RotateCcw, Activity, Gift, Frame, Wrench } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ROLES = [
  { id: "user", label: "Utilisateur", icon: UserCheck, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { id: "vip", label: "VIP", icon: Star, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  { id: "moderator", label: "Modérateur", icon: Shield, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { id: "admin", label: "Admin", icon: Crown, color: "bg-red-500/10 text-red-400 border-red-500/20" },
];

function RoleBadge({ role }) {
  const config = ROLES.find(item => item.id === role) || ROLES[0];
  const Icon = config.icon;
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${config.color}`}><Icon className="w-3 h-3" />{config.label.toUpperCase()}</span>;
}

const numberValue = value => Math.max(0, Math.floor(Number(value) || 0));

export default function UserManagement({ users, profiles, currentUser, onUserUpdate }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [resetTarget, setResetTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [giftCardId, setGiftCardId] = useState("");
  const [giftCardQuantity, setGiftCardQuantity] = useState(1);
  const [giftFrameId, setGiftFrameId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: cardDefinitions = [] } = useQuery({ queryKey: ["admin_user_card_catalog"], queryFn: () => appClient.entities.CardDefinition.list("anime", 1000) });
  const { data: frameCatalog = [] } = useQuery({ queryKey: ["admin_user_frame_catalog"], queryFn: () => appClient.entities.CardFrame.list("name", 500) });
  const { data: playerControl, refetch: refetchPlayerControl, isFetching: playerControlLoading } = useQuery({
    queryKey: ["admin_player_control", selectedId],
    queryFn: async () => (await appClient.functions.invoke("getAdminPlayerControl", { user_id: selectedId })).data,
    enabled: Boolean(selectedId),
  });

  const profileByUserId = useMemo(() => new Map(profiles.map(profile => [profile.created_by_id, profile])), [profiles]);
  const userIds = useMemo(() => new Set(users.map(item => item.id)), [users]);
  const getProfile = userId => profileByUserId.get(userId);

  const filteredUsers = useMemo(() => users.filter(item => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || item.full_name?.toLowerCase().includes(query) || item.email?.toLowerCase().includes(query);
    const suspended = item.status === "suspended" && (!item.suspended_until || new Date(item.suspended_until) > new Date());
    return matchesSearch && (filterRole === "all" || item.role === filterRole) && (filterStatus === "all" || (filterStatus === "suspended" ? suspended : !suspended));
  }).sort((a, b) => {
    if (sortBy === "name") return String(a.full_name || a.email).localeCompare(String(b.full_name || b.email), "fr");
    if (sortBy === "coins") return numberValue(profileByUserId.get(b.id)?.coins) - numberValue(profileByUserId.get(a.id)?.coins);
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  }), [users, profileByUserId, search, filterRole, filterStatus, sortBy]);

  const selectedUser = users.find(item => item.id === selectedId);
  const orphanProfiles = useMemo(() => profiles.filter(profile => !userIds.has(profile.created_by_id)), [profiles, userIds]);

  const openEditor = user => {
    const profile = getProfile(user.id);
    setSelectedId(user.id);
    setForm({
      full_name: user.full_name || "",
      role: user.role || "user",
      status: user.status === "suspended" ? "suspended" : "active",
      suspended_until: user.suspended_until ? new Date(user.suspended_until).toISOString().slice(0, 16) : "",
      suspension_reason: user.suspension_reason || "",
      coins: profile?.coins || 0,
      gems: profile?.gems || 0,
      xp: profile?.xp || 0,
      talent_points: profile?.talent_points || 0,
    });
  };

  const saveUser = async () => {
    if (!selectedUser || saving) return;
    setSaving(true);
    try {
      await appClient.functions.invoke("adminUpdatePlayerAccount", {
        user_id: selectedUser.id,
        full_name: form.full_name.trim(), role: form.role, status: form.status,
        suspended_until: form.status === "suspended" && form.suspended_until ? new Date(form.suspended_until).toISOString() : null,
        suspension_reason: form.status === "suspended" ? form.suspension_reason.trim() : null,
        coins: numberValue(form.coins), gems: numberValue(form.gems),
        xp: numberValue(form.xp), talent_points: numberValue(form.talent_points),
      });
      await onUserUpdate?.();
      setSelectedId(null);
      toast({ title: "Compte mis à jour", description: "Le profil, le rôle et l’économie ont été synchronisés." });
    } catch (error) {
      toast({ title: "Modification impossible", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const deleteUser = async () => {
    if (!deleteTarget || saving) return;
    setSaving(true);
    try {
      const result = await appClient.entities.User.delete(deleteTarget.id);
      await onUserUpdate?.();
      setDeleteTarget(null);
      setDeleteConfirmation("");
      toast({ title: "Compte définitivement supprimé", description: `${deleteTarget.email} et ${numberValue(result.removed_total)} éléments ont été effacés de MongoDB.` });
    } catch (error) {
      toast({ title: "Suppression impossible", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const resetPlayer = async () => {
    if (!resetTarget || saving) return;
    setSaving(true);
    try {
      const response = await appClient.functions.invoke("adminResetPlayer", { user_id: resetTarget.id });
      await onUserUpdate?.();
      setResetTarget(null);
      setSelectedId(null);
      toast({ title: "Progression réinitialisée", description: `${numberValue(response.data?.removed_total)} éléments supprimés. Le compte reste actif avec le solde de départ.` });
    } catch (error) {
      toast({ title: "Réinitialisation impossible", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const cleanupOrphans = async () => {
    if (saving || !orphanProfiles.length) return;
    setSaving(true);
    try {
      const response = await appClient.functions.invoke("adminCleanupOrphanData");
      await onUserUpdate?.();
      toast({ title: "Données orphelines nettoyées", description: `${numberValue(response.data?.removed_total)} éléments sans compte ont été supprimés.` });
    } catch (error) {
      toast({ title: "Nettoyage impossible", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const grantCard = async () => {
    if (!selectedUser || !giftCardId || saving) return;
    setSaving(true);
    try {
      const response = await appClient.functions.invoke("adminGrantPlayerCard", { user_id: selectedUser.id, card_definition_id: giftCardId, quantity: numberValue(giftCardQuantity) || 1, delivery_mode: "direct" });
      await Promise.all([refetchPlayerControl(), onUserUpdate?.()]);
      await queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast({ title: "Carte ajoutée", description: `${response.data.card.name} est maintenant dans l'inventaire du joueur.` });
    } catch (error) { toast({ title: "Ajout impossible", description: error.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const revokeCard = async card => {
    if (!selectedUser || saving) return;
    setSaving(true);
    try {
      await appClient.functions.invoke("adminRevokePlayerCard", { user_id: selectedUser.id, card_id: card.id });
      await refetchPlayerControl();
      await queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast({ title: "Carte retirée", description: `${card.name} a été retirée du joueur.` });
    } catch (error) { toast({ title: "Retrait impossible", description: error.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const grantFrame = async () => {
    if (!selectedUser || !giftFrameId || saving) return;
    setSaving(true);
    try {
      const response = await appClient.functions.invoke("adminGrantPlayerFrame", { user_id: selectedUser.id, frame_id: giftFrameId, delivery_mode: "direct" });
      await refetchPlayerControl();
      await queryClient.invalidateQueries({ queryKey: ["myFrames"] });
      toast({ title: "Cadre ajouté", description: `${response.data.frame.name} est maintenant dans la collection du joueur.` });
    } catch (error) { toast({ title: "Ajout impossible", description: error.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const revokeFrame = async owned => {
    if (!selectedUser || saving) return;
    setSaving(true);
    try {
      await appClient.functions.invoke("adminRevokePlayerFrame", { user_id: selectedUser.id, player_frame_id: owned.id });
      await refetchPlayerControl();
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["myFrames"] }), queryClient.invalidateQueries({ queryKey: ["cards"] })]);
      toast({ title: "Cadre retiré" });
    } catch (error) { toast({ title: "Retrait impossible", description: error.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const repairInventory = async () => {
    if (!selectedUser || saving) return;
    setSaving(true);
    try {
      const response = await appClient.functions.invoke("adminRepairPlayerInventory", { user_id: selectedUser.id });
      await Promise.all([
        refetchPlayerControl(),
        onUserUpdate?.(),
        queryClient.invalidateQueries({ queryKey: ["cards"] }),
        queryClient.invalidateQueries({ queryKey: ["myFrames"] }),
        queryClient.invalidateQueries({ queryKey: ["giftInbox"] }),
      ]);
      const data = response.data || {};
      toast({ title: "Inventaire réparé", description: `${numberValue(data.repairedCards)} cartes · ${numberValue(data.repairedFrames)} cadres · ${numberValue(data.repairedGifts)} cadeaux resynchronisés.` });
    } catch (error) { toast({ title: "Réparation impossible", description: error.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Rechercher un pseudo ou un e-mail…" value={search} onChange={event => setSearch(event.target.value)} className="pl-11 h-11 bg-secondary/30" /></div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select aria-label="Filtrer par état" className="h-11 rounded-md border border-input bg-background px-3 text-sm" value={filterStatus} onChange={event => setFilterStatus(event.target.value)}><option value="all">Tous les états</option><option value="active">Actifs</option><option value="suspended">Suspendus</option></select>
          <select aria-label="Trier les joueurs" className="h-11 rounded-md border border-input bg-background px-3 text-sm" value={sortBy} onChange={event => setSortBy(event.target.value)}><option value="newest">Plus récents</option><option value="name">Nom A–Z</option><option value="coins">Plus riches</option></select>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">{["all", ...ROLES.map(role => role.id)].map(roleId => <Button className="shrink-0" key={roleId} size="sm" variant={filterRole === roleId ? "default" : "outline"} onClick={() => setFilterRole(roleId)}>{roleId === "all" ? "Tous" : ROLES.find(role => role.id === roleId)?.label}</Button>)}</div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{ROLES.map(role => { const Icon = role.icon; return <div key={role.id} className={`rounded-2xl border p-4 ${role.color}`}><div className="flex justify-between"><Icon className="w-5 h-5" /><strong className="text-2xl">{users.filter(user => user.role === role.id).length}</strong></div><p className="mt-2 text-xs font-bold uppercase">{role.label}</p></div>; })}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border bg-card p-3 text-sm"><Activity className="mr-2 inline h-4 w-4 text-emerald-400"/><strong>{users.filter(item => item.status !== "suspended").length}</strong> comptes actifs</div><div className="rounded-xl border border-border bg-card p-3 text-sm"><Ban className="mr-2 inline h-4 w-4 text-red-400"/><strong>{users.filter(item => item.status === "suspended").length}</strong> suspendus</div><div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm"><span><AlertTriangle className="mr-2 inline h-4 w-4 text-yellow-400"/><strong>{orphanProfiles.length}</strong> profils orphelins</span>{orphanProfiles.length > 0 && <Button size="sm" variant="outline" disabled={saving} onClick={cleanupOrphans}>Nettoyer</Button>}</div></div>

      <div className="space-y-3">{filteredUsers.map(user => {
        const profile = getProfile(user.id);
        const suspended = user.status === "suspended" && (!user.suspended_until || new Date(user.suspended_until) > new Date());
        return <motion.article key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`p-4 sm:p-5 rounded-2xl border bg-card ${suspended ? "border-red-500/40" : "border-border"}`}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 grid place-items-center shrink-0 font-bold text-primary">{(user.full_name || "?")[0].toUpperCase()}</div>
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold truncate">{user.full_name || "Utilisateur"}</h3><RoleBadge role={user.role} />{suspended && <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-400"><Ban className="w-3 h-3" />SUSPENDU</span>}</div>
                <p className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground truncate"><Mail className="w-3 h-3" />{user.email}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs"><span className="flex gap-1"><Coins className="w-3 h-3 text-yellow-400" />{numberValue(profile?.coins).toLocaleString()}</span><span className="flex gap-1"><Gem className="w-3 h-3 text-cyan-400" />{numberValue(profile?.gems)}</span><span className="flex gap-1"><TrendingUp className="w-3 h-3 text-green-400" />{numberValue(profile?.xp).toLocaleString()} XP</span><span className="flex gap-1 text-muted-foreground"><Calendar className="w-3 h-3" />Inscrit {new Date(user.created_date).toLocaleDateString("fr-FR")}</span>{user.last_login_at && <span className="text-muted-foreground">Vu {new Date(user.last_login_at).toLocaleDateString("fr-FR")}</span>}</div>
              </div>
            </div>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openEditor(user)}><Edit2 className="w-4 h-4 mr-1.5" />Gérer</Button><Button size="sm" variant="outline" disabled={user.id === currentUser?.id} onClick={() => setDeleteTarget(user)} className="border-red-500/30 text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button></div>
          </div>
        </motion.article>;
      })}</div>

      {!filteredUsers.length && <div className="text-center py-12 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3" />Aucun utilisateur trouvé</div>}

      <Dialog open={!!selectedId} onOpenChange={open => !open && setSelectedId(null)}><DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto"><DialogHeader><DialogTitle>Centre de contrôle joueur</DialogTitle><DialogDescription>{selectedUser?.email} · compte, progression, cartes et cadres réunis au même endroit</DialogDescription></DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div><p className="text-sm font-bold text-emerald-300">Maintenance inventaire</p><p className="text-xs text-muted-foreground">Resynchronise cartes, cadres, cadeaux en attente et profil joueur.</p></div>
          <Button variant="outline" disabled={saving || !selectedUser} onClick={repairInventory} className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"><Wrench className="mr-1.5 h-4 w-4" />Réparer inventaire</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-xs font-semibold">Pseudo<Input className="mt-1.5" value={form.full_name || ""} onChange={event => setForm(current => ({ ...current, full_name: event.target.value }))} /></label>
          <label className="text-xs font-semibold">Rôle<select className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3" value={form.role || "user"} onChange={event => setForm(current => ({ ...current, role: event.target.value }))}>{ROLES.map(role => <option key={role.id} value={role.id}>{role.label}</option>)}</select></label>
          <label className="text-xs font-semibold">Pièces<Input type="number" min="0" className="mt-1.5" value={form.coins ?? 0} onChange={event => setForm(current => ({ ...current, coins: event.target.value }))} /></label>
          <label className="text-xs font-semibold">Gemmes<Input type="number" min="0" className="mt-1.5" value={form.gems ?? 0} onChange={event => setForm(current => ({ ...current, gems: event.target.value }))} /></label>
          <label className="text-xs font-semibold">XP<Input type="number" min="0" className="mt-1.5" value={form.xp ?? 0} onChange={event => setForm(current => ({ ...current, xp: event.target.value }))} /></label>
          <label className="text-xs font-semibold">Points de talent<Input type="number" min="0" className="mt-1.5" value={form.talent_points ?? 0} onChange={event => setForm(current => ({ ...current, talent_points: event.target.value }))} /></label>
          <label className="text-xs font-semibold">État du compte<select className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3" value={form.status || "active"} onChange={event => setForm(current => ({ ...current, status: event.target.value }))}><option value="active">Actif</option><option value="suspended">Suspendu</option></select></label>
          {form.status === "suspended" && <label className="text-xs font-semibold">Fin de suspension (optionnelle)<Input type="datetime-local" className="mt-1.5" value={form.suspended_until || ""} onChange={event => setForm(current => ({ ...current, suspended_until: event.target.value }))} /></label>}
          {form.status === "suspended" && <label className="text-xs font-semibold sm:col-span-2">Motif<Input className="mt-1.5" placeholder="Message affiché au joueur" value={form.suspension_reason || ""} onChange={event => setForm(current => ({ ...current, suspension_reason: event.target.value }))} /></label>}
        </div>
        <section className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="flex items-center gap-2 font-bold"><Gift className="h-4 w-4 text-primary" />Offrir une carte</h3><p className="text-xs text-muted-foreground">Catalogue complet, événements et collectors inclus.</p></div><span className="text-xs text-muted-foreground">{playerControl?.stats?.unique_cards || 0} uniques · {playerControl?.stats?.total_copies || 0} exemplaires</span></div>
          <div className="grid gap-2 sm:grid-cols-[1fr_90px_auto]">
            <select aria-label="Carte à offrir" value={giftCardId} onChange={event => setGiftCardId(event.target.value)} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm"><option value="">Choisir une carte…</option>{cardDefinitions.filter(card => card.is_active !== false).map(card => <option key={card.id} value={card.id}>{card.anime} · {card.name} · {card.rarity}{card.is_collector ? " · Collector" : ""}</option>)}</select>
            <Input aria-label="Quantité" type="number" min="1" max="100" value={giftCardQuantity} onChange={event => setGiftCardQuantity(event.target.value)} />
            <Button disabled={!giftCardId || saving} onClick={grantCard}><Gift className="mr-1.5 h-4 w-4" />Offrir</Button>
          </div>
          <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border/60 bg-background/50 p-2">{playerControlLoading ? <p className="p-3 text-xs text-muted-foreground">Chargement de l’inventaire…</p> : playerControl?.cards?.length ? playerControl.cards.map(card => <div key={card.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary/40"><div className="h-9 w-7 shrink-0 overflow-hidden rounded bg-secondary">{card.image_url && <img src={card.image_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{card.name} <span className="text-muted-foreground">×{card.duplicates || 1}</span></p><p className="truncate text-[10px] text-muted-foreground">{card.anime} · {card.rarity} · niveau {card.level || 1}</p></div><Button size="sm" variant="ghost" disabled={saving} onClick={() => revokeCard(card)} className="h-8 text-red-400"><Trash2 className="h-3.5 w-3.5" /></Button></div>) : <p className="p-3 text-xs text-muted-foreground">Aucune carte possédée.</p>}</div>
        </section>
        <section className="space-y-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="flex items-center gap-2 font-bold"><Gift className="h-4 w-4 text-yellow-400" />Cadeaux en attente</h3><p className="text-xs text-muted-foreground">Le joueur doit les réclamer depuis son coffre cadeaux.</p></div><span className="text-xs text-muted-foreground">{playerControl?.stats?.gifts || 0} en attente</span></div>
          <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">{playerControl?.gifts?.length ? playerControl.gifts.map(gift => <div key={gift.id} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 p-2"><div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-secondary">{gift.card?.image_url && <img src={gift.card.image_url} alt="" className="h-full w-full object-cover" />}{!gift.card?.image_url && gift.frame?.image_url && <img src={gift.frame.image_url} alt="" className="h-full w-full object-fill" />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{gift.title || gift.card?.name || gift.frame?.name || "Cadeau"}</p><p className="text-[10px] text-muted-foreground">{gift.kind === "card" ? `${gift.card?.rarity || "carte"} ×${gift.quantity || 1}` : "cadre"} · {new Date(gift.created_date).toLocaleDateString("fr-FR")}</p></div></div>) : <p className="p-3 text-xs text-muted-foreground">Aucun cadeau en attente.</p>}</div>
        </section>
        <section className="space-y-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="flex items-center gap-2 font-bold"><Frame className="h-4 w-4 text-cyan-400" />Offrir un cadre</h3><p className="text-xs text-muted-foreground">Le cadre apparaît immédiatement dans la collection du joueur.</p></div><span className="text-xs text-muted-foreground">{playerControl?.stats?.frames || 0} possédé(s)</span></div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><select aria-label="Cadre à offrir" value={giftFrameId} onChange={event => setGiftFrameId(event.target.value)} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm"><option value="">Choisir un cadre…</option>{frameCatalog.filter(frame => frame.is_active !== false).map(frame => <option key={frame.id} value={frame.id}>{frame.name} · {frame.rarity}</option>)}</select><Button disabled={!giftFrameId || saving} onClick={grantFrame}><Frame className="mr-1.5 h-4 w-4" />Offrir</Button></div>
          <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">{playerControl?.frames?.length ? playerControl.frames.map(owned => <div key={owned.id} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 p-2"><div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-secondary">{owned.frame?.image_url && <img src={owned.frame.image_url} alt="" className="absolute inset-0 h-full w-full object-fill" />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{owned.frame?.name || "Cadre supprimé"}</p><p className="text-[10px] text-muted-foreground">{owned.frame?.rarity || "inconnu"}</p></div><Button size="sm" variant="ghost" disabled={saving} onClick={() => revokeFrame(owned)} className="h-8 text-red-400"><Trash2 className="h-3.5 w-3.5" /></Button></div>) : <p className="p-3 text-xs text-muted-foreground">Aucun cadre possédé.</p>}</div>
        </section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" />Les changements de solde, profil et accès sont appliqués immédiatement.</div>
        <DialogFooter className="gap-2 sm:justify-between"><Button variant="outline" className="border-orange-500/30 text-orange-300" disabled={selectedUser?.id === currentUser?.id} onClick={() => setResetTarget(selectedUser)}><RotateCcw className="mr-1.5 h-4 w-4" />Réinitialiser la progression</Button><div className="flex gap-2"><Button variant="outline" onClick={() => setSelectedId(null)}>Annuler</Button><Button disabled={saving || !form.full_name?.trim()} onClick={saveUser}><Save className="w-4 h-4 mr-1.5" />Enregistrer</Button></div></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) { setDeleteTarget(null); setDeleteConfirmation(""); } }}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2 text-red-400"><AlertTriangle className="w-5 h-5" />Supprimer définitivement ce compte ?</DialogTitle><DialogDescription>Le compte {deleteTarget?.email}, ses cartes, cadres, transactions, talents et sessions seront supprimés de MongoDB. Cette action est irréversible.</DialogDescription></DialogHeader><label className="text-xs font-semibold">Recopie l’e-mail pour confirmer<Input className="mt-1.5" value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} placeholder={deleteTarget?.email} /></label><DialogFooter><Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirmation(""); }}>Annuler</Button><Button disabled={saving || deleteConfirmation.trim().toLowerCase() !== deleteTarget?.email?.toLowerCase()} onClick={deleteUser} className="bg-red-600 hover:bg-red-700"><Trash2 className="w-4 h-4 mr-1.5" />Supprimer définitivement</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={!!resetTarget} onOpenChange={open => !open && setResetTarget(null)}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2 text-orange-300"><RotateCcw className="h-5 w-5" />Réinitialiser la progression ?</DialogTitle><DialogDescription>Le compte {resetTarget?.email} sera conservé, mais ses cartes, cadres, talents, quêtes, ventes et progression seront effacés. Il repartira avec 2 500 pièces et 100 gemmes.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setResetTarget(null)}>Annuler</Button><Button disabled={saving} onClick={resetPlayer} className="bg-orange-600 hover:bg-orange-700"><RotateCcw className="mr-1.5 h-4 w-4" />Réinitialiser</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
