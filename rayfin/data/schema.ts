import type { Earthquake } from './Earthquake.js';

/**
 * Maps every entity name to its TypeScript class.
 * The RayfinClient generic uses this type to provide
 * typed access to client.data.<EntityName>.
 */
export type SeismicSchema = {
  Earthquake: Earthquake;
};
