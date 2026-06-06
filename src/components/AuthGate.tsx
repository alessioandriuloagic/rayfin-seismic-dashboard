import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';

/**
 * Renders a sign-in gate:
 *   - Fabric deployed → single "Sign in with Fabric" button
 *   - Local dev        → email / password form
 * Once authenticated it renders children.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isFabricDeployment,
    loading,
    error,
    signInWithFabric,
    signInWithPassword,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm space-y-6">
        {/* Logo / title */}
        <div className="text-center">
          <span className="text-4xl">🌍</span>
          <h1 className="mt-2 text-2xl font-bold text-white">Seismic Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time earthquakes · Powered by Rayfin + INGV
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {isFabricDeployment ? (
          /* ── Fabric SSO button ── */
          <button
            onClick={signInWithFabric}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 transition"
          >
            {loading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <img
                src="https://res.cdn.office.net/officehub/images/content/images/microsoft-azure-3dde5e0c85.svg"
                alt="Microsoft"
                className="h-5 w-5"
              />
            )}
            Sign in with Fabric
          </button>
        ) : (
          /* ── Local dev email/password ── */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              signInWithPassword(email, password);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 transition"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="text-center text-xs text-slate-500">
              Local dev mode — use the credentials you registered with{' '}
              <code className="font-mono text-slate-400">rayfin dev --local</code>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
