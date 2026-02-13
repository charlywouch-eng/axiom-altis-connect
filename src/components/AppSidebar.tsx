import { Home, Users, UserCircle, Globe, Briefcase, CreditCard, GraduationCap, FileUp, BarChart3, Star } from "lucide-react";
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
      <SidebarContent className="bg-sidebar pt-6">
        {/* Premium brand block */}
        <div className="mb-8 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-ocre shadow-lg shadow-ocre/20">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-display text-base font-bold text-sidebar-foreground tracking-tight">
                Axiom<span className="text-gradient-gold">&</span>Altis
              </span>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/30 font-medium">Mobility</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/30 text-[10px] uppercase tracking-[0.15em] font-semibold px-5 mb-1">
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
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sidebar-foreground/60 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      activeClassName="bg-gradient-to-r from-gold/10 to-ocre/5 text-gold font-medium border-l-2 border-gold"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Premium badge */}
        <div className="mt-auto px-5 pb-6">
          <div className="rounded-xl bg-gradient-to-br from-gold/10 to-ocre/5 border border-gold/10 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-3.5 w-3.5 text-gold fill-gold" />
              <span className="text-xs font-semibold text-gold">Premium</span>
            </div>
            <p className="text-[10px] text-sidebar-foreground/40 leading-relaxed">
              Service tout inclus pour votre mobilité internationale.
            </p>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
