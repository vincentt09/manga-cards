import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Package, ShoppingBag, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Accueil" },
  { path: "/boosters", icon: Package, label: "Boosters" },
  { path: "/marketplace", icon: ShoppingBag, label: "Marché" },
  { path: "/profile", icon: User, label: "Profil" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all"
            >
              <motion.div
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  isActive ? "bg-primary/20 text-primary" : "text-muted-foreground"
                )}
                whileTap={{ scale: 0.9 }}
              >
                <item.icon className="w-5 h-5" />
              </motion.div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
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
