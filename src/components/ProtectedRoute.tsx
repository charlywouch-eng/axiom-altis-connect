import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children, requireRole = true }: { children: React.ReactNode; requireRole?: boolean }) {
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

  return <>{children}</>;
}
