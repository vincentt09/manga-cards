import React, { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, RefreshCw, Search, Filter, ImageOff, Check, Image, FileImage, Plus, Save, X, Package, Gift, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { CARD_POOL } from "@/lib/gameData";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const VERSION_TYPES = [
  { value: "normale", label: "Normale", color: "from-slate-400 to-slate-600", textColor: "text-slate-400", borderColor: "border-slate-500/30" },
  { value: "legendaire", label: "Légendaire", color: "from-yellow-400 to-amber-600", textColor: "text-yellow-300", borderColor: "border-yellow-500/30" },
  { value: "secrète", label: "Secrète", color: "from-rose-500 to-pink-700", textColor: "text-rose-300", borderColor: "border-rose-500/30" },
  { value: "manga_god", label: "Manga God", color: "from-cyan-500 to-blue-600", textColor: "text-cyan-300", borderColor: "border-cyan-500/30" },
];

export default function CardManager({ cardDefinitions = CARD_POOL, overrides, onSave, onReset }) {
  const [selectedManga, setSelectedManga] = useState("all");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingIds, setUploadingIds] = useState(new Set());
  const [successIds, setSuccessIds] = useState(new Set());
  const [showAddCharacter, setShowAddCharacter] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRefs = useRef({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: collections = [] } = useQuery({
    queryKey: ["anime_collections"],
    queryFn: () => appClient.entities.AnimeCollection.list("name"),
  });

  const mangas = useMemo(() => [...new Set(cardDefinitions.map(c => c.anime))].filter(m => m), [cardDefinitions]);
  const collectionById = useMemo(() => new Map(collections.map(collection => [collection.id, collection])), [collections]);

  const getOverrideUrl = (cardId) => overrides.find(o => o.card_id === cardId)?.image_url;

  const handleAddCharacter = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const collectionId = form.get("collection_id") || null;
    const collection = collections.find(item => item.id === collectionId);
    const anime = collection?.anime || String(form.get("anime") || "").trim();
    const name = String(form.get("name") || "").trim();
    const isCollector = form.get("is_collector") === "on";
    const selectedVersions = [...new Set(form.getAll("versions").map(String))].filter(version => VERSION_TYPES.some(item => item.value === version));
    if (!name || !anime) return toast({ title: "Informations manquantes", description: "Indique un personnage et une série.", variant: "destructive" });
    if (!selectedVersions.length) return toast({ title: "Aucune version choisie", description: "Sélectionne au moins une version de la carte.", variant: "destructive" });
    const templates = {
      normale: { power: 45, attack: 42, defense: 40, speed: 44 },
      legendaire: { power: 92, attack: 90, defense: 84, speed: 90 },
      "secrète": { power: 108, attack: 106, defense: 97, speed: 105 },
      manga_god: { power: 121, attack: 118, defense: 105, speed: 115 },
    };
    const existingVersions = new Set(cardDefinitions
      .filter(card => card.name.toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr") && card.anime === anime && (card.collection_id || null) === collectionId && Boolean(card.is_collector) === isCollector)
      .map(card => card.rarity));
    const versionsToCreate = selectedVersions.filter(version => !existingVersions.has(version));
    if (!versionsToCreate.length) return toast({ title: "Versions déjà présentes", description: `${name} possède déjà toutes les versions sélectionnées dans ${collection?.name || anime}.`, variant: "destructive" });
    await appClient.entities.CardDefinition.bulkCreate(versionsToCreate.map(rarity => {
      const stats = templates[rarity];
      return ({
      name, anime, rarity, collection_id: collectionId, edition: isCollector ? "collector" : "standard",
      edition_label: isCollector ? String(form.get("edition_label") || "Édition Collector") : "Standard",
      is_collector: isCollector, is_active: true, image_url: null,
      basePower: stats.power, baseAttack: stats.attack, baseDefense: stats.defense, baseSpeed: stats.speed,
      });
    }));
    await queryClient.invalidateQueries({ queryKey: ["card_definitions"] });
    setShowAddCharacter(false);
    toast({ title: `${versionsToCreate.length} version${versionsToCreate.length > 1 ? "s" : ""} créée${versionsToCreate.length > 1 ? "s" : ""}`, description: `${name} a été ajouté à ${collection?.name || anime}.` });
  };

  const handleUpload = async (card, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast({ title: "Fichier refusé", description: "Choisis une image PNG, JPG, WEBP ou GIF.", variant: "destructive" });
    if (file.size > 8 * 1024 * 1024) return toast({ title: "Image trop lourde", description: "La taille maximale est de 8 Mo.", variant: "destructive" });
    
    setUploadingIds(prev => new Set(prev).add(card.id));
    
    try {
      const result = await appClient.integrations.Core.UploadFile({ file });
      
      if (result?.file_url) {
        await onSave(card.id, card.name, result.file_url);
        setSuccessIds(prev => new Set(prev).add(card.id));
        setTimeout(() => {
          setSuccessIds(prev => {
            const next = new Set(prev);
            next.delete(card.id);
            return next;
          });
        }, 2000);
        toast({ 
          title: "Succès!", 
          description: `${card.name} - Image uploadée`,
          duration: 2000
        });
      } else {
        throw new Error('Aucune URL retournée');
      }
    } catch (error) {
      toast({ 
        title: "❌ Erreur", 
        description: error.message || 'Erreur inconnue', 
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setUploadingIds(prev => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    }
  };

  const triggerFileInput = (cardId) => {
    const input = fileInputRefs.current[cardId];
    if (input) {
      input.value = '';
      input.click();
    }
  };

  // Group cards by character
  const characterGroups = useMemo(() => {
    const groups = {};
    cardDefinitions.forEach(card => {
      if (!card.anime) return;
      
      // Extract base character name (remove " — Légendaire", " — Secrète", etc.)
      let baseName = card.name;
      const parts = card.name.split(" — ");
      if (parts.length > 1) {
        baseName = parts[0].trim();
      }
      
      const key = `${card.collection_id || "standard"}-${card.anime}-${baseName}`;
      if (!groups[key]) {
        groups[key] = {
          anime: card.anime,
          characterName: baseName,
          collectionId: card.collection_id || null,
          collectionName: collectionById.get(card.collection_id)?.name || null,
          versions: {}
        };
      }
      
      let versionType = card.rarity;
      
      if (!groups[key].versions[versionType]) {
        groups[key].versions[versionType] = [];
      }
      groups[key].versions[versionType].push(card);
    });
    return Object.values(groups);
  }, [cardDefinitions, collectionById]);

  const filteredGroups = useMemo(() => {
    let result = characterGroups;
    if (selectedManga !== "all") {
      result = result.filter(g => g.anime === selectedManga);
    }
    if (selectedCollection !== "all") {
      result = result.filter(g => g.collectionId === selectedCollection);
    }
    if (searchQuery) {
      result = result.filter(g => 
        g.characterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.anime.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [selectedManga, selectedCollection, searchQuery, characterGroups]);

  const openCollectionEditor = (collectionId) => {
    setSelectedCollection(collectionId);
    setSelectedManga("all");
    setShowAddCharacter(true);
  };

  const requestDelete = (cards, label) => {
    const uniqueCards = [...new Map(cards.filter(Boolean).map(card => [card.id, card])).values()];
    if (uniqueCards.length) setDeleteTarget({ cards: uniqueCards, label });
  };

  const handleDelete = async () => {
    if (!deleteTarget?.cards?.length || isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await appClient.functions.invoke("adminDeleteCardDefinitions", {
        card_definition_ids: deleteTarget.cards.map(card => card.id),
      });
      const result = response.data || response;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["card_definitions"] }),
        queryClient.invalidateQueries({ queryKey: ["card_overrides"] }),
        queryClient.invalidateQueries({ queryKey: ["cardImageOverrides"] }),
        queryClient.invalidateQueries({ queryKey: ["cards"] }),
        queryClient.invalidateQueries({ queryKey: ["admin_cards"] }),
        queryClient.invalidateQueries({ queryKey: ["all_cards_for_preview"] }),
        queryClient.invalidateQueries({ queryKey: ["admin_audit"] }),
      ]);
      toast({
        title: `${result.removed || deleteTarget.cards.length} version(s) retirée(s)`,
        description: result.preserved_owned_cards
          ? `${result.preserved_owned_cards} exemplaire(s) déjà possédé(s) restent visibles comme cartes héritage.`
          : "La carte ne pourra plus être obtenue dans les boosters.",
      });
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: "Suppression impossible", description: error.message || "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold">Gestion des Cartes</h2>
          <p className="text-xs text-muted-foreground">Gère les 4 versions de chaque personnage</p>
        </div>
        <Button onClick={() => setShowAddCharacter(value => !value)} className="gap-2">
          {showAddCharacter ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddCharacter ? "Annuler" : "Ajouter un personnage"}
        </Button>
      </div>

      {collections.length > 0 ? (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold">Boosters personnalisés</h3>
              <p className="text-[11px] text-muted-foreground">Choisis un booster pour nommer ses cartes et importer chaque design.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {collections.map(collection => {
              const definitions = cardDefinitions.filter(card => card.collection_id === collection.id);
              const characters = new Set(definitions.map(card => card.name)).size;
              const isSelected = selectedCollection === collection.id;
              return (
                <button
                  type="button"
                  key={collection.id}
                  onClick={() => openCollectionEditor(collection.id)}
                  className={`text-left rounded-xl border p-3 transition-all ${isSelected ? "border-primary bg-primary/15 ring-1 ring-primary/40" : "border-border bg-card/60 hover:border-primary/40"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${collection.color_gradient || "from-primary to-accent"} flex items-center justify-center text-xl shrink-0`}>
                      {collection.is_free ? <Gift className="w-5 h-5 text-white" /> : (collection.icon || "📦")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{collection.name}</p>
                      <p className="text-[10px] text-muted-foreground">{characters} carte{characters > 1 ? "s" : ""} nommée{characters > 1 ? "s" : ""} · {definitions.length} design{definitions.length > 1 ? "s" : ""}</p>
                      <p className="text-[10px] text-primary mt-1">Cliquer pour ajouter ou gérer</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-secondary/10 p-5 flex items-center gap-3">
          <Package className="w-9 h-9 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-bold">Aucun booster personnalisé</h3>
            <p className="text-xs text-muted-foreground">Crée d’abord un booster dans l’onglet Collections : il apparaîtra automatiquement ici pour recevoir ses cartes et ses designs.</p>
          </div>
        </section>
      )}

      {showAddCharacter && (
        <form onSubmit={handleAddCharacter} className="rounded-2xl border border-primary/30 bg-primary/5 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block">Personnage</label>
            <Input name="name" placeholder="Ex. Madara Uchiha" required />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block">Collection existante</label>
            <select name="collection_id" value={selectedCollection === "all" ? "" : selectedCollection} onChange={event => setSelectedCollection(event.target.value || "all")} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Aucune — utiliser la série</option>
              {collections.map(collection => <option key={collection.id} value={collection.id}>{collection.is_free ? "🎁 " : "📦 "}{collection.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block">Série / Anime</label>
            <Input name="anime" placeholder="Ex. Naruto" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block">Nom de l’édition</label>
            <Input name="edition_label" placeholder="Ex. Festival 2026" />
          </div>
          <fieldset className="md:col-span-2 rounded-xl border border-border/70 bg-background/50 p-3">
            <legend className="px-1 text-xs font-semibold">Versions à créer — choisis-en de 1 à 4</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {VERSION_TYPES.map(version => (
                <label key={version.value} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition-colors hover:bg-secondary/50 ${version.borderColor}`}>
                  <input type="checkbox" name="versions" value={version.value} defaultChecked className="h-4 w-4 accent-primary" />
                  <span className={version.textColor}>{version.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="is_collector" className="w-4 h-4" />
            Créer quatre versions Collector réservées au booster spécial sélectionné
          </label>
          <div className="md:col-span-2">
            <Button type="submit" className="gap-2"><Save className="w-4 h-4" />Créer les versions sélectionnées</Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un personnage ou manga..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-9 bg-secondary/50" 
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select 
            value={selectedManga} 
            onChange={e => setSelectedManga(e.target.value)}
            className="bg-secondary/50 border border-border rounded-lg pl-9 pr-8 py-2 text-sm text-foreground appearance-none cursor-pointer"
          >
            <option value="all">Tous les mangas</option>
            {mangas.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <select
          value={selectedCollection}
          onChange={event => setSelectedCollection(event.target.value)}
          className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground cursor-pointer"
        >
          <option value="all">Tous les boosters</option>
          {collections.map(collection => (
            <option key={collection.id} value={collection.id}>{collection.is_free ? "🎁 " : "📦 "}{collection.name}</option>
          ))}
        </select>
      </div>

      {/* Character Cards */}
      <div className="space-y-4">
        {filteredGroups.map((group, idx) => (
          <div key={idx} className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-5">
            {/* Character Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-sm font-bold text-white">{group.characterName[0].toUpperCase()}</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-base">{group.characterName}</h3>
                <p className="text-xs text-muted-foreground">{group.anime}</p>
                {group.collectionName && (
                  <p className="mt-1 inline-flex rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">📦 {group.collectionName}</p>
                )}
              </div>
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => requestDelete(Object.values(group.versions).flat(), group.characterName)}
                  title={`Retirer ${group.characterName} de cette collection`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Retirer</span>
                </Button>
                {VERSION_TYPES.map(v => {
                  const hasVersion = group.versions[v.value]?.length > 0;
                  return (
                    <div key={v.value} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${hasVersion ? `${v.textColor}` : "text-muted-foreground opacity-50"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${hasVersion ? `bg-${v.value === 'legendaire' ? 'yellow' : v.value === 'secrète' ? 'rose' : v.value === 'manga_god' ? 'cyan' : 'slate'}-500` : "bg-muted-foreground"}`} />
                      {v.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Version Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {VERSION_TYPES.map(version => {
                const cards = group.versions[version.value] || [];
                const card = cards[0];
                
                if (!card) {
                  return (
                    <div key={version.value} className="p-4 rounded-xl border border-dashed border-border bg-secondary/5 opacity-50 flex flex-col items-center justify-center min-h-[280px]">
                      <p className={`text-xs font-semibold ${version.textColor} mb-1`}>{version.label}</p>
                      <p className="text-[10px] text-muted-foreground">Non disponible</p>
                    </div>
                  );
                }

                const override = getOverrideUrl(card.id);
                const displayUrl = override || card.image_url;
                const isUploading = uploadingIds.has(card.id);
                const isSuccess = successIds.has(card.id);
                const hasImage = !!displayUrl;

                return (
                  <div key={version.value} className={`group relative p-3 rounded-xl border transition-all duration-200 hover:shadow-lg ${override ? `${version.borderColor} bg-gradient-to-br ${version.color}/5` : "border-border bg-secondary/10 hover:border-primary/30"}`}>
                    {/* Version Badge */}
                    <div className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r ${version.color} text-white shadow-lg`}>
                      {version.label}
                    </div>

                    {/* Image Container with Drop Zone */}
                    <div 
                      className={`aspect-[3/4] mb-3 rounded-xl overflow-hidden relative mt-4 transition-all duration-300 ${
                        isUploading 
                          ? 'bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/50' 
                          : isSuccess 
                            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50'
                            : hasImage 
                              ? 'bg-secondary/20 border-2 border-transparent hover:border-primary/30' 
                              : 'bg-gradient-to-br from-secondary/30 to-secondary/50 border-2 border-dashed border-border hover:border-primary/50 hover:from-primary/10 hover:to-accent/10'
                      }`}
                      onDragOver={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        e.currentTarget.classList.add('scale-[1.02]');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('scale-[1.02]');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('scale-[1.02]');
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          handleUpload(card, file);
                        }
                      }}
                    >
                      {isUploading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/30 to-accent/30 backdrop-blur-sm">
                          <div className="relative">
                            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Upload className="w-6 h-6 text-white animate-pulse" />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-white">Upload en cours...</p>
                            <p className="text-xs text-white/70">Veuillez patienter</p>
                          </div>
                        </div>
                      ) : isSuccess ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-green-500/30 to-emerald-500/30 backdrop-blur-sm">
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/50"
                          >
                            <Check className="w-8 h-8 text-white" />
                          </motion.div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-green-400">✓ Upload réussi!</p>
                            <p className="text-xs text-green-300/80">Image enregistrée</p>
                          </div>
                        </div>
                      ) : hasImage ? (
                        <div className="relative w-full h-full group/image">
                          <img 
                            key={displayUrl}
                            src={displayUrl} 
                            alt={card.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110 rounded-xl"
                            onLoad={e => {
                              e.currentTarget.style.display = '';
                              e.currentTarget.nextElementSibling?.classList.add('hidden');
                            }}
                            onError={e => { 
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }} 
                          />
                          <div className="hidden absolute inset-0 bg-destructive/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2 text-white">
                              <ImageOff className="w-10 h-10 opacity-50" />
                              <p className="text-xs font-medium">Image non disponible</p>
                            </div>
                          </div>
                          {/* Upload overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover/image:opacity-100 transition-all duration-300 rounded-xl flex items-end justify-center p-4">
                            <Button 
                              size="sm" 
                              className="h-10 px-6 text-sm bg-primary/90 hover:bg-primary backdrop-blur-md shadow-lg" 
                              onClick={() => triggerFileInput(card.id)}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Remplacer
                            </Button>
                          </div>
                          {/* Image quality indicator */}
                          <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                            <p className="text-[9px] text-white/80 font-medium">HD</p>
                          </div>
                        </div>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer rounded-xl hover:bg-gradient-to-br hover:from-primary/15 hover:to-accent/15 transition-all duration-300">
                          <div className="relative group">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-primary/30 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300 shadow-lg">
                              <FileImage className="w-10 h-10 text-primary" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Upload className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-foreground mb-1">Glissez-déposez ou cliquez</p>
                            <p className="text-[10px] text-muted-foreground">PNG, JPG, WEBP, GIF (max 8 Mo)</p>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
                            <Image className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground">Qualité recommandée: 500x700px</span>
                          </div>
                        </label>
                      )}
                      
                      {/* Hidden file input */}
                      <input
                        type="file"
                        ref={el => fileInputRefs.current[card.id] = el}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUpload(card, file);
                          }
                        }}
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                        className="hidden"
                      />
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground font-medium truncate">{card.name}</p>

                      <div className="flex gap-1.5">
                        <Button 
                          size="sm" 
                          className="h-8 px-3 text-xs flex-1 bg-primary/10 hover:bg-primary/20 text-primary" 
                          onClick={() => triggerFileInput(card.id)} 
                          disabled={isUploading}
                        >
                          <Upload className="w-3 h-3" />
                          {isUploading ? "..." : hasImage ? "Modifier" : "Uploader"}
                        </Button>
                        {override && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2 text-destructive hover:bg-destructive/10" 
                            onClick={() => onReset(card.id)}
                            title="Réinitialiser à l'image d'origine"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => requestDelete([card], `${card.name} · ${version.label}`)}
                          title={`Supprimer la version ${version.label}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/30 flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Aucun personnage trouvé</p>
          <p className="text-xs text-muted-foreground mt-1">Essayez de modifier vos filtres</p>
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={open => !open && !isDeleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer {deleteTarget?.label || "cette carte"} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.cards?.length || 0} version(s) seront retirées du catalogue, des boosters et des cadeaux en attente.
              Les exemplaires déjà obtenus par les joueurs seront conservés comme cartes héritage, sans rattachement au booster.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={event => {
                event.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {isDeleting ? "Suppression…" : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
