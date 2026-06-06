import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';

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
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a]">
      <div className="relative bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl p-8 w-full max-w-sm space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M2 12h2l2-6 3 12 3-8 2 4 2-2h6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Seismic Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time earthquakes · INGV + Rayfin</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-950/60 border border-red-800/60 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {isFabricDeployment ? (
          <button
            onClick={signInWithFabric}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 transition-all shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 8A6 6 0 1 1 8 2" strokeLinecap="round" />
              </svg>
            ) : (
              <img
                src="https://res.cdn.office.net/officehub/images/content/images/microsoft-azure-3dde5e0c85.svg"
                alt="Microsoft"
                className="h-4 w-4"
              />
            )}
            Sign in with Microsoft Fabric
          </button>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              signInWithPassword(email, password);
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-700 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-700 transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 text-sm transition-all shadow-lg shadow-indigo-500/20 mt-1"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="text-center text-xs text-slate-600">
              Local dev mode ·{' '}
              <code className="font-mono text-slate-500">rayfin dev --local</code>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
