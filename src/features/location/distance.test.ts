// Self-check: `node src/features/location/distance.test.ts`
import assert from 'node:assert/strict';

import { haversineDistanceKm } from './distance.ts';

// La Paz: Plaza Murillo (centro) vs. Periférica (~5-6km, referencia real).
const plazaMurillo: [number, number] = [-68.1348, -16.4955];
const periferica: [number, number] = [-68.1193, -16.5354];

assert.equal(haversineDistanceKm(plazaMurillo, plazaMurillo), 0, 'mismo punto = 0km');

const km = haversineDistanceKm(plazaMurillo, periferica);
assert.ok(km > 3 && km < 8, `esperaba ~4-6km entre Plaza Murillo y Periférica, dio ${km}`);

console.log('distance.test.ts OK');
