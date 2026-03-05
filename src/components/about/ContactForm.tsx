import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease },
  }),
};

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Adresse email invalide.");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-contact", {
        body: { name: name.trim(), email: email.trim(), message: message.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSent(true);
      toast.success("Message envoyé avec succès !");
    } catch (err: any) {
      console.error("Contact form error:", err);
      toast.error(err.message || "Erreur lors de l'envoi. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <h3 className="font-bold text-xl text-foreground">Message envoyé !</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Nous reviendrons vers vous sous 24-48h.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="space-y-4"
    >
      <motion.div custom={0} variants={fadeUp} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-foreground mb-1.5">
            Nom complet
          </label>
          <Input
            id="contact-name"
            placeholder="Jean Dupont"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
            className="bg-muted/30 border-border/50"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-1.5">
            Email
          </label>
          <Input
            id="contact-email"
            type="email"
            placeholder="jean@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            required
            className="bg-muted/30 border-border/50"
          />
        </div>
      </motion.div>
      <motion.div custom={1} variants={fadeUp}>
        <label htmlFor="contact-message" className="block text-sm font-medium text-foreground mb-1.5">
          Votre message
        </label>
        <Textarea
          id="contact-message"
          placeholder="Décrivez votre besoin en recrutement, votre secteur, le nombre de postes…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          rows={5}
          required
          className="bg-muted/30 border-border/50 resize-none"
        />
        <p className="mt-1 text-xs text-muted-foreground/60 text-right">{message.length}/2000</p>
      </motion.div>
      <motion.div custom={2} variants={fadeUp}>
        <Button
          type="submit"
          disabled={sending}
          className="w-full sm:w-auto px-8 py-5 h-auto rounded-2xl font-bold bg-gradient-cta hover:opacity-90 text-white shadow-lg"
        >
          {sending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours…</>
          ) : (
            <><Send className="mr-2 h-4 w-4" /> Envoyer le message</>
          )}
        </Button>
      </motion.div>
    </motion.form>
  );
}
