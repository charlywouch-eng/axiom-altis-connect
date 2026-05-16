import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

const CONSENT_KEY = "axiom_cookie_consent";

function renderBanner() {
  return render(
    <MemoryRouter>
      <CookieConsentBanner />
    </MemoryRouter>
  );
}

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("s'affiche quand aucun consentement n'est enregistré", () => {
    renderBanner();
    expect(screen.getByText(/Accepter/i)).toBeInTheDocument();
    expect(screen.getByText(/Refuser/i)).toBeInTheDocument();
  });

  it("ne s'affiche pas si le consentement est déjà accepté", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    renderBanner();
    expect(screen.queryByText(/Accepter/i)).not.toBeInTheDocument();
  });

  it("ne s'affiche pas si le consentement est déjà refusé", () => {
    localStorage.setItem(CONSENT_KEY, "refused");
    renderBanner();
    expect(screen.queryByText(/Accepter/i)).not.toBeInTheDocument();
  });

  it("enregistre 'accepted' et masque la bannière au clic Accepter", () => {
    renderBanner();
    fireEvent.click(screen.getByRole("button", { name: /Accepter/i }));
    expect(localStorage.getItem(CONSENT_KEY)).toBe("accepted");
    expect(screen.queryByText(/Accepter/i)).not.toBeInTheDocument();
  });

  it("enregistre 'refused' et masque la bannière au clic Refuser", () => {
    renderBanner();
    fireEvent.click(screen.getByRole("button", { name: /Refuser/i }));
    expect(localStorage.getItem(CONSENT_KEY)).toBe("refused");
    expect(screen.queryByText(/Refuser/i)).not.toBeInTheDocument();
  });

  it("masque la bannière au clic sur le bouton Fermer (×)", () => {
    renderBanner();
    fireEvent.click(screen.getByRole("button", { name: /Fermer/i }));
    expect(screen.queryByText(/Accepter/i)).not.toBeInTheDocument();
  });

  it("affiche le lien vers la politique de confidentialité", () => {
    renderBanner();
    expect(screen.getByRole("link", { name: /Politique de confidentialité/i })).toBeInTheDocument();
  });
});
