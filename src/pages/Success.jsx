import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/game/Navbar";

export default function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen pb-20 md:pb-4 md:pt-14">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>

          <h1 className="font-display text-3xl font-bold mb-2">
            Achat Réussi ! 🎉
          </h1>
          <p className="text-muted-foreground mb-8">
            Ta carte a été ajoutée à ta collection.
          </p>

          <div className="p-6 bg-card rounded-2xl border border-border mb-8">
            <div className="flex items-center justify-center gap-3">
              <Package className="w-5 h-5 text-primary" />
              <span className="font-semibold">Carte reçue dans ton inventaire</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-primary to-accent"
            >
              Voir ma collection
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/boosters")}
            >
              Ouvrir des boosters
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Redirection automatique dans 5 secondes...
          </p>
        </motion.div>
      </div>
    </div>
  );
}