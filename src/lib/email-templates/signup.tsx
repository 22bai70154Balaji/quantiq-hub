import * as React from 'react'

import { LogoHeader } from './logo-header'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => {
  const firstName = recipient.split('@')[0]
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to Calculyx AI — let’s make your money make sense.</Preview>
      <Body style={main}>
        <Container style={container}>
          <LogoHeader />

          <Section style={hero}>
            <Text style={eyebrow}>WELCOME TO CALCULYX AI</Text>
            <Heading style={h1}>Hi {firstName}, so glad you’re here 👋</Heading>
            <Text style={lede}>
              You just joined a community of curious minds who believe money decisions should feel
              clear, not confusing. We built <strong>{siteName}</strong> to be your calm, sharp,
              always‑honest financial co‑pilot — for loans, taxes, savings, currencies, and every
              “what if?” in between.
            </Text>
          </Section>

          <Section style={ctaWrap}>
            <Text style={confirmLine}>
              Confirm your email so we can save your reports and personalise your dashboard:
            </Text>
            <Button style={button} href={confirmationUrl}>
              Confirm my email
            </Button>
            <Text style={smallHint}>
              or copy this link into your browser: <br />
              <Link href={confirmationUrl} style={link}>{confirmationUrl}</Link>
            </Text>
          </Section>

          <Hr style={divider} />

          <Section>
            <Text style={sectionTitle}>What you can do right after signing in</Text>
            <Text style={bullet}>• Run country‑aware calculators for India, USA and UAE</Text>
            <Text style={bullet}>• Save scenarios and export polished PDF reports</Text>
            <Text style={bullet}>• Get AI insights that explain the numbers in plain English</Text>
            <Text style={bullet}>• Plan goals — from home loans to retirement — with confidence</Text>
          </Section>

          <Section style={warmClose}>
            <Text style={warmText}>
              Reply to this email anytime — a human on our team reads every message. We’re rooting
              for you, and we can’t wait to see what you build with Calculyx AI.
            </Text>
            <Text style={signature}>— The Calculyx AI team</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            You’re receiving this because someone signed up at{' '}
            <Link href={siteUrl} style={footerLink}>{siteName}</Link> with{' '}
            <Link href={`mailto:${recipient}`} style={footerLink}>{recipient}</Link>. If that
            wasn’t you, it’s safe to ignore — no account is created until the link is confirmed.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', color: '#0f1218' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }

const hero = { padding: '8px 0 4px' }
const eyebrow = {
  fontSize: '11px',
  fontWeight: 700 as const,
  letterSpacing: '3px',
  color: '#6d5ef8',
  margin: '0 0 10px',
}
const h1 = {
  fontSize: '26px',
  fontWeight: 700 as const,
  color: '#0f1218',
  lineHeight: '1.25',
  margin: '0 0 14px',
}
const lede = {
  fontSize: '15px',
  color: '#3a3f4b',
  lineHeight: '1.6',
  margin: '0 0 8px',
}

const ctaWrap = {
  background: '#f6f5ff',
  border: '1px solid #ece9ff',
  borderRadius: '14px',
  padding: '20px 20px 22px',
  margin: '24px 0 8px',
  textAlign: 'center' as const,
}
const confirmLine = {
  fontSize: '14px',
  color: '#3a3f4b',
  margin: '0 0 14px',
}
const button = {
  backgroundColor: '#6d5ef8',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '999px',
  padding: '13px 26px',
  textDecoration: 'none',
  display: 'inline-block',
}
const smallHint = {
  fontSize: '12px',
  color: '#6b7280',
  lineHeight: '1.5',
  margin: '14px 0 0',
  wordBreak: 'break-all' as const,
}

const divider = { borderColor: '#eeeef2', margin: '28px 0' }

const sectionTitle = {
  fontSize: '13px',
  fontWeight: 700 as const,
  color: '#0f1218',
  margin: '0 0 10px',
  letterSpacing: '0.3px',
}
const bullet = {
  fontSize: '14px',
  color: '#3a3f4b',
  lineHeight: '1.7',
  margin: '0 0 4px',
}

const warmClose = { margin: '4px 0 0' }
const warmText = {
  fontSize: '14px',
  color: '#3a3f4b',
  lineHeight: '1.6',
  margin: '0 0 12px',
}
const signature = {
  fontSize: '14px',
  fontWeight: 600 as const,
  color: '#0f1218',
  margin: 0,
}

const link = { color: '#6d5ef8', textDecoration: 'underline' }
const footerLink = { color: '#6b7280', textDecoration: 'underline' }
const footer = {
  fontSize: '12px',
  color: '#9aa0a6',
  lineHeight: '1.6',
  margin: '10px 0 0',
}
