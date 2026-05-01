import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/lib/cartContext';
import PublicLayout from '@/components/PublicLayout';
import MidtransScript from '@/components/MidtransScript';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Wahyu Vape Store',
  description: 'Premium vape store - devices, liquids, accessories, and disposables',
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <CartProvider>
          <PublicLayout>{children}</PublicLayout>
        </CartProvider>
        <MidtransScript />
      </body>
    </html>
  );
}
