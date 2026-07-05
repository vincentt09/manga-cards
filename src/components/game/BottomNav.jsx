import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Package, ShoppingBag, Swords, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Collection" },
  { path: "/boosters", icon: Package, label: "Boosters" },
  { path: "/marketplace", icon: ShoppingBag, label: "Marché" },
  { path: "/pve", icon: Swords, label: "PvE" },
  { path: "/profile", icon: User, label: "Profil" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      aria-label="Navigation principale mobile"
      className="game-nav-glass fixed bottom-0 left-0 right-0 z-[55] border-t border-primary/20 backdrop-blur-2xl md:hidden"
      style={{ paddingBottom: "max(0.45rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 pt-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1 transition-all"
            >
              <motion.div
                className={cn(
                  "relative rounded-xl border p-1.5 transition-all",
                  isActive ? "-translate-y-1 border-primary/35 bg-gradient-to-br from-primary/25 to-accent/10 text-primary shadow-[0_8px_20px_hsl(var(--primary)/.24)]" : "border-transparent text-muted-foreground",
                )}
                whileTap={{ scale: 0.9 }}
              >
                <item.icon className="h-[19px] w-[19px]" />
                {isActive && <span className="absolute -bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent shadow-[0_0_8px_hsl(var(--primary))]" />}
              </motion.div>
              <span className={cn(
                "max-w-full truncate text-[9px] font-semibold",
                isActive ? "text-primary" : "text-muted-foreground",
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
