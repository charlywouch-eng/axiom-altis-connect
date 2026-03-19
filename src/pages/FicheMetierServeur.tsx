import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UtensilsCrossed, Briefcase, Wrench, ShieldCheck, ArrowRight, CheckCircle2,
  MapPin, Euro, Clock, Moon, Plane, Home, GraduationCap,
  FileCheck, AlertTriangle, ArrowLeft, Mail
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import heroImg from "@/assets/metier-serveur-g1603.jpg";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.55, ease: easeOut } }) };

const MISSIONS = [
  "Accueillir les clients et les installer à table avec courtoisie",
  "Présenter la carte, conseiller les plats et prendre les commandes",
  "Assurer le service en salle (mise en place, service à l'assiette, débarrassage)",
  "Encaisser les additions et gérer les moyens de paiement",
  "Veiller à la propreté et au bon déroulement du service",
  "Fidéliser la clientèle par un service attentionné et professionnel",
];
const COMPETENCES = [
  { icon: UtensilsCrossed, text: "Techniques de service en salle" },
  { icon: ShieldCheck, text: "Connaissance des règles d'hygiène HACCP" },
  { icon: GraduationCap, text: "Maîtrise du français et sens du relationnel" },
  { icon: Wrench, text: "Gestion de caisse et encaissement" },
];
const CONDITIONS = [
  "Horaires décalés (services midi et soir, week-ends, jours fériés)",
  "Station debout prolongée et port de charges (plateaux)",
  "Environnement convivial au contact direct de la clientèle",
  "Pourboires pouvant compléter significativement le salaire",
];
const ALTIS_SERVICES = [
  { icon: Globe, text: "Formalités visa de travail – Procédure ANEF" },
  { icon: Plane, text: "Accueil & assistance à l'aéroport" },
  { icon: Home, text: "Logement meublé pour le premier mois" },
  { icon: FileCheck, text: "Accompagnement administratif complet" },
];

export default function FicheMetierServeur() {
  return (
    <>
      <Helmet>
        <title>Serveur en restauration – Code ROME G1603 | AXIOM Talents</title>
        <meta name="description" content="Fiche métier Serveur (ROME G1603) : missions, compétences, salaire en France et accompagnement AXIOM & ALTIS pour les talents de la restauration." />
        <link rel="canonical" href="https://axiom-talents.com/fiches-metiers/g1603-serveur" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "JobPosting",
          "title": "Serveur en restauration", "description": "Accueillir les clients, prendre les commandes et assurer le service en salle. Métier en très haute tension en France.",
          "identifier": { "@type": "PropertyValue", "name": "ROME", "value": "G1603" },
          "datePosted": "2025-05-01", "validThrough": "2026-12-31", "employmentType": "FULL_TIME",
          "hiringOrganization": { "@type": "Organization", "name": "AXIOM Talents", "sameAs": "https://axiom-talents.com" },
          "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressCountry": "FR" } },
          "baseSalary": { "@type": "MonetaryAmount", "currency": "EUR", "value": { "@type": "QuantitativeValue", "value": 1900, "minValue": 1700, "maxValue": 2300, "unitText": "MONTH" } },
          "industry": "Hôtellerie-Restauration", "occupationalCategory": "G1603"
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"><Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" /> Retour à l'accueil</Link><Badge variant="outline" className="border-accent/40 text-accent text-xs font-mono">ROME G1603</Badge></div></header>

        <motion.section initial="hidden" animate="visible" className="relative overflow-hidden">
          <div className="absolute inset-0"><img src={heroImg} alt="Serveur en restaurant français" className="h-full w-full object-cover opacity-20" loading="eager" /><div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" /></div>
          <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
            <motion.div custom={0} variants={fadeUp} className="flex flex-wrap gap-2 mb-4"><Badge className="bg-destructive/90 text-destructive-foreground border-0 text-xs font-bold">Très haute tension</Badge><Badge variant="outline" className="border-success/40 text-success text-xs"><ShieldCheck className="mr-1 h-3 w-3" /> Visa-ready</Badge></motion.div>
            <motion.h1 custom={1} variants={fadeUp} className="font-display text-3xl font-bold md:text-5xl">Serveur en restauration</motion.h1>
            <motion.p custom={2} variants={fadeUp} className="mt-2 text-muted-foreground text-lg">Code ROME G1603 · Hôtellerie-Restauration</motion.p>
            <motion.div custom={3} variants={fadeUp} className="mt-6 flex items-center gap-6 flex-wrap">
              <span className="flex items-center gap-2 text-success font-semibold"><Euro className="h-5 w-5" /> 1 700 – 2 300 € net/mois + pourboires</span>
              <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> France entière</span>
              <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> Temps plein</span>
            </motion.div>
          </div>
        </motion.section>

        <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}><motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 text-xl font-bold"><Briefcase className="h-5 w-5 text-accent" /> Missions principales</motion.h2><ul className="mt-4 space-y-3">{MISSIONS.map((m, i) => (<motion.li key={i} custom={i + 1} variants={fadeUp} className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" /><span className="text-muted-foreground">{m}</span></motion.li>))}</ul></motion.div>
            <Separator />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}><motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 text-xl font-bold"><Wrench className="h-5 w-5 text-accent" /> Compétences recherchées</motion.h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{COMPETENCES.map((c, i) => (<motion.div key={i} custom={i + 1} variants={fadeUp}><Card className="border-accent/20 bg-accent/5"><CardContent className="flex items-center gap-3 p-4"><c.icon className="h-5 w-5 text-accent shrink-0" /><span className="text-sm font-medium">{c.text}</span></CardContent></Card></motion.div>))}</div></motion.div>
            <Separator />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}><motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 text-xl font-bold"><Moon className="h-5 w-5 text-accent" /> Conditions de travail</motion.h2><ul className="mt-4 space-y-3">{CONDITIONS.map((c, i) => (<motion.li key={i} custom={i + 1} variants={fadeUp} className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" /><span className="text-muted-foreground">{c}</span></motion.li>))}</ul></motion.div>
          </div>
          <div className="space-y-6">
            <Card className="border-accent/30 bg-accent/5"><CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /> Pack ALTIS Zéro Stress</h3>
              <p className="text-sm text-muted-foreground">Le Pack ALTIS Zéro Stress vous accompagne dans les formalités de visa de travail (procédure ANEF), l'accueil à l'aéroport, un logement meublé pour le premier mois et l'accompagnement administratif complet (préfecture, sécurité sociale, ouverture de compte).</p>
              <ul className="space-y-2">{ALTIS_SERVICES.map((s, i) => (<li key={i} className="flex items-center gap-2 text-sm"><s.icon className="h-4 w-4 text-accent shrink-0" />{s.text}</li>))}</ul>
              <p className="text-sm text-muted-foreground italic">Avec ALTIS, vous arrivez en France prêt à démarrer rapidement, une fois les éventuelles validations ou formations réalisées par l'employeur.</p>
              <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/signup-light?rome=G1603">Découvrir mon score et commencer mon parcours <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent></Card>
            <Card><CardContent className="p-6 space-y-3"><h3 className="font-bold">En résumé</h3><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-muted p-3 text-center"><p className="font-bold text-accent text-lg">G1603</p><p className="text-muted-foreground text-xs">Code ROME</p></div><div className="rounded-lg bg-muted p-3 text-center"><p className="font-bold text-success text-lg">~2 000 €</p><p className="text-muted-foreground text-xs">Salaire moyen</p></div></div></CardContent></Card>
          </div>
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-6xl px-4 pb-12"><motion.div custom={0} variants={fadeUp}><Card className="border-destructive/20 bg-destructive/5"><CardContent className="p-6 flex items-start gap-4"><AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-1" /><p className="text-sm text-muted-foreground">AXIOM facilite la mise en relation. ALTIS propose un accompagnement logistique et administratif. Aucune garantie de placement, visa ou contrat n'est donnée. Les décisions relèvent des autorités et employeurs.</p></CardContent></Card></motion.div></motion.div>
        <footer className="border-t py-8 text-center text-xs text-muted-foreground"><p>© {new Date().getFullYear()} AXIOM & ALTIS · <Link to="/rgpd" className="underline">Politique de confidentialité</Link> · <a href="mailto:contact@axiom-talents.com" className="inline-flex items-center gap-1 underline"><Mail className="h-3 w-3" />contact@axiom-talents.com</a></p><CesedaLegalNotice /></footer>
      </div>
    </>
  );
}
