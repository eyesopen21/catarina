import { createBarrier } from './postgres.mjs';

// docs/08 §4 defines ten reproducible race scenarios; §7 requires injectable
// synchronization points (before/after CAS, before commit, before upload).
// These are generic, reusable barriers: domain WPs import them and call wait()
// from each concurrent participant. No domain logic or domain test lives here.
export const RACE_SCENARIOS = Object.freeze({
  'R-01': 'Lost update en edición concurrente (OCC: row_version + If-Match)',
  'R-02': 'Write skew sobre invariantes (UNIQUE parcial / SELECT FOR UPDATE)',
  'R-03': 'Salida obsoleta de agente (Patch.base_version_id + CAS)',
  'R-04': 'Aprobación vs modificación (CAS de estado y versión)',
  'R-05': 'Ejecución duplicada de tareas (lease con fencing token)',
  'R-06': 'Escrituras concurrentes de memoria (CAS + UNIQUE parcial)',
  'R-07': 'Revocación de permisos durante ejecución (authz_version)',
  'R-08': 'Fallos parciales BD / objetos / workflow (saga + outbox)',
  'R-09': 'Reintentos con efectos laterales (Idempotency-Key / processed_event)',
  'R-10': 'Actualización simultánea del Knowledge Graph (upsert idempotente)',
});

export const RACE_IDS = Object.freeze(Object.keys(RACE_SCENARIOS));

export function createRaceBarrier(id, { parties = 2, point = 'before-cas' } = {}) {
  if (!Object.hasOwn(RACE_SCENARIOS, id)) throw new TypeError(`unknown race id: ${id}`);
  if (!Number.isInteger(parties) || parties < 1) throw new TypeError('parties must be a positive integer');
  const wait = createBarrier(parties);
  wait.id = id;
  wait.point = point;
  wait.description = RACE_SCENARIOS[id];
  return wait;
}

// One ready-to-use factory per documented race, e.g. raceBarriers['R-04']().
export const raceBarriers = Object.freeze(
  Object.fromEntries(RACE_IDS.map((id) => [id, (options) => createRaceBarrier(id, options)])),
);
