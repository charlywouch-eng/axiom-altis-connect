import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { role, loading } = useAuth();

  if (loading) return null;

  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "entreprise") return <Navigate to="/dashboard-entreprise" replace />;
  if (role === "talent") return <Navigate to="/dashboard-talent" replace />;

  // No role yet → onboarding
  return <Navigate to="/onboarding-role" replace />;
}
