import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";
import {
  ArrowLeft, MapPin, Banknote, Star, Shield, Package, Sparkles,
  Briefcase, TrendingUp, CheckCircle2, GraduationCap, FileCheck,
  Users, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// ─── Sub-components ───────────────────────────────────────

function OffreHeader({ title, location, salary, createdAt, status, isReady, isAltisEligible }: {
  title: string; location: string; salary: string | null; createdAt: string | null;
  status: string; isReady: boolean; isAltisEligible: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-background p-6 md:p-8"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="flex items-start justify-between gap-4 relative">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{title}</h1>
            {isReady && (
              <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-emerald-400/40 gap-1">
                <Shield className="h-3 w-3" /> AXIOM READY
              </Badge>
            )}
            {!isReady && isAltisEligible && (
              <Badge className="text-[10px] bg-cyan-500/15 text-cyan-600 border-cyan-400/40 gap-1">
                <Package className="h-3 w-3" /> PACK ALTIS
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {location}</span>
            {salary && <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" /> {salary}</span>}
            {createdAt && <span>Publiée le {createdAt}</span>}
          </div>
        </div>
        <Badge variant={status === "open" ? "default" : "secondary"}>
          {status === "open" ? "Ouverte" : status === "filled" ? "Pourvue" : "Fermée"}
        </Badge>
      </div>
    </motion.div>
  );
}

function MissionsCard() {
  const missions = [
    "Intégrer une équipe française dans un environnement professionnel structuré",
    "Mettre en pratique vos compétences avec un accompagnement personnalisé",
    "Bénéficier d'un contrat conforme au droit du travail français",
    "Évoluer dans un cadre sécurisé avec possibilité de formation continue",
    "Participer à des projets concrets dès votre arrivée sur site",
    "Développer votre réseau professionnel en France",
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-accent" /> Ce que vous allez faire</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {missions.map((m, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{m}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AltisCard() {
  const items = [
    { icon: FileCheck, text: "Vérification et apostille de vos diplômes CQP/DQP" },
    { icon: Shield, text: "Procédure visa de travail ANEF complète" },
    { icon: MapPin, text: "Accueil aéroport + logement meublé 1er mois" },
    { icon: Star, text: "Accompagnement administratif et intégration professionnelle" },
  ];
  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-accent" /> Accompagnement ALTIS Zéro Stress</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-start gap-2">
            <Icon className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80">{text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ScoreIACard({ score, complianceScore }: { score: number; complianceScore: number }) {
  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 text-center space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Votre Score IA</p>
        <div className="relative h-24 w-24 mx-auto">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-border/30" />
            <circle
              cx="18" cy="18" r="15" fill="none" strokeWidth="2.5"
              strokeDasharray={`${(score / 100) * 94.2} 94.2`}
              strokeLinecap="round"
              className={score >= 80 ? "text-emerald-500" : score >= 60 ? "text-primary" : "text-amber-500"}
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${score >= 80 ? "text-emerald-500" : "text-primary"}`}>
            {score}%
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Conformité</span>
            <span className="font-medium">{complianceScore}/100</span>
          </div>
          <Progress value={complianceScore} className="h-1.5" />
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {score >= 80
            ? "Excellente compatibilité ! Votre profil est prioritaire pour cette offre."
            : score >= 60
              ? "Bonne compatibilité. Activez le Pack ALTIS pour maximiser vos chances."
              : "Complétez votre profil pour améliorer votre score."}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function OffreFiche() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Offer data passed via navigation state (from FranceTravailOffresCard)
  const navOffer = (location.state as { offer?: { title: string; company: string; location: string; contract: string; salary: string | null; description: string; skills: string[] } })?.offer;

  const sidebarVariant = role === "admin" ? "admin" : role === "entreprise" ? "entreprise" : "talent";

  // Try loading from job_offers DB
  const { data: dbOffer, isLoading } = useQuery({
    queryKey: ["offre_fiche", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_offers")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!id,
  });

  // Talent profile for score
  const { data: talentProfile } = useQuery({
    queryKey: ["talent_profile_fiche", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("talent_profiles")
        .select("score, visa_status, is_premium, skills, french_level, experience_years, compliance_score")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user && role === "talent",
  });

  const handlePostuler = () => {
    toast({
      title: "Candidature AXIOM envoyée ✓",
      description: "Votre candidature est en cours de traitement par notre équipe.",
    });
  };

  const handleActiverAltis = () => {
    toast({
      title: "Pack ALTIS",
      description: "Un conseiller AXIOM vous contactera sous 24h pour activer votre Pack ALTIS.",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout sidebarVariant={sidebarVariant as any}>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  // Merge: DB offer > nav state > fallback
  const title = dbOffer?.title ?? navOffer?.title ?? "Opportunité AXIOM";
  const offerLocation = dbOffer?.location ?? navOffer?.location ?? "France";
  const salary = dbOffer?.salary_range ?? navOffer?.salary ?? null;
  const description = dbOffer?.description ?? navOffer?.description ?? "Cette offre est sélectionnée par notre IA en fonction de vos compétences et de la demande du marché français. Retrouvez ci-dessous les détails du poste et les avantages de l'accompagnement AXIOM.";
  const skills = dbOffer?.required_skills ?? navOffer?.skills ?? [];
  const status = dbOffer?.status ?? "open";
  const createdAt = dbOffer?.created_at ? format(new Date(dbOffer.created_at), "dd MMMM yyyy", { locale: fr }) : null;

  const score = Number(talentProfile?.score ?? 75);
  const visaStatus = talentProfile?.visa_status ?? "en_attente";
  const isPremium = talentProfile?.is_premium ?? false;
  const complianceScore = talentProfile?.compliance_score ?? 0;

  const isReady = score >= 80 && visaStatus !== "en_attente";
  const isAltisEligible = score >= 60;

  return (
    <DashboardLayout sidebarVariant={sidebarVariant as any}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>

        <OffreHeader
          title={title}
          location={offerLocation}
          salary={salary}
          createdAt={createdAt}
          status={status}
          isReady={isReady}
          isAltisEligible={isAltisEligible}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Description du poste</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{description}</p>
                {skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Compétences requises</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <MissionsCard />
            <AltisCard />

            {/* CTA cards for entreprise/admin */}
            {(role === "entreprise" || role === "admin") && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Vous recrutez pour ce poste ?</p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Link to="/dashboard-entreprise?tab=matching">
                        <Users className="h-4 w-4" /> Voir tous les talents
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <Link to="/fiches-metiers">
                        <ChevronRight className="h-4 w-4" /> Découvrir les fiches métiers
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Score & Actions */}
          <div className="space-y-4">
            {role === "talent" && (
              <ScoreIACard score={score} complianceScore={complianceScore} />
            )}

            <Card>
              <CardContent className="p-5 space-y-3">
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-md"
                  onClick={handlePostuler}
                >
                  <Sparkles className="h-4 w-4" /> Postuler via AXIOM
                </Button>
                {isAltisEligible && !isPremium && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-accent/50 text-accent hover:bg-accent/5"
                    onClick={handleActiverAltis}
                  >
                    <Package className="h-4 w-4" /> Activer Pack ALTIS
                  </Button>
                )}
                <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                  Candidature traitée par l'équipe AXIOM · Réponse sous 48h
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-accent" />
                  Correspondance profil
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Cette offre a été sélectionnée par notre IA en fonction de vos compétences, votre expérience et votre niveau de français.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <CesedaLegalNotice />
      </div>
    </DashboardLayout>
  );
}
