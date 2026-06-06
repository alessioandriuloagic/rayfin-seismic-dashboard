import { useState, useEffect, useCallback } from 'react';
import { ensureSignedInWithFabric } from '@microsoft/rayfin-auth-provider-fabric';
import { client } from '../lib/rayfin.js';

const fabricOptions = {
  workspaceId: import.meta.env.VITE_FABRIC_WORKSPACE_ID ?? '',
  projectId: import.meta.env.VITE_FABRIC_ITEM_ID ?? '',
  fabricPortalUrl:
    import.meta.env.VITE_FABRIC_PORTAL_URL ?? 'https://app.fabric.microsoft.com',
  returnOrigin: typeof window !== 'undefined' ? window.location.origin : '',
};

/** True when deployed to Fabric (env vars are set by rayfin up) */
const isFabricDeployment = Boolean(import.meta.env.VITE_FABRIC_ITEM_ID);

export interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
}

/**
 * Dual-mode auth hook:
 *   - Fabric deployment → Entra ID SSO via ensureSignedInWithFabric
 *   - Local dev          → email / password via client.auth.signIn
 */
export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: client.auth.getSession()?.isAuthenticated ?? false,
    email: client.auth.getSession()?.user?.email ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Keep auth state in sync with session changes
  useEffect(() => {
    const unsub = client.auth.onSessionChange((session) => {
      setAuth({
        isAuthenticated: session?.isAuthenticated ?? false,
        email: session?.user?.email ?? null,
      });
    });
    return unsub;
  }, []);

  /** Fabric SSO – must be called from a synchronous user-gesture handler */
  const signInWithFabric = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureSignedInWithFabric(client.auth, fabricOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  /** Local dev – email + password */
  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        await client.auth.signIn({ email, password });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    await client.auth.signOut();
  }, []);

  return {
    ...auth,
    isFabricDeployment,
    loading,
    error,
    signInWithFabric,
    signInWithPassword,
    signOut,
  };
}
