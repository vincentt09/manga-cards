import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Gem, DollarSign, Package, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ListingForm({
  listingType, setListingType,
  priceType, setPriceType,
  priceCoins, setPriceCoins,
  priceGems, setPriceGems,
  priceEur, setPriceEur,
  quantity, setQuantity,
  customName, setCustomName,
  customRarity, setCustomRarity,
  customPower, setCustomPower,
  customAttack, setCustomAttack,
  customDefense, setCustomDefense,
  customSpeed, setCustomSpeed,
  incomeCoins, setIncomeCoins,
  incomeGems, setIncomeGems,
  customImage, setCustomImage,
  selectedAnime, setSelectedAnime,
  filteredCards, selectedCard, setSelectedCard,
  getCardImage, rarityColors,
  animes
}) {
  return (
    <div className="space-y-4">
      {/* Listing Type */}
      <div className="grid gap-2">
        <Label>Type d'article</Label>
        <Select value={listingType} onValueChange={setListingType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom_card">Carte Personnalisée</SelectItem>
            <SelectItem value="existing_card">Carte Existante</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {listingType === 'existing_card' && (
        <>
          <div className="grid gap-2">
            <Label>Série</Label>
            <Select value={selectedAnime} onValueChange={setSelectedAnime}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les séries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Toutes les séries</SelectItem>
                {animes.filter(a => a).map(anime => (
                  <SelectItem key={anime} value={anime}>{anime}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Carte à vendre</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-2 bg-secondary/30 rounded-lg">
              {filteredCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className={`relative p-2 rounded-lg border transition-all ${
                    selectedCard?.id === card.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={getCardImage(card)} alt={card.name} className="w-full h-20 object-cover rounded mb-1" />
                  <p className="text-[10px] font-medium truncate">{card.name}</p>
                  <Badge className={`text-[9px] mt-1 ${rarityColors[card.rarity]}`}>
                    {card.rarity}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {listingType === 'custom_card' && (
        <div className="space-y-3 p-4 bg-secondary/30 rounded-lg">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Détails de la carte
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nom de la carte</Label>
              <Input
                placeholder="Nom du personnage"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-background"
              />
            </div>

            <div>
              <Label>Rareté</Label>
              <Select value={customRarity} onValueChange={setCustomRarity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="legendaire">Légendaire</SelectItem>
                  <SelectItem value="secrète">Secrète</SelectItem>
                  <SelectItem value="manga_god">Manga God</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>URL Image</Label>
              <Input
                placeholder="https://..."
                value={customImage}
                onChange={(e) => setCustomImage(e.target.value)}
                className="bg-background"
              />
            </div>

            <div>
              <Label>Power</Label>
              <Input
                type="number"
                placeholder="100"
                value={customPower}
                onChange={(e) => setCustomPower(e.target.value)}
                className="bg-background"
              />
            </div>

            <div>
              <Label>Attaque</Label>
              <Input
                type="number"
                placeholder="90"
                value={customAttack}
                onChange={(e) => setCustomAttack(e.target.value)}
                className="bg-background"
              />
            </div>

            <div>
              <Label>Défense</Label>
              <Input
                type="number"
                placeholder="80"
                value={customDefense}
                onChange={(e) => setCustomDefense(e.target.value)}
                className="bg-background"
              />
            </div>

            <div>
              <Label>Vitesse</Label>
              <Input
                type="number"
                placeholder="85"
                value={customSpeed}
                onChange={(e) => setCustomSpeed(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <h5 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Revenu passif (optionnel)
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                <Input
                  type="number"
                  placeholder="Pièces/30s"
                  value={incomeCoins}
                  onChange={(e) => setIncomeCoins(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 text-cyan-400" />
                <Input
                  type="number"
                  placeholder="Gemmes/heure"
                  value={incomeGems}
                  onChange={(e) => setIncomeGems(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Type */}
      <div className="grid gap-2">
        <Label>Type de paiement</Label>
        <Select value={priceType} onValueChange={setPriceType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="coins">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                Pièces
              </div>
            </SelectItem>
            <SelectItem value="gems">
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 text-cyan-400" />
                Gemmes
              </div>
            </SelectItem>
            <SelectItem value="stripe">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                Argent réel (Stripe)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Input */}
      <div className="grid gap-2">
        <Label>Prix</Label>
        {priceType === "coins" && (
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <Input
              type="number"
              placeholder="1000"
              value={priceCoins}
              onChange={(e) => setPriceCoins(e.target.value)}
            />
          </div>
        )}
        {priceType === "gems" && (
          <div className="flex items-center gap-2">
            <Gem className="w-4 h-4 text-cyan-400" />
            <Input
              type="number"
              placeholder="50"
              value={priceGems}
              onChange={(e) => setPriceGems(e.target.value)}
            />
          </div>
        )}
        {priceType === "stripe" && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <Input
              type="number"
              step="0.01"
              placeholder="9.99"
              value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
            />
            <span className="text-sm text-muted-foreground">€</span>
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="grid gap-2">
        <Label>Quantité limitée</Label>
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <Input
            type="number"
            placeholder="10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}