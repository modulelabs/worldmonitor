/**
 * The Next Production Cycle — core contracts.
 *
 * Missing is not 0. Do not invent indices, weights, or unit costs to fill a gap.
 * Prefer cited public series; otherwise leave fields null and name the required file.
 *
 * Forecast simulator math in `./forecast` is scenario exploration of paper
 * relationships — not a cited empirical series. Location overlays stay null
 * until location data is ingested.
 */

export type CitedNumber = {
  value: number;
  source: string;
  year: number | string;
};

/** Placeholder until domain formulas land. */
export function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export {
  FORECAST_YEAR_MAX,
  FORECAST_YEAR_MIN,
  DEFAULT_FORECAST_INPUTS,
  computeForecast,
  normalizeVectors,
  phaseForYear,
  projectTrajectory,
  type CapabilityVectors,
  type FloorInputs,
  type ForecastInputs,
  type ForecastPhase,
  type ForecastRelationship,
  type ForecastResult,
  type HorizonInputs,
  type LocationOverlay,
  type VectorOutputs,
} from './forecast';
