import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Save, X, Coins, Gem, Gift, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const RARITY_OPTIONS = [
  { value: "legendaire", label: "✦ Légendaire" },
  { value: "secrète", label: "⚡ Secrète" },
  { value: "manga_god", label: "🔥 Manga God" },
];

const CURRENCY_OPTIONS = [
  { value: "coins", label: "Pièces", icon: Coins },
  { value: "gems", label: "Gemmes", icon: Gem },
];

const COLOR_PRESETS = [
  { id: "orange", name: "Orange (Naruto)", gradient: "from-orange-500 to-orange-900" },
  { id: "red", name: "Rouge (One Piece)", gradient: "from-red-500 to-red-900" },
  { id: "yellow", name: "Jaune (Dragon Ball)", gradient: "from-yellow-500 to-yellow-900" },
  { id: "emerald", name: "Émeraude (AOT)", gradient: "from-emerald-600 to-emerald-900" },
  { id: "cyan", name: "Cyan (Demon Slayer)", gradient: "from-cyan-500 to-cyan-900" },
  { id: "violet", name: "Violet (JJK)", gradient: "from-violet-500 to-violet-900" },
  { id: "green", name: "Vert (MHA)", gradient: "from-green-500 to-green-900" },
  { id: "rose", name: "Rose (Premium)", gradient: "from-rose-500 to-pink-900" },
];

export default function AnimeCollectionsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const refreshCollections = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["admin_anime_collections"] }),
    queryClient.invalidateQueries({ queryKey: ["anime_collections"] }),
  ]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [addingCharacterTo, setAddingCharacterTo] = useState(null);

  const { data: collectionsResponse } = useQuery({
    queryKey: ["admin_anime_collections"],
    queryFn: async () => {
      const response = await appClient.functions.invoke("getAdminCollections");
      if (response.data?.merged?.length || response.data?.attached_cards > 0 || response.data?.normalized_anime_names > 0) queryClient.invalidateQueries({ queryKey: ["card_definitions"] });
      return response;
    },
    refetchOnMount: "always",
  });
  const collections = collectionsResponse?.data?.collections || [];
  const { data: cardDefinitions = [] } = useQuery({ queryKey: ["card_definitions"], queryFn: () => appClient.entities.CardDefinition.list("anime") });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await appClient.entities.AnimeCollection.create(data);
    },
    onSuccess: () => {
      refreshCollections();
      setShowForm(false);
      toast({ title: "✅ Collection créée", description: "Le booster est maintenant disponible dans le shop" });
    },
    onError: (error) => toast({ title: "Création impossible", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await appClient.entities.AnimeCollection.update(id, data);
    },
    onSuccess: () => {
      refreshCollections();
      setEditingId(null);
      toast({ title: "✅ Collection mise à jour" });
    },
    onError: (error) => toast({ title: "Modification impossible", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await appClient.entities.AnimeCollection.delete(id);
    },
    onSuccess: () => {
      refreshCollections();
      toast({ title: "🗑️ Collection supprimée" });
    },
  });

  const addCharacterMutation = useMutation({
    mutationFn: (payload) => appClient.functions.invoke("adminAddCollectionCharacter", payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["card_definitions"] });
      refreshCollections();
      setAddingCharacterTo(null);
      toast({ title: "4 versions ajoutées", description: `${response.data.cards[0].name} est maintenant disponible dans ${response.data.collection.name}.` });
    },
    onError: (error) => toast({ title: "Ajout impossible", description: error.message, variant: "destructive" }),
  });

  const submitCharacter = (event, collection) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addCharacterMutation.mutate({ collection_id: collection.id, name: data.get("character_name"), is_collector: data.get("is_collector") === "on", edition_label: data.get("edition_label") });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      anime: formData.get("anime") || null,
      description: formData.get("description"),
      base_price: Number(formData.get("base_price")),
      currency: formData.get("currency"),
      guaranteed_rarity: formData.get("guaranteed_rarity"),
      unlock_level: Number(formData.get("unlock_level")),
      color_gradient: formData.get("color_gradient"),
      icon: formData.get("icon") || "📦",
      cards_count: Math.max(1, Math.min(10, Number(formData.get("cards_count")) || 1)),
      is_free: formData.get("is_free") === "on",
      max_claims_per_player: Math.max(1, Math.min(100, Number(formData.get("max_claims_per_player")) || 1)),
      is_limited: formData.get("is_limited") === "on",
      collector_only: formData.get("collector_only") === "on",
      starts_at: formData.get("starts_at") ? new Date(formData.get("starts_at")).toISOString() : null,
      ends_at: formData.get("ends_at") ? new Date(formData.get("ends_at")).toISOString() : null,
      is_active: formData.get("is_active") === "on",
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (collection) => {
    setEditingId(collection.id);
    setShowForm(true);
  };
  const charactersFor = (collection) => [...new Set(cardDefinitions.filter(card => card.collection_id === collection.id).map(card => card.name))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider">Collections d'Anime</h3>
          <p className="text-xs text-muted-foreground">Crée des boosters personnalisés pour chaque série</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          {showForm ? "Annuler" : "Nouvelle Collection"}
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Nom du booster</label>
                    <Input name="name" defaultValue={editingId ? collections.find(c => c.id === editingId)?.name : ""} placeholder="ex: Booster Naruto" required className="bg-secondary/30" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Série anime (optionnel)</label>
                    <Input name="anime" defaultValue={editingId ? collections.find(c => c.id === editingId)?.anime : ""} placeholder="ex: Naruto" className="bg-secondary/30" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Description</label>
                    <Input name="description" defaultValue={editingId ? collections.find(c => c.id === editingId)?.description : ""} placeholder="ex: 3 cartes Naruto · Légendaire garantie" required className="bg-secondary/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block">Prix</label>
                      <Input type="number" name="base_price" defaultValue={editingId ? collections.find(c => c.id === editingId)?.base_price : 600} required className="bg-secondary/30" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block">Devise</label>
                      <select name="currency" defaultValue={editingId ? collections.find(c => c.id === editingId)?.currency : "coins"} className="w-full h-10 rounded-md border border-input bg-secondary/30 px-3 text-sm">
                        <option value="coins">Pièces</option>
                        <option value="gems">Gemmes</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Rareté garantie</label>
                    <select name="guaranteed_rarity" defaultValue={editingId ? collections.find(c => c.id === editingId)?.guaranteed_rarity : "legendaire"} className="w-full h-10 rounded-md border border-input bg-secondary/30 px-3 text-sm">
                      {RARITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Niveau requis</label>
                    <Input type="number" name="unlock_level" defaultValue={editingId ? collections.find(c => c.id === editingId)?.unlock_level : 1} min="1" required className="bg-secondary/30" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Cartes obtenues par ouverture</label>
                    <Input type="number" name="cards_count" defaultValue={editingId ? collections.find(c => c.id === editingId)?.cards_count || 1 : 1} min="1" max="10" required className="bg-secondary/30" />
                    <p className="mt-1 text-[10px] text-muted-foreground">De 1 à 10 cartes. Un booster peut donc ne contenir qu'une seule carte spéciale.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold mb-1.5 block">Couleur du booster</label>
                    <div className="grid grid-cols-4 gap-2">
                      {COLOR_PRESETS.map(preset => (
                        <label key={preset.id} className="relative cursor-pointer">
                          <input type="radio" name="color_gradient" value={preset.gradient} defaultChecked={editingId ? collections.find(c => c.id === editingId)?.color_gradient?.includes(preset.id) : preset.id === "orange"} className="peer sr-only" />
                          <div className={`h-10 rounded-lg bg-gradient-to-r ${preset.gradient} peer-checked:ring-2 peer-checked:ring-primary peer-checked:ring-offset-2 ring-offset-card transition-all`} />
                          <p className="text-[10px] text-center mt-1 text-muted-foreground">{preset.name}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Icône (emoji)</label>
                    <Input name="icon" defaultValue={editingId ? collections.find(c => c.id === editingId)?.icon : "📦"} placeholder="📦" className="bg-secondary/30" />
                  </div>
                  <div className="md:col-span-2 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input type="checkbox" name="is_active" defaultChecked={editingId ? collections.find(c => c.id === editingId)?.is_active !== false : true} />
                      Collection active et visible dans le jeu
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                      <input type="checkbox" name="is_free" defaultChecked={editingId ? collections.find(c => c.id === editingId)?.is_free : false} />
                      <Gift className="w-4 h-4" /> Offrir ce booster gratuitement aux joueurs
                    </label>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Nombre maximum de cadeaux par joueur</label>
                      <Input type="number" name="max_claims_per_player" min="1" max="100" defaultValue={editingId ? collections.find(c => c.id === editingId)?.max_claims_per_player || 1 : 1} />
                    </div>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input type="checkbox" name="is_limited" defaultChecked={editingId ? collections.find(c => c.id === editingId)?.is_limited : false} />
                      Booster spécial à durée limitée
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="collector_only" defaultChecked={editingId ? collections.find(c => c.id === editingId)?.collector_only : false} />
                      Contient uniquement les cartes Édition Collector liées à cette collection
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Début</label>
                        <Input type="datetime-local" name="starts_at" defaultValue={editingId && collections.find(c => c.id === editingId)?.starts_at ? collections.find(c => c.id === editingId).starts_at.slice(0, 16) : ""} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Fin</label>
                        <Input type="datetime-local" name="ends_at" defaultValue={editingId && collections.find(c => c.id === editingId)?.ends_at ? collections.find(c => c.id === editingId).ends_at.slice(0, 16) : ""} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Associe ensuite au moins autant de cartes à cette collection. Pour un cadeau précis, ajoute une seule carte et choisis 1 carte par ouverture.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Button type="submit" className="gap-2">
                    <Save className="w-4 h-4" />
                    {editingId ? "Mettre à jour" : "Créer la collection"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>
                    <X className="w-4 h-4" />
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Collections existantes */}
      <div className="grid grid-cols-1 gap-3">
        {collections.map((collection, i) => (
          <motion.div
            key={collection.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${collection.color_gradient} flex items-center justify-center text-2xl shrink-0`}>
                      {collection.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm truncate">{collection.name}</h4>
                        {collection.is_active !== false && (!collection.ends_at || new Date(collection.ends_at) > new Date()) && (!collection.starts_at || new Date(collection.starts_at) <= new Date()) ? (
                          <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-semibold">Disponible</span>
                        ) : collection.starts_at && new Date(collection.starts_at) > new Date() ? (
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-full font-semibold">Programmé</span>
                        ) : collection.ends_at && new Date(collection.ends_at) <= new Date() ? (
                          <span className="text-[10px] bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded-full font-semibold">Terminé</span>
                        ) : (
                          <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-semibold">Inactif</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{collection.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="flex items-center gap-1 text-yellow-400">
                          💰 {collection.base_price.toLocaleString()} {collection.currency}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">Niveau {collection.unlock_level} requis</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-primary">{collection.cards_count || 1} carte{Number(collection.cards_count || 1) > 1 ? "s" : ""} par ouverture</span>
                        {collection.is_free && <span className="text-emerald-400">🎁 Offert ×{collection.max_claims_per_player || 1}/joueur</span>}
                        {collection.is_limited && <span className="text-orange-400">Édition limitée</span>}
                        {collection.collector_only && <span className="text-cyan-400">Collector</span>}
                        {collection.starts_at && <span className="text-muted-foreground">Début : {new Date(collection.starts_at).toLocaleString("fr-FR")}</span>}
                        {collection.ends_at && <span className="text-muted-foreground">Fin : {new Date(collection.ends_at).toLocaleString("fr-FR")}</span>}
                        <span className="text-muted-foreground">•</span>
                        <span className="text-primary">Garantie: {RARITY_OPTIONS.find(r => r.value === collection.guaranteed_rarity)?.label}</span>
                        <span className="inline-flex items-center gap-1 text-cyan-300"><Users className="h-3 w-3" />{charactersFor(collection).length} personnages</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setAddingCharacterTo(addingCharacterTo === collection.id ? null : collection.id)} title="Ajouter un personnage">
                      <UserPlus className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(collection)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(collection.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {addingCharacterTo === collection.id && <form onSubmit={(event) => submitCharacter(event, collection)} className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2"><label className="text-xs font-semibold">Nom du personnage<Input name="character_name" required minLength={2} maxLength={60} placeholder="Ex. Shanks" className="mt-1.5" /></label><label className="text-xs font-semibold">Nom de l’édition collector<Input name="edition_label" placeholder="Édition Collector" className="mt-1.5" /></label><label className="flex items-center gap-2 text-xs sm:col-span-2"><input type="checkbox" name="is_collector" />Créer comme édition collector</label><div className="flex gap-2 sm:col-span-2"><Button type="submit" size="sm" disabled={addCharacterMutation.isPending}><UserPlus className="mr-1.5 h-4 w-4" />{addCharacterMutation.isPending ? "Création…" : "Créer les 4 versions"}</Button><Button type="button" size="sm" variant="ghost" onClick={() => setAddingCharacterTo(null)}>Annuler</Button></div></form>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
