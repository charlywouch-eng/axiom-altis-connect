import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, FileCheck, Plane, ScanSearch, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: easeOut },
  }),
};

const badges = [
  { icon: FileCheck, label: "Diplômes authentifiés & apostillés", detail: "Apostille légalisée via MINFOG et le Ministère des Affaires étrangères du Cameroun, conforme à la Convention de La Haye." },
  { icon: ShieldCheck, label: "Conformité ROME garantie", detail: "Chaque profil est évalué et certifié selon le référentiel ROME de France Travail pour une reconnaissance immédiate." },
  { icon: Plane, label: "Visa & logement clé en main", detail: "Prise en charge complète : demande de visa, billet d'avion, logement meublé à l'arrivée en France." },
  { icon: ScanSearch, label: "Vérification 360° par AXIOM", detail: "Background check complet : identité, diplômes, références professionnelles et casier judiciaire." },
];

export default function SecurityComplianceSection() {
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Demande envoyée ! Notre équipe vous contactera sous 24h.");
    setOpen(false);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <section className="relative overflow-hidden bg-primary">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 py-28 md:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
            <motion.span custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-accent">
              Sécurité & Conformité
            </motion.span>
            <motion.h2 custom={1} variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-primary-foreground md:text-5xl">
              Nous vous livrons des talents{" "}
              <span className="text-gradient-accent">sans risque</span>
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-primary-foreground/60 text-lg leading-relaxed">
              Diplômes apostillés au Cameroun via MINFOG + Ministère des Affaires étrangères. Alignés sur ROME. Visa France inclus. Zéro fraude. Zéro surprise.
            </motion.p>
          </motion.div>

          {/* 2×2 Grid */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
            className="mt-16 grid gap-5 sm:grid-cols-2"
          >
            {badges.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <Tooltip key={badge.label}>
                  <TooltipTrigger asChild>
                    <motion.div
                      custom={i}
                      variants={fadeUp}
                      className="group cursor-pointer rounded-2xl border border-accent/20 bg-accent/5 p-6 transition-all duration-300 hover:border-accent/50 hover:bg-accent/10 hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 transition-colors group-hover:bg-accent/25">
                          <Icon className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-display text-base font-semibold text-primary-foreground">{badge.label}</p>
                          <p className="mt-1 text-sm text-primary-foreground/40 line-clamp-2">{badge.detail}</p>
                        </div>
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-sm">
                    <p className="font-semibold mb-1">Détails légaux</p>
                    <p>{badge.detail}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            custom={5} variants={fadeUp}
            className="mt-14 text-center"
          >
            <Button
              size="lg"
              onClick={() => setOpen(true)}
              className="bg-success text-success-foreground hover:bg-success/90 text-lg px-10 py-7 h-auto shadow-xl shadow-success/30 border-0 rounded-xl font-semibold"
            >
              Je recrute en toute sécurité <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        {/* Recruiter Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Recrutez en toute sécurité</DialogTitle>
              <DialogDescription>Remplissez ce formulaire et notre équipe vous recontactera sous 24h.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <Input placeholder="Nom complet" required />
              <Input type="email" placeholder="Email professionnel" required />
              <Input placeholder="Entreprise" required />
              <Textarea placeholder="Décrivez votre besoin de recrutement..." rows={3} />
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Envoyer ma demande
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </section>
    </TooltipProvider>
  );
}
