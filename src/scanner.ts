import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AcfFieldGroup } from './types.js';

export async function scanAcfJson(dir: string): Promise<AcfFieldGroup[]> {
  const entries = await readdir(dir);
  const jsonFiles = entries.filter((f) => f.endsWith('.json'));

  const results = await Promise.all(
    jsonFiles.map(async (file) => {
      const raw = await readFile(join(dir, file), 'utf-8');
      try {
        const parsed = JSON.parse(raw) as AcfFieldGroup;
        if (parsed.key && Array.isArray(parsed.fields) && parsed.graphql_field_name) {
          return parsed;
        }
      } catch {
        console.warn(`Skipping ${file}: invalid JSON`);
      }

      return null;
    })
  );

  return results.filter((g): g is AcfFieldGroup => g !== null);
}
