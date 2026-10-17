import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
});

export const metadata: Metadata = {
  title: 'Smash Court — Hệ thống cầu lông chính hãng & Sàn kiểm định vợt cũ',
  description: 'Chuyên cung cấp vợt cầu lông Yonex, Lining, Victor chính hãng và sàn giao dịch vợt cũ second-hand có kiểm định 16 tiêu chuẩn độc lập.',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Smash Court — Hệ thống cầu lông chuyên nghiệp',
    description: 'Vợt chính hãng, bảo hành khung 12 tháng, thu mua kiểm định A/B/C.',
    locale: 'vi_VN',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/images/logo-shuttlecock-green-transparent.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/images/logo-shuttlecock-green-transparent.png',
    apple: '/images/logo-shuttlecock-green-transparent.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={beVietnamPro.variable}>
      <body className="min-h-screen flex flex-col font-sans antialiased bg-bg text-ink">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
