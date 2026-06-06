import { useEffect } from 'react';
import { initEmbeddedAuth } from '@microsoft/rayfin-auth-provider-fabric';
import { client } from './lib/rayfin.js';
import { AuthGate } from './components/AuthGate.js';
import { Dashboard } from './components/Dashboard.js';

const fabricOptions = {
  workspaceId: import.meta.env.VITE_FABRIC_WORKSPACE_ID ?? '',
  projectId: import.meta.env.VITE_FABRIC_ITEM_ID ?? '',
  fabricPortalUrl:
    import.meta.env.VITE_FABRIC_PORTAL_URL ?? 'https://app.fabric.microsoft.com',
  returnOrigin: window.location.origin,
};

/**
 * Attempt silent embedded auth on load (for Fabric iframe context).
 * Falls back to the AuthGate sign-in UI for the popup / password flow.
 */
initEmbeddedAuth(client.auth, fabricOptions).catch(() => {
  // Not in embedded mode — AuthGate will handle sign-in
});

export default function App() {
  useEffect(() => {
    document.title = 'Seismic Dashboard · Rayfin';
  }, []);

  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
