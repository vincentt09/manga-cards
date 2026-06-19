import React from "react";
import { Sparkles, Star, Zap } from "lucide-react";

const rarityEffects = {
  common: "border-slate-500/40",
  rare: "border-blue-400/60 shadow-blue-500/20",
  epic: "border-purple-400/70 shadow-purple-500/30",
  legendary: "border-yellow-400/80 shadow-yellow-500/40",
  exclusive: "border-red-400/90 shadow-red-500/50",
};

export default function ProfilePreview({ profile, userCosmetics, cards = [] }) {
  const equipped = userCosmetics.filter(uc => uc.is_equipped);
  
  const avatar = equipped.find(uc => uc.item_type === 'avatar');
  const banner = equipped.find(uc => uc.item_type === 'banner' || uc.item_type === 'profile_background');
  const frame = equipped.find(uc => uc.item_type === 'card_frame');
  const effect = equipped.find(uc => uc.item_type === 'card_effect');

  const sampleCard = cards[0];

  return (
    <div className="space-y-6">
      {/* Bannière de profil */}
      <div className="relative h-48 rounded-2xl overflow-hidden border border-border">
        {banner?.item_image_url ? (
          <img src={banner.item_image_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Avatar */}
        <div className="absolute -bottom-16 left-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-card overflow-hidden bg-secondary">
              {avatar?.item_image_url ? (
                <img src={avatar.item_image_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                  <span className="text-4xl font-bold text-white">
                    {profile?.created_by_id?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>
            {avatar && (
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${
                avatar.item_rarity === 'legendary' ? 'bg-yellow-500' :
                avatar.item_rarity === 'epic' ? 'bg-purple-500' :
                avatar.item_rarity === 'rare' ? 'bg-blue-500' : 'bg-slate-500'
              }`}>
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
            )}
          </div>
        </div>

        {/* Niveau et XP */}
        <div className="absolute bottom-4 right-8 text-right">
          <div className="text-2xl font-display font-bold text-white">Niveau {profile?.level || 1}</div>
          <div className="text-sm text-muted-foreground">{profile?.xp?.toLocaleString() || 0} XP</div>
        </div>
      </div>

      {/* Informations du profil */}
      <div className="mt-20 p-6 rounded-2xl bg-card/50 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-display font-bold">
              {profile?.created_by_id ? `Joueur #${profile.created_by_id.slice(0, 8)}` : "Joueur"}
            </h2>
            <p className="text-sm text-muted-foreground">Collectionneur de cartes</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{profile?.coins?.toLocaleString() || 0}</div>
              <div className="text-xs text-muted-foreground">Pièces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{profile?.gems?.toLocaleString() || 0}</div>
              <div className="text-xs text-muted-foreground">Gemmes</div>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-secondary/30 border border-border text-center">
            <div className="text-2xl font-bold text-primary">{cards.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Cartes</div>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30 border border-border text-center">
            <div className="text-2xl font-bold text-purple-400">{equipped.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Cosmétiques</div>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30 border border-border text-center">
            <div className="text-2xl font-bold text-green-400">{cards.reduce((s, c) => s + (c.power || 0), 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">Puissance Totale</div>
          </div>
        </div>
      </div>

      {/* Aperçu des effets de cartes */}
      {sampleCard && (
        <div className="p-6 rounded-2xl bg-card/50 border border-border">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Aperçu des effets
          </h3>
          <div className={`p-6 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/20 border-2 ${
            frame?.effect_data?.border_color || rarityEffects[sampleCard.rarity] || 'border-slate-500/40'
          } ${effect?.effect_data?.glow_color ? 'shadow-lg' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="w-24 h-32 bg-secondary rounded-lg overflow-hidden">
                {sampleCard.image_url && (
                  <img src={sampleCard.image_url} alt={sampleCard.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <div className="font-bold text-lg">{sampleCard.name}</div>
                <div className="text-sm text-muted-foreground">{sampleCard.anime}</div>
                <div className="text-2xl font-display font-bold text-primary mt-2">PWR: {sampleCard.power}</div>
                {effect && (
                  <div className="text-xs text-purple-400 mt-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Effet: {effect.item_name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}