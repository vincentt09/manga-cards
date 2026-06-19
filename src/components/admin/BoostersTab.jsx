import React, { useState, useMemo, useRef } from "react";
import { Edit2, Save, X, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { CARD_POOL } from "@/lib/gameData";
import { appClient } from "@/api/appClient";

export default function BoostersTab({ overrides, onSave, onReset }) {
  const [editingId, setEditingId] = useState(null);
  const [editUrl, setEditUrl] = useState("");
  const [selectedManga, setSelectedManga] = useState("all");
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRefs = useRef({});
  const { toast } = useToast();

  const mangas = useMemo(() => [...new Set(CARD_POOL.map(c => c.anime))].filter(m => m), []);
  
  const versionTypes = [
    { value: "common", label: "Commune", color: "text-slate-400" },
    { value: "legendary", label: "Légendaire", color: "text-yellow-300" },
    { value: "secret", label: "Secrète", color: "text-rose-300" },
    { value: "manga", label: "Manga", color: "text-blue-400" },
  ];

  const getOverrideUrl = (cardId) => overrides.find(o => o.card_id === cardId)?.image_url;

  const startEdit = (card) => {
    setEditingId(card.id);
    setEditUrl(getOverrideUrl(card.id) || card.image_url || "");
  };

  const handleUpload = async (card, file) => {
    if (!file) return;
    setUploadingId(card.id);
    try {
      const result = await appClient.integrations.Core.UploadFile({ file });
      if (result.file_url) {
        await onSave(card.id, card.name, result.file_url);
        toast({
          title: "✅ Image uploadée",
          description: `${card.name} — nouvelle image enregistrée`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "❌ Erreur d'upload",
        description: "Une erreur est survenue lors de l'upload",
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const triggerFileInput = (cardId) => {
    if (fileInputRefs.current[cardId]) {
      fileInputRefs.current[cardId].click();
    }
  };

  // Group cards by character base name (without version suffix)
  const characterGroups = useMemo(() => {
    const groups = {};
    CARD_POOL.forEach(card => {
      if (!card.anime) return; // Skip non-manga cards
      
      // Extract base character name (remove version indicators)
      let baseName = card.name;
      if (card.name.includes(" — ")) {
        baseName = card.name.split(" — ")[0].trim();
      } else if (card.name.includes(" (")) {
        baseName = card.name.split(" (")[0].trim();
      }
      
      const key = `${card.anime}-${baseName}`;
      if (!groups[key]) {
        groups[key] = {
          anime: card.anime,
          characterName: baseName,
          versions: {}
        };
      }
      
      // Determine version type
      let versionType = card.rarity;
      if (card.rarity === "common" && card.anime) versionType = "manga";
      
      if (!groups[key].versions[versionType]) {
        groups[key].versions[versionType] = [];
      }
      groups[key].versions[versionType].push(card);
    });
    return Object.values(groups);
  }, []);

  const filteredGroups = useMemo(() => {
    if (selectedManga === "all") return characterGroups;
    return characterGroups.filter(g => g.anime === selectedManga);
  }, [selectedManga, characterGroups]);

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">Chaque personnage a 4 versions : Commune, Légendaire, Secrète et Manga. Modifie les images individuellement ou upload de nouveaux fichiers.</p>

      <div className="mb-4">
        <select value={selectedManga} onChange={e => setSelectedManga(e.target.value)}
          className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground">
          <option value="all">Tous les mangas</option>
          {mangas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="space-y-6">
        {filteredGroups.map((group, idx) => (
          <div key={idx} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <h3 className="font-display font-bold text-sm uppercase">{group.characterName}</h3>
              <span className="text-xs text-muted-foreground">· {group.anime}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {versionTypes.map(version => {
                const cards = group.versions[version.value] || [];
                const card = cards[0]; // Take first card of this version
                
                if (!card) {
                  return (
                    <div key={version.value} className="p-3 rounded-xl border border-border bg-secondary/10 opacity-50">
                      <p className={`text-xs font-semibold ${version.color}`}>{version.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Non disponible</p>
                    </div>
                  );
                }

                const override = getOverrideUrl(card.id);
                const displayUrl = override || card.image_url;
                const isEditing = editingId === card.id;
                const isUploading = uploadingId === card.id;

                return (
                  <div key={version.value} className={`p-3 rounded-xl border ${override ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/20"}`}>
                    <p className={`text-xs font-semibold ${version.color} mb-2`}>{version.label}</p>
                    
                    <div className="aspect-[3/4] mb-2 rounded-lg overflow-hidden bg-secondary/30 relative">
                      <img src={displayUrl} alt={card.name}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.opacity = "0.3"; }} />
                      
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[9px] text-muted-foreground truncate mb-2">{card.name}</p>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={el => fileInputRefs.current[card.id] = el}
                      onChange={(e) => handleUpload(card, e.target.files[0])}
                      accept="image/*"
                      className="hidden"
                    />

                    {isEditing && (
                      <div className="flex gap-1">
                        <Input value={editUrl} onChange={e => setEditUrl(e.target.value)}
                          placeholder="URL..." className="h-6 text-[10px] bg-secondary/50" />
                        <Button size="sm" className="h-6 px-1 text-[10px]" onClick={() => { onSave(card.id, card.name, editUrl); setEditingId(null); }}>
                          <Save className="w-2.5 h-2.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => setEditingId(null)}>
                          <X className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 px-1 text-xs flex-1" onClick={() => triggerFileInput(card.id)} disabled={isUploading}>
                          <Upload className="w-3 h-3" />
                          {isUploading ? "..." : "Upload"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => startEdit(card)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        {override && (
                          <Button size="sm" variant="ghost" className="h-6 px-1 text-destructive" onClick={() => onReset(card.id)}>
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
