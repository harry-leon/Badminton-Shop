import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Smash Court Design System',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isDev) {
    const cookieStore = await cookies();
    const adminRole = cookieStore.get('smash_admin_role')?.value;
    const isAuthorized = adminRole === 'ADMIN' || adminRole === 'BRANCH_MANAGER';

    if (!isAuthorized) {
      notFound();
    }
  }

  return <>{children}</>;
}
