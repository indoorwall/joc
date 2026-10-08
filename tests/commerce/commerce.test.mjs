// Tests del comercio. Uso: node tests/commerce/commerce.test.mjs
// Con DATABASE_URL (Postgres con la migración aplicada) también corre la suite contra PostgreSQL real + RLS.
import { runContract } from './contract.mjs';
import { createMemoryRepo } from '../../commerce/core/memoryRepo.js';
import { runUnit } from './unit.mjs';
import { runClient } from './client.mjs';

let ok = 0, total = 0;
const check = (t, c, extra) => { total++; if (c) ok++; console.log(`${c ? 'OK   ' : 'FALLA'} ${t}${!c && extra != null ? ' — ' + extra : ''}`); };

await runUnit(check);
await runClient(check);
await runContract('memoria', async () => createMemoryRepo(), check);
if (process.env.DATABASE_URL) {
  const { runPg } = await import('./pg.mjs');
  await runPg(check);
  const { runEdge } = await import('./edge.e2e.mjs');
  await runEdge(check);
} else console.log('(sin DATABASE_URL: se salta la suite contra PostgreSQL real)');

console.log(`\n${ok} de ${total} comprobaciones superadas.`);
process.exit(ok === total ? 0 : 1);
