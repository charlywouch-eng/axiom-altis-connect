import { Home, Users, UserCircle, Shield, Building2, Globe } from "lucide-react";
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
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Mon Profil", url: "/profile", icon: UserCircle },
];

const entrepriseLinks = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Talents", url: "/talents", icon: Users },
  { title: "Mon Entreprise", url: "/company", icon: Building2 },
];

const adminLinks = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Utilisateurs", url: "/admin/users", icon: Users },
  { title: "Gestion", url: "/admin/manage", icon: Shield },
];

export function AppSidebar() {
  const { role } = useAuth();

  const links =
    role === "admin"
      ? adminLinks
      : role === "entreprise"
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
