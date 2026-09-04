import type { Metadata } from 'next';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Merchant Reconciliation Dashboard',
  description:
    'Monitor payment volume, settlement health, payout mismatches, and reconciliation exceptions.',
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