import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function DuplicateCleanup({ onComplete }) {
  const { toast } = useToast();
  const [isCleaning, setIsCleaning] = useState(false);

  const handleCleanup = async () => {
    if (!window.confirm("⚠️ Attention: Cette action va supprimer les doublons de cartes.\n\nSeule la carte avec le niveau/duplication le plus élevé sera conservée.\n\nContinuer ?")) return;
    
    setIsCleaning(true);
    try {
      const response = await appClient.functions.invoke('cleanupDuplicateCards', {});
      const result = response.data;
      
      toast({
        title: "✅ Nettoyage terminé",
        description: `${result.details.duplicatesRemoved} doublons supprimés`,
      });
      onComplete();
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
          <RefreshCw className={`w-5 h-5 text-rose-400 ${isCleaning ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-sm mb-1">Nettoyer les doublons de cartes</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Supprime les cartes en double en conservant uniquement celle avec le niveau ou nombre de duplications le plus élevé.
            Utile pour avoir un seul personnage avec 4 versions (Normale, Légendaire, Secrète, Manga God).
          </p>
          <Button
            onClick={handleCleanup}
            disabled={isCleaning}
            className="h-10 px-6 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isCleaning ? 'animate-spin' : ''}`} />
            {isCleaning ? "Nettoyage en cours..." : "Nettoyer les doublons"}
          </Button>
        </div>
      </div>
    </div>
  );
}