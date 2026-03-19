import { useState, useEffect, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, Send, Check, CheckCheck, MessageSquare, Search,
  Languages, Sparkles, Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Conversation = {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_text: string | null;
  last_message_at: string | null;
  updated_at: string;
  other_name?: string;
  other_role?: string;
  unread_count?: number;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

function formatMessageDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm", { locale: fr });
  if (isYesterday(d)) return "Hier";
  return format(d, "dd/MM", { locale: fr });
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

interface MessagingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessagingDrawer({ open, onOpenChange }: MessagingDrawerProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // AI state
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (c: any) => {
          const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, first_name")
            .eq("id", otherId)
            .single();
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", otherId)
            .single();

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .neq("sender_id", user.id)
            .eq("read", false);

          return {
            ...c,
            other_name: profile?.full_name || profile?.first_name || "Utilisateur",
            other_role: roleData?.role || "",
            unread_count: count || 0,
          } as Conversation;
        })
      );
      return enriched;
    },
    enabled: !!user && open,
    refetchInterval: open ? 10000 : false,
  });

  // Fetch messages for active conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeConvo?.id],
    queryFn: async () => {
      if (!activeConvo) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConvo.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: !!activeConvo,
    refetchInterval: activeConvo ? 3000 : false,
  });

  // Mark as read when opening conversation
  useEffect(() => {
    if (!activeConvo || !user) return;
    supabase
      .from("messages")
      .update({ read: true })
      .eq("conversation_id", activeConvo.id)
      .neq("sender_id", user.id)
      .eq("read", false)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["conversations"] });
        qc.invalidateQueries({ queryKey: ["unread_messages_count"] });
      });
  }, [activeConvo, messages.length]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load AI suggestions when last received message changes
  useEffect(() => {
    if (!activeConvo || messages.length === 0) {
      setSuggestions([]);
      return;
    }
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender_id === user?.id) {
      setSuggestions([]);
      return;
    }
    loadSuggestions(lastMsg.content);
  }, [messages.length, activeConvo?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!activeConvo) return;
    const channel = supabase
      .channel(`messages-${activeConvo.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${activeConvo.id}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ["messages", activeConvo.id] });
        qc.invalidateQueries({ queryKey: ["conversations"] });
        qc.invalidateQueries({ queryKey: ["unread_messages_count"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvo?.id]);

  // Reset AI state when switching conversations
  useEffect(() => {
    setTranslations({});
    setSuggestions([]);
  }, [activeConvo?.id]);

  // Send message
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConvo || !user) return;
      const { error } = await supabase.from("messages").insert({
        conversation_id: activeConvo.id,
        sender_id: user.id,
        content,
      });
      if (error) throw error;
      await supabase.from("conversations").update({
        last_message_text: content,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", activeConvo.id);
    },
    onSuccess: () => {
      setMessageText("");
      setSuggestions([]);
      qc.invalidateQueries({ queryKey: ["messages", activeConvo?.id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = messageText.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  }, [messageText, sendMutation]);

  // AI: Translate a message
  const handleTranslate = async (msgId: string, text: string) => {
    if (translations[msgId]) {
      setTranslations(prev => {
        const copy = { ...prev };
        delete copy[msgId];
        return copy;
      });
      return;
    }
    setTranslatingId(msgId);
    try {
      const { data, error } = await supabase.functions.invoke("chat-ai-assist", {
        body: { action: "translate", text },
      });
      if (error) throw error;
      if (data?.translation) {
        setTranslations(prev => ({ ...prev, [msgId]: data.translation }));
      }
    } catch (e: any) {
      toast.error("Erreur de traduction", { description: e.message });
    } finally {
      setTranslatingId(null);
    }
  };

  // AI: Load suggestions
  const loadSuggestions = async (lastMessage: string) => {
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat-ai-assist", {
        body: { action: "suggest", text: lastMessage },
      });
      if (error) throw error;
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch {
      // Silent fail for suggestions
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const filteredConvos = conversations.filter(c =>
    !search || c.other_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const roleLabel = (r: string) => {
    switch (r) {
      case "talent": return "Talent";
      case "entreprise": return "Entreprise";
      case "recruteur": return "Recruteur";
      case "admin": return "Admin";
      default: return "";
    }
  };

  const roleColor = (r: string) => {
    switch (r) {
      case "talent": return "bg-accent/15 text-accent";
      case "entreprise": return "bg-primary/15 text-primary";
      case "recruteur": return "bg-success/15 text-success";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
        {!activeConvo ? (
          <>
            {/* Conversations list */}
            <SheetHeader className="p-4 pb-2 border-b">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-accent" />
                  AXIOM Connect
                  {totalUnread > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground text-[10px] h-5 px-1.5">
                      {totalUnread}
                    </Badge>
                  )}
                </SheetTitle>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une conversation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm bg-muted/50"
                />
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1">
              {filteredConvos.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">Aucune conversation</p>
                  <p className="text-xs mt-1">Les conversations s'ouvrent automatiquement après un matching réussi.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredConvos.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveConvo(c)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50",
                        c.unread_count && c.unread_count > 0 && "bg-accent/5"
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20 text-foreground font-bold text-xs">
                          {getInitials(c.other_name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={cn("text-sm font-semibold truncate", c.unread_count && c.unread_count > 0 && "text-foreground")}>
                            {c.other_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                            {c.last_message_at && formatMessageDate(c.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className={cn(
                            "text-xs truncate",
                            c.unread_count && c.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {c.last_message_text || "Nouvelle conversation"}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {c.other_role && (
                              <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 border-0", roleColor(c.other_role))}>
                                {roleLabel(c.other_role)}
                              </Badge>
                            )}
                            {c.unread_count && c.unread_count > 0 && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                                {c.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Button variant="ghost" size="icon" onClick={() => setActiveConvo(null)} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20 text-foreground font-bold text-xs">
                  {getInitials(activeConvo.other_name || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{activeConvo.other_name}</p>
                {activeConvo.other_role && (
                  <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 border-0 mt-0.5", roleColor(activeConvo.other_role))}>
                    {roleLabel(activeConvo.other_role)}
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="text-[9px] gap-1 text-accent border-accent/30">
                <Sparkles className="h-3 w-3" /> IA
              </Badge>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-8">
                  Démarrez la conversation...
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id === user?.id;
                  const hasTranslation = !!translations[m.id];
                  const isTranslating = translatingId === m.id;
                  return (
                    <div key={m.id} className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                        isMine
                          ? "bg-accent text-accent-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}>
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        {hasTranslation && (
                          <div className={cn(
                            "mt-2 pt-2 border-t text-xs italic",
                            isMine ? "border-accent-foreground/20 text-accent-foreground/80" : "border-border text-muted-foreground"
                          )}>
                            <span className="flex items-center gap-1 mb-0.5 not-italic font-medium">
                              <Languages className="h-3 w-3" /> Traduction
                            </span>
                            {translations[m.id]}
                          </div>
                        )}
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          isMine ? "justify-end" : "justify-start"
                        )}>
                          <span className={cn(
                            "text-[10px]",
                            isMine ? "text-accent-foreground/60" : "text-muted-foreground"
                          )}>
                            {format(new Date(m.created_at), "HH:mm")}
                          </span>
                          {isMine && (
                            m.read
                              ? <CheckCheck className="h-3 w-3 text-accent-foreground/60" />
                              : <Check className="h-3 w-3 text-accent-foreground/40" />
                          )}
                        </div>
                      </div>
                      {/* Translate button */}
                      <button
                        onClick={() => handleTranslate(m.id, m.content)}
                        disabled={isTranslating}
                        className={cn(
                          "flex items-center gap-1 text-[10px] mt-1 px-2 py-0.5 rounded-full transition-colors",
                          hasTranslation
                            ? "text-accent bg-accent/10 hover:bg-accent/20"
                            : "text-muted-foreground hover:text-accent hover:bg-accent/10"
                        )}
                      >
                        {isTranslating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Languages className="h-3 w-3" />
                        )}
                        {hasTranslation ? "Masquer" : "Traduire"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* AI Suggestions */}
            {(suggestions.length > 0 || loadingSuggestions) && (
              <div className="px-3 py-2 border-t border-border/50 bg-accent/5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span className="text-[10px] font-medium text-accent">Suggestions IA</span>
                </div>
                {loadingSuggestions ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" /> Génération...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setMessageText(s);
                          setSuggestions([]);
                        }}
                        className="text-xs px-3 py-1.5 rounded-full bg-card border border-accent/20 text-foreground hover:bg-accent/10 hover:border-accent/40 transition-colors truncate max-w-[90%]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t bg-card/50">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Votre message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 h-10 text-sm bg-muted/50"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!messageText.trim() || sendMutation.isPending}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground h-10 w-10 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
