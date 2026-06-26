import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

const googleErrorMessage = (error) => {
  if (error === "google_not_configured") return "La connexion Google doit etre configuree avec les cles OAuth du projet.";
  if (error === "account_suspended") return "Ce compte est actuellement suspendu. Contacte l'administration.";
  if (error === "google_invalid_state") return "Session Google expiree. Recommence la connexion.";
  if (error === "google_profile_failed") return "Google n'a pas renvoye le profil du compte.";
  if (error === "google_email_missing") return "Google n'a pas renvoye d'e-mail pour ce compte.";
  if (error === "google_failed") return "La connexion Google a echoue. Verifie l'URL de redirection OAuth.";
  return error ? "La connexion a echoue. Recommence ou utilise l'e-mail." : "";
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(googleErrorMessage(searchParams.get("error")));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await appClient.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "E-mail ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    appClient.auth.loginWithProvider("google", "/");
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Bon retour !"
      subtitle="Connecte-toi a ton compte"
      footer={(
        <>
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Creer un compte
          </Link>
        </>
      )}
    >
      <Button variant="outline" className="mb-6 h-12 w-full text-sm font-medium" onClick={handleGoogle}>
        <GoogleIcon className="mr-2 h-5 w-5" />
        Continuer avec Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">ou</span>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Mot de passe oublie ?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion...
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
