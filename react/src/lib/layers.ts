/** Overlay layer metadata for React map toggles (city sustainability labels). */

import { LAYER_KEYS, type LayerKey } from './url-state';

export type OverlayKind = 'point' | 'line';

export interface OverlayDef {
  key: LayerKey;
  label: string;
  kind: OverlayKind;
  /** Accent for empty-source visibility indicator in UI */
  color: string;
}

const LABELS: Partial<Record<LayerKey, { label: string; kind: OverlayKind; color: string }>> = {
  conflicts: { label: 'Conflict Zones', kind: 'point', color: '#c62828' },
  bases: { label: 'Military Bases', kind: 'point', color: '#1565c0' },
  cables: { label: 'Undersea Cables', kind: 'line', color: '#00838f' },
  pipelines: { label: 'Energy Grids', kind: 'line', color: '#6a1b9a' },
  hotspots: { label: 'Intel Hotspots', kind: 'point', color: '#ef6c00' },
  convoHotspots: { label: 'Convo Hotspots', kind: 'point', color: '#c62828' },
  aiUsage: { label: 'AI Usage', kind: 'point', color: '#1565c0' },
  aiPolicy: { label: 'AI Policy', kind: 'point', color: '#5e35b1' },
  nuclear: { label: 'Nuclear Sites', kind: 'point', color: '#f9a825' },
  irradiators: { label: 'Gamma Irradiators', kind: 'point', color: '#ff8f00' },
  ais: { label: 'Logistics Traffic', kind: 'point', color: '#0277bd' },
  military: { label: 'Military', kind: 'point', color: '#37474f' },
  protests: { label: 'Protests', kind: 'point', color: '#ad1457' },
  sanctions: { label: 'Sanctions', kind: 'point', color: '#455a64' },
  weather: { label: 'Weather', kind: 'point', color: '#0288d1' },
  natural: { label: 'Biosphere Hazards', kind: 'point', color: '#558b2f' },
  outages: { label: 'Grid Outages', kind: 'point', color: '#bf360c' },
  cyberThreats: { label: 'Cyber Threats', kind: 'point', color: '#6a1b9a' },
  datacenters: { label: 'Compute Hubs', kind: 'point', color: '#283593' },
  waterways: { label: 'Chokepoints', kind: 'line', color: '#00695c' },
  tradeRoutes: { label: 'Transport Corridors', kind: 'line', color: '#4527a0' },
  fires: { label: 'Fire Risk', kind: 'point', color: '#d84315' },
  ucdpEvents: { label: 'UCDP Events', kind: 'point', color: '#b71c1c' },
  iranAttacks: { label: 'Iran Attacks', kind: 'point', color: '#c62828' },
  ciiChoropleth: { label: 'CII Choropleth', kind: 'point', color: '#5d4037' },
  stockExchanges: { label: 'Stock Exchanges', kind: 'point', color: '#2e7d32' },
  financialCenters: { label: 'Financial Centers', kind: 'point', color: '#1b5e20' },
  centralBanks: { label: 'Central Banks', kind: 'point', color: '#33691e' },
  commodityHubs: { label: 'Commodity Hubs', kind: 'point', color: '#827717' },
  commodityPorts: { label: 'Logistics Ports', kind: 'point', color: '#f57f17' },
  storageFacilities: { label: 'Grid Storage', kind: 'point', color: '#e65100' },
  fuelShortages: { label: 'Fuel Shortages', kind: 'point', color: '#ff6f00' },
  liveTankers: { label: 'Live Tankers', kind: 'point', color: '#01579b' },
  startupHubs: { label: 'Maker Hubs', kind: 'point', color: '#00695c' },
  techHQs: { label: 'Capability HQs', kind: 'point', color: '#004d40' },
  techEvents: { label: 'Tech Events', kind: 'point', color: '#00796b' },
  cloudRegions: { label: 'Cloud Regions', kind: 'point', color: '#00838f' },
  accelerators: { label: 'Accelerators', kind: 'point', color: '#b47800' },
  positiveEvents: { label: 'Civic Progress', kind: 'point', color: '#43a047' },
  happiness: { label: 'Wellbeing', kind: 'point', color: '#7cb342' },
  speciesRecovery: { label: 'Rewilding', kind: 'point', color: '#558b2f' },
  renewableInstallations: { label: 'Renewables', kind: 'point', color: '#2e7d32' },
  webcams: { label: 'Webcams', kind: 'point', color: '#546e7a' },
  minerals: { label: 'Circular Materials', kind: 'point', color: '#795548' },
  spaceports: { label: 'Spaceports', kind: 'point', color: '#37474f' },
  flights: { label: 'Flights', kind: 'point', color: '#0277bd' },
  economic: { label: 'Urban Cores', kind: 'point', color: '#1565c0' },
  displacement: { label: 'Displacement', kind: 'point', color: '#6d4c41' },
  satellites: { label: 'Satellites', kind: 'point', color: '#4527a0' },
  gulfInvestments: { label: 'Gulf Investments', kind: 'point', color: '#00838f' },
  resilienceScore: { label: 'Biophysical Resilience', kind: 'point', color: '#00695c' },
  kindness: { label: 'Community Care', kind: 'point', color: '#66bb6a' },
};

/**
 * Primary overlays for city sustainability, sorted by Product objects:
 * Human Horizon → Capital→Capability → Develop/Optimise/Preserve →
 * Useful Societal Capability → Biophysical Floor.
 */
export const PRIMARY_OVERLAY_KEYS: LayerKey[] = [
  // A Human Horizon
  'happiness',
  'positiveEvents',
  'kindness',
  'economic',
  // B Capital → Capability
  'renewableInstallations',
  'datacenters',
  'cloudRegions',
  'minerals',
  'storageFacilities',
  'pipelines',
  // C Develop / Optimise / Preserve
  'commodityPorts',
  'startupHubs',
  'accelerators',
  'techHQs',
  'tradeRoutes',
  'ais',
  'speciesRecovery',
  'natural',
  'fires',
  // D Useful Societal Capability
  'waterways',
  'outages',
  'techEvents',
  // E Biophysical Floor
  'resilienceScore',
];

export function getOverlayDef(key: LayerKey): OverlayDef {
  const meta = LABELS[key] ?? { label: key, kind: 'point' as const, color: '#607d8b' };
  return { key, label: meta.label, kind: meta.kind, color: meta.color };
}

export function listPrimaryOverlays(): OverlayDef[] {
  return PRIMARY_OVERLAY_KEYS.map(getOverlayDef);
}

export function listAllOverlays(): OverlayDef[] {
  return LAYER_KEYS.map(getOverlayDef);
}

export const EMPTY_FEATURE_COLLECTION = {
  type: 'FeatureCollection' as const,
  features: [] as Array<never>,
};
