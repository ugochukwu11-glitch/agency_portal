'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const PENDING_AGENCY_NAME_KEY = 'pending_agency_name';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const formData = new FormData(event.currentTarget);
    const agencyName = String(formData.get('agency_name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    if (!agencyName || !email || !password) {
      setError('Agency name, email, and password are required.');
      return;
    }

    setIsSubmitting(true);
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agency_name: agencyName,
        email,
        password
      })
    });

    const json = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(json.error || 'Signup failed');
      return;
    }

    if (json.requiresEmailVerification) {
      // No session exists before verification, so keep the intended agency
      // name client-side and apply it immediately after first verified login.
      localStorage.setItem(PENDING_AGENCY_NAME_KEY, agencyName);
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      return;
    }

    router.push(json.redirectTo || '/listings');
  }

  return (
    <div className="card" style={{ maxWidth: 480, margin: '1rem auto' }}>
      <h1>Sign up</h1>
      {error ? <p className="alert">{error}</p> : null}
      <form className="grid" onSubmit={handleSubmit}>
        <label>
          Agency name
          <input required name="agency_name" maxLength={120} placeholder="Acme Homes" />
        </label>
        <label>
          Email
          <input required type="email" name="email" placeholder="you@agency.com" />
        </label>
        <label>
          Password
          <input required minLength={6} type="password" name="password" placeholder="At least 6 chars" />
        </label>
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating...' : 'Create account'}
        </button>
      </form>
      <p className="small">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
