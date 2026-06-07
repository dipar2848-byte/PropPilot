import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { publicEnv } from '@/lib/env';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const siteUrl = publicEnv.siteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'PropPilot — AI Real Estate Marketing & Property Management',
    template: '%s · PropPilot',
  },
  description:
    'PropPilot helps real estate agents manage listings, generate AI marketing kits and publish beautiful property landing pages in minutes.',
  applicationName: 'PropPilot',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PropPilot',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'PropPilot',
    title: 'PropPilot — AI Real Estate Marketing & Property Management',
    description:
      'Manage listings, generate AI marketing kits and publish property landing pages.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PropPilot',
    description: 'AI real estate marketing & property management.',
  },
};

export const viewport: Viewport = {
  themeColor: '#1f3ff5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
