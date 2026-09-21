/**
 * Scenario forecast tests — relationship shape only, not empirical claims.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_FORECAST_INPUTS,
  computeForecast,
  normalizeVectors,
  phaseForYear,
  projectTrajectory,
} from './forecast.ts';

test('normalizeVectors sums to 1', () => {
  const v = normalizeVectors({ develop: 2, optimise: 2, preserve: 1 });
  assert.ok(Math.abs(v.develop + v.optimise + v.preserve - 1) < 1e-9);
});

test('location pending when overlays are null', () => {
  const r = computeForecast(DEFAULT_FORECAST_INPUTS);
  assert.equal(r.locationPending, true);
});

test('higher preserve reduces long-run floor pressure in trajectory', () => {
  const lowPreserve = projectTrajectory({
    ...DEFAULT_FORECAST_INPUTS,
    vectors: { develop: 0.5, optimise: 0.4, preserve: 0.1 },
  });
  const highPreserve = projectTrajectory({
    ...DEFAULT_FORECAST_INPUTS,
    vectors: { develop: 0.2, optimise: 0.2, preserve: 0.6 },
  });
  const lastLow = lowPreserve[lowPreserve.length - 1]!;
  const lastHigh = highPreserve[highPreserve.length - 1]!;
  assert.ok(lastHigh.floorPressure < lastLow.floorPressure);
});

test('floor overshoot caps useful capability below gross', () => {
  const r = computeForecast({
    ...DEFAULT_FORECAST_INPUTS,
    floor: { energyPressure: 1.8, landPressure: 1.5, materialPressure: 1.4 },
  });
  assert.ok(r.usefulSocietalCapability < r.grossCapability);
  assert.ok(r.floorHeadroom < 0);
});

test('phase labels follow paper chronology', () => {
  assert.equal(phaseForYear(2027).phase, 'structural-realignment');
  assert.equal(phaseForYear(2032).phase, 'spatial-refactoring');
  assert.equal(phaseForYear(2038).phase, 'biophysical-equilibrium');
});
