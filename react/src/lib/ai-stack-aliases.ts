/**
 * Spatial Cycle — city sustainability overlays ordered by Product objects
 * (cited World Monitor geo only; missing series stay blank).
 *
 * From The Next Production Cycle Product page + spatial paper:
 *   A Human Horizon              → ownership, reduced labour, agency
 *   B Capital → Capability       → capital directed into capability
 *   C Develop / Optimise / Preserve → the three vectors of the cycle
 *   D Useful Societal Capability → the outcome
 *   E Biophysical Floor          → the hard bound
 *
 * Era seek via TimeNav sets timeFocus only. Historical paint still uses cited
 * open dates where they exist (datacenters / accelerators / techEvents).
 */

import {
  AI_ERA_GROWTH_LAYER_KEYS,
  growthFlagsForEraSeek,
  type EraVisibilityCatalogs,
} from '@/config/ai-era-visibility';
import type { LayerKey, LayerMap } from './url-state';
import { emptyLayers } from './url-state';

export type AiFootprintAliasId =
  | 'horizon'
  | 'capital'
  | 'vectors'
  | 'capability'
  | 'floor';

export type AiFootprintAlias = {
  id: AiFootprintAliasId;
  /** Plan section letter for drawer copy */
  section: 'A' | 'B' | 'C' | 'D' | 'E';
  label: string;
  description: string;
  layerKeys: readonly LayerKey[];
};

/** A–E Product-object aliases onto existing DeckGL density layers. */
export const AI_FOOTPRINT_ALIASES: readonly AiFootprintAlias[] = [
  {
    id: 'horizon',
    section: 'A',
    label: 'Human Horizon',
    description: 'Ownership, reduced labour, and agency — wellbeing and civic progress',
    layerKeys: ['happiness', 'positiveEvents', 'kindness', 'economic'],
  },
  {
    id: 'capital',
    section: 'B',
    label: 'Capital → Capability',
    description: 'Capital into capability — renewables, compute, materials, grid storage',
    layerKeys: [
      'renewableInstallations',
      'datacenters',
      'cloudRegions',
      'minerals',
      'storageFacilities',
      'pipelines',
    ],
  },
  {
    id: 'vectors',
    section: 'C',
    label: 'Develop / Optimise / Preserve',
    description:
      'Cycle vectors — new hubs, urban refactoring, ecological containment',
    layerKeys: [
      'commodityPorts',
      'startupHubs',
      'accelerators',
      'techHQs',
      'tradeRoutes',
      'ais',
      'speciesRecovery',
      'natural',
      'fires',
    ],
  },
  {
    id: 'capability',
    section: 'D',
    label: 'Useful Societal Capability',
    description: 'Outcome — corridors, chokepoints, grid status, delivered services',
    layerKeys: ['waterways', 'outages', 'techEvents'],
  },
  {
    id: 'floor',
    section: 'E',
    label: 'Biophysical Floor',
    description: 'Hard bound — ecological carrying capacity and resilience',
    layerKeys: ['resilienceScore'],
  },
];

/**
 * City sustainability map layers (drawer + Overlays), sorted by Product object.
 * Growth over scrubber: see @/config/ai-era-visibility for dated infra layers.
 */
export const AI_FOOTPRINT_LAYER_KEYS: readonly LayerKey[] = [
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

export function isAliasActive(alias: AiFootprintAlias, layers: LayerMap): boolean {
  return alias.layerKeys.every((k) => layers[k]);
}

export function layersForAliasToggle(
  alias: AiFootprintAlias,
  layers: LayerMap,
  on: boolean,
): LayerMap {
  const next = { ...layers };
  for (const k of alias.layerKeys) {
    next[k] = on;
  }
  return next;
}

export function activeAiFootprintLayerValues(layers: LayerMap): string[] {
  return AI_FOOTPRINT_LAYER_KEYS.filter((k) => layers[k]);
}

/** @deprecated Prefer layersForEraSeek — additive enable is wrong for era seek. */
export const AI_ERA_PROGRESS_LAYER_KEYS: readonly LayerKey[] = [
  ...AI_ERA_GROWTH_LAYER_KEYS,
];

/**
 * Era / Live seek: clear every overlay, enable only AI growth layers with
 * cited points visible at focus (Live = today’s catalog). Empty if none.
 */
export function layersForEraSeek(
  focusMs: number | null,
  catalogs?: EraVisibilityCatalogs,
): LayerMap {
  const next = emptyLayers(false);
  const flags = growthFlagsForEraSeek(focusMs, catalogs);
  for (const key of AI_ERA_GROWTH_LAYER_KEYS) {
    next[key] = flags[key];
  }
  return next;
}
