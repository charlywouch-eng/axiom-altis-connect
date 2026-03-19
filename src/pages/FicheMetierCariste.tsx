import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package, Briefcase, ShieldCheck, ArrowRight, CheckCircle2,
  MapPin, Euro, Clock, ThermometerSun, Plane, Home, Globe,
  FileCheck, AlertTriangle, ArrowLeft, Mail, GraduationCap, Wrench
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";
import { MotivationalQuote } from "@/components/MotivationalQuote";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import heroImg from "@/assets/metier-cariste-n1101.jpg";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.55, ease: easeOut } }) };

const MISSIONS = [
  "Conduire des chariots élévateurs (CACES 1, 3, 5) pour la manutention de marchandises",
  "Charger et décharger les camions en respectant les procédures de sécurité",
  "Ranger et gerber les palettes dans les zones de stockage définies",
  "Préparer les commandes selon les bons de préparation",
  "Contrôler la qualité et la quantité des marchandises réceptionnées",
  "Assurer l'entretien courant du chariot (niveau, batterie, pneumatiques)",
  "Respecter les règles de circulation et de sécurité dans l'entrepôt",
];
const COMPETENCES = [
  { icon: Package, text: "CACES R489 catégories 1, 3, 5" },
  { icon: ShieldCheck, text: "Règles de sécurité entrepôt et EPI" },
  { icon: GraduationCap, text: "Gestion de stock et inventaire" },
  { icon: Wrench, text: "Utilisation de PDA et WMS" },
];
const CONDITIONS = [
  "Travail en entrepôt, parfois en chambre froide ou en extérieur",
  "Horaires en 2×8 ou 3×8 selon l'entreprise",
  "Port de charges et station debout prolongée",
  "Forte demande dans les zones logistiques (Île-de-France, Rhône-Alpes, Nord)",
];
const ALTIS_SERVICES = [
  { icon: Globe, text: "Formalités visa de travail – Procédure ANEF" },
  { icon: Plane, text: "Accueil & assistance à l'aéroport" },
  { icon: Home, text: "Logement meublé pour le premier mois" },
  { icon: FileCheck, text: "Accompagnement administratif complet" },
];

export default function FicheMetierCariste() {
  return (
    <>
      <Helmet>
        <title>Cariste – Code ROME N1101 | AXIOM Talents</title>
        <meta name="description" content="Fiche métier Cariste (ROME N1101) : missions, compétences CACES, salaire attractif en France et accompagnement AXIOM & ALTIS." />
        <link rel="canonical" href="https://axiom-talents.com/fiches-metiers/n1101-cariste" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "JobPosting",
          "title": "Cariste", "description": "Conduite de chariots élévateurs et manutention en entrepôt. Métier en haute tension en France.",
          "identifier": { "@type": "PropertyValue", "name": "ROME", "value": "N1101" },
          "datePosted": "2025-05-01", "validThrough": "2026-12-31", "employmentType": "FULL_TIME",
          "hiringOrganization": { "@type": "Organization", "name": "AXIOM Talents", "sameAs": "https://axiom-talents.com" },
          "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressCountry": "FR" } },
          "baseSalary": { "@type": "MonetaryAmount", "currency": "EUR", "value": { "@type": "QuantitativeValue", "value": 2100, "minValue": 1800, "maxValue": 2600, "unitText": "MONTH" } },
          "industry": "Transport & Logistique", "occupationalCategory": "N1101"
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"><Link to="/fiches-metiers" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" /> Toutes les fiches</Link><Badge variant="outline" className="border-accent/40 text-accent text-xs font-mono">ROME N1101</Badge></div></header>

        <motion.section initial="hidden" animate="visible" className="relative overflow-hidden">
          <div className="absolute inset-0"><img src={heroImg} alt="Cariste dans un entrepôt moderne" className="h-full w-full object-cover opacity-20" loading="eager" /><div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" /></div>
          <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
            <motion.div custom={0} variants={fadeUp} className="flex flex-wrap gap-2 mb-4"><Badge className="bg-accent text-accent-foreground border-0 text-xs font-bold">Haute tension</Badge><Badge variant="outline" className="border-success/40 text-success text-xs"><ShieldCheck className="mr-1 h-3 w-3" /> Visa-ready</Badge></motion.div>
            <motion.h1 custom={1} variants={fadeUp} className="font-display text-3xl font-bold md:text-5xl">Cariste</motion.h1>
            <motion.p custom={2} variants={fadeUp} className="mt-2 text-muted-foreground text-lg">Code ROME N1101 · Transport & Logistique</motion.p>
            <motion.div custom={3} variants={fadeUp} className="mt-6 flex items-center gap-6 flex-wrap">
              <span className="flex items-center gap-2 text-success font-semibold"><Euro className="h-5 w-5" /> 1 800 – 2 600 € net/mois</span>
              <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> France entière</span>
              <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> Temps plein</span>
            </motion.div>
          </div>
        </motion.section>

        <MotivationalQuote quote="Votre précision et votre efficacité font tourner les entrepôts. La France a besoin de votre talent." />

        <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}><motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 text-xl font-bold"><Briefcase className="h-5 w-5 text-accent" /> Missions principales</motion.h2><ul className="mt-4 space-y-3">{MISSIONS.map((m, i) => (<motion.li key={i} custom={i + 1} variants={fadeUp} className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" /><span className="text-muted-foreground">{m}</span></motion.li>))}</ul></motion.div>
            <Separator />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}><motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 text-xl font-bold"><Package className="h-5 w-5 text-accent" /> Compétences recherchées</motion.h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{COMPETENCES.map((c, i) => (<motion.div key={i} custom={i + 1} variants={fadeUp}><Card className="border-accent/20 bg-accent/5"><CardContent className="flex items-center gap-3 p-4"><c.icon className="h-5 w-5 text-accent shrink-0" /><span className="text-sm font-medium">{c.text}</span></CardContent></Card></motion.div>))}</div></motion.div>
            <Separator />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}><motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 text-xl font-bold"><ThermometerSun className="h-5 w-5 text-accent" /> Conditions de travail</motion.h2><ul className="mt-4 space-y-3">{CONDITIONS.map((c, i) => (<motion.li key={i} custom={i + 1} variants={fadeUp} className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" /><span className="text-muted-foreground">{c}</span></motion.li>))}</ul></motion.div>
          </div>
          <div className="space-y-6">
            <Card className="border-accent/30 bg-accent/5"><CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /> Pack ALTIS Zéro Stress</h3>
              <p className="text-sm text-muted-foreground">Le Pack ALTIS Zéro Stress vous accompagne dans les formalités de visa de travail (procédure ANEF), l'accueil à l'aéroport, un logement meublé pour le premier mois et l'accompagnement administratif complet.</p>
              <ul className="space-y-2">{ALTIS_SERVICES.map((s, i) => (<li key={i} className="flex items-center gap-2 text-sm"><s.icon className="h-4 w-4 text-accent shrink-0" />{s.text}</li>))}</ul>
              <p className="text-sm text-muted-foreground italic">Avec ALTIS, vous arrivez en France prêt à démarrer rapidement, une fois les éventuelles validations ou formations réalisées par l'employeur.</p>
              <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/signup-light?rome=N1101">Découvrir mon score et commencer mon parcours <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent></Card>
            <Card><CardContent className="p-6 space-y-3"><h3 className="font-bold">En résumé</h3><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-muted p-3 text-center"><p className="font-bold text-accent text-lg">N1101</p><p className="text-muted-foreground text-xs">Code ROME</p></div><div className="rounded-lg bg-muted p-3 text-center"><p className="font-bold text-success text-lg">~2 100 €</p><p className="text-muted-foreground text-xs">Salaire moyen</p></div></div></CardContent></Card>
          </div>
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-6xl px-4 pb-12"><motion.div custom={0} variants={fadeUp}><Card className="border-destructive/20 bg-destructive/5"><CardContent className="p-6 flex items-start gap-4"><AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-1" /><p className="text-sm text-muted-foreground">AXIOM facilite la mise en relation. ALTIS propose un accompagnement logistique et administratif. Aucune garantie de placement, visa ou contrat n'est donnée. Les décisions relèvent des autorités et employeurs.</p></CardContent></Card></motion.div></motion.div>
        <footer className="border-t py-8 text-center text-xs text-muted-foreground"><p>© {new Date().getFullYear()} AXIOM & ALTIS · <Link to="/rgpd" className="underline">Politique de confidentialité</Link> · <a href="mailto:contact@axiom-talents.com" className="inline-flex items-center gap-1 underline"><Mail className="h-3 w-3" />contact@axiom-talents.com</a></p><CesedaLegalNotice /></footer>
      </div>
    </>
  );
}
