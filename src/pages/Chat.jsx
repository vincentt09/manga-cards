import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, Shield, Trash2, Users, X, Sparkles, Flag } from "lucide-react";
import { appClient } from "@/api/appClient";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const formatMessageTime = (value) => new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

export default function GeneralChatPanel({ onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const messagesRef = useRef(null);

  const { data: newestMessages = [], isLoading } = useQuery({
    queryKey: ["general_chat"],
    queryFn: () => appClient.entities.ChatMessage.list("-created_date", 100),
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  });

  const messages = useMemo(() => [...newestMessages].reverse(), [newestMessages]);
  const activePlayers = useMemo(() => new Set(newestMessages
    .filter(item => Date.now() - new Date(item.created_date).getTime() < 10 * 60 * 1000)
    .map(item => item.created_by_id)).size, [newestMessages]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: messages.length > 1 ? "smooth" : "auto" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (content) => appClient.entities.ChatMessage.create({ message: content }),
    onSuccess: (created) => {
      queryClient.setQueryData(["general_chat"], (current = []) => [created, ...current.filter(item => item.id !== created.id)].slice(0, 100));
      setMessage("");
    },
    onError: (error) => toast({ title: "Message non envoyé", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId) => appClient.entities.ChatMessage.delete(messageId),
    onSuccess: (_, messageId) => queryClient.setQueryData(["general_chat"], (current = []) => current.filter(item => item.id !== messageId)),
    onError: (error) => toast({ title: "Suppression impossible", description: error.message, variant: "destructive" }),
  });

  const reportMutation = useMutation({
    mutationFn: (messageId) => appClient.functions.invoke("reportChatMessage", { message_id: messageId, reason: "contenu_inapproprie" }),
    onSuccess: () => toast({ title: "Message signalé", description: "L’équipe de modération va l’examiner." }),
    onError: (error) => toast({ title: "Signalement impossible", description: error.message, variant: "destructive" }),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const content = message.replace(/\s+/g, " ").trim();
    if (!content || sendMutation.isPending) return;
    sendMutation.mutate(content);
  };

  return (
        <section className="relative h-full min-h-0 rounded-[22px] sm:rounded-[28px] border border-primary/25 bg-card/95 backdrop-blur-2xl overflow-hidden flex flex-col shadow-[0_24px_80px_-20px_hsl(var(--primary)/0.55)]">
          <div className="pointer-events-none absolute -top-24 -left-16 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
          <header className="relative z-10 px-3 py-2.5 sm:px-4 sm:py-3.5 border-b border-white/10 bg-gradient-to-r from-primary/15 via-secondary/30 to-accent/10 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 ring-1 ring-white/20">
                <MessageCircle className="w-5 h-5 text-white" />
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300" />
              </div>
              <div>
                <h1 className="font-display text-base sm:text-lg font-bold leading-tight truncate">Chat général</h1>
                <p className="text-[10px] uppercase tracking-[0.18em] text-primary/80 font-bold">Salon public</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                <Users className="w-3 h-3" /> {activePlayers}
              </div>
              {onClose && (
                <button type="button" onClick={onClose} aria-label="Fermer le chat" className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-background/40 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </header>

          <div ref={messagesRef} className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 sm:py-5 space-y-3 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_45%)]">
            {isLoading && <p className="text-sm text-muted-foreground text-center py-10">Chargement des messages...</p>}
            {!isLoading && messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-semibold">Le chat est encore silencieux</p>
                <p className="text-xs mt-1">Envoie le premier message à la communauté.</p>
              </div>
            )}

            {messages.map((item) => {
              const isMine = item.created_by_id === user?.id;
              const canDelete = isMine || user?.role === "admin";
              return (
                <article key={item.id} className={`group flex gap-2 sm:gap-3 ${isMine ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center shrink-0 text-xs font-bold text-white ring-2 ring-background shadow-md">
                    {item.avatar_url ? <img src={item.avatar_url} alt="" className="w-full h-full object-cover" /> : (item.display_name?.[0]?.toUpperCase() || "?")}
                  </div>
                  <div className={`min-w-0 max-w-[84%] sm:max-w-[78%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                    <div className="flex items-center gap-2 px-1 mb-1">
                      <span className="text-[11px] font-semibold">{item.display_name || "Joueur"}</span>
                      {item.created_by_id === user?.id && user?.role === "admin" && <Shield className="w-3 h-3 text-primary" />}
                      <time className="text-[9px] text-muted-foreground">{formatMessageTime(item.created_date)}</time>
                    </div>
                    <div className={`relative rounded-2xl px-3.5 py-2.5 pr-9 text-sm leading-relaxed break-words whitespace-pre-wrap shadow-md ${isMine ? "bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-tr-sm shadow-primary/15" : "bg-background/80 border border-white/10 rounded-tl-sm backdrop-blur-sm"}`}>
                      {item.message}
                      {canDelete && (
                        <button type="button" aria-label="Supprimer le message" onClick={() => deleteMutation.mutate(item.id)} className="absolute right-1.5 top-1.5 opacity-60 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-full bg-black/20 hover:bg-destructive text-white">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      {!isMine && user?.role !== "admin" && (
                        <button type="button" aria-label="Signaler le message" disabled={reportMutation.isPending} onClick={() => reportMutation.mutate(item.id)} className="absolute right-1.5 top-1.5 opacity-60 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-full bg-black/20 hover:bg-orange-500 text-white">
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 border-t border-white/10 bg-background/65 backdrop-blur-xl p-2.5 sm:p-3.5">
            <div className="flex items-end gap-2">
              <div className="flex-1 rounded-2xl border border-white/10 bg-secondary/35 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10 transition-all px-4 py-2">
                <textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 300))} onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); handleSubmit(event); }
                }} rows={1} maxLength={300} aria-label="Écrire un message" placeholder="Écris un message..." className="w-full max-h-24 resize-none bg-transparent text-sm outline-none" />
                <p className="text-[9px] text-muted-foreground text-right">{message.length}/300</p>
              </div>
              <Button type="submit" size="icon" aria-label="Envoyer le message" disabled={!message.trim() || sendMutation.isPending} className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="hidden sm:block text-[10px] text-muted-foreground mt-2 px-1">Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne</p>
          </form>
        </section>
  );
}
