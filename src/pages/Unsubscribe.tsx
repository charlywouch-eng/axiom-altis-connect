import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, MailX } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Status = "loading" | "valid" | "already" | "invalid" | "confirming" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.valid === false && d.reason === "already_unsubscribed") setStatus("already");
        else if (d.valid) setStatus("valid");
        else setStatus("invalid");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const handleConfirm = async () => {
    setStatus("confirming");
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setStatus(data.success ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-border bg-card shadow-lg">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Vérification…</p>
          </>
        )}
        {status === "valid" && (
          <>
            <MailX className="h-12 w-12 mx-auto text-destructive" />
            <h1 className="text-xl font-bold text-foreground">Se désabonner</h1>
            <p className="text-sm text-muted-foreground">Vous ne recevrez plus d'emails transactionnels de notre part.</p>
            <Button onClick={handleConfirm} variant="destructive" className="w-full">Confirmer le désabonnement</Button>
          </>
        )}
        {status === "confirming" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Traitement…</p>
          </>
        )}
        {status === "done" && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
            <h1 className="text-xl font-bold text-foreground">Désabonnement confirmé</h1>
            <p className="text-sm text-muted-foreground">Vous avez été retiré de notre liste d'envoi.</p>
          </>
        )}
        {status === "already" && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground" />
            <h1 className="text-xl font-bold text-foreground">Déjà désabonné</h1>
            <p className="text-sm text-muted-foreground">Vous êtes déjà désabonné de nos emails.</p>
          </>
        )}
        {(status === "invalid" || status === "error") && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h1 className="text-xl font-bold text-foreground">Lien invalide</h1>
            <p className="text-sm text-muted-foreground">Ce lien de désabonnement est invalide ou a expiré.</p>
          </>
        )}
      </div>
    </div>
  );
}
