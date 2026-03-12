import Link from 'next/link';
import './globals.css';
import AuthNav from '@/components/auth-nav';

export const metadata = {
  title: 'Agency Portal',
  description: 'Self-serve property portal for agencies'
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <Link className="nav-brand" href="/" aria-label="Go to homepage">
              Agency Portal
            </Link>
            <div className="nav-links">
              <AuthNav />
            </div>
          </div>
        </nav>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
