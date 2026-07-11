import * as React from 'react'
import { Img, Section } from '@react-email/components'

export const LOGO_URL =
  'https://calculyxai.online/__l5e/assets-v1/eb2f4b7e-9a8a-4b5a-aee3-39f5dfd505be/calculyx-logo.png'

export const LogoHeader = () => (
  <Section style={{ padding: '8px 0 24px' }}>
    <Img
      src={LOGO_URL}
      alt="Calculyx AI"
      width="180"
      height="53"
      style={{ display: 'block', outline: 'none', border: 'none', textDecoration: 'none' }}
    />
  </Section>
)

export default LogoHeader
