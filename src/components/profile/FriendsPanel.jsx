import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, MessageCircle, Search, Send, Trash2, UserMinus, UserPlus, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";

const presence = { online: "bg-emerald-400", idle: "bg-yellow-400", dnd: "bg-red-500", invisible: "bg-slate-500" };
const messageTime = value => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

function Avatar({ player, size = "h-11 w-11" }) {
  return <div className={`relative shrink-0 overflow-hidden rounded-full bg-secondary ${size}`}>
    {player.avatar_url ? <img src={player.avatar_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center font-bold">{player.display_name?.[0]?.toUpperCase()}</div>}
    <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card ${presence[player.presence_style] || "bg-slate-500"}`} />
  </div>;
}

function FriendChatDialog({ friend, onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const messagesRef = useRef(null);
  const { data: response, isLoading } = useQuery({
    queryKey: ["friend_conversation", friend?.user_id],
    queryFn: () => appClient.functions.invoke("getFriendConversation", { user_id: friend.user_id }),
    enabled: Boolean(friend?.user_id),
    refetchInterval: 4000,
  });
  const messages = response?.data?.messages || [];
  useEffect(() => {
    const container = messagesRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    if (friend?.user_id) queryClient.invalidateQueries({ queryKey: ["friends_state"] });
  }, [messages.length, friend?.user_id, queryClient]);
  const send = useMutation({
    mutationFn: text => appClient.functions.invoke("sendFriendMessage", { user_id: friend.user_id, message: text }),
    onSuccess: responseValue => {
      const created = responseValue.data;
      queryClient.setQueryData(["friend_conversation", friend.user_id], current => ({ data: { ...(current?.data || {}), messages: [...(current?.data?.messages || []), created] } }));
      queryClient.invalidateQueries({ queryKey: ["friends_state"] });
      setMessage("");
    },
    onError: error => toast({ title: "Message non envoyé", description: error.message, variant: "destructive" }),
  });
  const removeMessage = useMutation({
    mutationFn: messageId => appClient.functions.invoke("deleteFriendMessage", { message_id: messageId }),
    onSuccess: (_, messageId) => queryClient.setQueryData(["friend_conversation", friend.user_id], current => ({ data: { ...(current?.data || {}), messages: (current?.data?.messages || []).filter(item => item.id !== messageId) } })),
  });
  const submit = event => {
    event.preventDefault();
    const clean = message.replace(/\s+/g, " ").trim();
    if (clean && !send.isPending) send.mutate(clean);
  };
  return <Dialog open={Boolean(friend)} onOpenChange={open => !open && onClose()}>
    <DialogContent className="flex h-[min(720px,calc(100dvh-1rem))] max-w-2xl flex-col gap-0 overflow-hidden p-0">
      <DialogHeader className="border-b border-border/70 bg-gradient-to-r from-primary/15 to-accent/10 p-4 pr-12 text-left">
        <DialogTitle className="flex items-center gap-3"><Avatar player={friend} /><span><span className="block">{friend.display_name}</span><span className="block text-[10px] font-normal text-muted-foreground">Conversation privée · ami depuis {new Date(friend.since).toLocaleDateString("fr-FR")}</span></span></DialogTitle>
        <DialogDescription className="sr-only">Messages privés avec {friend.display_name}</DialogDescription>
      </DialogHeader>
      <div ref={messagesRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_45%)] p-4">
        {isLoading && <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>}
        {!isLoading && !messages.length && <div className="grid h-full place-items-center text-center text-sm text-muted-foreground"><div><MessageCircle className="mx-auto mb-3 h-10 w-10 opacity-30" /><p>Commence la conversation avec {friend.display_name}.</p></div></div>}
        {messages.map(item => {
          const mine = item.sender_id === user?.id;
          return <article key={item.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`relative max-w-[86%] rounded-2xl px-3.5 py-2.5 shadow-sm ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-border bg-card"}`}>
              <p className="break-words whitespace-pre-wrap text-sm">{item.message}</p>
              <div className={`mt-1 flex items-center gap-1.5 text-[9px] ${mine ? "text-primary-foreground/65" : "text-muted-foreground"}`}><time>{messageTime(item.created_date)}</time>{mine && <span>{item.read_at ? "Lu" : "Envoyé"}</span>}</div>
              {mine && <button type="button" aria-label="Supprimer le message" onClick={() => removeMessage.mutate(item.id)} className="absolute -left-8 top-1/2 block -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:hidden sm:group-hover:block"><Trash2 className="h-3.5 w-3.5" /></button>}
            </div>
          </article>;
        })}
      </div>
      <form onSubmit={submit} className="flex items-end gap-2 border-t border-border/70 bg-background/90 p-3">
        <textarea aria-label="Message privé" value={message} onChange={event => setMessage(event.target.value.slice(0, 500))} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(event); } }} rows={1} placeholder={`Écrire à ${friend.display_name}…`} className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-input bg-secondary/30 px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <Button type="submit" size="icon" disabled={!message.trim() || send.isPending} className="h-11 w-11 rounded-xl"><Send className="h-4 w-4" /></Button>
      </form>
    </DialogContent>
  </Dialog>;
}

export default function FriendsPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState("friends");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const { data: stateResponse, isLoading } = useQuery({ queryKey: ["friends_state"], queryFn: () => appClient.functions.invoke("getFriendsState"), refetchInterval: 20_000 });
  const state = stateResponse?.data || { friends: [], incoming: [], outgoing: [] };
  const unreadTotal = state.friends.reduce((sum, friend) => sum + Number(friend.unread_count || 0), 0);
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: ["friends_state"] }), queryClient.invalidateQueries({ queryKey: ["public_profile"] })]);
  const searchMutation = useMutation({ mutationFn: query => appClient.functions.invoke("searchFriendPlayers", { query }), onSuccess: response => setResults(response.data), onError: error => toast({ title: "Recherche impossible", description: error.message, variant: "destructive" }) });
  const send = useMutation({ mutationFn: userId => appClient.functions.invoke("sendFriendRequest", { user_id: userId }), onSuccess: () => { refresh(); setResults([]); toast({ title: "Demande envoyée" }); }, onError: error => toast({ title: "Demande impossible", description: error.message, variant: "destructive" }) });
  const manage = useMutation({ mutationFn: payload => appClient.functions.invoke("manageFriendship", payload), onSuccess: (_, payload) => { refresh(); toast({ title: payload.action === "accept" ? "Nouvel ami ajouté" : "Liste d’amis mise à jour" }); }, onError: error => toast({ title: "Action impossible", description: error.message, variant: "destructive" }) });
  const doSearch = event => { event.preventDefault(); if (search.trim().length >= 2) searchMutation.mutate(search.trim()); };
  const PlayerRow = ({ player, actions }) => <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/20 p-3"><Avatar player={player} /><div className="min-w-0 flex-1"><Link to={`/profile/${player.user_id}`} className="block truncate text-sm font-bold hover:text-primary hover:underline">{player.display_name}</Link><p className="truncate text-[10px] text-muted-foreground">Niveau {player.player_level || 1}{player.status_text ? ` · ${player.status_emoji || ""} ${player.status_text}` : ""}</p></div><div className="flex shrink-0 items-center gap-1">{actions}</div></div>;
  return <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-display text-lg font-bold"><Users className="h-5 w-5 text-primary" />Espace social {unreadTotal > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">{unreadTotal}</span>}</h2><p className="text-xs text-muted-foreground">{state.friends.length} ami{state.friends.length !== 1 ? "s" : ""}{state.incoming.length ? ` · ${state.incoming.length} demande${state.incoming.length > 1 ? "s" : ""}` : ""}</p></div><div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-secondary/40 p-1">{[["friends","Mes amis"],["requests",`Demandes${state.incoming.length ? ` (${state.incoming.length})` : ""}`],["add","Ajouter"]].map(([id,label]) => <button type="button" key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-bold ${tab === id ? "bg-primary text-white" : "text-muted-foreground"}`}>{label}</button>)}</div></div>
    {tab === "friends" && <div className="grid gap-2 sm:grid-cols-2">{state.friends.map(player => <PlayerRow key={player.id} player={player} actions={<><Button size="icon" aria-label={`Écrire à ${player.display_name}`} className="relative" onClick={() => setActiveFriend(player)}><MessageCircle className="h-4 w-4" />{player.unread_count > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[8px] text-white">{player.unread_count}</span>}</Button><Button size="icon" variant="ghost" aria-label={`Retirer ${player.display_name}`} onClick={() => manage.mutate({ friendship_id: player.id, action: "remove" })}><UserMinus className="h-4 w-4" /></Button></>} />)}{!isLoading && !state.friends.length && <div className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Ta liste est vide. Recherche un joueur pour commencer.</div>}</div>}
    {tab === "requests" && <div className="space-y-4"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Demandes reçues</p><div className="grid gap-2 sm:grid-cols-2">{state.incoming.map(player => <PlayerRow key={player.id} player={player} actions={<><Button size="icon" aria-label={`Accepter ${player.display_name}`} onClick={() => manage.mutate({ friendship_id: player.id, action: "accept" })}><Check className="h-4 w-4" /></Button><Button size="icon" variant="outline" aria-label={`Refuser ${player.display_name}`} onClick={() => manage.mutate({ friendship_id: player.id, action: "decline" })}><X className="h-4 w-4" /></Button></>} />)}{!state.incoming.length && <p className="text-xs text-muted-foreground">Aucune demande reçue.</p>}</div></div><div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Demandes envoyées</p><div className="grid gap-2 sm:grid-cols-2">{state.outgoing.map(player => <PlayerRow key={player.id} player={player} actions={<Button size="icon" variant="outline" aria-label={`Annuler la demande à ${player.display_name}`} onClick={() => manage.mutate({ friendship_id: player.id, action: "cancel" })}><X className="h-4 w-4" /></Button>} />)}{!state.outgoing.length && <p className="text-xs text-muted-foreground">Aucune demande en attente.</p>}</div></div></div>}
    {tab === "add" && <div><form onSubmit={doSearch} className="flex flex-col gap-2 sm:flex-row"><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un pseudo…" maxLength={24} /><Button type="submit" disabled={search.trim().length < 2 || searchMutation.isPending}><Search className="mr-2 h-4 w-4" />Rechercher</Button></form><div className="mt-3 grid gap-2 sm:grid-cols-2">{results.map(player => <PlayerRow key={player.user_id} player={player} actions={player.relation_status === "none" ? <Button size="sm" onClick={() => send.mutate(player.user_id)}><UserPlus className="mr-1 h-4 w-4" />Ajouter</Button> : player.relation_status === "incoming" ? <Button size="sm" onClick={() => manage.mutate({ friendship_id: player.friendship_id, action: "accept" })}><Check className="mr-1 h-4 w-4" />Accepter</Button> : <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock3 className="h-3 w-3" />{player.relation_status === "friend" ? "Déjà ami" : "En attente"}</span>} />)}</div></div>}
    {activeFriend && <FriendChatDialog friend={activeFriend} onClose={() => setActiveFriend(null)} />}
  </section>;
}
