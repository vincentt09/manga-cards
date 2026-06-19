import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const EVENT_TYPES = [
  { value: "legendary_boost", label: "Boost Légendaire", icon: Sparkles, multiplier: 5 },
  { value: "secret_boost", label: "Boost Secrète", icon: Sparkles, multiplier: 3 },
  { value: "god_boost", label: "Boost Manga God", icon: Sparkles, multiplier: 10 },
];

export default function DropEventsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ["drop_events"],
    queryFn: () => appClient.entities.DropEvent.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await appClient.entities.DropEvent.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drop_events"] });
      setShowForm(false);
      toast({ title: "✅ Événement activé", description: "Les taux de drop sont boostés !" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await appClient.entities.DropEvent.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drop_events"] });
      toast({ title: "🗑️ Événement supprimé" });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const durationMinutes = Number(formData.get("duration"));
    const now = new Date();
    const endDate = new Date(now.getTime() + durationMinutes * 60000);

    createMutation.mutate({
      event_type: formData.get("event_type"),
      name: formData.get("name"),
      multiplier: Number(formData.get("multiplier")),
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      is_active: true,
    });
  };

  const activeEvent = events.find(e => e.is_active && new Date(e.end_date) > new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider">Événements Drop</h3>
          <p className="text-xs text-muted-foreground">Modifie réellement les tirages serveur · maximum ×20</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          {showForm ? "Annuler" : "Nouvel Événement"}
        </Button>
      </div>

      {activeEvent && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/30 bg-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-primary">{activeEvent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      x{activeEvent.multiplier} • Se termine dans {Math.round((new Date(activeEvent.end_date) - new Date()) / 60000)} min
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(activeEvent.id)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block">Nom de l'événement</label>
                  <Input name="name" placeholder="ex: Week-end Légendaire" required className="bg-secondary/30" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Type de boost</label>
                    <select name="event_type" className="w-full h-10 rounded-md border border-input bg-secondary/30 px-3 text-sm">
                      {EVENT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Multiplicateur</label>
                    <Input type="number" name="multiplier" defaultValue="5" min="2" max="20" required className="bg-secondary/30" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block">Durée (minutes)</label>
                  <Input type="number" name="duration" defaultValue="30" min="5" max="1440" required className="bg-secondary/30" />
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Button type="submit" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Activer l'événement
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Past events */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Historique</h4>
        {events.filter(e => !e.is_active || new Date(e.end_date) < new Date()).slice(0, 5).map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        x{event.multiplier} • {new Date(event.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(event.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
