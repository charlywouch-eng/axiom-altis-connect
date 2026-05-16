import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordStrengthBar } from "@/components/PasswordStrengthBar";

describe("PasswordStrengthBar", () => {
  it("ne rend rien si le mot de passe est vide", () => {
    const { container } = render(<PasswordStrengthBar password="" />);
    expect(container.firstChild).toBeNull();
  });

  it("affiche le label de force pour un mot de passe faible", () => {
    render(<PasswordStrengthBar password="abc" />);
    expect(screen.getByText(/Très faible/i)).toBeInTheDocument();
  });

  it("affiche le label 'Excellent' pour un mot de passe fort", () => {
    render(<PasswordStrengthBar password="MonMotDePasse1!" />);
    expect(screen.getByText(/Excellent/i)).toBeInTheDocument();
  });

  it("liste les problèmes détectés", () => {
    render(<PasswordStrengthBar password="abcdefgh" />);
    expect(screen.getByText(/Ajoutez majuscules et minuscules/i)).toBeInTheDocument();
    expect(screen.getByText(/Ajoutez au moins un chiffre/i)).toBeInTheDocument();
    expect(screen.getByText(/Ajoutez un caractère spécial/i)).toBeInTheDocument();
  });

  it("n'affiche pas d'alerte HIBP si hibpCount est null", () => {
    render(<PasswordStrengthBar password="MonMotDePasse1!" hibpCount={null} />);
    expect(screen.queryByText(/fuites de données/i)).not.toBeInTheDocument();
  });

  it("n'affiche pas d'alerte HIBP si hibpCount est 0", () => {
    render(<PasswordStrengthBar password="MonMotDePasse1!" hibpCount={0} />);
    expect(screen.queryByText(/fuites de données/i)).not.toBeInTheDocument();
  });

  it("affiche l'alerte HIBP si hibpCount > 0", () => {
    render(<PasswordStrengthBar password="MonMotDePasse1!" hibpCount={1234} />);
    expect(screen.getByText(/1\s*234/)).toBeInTheDocument();
    expect(screen.getByText(/fuites de données/i)).toBeInTheDocument();
  });

  it("affiche 4 segments dans la barre de progression", () => {
    const { container } = render(<PasswordStrengthBar password="MonMotDePasse1!" />);
    // 4 divs de segments à l'intérieur du flex gap-1
    const segments = container.querySelectorAll(".h-1\\.5.flex-1");
    expect(segments).toHaveLength(4);
  });
});
