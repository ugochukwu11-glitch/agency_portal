import Link from 'next/link';
import './globals.css';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Agency Portal',
  description: 'Self-serve property portal for agencies'
};

export default async function RootLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <strong>Agency Portal</strong>
            <div className="nav-links">
              {user ? (
                <>
                  <Link className="nav-pill" href="/listings">
                    My Listings
                  </Link>
                  <Link className="nav-pill" href="/listings/new">
                    New Listing
                  </Link>
                  <Link className="nav-pill" href="/agents">
                    Agents
                  </Link>
                  <Link className="nav-pill" href="/leads">
                    Leads
                  </Link>
                  <Link className="nav-pill" href="/onboarding">
                    Onboarding
                  </Link>
                  <Link className="nav-pill nav-pill-logout" href="/logout">
                    Logout
                  </Link>
                </>
              ) : (
                <>
                  <Link className="nav-pill" href="/login">
                    Login
                  </Link>
                  <Link className="nav-pill" href="/signup">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
