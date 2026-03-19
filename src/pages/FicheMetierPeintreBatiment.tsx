import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Paintbrush, Briefcase, Wrench, ShieldCheck, ArrowRight, CheckCircle2,
  MapPin, Euro, Clock, ThermometerSun, Plane, Home, Globe,
  FileCheck, AlertTriangle, ArrowLeft, Mail
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";
import { MotivationalQuote } from "@/components/MotivationalQuote";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import heroImg from "@/assets/metier-peintre-f1502.jpg";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: easeOut },
  }),
};

const MISSIONS = [
  "Préparer les supports à peindre (ponçage, enduit, sous-couche) selon les règles de l'art",
  "Appliquer les peintures, vernis et revêtements muraux sur différents supports",
  "Poser des revêtements muraux (papier peint, toile de verre, vinyle)",
  "Réaliser des travaux de finition soignés (raccords, joints, bandes à fissures)",
  "Monter et utiliser des échafaudages en respectant les consignes de sécurité",
  "Conseiller les clients sur les choix de couleurs et de matériaux adaptés",
  "Protéger les zones de travail et assurer la propreté du chantier",
  "Respecter les normes environnementales (produits, ventilation, gestion des déchets)",
];

const COMPETENCES = [
  "Maîtrise des techniques d'application (rouleau, pistolet, pinceau)",
  "Connaissance des types de peintures et de leurs propriétés (acrylique, glycéro, époxy)",
  "Préparation des supports : enduit, lissage, ponçage",
  "Pose de revêtements muraux et de sols souples",
  "Lecture de plans et de fiches techniques des produits",
  "Utilisation et entretien du matériel professionnel",
  "Travail en hauteur avec respect des normes de sécurité",
  "Sens esthétique et souci du détail dans les finitions",
];

const CONDITIONS = [
  { icon: MapPin, text: "Travail en intérieur et en extérieur, sur chantiers de construction neuve ou de rénovation" },
  { icon: ThermometerSun, text: "Postures variées (debout, accroupi, en hauteur) nécessitant une bonne condition physique" },
  { icon: Clock, text: "Horaires réguliers avec possibilité d'heures supplémentaires selon les délais de chantier" },
  { icon: Paintbrush, text: "Un métier créatif et valorisant, où chaque chantier est une nouvelle réalisation visible et concrète" },
];

const ALTIS_SERVICES = [
  { icon: Globe, text: "Formalités visa de travail – Procédure ANEF : Nous vous accompagnons dans toutes les démarches selon la réglementation de l'ANEF." },
  { icon: Plane, text: "Accueil & Assistance à l'aéroport : Accueil personnalisé dès votre arrivée en France." },
  { icon: Home, text: "Logement meublé 1 mois : Résidence partenaire équipée pour votre premier mois d'installation." },
  { icon: FileCheck, text: "Accompagnement administratif complet : Soutien aux démarches (préfecture, sécurité sociale, ouverture de compte bancaire, etc.)." },
];

export default function FicheMetierPeintreBatiment() {
  return (
    <>
      <Helmet>
        <title>Peintre en bâtiment – Code ROME F1502 | AXIOM Talents</title>
        <meta name="description" content="Fiche métier Peintre en bâtiment (ROME F1502) : missions, compétences, salaire attractif en France et accompagnement AXIOM & ALTIS." />
        <link rel="canonical" href="https://axiom-talents.com/fiches-metiers/f1502-peintre-batiment" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "Peintre en bâtiment",
          "description": "Préparer les surfaces, appliquer peintures et revêtements muraux, réaliser les finitions intérieures et extérieures. Métier en haute tension en France.",
          "identifier": { "@type": "PropertyValue", "name": "ROME", "value": "F1502" },
          "datePosted": "2025-05-01",
          "validThrough": "2026-12-31",
          "employmentType": "FULL_TIME",
          "hiringOrganization": { "@type": "Organization", "name": "AXIOM Talents", "sameAs": "https://axiom-talents.com" },
          "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressCountry": "FR" } },
          "baseSalary": { "@type": "MonetaryAmount", "currency": "EUR", "value": { "@type": "QuantitativeValue", "value": 2100, "minValue": 1850, "maxValue": 2600, "unitText": "MONTH" } },
          "industry": "Construction / BTP",
          "occupationalCategory": "F1502",
          "qualifications": "CQP/DQP Peinture en bâtiment ou équivalent"
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" /> Retour à l'accueil</Link>
            <Badge variant="outline" className="border-accent/40 text-accent text-xs font-mono">ROME F1502</Badge>
          </div>
        </header>

        <motion.section initial="hidden" animate="visible" className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImg} alt="Peintre en bâtiment africain souriant sur un chantier avec une équipe multiculturelle en France" className="h-full w-full object-cover opacity-20" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:pt-24 md:pb-20">
            <motion.div custom={0} variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Métier en tension</Badge>
              <Badge variant="outline" className="border-success/40 text-success text-xs">Visa-ready</Badge>
            </motion.div>
            <motion.h1 custom={1} variants={fadeUp} className="font-display text-3xl font-bold md:text-5xl lg:text-6xl leading-tight">Peintre en bâtiment</motion.h1>
            <motion.div custom={2} variants={fadeUp} className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5 text-sm"><Paintbrush className="h-4 w-4 text-accent" /> Code ROME F1502</span>
              <span className="flex items-center gap-1.5 text-sm"><Euro className="h-4 w-4 text-accent" /> Salaire moyen : 1 800 – 2 500 € brut / mois</span>
            </motion.div>
            <motion.p custom={3} variants={fadeUp} className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
              Le peintre en bâtiment donne vie aux espaces intérieurs et extérieurs. Très recherché dans le secteur du BTP en France, c'est un métier créatif et concret qui offre une excellente employabilité et des perspectives d'évolution vers la décoration ou la gestion de chantier.
            </motion.p>
          </div>
        </motion.section>

        <main className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-10">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 font-display text-xl font-bold md:text-2xl mb-6"><Briefcase className="h-5 w-5 text-accent" /> Missions principales</motion.h2>
                <ul className="space-y-3">
                  {MISSIONS.map((m, i) => (<motion.li key={i} custom={i + 1} variants={fadeUp} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span className="text-sm md:text-base text-muted-foreground leading-relaxed">{m}</span></motion.li>))}
                </ul>
              </motion.div>
              <Separator />
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 font-display text-xl font-bold md:text-2xl mb-6"><Wrench className="h-5 w-5 text-accent" /> Compétences techniques couramment demandées</motion.h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {COMPETENCES.map((c, i) => (<motion.div key={i} custom={i + 1} variants={fadeUp}><Card className="border-border/50 bg-card/50"><CardContent className="flex items-start gap-3 p-4"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span className="text-sm text-muted-foreground leading-relaxed">{c}</span></CardContent></Card></motion.div>))}
                </div>
              </motion.div>
              <Separator />
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 font-display text-xl font-bold md:text-2xl mb-6"><Paintbrush className="h-5 w-5 text-accent" /> Conditions de travail</motion.h2>
                <div className="space-y-4">
                  {CONDITIONS.map((c, i) => (<motion.div key={i} custom={i + 1} variants={fadeUp} className="flex items-start gap-3"><c.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><span className="text-sm md:text-base text-muted-foreground leading-relaxed">{c.text}</span></motion.div>))}
                </div>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className="border-accent/20 bg-accent/5 overflow-hidden">
                  <div className="bg-accent/10 px-6 py-4 border-b border-accent/10">
                    <motion.h3 custom={0} variants={fadeUp} className="font-display text-lg font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /> Pack ALTIS Zéro Stress</motion.h3>
                  </div>
                  <CardContent className="p-6 space-y-5">
                    <motion.div custom={1} variants={fadeUp}>
                      <p className="text-sm text-muted-foreground leading-relaxed">Le Pack ALTIS Zéro Stress vous accompagne dans les formalités pour l'obtention de votre visa de travail selon la réglementation de l'ANEF.</p>
                      <ul className="mt-3 space-y-2.5">{ALTIS_SERVICES.map((s, i) => (<li key={i} className="flex items-start gap-2.5"><s.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span className="text-sm text-muted-foreground leading-relaxed">{s.text}</span></li>))}</ul>
                    </motion.div>
                    <Separator className="bg-accent/10" />
                    <motion.div custom={2} variants={fadeUp}><p className="text-sm text-muted-foreground leading-relaxed italic">Avec ALTIS, vous arrivez en France prêt à démarrer rapidement, une fois les éventuelles validations ou formations réalisées par l'employeur.</p></motion.div>
                    <motion.div custom={3} variants={fadeUp}>
                      <Card className="border-accent/30 bg-accent/5 mb-4"><CardContent className="p-4">
                        <p className="text-sm font-medium text-accent leading-relaxed">🎨 Votre savoir-faire donne vie aux espaces. En France, les chantiers ont besoin de peintres minutieux et créatifs comme vous. Chaque mur que vous transformez raconte une histoire de talent et de fierté professionnelle.</p>
                      </CardContent></Card>
                    </motion.div>
                    <motion.div custom={4} variants={fadeUp}><Button asChild className="w-full gap-2" size="lg"><Link to="/signup-light?rome=F1502">Découvrir mon score et commencer mon parcours <ArrowRight className="h-4 w-4" /></Link></Button></motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <h4 className="text-sm font-semibold">En résumé</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Secteur</span><span className="font-medium">Bâtiment – Second œuvre</span></div>
                    <Separator className="bg-border/30" />
                    <div className="flex justify-between"><span className="text-muted-foreground">Niveau requis</span><span className="font-medium">CQP / DQP MINEFOP</span></div>
                    <Separator className="bg-border/30" />
                    <div className="flex justify-between"><span className="text-muted-foreground">Tension en France</span><Badge className="bg-destructive/10 text-destructive border-0 text-xs">Haute</Badge></div>
                    <Separator className="bg-border/30" />
                    <div className="flex justify-between"><span className="text-muted-foreground">Certification</span><Badge variant="outline" className="border-success/40 text-success text-xs">Apostille MINREX</Badge></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12">
            <motion.div custom={0} variants={fadeUp}>
              <Card className="border-accent/20 bg-accent/5"><CardContent className="p-6 text-center space-y-4">
                <p className="text-base font-medium leading-relaxed">✨ Chaque talent est unique. Votre parcours, votre expérience, votre détermination… tout cela a de la valeur en France. Commencez votre évaluation gratuite et découvrez ce que vous valez vraiment.</p>
                <Button asChild size="lg" className="gap-2"><Link to="/signup-light?rome=F1502">Découvrir mon score gratuitement <ArrowRight className="h-4 w-4" /></Link></Button>
              </CardContent></Card>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8">
            <motion.div custom={0} variants={fadeUp}>
              <Card className="border-destructive/20 bg-destructive/5"><CardContent className="flex items-start gap-4 p-6">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Information importante</h4>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">AXIOM facilite la mise en relation entre talents qualifiés et employeurs. ALTIS propose un accompagnement logistique et administratif. Aucune garantie de placement, de visa ou de contrat de travail n'est donnée. Les décisions relèvent des autorités et employeurs.</p>
                </div>
              </CardContent></Card>
            </motion.div>
          </motion.div>
        </main>

        <footer className="border-t bg-card/50 py-8">
          <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} AXIOM SAS — Tous droits réservés</p>
            <div className="flex items-center gap-4">
              <Link to="/rgpd" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
              <a href="mailto:contact@axiom-talents.com" className="flex items-center gap-1 hover:text-foreground transition-colors"><Mail className="h-3 w-3" /> contact@axiom-talents.com</a>
            </div>
          </div>
          <CesedaLegalNotice />
        </footer>
      </div>
    </>
  );
}
