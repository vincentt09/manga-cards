import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Crown, Star, Search, Edit2, Save, UserCheck, Mail, Calendar, TrendingUp, Coins, Gem, AlertTriangle, Trash2, Ban, CheckCircle2 } from "lucide-react";
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
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const { toast } = useToast();

  const filteredUsers = useMemo(() => users.filter(item => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || item.full_name?.toLowerCase().includes(query) || item.email?.toLowerCase().includes(query);
    return matchesSearch && (filterRole === "all" || item.role === filterRole);
  }), [users, search, filterRole]);

  const getProfile = userId => profiles.find(profile => profile.created_by_id === userId);
  const selectedUser = users.find(item => item.id === selectedId);

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
    const profile = getProfile(selectedUser.id);
    setSaving(true);
    try {
      await appClient.entities.User.update(selectedUser.id, {
        full_name: form.full_name.trim(), role: form.role, status: form.status,
        suspended_until: form.status === "suspended" && form.suspended_until ? new Date(form.suspended_until).toISOString() : null,
        suspension_reason: form.status === "suspended" ? form.suspension_reason.trim() : null,
      });
      if (profile) await appClient.entities.PlayerProfile.update(profile.id, {
        display_name: form.full_name.trim(), coins: numberValue(form.coins), gems: numberValue(form.gems),
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
      await appClient.entities.User.delete(deleteTarget.id);
      await onUserUpdate?.();
      setDeleteTarget(null);
      toast({ title: "Compte supprimé", description: `${deleteTarget.email} et ses données de jeu ont été effacés.` });
    } catch (error) {
      toast({ title: "Suppression impossible", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Rechercher un pseudo ou un e-mail…" value={search} onChange={event => setSearch(event.target.value)} className="pl-11 h-11 bg-secondary/30" /></div>
        <div className="flex gap-2 flex-wrap">{["all", ...ROLES.map(role => role.id)].map(roleId => <Button key={roleId} size="sm" variant={filterRole === roleId ? "default" : "outline"} onClick={() => setFilterRole(roleId)}>{roleId === "all" ? "Tous" : ROLES.find(role => role.id === roleId)?.label}</Button>)}</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{ROLES.map(role => { const Icon = role.icon; return <div key={role.id} className={`rounded-2xl border p-4 ${role.color}`}><div className="flex justify-between"><Icon className="w-5 h-5" /><strong className="text-2xl">{users.filter(user => user.role === role.id).length}</strong></div><p className="mt-2 text-xs font-bold uppercase">{role.label}</p></div>; })}</div>

      <div className="space-y-3">{filteredUsers.map(user => {
        const profile = getProfile(user.id);
        const suspended = user.status === "suspended" && (!user.suspended_until || new Date(user.suspended_until) > new Date());
        return <motion.article key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`p-4 sm:p-5 rounded-2xl border bg-card ${suspended ? "border-red-500/40" : "border-border"}`}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 grid place-items-center shrink-0 font-bold text-primary">{(user.full_name || "?")[0].toUpperCase()}</div>
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold truncate">{user.full_name || "Utilisateur"}</h3><RoleBadge role={user.role} />{suspended && <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-400"><Ban className="w-3 h-3" />SUSPENDU</span>}</div>
                <p className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground truncate"><Mail className="w-3 h-3" />{user.email}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs"><span className="flex gap-1"><Coins className="w-3 h-3 text-yellow-400" />{numberValue(profile?.coins).toLocaleString()}</span><span className="flex gap-1"><Gem className="w-3 h-3 text-cyan-400" />{numberValue(profile?.gems)}</span><span className="flex gap-1"><TrendingUp className="w-3 h-3 text-green-400" />{numberValue(profile?.xp).toLocaleString()} XP</span><span className="flex gap-1 text-muted-foreground"><Calendar className="w-3 h-3" />{new Date(user.created_date).toLocaleDateString("fr-FR")}</span></div>
              </div>
            </div>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openEditor(user)}><Edit2 className="w-4 h-4 mr-1.5" />Gérer</Button><Button size="sm" variant="outline" disabled={user.id === currentUser?.id} onClick={() => setDeleteTarget(user)} className="border-red-500/30 text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button></div>
          </div>
        </motion.article>;
      })}</div>

      {!filteredUsers.length && <div className="text-center py-12 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3" />Aucun utilisateur trouvé</div>}

      <Dialog open={!!selectedId} onOpenChange={open => !open && setSelectedId(null)}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Gérer le compte</DialogTitle><DialogDescription>{selectedUser?.email}</DialogDescription></DialogHeader>
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
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" />Les changements de solde, profil et accès sont appliqués immédiatement.</div>
        <DialogFooter><Button variant="outline" onClick={() => setSelectedId(null)}>Annuler</Button><Button disabled={saving || !form.full_name?.trim()} onClick={saveUser}><Save className="w-4 h-4 mr-1.5" />Enregistrer</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2 text-red-400"><AlertTriangle className="w-5 h-5" />Supprimer définitivement ce compte ?</DialogTitle><DialogDescription>Le compte {deleteTarget?.email}, ses cartes, cadres, transactions, talents et sessions seront supprimés. Cette action est irréversible.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button><Button disabled={saving} onClick={deleteUser} className="bg-red-600 hover:bg-red-700"><Trash2 className="w-4 h-4 mr-1.5" />Supprimer le compte</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
