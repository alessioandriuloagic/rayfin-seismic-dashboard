import { RayfinClient } from '@microsoft/rayfin-client';
import type { SeismicSchema } from '../../rayfin/data/schema.js';

/**
 * Singleton Rayfin client shared across the entire application.
 *
 * Environment variables (set by rayfin up / rayfin dev):
 *   VITE_RAYFIN_API_URL        – backend base URL
 *   VITE_RAYFIN_PUBLISHABLE_KEY – publishable key for client auth
 */
export const client = new RayfinClient<SeismicSchema>({
  baseUrl: import.meta.env.VITE_RAYFIN_API_URL ?? 'http://localhost:5168',
  publishableKey: import.meta.env.VITE_RAYFIN_PUBLISHABLE_KEY ?? '',
});
