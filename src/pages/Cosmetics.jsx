import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Star, Shield, Crown, Coins, Gem, Check, Palette, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfilePreview from "@/components/profile/ProfilePreview";

const rarityColors = {
  common: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  rare: "bg-blue-500/20 text-blue-300 border-blue-400/60",
  epic: "bg-purple-500/20 text-purple-300 border-purple-400/70",
  legendary: "bg-yellow-500/20 text-yellow-300 border-yellow-400/80",
  exclusive: "bg-red-500/20 text-red-300 border-red-400/90",
};

const rarityIcons = {
  common: Star,
  rare: Star,
  epic: Sparkles,
  legendary: Crown,
  exclusive: Shield,
};

export default function CosmeticsShop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cosmetics = [] } = useQuery({
    queryKey: ["cosmetics"],
    queryFn: () => appClient.entities.CosmeticItem.list(),
  });

  const { data: userCosmetics = [] } = useQuery({
    queryKey: ["userCosmetics"],
    queryFn: async () => {
      const user = await appClient.auth.me();
      if (!user) return [];
      return appClient.entities.UserCosmetic.filter({ user_id: user.id });
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["playerProfile"],
    queryFn: async () => {
      const user = await appClient.auth.me();
      if (!user) return null;
      const profiles = await appClient.entities.PlayerProfile.filter({ user_id: user.id });
      return profiles[0] || null;
    },
  });

  const { data: cards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: () => appClient.entities.Card.list("-created_date", 50),
  });

  const purchaseMutation = useMutation({
    mutationFn: async (itemId) => {
      const response = await appClient.functions.invoke('purchaseCosmetic', { item_id: itemId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userCosmetics"] });
      queryClient.invalidateQueries({ queryKey: ["playerProfile"] });
      toast({ title: "✅ Achat réussi !", description: "L'item a été ajouté à ta collection." });
    },
    onError: (error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  const equipMutation = useMutation({
    mutationFn: async ({ itemId, itemType }) => {
      const response = await appClient.functions.invoke('equipCosmetic', { item_id: itemId, item_type: itemType });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userCosmetics"] });
      toast({ title: "✅ Équipé !", description: "L'item est maintenant actif." });
    },
    onError: (error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  const filteredCosmetics = cosmetics.filter(c => c.type === "banner" && c.is_active);
  const ownedItemIds = userCosmetics.map(uc => uc.item_id);
  const equippedItemId = userCosmetics.find(uc => uc.is_equipped)?.item_id;

  const handlePurchase = (item) => {
    if (ownedItemIds.includes(item.item_id)) {
      equipMutation.mutate({ itemId: item.item_id, itemType: item.type });
    } else {
      purchaseMutation.mutate(item.item_id);
    }
  };

  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne de gauche - Boutique et Collection */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Boutique de Cosmétiques
            </CardTitle>
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1 text-yellow-400">
                <Coins className="w-4 h-4" /> {profile?.coins?.toLocaleString() || 0}
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Gem className="w-4 h-4" /> {profile?.gems?.toLocaleString() || 0}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Bannières de Profil</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredCosmetics.map(item => {
                  const isOwned = ownedItemIds.includes(item.item_id);
                  const isEquipped = equippedItemId === item.item_id;
                  const RarityIcon = rarityIcons[item.rarity] || Star;
                  const canAfford = (item.price_gems && profile?.gems >= item.price_gems) || 
                                   (item.price_coins && profile?.coins >= item.price_coins) || 
                                   (item.price_gems === 0 && item.price_coins === 0);

                  return (
                    <Card key={item.item_id} className={`relative overflow-hidden ${isEquipped ? 'border-green-500/50' : 'border-border'}`}>
                      <div className={`absolute top-2 right-2 z-10 ${rarityColors[item.rarity]} px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1`}>
                        <RarityIcon className="w-3 h-3" />
                        {item.rarity}
                      </div>
                      
                      <div className="aspect-square bg-secondary/50 flex items-center justify-center p-4">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <div className={`w-full h-full rounded bg-gradient-to-r ${item.effect_data?.animation || 'from-slate-700 to-slate-900'}`} />
                        )}
                      </div>

                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                        
                        {isOwned ? (
                          isEquipped ? (
                            <Button disabled className="w-full text-xs bg-green-500/20 text-green-300">
                              <Check className="w-3 h-3 mr-1" /> Équipé
                            </Button>
                          ) : (
                            <Button onClick={() => equipMutation.mutate({ itemId: item.item_id, itemType: item.type })} className="w-full text-xs">
                              Équiper
                            </Button>
                          )
                        ) : (
                          <Button 
                            onClick={() => handlePurchase(item)} 
                            disabled={!canAfford}
                            className="w-full text-xs"
                          >
                            {item.price_gems > 0 ? (
                              <span className="flex items-center gap-1"><Gem className="w-3 h-3" /> {item.price_gems}</span>
                            ) : item.price_coins > 0 ? (
                              <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> {item.price_coins}</span>
                            ) : (
                              "Gratuit"
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredCosmetics.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Aucune bannière disponible</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Collection */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Ma Collection ({userCosmetics.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {userCosmetics.map(uc => (
                <div key={uc.id} className={`relative p-2 rounded-lg border ${uc.is_equipped ? 'border-green-500/50 bg-green-500/10' : 'border-border'}`}>
                  {uc.item_image_url && (
                    <img src={uc.item_image_url} alt={uc.item_name} className="w-full h-16 object-cover rounded" />
                  )}
                  <p className="text-[9px] text-center mt-1 truncate">{uc.item_name}</p>
                  {uc.is_equipped && <Check className="w-3 h-3 text-green-400 absolute top-1 right-1" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colonne de droite - Aperçu du profil */}
      {showPreview && (
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Ton Profil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfilePreview profile={profile} userCosmetics={userCosmetics} cards={cards} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}