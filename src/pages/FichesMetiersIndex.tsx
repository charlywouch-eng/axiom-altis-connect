import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Search, ShieldCheck, Euro } from "lucide-react";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: easeOut } }),
};

const SECTEURS = ["Tous", "BTP", "Santé", "Restauration", "Transport", "Agriculture", "Industrie"] as const;

const FICHES = [
  { to: "/fiches-metiers/f1703-macon", label: "Maçon qualifié", rome: "F1703", secteur: "BTP", tension: "Très haute", salaire: "1 900 – 2 800 €" },
  { to: "/fiches-metiers/f1502-peintre-batiment", label: "Peintre en bâtiment", rome: "F1502", secteur: "BTP", tension: "Haute", salaire: "1 850 – 2 600 €" },
  { to: "/fiches-metiers/f1702-couvreur", label: "Couvreur", rome: "F1702", secteur: "BTP", tension: "Très haute", salaire: "1 950 – 2 900 €" },
  { to: "/fiches-metiers/f1605-plombier-chauffagiste", label: "Plombier-chauffagiste", rome: "F1605", secteur: "BTP", tension: "Très haute", salaire: "2 000 – 3 200 €" },
  { to: "/fiches-metiers/f1603-carreleur", label: "Carreleur", rome: "F1603", secteur: "BTP", tension: "Haute", salaire: "1 900 – 2 800 €" },
  { to: "/fiches-metiers/m1805-infirmier", label: "Infirmier diplômé", rome: "M1805", secteur: "Santé", tension: "Très haute", salaire: "2 200 – 3 500 €" },
  { to: "/fiches-metiers/j1501-aide-soignant", label: "Aide-soignant", rome: "J1501", secteur: "Santé", tension: "Très haute", salaire: "1 800 – 2 400 €" },
  { to: "/fiches-metiers/j1403-auxiliaire-puericulture", label: "Auxiliaire de puériculture", rome: "J1403", secteur: "Santé", tension: "Très haute", salaire: "1 750 – 2 200 €" },
  { to: "/fiches-metiers/j1103-infirmier-bloc", label: "Infirmier de bloc opératoire", rome: "J1103", secteur: "Santé", tension: "Très haute", salaire: "2 400 – 3 800 €" },
  { to: "/fiches-metiers/g1602-cuisinier", label: "Cuisinier", rome: "G1602", secteur: "Restauration", tension: "Très haute", salaire: "1 800 – 2 800 €" },
  { to: "/fiches-metiers/g1603-serveur", label: "Serveur en restauration", rome: "G1603", secteur: "Restauration", tension: "Très haute", salaire: "1 700 – 2 300 €" },
  { to: "/fiches-metiers/g1501-agent-polyvalent-restauration", label: "Agent polyvalent restauration", rome: "G1501", secteur: "Restauration", tension: "Haute", salaire: "1 650 – 2 100 €" },
  { to: "/fiches-metiers/n4101-chauffeur-routier", label: "Chauffeur routier", rome: "N4101", secteur: "Transport", tension: "Très haute", salaire: "2 000 – 3 200 €" },
  { to: "/fiches-metiers/n1101-cariste", label: "Cariste", rome: "N1101", secteur: "Transport", tension: "Haute", salaire: "1 800 – 2 600 €" },
  { to: "/fiches-metiers/a1101-ouvrier-agricole", label: "Ouvrier agricole polyvalent", rome: "A1101", secteur: "Agriculture", tension: "Haute", salaire: "1 700 – 2 300 €" },
  { to: "/fiches-metiers/i1308-technicien-maintenance", label: "Technicien de maintenance", rome: "I1308", secteur: "Industrie", tension: "Très haute", salaire: "2 100 – 3 200 €" },
];

export default function FichesMetiersIndex() {
  const [secteur, setSecteur] = useState<string>("Tous");
  const [search, setSearch] = useState("");

  const filtered = FICHES.filter(f => {
    const matchSecteur = secteur === "Tous" || f.secteur === secteur;
    const matchSearch = search === "" || f.label.toLowerCase().includes(search.toLowerCase()) || f.rome.toLowerCase().includes(search.toLowerCase());
    return matchSecteur && matchSearch;
  });

  return (
    <>
      <Helmet>
        <title>Fiches métiers en tension France – Tous les métiers | AXIOM Talents</title>
        <meta name="description" content="Découvrez toutes les fiches métiers en tension en France : BTP, santé, restauration, industrie. Salaires, missions, compétences et accompagnement AXIOM & ALTIS." />
        <link rel="canonical" href="https://axiom-talents.com/fiches-metiers" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
            </Link>
            <Badge variant="outline" className="border-accent/40 text-accent text-xs font-mono">{filtered.length} métier{filtered.length > 1 ? "s" : ""}</Badge>
          </div>
        </header>

        <motion.section initial="hidden" animate="visible" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(222,47%,8%)] via-[hsl(222,45%,14%)] to-background" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
          <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28 text-center">
            <motion.h1 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-white md:text-5xl">
              Tous les <span className="text-gradient-accent">métiers en tension</span>
            </motion.h1>
            <motion.p custom={1} variants={fadeUp} className="mx-auto mt-4 max-w-2xl text-white/60 text-lg">
              Explorez les fiches métiers prioritaires en France. Chaque fiche détaille les missions, compétences, salaires et l'accompagnement AXIOM & ALTIS.
            </motion.p>
          </div>
        </motion.section>

        <div className="mx-auto max-w-6xl px-4 py-10">
          {/* Filters */}
          <motion.div initial="hidden" animate="visible" className="flex flex-col sm:flex-row items-center gap-4 mb-10">
            <motion.div custom={0} variants={fadeUp} className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un métier ou code ROME…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </motion.div>
            <motion.div custom={1} variants={fadeUp}>
              <ToggleGroup type="single" value={secteur} onValueChange={v => v && setSecteur(v)} className="bg-muted/50 rounded-lg p-1">
                {SECTEURS.map(s => (
                  <ToggleGroupItem key={s} value={s} className="text-xs font-semibold data-[state=on]:bg-accent data-[state=on]:text-accent-foreground px-4">
                    {s}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </motion.div>
          </motion.div>

          {/* Grid */}
          <motion.div initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((fiche, i) => (
              <motion.div key={fiche.to} custom={i} variants={fadeUp}>
                <Link
                  to={fiche.to}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:border-accent/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`${fiche.tension === "Très haute" ? "bg-destructive/90 text-destructive-foreground" : "bg-accent text-accent-foreground"} border-0 text-[10px] font-bold`}>
                      {fiche.tension}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-accent/30 text-accent font-mono">{fiche.rome}</Badge>
                  </div>

                  <h2 className="font-display text-lg font-bold group-hover:text-accent transition-colors">{fiche.label}</h2>

                  <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{fiche.secteur}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
                      <Euro className="h-3.5 w-3.5" /> {fiche.salaire}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-success/40 text-success">
                      <ShieldCheck className="mr-1 h-3 w-3" /> Visa-ready
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    Voir la fiche complète <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">Aucun métier trouvé pour cette recherche.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSecteur("Tous"); setSearch(""); }}>Réinitialiser les filtres</Button>
            </div>
          )}

          {/* CTA */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="mt-16 text-center">
            <Link to="/signup-light">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-10 py-6 h-auto text-base font-semibold rounded-xl shadow-xl shadow-accent/20">
                Vérifier mon éligibilité et commencer mon parcours <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>

        <footer className="border-t py-8 text-center text-xs text-muted-foreground mt-10">
          <p>© {new Date().getFullYear()} AXIOM & ALTIS · <Link to="/rgpd" className="underline">Politique de confidentialité</Link></p>
          <CesedaLegalNotice />
        </footer>
      </div>
    </>
  );
}
