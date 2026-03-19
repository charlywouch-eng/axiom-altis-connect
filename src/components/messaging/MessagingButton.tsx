import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MessagingDrawer } from "./MessagingDrawer";

export function MessagingButton() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread_messages_count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      // Get all conversations for user
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);
      if (!convos || convos.length === 0) return 0;

      const convoIds = convos.map(c => c.id);
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convoIds)
        .neq("sender_id", user.id)
        .eq("read", false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative"
        title="Messagerie AXIOM Connect"
      >
        <MessageSquare className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-card">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
      <MessagingDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
