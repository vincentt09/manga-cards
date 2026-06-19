import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Coins, Gem, DollarSign, TrendingUp, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CARD_POOL } from "@/lib/gameData";

export default function LimitedListingsTab() {
  const [listingType, setListingType] = useState("custom_card");
  const [selectedAnime, setSelectedAnime] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const [priceType, setPriceType] = useState("coins");
  const [priceCoins, setPriceCoins] = useState("");
  const [priceGems, setPriceGems] = useState("");
  const [priceEur, setPriceEur] = useState("");
  const [quantity, setQuantity] = useState("");
  const [customName, setCustomName] = useState("");
  const [customRarity, setCustomRarity] = useState("normale");
  const [customPower, setCustomPower] = useState("");
  const [customAttack, setCustomAttack] = useState("");
  const [customDefense, setCustomDefense] = useState("");
  const [customSpeed, setCustomSpeed] = useState("");
  const [incomeCoins, setIncomeCoins] = useState("");
  const [incomeGems, setIncomeGems] = useState("");
  const [customImage, setCustomImage] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: listings = [] } = useQuery({
    queryKey: ["limitedListings"],
    queryFn: () => appClient.entities.LimitedCardListing.list("-created_date", 50),
  });

  const { data: imageOverrides = [] } = useQuery({
    queryKey: ["cardImageOverrides"],
    queryFn: () => appClient.entities.CardImageOverride.list(),
  });

  const createListingMutation = useMutation({
    mutationFn: async (data) => {
      const response = await appClient.functions.invoke('createLimitedListing', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["limitedListings"] });
      toast({ title: "✅ Vente créée !", description: "L'article est maintenant en vente limitée." });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  const cancelListingMutation = useMutation({
    mutationFn: async (listingId) => {
      await appClient.entities.LimitedCardListing.update(listingId, { status: 'cancelled' });
      queryClient.invalidateQueries({ queryKey: ["limitedListings"] });
      toast({ title: "✅ Vente annulée" });
    },
    onError: (error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setListingType("custom_card");
    setSelectedCard(null);
    setCustomName("");
    setCustomRarity("normale");
    setCustomPower("");
    setCustomAttack("");
    setCustomDefense("");
    setCustomSpeed("");
    setIncomeCoins("");
    setIncomeGems("");
    setCustomImage("");
    setPriceCoins("");
    setPriceGems("");
    setPriceEur("");
    setQuantity("");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await appClient.functions.invoke('uploadImage', { file: file });
      if (response.data && response.data.url) {
        setUploadedImage(response.data.url);
        setCustomImage(response.data.url);
        toast({ title: "✅ Image uploadée", description: "L'image est prête à être utilisée." });
      }
    } catch (error) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!quantity || parseInt(quantity) <= 0) {
      toast({ title: "❌ Quantité invalide", variant: "destructive" });
      return;
    }

    const card = listingType === 'existing_card' ? selectedCard : null;
    
    const listingData = {
      listing_type: listingType,
      card_id: card?.id || null,
      card_name: card?.name || customName,
      card_anime: card?.anime || 'Event',
      card_rarity: card?.rarity || customRarity,
      card_image_url: uploadedImage || customImage || card?.image_url || null,
      card_power: parseInt(customPower) || card?.basePower || 0,
      card_attack: parseInt(customAttack) || 0,
      card_defense: parseInt(customDefense) || 0,
      card_speed: parseInt(customSpeed) || 0,
      income_coins_per_30s: parseInt(incomeCoins) || 0,
      income_gems_per_hour: parseInt(incomeGems) || 0,
      price_type: priceType,
      price_coins: priceType === "coins" ? parseInt(priceCoins) || 0 : 0,
      price_gems: priceType === "gems" ? parseInt(priceGems) || 0 : 0,
      price_stripe_eur: priceType === "stripe" ? parseFloat(priceEur) || 0 : 0,
      quantity_total: parseInt(quantity),
    };

    createListingMutation.mutate(listingData);
  };

  const animes = ["", ...new Set(CARD_POOL.map(c => c.anime))];
  const filteredCards = CARD_POOL.filter(c => !selectedAnime || c.anime === selectedAnime);
  const getCardImage = (card) => {
    const override = imageOverrides.find(o => o.card_id === card.id);
    return override?.image_url || card.image_url;
  };

  const rarityColors = {
    normale: "bg-slate-500/20 text-slate-300",
    legendaire: "bg-yellow-500/20 text-yellow-300",
    secrète: "bg-rose-500/20 text-rose-300",
    manga_god: "bg-cyan-500/20 text-cyan-300",
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Créer une Vente Limitée
          </CardTitle>
          <CardDescription>Vends des cartes avec stats personnalisées et revenus passifs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setListingType("custom_card")} className={`p-3 rounded-lg border ${listingType === "custom_card" ? "border-primary bg-primary/10" : "border-border"}`}>
              <p className="font-semibold text-sm">Carte Personnalisée</p>
              <p className="text-[10px] text-muted-foreground">Stats custom</p>
            </button>
            <button onClick={() => setListingType("existing_card")} className={`p-3 rounded-lg border ${listingType === "existing_card" ? "border-primary bg-primary/10" : "border-border"}`}>
              <p className="font-semibold text-sm">Carte Existante</p>
              <p className="text-[10px] text-muted-foreground">Du pool</p>
            </button>
          </div>

          {listingType === 'existing_card' && (
            <>
              <Select value={selectedAnime} onValueChange={setSelectedAnime}>
                <SelectTrigger><SelectValue placeholder="Série" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Toutes</SelectItem>
                  {animes.filter(a => a).map(anime => <SelectItem key={anime} value={anime}>{anime}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-secondary/30 rounded-lg">
                {filteredCards.map(card => (
                  <button key={card.id} onClick={() => setSelectedCard(card)} className={`p-2 rounded border ${selectedCard?.id === card.id ? "border-primary bg-primary/10" : "border-border"}`}>
                    <img src={getCardImage(card)} className="w-full h-16 object-cover rounded mb-1" />
                    <p className="text-[9px] truncate">{card.name}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {listingType === 'custom_card' && (
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nom" value={customName} onChange={e => setCustomName(e.target.value)} className="col-span-2" />
              <Input type="number" placeholder="Power" value={customPower} onChange={e => setCustomPower(e.target.value)} />
              <Select value={customRarity} onValueChange={setCustomRarity}>
                <SelectTrigger><SelectValue placeholder="Rareté" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="legendaire">Légendaire</SelectItem>
                  <SelectItem value="secrète">Secrète</SelectItem>
                  <SelectItem value="manga_god">Manga God</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Attaque" value={customAttack} onChange={e => setCustomAttack(e.target.value)} />
              <Input type="number" placeholder="Défense" value={customDefense} onChange={e => setCustomDefense(e.target.value)} />
              <Input type="number" placeholder="Vitesse" value={customSpeed} onChange={e => setCustomSpeed(e.target.value)} />
              <div className="col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-all">
                      <Upload className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Uploader une image</span>
                      {isUploading && <span className="text-xs text-muted-foreground">Envoi...</span>}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                  </label>
                  {uploadedImage && (
                    <button onClick={() => { setUploadedImage(null); setCustomImage(""); }} className="px-3 py-2 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {uploadedImage && (
                  <div className="relative">
                    <img src={uploadedImage} alt="Aperçu" className="w-full h-32 object-cover rounded-lg border border-border" />
                    <div className="absolute top-2 right-2 bg-green-500/90 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                      <Package className="w-3 h-3" /> Uploadée
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">ou</span>
                  <Input placeholder="URL d'image" value={customImage} onChange={e => setCustomImage(e.target.value)} className="flex-1" disabled={!!uploadedImage} />
                </div>
              </div>
              <Input type="number" placeholder="Pièces/30s" value={incomeCoins} onChange={e => setIncomeCoins(e.target.value)} />
              <Input type="number" placeholder="Gemmes/h" value={incomeGems} onChange={e => setIncomeGems(e.target.value)} />
            </div>
          )}

          {/* Price */}
          <div className="flex gap-2">
            <Select value={priceType} onValueChange={setPriceType}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="coins"><Coins className="w-3 h-3 inline mr-1" />Pièces</SelectItem>
                <SelectItem value="gems"><Gem className="w-3 h-3 inline mr-1" />Gemmes</SelectItem>
                <SelectItem value="stripe"><DollarSign className="w-3 h-3 inline mr-1" />€</SelectItem>
              </SelectContent>
            </Select>
            {priceType === "coins" && <Input type="number" placeholder="1000" value={priceCoins} onChange={e => setPriceCoins(e.target.value)} />}
            {priceType === "gems" && <Input type="number" placeholder="50" value={priceGems} onChange={e => setPriceGems(e.target.value)} />}
            {priceType === "stripe" && <Input type="number" step="0.01" placeholder="9.99" value={priceEur} onChange={e => setPriceEur(e.target.value)} />}
          </div>

          <Input type="number" placeholder="Quantité" value={quantity} onChange={e => setQuantity(e.target.value)} />

          <Button onClick={handleSubmit} disabled={createListingMutation.isPending || !quantity} className="w-full">
            {createListingMutation.isPending ? "Création..." : "Créer la vente"}
          </Button>
        </CardContent>
      </Card>

      {/* Listings */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle>Ventes Actives</CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Aucune vente</p> : (
            <div className="space-y-2">
              {listings.map(listing => (
                <div key={listing.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {listing.card_image_url && <img src={listing.card_image_url} className="w-10 h-14 object-cover rounded" />}
                    <div>
                      <p className="font-semibold text-sm">{listing.card_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {listing.price_type === "coins" && <span className="text-yellow-400">{listing.price_coins} 🪙</span>}
                        {listing.price_type === "gems" && <span className="text-cyan-400">{listing.price_gems} 💎</span>}
                        {listing.price_type === "stripe" && <span className="text-green-400">{listing.price_stripe_eur}€</span>}
                        {" • "}{listing.quantity_remaining}/{listing.quantity_total} restants
                      </p>
                    </div>
                  </div>
                  {listing.status === "active" && <Button variant="ghost" size="sm" onClick={() => cancelListingMutation.mutate(listing.id)} className="text-red-400">Annuler</Button>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}