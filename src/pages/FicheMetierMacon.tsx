import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HardHat, Briefcase, Wrench, ShieldCheck, ArrowRight, CheckCircle2,
  MapPin, Euro, Clock, ThermometerSun, Plane, Home, GraduationCap,
  FileCheck, AlertTriangle, ArrowLeft, Mail
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import heroImg from "@/assets/metier-macon-f1703.jpg";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: easeOut },
  }),
};

const MISSIONS = [
  "Réaliser des ouvrages en maçonnerie (murs, cloisons, dalles) selon les plans techniques",
  "Préparer et appliquer les mortiers et enduits adaptés aux supports",
  "Assembler et positionner des éléments d'armature de béton armé",
  "Effectuer des travaux de coffrage, ferraillage et coulage de béton",
  "Poser des éléments préfabriqués (parpaings, briques, linteaux)",
  "Réaliser des ouvertures (portes, fenêtres) et assurer l'étanchéité",
  "Contrôler l'aplomb, le niveau et l'alignement des ouvrages réalisés",
  "Respecter les consignes de sécurité et les normes de construction en vigueur",
];

const COMPETENCES = [
  "Lecture de plans et de schémas techniques",
  "Maîtrise des techniques de maçonnerie traditionnelle et industrielle",
  "Connaissance des matériaux de construction (béton, brique, pierre, parpaing)",
  "Utilisation d'outils de mesure et de contrôle (niveau, fil à plomb, équerre)",
  "Notions en ferraillage, coffrage et étaiement",
  "Connaissance des normes DTU et des règles de l'art en construction",
  "Capacité à travailler en hauteur avec les EPI appropriés",
  "Coordination avec les autres corps de métier sur chantier",
];

const CONDITIONS = [
  { icon: MapPin, text: "Travail principalement en extérieur, sur chantiers de construction ou de rénovation" },
  { icon: ThermometerSun, text: "Exposition aux conditions climatiques (chaleur, froid, intempéries)" },
  { icon: Clock, text: "Horaires généralement réguliers, avec possibilité d'heures supplémentaires selon l'avancement du chantier" },
  { icon: HardHat, text: "Port obligatoire des équipements de protection individuelle (casque, chaussures de sécurité, gants)" },
];

const ALTIS_SERVICES = [
  { icon: Plane, text: "Accompagnement pour la demande de visa accéléré" },
  { icon: Plane, text: "Organisation du billet d'avion" },
  { icon: Home, text: "Accueil à l'arrivée et logement meublé pour le premier mois" },
  { icon: GraduationCap, text: "Mise en relation avec des formations aux normes françaises, selon les besoins identifiés" },
];

export default function FicheMetierMacon() {
  return (
    <>
      <Helmet>
        <title>Maçon qualifié – Code ROME F1703 | AXIOM Talents</title>
        <meta
          name="description"
          content="Fiche métier Maçon qualifié (ROME F1703) : missions, compétences, conditions de travail et accompagnement AXIOM & ALTIS pour les talents du BTP."
        />
        <link rel="canonical" href="https://axiom-talents.com/fiches-metiers/f1703-macon" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "Maçon qualifié",
          "description": "Réaliser des ouvrages en maçonnerie (murs, cloisons, dalles), préparer mortiers et enduits, assembler des éléments d'armature de béton armé. Métier en très haute tension en France.",
          "identifier": { "@type": "PropertyValue", "name": "ROME", "value": "F1703" },
          "datePosted": "2025-05-01",
          "validThrough": "2026-12-31",
          "employmentType": "FULL_TIME",
          "hiringOrganization": { "@type": "Organization", "name": "AXIOM Talents", "sameAs": "https://axiom-talents.com" },
          "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressCountry": "FR" } },
          "baseSalary": { "@type": "MonetaryAmount", "currency": "EUR", "value": { "@type": "QuantitativeValue", "value": 2200, "minValue": 1900, "maxValue": 2800, "unitText": "MONTH" } },
          "industry": "Construction / BTP",
          "occupationalCategory": "F1703",
          "qualifications": "CQP/DQP Maçonnerie ou équivalent"
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
            </Link>
            <Badge variant="outline" className="border-accent/40 text-accent text-xs font-mono">
              ROME F1703
            </Badge>
          </div>
        </header>

        {/* Hero */}
        <motion.section
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden"
        >
          <div className="absolute inset-0">
            <img
              src={heroImg}
              alt="Maçon qualifié sur un chantier de construction"
              className="h-full w-full object-cover opacity-20"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:pt-24 md:pb-20">
            <motion.div custom={0} variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Métier en tension</Badge>
              <Badge variant="outline" className="border-success/40 text-success text-xs">Visa-ready</Badge>
            </motion.div>

            <motion.h1 custom={1} variants={fadeUp} className="font-display text-3xl font-bold md:text-5xl lg:text-6xl leading-tight">
              Maçon qualifié
            </motion.h1>

            <motion.div custom={2} variants={fadeUp} className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5 text-sm">
                <Briefcase className="h-4 w-4 text-accent" /> Code ROME F1703
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Euro className="h-4 w-4 text-accent" /> Salaire moyen observé : 1 800 – 2 400 € brut / mois
              </span>
            </motion.div>

            <motion.p custom={3} variants={fadeUp} className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
              Le maçon qualifié réalise les travaux de gros œuvre sur des chantiers de construction neuve ou de rénovation. Il intervient sur la structure porteuse des bâtiments, en assurant la solidité, la conformité et la durabilité des ouvrages.
            </motion.p>
          </div>
        </motion.section>

        {/* Content */}
        <main className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-10">

              {/* Missions */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 font-display text-xl font-bold md:text-2xl mb-6">
                  <Briefcase className="h-5 w-5 text-accent" /> Missions principales
                </motion.h2>
                <ul className="space-y-3">
                  {MISSIONS.map((m, i) => (
                    <motion.li key={i} custom={i + 1} variants={fadeUp} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span className="text-sm md:text-base text-muted-foreground leading-relaxed">{m}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <Separator />

              {/* Compétences */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 font-display text-xl font-bold md:text-2xl mb-6">
                  <Wrench className="h-5 w-5 text-accent" /> Compétences techniques couramment demandées
                </motion.h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {COMPETENCES.map((c, i) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp}>
                      <Card className="border-border/50 bg-card/50">
                        <CardContent className="flex items-start gap-3 p-4">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span className="text-sm text-muted-foreground leading-relaxed">{c}</span>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <Separator />

              {/* Conditions */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 font-display text-xl font-bold md:text-2xl mb-6">
                  <HardHat className="h-5 w-5 text-accent" /> Conditions de travail observées
                </motion.h2>
                <div className="space-y-4">
                  {CONDITIONS.map((c, i) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp} className="flex items-start gap-3">
                      <c.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <span className="text-sm md:text-base text-muted-foreground leading-relaxed">{c.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* ALTIS Accompagnement */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className="border-accent/20 bg-accent/5 overflow-hidden">
                  <div className="bg-accent/10 px-6 py-4 border-b border-accent/10">
                    <motion.h3 custom={0} variants={fadeUp} className="font-display text-lg font-bold flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-accent" /> Accompagnement AXIOM & ALTIS
                    </motion.h3>
                  </div>
                  <CardContent className="p-6 space-y-5">
                    <motion.div custom={1} variants={fadeUp}>
                      <h4 className="text-sm font-semibold mb-3">Pack ALTIS Zéro Stress</h4>
                      <ul className="space-y-2.5">
                        {ALTIS_SERVICES.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                            <span className="text-sm text-muted-foreground leading-relaxed">{s.text}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>

                    <Separator className="bg-accent/10" />

                    <motion.div custom={2} variants={fadeUp}>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        L'accompagnement ALTIS facilite l'arrivée en France et soutient la prise de fonction, une fois les éventuelles validations ou formations réalisées par l'employeur.
                      </p>
                    </motion.div>

                    <motion.div custom={3} variants={fadeUp}>
                      <Button asChild className="w-full gap-2" size="lg">
                        <Link to="/signup-light?rome=F1703">
                          Commencer l'évaluation de conformité
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick stats */}
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <h4 className="text-sm font-semibold">En résumé</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Secteur</span>
                      <span className="font-medium">Bâtiment – Gros œuvre</span>
                    </div>
                    <Separator className="bg-border/30" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Niveau requis</span>
                      <span className="font-medium">CQP / DQP MINEFOP</span>
                    </div>
                    <Separator className="bg-border/30" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tension en France</span>
                      <Badge className="bg-destructive/10 text-destructive border-0 text-xs">Très haute</Badge>
                    </div>
                    <Separator className="bg-border/30" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Certification</span>
                      <Badge variant="outline" className="border-success/40 text-success text-xs">Apostille MINREX</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Disclaimer */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16"
          >
            <motion.div custom={0} variants={fadeUp}>
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="flex items-start gap-4 p-6">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Avertissement juridique</h4>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      AXIOM facilite la mise en relation entre talents qualifiés et employeurs. ALTIS propose un accompagnement logistique et administratif.
                      Aucune garantie de placement, de visa ou de contrat de travail n'est donnée. Les décisions d'embauche relèvent exclusivement des employeurs,
                      et les décisions relatives aux titres de séjour relèvent des autorités compétentes. Les informations salariales sont indicatives et basées
                      sur les données publiques disponibles.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="border-t bg-card/50 py-8">
          <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} AXIOM SAS — Tous droits réservés</p>
            <div className="flex items-center gap-4">
              <Link to="/rgpd" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
              <a href="mailto:contact@axiom-talents.com" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Mail className="h-3 w-3" /> contact@axiom-talents.com
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
