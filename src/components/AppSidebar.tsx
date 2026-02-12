import { Home, Users, UserCircle, Shield, Globe, Briefcase, CreditCard, GraduationCap, FileUp, BarChart3 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const talentLinks = [
  { title: "Dashboard", url: "/dashboard-talent", icon: Home },
  { title: "Mon Profil", url: "/dashboard-talent", icon: UserCircle },
];

const entrepriseLinks = [
  { title: "Accueil", url: "/dashboard-entreprise", icon: Home },
  { title: "Mes offres", url: "/dashboard-entreprise/offres", icon: Briefcase },
  { title: "Candidats", url: "/dashboard-entreprise/candidats", icon: Users },
  { title: "Facturation", url: "/dashboard-entreprise/billing", icon: CreditCard },
];

const adminLinks = [
  { title: "Talents", url: "/admin", icon: Users },
  { title: "Import CSV", url: "/admin/import-talents", icon: FileUp },
  { title: "Statistiques", url: "/admin/statistics", icon: BarChart3 },
  { title: "Offres", url: "/admin/offres", icon: Briefcase },
  { title: "Subventions", url: "/admin/subventions", icon: GraduationCap },
  { title: "Facturation", url: "/admin/facturation", icon: CreditCard },
];

export function AppSidebar({ variant }: { variant?: "entreprise" | "talent" | "admin" }) {
  const { role } = useAuth();
  const effectiveRole = variant || role;

  const links =
    effectiveRole === "admin"
      ? adminLinks
      : effectiveRole === "entreprise"
      ? entrepriseLinks
      : talentLinks;

  return (
    <Sidebar className="border-r-0">
      <SidebarContent className="bg-sidebar pt-4">
        <div className="mb-6 px-4">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-sidebar-primary" />
            <span className="font-display text-lg font-bold text-sidebar-foreground">
              Mobility
            </span>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
