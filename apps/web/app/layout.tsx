import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DineLink - Hong Kong Group Dining',
  description: "Hong Kong's smartest group dining coordinator with cultural intelligence",
  keywords: ['Hong Kong', 'dining', 'group', 'restaurant', 'food', 'cultural', 'coordination'],
  authors: [{ name: 'DineLink Team' }],
  creator: 'DineLink',
  publisher: 'DineLink',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.png',
    apple: '/icon-180x180.png',
  },
  manifest: '/manifest.json',
  themeColor: '#E53E3E',
  colorScheme: 'light dark',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DineLink',
    startupImage: ['/icon-512x512.png'],
  },
  openGraph: {
    type: 'website',
    siteName: 'DineLink',
    title: 'DineLink - Hong Kong Group Dining',
    description: "Hong Kong's smartest group dining coordinator",
    locale: 'en_HK',
    alternateLocale: 'zh_HK',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-HK">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E53E3E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DineLink" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#E53E3E" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen antialiased touch-manipulation">
        <main>{children}</main>
      </body>
    </html>
  );
}
