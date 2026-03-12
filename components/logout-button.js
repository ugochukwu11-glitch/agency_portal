'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function LogoutButton({ className = 'nav-pill nav-pill-logout', label = 'Logout' }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    await fetch('/logout', { method: 'GET', cache: 'no-store' });
    router.replace('/login?message=Logged%20out');
    router.refresh();
  }

  return (
    <button className={className} type="button" onClick={handleLogout}>
      {label}
    </button>
  );
}
