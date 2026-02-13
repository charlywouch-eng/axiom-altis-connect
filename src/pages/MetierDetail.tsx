import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle2, Zap, Briefcase, GraduationCap, Scale, Banknote, Users, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function MetierDetail() {
  const { code } = useParams<{ code: string }>();

  const { data: metier, isLoading } = useQuery({
    queryKey: ["metier", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metiers_minefop_rome")
        .select("*")
        .eq("rome_code", code!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });

  const { data: talents, isLoading: talentsLoading } = useQuery({
    queryKey: ["talents-by-rome", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("rome_code", code!)
        .eq("available", true)
        .order("compliance_score", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!metier) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">Métier introuvable.</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Tous les métiers
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90 border-0">
              Publier une offre <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(222,40%,18%)] to-[hsl(20,84%,25%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <motion.div
          initial="hidden"
          animate="visible"
          className="relative mx-auto max-w-6xl px-6 md:px-12"
        >
          <motion.div custom={0} variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className="bg-accent/20 text-accent border-accent/30 text-xs font-mono">
              ROME {metier.rome_code}
            </Badge>
            <Badge className="bg-success/20 text-success border-success/30 text-xs">
              Apostillé MINREX – Visa France prêt
            </Badge>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="font-display text-3xl font-bold text-primary-foreground md:text-5xl"
          >
            {metier.minefop_title}
          </motion.h1>
          <motion.p custom={2} variants={fadeUp} className="mt-2 text-lg text-primary-foreground/60">
            CQP MINEFOP – {metier.rome_title}
          </motion.p>
        </motion.div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-6 md:px-12 -mt-6 pb-20">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
              <Card>
                <CardContent className="p-8">
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-4">
                    <Briefcase className="h-5 w-5 text-accent" /> Description du poste
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {metier.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
              <Card>
                <CardContent className="p-8">
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-4">
                    <CheckCircle2 className="h-5 w-5 text-accent" /> Compétences clés
                  </h2>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {metier.competences.map((c: string) => (
                      <li key={c} className="flex items-center gap-2.5 text-sm text-foreground/80">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
             </motion.div>

            <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp}>
              <Card>
                <CardContent className="p-8">
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-6">
                    <Users className="h-5 w-5 text-accent" /> Talents disponibles ({talents?.length || 0})
                  </h2>
                  {talentsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                    </div>
                  ) : talents && talents.length > 0 ? (
                    <div className="space-y-4">
                      {talents.map((talent) => (
                        <div key={talent.id} className="flex items-start gap-4 p-4 rounded-lg border border-muted bg-muted/30 hover:bg-muted/50 transition-colors">
                          <Avatar className="h-12 w-12 shrink-0">
                            <AvatarFallback className="bg-accent/20 text-accent font-semibold">
                              {talent.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-foreground">{talent.full_name}</h3>
                              {talent.compliance_score >= 80 && (
                                <Badge className="bg-success/20 text-success border-0 text-xs gap-1">
                                  <Flame className="h-3 w-3" /> Compliant
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {talent.country} • {talent.experience_years || 0} ans d'expérience
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {talent.french_level && (
                                <Badge variant="outline" className="text-xs">
                                  Français: {talent.french_level}
                                </Badge>
                              )}
                              {talent.visa_status === 'en_attente' && (
                                <Badge variant="outline" className="text-xs">
                                  Visa: En attente
                                </Badge>
                              )}
                              {talent.visa_status === 'approuve' && (
                                <Badge className="bg-success/20 text-success border-0 text-xs">
                                  Visa: Approuvé
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-accent">{talent.compliance_score}%</p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Aucun talent disponible pour ce métier actuellement.</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
              <Card>
                <CardContent className="p-8">
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-4">
                    <Scale className="h-5 w-5 text-accent" /> Parcours de légalisation
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {metier.legalisation}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
              <Card className="border-accent/20">
                <CardContent className="p-6 space-y-5">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Code ROME</p>
                    <p className="font-mono text-lg font-bold text-accent">{metier.rome_code}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Intitulé ROME</p>
                    <p className="font-display font-semibold">{metier.rome_title}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Niveau requis</p>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-accent" />
                      <p className="font-medium">{metier.niveau}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Salaire moyen France</p>
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-success" />
                      <p className="font-display text-lg font-bold text-success">{metier.salaire_moyen_france}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
              <Link to="/dashboard-entreprise" className="block">
                <Button className="w-full bg-success text-success-foreground hover:bg-success/90 border-0 py-6 text-base font-semibold rounded-xl shadow-lg shadow-success/20">
                  <Zap className="mr-2 h-5 w-5" /> Voir tous les talents
                </Button>
              </Link>
            </motion.div>

            <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
              <Link to="/signup-talent" className="block">
                <Button variant="outline" className="w-full py-5 rounded-xl">
                  Je suis formé à ce métier
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
