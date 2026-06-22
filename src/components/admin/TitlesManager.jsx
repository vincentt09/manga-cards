import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const REQUIREMENTS = [
  ["player_level", "Niveau du joueur"], ["cards_owned", "Cartes différentes"],
  ["boosters_opened", "Boosters ouverts"], ["card_level", "Niveau maximal d’une carte"],
  ["legendary_cards", "Cartes Légendaires"], ["secret_cards", "Cartes Secrètes"],
  ["manga_god_cards", "Cartes Manga God"], ["pve_wins", "Victoires PvE"],
  ["pve_stage", "Palier PvE débloqué"], ["cards_sold", "Cartes vendues"],
  ["coins", "Pièces possédées"], ["gems", "Gemmes possédées"], ["favorites", "Cartes favorites"],
];
const emptyForm = { label: "", description: "", requirement_type: "player_level", requirement_value: 10, color: "gold", icon: "👑", is_active: true };

export default function TitlesManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const { data: titles = [] } = useQuery({ queryKey: ["admin_titles"], queryFn: () => appClient.entities.TitleDefinition.list("requirement_value") });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin_titles"] });
  const save = useMutation({
    mutationFn: payload => editingId ? appClient.entities.TitleDefinition.update(editingId, payload) : appClient.entities.TitleDefinition.create(payload),
    onSuccess: () => { refresh(); setForm(emptyForm); setEditingId(null); toast({ title: editingId ? "Titre modifié" : "Titre créé", description: "La condition est contrôlée automatiquement par le serveur." }); },
    onError: error => toast({ title: "Enregistrement impossible", description: error.message, variant: "destructive" }),
  });
  const remove = useMutation({ mutationFn: id => appClient.entities.TitleDefinition.delete(id), onSuccess: refresh });
  const requirementLabel = type => REQUIREMENTS.find(item => item[0] === type)?.[1] || type;
  const submit = event => {
    event.preventDefault();
    const label = form.label.trim();
    if (label.length < 2) return;
    save.mutate({ ...form, label, description: form.description.trim(), requirement_value: Math.max(1, Number(form.requirement_value || 1)) });
  };
  const edit = title => { setEditingId(title.id); setForm({ ...emptyForm, ...title }); };

  return <div className="space-y-5">
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-500/10"><Crown className="h-5 w-5 text-yellow-300" /></div><div><h2 className="font-display text-lg font-bold">Titres personnalisés</h2><p className="text-xs text-muted-foreground">Crée des titres end-game avec une condition vérifiée côté serveur.</p></div></div>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        <Input value={form.label} onChange={e => setForm(current => ({ ...current, label: e.target.value }))} placeholder="Nom du titre" maxLength={50} required />
        <Input value={form.icon} onChange={e => setForm(current => ({ ...current, icon: e.target.value }))} placeholder="Icône (ex: 👑)" maxLength={8} />
        <Input className="md:col-span-2" value={form.description} onChange={e => setForm(current => ({ ...current, description: e.target.value }))} placeholder="Description affichée au joueur" maxLength={140} />
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.requirement_type} onChange={e => setForm(current => ({ ...current, requirement_type: e.target.value }))}>{REQUIREMENTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <Input type="number" min="1" value={form.requirement_value} onChange={e => setForm(current => ({ ...current, requirement_value: e.target.value }))} placeholder="Objectif" required />
        <div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={save.isPending}><Plus className="mr-2 h-4 w-4" />{editingId ? "Enregistrer les modifications" : "Créer le titre"}</Button>{editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Annuler</Button>}</div>
      </form>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{titles.map(title => <div key={title.id} className={`rounded-2xl border bg-card p-4 ${title.is_active === false ? "border-border opacity-55" : "border-yellow-500/20"}`}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-xl">{title.icon || "👑"}</p><h3 className="mt-1 font-bold">{title.label}</h3><p className="mt-1 text-xs text-muted-foreground">{title.description || "Titre personnalisé"}</p></div><span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary">{title.is_active === false ? "INACTIF" : "ACTIF"}</span></div>
      <p className="mt-3 rounded-lg bg-secondary/40 p-2 text-[11px]">{requirementLabel(title.requirement_type)} : <strong>{Number(title.requirement_value || 1).toLocaleString()}</strong></p>
      <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => edit(title)}><Pencil className="h-3.5 w-3" /></Button><Button size="sm" variant="outline" onClick={() => appClient.entities.TitleDefinition.update(title.id, { is_active: title.is_active === false }).then(refresh)}><Power className="h-3.5 w-3" /></Button><Button size="sm" variant="destructive" onClick={() => remove.mutate(title.id)}><Trash2 className="h-3.5 w-3" /></Button></div>
    </div>)}</div>
    {!titles.length && <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Aucun titre personnalisé. Crée le premier ci-dessus.</div>}
  </div>;
}
