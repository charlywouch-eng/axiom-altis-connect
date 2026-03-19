import { motion } from "framer-motion";
import { HelpCircle, Plane, Globe, Home, FileCheck, Clock, CreditCard, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45 },
  }),
};

const FAQ_ITEMS = [
  {
    icon: Globe,
    question: "Que comprend exactement le Pack ALTIS à 2 450 € ?",
    answer:
      "Le Pack ALTIS couvre 5 services clés : formalités visa de travail – procédure ANEF (nous vous accompagnons dans toutes les démarches, seules les autorités françaises ANEF + Préfecture étant habilitées à délivrer un visa de travail, Code CESEDA – Articles L.313-10 et R.313-10), billet d'avion aller-retour, accueil personnalisé à l'aéroport d'arrivée, logement meublé pendant 1 mois dans une résidence partenaire, et accompagnement administratif complet (préfecture, sécurité sociale, ouverture de compte).",
  },
  {
    icon: Clock,
    question: "Combien de temps dure le processus complet ?",
    answer:
      "En moyenne 8 à 12 semaines entre la signature et l'arrivée du talent en France. La phase formalités visa de travail (procédure ANEF) représente la majorité du délai. Nous anticipons les démarches administratives en parallèle pour optimiser le calendrier.",
  },
  {
    icon: Plane,
    question: "Le billet d'avion est-il vraiment inclus aller-retour ?",
    answer:
      "Oui, le Pack ALTIS inclut un billet aller-retour en classe économique. La réservation est gérée par AXIOM auprès de compagnies partenaires. En cas de non-renouvellement du contrat, le retour est couvert.",
  },
  {
    icon: Home,
    question: "Comment fonctionne le logement meublé 1 mois ?",
    answer:
      "Nous mettons à disposition un logement meublé et équipé dans une résidence partenaire proche du lieu de travail. Le talent emménage dès J+1 après son arrivée. Au-delà du premier mois, nous l'accompagnons dans sa recherche de logement pérenne.",
  },
  {
    icon: FileCheck,
    question: "Les diplômes sont-ils reconnus en France ?",
    answer:
      "Tous les diplômes passent par un processus de certification MINEFOP et d'apostille MINREX, reconnu par les autorités françaises. Nous vérifions également la compatibilité avec le code ROME du poste visé pour garantir la conformité réglementaire.",
  },
  {
    icon: CreditCard,
    question: "Quand le Pack ALTIS est-il facturé ?",
    answer:
      "Le Pack ALTIS est facturé à l'entreprise en deux temps : 50 % à la confirmation du recrutement et 50 % à l'arrivée effective du talent en France. Aucun frais n'est dû si le processus n'aboutit pas.",
  },
  {
    icon: ShieldCheck,
    question: "Que se passe-t-il si le talent ne convient pas ?",
    answer:
      "Le Success Fee inclut une garantie de remplacement de 3 mois. Si le talent quitte le poste ou ne donne pas satisfaction pendant cette période, nous proposons un profil de remplacement sans frais supplémentaires sur le Success Fee. Le Pack ALTIS du nouveau talent est facturé séparément.",
  },
];

interface AltisPackFAQProps {
  animationCustomStart?: number;
}

export function AltisPackFAQ({ animationCustomStart = 4 }: AltisPackFAQProps) {
  const navigate = useNavigate();

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      custom={animationCustomStart}
      className="mt-20"
    >
      {/* Section header */}
      <div className="mb-8 text-center">
        <Badge variant="outline" className="mb-3 gap-1.5 border-primary/30 text-primary">
          <HelpCircle className="h-3 w-3" />
          Questions fréquentes
        </Badge>
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Pack ALTIS — tout savoir
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Visa ANEF + billet A/R + accueil aéroport + logement meublé 1 mois + accompagnement administratif — 2 450 €/talent.
        </p>
      </div>

      {/* FAQ accordion */}
      <Accordion type="single" collapsible className="mx-auto max-w-2xl">
        {FAQ_ITEMS.map(({ icon: Icon, question, answer }, idx) => (
          <motion.div
            key={question}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={animationCustomStart + 0.5 + idx * 0.08}
          >
            <AccordionItem value={`faq-${idx}`} className="border-border/50">
              <AccordionTrigger className="gap-3 text-left text-sm font-semibold hover:no-underline [&[data-state=open]]:text-primary">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </span>
                  {question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pl-[38px] text-sm leading-relaxed text-muted-foreground">
                {answer}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>

      {/* CTA Demander un devis */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={animationCustomStart + 1.5}
        className="mx-auto mt-10 max-w-2xl text-center"
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Besoin d'un devis personnalisé pour votre entreprise ?
        </p>
        <Button size="lg" className="gap-2" onClick={() => navigate("/demande-devis")}>
          Demander un devis
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.section>
  );
}
