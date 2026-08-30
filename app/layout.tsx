import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';

const sans = DM_Sans({ variable: '--font-sans', subsets: ['latin'] });
const serif = Cormorant_Garamond({ variable: '--font-serif', subsets: ['latin'], weight: ['500', '600'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://visualizing-reality.rhyslindmark.chatgpt.site'),
  title: { default: 'How Everything Evolved', template: '%s — How Everything Evolved' },
  description: 'An opinionated, visual-first, source-traceable atlas of pre-industrial history.',
  openGraph: {
    title: 'How Everything Evolved',
    description: 'History as systems you can see.',
    images: [{ url: '/og.png', width: 1730, height: 909, alt: 'How Everything Evolved — a visual atlas of history' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How Everything Evolved',
    description: 'An opinionated, visual-first atlas of pre-industrial history.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
