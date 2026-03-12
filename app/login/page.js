'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const PENDING_AGENCY_NAME_KEY = 'pending_agency_name';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMessage(params.get('message') || '');
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    const agencyNameFallback = localStorage.getItem(PENDING_AGENCY_NAME_KEY) || '';

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        agency_name_fallback: agencyNameFallback
      })
    });

    const json = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(json.error || 'Login failed');
      return;
    }

    if (json.usedAgencyNameFallback) {
      localStorage.removeItem(PENDING_AGENCY_NAME_KEY);
    }

    router.push(json.redirectTo || '/listings');
  }

  return (
    <div className="card" style={{ maxWidth: 480, margin: '1rem auto' }}>
      <h1>Log in</h1>
      {error ? <p className="alert">{error}</p> : null}
      {message ? <p className="alert success">{decodeURIComponent(message)}</p> : null}
      <form className="grid" onSubmit={handleSubmit}>
        <label>
          Email
          <input required type="email" name="email" placeholder="you@agency.com" />
        </label>
        <label>
          Password
          <input required type="password" name="password" placeholder="Your password" />
        </label>
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="small">
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </div>
  );
}
