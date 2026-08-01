// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Valesor Development
//
// Public JS entry for solo7-theme. Consumers import ONE module:
//
//   <script type="module">
//     import { initFaro } from '/vendor/solo7-theme/dist/solo7.mjs';
//     initFaro({ appName: 'valesordev.com', appVersion: '1.4.0',
//                endpoint: '…', appKey: '…' });   // config lives in the SITE repo
//   </script>
//
// The stylesheet (dist/solo7.css) is standalone and needs no JS — this module only
// adds opt-in instrumentation. See src/js/faro.mjs for the privacy constraints.

export { initFaro } from './faro.mjs';
