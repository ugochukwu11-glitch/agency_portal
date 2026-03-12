'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import LogoutButton from '@/components/logout-button';

export default function AuthNav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  function isActive(href) {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    const supabase = createClient();

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setIsAuthenticated(Boolean(data?.session?.user));
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setIsAuthenticated(Boolean(data?.user));
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated) {
    return (
      <>
        <Link className={`nav-pill ${isActive('/listings') ? 'nav-pill-active' : ''}`} href="/listings">
          My Listings
        </Link>
        <Link className={`nav-pill ${isActive('/listings/new') ? 'nav-pill-active' : ''}`} href="/listings/new">
          New Listing
        </Link>
        <Link className={`nav-pill ${isActive('/agents') ? 'nav-pill-active' : ''}`} href="/agents">
          Agents
        </Link>
        <Link className={`nav-pill ${isActive('/leads') ? 'nav-pill-active' : ''}`} href="/leads">
          Leads
        </Link>
        <Link className={`nav-pill ${isActive('/onboarding') ? 'nav-pill-active' : ''}`} href="/onboarding">
          Onboarding
        </Link>
        <LogoutButton />
      </>
    );
  }

  return (
    <>
      <Link className="nav-pill" href="/login">
        Login
      </Link>
      <Link className="nav-pill" href="/signup">
        Sign up
      </Link>
    </>
  );
}
