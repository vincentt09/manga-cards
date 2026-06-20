import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function NetworkStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (online) return null;
  return <div role="status" className="fixed inset-x-3 top-[calc(.75rem+env(safe-area-inset-top))] z-[100] mx-auto flex max-w-md items-center justify-center gap-2 rounded-full border border-orange-400/30 bg-orange-950/95 px-4 py-2 text-xs font-semibold text-orange-100 shadow-2xl backdrop-blur-xl"><WifiOff className="h-4 w-4" />Mode hors-ligne — reconnexion automatique</div>;
}
