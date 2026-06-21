import React from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default class AppErrorBoundary extends React.Component {
  state = { hasError: false, errorMessage: "" };
  static getDerivedStateFromError(error) { return { hasError: true, errorMessage: error?.message || "Erreur inconnue" }; }
  componentDidCatch(error, info) { console.error("Erreur d’affichage Manga Cards", error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="min-h-[100dvh] grid place-items-center px-5 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_45%)]"><section className="w-full max-w-md rounded-3xl border border-destructive/25 bg-card/90 p-7 text-center shadow-2xl backdrop-blur-xl"><div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-destructive/25 bg-destructive/10"><AlertTriangle className="h-7 w-7 text-destructive" /></div><h1 className="font-display text-xl font-bold">La page a rencontré un problème</h1><p className="mt-2 text-sm text-muted-foreground">Tes données sont conservées. Recharge simplement l’interface pour reprendre.</p>{import.meta.env.DEV && <p className="mt-3 break-words rounded-lg bg-destructive/10 p-2 text-left text-xs text-destructive">{this.state.errorMessage}</p>}<div className="mt-6 flex justify-center gap-2"><Button variant="outline" onClick={() => { window.location.href = "/"; }}><Home className="mr-2 h-4 w-4" />Accueil</Button><Button onClick={() => window.location.reload()}><RefreshCw className="mr-2 h-4 w-4" />Recharger</Button></div></section></main>;
  }
}
