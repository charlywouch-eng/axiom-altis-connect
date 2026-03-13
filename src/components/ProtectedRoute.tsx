import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: boolean;
  allowedRoles?: Array<"talent" | "entreprise" | "admin" | "recruteur">;
}

export function ProtectedRoute({ children, requireRole = true, allowedRoles }: ProtectedRouteProps) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  // If role is required and not set, redirect to onboarding (unless already there)
  if (requireRole && !role && location.pathname !== "/onboarding-role") {
    return <Navigate to="/onboarding-role" replace />;
  }

  // If allowedRoles is specified, check the user's role
  if (allowedRoles && role && !allowedRoles.includes(role as any)) {
    // Redirect to their own dashboard instead of showing forbidden
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "entreprise") return <Navigate to="/dashboard-entreprise" replace />;
    if (role === "talent") return <Navigate to="/dashboard-talent" replace />;
    if (role === "recruteur") return <Navigate to="/dashboard-recruteur" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
