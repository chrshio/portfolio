import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const cashSans = localFont({
  src: [
    {
      path: '../public/fonts/CashSans-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/CashSans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/CashSans-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/CashSans-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/CashSans-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/CashSans-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-cash-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Checkout POS',
  description: 'Point of Sale Checkout System',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${cashSans.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
