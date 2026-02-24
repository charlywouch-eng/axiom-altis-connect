import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";

export function DashboardLayout({ children, sidebarVariant }: { children: React.ReactNode; sidebarVariant?: "entreprise" | "talent" | "admin" }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background relative">
        {/* Subtle network background */}
        <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none bg-hero-dots" />
        <AppSidebar variant={sidebarVariant} />
        <div className="flex flex-1 flex-col relative z-10">
          <AppHeader />
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
