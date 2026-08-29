import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';

const sans = DM_Sans({ variable: '--font-sans', subsets: ['latin'] });
const serif = Cormorant_Garamond({ variable: '--font-serif', subsets: ['latin'], weight: ['500', '600'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://quantifying-reality.rhyslindmark.chatgpt.site'),
  title: 'Quantifying Reality — A public atlas of measurable history',
  description: 'Evidence, estimates, and uncertainty about how humans have lived—from the first cities to today.',
  openGraph: {
    title: 'Quantifying Reality',
    description: 'A public atlas of measurable history.',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'Quantifying Reality — A public atlas of measurable history' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quantifying Reality',
    description: 'A public atlas of measurable history.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
