import { LogOut, Menu, Zap, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { MessagingButton } from "@/components/messaging/MessagingButton";

export function AppHeader() {
  const { user, role, signOut } = useAuth();

  const { data: subscriptionData } = useQuery({
    queryKey: ["enterprise_subscription", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      return data as { subscribed: boolean; product_id: string | null; subscription_end: string | null };
    },
    enabled: !!user && role === "entreprise",
    staleTime: 60_000,
  });

  const isPremium = role === "entreprise" && subscriptionData?.subscribed;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-xl px-4 md:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-md shadow-accent/20">
            <Zap className="h-4 w-4 text-accent-foreground" />
          </div>
          <h1 className="font-display text-lg font-bold tracking-tight hidden sm:block">
            AXIOM
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {isPremium && (
          <Badge className="hidden sm:inline-flex gap-1 bg-accent text-accent-foreground border-accent/50 px-2.5 py-0.5">
            <Crown className="h-3 w-3" />
            Premium
          </Badge>
        )}
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium">{user?.email}</p>
          <p className="text-xs capitalize text-muted-foreground">{role}</p>
        </div>
        <MessagingButton />
        <NotificationBell />
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={signOut} title="Se déconnecter" className="hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
