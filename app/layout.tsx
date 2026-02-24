import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'biyo - ブロックでおんがくをつくろう！',
  description: 'ブロックをくみあわせて おんがくをつくれるアプリだよ！',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'biyo',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#FFF8F0" />
      </head>
      <body>
        <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />
        {/* Skip navigation link for keyboard users (CSS-only, no JS event handlers needed in server component) */}
        <a href="#main-content" className="skip-nav">
          メインへスキップ
        </a>
        {children}
      </body>
    </html>
  );
}
