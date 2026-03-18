import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart, Briefcase, Wrench, ShieldCheck, ArrowRight, CheckCircle2,
  MapPin, Euro, Clock, Moon, Plane, Home, GraduationCap,
  FileCheck, AlertTriangle, ArrowLeft, Mail, Stethoscope
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import heroImg from "@/assets/metier-infirmier-m1805.jpg";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: easeOut },
  }),
};

const MISSIONS = [
  "Réaliser les soins infirmiers prescrits (injections, perfusions, pansements, prélèvements)",
  "Surveiller l'état de santé des patients et transmettre les observations à l'équipe médicale",
  "Administrer les traitements médicamenteux et en assurer le suivi",
  "Accompagner les patients et leur entourage dans la compréhension du parcours de soins",
  "Participer à l'éducation thérapeutique et à la prévention",
  "Assurer la traçabilité des soins dans le dossier patient informatisé",
  "Collaborer avec les médecins, aides-soignants et autres professionnels de santé",
  "Respecter les protocoles d'hygiène, de sécurité et les bonnes pratiques professionnelles",
];

const COMPETENCES = [
  "Maîtrise des gestes techniques infirmiers (soins, prélèvements, pose de perfusions)",
  "Connaissance de la pharmacologie et des interactions médicamenteuses",
  "Capacité d'observation clinique et de réactivité face aux urgences",
  "Utilisation des outils de suivi patient (logiciels de soins, DPI)",
  "Compétences relationnelles et écoute active auprès des patients",
  "Connaissance des protocoles d'hygiène hospitalière",
  "Travail en équipe pluridisciplinaire",
  "Gestion du stress et des situations d'urgence",
];

const CONDITIONS = [
  { icon: MapPin, text: "Exercice en établissement de santé (hôpital, clinique, EHPAD) ou en libéral" },
  { icon: Moon, text: "Horaires variables incluant nuits, week-ends et jours fériés selon le service" },
  { icon: Clock, text: "Rythme de travail soutenu, avec des rotations en 12h fréquentes" },
  { icon: Heart, text: "Métier humainement enrichissant, au cœur de l'accompagnement des patients" },
];

const ALTIS_SERVICES = [
  { icon: Plane, text: "Accompagnement pour la demande de visa accéléré" },
  { icon: Plane, text: "Organisation du billet d'avion" },
  { icon: Home, text: "Accueil à l'arrivée et logement meublé pour le premier mois" },
  { icon: GraduationCap, text: "Mise en relation avec des formations aux normes françaises, selon vos besoins" },
];

export default function FicheMetierInfirmier() {
  return (
    <>
      <Helmet>
        <title>Infirmier diplômé – Code ROME M1805 | AXIOM Talents</title>
        <meta name="description" content="Fiche métier Infirmier diplômé (ROME M1805) : missions, compétences, salaire attractif en France et accompagnement AXIOM & ALTIS pour les talents de la santé." />
        <link rel="canonical" href="https://axiom-talents.com/fiches-metiers/m1805-infirmier" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
            </Link>
            <Badge variant="outline" className="border-accent/40 text-accent text-xs font-mono">ROME M1805</Badge>
          </div>
        </header>

        <motion.section initial="hidden" animate="visible" className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImg} alt="Infirmier diplômé en milieu hospitalier" className="h-full w-full object-cover opacity-20" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:pt-24 md:pb-20">
            <motion.div custom={0} variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Métier en forte tension</Badge>
              <Badge variant="outline" className="border-success/40 text-success text-xs">Visa-ready</Badge>
            </motion.div>
            <motion.h1 custom={1} variants={fadeUp} className="font-display text-3xl font-bold md:text-5xl lg:text-6xl leading-tight">Infirmier diplômé</motion.h1>
            <motion.div custom={2} variants={fadeUp} className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5 text-sm"><Stethoscope className="h-4 w-4 text-accent" /> Code ROME M1805</span>
              <span className="flex items-center gap-1.5 text-sm"><Euro className="h-4 w-4 text-accent" /> Salaire moyen : 2 200 – 3 200 € brut / mois</span>
            </motion.div>
            <motion.p custom={3} variants={fadeUp} className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
              L'infirmier diplômé est un acteur central du système de santé français. Très recherché dans les hôpitaux, cliniques et EHPAD, ce métier offre une carrière stable, valorisante et porteuse de sens, avec de nombreuses perspectives d'évolution.
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
                    <motion.h3 custom={0} variants={fadeUp} className="font-display text-lg font-bold flex items-center gap-2"><FileCheck className="h-5 w-5 text-accent" /> Accompagnement AXIOM & ALTIS</motion.h3>
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
                      <p className="text-sm text-muted-foreground leading-relaxed">Avec ALTIS, vous arrivez en France prêt à démarrer, une fois les éventuelles validations ou formations réalisées par l'employeur.</p>
                    </motion.div>
                    <motion.div custom={3} variants={fadeUp}>
                      <Button asChild className="w-full gap-2" size="lg">
                        <Link to="/signup-light?rome=M1805">Commencer mon évaluation de conformité <ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <h4 className="text-sm font-semibold">En résumé</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Secteur</span><span className="font-medium">Santé – Soins infirmiers</span></div>
                    <Separator className="bg-border/30" />
                    <div className="flex justify-between"><span className="text-muted-foreground">Niveau requis</span><span className="font-medium">Diplôme d'État Infirmier</span></div>
                    <Separator className="bg-border/30" />
                    <div className="flex justify-between"><span className="text-muted-foreground">Tension en France</span><Badge className="bg-destructive/10 text-destructive border-0 text-xs">Très haute</Badge></div>
                    <Separator className="bg-border/30" />
                    <div className="flex justify-between"><span className="text-muted-foreground">Certification</span><Badge variant="outline" className="border-success/40 text-success text-xs">Apostille MINREX</Badge></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-16">
            <motion.div custom={0} variants={fadeUp}>
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="flex items-start gap-4 p-6">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Information importante</h4>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      AXIOM facilite la mise en relation entre talents qualifiés et employeurs. ALTIS propose un accompagnement logistique et administratif.
                      Aucune garantie de placement, de visa ou de contrat de travail n'est donnée. Les décisions d'embauche relèvent exclusivement des employeurs,
                      et les décisions relatives aux titres de séjour relèvent des autorités compétentes. Les informations salariales sont indicatives.
                    </p>
                  </div>
                </CardContent>
              </Card>
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
        </footer>
      </div>
    </>
  );
}
