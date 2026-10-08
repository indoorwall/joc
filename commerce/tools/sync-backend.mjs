// Copia el núcleo de comercio (ESM puro) dentro de supabase/functions/_shared/commerce para que las Edge
// Functions lo empaqueten (no se importan archivos fuera de supabase/functions). Un test verifica que está al día.
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
export const SHARED = ['catalog/catalog.js', ...readdirSync(new URL('commerce/core/', root)).filter(f => f.endsWith('.js') && f !== 'memoryRepo.js' && f !== 'fakeStripe.js').map(f => `core/${f}`)];
export function sharedContent(rel) { return '// COPIA GENERADA de commerce/' + rel + ' (node commerce/tools/sync-backend.mjs). No editar aquí.\n' + readFileSync(new URL(`commerce/${rel}`, root), 'utf8'); }
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const rel of SHARED) {
    const dest = new URL(`backend/supabase/functions/_shared/commerce/${rel}`, root);
    mkdirSync(new URL('.', dest), { recursive: true });
    writeFileSync(dest, sharedContent(rel));
  }
  console.log(`${SHARED.length} archivos copiados a backend/supabase/functions/_shared/commerce`);
}
