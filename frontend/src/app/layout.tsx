import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BhoomiLedger — Blockchain Land Registry',
  description: 'Immutable. Transparent. Sovereign. Land records on the blockchain.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}