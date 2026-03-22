/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Button, Hr, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "AXIOM × ALTIS"

interface PackAltisConfirmationProps {
  name?: string
}

const steps = [
  { emoji: "📋", title: "Préparation dossier ANEF", desc: "Constitution complète de votre dossier de visa de travail." },
  { emoji: "✈️", title: "Accueil aéroport", desc: "Prise en charge à votre arrivée en France." },
  { emoji: "🏠", title: "Logement meublé 1 mois", desc: "Hébergement garanti pendant votre premier mois." },
  { emoji: "📄", title: "Accompagnement administratif", desc: "Sécurité sociale, compte bancaire, titre de séjour." },
  { emoji: "🎓", title: "Certification MINEFOP", desc: "Validation officielle de vos qualifications." },
]

const PackAltisConfirmationEmail = ({ name }: PackAltisConfirmationProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Pack ALTIS activé — Votre parcours professionnel en France commence !</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={headerBrand}>AXIOM × ALTIS</Text>
          <Text style={headerTagline}>TIaaS — Talent Infrastructure as a Service</Text>
        </Section>

        {/* Badge */}
        <Section style={badgeSection}>
          <Text style={badge}>✅ PACK ALTIS ACTIVÉ</Text>
        </Section>

        {/* Greeting */}
        <Heading style={h1}>
          {name ? `Félicitations ${name} !` : 'Félicitations !'}
        </Heading>

        <Text style={text}>
          Votre paiement de <strong>29 €</strong> a été confirmé avec succès. Votre Pack ALTIS est maintenant actif et votre parcours professionnel en France démarre officiellement.
        </Text>

        <Text style={text}>
          Un conseiller AXIOM vous contactera sous <strong>48 heures</strong> pour démarrer la préparation de votre dossier.
        </Text>

        {/* Steps recap */}
        <Section style={stepsSection}>
          <Text style={stepsTitle}>📦 Récapitulatif de votre Pack ALTIS</Text>
          {steps.map((step) => (
            <Section key={step.title} style={stepRow}>
              <Text style={stepEmoji}>{step.emoji}</Text>
              <Section style={stepContent}>
                <Text style={stepName}>{step.title}</Text>
                <Text style={stepDesc}>{step.desc}</Text>
              </Section>
            </Section>
          ))}
        </Section>

        {/* Priority badge */}
        <Section style={prioritySection}>
          <Text style={priorityText}>
            🚀 <strong>Priorité recruteurs ×3</strong> — Votre profil est désormais mis en avant auprès des entreprises françaises.
          </Text>
        </Section>

        {/* CTA */}
        <Section style={ctaSection}>
          <Button style={ctaButton} href="https://axiom-altis-connect.lovable.app/dashboard-talent">
            Accéder à mon Dashboard
          </Button>
        </Section>

        <Hr style={hr} />

        {/* Footer */}
        <Text style={footer}>
          Cet email vous a été envoyé suite à votre achat du Pack ALTIS.
        </Text>
        <Text style={footer}>
          {SITE_NAME} · notify@axiom-talents.com
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PackAltisConfirmationEmail,
  subject: 'Pack ALTIS activé — Votre parcours en France commence !',
  displayName: 'Confirmation Pack ALTIS',
  previewData: { name: 'Amadou' },
} satisfies TemplateEntry

// Styles — AXIOM brand: Bleu Souverain + Turquoise ALTIS
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }

const header = {
  backgroundColor: '#0F172A',
  padding: '24px 32px',
  borderRadius: '12px 12px 0 0',
  textAlign: 'center' as const,
}
const headerBrand = {
  fontSize: '20px',
  fontWeight: '800' as const,
  color: '#ffffff',
  margin: '0',
  letterSpacing: '1px',
}
const headerTagline = {
  fontSize: '11px',
  color: '#94a3b8',
  margin: '4px 0 0',
  letterSpacing: '0.5px',
}

const badgeSection = { textAlign: 'center' as const, padding: '24px 0 8px' }
const badge = {
  display: 'inline-block' as const,
  backgroundColor: '#ecfdf5',
  color: '#059669',
  fontSize: '12px',
  fontWeight: '700' as const,
  padding: '6px 16px',
  borderRadius: '20px',
  border: '1px solid #a7f3d0',
  margin: '0',
}

const h1 = {
  fontSize: '24px',
  fontWeight: '800' as const,
  color: '#0F172A',
  textAlign: 'center' as const,
  margin: '16px 32px 8px',
}
const text = {
  fontSize: '14px',
  color: '#475569',
  lineHeight: '1.6',
  margin: '0 32px 16px',
}

const stepsSection = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '8px 32px 20px',
}
const stepsTitle = {
  fontSize: '14px',
  fontWeight: '700' as const,
  color: '#0F172A',
  margin: '0 0 16px',
}
const stepRow = {
  display: 'flex' as const,
  marginBottom: '12px',
}
const stepEmoji = {
  fontSize: '16px',
  margin: '0 12px 0 0',
  lineHeight: '1.4',
}
const stepContent = { flex: '1' as const }
const stepName = {
  fontSize: '13px',
  fontWeight: '600' as const,
  color: '#0F172A',
  margin: '0 0 2px',
}
const stepDesc = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0',
  lineHeight: '1.4',
}

const prioritySection = {
  backgroundColor: '#f0fdfa',
  border: '1px solid #99f6e4',
  borderRadius: '10px',
  padding: '14px 20px',
  margin: '0 32px 20px',
}
const priorityText = {
  fontSize: '13px',
  color: '#0d9488',
  margin: '0',
  lineHeight: '1.5',
}

const ctaSection = { textAlign: 'center' as const, margin: '8px 0 24px' }
const ctaButton = {
  backgroundColor: '#1E40AF',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '700' as const,
  padding: '12px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}

const hr = { borderColor: '#e2e8f0', margin: '0 32px' }
const footer = {
  fontSize: '11px',
  color: '#94a3b8',
  textAlign: 'center' as const,
  margin: '16px 32px 4px',
  lineHeight: '1.5',
}
