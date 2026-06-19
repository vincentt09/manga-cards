import React from "react";
import { appClient } from "@/api/appClient";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResetAllCardsButton({ onComplete }) {
  const { toast } = useToast();

  const handleResetAllCards = async () => {
    try {
      const response = await appClient.functions.invoke('resetAllCards', {});
      toast({ title: "✅ Réinitialisation terminée", description: response.data.message });
      onComplete?.();
    } catch (error) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h3 className="font-heading font-bold text-sm text-destructive">Réinitialisation complète</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Supprime toutes les cartes de tous les joueurs et réinitialise les profils (pièces, gemmes, XP, boosters).
      </p>
      <Button
        variant="destructive"
        onClick={handleResetAllCards}
        className="w-full sm:w-auto"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Tout supprimer et réinitialiser
      </Button>
    </div>
  );
}