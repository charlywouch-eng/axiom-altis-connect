import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppHeader() {
  const { user, role, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-bold leading-none">
          A&AM
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight text-primary hidden sm:block">
          Axiom<span className="text-accent">&</span>Altis
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium">{user?.email}</p>
          <p className="text-xs capitalize text-muted-foreground">{role}</p>
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={signOut} title="Se déconnecter">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
