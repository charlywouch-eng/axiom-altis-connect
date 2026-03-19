import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Grid3X3, Briefcase, Wrench, ShieldCheck, ArrowRight, CheckCircle2,
  MapPin, Euro, Clock, ThermometerSun, Plane, Home, GraduationCap,
  FileCheck, AlertTriangle, ArrowLeft, Mail
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import heroImg from "@/assets/metier-carreleur-f1603.jpg";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.55, ease: easeOut } }) };

const MISSIONS = [
  "Préparer les surfaces (ragréage, chape, nettoyage) avant la pose",
  "Poser des carreaux de céramique, grès, faïence et pierre naturelle",
  "Réaliser les découpes précises et les motifs décoratifs selon les plans",
  "Appliquer les joints d'étanchéité et de finition",
  "Poser les revêtements de sol et muraux dans les pièces humides",
  "Respecter les normes d'accessibilité et les DTU en vigueur",
];
const COMPETENCES = [
  { icon: Grid3X3, text: "Techniques de pose (collée, scellée, sur plots)" },
  { icon: ShieldCheck, text: "Étanchéité des pièces humides (SPEC)" },
  { icon: GraduationCap, text: "Lecture de plans et calepinage" },
  { icon: Wrench, text: "Découpe et façonnage de carreaux" },
];
const CONDITIONS = [
  "Travail essentiellement en intérieur, souvent à genoux",
  "Horaires réguliers de chantier",
  "Métier artistique alliant précision et créativité",
  "Forte demande dans la rénovation et le neuf",
];
const ALTIS_SERVICES = [
  { icon: Plane, text: "Billet d'avion et accueil à l'arrivée en France" },
  { icon: Home, text: "Logement meublé pour le premier mois" },
  { icon: FileCheck, text: "Accompagnement pour la demande de visa accéléré" },
  { icon: GraduationCap, text: "Mise en relation avec des formations aux normes françaises" },
];

export default function FicheMetierCarreleur() {
  return (
    <>
      <Helmet>
        <title>Carreleur – Code ROME F1603 | AXIOM Talents</title>
        <meta name="description" content="Fiche métier Carreleur (ROME F1603) : missions, compétences, salaire attractif en France et accompagnement AXIOM & ALTIS pour les talents du BTP." />
        <link rel="canonical" href="https://axiom-talents.com/fiches-metiers/f1603-carreleur" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "JobPosting",
          "title": "Carreleur", "description": "Poser les revêtements de sol et muraux en carrelage. Métier en haute tension en France.",
          "identifier": { "@type": "PropertyValue", "name": "ROME", "value": "F1603" },
          "datePosted": "2025-05-01", "validThrough": "2026-12-31", "employmentType": "FULL_TIME",
          "hiringOrganization": { "@type": "Organization", "name": "AXIOM Talents", "sameAs": "https://axiom-talents.com" },
          "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressCountry": "FR" } },
          "baseSalary": { "@type": "MonetaryAmount", "currency": "EUR", "value": { "@type": "QuantitativeValue", "value": 2200, "minValue": 1900, "maxValue": 2800, "unitText": "MONTH" } },
          "industry": "Construction / BTP", "occupationalCategory": "F1603"
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"><Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" /> Retour à l'accueil</Link><Badge variant="outline" className="border-accent/40 text-accent text-xs font-mono">ROME F1603</Badge></div></header>

        <motion.section initial="hidden" animate="visible" className="relative overflow-hidden">
          <div className="absolute inset-0"><img src={heroImg} alt="Carreleur posant du carrelage" className="h-full w-full object-cover opacity-20" loading="eager" /><div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" /></div>
          <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
            <motion.div custom={0} variants={fadeUp} className="flex flex-wrap gap-2 mb-4"><Badge className="bg-accent text-accent-foreground border-0 text-xs font-bold">Haute tension</Badge><Badge variant="outline" className="border-success/40 text-success text-xs"><ShieldCheck className="mr-1 h-3 w-3" /> Visa-ready</Badge></motion.div>
            <motion.h1 custom={1} variants={fadeUp} className="font-display text-3xl font-bold md:text-5xl">Carreleur</motion.h1>
            <motion.p custom={2} variants={fadeUp} className="mt-2 text-muted-foreground text-lg">Code ROME F1603 · Construction / BTP</motion.p>
            <motion.div custom={3} variants={fadeUp} className="mt-6 flex items-center gap-6 flex-wrap">
              <span className="flex items-center gap-2 text-success font-semibold"><Euro className="h-5 w-5" /> 1 900 – 2 800 € net/mois</span>
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
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}><motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 text-xl font-bold"><ThermometerSun className="h-5 w-5 text-accent" /> Conditions de travail</motion.h2><ul className="mt-4 space-y-3">{CONDITIONS.map((c, i) => (<motion.li key={i} custom={i + 1} variants={fadeUp} className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" /><span className="text-muted-foreground">{c}</span></motion.li>))}</ul></motion.div>
          </div>
          <div className="space-y-6">
            <Card className="border-accent/30 bg-accent/5"><CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /> Pack ALTIS Zéro Stress</h3>
              <p className="text-sm text-muted-foreground">Le Pack ALTIS Zéro Stress vous accompagne pour la demande de visa accéléré, le billet d'avion, l'accueil à l'arrivée et un logement meublé pour le premier mois. Une mise en relation avec des formations aux normes françaises peut être proposée selon vos besoins.</p>
              <ul className="space-y-2">{ALTIS_SERVICES.map((s, i) => (<li key={i} className="flex items-center gap-2 text-sm"><s.icon className="h-4 w-4 text-accent shrink-0" />{s.text}</li>))}</ul>
              <p className="text-sm text-muted-foreground italic">Avec ALTIS, vous arrivez en France prêt à démarrer rapidement, une fois les éventuelles validations ou formations réalisées par l'employeur.</p>
              <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/signup-light?rome=F1603">Découvrir mon score et commencer mon parcours <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent></Card>
            <Card><CardContent className="p-6 space-y-3"><h3 className="font-bold">En résumé</h3><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-muted p-3 text-center"><p className="font-bold text-accent text-lg">F1603</p><p className="text-muted-foreground text-xs">Code ROME</p></div><div className="rounded-lg bg-muted p-3 text-center"><p className="font-bold text-success text-lg">~2 350 €</p><p className="text-muted-foreground text-xs">Salaire moyen</p></div></div></CardContent></Card>
          </div>
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-6xl px-4 pb-12"><motion.div custom={0} variants={fadeUp}><Card className="border-destructive/20 bg-destructive/5"><CardContent className="p-6 flex items-start gap-4"><AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-1" /><p className="text-sm text-muted-foreground">AXIOM facilite la mise en relation. ALTIS propose un accompagnement logistique et administratif. Aucune garantie de placement, visa ou contrat n'est donnée. Les décisions relèvent des autorités et employeurs.</p></CardContent></Card></motion.div></motion.div>
        <footer className="border-t py-8 text-center text-xs text-muted-foreground"><p>© {new Date().getFullYear()} AXIOM & ALTIS · <Link to="/rgpd" className="underline">Politique de confidentialité</Link> · <a href="mailto:contact@axiom-talents.com" className="inline-flex items-center gap-1 underline"><Mail className="h-3 w-3" />contact@axiom-talents.com</a></p></footer>
      </div>
    </>
  );
}
