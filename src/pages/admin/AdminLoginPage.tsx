import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function AdminLoginPage() {
  const { user, isAuthorizedAdmin, login, signup, authError, clearError } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already logged in as authorized admin, redirect to target or /admin
  useEffect(() => {
    if (user && isAuthorizedAdmin) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [user, isAuthorizedAdmin, navigate, location]);

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setLocalError(null);
    setSuccessMessage(null);
    clearError();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setLocalError('Please enter an administrator email address.');
      return;
    }

    if (!password) {
      setLocalError('Please enter a password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long (Firebase requirement).');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match. Please verify both password fields.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await signup(cleanEmail, password);
        setSuccessMessage('Account created successfully! Connecting to Atelier Dashboard...');
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 800);
      } else {
        await login(cleanEmail, password);
        navigate('/admin', { replace: true });
      }
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const isEmailAlreadyInUse =
    (localError && localError.includes('already registered')) ||
    (authError && authError.includes('already registered'));

  const isUserNotFoundOrInvalid =
    (localError && (localError.includes('Invalid email') || localError.includes('No administrator account'))) ||
    (authError && (authError.includes('Invalid email') || authError.includes('No administrator account')));

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
          maxWidth: '460px',
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
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              backgroundColor: '#0f172a',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <button
              id="tab-signin"
              type="button"
              onClick={() => switchMode('signin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: mode === 'signin' ? '#1e293b' : 'transparent',
                color: mode === 'signin' ? '#c5a880' : '#94a3b8',
                fontWeight: mode === 'signin' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: mode === 'signin' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
              }}
            >
              <LogIn size={15} />
              Sign In
            </button>
            <button
              id="tab-signup"
              type="button"
              onClick={() => switchMode('signup')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: mode === 'signup' ? '#1e293b' : 'transparent',
                color: mode === 'signup' ? '#c5a880' : '#94a3b8',
                fontWeight: mode === 'signup' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: mode === 'signup' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
              }}
            >
              <UserPlus size={15} />
              Create Account
            </button>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                color: '#86efac',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div>{successMessage}</div>
            </div>
          )}

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
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{localError || authError}</div>
              </div>

              {/* Helpful inline action if wrong tab */}
              {isUserNotFoundOrInvalid && mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: 'none',
                    color: '#c5a880',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: '2px 0 0 28px',
                  }}
                >
                  Click here to switch to "Create Account" →
                </button>
              )}

              {isEmailAlreadyInUse && mode === 'signup' && (
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: 'none',
                    color: '#c5a880',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: '2px 0 0 28px',
                  }}
                >
                  Click here to switch to "Sign In" →
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Email Field */}
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
                  placeholder="patrick@renda.co"
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

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label
                  htmlFor="admin-password"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1' }}
                >
                  {mode === 'signup' ? 'Create Password' : 'Password'}
                </label>
                {mode === 'signup' && (
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Min 6 characters</span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••••••'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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

            {/* Confirm Password Field (Only for Sign Up) */}
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="admin-confirm-password"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}
                >
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="admin-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {mode === 'signin' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                <button
                  id="admin-login-submit"
                  type="submit"
                  disabled={submitting}
                  style={{
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

                <button
                  id="admin-create-account-switch"
                  type="button"
                  onClick={() => switchMode('signup')}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(197, 168, 128, 0.1)',
                    color: '#c5a880',
                    border: '1px solid rgba(197, 168, 128, 0.4)',
                    fontWeight: 600,
                    fontSize: '13px',
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <UserPlus size={16} />
                  Create New Administrator Account
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                <button
                  id="admin-create-account-submit"
                  type="submit"
                  disabled={submitting}
                  style={{
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
                  {submitting ? 'Registering Account...' : 'Create Administrator Account'}
                </button>

                <button
                  id="admin-back-to-signin"
                  type="button"
                  onClick={() => switchMode('signin')}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontWeight: 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <LogIn size={16} />
                  Back to Sign In
                </button>
              </div>
            )}
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
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                {mode === 'signup' ? 'Recommended Admin Registration:' : 'Atelier Access Credentials:'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail('patrick@renda.co');
                  setPassword('tofunmie');
                  if (mode === 'signup') {
                    setConfirmPassword('tofunmie');
                  }
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

          {/* Mode toggle prompt below */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            {mode === 'signin' ? (
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                Need to register your administrator email?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c5a880',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                Already registered in Firebase?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c5a880',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '12px',
              color: '#94a3b8',
              lineHeight: '1.5',
            }}
          >
            <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '3px' }}>
              🔒 Protected Atelier Portal
            </div>
            {mode === 'signup'
              ? 'Creating an account registers your email and password directly into your Firebase Authentication database and establishes your administrator session.'
              : 'This dashboard is restricted to authorized Good Things Co. team members. All login activity is secured via Firebase Authentication.'}
          </div>
        </div>
      </div>
    </div>
  );
}
