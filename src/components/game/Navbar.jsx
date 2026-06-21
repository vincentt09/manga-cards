import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Swords, Home, Package, ShoppingBag, BookOpen, History, User, Flame, Frame, Sparkles, Gavel, Shield, LogOut, Trophy, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import GeneralChatPanel from "@/pages/Chat";

const TOP_NAV_ITEMS = [
  { path: "/", icon: Home, label: "Collection" },
  { path: "/boosters", icon: Package, label: "Boosters" },
  { path: "/pve", icon: Swords, label: "PvE" },
  { path: "/marketplace", icon: ShoppingBag, label: "Marché" },
];

const MENU_ITEMS = [
  { path: "/pve", icon: Swords, label: "Arène PvE" },
  { path: "/fusion", icon: Flame, label: "Fusion" },
  { path: "/frames", icon: Frame, label: "Cadres" },
  { path: "/talents", icon: Sparkles, label: "Talents" },
  { path: "/auctions", icon: Gavel, label: "Enchères" },
  { path: "/encyclopedia", icon: BookOpen, label: "Encyclopédie" },
  { path: "/history", icon: History, label: "Historique" },
  { path: "/profile", icon: User, label: "Profil" },
  { path: "/leaderboard", icon: Trophy, label: "Classement" },
];

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  const allNavItems = [...MENU_ITEMS, ...(isAdmin ? [{ path: "/admin", icon: Shield, label: "Admin" }] : [])];

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Top Bar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border shadow-lg"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-primary" />
              <span className="font-display text-base font-bold tracking-wider bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                MANGA TCG
              </span>
            </Link>
            
            {/* Top Navigation - Desktop */}
            <div className="hidden md:flex items-center gap-1 mr-4">
              {TOP_NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </nav>
      <div className="h-[calc(3.5rem+env(safe-area-inset-top))] md:hidden" aria-hidden="true" />

      {/* Slide-over Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[min(20rem,100vw)] bg-card border-l border-border z-[70] shadow-2xl overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-display text-lg font-bold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="mb-6 p-4 bg-secondary/30 rounded-xl border border-border">
                  <p className="text-sm font-medium text-foreground">{user?.full_name || "Joueur"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-primary mt-1 font-semibold capitalize">{user?.role}</p>
                </div>

                {/* Navigation */}
                <div className="space-y-1">
                  {allNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                            : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Logout */}
                <div className="mt-8 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-400 border-red-500/20 hover:bg-red-500/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed left-2 top-[calc(4.25rem+env(safe-area-inset-top))] bottom-[calc(9.25rem+env(safe-area-inset-bottom))] z-[65] w-[calc(100vw-1rem)] min-h-0 origin-bottom-left sm:left-4 sm:top-auto sm:bottom-20 sm:h-[min(68vh,620px)] sm:w-[420px]"
          >
            <GeneralChatPanel onClose={() => setIsChatOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.96 }}
        className="fixed left-3 bottom-[calc(5.4rem+env(safe-area-inset-bottom))] z-[60] md:left-4 md:bottom-5"
      >
        <button
          type="button"
          onClick={() => { setIsChatOpen(value => !value); setIsOpen(false); }}
          aria-label={isChatOpen ? "Fermer le chat général" : "Ouvrir le chat général"}
          aria-expanded={isChatOpen}
          className={`relative flex items-center gap-2.5 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-colors ${
            isChatOpen
              ? "border-primary bg-primary text-primary-foreground"
              : "border-primary/30 bg-card/95 text-foreground hover:border-primary/60 hover:bg-secondary"
          }`}
        >
          <span className="relative">
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-card" />
          </span>
          <span className="hidden text-sm font-bold min-[480px]:inline">Chat général</span>
        </button>
      </motion.div>
    </>
  );
}
