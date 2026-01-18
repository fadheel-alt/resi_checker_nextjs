import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Resi Checker',
  description: 'Internal tool untuk scan dan cocokkan resi pesanan',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#1f2937',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  )
}
