import { entity, role, uuid, text, int, decimal } from '@microsoft/rayfin-core';

/**
 * Represents a seismic event ingested from the INGV FDSN API.
 * Only authenticated users can read/write earthquake records.
 */
@entity()
@role('authenticated', '*')
export class Earthquake {
  /** Rayfin primary key (auto-generated UUID) */
  @uuid() id!: string;

  /** INGV event identifier — used for deduplication */
  @int() eventId!: number;

  /** ISO 8601 origin time of the earthquake */
  @text() time!: string;

  /** Richter / local magnitude value */
  @decimal() magnitude!: number;

  /** Magnitude type code (ML, Mw, Md, …) */
  @text() magType!: string;

  /** Human-readable place description from INGV */
  @text() place!: string;

  /** WGS-84 latitude in decimal degrees */
  @decimal() latitude!: number;

  /** WGS-84 longitude in decimal degrees */
  @decimal() longitude!: number;

  /** Hypocentral depth in kilometres */
  @decimal() depth!: number;

  /** Survey / institution that published the event */
  @text() author!: string;

  /** Author of the magnitude estimate (may be empty) */
  @text({ optional: true }) magAuthor?: string;

  /** Event type (earthquake, quarry blast, …) */
  @text() quakeType!: string;
}
