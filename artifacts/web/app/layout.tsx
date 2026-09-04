import type { Metadata } from 'next';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Settley — Smart Merchant Reconciliation',
  description:
    'Settley — Smart Merchant Reconciliation for payment links, settlements, and transaction health.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}