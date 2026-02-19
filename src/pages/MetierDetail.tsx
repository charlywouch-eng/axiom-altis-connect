import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Zap,
  Briefcase,
  GraduationCap,
  Scale,
  Banknote,
  Users,
  Flame,
  BookOpen,
  TrendingUp,
  Globe,
  Layers,
  Info,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
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

interface RomeData {
  code: string;
  label: string;
  definition: string;
  accessCondition: string;
  environments: string[];
  competences: string[];
  formations: { label: string; niveau: string }[];
  debouches: { label: string; code: string }[];
}

async function fetchRomeData(romeCode: string): Promise<RomeData | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

  const res = await fetch(`${supabaseUrl}/functions/v1/rome-metier`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ romeCode }),
  });

  if (!res.ok) return null;
  return res.json() as Promise<RomeData>;
}

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

  const { data: romeData, isLoading: romeLoading } = useQuery({
    queryKey: ["rome-metier", code],
    queryFn: () => fetchRomeData(code!),
    enabled: !!code,
    retry: false,
    staleTime: 1000 * 60 * 30, // cache 30 min
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
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-card/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Tous les métiers
            </Link>
            <div className="flex items-center gap-2">
              {romeLoading && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Chargement ROME officiel…
                </span>
              )}
              {romeData && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Données ROME officielles
                </Badge>
              )}
              <Link to="/signup">
                <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90 border-0">
                  Publier une offre <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
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
              {romeData && (
                <Badge className="bg-white/10 text-white border-white/20 text-xs gap-1">
                  <Globe className="h-3 w-3" /> Source officielle France Travail
                </Badge>
              )}
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

            {/* ROME official label if different */}
            {romeData?.label && romeData.label !== metier.rome_title && (
              <motion.p custom={3} variants={fadeUp} className="mt-1 text-sm text-primary-foreground/40 italic">
                Intitulé ROME officiel : {romeData.label}
              </motion.p>
            )}
          </motion.div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-6xl px-6 md:px-12 -mt-6 pb-20">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main */}
            <div className="lg:col-span-2 space-y-8">

              {/* Description */}
              <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
                <Card>
                  <CardContent className="p-8">
                    <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-4">
                      <Briefcase className="h-5 w-5 text-accent" /> Description du poste
                    </h2>
                    {/* Official ROME definition takes priority */}
                    {romeLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                      </div>
                    ) : (
                      <>
                        <p className="text-muted-foreground leading-relaxed text-base">
                          {romeData?.definition || metier.description}
                        </p>
                        {romeData?.definition && metier.description !== romeData.definition && (
                          <details className="mt-4 group">
                            <summary className="cursor-pointer text-xs text-muted-foreground/60 hover:text-muted-foreground select-none list-none flex items-center gap-1">
                              <Info className="h-3 w-3" /> Voir description MINEFOP
                            </summary>
                            <p className="mt-2 text-sm text-muted-foreground/70 leading-relaxed border-l-2 border-border pl-3">
                              {metier.description}
                            </p>
                          </details>
                        )}
                        {romeData && (
                          <p className="mt-3 text-[11px] text-muted-foreground/50 flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Source : Référentiel ROME v4 · France Travail
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Compétences officielles ROME */}
              <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
                <Card>
                  <CardHeader className="pb-0 px-8 pt-8">
                    <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                      <CheckCircle2 className="h-5 w-5 text-accent" /> Compétences clés
                      {romeData?.competences && romeData.competences.length > 0 && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 ml-1">
                          <Globe className="h-3 w-3" /> ROME officiel
                        </Badge>
                      )}
                    </h2>
                  </CardHeader>
                  <CardContent className="p-8 pt-4">
                    {romeLoading ? (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
                      </div>
                    ) : (
                      <>
                        <ul className="grid gap-3 sm:grid-cols-2">
                          {(romeData?.competences?.length
                            ? romeData.competences
                            : metier.competences
                          ).map((c: string) => (
                            <li key={c} className="flex items-center gap-2.5 text-sm text-foreground/80">
                              <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                        {/* MINEFOP competences if different */}
                        {romeData?.competences?.length > 0 && metier.competences?.length > 0 && (
                          <details className="mt-4">
                            <summary className="cursor-pointer text-xs text-muted-foreground/60 hover:text-muted-foreground select-none list-none flex items-center gap-1">
                              <Info className="h-3 w-3" /> Voir aussi les compétences MINEFOP ({metier.competences.length})
                            </summary>
                            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                              {metier.competences.map((c: string) => (
                                <li key={c} className="flex items-center gap-2 text-xs text-muted-foreground/70">
                                  <div className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Formations – données ROME officielles */}
              {(romeLoading || (romeData?.formations && romeData.formations.length > 0)) && (
                <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
                  <Card>
                    <CardContent className="p-8">
                      <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-5">
                        <GraduationCap className="h-5 w-5 text-accent" /> Formations recommandées
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 ml-1">
                          <Globe className="h-3 w-3" /> ROME officiel
                        </Badge>
                      </h2>
                      {romeLoading ? (
                        <div className="space-y-3">
                          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {romeData!.formations.map((f, i) => (
                            <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 p-3.5 hover:bg-muted/20 transition-colors">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                                <BookOpen className="h-4 w-4 text-accent" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{f.label}</p>
                                {f.niveau && (
                                  <p className="text-xs text-muted-foreground mt-0.5">Niveau : {f.niveau}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Débouchés / Évolutions de carrière */}
              {(romeLoading || (romeData?.debouches && romeData.debouches.length > 0)) && (
                <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp}>
                  <Card>
                    <CardContent className="p-8">
                      <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-5">
                        <TrendingUp className="h-5 w-5 text-accent" /> Évolutions & débouchés métiers
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 ml-1">
                          <Globe className="h-3 w-3" /> ROME officiel
                        </Badge>
                      </h2>
                      {romeLoading ? (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {romeData!.debouches.map((d, i) => (
                            <Tooltip key={i}>
                              <TooltipTrigger asChild>
                                <Link
                                  to={d.code ? `/metier/${d.code}` : "#"}
                                  className="flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:border-primary/30 hover:bg-muted/20 transition-all group"
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <Layers className="h-4 w-4 text-primary group-hover:text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{d.label}</p>
                                    {d.code && (
                                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{d.code}</p>
                                    )}
                                  </div>
                                  {d.code && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
                                </Link>
                              </TooltipTrigger>
                              {d.code && (
                                <TooltipContent className="text-xs">
                                  Voir la fiche métier {d.code}
                                </TooltipContent>
                              )}
                            </Tooltip>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Environnements de travail */}
              {(romeLoading || (romeData?.environments && romeData.environments.length > 0)) && (
                <motion.div initial="hidden" animate="visible" custom={7} variants={fadeUp}>
                  <Card>
                    <CardContent className="p-8">
                      <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-4">
                        <Briefcase className="h-5 w-5 text-accent" /> Environnements de travail
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 ml-1">
                          <Globe className="h-3 w-3" /> ROME officiel
                        </Badge>
                      </h2>
                      {romeLoading ? (
                        <div className="flex flex-wrap gap-2">
                          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-7 w-24 rounded-full" />)}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {romeData!.environments.map((env, i) => (
                            <Badge key={i} variant="secondary" className="text-sm px-3 py-1 rounded-full">
                              {env}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Talents disponibles */}
              <motion.div initial="hidden" animate="visible" custom={8} variants={fadeUp}>
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
                                {talent.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'T'}
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
                                  <Badge variant="outline" className="text-xs">Visa: En attente</Badge>
                                )}
                                {talent.visa_status === 'approuve' && (
                                  <Badge className="bg-success/20 text-success border-0 text-xs">Visa: Approuvé</Badge>
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

              {/* Parcours légalisation */}
              <motion.div initial="hidden" animate="visible" custom={9} variants={fadeUp}>
                <Card>
                  <CardContent className="p-8">
                    <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-4">
                      <Scale className="h-5 w-5 text-accent" /> Parcours de légalisation
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">{metier.legalisation}</p>
                    {romeData?.accessCondition && (
                      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <p className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" /> Conditions d'accès selon le référentiel ROME officiel
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{romeData.accessCondition}</p>
                      </div>
                    )}
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
                      <p className="font-display font-semibold">{romeData?.label || metier.rome_title}</p>
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

                    {/* ROME stats */}
                    {romeData && (
                      <>
                        {romeData.formations.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Formations ROME</p>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <p className="font-medium text-sm">{romeData.formations.length} formation{romeData.formations.length > 1 ? "s" : ""} reconnue{romeData.formations.length > 1 ? "s" : ""}</p>
                            </div>
                          </div>
                        )}
                        {romeData.debouches.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Évolutions possibles</p>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <p className="font-medium text-sm">{romeData.debouches.length} métier{romeData.debouches.length > 1 ? "s" : ""} accessible{romeData.debouches.length > 1 ? "s" : ""}</p>
                            </div>
                          </div>
                        )}
                        <div className="pt-1">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 w-full justify-center py-1">
                            <CheckCircle2 className="h-3 w-3" /> Données officielles France Travail
                          </Badge>
                        </div>
                      </>
                    )}
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
    </TooltipProvider>
  );
}
