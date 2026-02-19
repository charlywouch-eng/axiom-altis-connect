import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Users,
  FileText,
  Globe,
  Clock,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Database,
  Eye,
  Trash2,
  RefreshCw,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: easeOut },
  }),
};

interface SectionProps {
  icon: typeof Shield;
  title: string;
  children: React.ReactNode;
  custom: number;
}

function Section({ icon: Icon, title, children, custom }: SectionProps) {
  return (
    <motion.div
      custom={custom}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </motion.div>
  );
}

export default function Rgpd() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground">
        <div className="container max-w-4xl mx-auto px-4 py-12 md:py-16">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground text-sm mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeOut }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-semibold tracking-widest text-white/50 uppercase">Conformité légale</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              Protection des données personnelles
            </h1>
            <p className="mt-4 text-primary-foreground/60 text-sm sm:text-base max-w-2xl leading-relaxed">
              Politique de confidentialité conforme au Règlement Général sur la Protection des Données (RGPD – UE 2016/679).
              Dernière mise à jour : janvier 2026.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-12 space-y-6">

        {/* Identité responsable */}
        <Section icon={FileText} title="1. Identité du responsable de traitement" custom={0}>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Raison sociale", value: "AXIOM SAS" },
              { label: "Siège social", value: "Paris, France" },
              { label: "Email DPO", value: "rgpd@axiom-talents.com" },
              { label: "Site web", value: "axiom-talents.com" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-foreground/50 uppercase tracking-wide">{label}</span>
                <span className="text-foreground font-medium">{value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground/70 border-t border-border pt-4">
            Pour toute question relative à vos données personnelles, contactez notre Délégué à la Protection des Données (DPO) à l'adresse : <a href="mailto:rgpd@axiom-talents.com" className="text-primary hover:underline">rgpd@axiom-talents.com</a>
          </p>
        </Section>

        {/* Finalités */}
        <Section icon={Database} title="2. Finalités et bases légales du traitement" custom={1}>
          <div className="space-y-4">
            {[
              {
                finalite: "Matching emploi prédictif",
                base: "Consentement + Exécution d'un contrat",
                desc: "Analyse de vos compétences, diplômes et expériences pour vous mettre en relation avec des entreprises recruteuses.",
              },
              {
                finalite: "Certification MINEFOP/MINREX",
                base: "Consentement explicite",
                desc: "Vérification et apostille de vos diplômes auprès des autorités compétentes pour les candidats souhaitant migrer vers la France.",
              },
              {
                finalite: "Gestion de compte",
                base: "Exécution d'un contrat",
                desc: "Création et administration de votre compte candidat ou entreprise sur la plateforme.",
              },
              {
                finalite: "Communication et alertes emploi",
                base: "Intérêt légitime / Consentement",
                desc: "Envoi de notifications sur les offres correspondant à votre profil.",
              },
            ].map((item) => (
              <div key={item.finalite} className="rounded-xl border border-border/50 bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-foreground text-sm">{item.finalite}</span>
                  <span className="shrink-0 text-[10px] font-semibold tracking-wide text-primary bg-primary/10 rounded-full px-2.5 py-0.5">{item.base}</span>
                </div>
                <p className="text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Transferts hors UE */}
        <Section icon={Globe} title="3. Transferts hors Union Européenne" custom={2}>
          <p>
            Dans le cadre de notre mission de mobilité professionnelle Afrique ↔ France, certains de vos données peuvent être transférées vers des pays hors de l'Union Européenne (notamment le Cameroun, le Sénégal, la Côte d'Ivoire et autres pays partenaires).
          </p>
          <p>
            Ces transferts sont encadrés par les <strong className="text-foreground">Clauses Contractuelles Types (CCT) approuvées par la Commission Européenne en juin 2021</strong>, garantissant un niveau de protection équivalent à celui en vigueur au sein de l'UE.
          </p>
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-foreground text-sm">Garanties en place</span>
            </div>
            <ul className="space-y-1 text-xs list-none">
              {[
                "Clauses Contractuelles Types UE 2021 (Décision d'exécution 2021/914)",
                "Chiffrement des données en transit (TLS 1.3) et au repos (AES-256)",
                "Accès limité aux seuls destinataires nécessaires au traitement",
                "Durée de conservation limitée à 24 mois maximum",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Droits */}
        <Section icon={Users} title="4. Vos droits en tant que personne concernée" custom={3}>
          <p>Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            {[
              { icon: Eye, right: "Droit d'accès", desc: "Obtenir une copie de vos données personnelles traitées." },
              { icon: RefreshCw, right: "Droit de rectification", desc: "Corriger des données inexactes ou incomplètes." },
              { icon: Trash2, right: "Droit à l'effacement", desc: "Demander la suppression de vos données (droit à l'oubli)." },
              { icon: Ban, right: "Droit d'opposition", desc: "Vous opposer au traitement de vos données à des fins de prospection." },
            ].map(({ icon: RightIcon, right, desc }) => (
              <div key={right} className="rounded-xl border border-border/50 bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <RightIcon className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground text-sm">{right}</span>
                </div>
                <p className="text-xs">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3">
            Pour exercer vos droits : <a href="mailto:rgpd@axiom-talents.com" className="text-primary hover:underline font-medium">rgpd@axiom-talents.com</a>. Réponse sous 30 jours. En cas de litige, vous pouvez saisir la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CNIL</a>.
          </p>
        </Section>

        {/* Conservation */}
        <Section icon={Clock} title="5. Durée de conservation des données" custom={4}>
          <div className="space-y-2">
            {[
              { type: "Profil candidat actif", duree: "Durée du compte + 24 mois" },
              { type: "Données de diplômes vérifiés", duree: "24 mois maximum" },
              { type: "Logs de connexion / sécurité", duree: "12 mois" },
              { type: "Données de facturation", duree: "10 ans (obligation légale)" },
              { type: "Candidatures et historique matching", duree: "24 mois après clôture" },
            ].map(({ type, duree }) => (
              <div key={type} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <span className="text-foreground text-sm">{type}</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-0.5 shrink-0 ml-4">{duree}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Sécurité */}
        <Section icon={Lock} title="6. Sécurité des données" custom={5}>
          <p>Nous appliquons les mesures techniques et organisationnelles suivantes pour protéger vos données :</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {[
              { label: "Chiffrement en transit", value: "TLS 1.3" },
              { label: "Chiffrement au repos", value: "AES-256" },
              { label: "Protection mots de passe", value: "HIBP activé (Have I Been Pwned)" },
              { label: "Contrôle d'accès", value: "Row-Level Security (RLS)" },
              { label: "Authentification", value: "2FA disponible" },
              { label: "Infrastructure", value: "Hébergement UE certifié ISO 27001" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Contact DPO CTA */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="rounded-2xl bg-primary text-primary-foreground p-8 text-center"
        >
          <Mail className="h-8 w-8 mx-auto mb-3 text-white/70" />
          <h2 className="font-display text-xl font-bold mb-2">Une question sur vos données ?</h2>
          <p className="text-primary-foreground/70 text-sm mb-5">
            Notre DPO est disponible pour répondre à toute demande relative à vos droits RGPD.
          </p>
          <a href="mailto:rgpd@axiom-talents.com">
            <Button variant="secondary" className="rounded-xl font-semibold">
              Contacter le DPO – rgpd@axiom-talents.com
            </Button>
          </a>
        </motion.div>

        {/* Footer mini */}
        <div className="text-center text-xs text-muted-foreground/50 pt-4 pb-8">
          © 2026 AXIOM SAS × ALTIS Mobility. Tous droits réservés. –{" "}
          <Link to="/" className="hover:text-muted-foreground transition-colors">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
