export default async function VerifyEmailPage({ searchParams }) {
  const params = await searchParams;
  const email = params?.email ? decodeURIComponent(params.email) : '';

  return (
    <div className="card" style={{ maxWidth: 560, margin: '1rem auto' }}>
      <h1>Verify your email</h1>
      <p className="small">
        We sent a verification link{email ? ` to ${email}` : ''}. Please verify your email, then return to login.
      </p>
      <a className="btn" href="/login">
        Go to login
      </a>
    </div>
  );
}
