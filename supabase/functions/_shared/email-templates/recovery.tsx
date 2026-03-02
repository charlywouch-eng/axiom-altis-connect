/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Réinitialisez votre mot de passe – AXIOM × ALTIS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://wfolueffkdzknuowwecf.supabase.co/storage/v1/object/public/email-assets/logo-rh-tech.png" width="140" height="auto" alt="AXIOM ALTIS" style={{ margin: '0 auto' }} />
        </Section>
        <Heading style={h1}>Réinitialisez votre mot de passe</Heading>
        <Text style={text}>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte AXIOM × ALTIS. Cliquez ci-dessous pour choisir un nouveau mot de passe.</Text>
        <Section style={ctaWrap}><Button style={button} href={confirmationUrl}>Réinitialiser mon mot de passe</Button></Section>
        <Text style={footer}>Si vous n'avez pas fait cette demande, ignorez cet email. Votre mot de passe ne sera pas modifié.</Text>
        <Text style={footerBrand}>© {new Date().getFullYear()} AXIOM ALTIS – Recrutement international certifié</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', padding: '32px 24px', textAlign: 'center' as const, borderRadius: '12px 12px 0 0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '24px 24px 16px' }
const text = { fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: '0 24px 20px' }
const ctaWrap = { textAlign: 'center' as const, margin: '32px 0' }
const button = { backgroundColor: '#1E40AF', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '32px 24px 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '11px', color: '#cbd5e1', margin: '0 24px 24px', textAlign: 'center' as const }
