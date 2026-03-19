import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart, Briefcase, Wrench, ShieldCheck, ArrowRight, CheckCircle2,
  MapPin, Euro, Clock, Moon, Plane, Home, Globe,
  FileCheck, AlertTriangle, ArrowLeft, Mail, HandHeart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";
import { MotivationalQuote } from "@/components/MotivationalQuote";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import heroImg from "@/assets/metier-aide-soignant-j1501.jpg";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: easeOut },
  }),
};

const MISSIONS = [
  "Assurer l'hygiène et le confort des patients (toilette, habillage, aide aux repas)",
  "Accompagner les personnes dans les gestes de la vie quotidienne",
  "Observer l'état de santé des patients et alerter l'équipe soignante en cas de changement",
  "Participer à la distribution et à la prise des repas en veillant aux régimes alimentaires",
  "Assurer l'entretien de l'environnement immédiat du patient (chambre, lit, matériel)",
  "Collaborer avec les infirmiers dans la réalisation des soins",
  "Accompagner les patients en fin de vie avec bienveillance et humanité",
  "Transmettre les informations nécessaires pour la continuité des soins",
];

const COMPETENCES = [
  "Maîtrise des techniques de soins d'hygiène et de confort",
  "Connaissance des règles d'hygiène hospitalière et de prévention des infections",
  "Capacité d'observation et de transmission des informations cliniques",
  "Aptitude relationnelle et empathie auprès des personnes fragiles",
  "Maîtrise de la manutention et des gestes de mobilisation des patients",
  "Connaissance des protocoles de soins en EHPAD et services hospitaliers",
  "Capacité à travailler en équipe pluridisciplinaire",
  "Gestion du stress et résistance physique",
];

const CONDITIONS = [
  { icon: MapPin, text: "Exercice en hôpital, clinique, EHPAD ou à domicile (SSIAD)" },
  { icon: Moon, text: "Horaires variables avec rotations matin, après-midi, nuit et week-ends" },
  { icon: Clock, text: "Rythme soutenu mais profondément humain et gratifiant" },
  { icon: Heart, text: "Un métier de vocation, au cœur de l'accompagnement humain et du bien-être des patients" },
];

const ALTIS_SERVICES = [
  { icon: Globe, text: "Formalités visa de travail – Procédure ANEF : Nous vous accompagnons dans toutes les démarches selon la réglementation de l'ANEF." },
  { icon: Plane, text: "Accueil & Assistance à l'aéroport : Accueil personnalisé dès votre arrivée en France." },
  { icon: Home, text: "Logement meublé 1 mois : Résidence partenaire équipée pour votre premier mois d'installation." },
  { icon: FileCheck, text: "Accompagnement administratif complet : Soutien aux démarches (préfecture, sécurité sociale, ouverture de compte bancaire, etc.)." },
];

export default function FicheMetierAideSoignant() {
  return (
    <>
      <Helmet>
        <title>Aide-soignant – Code ROME J1501 | AXIOM Talents</title>
        <meta name="description" content="Fiche métier Aide-soignant (ROME J1501) : missions, compétences, salaire en France et accompagnement AXIOM & ALTIS pour les talents du secteur santé." />
        <link rel="canonical" href="https://axiom-talents.com/fiches-metiers/j1501-aide-soignant" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "Aide-soignant",
          "description": "Accompagner les patients dans les gestes de la vie quotidienne, assurer les soins d'hygiène et de confort, participer à la surveillance clinique. Métier en très haute tension en France.",
          "identifier": { "@type": "PropertyValue", "name": "ROME", "value": "J1501" },
          "datePosted": "2025-05-01",
          "validThrough": "2026-12-31",
          "employmentType": "FULL_TIME",
          "hiringOrganization": { "@type": "Organization", "name": "AXIOM Talents", "sameAs": "https://axiom-talents.com" },
          "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressCountry": "FR" } },
          "baseSalary": { "@type": "MonetaryAmount", "currency": "EUR", "value": { "@type": "QuantitativeValue", "value": 2000, "minValue": 1800, "maxValue": 2400, "unitText": "MONTH" } },
          "industry": "Santé / Aide à la personne",
          "occupationalCategory": "J1501",
          "qualifications": "DEAS ou diplôme équivalent reconnu"
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
            </Link>
            <Badge variant="outline" className="border-accent/40 text-accent text-xs font-mono">ROME J1501</Badge>
          </div>
        </header>

        <motion.section initial="hidden" animate="visible" className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImg} alt="Aide-soignant africain souriant auprès d'un patient dans une équipe multiculturelle en France" className="h-full w-full object-cover opacity-20" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:pt-24 md:pb-20">
            <motion.div custom={0} variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Métier en forte tension</Badge>
              <Badge variant="outline" className="border-success/40 text-success text-xs">Visa-ready</Badge>
            </motion.div>
            <motion.h1 custom={1} variants={fadeUp} className="font-display text-3xl font-bold md:text-5xl lg:text-6xl leading-tight">Aide-soignant</motion.h1>
            <motion.div custom={2} variants={fadeUp} className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5 text-sm"><HandHeart className="h-4 w-4 text-accent" /> Code ROME J1501</span>
              <span className="flex items-center gap-1.5 text-sm"><Euro className="h-4 w-4 text-accent" /> Salaire moyen : 1 700 – 2 200 € brut / mois</span>
            </motion.div>
            <motion.p custom={3} variants={fadeUp} className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
              L'aide-soignant est un pilier essentiel du système de soins français. Très demandé en hôpitaux, cliniques et EHPAD, ce métier offre un cadre de travail porteur de sens, avec des possibilités d'évolution vers le diplôme d'infirmier et une stabilité professionnelle remarquable.
            </motion.p>
          </div>
        </motion.section>

        <main className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-10">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 font-display text-xl font-bold md:text-2xl mb-6"><Briefcase className="h-5 w-5 text-accent" /> Missions principales</motion.h2>
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
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 font-display text-xl font-bold md:text-2xl mb-6"><Wrench className="h-5 w-5 text-accent" /> Compétences techniques couramment demandées</motion.h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {COMPETENCES.map((c, i) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp}>
                      <Card className="border-border/50 bg-card/50"><CardContent className="flex items-start gap-3 p-4"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span className="text-sm text-muted-foreground leading-relaxed">{c}</span></CardContent></Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              <Separator />
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.h2 custom={0} variants={fadeUp} className="flex items-center gap-2 font-display text-xl font-bold md:text-2xl mb-6"><Heart className="h-5 w-5 text-accent" /> Conditions de travail</motion.h2>
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

            <div className="space-y-6">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className="border-accent/20 bg-accent/5 overflow-hidden">
                  <div className="bg-accent/10 px-6 py-4 border-b border-accent/10">
                    <motion.h3 custom={0} variants={fadeUp} className="font-display text-lg font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /> Pack ALTIS Zéro Stress</motion.h3>
                  </div>
                  <CardContent className="p-6 space-y-5">
                    <motion.div custom={1} variants={fadeUp}>
                      <p className="text-sm text-muted-foreground leading-relaxed">Le Pack ALTIS Zéro Stress vous accompagne dans les formalités pour l'obtention de votre visa de travail selon la réglementation de l'ANEF.</p>
                      <ul className="mt-3 space-y-2.5">
                        {ALTIS_SERVICES.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5"><s.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span className="text-sm text-muted-foreground leading-relaxed">{s.text}</span></li>
                        ))}
                      </ul>
                    </motion.div>
                    <Separator className="bg-accent/10" />
                    <motion.div custom={2} variants={fadeUp}><p className="text-sm text-muted-foreground leading-relaxed italic">Avec ALTIS, vous arrivez en France prêt à démarrer rapidement, une fois les éventuelles validations ou formations réalisées par l'employeur.</p></motion.div>
                    <motion.div custom={3} variants={fadeUp}>
                      <Card className="border-accent/30 bg-accent/5 mb-4"><CardContent className="p-4">
                        <p className="text-sm font-medium text-accent leading-relaxed">💛 Prendre soin des autres est votre force. En France, les établissements de santé recherchent activement des aide-soignants humains et qualifiés comme vous. Votre empathie et votre dévouement sont des qualités rares et précieuses.</p>
                      </CardContent></Card>
                    </motion.div>
                    <motion.div custom={4} variants={fadeUp}>
                      <Button asChild className="w-full gap-2" size="lg"><Link to="/signup-light?rome=J1501">Découvrir mon score et commencer mon parcours <ArrowRight className="h-4 w-4" /></Link></Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <h4 className="text-sm font-semibold">En résumé</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Secteur</span><span className="font-medium">Santé – Soins aux personnes</span></div>
                    <Separator className="bg-border/30" />
                    <div className="flex justify-between"><span className="text-muted-foreground">Niveau requis</span><span className="font-medium">DEAS / CQP MINEFOP</span></div>
                    <Separator className="bg-border/30" />
                    <div className="flex justify-between"><span className="text-muted-foreground">Tension en France</span><Badge className="bg-destructive/10 text-destructive border-0 text-xs">Très haute</Badge></div>
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
                <Button asChild size="lg" className="gap-2"><Link to="/signup-light?rome=J1501">Découvrir mon score gratuitement <ArrowRight className="h-4 w-4" /></Link></Button>
              </CardContent></Card>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8">
            <motion.div custom={0} variants={fadeUp}>
              <Card className="border-destructive/20 bg-destructive/5"><CardContent className="flex items-start gap-4 p-6">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Information importante</h4>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">AXIOM facilite la mise en relation entre talents qualifiés et employeurs. ALTIS propose un accompagnement logistique et administratif. Aucune garantie de placement, de visa ou de contrat de travail n'est donnée. Les décisions d'embauche relèvent exclusivement des employeurs, et les décisions relatives aux titres de séjour relèvent des autorités compétentes.</p>
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
