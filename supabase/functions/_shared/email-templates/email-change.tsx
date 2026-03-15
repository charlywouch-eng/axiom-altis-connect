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
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Confirmez votre changement d'email – AXIOM × ALTIS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://wfolueffkdzknuowwecf.supabase.co/storage/v1/object/public/email-assets/logo-rh-tech.png" width="140" height="auto" alt="AXIOM ALTIS" style={{ margin: '0 auto' }} />
        </Section>
        <Heading style={h1}>Confirmez votre changement d'email</Heading>
        <Text style={text}>
          Vous avez demandé à changer votre adresse email de{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}vers{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Section style={ctaWrap}><Button style={button} href={confirmationUrl}>Confirmer le changement</Button></Section>
        <Text style={footer}>Si vous n'avez pas fait cette demande, sécurisez votre compte immédiatement.</Text>
        <Section style={signature}>
          <Img src="https://wfolueffkdzknuowwecf.supabase.co/storage/v1/object/public/email-assets/logo-rh-tech.png" width="80" height="auto" alt="AXIOM" style={{ margin: '0 auto 8px' }} />
          <Text style={sigSlogan}>TIaaS — Talent Infrastructure as a Service</Text>
          <Text style={sigLinks}><Link href="https://axiom-talents.com" style={sigLink}>axiom-talents.com</Link>{' · '}<Link href="mailto:support@axiom-talents.com" style={sigLink}>support@axiom-talents.com</Link></Text>
        </Section>
        <Text style={footerBrand}>© {new Date().getFullYear()} AXIOM × ALTIS Mobility – Tous droits réservés</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', padding: '32px 24px', textAlign: 'center' as const, borderRadius: '12px 12px 0 0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '24px 24px 16px' }
const text = { fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: '0 24px 20px' }
const link = { color: '#1E40AF', textDecoration: 'underline' }
const ctaWrap = { textAlign: 'center' as const, margin: '32px 0' }
const button = { backgroundColor: '#1E40AF', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '32px 24px 8px', lineHeight: '1.5' }
const signature = { borderTop: '1px solid #e2e8f0', margin: '24px 24px 0', padding: '20px 0 0', textAlign: 'center' as const }
const sigSlogan = { fontSize: '11px', color: '#64748b', margin: '0 0 4px', fontStyle: 'italic' as const, textAlign: 'center' as const }
const sigLinks = { fontSize: '11px', color: '#94a3b8', margin: '0', textAlign: 'center' as const }
const sigLink = { color: '#1E40AF', textDecoration: 'none' }
const footerBrand = { fontSize: '11px', color: '#cbd5e1', margin: '16px 24px 24px', textAlign: 'center' as const }
