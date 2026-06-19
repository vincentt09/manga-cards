import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, Shield, Crown, Star, Search, Edit2, Save, 
  UserCheck, Mail, Calendar, TrendingUp, Coins, Gem, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ROLES = [
  { id: "user", label: "Utilisateur", icon: UserCheck, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { id: "vip", label: "VIP", icon: Star, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  { id: "moderator", label: "Modérateur", icon: Shield, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { id: "admin", label: "Admin", icon: Crown, color: "bg-red-500/10 text-red-400 border-red-500/20" },
];

function RoleBadge({ role }) {
  const roleConfig = ROLES.find(r => r.id === role) || ROLES[0];
  const Icon = roleConfig.icon;
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${roleConfig.color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="uppercase">{roleConfig.label}</span>
    </div>
  );
}

export default function UserManagement({ users, profiles, onUserUpdate }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId, selectedRole) => {
    try {
      await appClient.entities.User.update(userId, { role: selectedRole });
      toast({
        title: "✅ Rôle mis à jour",
        description: `Le rôle a été changé avec succès`,
      });
      onUserUpdate();
      setEditingUser(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de mettre à jour le rôle",
        variant: "destructive",
      });
    }
  };

  const getUserProfile = (userId) => profiles.find(p => p.created_by_id === userId);

  const openEditDialog = (user) => {
    setEditingUser(user.id);
    setNewRole(user.role);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par nom ou email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-11 bg-secondary/30 border-border h-11" 
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", ...ROLES.map(r => r.id)].map(roleId => (
            <Button
              key={roleId}
              variant={filterRole === roleId ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRole(roleId)}
              className={filterRole === roleId ? "bg-primary" : "border-border"}
            >
              {roleId === "all" ? "Tous" : ROLES.find(r => r.id === roleId)?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role.id).length;
          const Icon = role.icon;
          return (
            <div key={role.id} className={`rounded-2xl border p-4 ${role.color} bg-opacity-20`}>
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" />
                <span className="text-2xl font-bold">{count}</span>
              </div>
              <p className="text-xs font-semibold uppercase">{role.label}</p>
            </div>
          );
        })}
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map(user => {
          const profile = getUserProfile(user.id);
          const isEditing = editingUser === user.id;

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 border border-primary/20">
                    <span className="text-lg font-bold text-primary">{(user.full_name || "?")[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-base truncate">{user.full_name || "Utilisateur"}</h3>
                      {!isEditing && <RoleBadge role={user.role} />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {profile && (
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Coins className="w-3 h-3 text-yellow-400" />
                          <span className="font-semibold">{(profile.coins || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Gem className="w-3 h-3 text-cyan-400" />
                          <span className="font-semibold">{profile.gems || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <TrendingUp className="w-3 h-3 text-green-400" />
                          <span className="font-semibold">Niv. {Math.floor((profile.xp || 0) / 100) + 1}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3 h-3 text-purple-400" />
                          <span>{new Date(user.created_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(user)}
                    className="border-border hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit2 className="w-4 h-4 mr-1.5" />
                    Modifier rôle
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Sélectionnez un nouveau rôle pour cet utilisateur
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {users.find(u => u.id === editingUser)?.full_name?.[0] || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">
                      {users.find(u => u.id === editingUser)?.full_name || "Utilisateur"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rôle actuel: <span className="font-semibold capitalize">{users.find(u => u.id === editingUser)?.role}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(role => {
                  const Icon = role.icon;
                  const isSelected = newRole === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setNewRole(role.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-secondary/20 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Icon className={`w-6 h-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                          {role.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <p className="text-xs text-yellow-300">
                    La modification des rôles est immédiate et irréversible. Assurez-vous que c'est le bon rôle.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => handleRoleChange(editingUser, newRole)}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}