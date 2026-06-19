import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Package, ShoppingBag, Flame, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Collection" },
  { path: "/boosters", icon: Package, label: "Boosters" },
  { path: "/marketplace", icon: ShoppingBag, label: "Marché" },
  { path: "/fusion", icon: Flame, label: "Fusion" },
  { path: "/profile", icon: User, label: "Profil" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      aria-label="Navigation principale mobile"
      className="fixed bottom-0 left-0 right-0 z-[55] border-t border-white/10 bg-card/90 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:hidden"
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
                  "relative rounded-xl p-1.5 transition-colors",
                  isActive ? "bg-primary/20 text-primary" : "text-muted-foreground",
                )}
                whileTap={{ scale: 0.9 }}
              >
                <item.icon className="h-[19px] w-[19px]" />
                {isActive && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />}
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
