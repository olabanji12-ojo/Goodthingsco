import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
export default function AdminLoginPage() {
  const { login, isAuthorizedAdmin, loading, authError } = useAdminAuth();
  const location = useLocation();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
  if (!loading && isAuthorizedAdmin) return <Navigate to={from?.startsWith('/admin') ? from : '/admin'} replace />;
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try { await login(email, password); } catch { /* displayed by context */ } finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
      <p className="text-xs tracking-[0.2em] text-slate-500 mb-8">GOOD THINGS CO.</p>
      <LockKeyhole className="text-amber-700 mb-4" size={28} />
      <h1 className="text-3xl font-serif text-slate-900">Welcome back</h1>
      <p className="text-slate-500 mt-2 mb-6">Sign in to your admin workspace.</p>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm text-slate-700">Email<input type="email" autoComplete="username" required className="mt-1 w-full rounded-lg border p-3" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="block text-sm text-slate-700">Password<input type="password" autoComplete="current-password" required className="mt-1 w-full rounded-lg border p-3" value={password} onChange={e => setPassword(e.target.value)} /></label>
        {authError && <p role="alert" className="text-sm text-red-700">{authError}</p>}
        <button disabled={busy || loading} className="w-full rounded-lg bg-slate-900 p-3 text-white disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="text-xs text-slate-500 mt-5">Administrator access is granted by the store owner.</p>
      <Link to="/" className="inline-block text-sm underline mt-6">Return to the store</Link>
    </div>
  </main>;
}
