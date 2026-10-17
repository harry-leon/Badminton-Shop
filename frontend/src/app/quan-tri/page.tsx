import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export default async function QuanTriRedirectPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/dang-nhap?redirect=/portal/inventory');
  }

  const user = verifySessionToken(token);
  if (!user) {
    redirect('/dang-nhap?redirect=/portal/inventory');
  }

  if (user.role === 'CUSTOMER') {
    redirect('/403');
  }

  redirect('/portal/inventory');
}
