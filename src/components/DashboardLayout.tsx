import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";

export function DashboardLayout({ children, sidebarVariant }: { children: React.ReactNode; sidebarVariant?: "entreprise" | "talent" | "admin" }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background relative">
        {/* Subtle network background — fills entire viewport */}
        <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none bg-hero-dots z-0" />
        {/* Gradient base layer to eliminate white zones */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-background via-background to-primary/[0.04] dark:to-accent/[0.06]" />
        <AppSidebar variant={sidebarVariant} />
        <div className="flex flex-1 flex-col relative z-10 min-h-screen">
          <AppHeader />
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
