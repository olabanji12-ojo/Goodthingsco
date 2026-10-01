import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function AdminLoginPage() {
  const { user, isAuthorizedAdmin, login, authError, clearError } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // If already logged in as authorized admin, redirect to target or /admin
  useEffect(() => {
    if (user && isAuthorizedAdmin) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [user, isAuthorizedAdmin, navigate, location]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Please enter both your administrator email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Top Accent Strip */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #c5a880, #e2d2ba, #c5a880)' }} />

        <div style={{ padding: '36px 32px' }}>
          {/* Brand & Title */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(197, 168, 128, 0.15)',
                border: '1px solid rgba(197, 168, 128, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c5a880',
                marginBottom: '16px',
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
              Good Things Co.
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
              Atelier Management & Product Control
            </p>
          </div>

          {/* Error Banner */}
          {(localError || authError) && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{localError || authError}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label
                htmlFor="admin-email"
                style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}
              >
                Administrator Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@goodthingsco.com"
                  autoComplete="email"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#c5a880')}
                  onBlur={(e) => (e.target.style.borderColor = '#334155')}
                />
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 40px',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#c5a880')}
                  onBlur={(e) => (e.target.style.borderColor = '#334155')}
                />
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              disabled={submitting}
              style={{
                marginTop: '8px',
                padding: '13px 20px',
                borderRadius: '8px',
                backgroundColor: submitting ? '#94a3b8' : '#c5a880',
                color: '#0f172a',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                letterSpacing: '0.02em',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {submitting ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Quick Credential Shortcut */}
          <div
            style={{
              marginTop: '20px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(197, 168, 128, 0.1)',
              border: '1px solid rgba(197, 168, 128, 0.25)',
              fontSize: '12px',
              color: '#e2d2ba',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>Atelier Access Credentials:</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('patrick@renda.co');
                  setPassword('tofunmie');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c5a880',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Auto-Fill
              </button>
            </div>
            <div>
              Email: <strong style={{ color: '#ffffff' }}>patrick@renda.co</strong>
            </div>
            <div>
              Password: <strong style={{ color: '#ffffff' }}>tofunmie</strong>
            </div>
          </div>

          {/* Security Notice */}
          <div
            style={{
              marginTop: '16px',
              padding: '14px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '12px',
              color: '#94a3b8',
              lineHeight: '1.5',
            }}
          >
            <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
              🔒 Protected Portal
            </div>
            This dashboard is restricted to authorized Good Things Co. team members. All login activity is secured via Firebase Authentication.
          </div>
        </div>
      </div>
    </div>
  );
}
