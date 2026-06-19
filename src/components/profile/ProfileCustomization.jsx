import React, { useEffect, useState } from "react";
import { appClient } from "@/api/appClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const BANNER_COLORS = [
  { id: "purple", name: "Violet", gradient: "from-purple-600 to-pink-700" },
  { id: "blue", name: "Bleu", gradient: "from-blue-600 to-cyan-700" },
  { id: "red", name: "Rouge", gradient: "from-red-600 to-orange-700" },
  { id: "green", name: "Vert", gradient: "from-green-600 to-emerald-700" },
  { id: "gold", name: "Or", gradient: "from-yellow-500 to-amber-700" },
  { id: "dark", name: "Sombre", gradient: "from-slate-800 to-slate-950" },
];

export default function ProfileCustomization({ profile, user, onUpdated }) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(profile?.display_name || user?.full_name || "");
  const [selectedBanner, setSelectedBanner] = useState(profile?.banner_id || "purple");
  const [bio, setBio] = useState(profile?.bio || "");
  const [favoriteAnime, setFavoriteAnime] = useState(profile?.favorite_anime || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || user?.avatar_url || "");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name || user?.full_name || "");
    setSelectedBanner(profile?.banner_id || "purple");
    setBio(profile?.bio || "");
    setFavoriteAnime(profile?.favorite_anime || "");
    setAvatarUrl(profile?.avatar_url || user?.avatar_url || "");
  }, [profile, user]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const pseudo = displayName.trim();
      if (pseudo.length < 3 || pseudo.length > 24) throw new Error("Le pseudo doit contenir entre 3 et 24 caractères.");

      await appClient.auth.updateMe({ full_name: pseudo, avatar_url: avatarUrl || null });
      await appClient.entities.PlayerProfile.update(profile.id, {
        banner_id: selectedBanner,
        display_name: pseudo,
        bio: bio.trim().slice(0, 160),
        favorite_anime: favoriteAnime.trim().slice(0, 40),
        avatar_url: avatarUrl || null,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["profiles"] }),
        queryClient.invalidateQueries({ queryKey: ["users"] }),
      ]);
      await onUpdated?.();
      toast.success("Profil personnalisé sauvegardé ! ✨");
    },
    onError: (error) => toast.error(error.message || "Impossible de sauvegarder le profil."),
  });

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choisis une image valide.");
    setIsUploading(true);
    try {
      const uploaded = await appClient.integrations.Core.UploadFile({ file });
      setAvatarUrl(uploaded.file_url);
    } catch (error) {
      toast.error(error.message || "Impossible d'envoyer l'avatar.");
    } finally {
      setIsUploading(false);
    }
  };

  const currentBanner = BANNER_COLORS.find((banner) => banner.id === selectedBanner) || BANNER_COLORS[0];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className={`h-32 bg-gradient-to-r ${currentBanner.gradient} relative`}>
        <div className="absolute inset-0 shimmer" />
      </div>

      <div className="px-6 pb-6 -mt-12 relative">
        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center border-4 border-card shadow-xl overflow-hidden">
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-white" />}
            <label className="absolute inset-x-0 bottom-0 h-8 bg-black/70 flex items-center justify-center cursor-pointer text-white text-[10px]">
              <Upload className="w-3 h-3 mr-1" />{isUploading ? "Envoi..." : "Avatar"}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleAvatarUpload} disabled={isUploading} />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Pseudo public</Label>
            <Input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={24} className="bg-secondary/50 border-border" placeholder="Votre pseudo" />
            <p className="text-xs text-muted-foreground">Entre 3 et 24 caractères. Visible dans le classement.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="favoriteAnime">Manga préféré</Label>
            <Input id="favoriteAnime" value={favoriteAnime} onChange={(event) => setFavoriteAnime(event.target.value)} maxLength={40} placeholder="Ex. One Piece" className="bg-secondary/50 border-border" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profileBio">Bio</Label>
            <textarea id="profileBio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={160} rows={3} placeholder="Présente ton style de collection..." className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm resize-none" />
            <p className="text-[10px] text-muted-foreground text-right">{bio.length}/160</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Bannière</Label>
            <div className="grid grid-cols-3 gap-2">
              {BANNER_COLORS.map((banner) => (
                <button type="button" key={banner.id} onClick={() => setSelectedBanner(banner.id)} className={`h-12 rounded-lg bg-gradient-to-r ${banner.gradient} border-2 transition-all ${selectedBanner === banner.id ? "border-white shadow-lg" : "border-transparent opacity-70 hover:opacity-100"}`}>
                  <span className="sr-only">{banner.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
            <div className="flex justify-between text-xs gap-3"><span className="text-muted-foreground">Email</span><span className="font-medium truncate">{user?.email}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Rôle</span><span className="font-medium capitalize text-primary">{user?.role}</span></div>
          </div>

          <Button onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending || isUploading || !profile} className="w-full bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            {updateProfileMutation.isPending ? "Sauvegarde..." : "Sauvegarder le profil"}
          </Button>
        </div>
      </div>
    </div>
  );
}
