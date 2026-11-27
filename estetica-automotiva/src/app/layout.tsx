import type { Metadata, Viewport } from 'next';
import { Archivo, Geist, Geist_Mono } from 'next/font/google';
import { site, services, asset } from '@/lib/site';
import './globals.css';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

const title = `${site.fullName} | Estética automotiva premium e lava-jato`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url + '/'),
  title,
  description: site.description,
  keywords: [
    'estética automotiva',
    'lava-jato',
    'lavacar',
    'lavagem detalhada',
    'polimento técnico',
    'vitrificação de pintura',
    'higienização interna',
    site.address.city,
  ],
  alternates: { canonical: './' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: site.fullName,
    title,
    description: site.description,
    images: [{ url: asset('/media/hero-poster.webp'), width: 1920, height: 1080, alt: site.fullName }],
  },
  twitter: { card: 'summary_large_image', title, description: site.description },
  icons: { icon: asset('/brand/icon.png'), apple: asset('/brand/icon.png') },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
};

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AutoWash',
  name: site.fullName,
  description: site.description,
  url: site.url,
  image: `${site.url}/media/hero-poster.webp`,
  logo: `${site.url}/brand/logo.png`,
  telephone: `+${site.whatsapp}`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    postalCode: site.address.zip,
    addressCountry: 'BR',
  },
  openingHoursSpecification: site.hours
    .filter((h) => h.open !== null)
    .map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: days[h.day],
      opens: `${String(h.open).padStart(2, '0')}:00`,
      closes: `${String(h.close).padStart(2, '0')}:00`,
    })),
  sameAs: [`https://instagram.com/${site.instagram}`],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Serviços',
    itemListElement: services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, description: s.description } })),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${geist.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preload" href={asset('/models/car.glb')} as="fetch" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
