/**
 * Forecast simulator for The New Production Cycle.
 *
 * Scenario math explores relationships between model objects from the paper.
 * It is not a cited empirical series. Location multipliers stay null until
 * location data is ingested — missing is not 0.
 *
 * Objects (paper): Human Horizon → Citizen-Shareholder → Capital→Capability
 * → Develop / Optimise / Preserve → Useful Societal Capability ⊃ Biophysical Floor.
 */

export type HorizonInputs = {
  /** Broadly distributed ownership intensity, 0–1. */
  ownership: number;
  /** Reduced labour intensity, 0–1. */
  reducedLabour: number;
  /** Human agency intensity, 0–1. */
  humanAgency: number;
};

/** Allocation across Develop / Optimise / Preserve (shares sum to 1). */
export type CapabilityVectors = {
  develop: number;
  optimise: number;
  preserve: number;
};

export type FloorInputs = {
  /** Relative energy throughput pressure, 0–2 (1 = at floor). */
  energyPressure: number;
  /** Relative land-use pressure, 0–2. */
  landPressure: number;
  /** Relative material throughput pressure, 0–2. */
  materialPressure: number;
};

/**
 * Location overlay. All fields null until a cited location series is ingested.
 * Multipliers must not be treated as 1 when missing.
 */
export type LocationOverlay = {
  id: string | null;
  name: string | null;
  /** Scales Develop yield when present. */
  developMultiplier: number | null;
  /** Scales Optimise yield when present. */
  optimiseMultiplier: number | null;
  /** Scales Preserve yield when present. */
  preserveMultiplier: number | null;
  /** Scales Biophysical Floor headroom when present. */
  floorHeadroomMultiplier: number | null;
};

export type ForecastInputs = {
  year: number;
  /** Relative capital pool available to convert into capability (scenario units). */
  capitalPool: number;
  /** Capital → capability conversion efficiency, 0–1. */
  conversionEfficiency: number;
  horizon: HorizonInputs;
  vectors: CapabilityVectors;
  floor: FloorInputs;
  location: LocationOverlay;
};

export type VectorOutputs = {
  develop: number;
  optimise: number;
  preserve: number;
};

export type ForecastPhase =
  | 'structural-realignment'
  | 'spatial-refactoring'
  | 'biophysical-equilibrium';

export type ForecastResult = {
  year: number;
  phase: ForecastPhase;
  phaseLabel: string;
  /** Horizon composite driving the Citizen-Shareholder mechanism. */
  horizonIndex: number;
  /** Capital converted before vector split. */
  capabilityBase: number;
  vectors: VectorOutputs;
  grossCapability: number;
  /** Binding pressure across energy / land / materials (max of the three). */
  floorPressure: number;
  /** Headroom above the floor; negative means overshoot. */
  floorHeadroom: number;
  /** Gross capability capped by the Biophysical Floor. */
  usefulSocietalCapability: number;
  /** True when location overlays are still missing. */
  locationPending: boolean;
  relationships: ForecastRelationship[];
};

export type ForecastRelationship = {
  from: string;
  to: string;
  strength: number;
  note: string;
};

export const FORECAST_YEAR_MIN = 2026;
export const FORECAST_YEAR_MAX = 2040;

export const DEFAULT_FORECAST_INPUTS: ForecastInputs = {
  year: 2030,
  capitalPool: 100,
  conversionEfficiency: 0.72,
  horizon: {
    ownership: 0.55,
    reducedLabour: 0.45,
    humanAgency: 0.6,
  },
  vectors: {
    develop: 0.35,
    optimise: 0.4,
    preserve: 0.25,
  },
  floor: {
    energyPressure: 0.7,
    landPressure: 0.55,
    materialPressure: 0.65,
  },
  location: {
    id: null,
    name: null,
    developMultiplier: null,
    optimiseMultiplier: null,
    preserveMultiplier: null,
    floorHeadroomMultiplier: null,
  },
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** Normalize Develop / Optimise / Preserve so shares sum to 1. */
export function normalizeVectors(vectors: CapabilityVectors): CapabilityVectors {
  const d = Math.max(0, vectors.develop);
  const o = Math.max(0, vectors.optimise);
  const p = Math.max(0, vectors.preserve);
  const sum = d + o + p;
  if (sum <= 0) {
    return { develop: 1 / 3, optimise: 1 / 3, preserve: 1 / 3 };
  }
  return { develop: d / sum, optimise: o / sum, preserve: p / sum };
}

export function phaseForYear(year: number): { phase: ForecastPhase; label: string } {
  if (year < 2030) {
    return {
      phase: 'structural-realignment',
      label: 'Phase 1 — Structural realignment & land trust partitioning (2026–2029)',
    };
  }
  if (year < 2035) {
    return {
      phase: 'spatial-refactoring',
      label: 'Phase 2 — Spatial refactoring & labour reduction (2030–2034)',
    };
  }
  return {
    phase: 'biophysical-equilibrium',
    label: 'Phase 3 — Biophysical & spatial equilibrium (2035–2040)',
  };
}

/** Phase-timed structural friction: earlier years convert capital less cleanly. */
function phaseFriction(phase: ForecastPhase): number {
  switch (phase) {
    case 'structural-realignment':
      return 0.82;
    case 'spatial-refactoring':
      return 0.94;
    case 'biophysical-equilibrium':
      return 1;
  }
}

function locationOrUnity(value: number | null): { factor: number; pending: boolean } {
  if (value == null || !Number.isFinite(value)) {
    return { factor: 1, pending: true };
  }
  return { factor: value, pending: false };
}

/**
 * Recompute projections from slider inputs.
 * Location multipliers apply only when present; otherwise locationPending is true.
 */
export function computeForecast(raw: ForecastInputs): ForecastResult {
  const year = clamp(Math.round(raw.year), FORECAST_YEAR_MIN, FORECAST_YEAR_MAX);
  const { phase, label } = phaseForYear(year);
  const vectors = normalizeVectors(raw.vectors);

  const ownership = clamp01(raw.horizon.ownership);
  const reducedLabour = clamp01(raw.horizon.reducedLabour);
  const humanAgency = clamp01(raw.horizon.humanAgency);
  const horizonIndex = (ownership + reducedLabour + humanAgency) / 3;

  const capitalPool = Math.max(0, raw.capitalPool);
  const conversion = clamp01(raw.conversionEfficiency);
  const capabilityBase =
    capitalPool * conversion * (0.35 + 0.65 * horizonIndex) * phaseFriction(phase);

  const developLoc = locationOrUnity(raw.location.developMultiplier);
  const optimiseLoc = locationOrUnity(raw.location.optimiseMultiplier);
  const preserveLoc = locationOrUnity(raw.location.preserveMultiplier);
  const floorLoc = locationOrUnity(raw.location.floorHeadroomMultiplier);

  const develop =
    capabilityBase * vectors.develop * (1 + 0.35 * ownership) * developLoc.factor;
  const optimise =
    capabilityBase *
    vectors.optimise *
    (1 + 0.4 * reducedLabour) *
    (1 + 0.15 * humanAgency) *
    optimiseLoc.factor;
  const preserve =
    capabilityBase * vectors.preserve * (1 + 0.25 * humanAgency) * preserveLoc.factor;

  const grossCapability = develop + optimise + preserve;

  const energyPressure = Math.max(0, raw.floor.energyPressure);
  const landPressure = Math.max(0, raw.floor.landPressure);
  const materialPressure = Math.max(0, raw.floor.materialPressure);
  const floorPressure =
    Math.max(energyPressure, landPressure, materialPressure) / floorLoc.factor;

  const floorHeadroom = 1 - floorPressure;
  const usefulSocietalCapability =
    floorPressure <= 0
      ? grossCapability
      : grossCapability * Math.min(1, 1 / floorPressure);

  const locationPending =
    developLoc.pending ||
    optimiseLoc.pending ||
    preserveLoc.pending ||
    floorLoc.pending ||
    raw.location.id == null;

  const relationships: ForecastRelationship[] = [
    {
      from: 'Human Horizon',
      to: 'Citizen-Shareholder',
      strength: horizonIndex,
      note: 'Ownership, reduced labour, and agency set the institutional conversion rate.',
    },
    {
      from: 'Citizen-Shareholder',
      to: 'Capital → Capability',
      strength: conversion * horizonIndex,
      note: 'Equity in production converts the capital pool into directed capability.',
    },
    {
      from: 'Capital → Capability',
      to: 'Develop',
      strength: vectors.develop,
      note: 'Spatial expansion & integrated hubs (new frontiers).',
    },
    {
      from: 'Capital → Capability',
      to: 'Optimise',
      strength: vectors.optimise,
      note: 'Urban refactoring & adaptive reuse of existing cores.',
    },
    {
      from: 'Capital → Capability',
      to: 'Preserve',
      strength: vectors.preserve,
      note: 'Ecological containment & permanent buffer zones.',
    },
    {
      from: 'Develop + Optimise + Preserve',
      to: 'Useful Societal Capability',
      strength: clamp01(usefulSocietalCapability / Math.max(grossCapability, 1e-9)),
      note: 'Gross capability is clipped by the Biophysical Floor.',
    },
    {
      from: 'Biophysical Floor',
      to: 'Useful Societal Capability',
      strength: clamp01(1 - Math.max(0, -floorHeadroom)),
      note:
        floorHeadroom >= 0
          ? 'Floor headroom remains; capability is not floor-bound.'
          : 'Floor overshoot — useful capability is capped.',
    },
  ];

  return {
    year,
    phase,
    phaseLabel: label,
    horizonIndex,
    capabilityBase,
    vectors: { develop, optimise, preserve },
    grossCapability,
    floorPressure,
    floorHeadroom,
    usefulSocietalCapability,
    locationPending,
    relationships,
  };
}

/** Year-by-year trajectory with fixed controls (scenario projection). */
export function projectTrajectory(
  base: ForecastInputs,
  fromYear = FORECAST_YEAR_MIN,
  toYear = FORECAST_YEAR_MAX,
): ForecastResult[] {
  const out: ForecastResult[] = [];
  for (let year = fromYear; year <= toYear; year++) {
    // Mild endogenous floor pressure rise as years advance unless Preserve is high.
    const preserveShare = normalizeVectors(base.vectors).preserve;
    const drift = ((year - FORECAST_YEAR_MIN) / (FORECAST_YEAR_MAX - FORECAST_YEAR_MIN)) * 0.35;
    out.push(
      computeForecast({
        ...base,
        year,
        floor: {
          energyPressure: base.floor.energyPressure + drift * (1 - 0.5 * preserveShare),
          landPressure: base.floor.landPressure + drift * (1 - 0.7 * preserveShare),
          materialPressure: base.floor.materialPressure + drift * (1 - 0.4 * preserveShare),
        },
      }),
    );
  }
  return out;
}
