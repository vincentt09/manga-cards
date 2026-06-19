import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Frame, Plus, Trash2, Upload } from "lucide-react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const EMPTY = {
  name: "", description: "", rarity: "legendary", source_type: "shop", purchase_mode: "coins",
  price_coins: "", price_gems: "", price_eur: "", min_level: "1", manga_god_cards: "0", level_100_cards: "0", event_id: "", drop_chance: "1",
};

export default function FramesManager() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: frames = [] } = useQuery({ queryKey: ["admin_frames"], queryFn: () => appClient.entities.CardFrame.list("-created_date") });
  const { data: events = [] } = useQuery({ queryKey: ["drop_events"], queryFn: () => appClient.entities.DropEvent.list("-created_date") });
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!imageFile) throw new Error("Ajoute un PNG transparent au format 2:3.");
      const uploaded = await appClient.integrations.Core.UploadFile({ file: imageFile });
      const mode = ["gift", "event"].includes(form.source_type) ? "free" : form.purchase_mode;
      return appClient.entities.CardFrame.create({
        name: form.name.trim(), description: form.description.trim(), rarity: form.rarity,
        source_type: form.source_type, effect: "shimmer", image_url: uploaded.file_url,
        purchase_mode: mode, price_coins: ["coins", "mixed"].includes(mode) ? Number(form.price_coins || 0) : 0,
        price_gems: ["gems", "mixed"].includes(mode) ? Number(form.price_gems || 0) : 0,
        price_eur: mode === "real" ? Number(form.price_eur || 0) : 0,
        currency: mode, is_active: true, is_endgame: form.source_type === "endgame",
        is_free: form.source_type === "gift", event_id: form.source_type === "event" ? form.event_id : null,
        drop_chance: form.source_type === "event" ? Math.max(0.001, Math.min(100, Number(form.drop_chance || 1))) : 0,
        requirements: {
          min_level: Number(form.min_level || 1), manga_god_cards: Number(form.manga_god_cards || 0),
          level_100_cards: Number(form.level_100_cards || 0),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_frames"] });
      queryClient.invalidateQueries({ queryKey: ["frames"] });
      setForm(EMPTY); setImageFile(null); setShowForm(false);
      toast({ title: "✅ Cadre ajouté au catalogue" });
    },
    onError: (error) => toast({ title: "Création impossible", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.CardFrame.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin_frames"] }); queryClient.invalidateQueries({ queryKey: ["frames"] }); },
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => { event.preventDefault(); createMutation.mutate(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="font-heading font-bold uppercase text-sm">Gestion des cadres</h3><p className="text-xs text-muted-foreground">PNG transparent 2:3 · prix en jeu ou prix réel</p></div>
        <Button onClick={() => setShowForm((value) => !value)}><Plus className="w-4 h-4 mr-2" />Nouveau cadre</Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-xs font-semibold">Nom<Input value={form.name} onChange={(e) => update("name", e.target.value)} required className="mt-1.5" /></label>
            <label className="text-xs font-semibold">Image du cadre
              <span className="mt-1.5 h-10 px-3 rounded-md border border-input flex items-center gap-2 cursor-pointer"><Upload className="w-4 h-4" />{imageFile?.name || "Choisir un PNG transparent"}<input type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></span>
            </label>
          </div>
          <label className="text-xs font-semibold">Description<Input value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-1.5" /></label>
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="text-xs font-semibold">Rareté<select value={form.rarity} onChange={(e) => update("rarity", e.target.value)} className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3"><option value="rare">Rare</option><option value="epic">Épique</option><option value="legendary">Légendaire</option><option value="secret">Secret</option><option value="manga_god">Manga God</option></select></label>
            <label className="text-xs font-semibold">Catégorie<select value={form.source_type} onChange={(e) => update("source_type", e.target.value)} className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3"><option value="shop">Boutique</option><option value="endgame">End-game</option><option value="gift">Cadeau gratuit</option><option value="event">Drop d’événement</option></select></label>
            {!['gift', 'event'].includes(form.source_type) && <label className="text-xs font-semibold">Type de prix<select value={form.purchase_mode} onChange={(e) => update("purchase_mode", e.target.value)} className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3"><option value="coins">Pièces</option><option value="gems">Gemmes</option><option value="mixed">Pièces + gemmes</option><option value="real">Argent réel (€)</option></select></label>}
          </div>
          {!['gift', 'event'].includes(form.source_type) && <div className="grid sm:grid-cols-3 gap-4">
            {["coins", "mixed"].includes(form.purchase_mode) && <label className="text-xs font-semibold">Prix pièces<Input type="number" min="0" value={form.price_coins} onChange={(e) => update("price_coins", e.target.value)} required className="mt-1.5" /></label>}
            {["gems", "mixed"].includes(form.purchase_mode) && <label className="text-xs font-semibold">Prix gemmes<Input type="number" min="0" value={form.price_gems} onChange={(e) => update("price_gems", e.target.value)} required className="mt-1.5" /></label>}
            {form.purchase_mode === "real" && <label className="text-xs font-semibold">Prix euros<Input type="number" min="0.50" step="0.01" value={form.price_eur} onChange={(e) => update("price_eur", e.target.value)} required className="mt-1.5" /></label>}
          </div>}
          {form.source_type === "gift" && <p className="text-xs text-green-400">Chaque joueur pourra récupérer ce cadre gratuitement une seule fois.</p>}
          {form.source_type === "event" && <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-xs font-semibold">Événement associé<select value={form.event_id} onChange={(e) => update("event_id", e.target.value)} required className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3"><option value="">Choisir un événement</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label>
            <label className="text-xs font-semibold">Taux par booster (%)<Input type="number" min="0.001" max="100" step="0.001" value={form.drop_chance} onChange={(e) => update("drop_chance", e.target.value)} required className="mt-1.5" /></label>
          </div>}
          <div><p className="text-xs font-bold text-muted-foreground mb-2">Conditions facultatives</p><div className="grid sm:grid-cols-3 gap-4">
            <label className="text-xs">Niveau minimum<Input type="number" min="1" value={form.min_level} onChange={(e) => update("min_level", e.target.value)} className="mt-1" /></label>
            <label className="text-xs">Manga God requises<Input type="number" min="0" value={form.manga_god_cards} onChange={(e) => update("manga_god_cards", e.target.value)} className="mt-1" /></label>
            <label className="text-xs">Cartes niveau 100<Input type="number" min="0" value={form.level_100_cards} onChange={(e) => update("level_100_cards", e.target.value)} className="mt-1" /></label>
          </div></div>
          {form.source_type !== "gift" && form.purchase_mode === "real" && <p className="text-xs text-amber-400">Le prix sera publié, mais l’achat restera bloqué jusqu’à la connexion d’un prestataire de paiement sécurisé.</p>}
          <div className="flex gap-2"><Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Envoi…" : "Publier le cadre"}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button></div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {frames.map((frame) => <div key={frame.id} className="rounded-2xl border border-border bg-card p-4 flex gap-4">
          <div className="relative w-20 aspect-[2/3] bg-black rounded-lg overflow-hidden shrink-0"><img src={frame.image_url} alt={frame.name} className="absolute inset-0 w-full h-full object-fill" /></div>
          <div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><div><p className="font-bold truncate">{frame.name}</p><p className="text-xs text-muted-foreground capitalize">{frame.rarity} · {frame.source_type}</p></div>{frame.id !== "frame_legend_sakura" && <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(frame.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>}</div>
            <p className="text-xs mt-3">{Number(frame.price_coins || 0) > 0 && `${Number(frame.price_coins).toLocaleString("fr-FR")} 🪙 `}{Number(frame.price_gems || 0) > 0 && `${Number(frame.price_gems).toLocaleString("fr-FR")} 💎 `}{Number(frame.price_eur || 0) > 0 && `${Number(frame.price_eur).toFixed(2)} €`}</p>
          </div>
        </div>)}
        {!frames.length && <div className="text-sm text-muted-foreground"><Frame className="w-5 h-5 mb-2" />Aucun cadre publié.</div>}
      </div>
    </div>
  );
}
