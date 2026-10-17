import * as React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompareProvider } from '@/lib/compare-context';
import { CartProvider } from '@/lib/cart-context';
import { FloatingCompareBar } from '@/components/FloatingCompareBar';
import { FloatingContactWidget } from '@/components/FloatingContactWidget';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <CompareProvider>
        <div className="min-h-screen flex flex-col bg-bg text-ink">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <FloatingCompareBar />
          <FloatingContactWidget />
        </div>
      </CompareProvider>
    </CartProvider>
  );
}

