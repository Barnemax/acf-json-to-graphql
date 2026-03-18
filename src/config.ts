import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Config } from './types.js';

export async function loadConfig(cwd = process.cwd()): Promise<Config> {
  const candidates = [
    resolve(cwd, 'acf-json-to-graphql.config.ts'),
    resolve(cwd, 'acf-json-to-graphql.config.js'),
    resolve(cwd, 'acf-json-to-graphql.config.mjs'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      try {
        const mod = await import(pathToFileURL(candidate).href);

        return (mod.default ?? mod) as Config;
      } catch (e) {
        if (candidate.endsWith('.ts')) {
          console.warn(`Could not load config from ${candidate}. TypeScript config files require tsx to be installed in your project.`);
        } else {
          console.warn(`Could not load config from ${candidate}:`, e);
        }
      }
    }
  }

  return {};
}
