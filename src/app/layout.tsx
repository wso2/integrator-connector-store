import type { Metadata } from 'next';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'WSO2 Integrator Connector Store',
  description: 'Discover and integrate with 100+ pre-built Ballerina connectors for popular services and platforms.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
