import type { Metadata } from 'next';
import { Inter, Syne, Space_Mono } from 'next/font/google';
import './globals.css';
import ClientProviders from './client-providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
  },
  title: {
    default: 'Click Win - Digital Auction Platform on BNB Chain',
    template: '%s | Click Win',
  },
  description:
    'Click Win is a next-generation digital auction platform built on BNB Chain. Purchase digital credits, participate in live auctions, and win prizes with progressive discount mechanics.',
  keywords: [
    'click win',
    'digital auction',
    'BNB Chain',
    'blockchain',
    'Web3',
    'crypto',
    'USDT',
    'progressive discount',
    'decentralized',
  ],
  authors: [{ name: 'Click Win' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clickwin.fun',
    title: 'Click Win - Digital Auction Platform on BNB Chain',
    description:
      'A next-generation digital auction platform with progressive discount mechanics powered by blockchain.',
    siteName: 'Click Win',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Click Win - Digital Auction Platform',
    description:
      'Progressive discount auctions powered by BNB Chain. Connect your wallet and start participating.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} ${spaceMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-background text-text antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
