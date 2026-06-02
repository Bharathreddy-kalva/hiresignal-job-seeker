import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* LEFT PANEL */}
      <div style={{
        width: '50%',
        position: 'relative',
        backgroundImage: 'url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2rem',
      }}>
        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(30,58,95,0.80) 100%)',
          zIndex: 1,
        }} />

        {/* Top logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ color: 'white', fontSize: '1.75rem', fontWeight: 700 }}>HS.</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>HireSignal</div>
        </div>

        {/* Center text */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{
            color: 'white', fontSize: '2.5rem', fontWeight: 700,
            lineHeight: 1.2, marginBottom: '1rem', maxWidth: '400px',
          }}>
            Know which companies are worth applying to.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
            Real-time signals from GitHub, job boards &amp; news
          </p>
        </div>

        {/* Bottom copyright */}
        <div style={{
          position: 'relative', zIndex: 2,
          color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem',
        }}>
          © 2026 HireSignal · Built by Bharath Reddy Kalva
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        width: '50%',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ color: '#2563eb', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            HS.
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
            Log in to HireSignal
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Access your account to analyze companies and get hiring signals.
          </p>

          <SignIn
            routing="path"
            path="/sign-in"
            afterSignInUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: '#2563eb',
                fontFamily: 'Inter, system-ui, sans-serif',
                borderRadius: '8px',
              },
              elements: {
                rootBox:        { width: '100%' },
                card:           { boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', width: '100%' },
                headerTitle:    { display: 'none' },
                headerSubtitle: { display: 'none' },
                logoBox:        { display: 'none' },
              },
            }}
          />

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <a href="/sign-up" style={{ color: '#2563eb', fontWeight: 500 }}>
              Sign up free →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
