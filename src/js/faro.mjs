// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Valesor Development
//
// Grafana Faro Web SDK instrumentation for the Solo7 site family. This is deliberate
// dogfooding — the same telemetry we talk about at conferences — but under strict
// privacy rules, because these sites publish about health conditions and the people
// reading them did not sign up for anything.
//
// HARD CONSTRAINTS baked in below (do not "fix" these back to defaults):
//   1. Volatile sessions only. `sessionTracking.persistent: false` → the SDK uses its
//      VolatileSessionsManager (sessionStorage), so a session dies with the tab. No
//      cross-visit stitching, no sticky id following anyone around.
//   2. Session Replay is OFF, and the package is intentionally NOT a dependency. Replay
//      would record which posts a stranger lingered on — exactly the health-adjacent
//      signal we refuse to collect. There is no rrweb / faro replay import anywhere in
//      this repo, on purpose.
//   3. We NEVER call the user-identification / user-meta API (faro.api.setUser, the
//      `user` config). No accounts exist; there is no user to identify.
//   4. No PII in custom attributes or events. Console capture is disabled so page text
//      can't ride out in a log line; geolocation is explicitly off.
//   5. Sampling is set EXPLICITLY (see DEFAULT_SAMPLING_RATE), never left to a default.
//   6. Per-site config (name/version/endpoint/appKey) is injected by the consumer. The
//      appKey ships to the browser so it is not a secret — but it is kept OUT of this
//      repo so the five sites can differ.
//   7. Absent/partial config is a graceful no-op: a site must work uninstrumented.

import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk';

// Explicit sampling. 1.0 = record every volatile session. These are low-traffic personal
// sites and the whole point is to watch the telemetry during talks, so we keep them all;
// a consumer can lower this per-site by passing `samplingRate`. The value is ALWAYS passed
// to Faro explicitly (constraint #5) — we never rely on the SDK default.
const DEFAULT_SAMPLING_RATE = 1.0;

let started = false; // guard against double-init on the same page

/**
 * Initialize Faro for one site. Safe to call with nothing — it simply no-ops.
 *
 * @param {object} [config]
 * @param {string} config.appName     Site/app name, e.g. "valesordev.com".
 * @param {string} config.appVersion  Deployed version string, e.g. "1.4.0".
 * @param {string} config.endpoint    Grafana Cloud Frontend Observability collector URL.
 * @param {string} config.appKey      Public app key for that collector (ships to browser).
 * @param {number} [config.samplingRate]  Override the explicit default (0..1).
 * @returns {import('@grafana/faro-web-sdk').Faro | null} the instance, or null if not started.
 */
export function initFaro(config = {}) {
  const { appName, appVersion, endpoint, appKey, samplingRate } = config;

  // Constraint #7: graceful no-op when the consumer hasn't wired up telemetry.
  if (!appName || !endpoint || !appKey) {
    return null;
  }
  if (started) {
    return null;
  }

  const rate = typeof samplingRate === 'number' ? samplingRate : DEFAULT_SAMPLING_RATE;

  const faro = initializeFaro({
    url: endpoint,
    apiKey: appKey,
    app: {
      name: appName,
      version: appVersion || 'unknown',
    },

    // Errors, web vitals, view + session lifecycle. Console capture is OFF (constraint #4)
    // so nothing we log can carry page content off the device.
    instrumentations: getWebInstrumentations({
      captureConsole: false,
    }),

    // Constraint #1: volatile, non-sticky sessions. Constraint #5: sampling is explicit.
    sessionTracking: {
      enabled: true,
      persistent: false,
      samplingRate: rate,
    },

    // Constraint #4: geolocation is explicitly refused on the client. (It also must be
    // enabled server-side to do anything — we deny it on both ends.)
    trackGeolocation: false,

    // Only fetch/xhr resource timings, never every asset URL — an art/photo site's image
    // paths can themselves be revealing.
    trackResources: false,

    // NOTE: no `user` meta and no setUser() call anywhere (constraint #3).
    // NOTE: no Session Replay instrumentation and no replay package (constraint #2).
  });

  started = true;
  return faro;
}
