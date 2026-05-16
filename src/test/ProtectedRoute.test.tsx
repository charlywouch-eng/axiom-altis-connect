import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/contexts/AuthContext";
const mockUseAuth = vi.mocked(useAuth);

function renderWithRouter(ui: React.ReactElement, initialPath = "/protected") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/protected" element={ui} />
        <Route path="/login" element={<div>Page login</div>} />
        <Route path="/onboarding-role" element={<div>Page onboarding</div>} />
        <Route path="/admin" element={<div>Dashboard admin</div>} />
        <Route path="/dashboard-talent" element={<div>Dashboard talent</div>} />
        <Route path="/dashboard-entreprise" element={<div>Dashboard entreprise</div>} />
        <Route path="/dashboard-recruteur" element={<div>Dashboard recruteur</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("affiche un spinner pendant le chargement", () => {
    mockUseAuth.mockReturnValue({ session: null, user: null, role: null, loading: true, signOut: vi.fn() });
    const { container } = renderWithRouter(
      <ProtectedRoute><div>Contenu protégé</div></ProtectedRoute>
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("redirige vers /login si aucune session", () => {
    mockUseAuth.mockReturnValue({ session: null, user: null, role: null, loading: false, signOut: vi.fn() });
    renderWithRouter(<ProtectedRoute><div>Contenu protégé</div></ProtectedRoute>);
    expect(screen.getByText("Page login")).toBeInTheDocument();
  });

  it("redirige vers /onboarding-role si connecté mais sans rôle", () => {
    mockUseAuth.mockReturnValue({ session: {} as any, user: {} as any, role: null, loading: false, signOut: vi.fn() });
    renderWithRouter(<ProtectedRoute><div>Contenu protégé</div></ProtectedRoute>);
    expect(screen.getByText("Page onboarding")).toBeInTheDocument();
  });

  it("affiche le contenu si session et rôle présents", () => {
    mockUseAuth.mockReturnValue({ session: {} as any, user: {} as any, role: "talent", loading: false, signOut: vi.fn() });
    renderWithRouter(<ProtectedRoute><div>Contenu protégé</div></ProtectedRoute>);
    expect(screen.getByText("Contenu protégé")).toBeInTheDocument();
  });

  it("redirige vers /dashboard-talent si rôle non autorisé (talent → admin requis)", () => {
    mockUseAuth.mockReturnValue({ session: {} as any, user: {} as any, role: "talent", loading: false, signOut: vi.fn() });
    renderWithRouter(
      <ProtectedRoute allowedRoles={["admin"]}><div>Contenu admin</div></ProtectedRoute>
    );
    expect(screen.getByText("Dashboard talent")).toBeInTheDocument();
  });

  it("redirige vers /admin si rôle admin accède à une page non autorisée", () => {
    mockUseAuth.mockReturnValue({ session: {} as any, user: {} as any, role: "admin", loading: false, signOut: vi.fn() });
    renderWithRouter(
      <ProtectedRoute allowedRoles={["talent"]}><div>Contenu talent</div></ProtectedRoute>
    );
    expect(screen.getByText("Dashboard admin")).toBeInTheDocument();
  });

  it("affiche le contenu si le rôle est dans allowedRoles", () => {
    mockUseAuth.mockReturnValue({ session: {} as any, user: {} as any, role: "entreprise", loading: false, signOut: vi.fn() });
    renderWithRouter(
      <ProtectedRoute allowedRoles={["entreprise", "admin"]}><div>Contenu entreprise</div></ProtectedRoute>
    );
    expect(screen.getByText("Contenu entreprise")).toBeInTheDocument();
  });

  it("n'exige pas de rôle si requireRole=false", () => {
    mockUseAuth.mockReturnValue({ session: {} as any, user: {} as any, role: null, loading: false, signOut: vi.fn() });
    renderWithRouter(
      <ProtectedRoute requireRole={false}><div>Onboarding libre</div></ProtectedRoute>
    );
    expect(screen.getByText("Onboarding libre")).toBeInTheDocument();
  });
});
