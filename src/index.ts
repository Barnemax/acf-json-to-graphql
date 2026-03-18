import { convertFieldGroup } from './converter.js';
import { scanAcfJson } from './scanner.js';
import { loadConfig } from './config.js';

export { convertFieldGroup, scanAcfJson, loadConfig };
export type { AcfFieldGroup, AcfField, AcfLayout, Config } from './types.js';

/** Identity function — exists purely for config-file autocomplete. */
export function defineConfig(config: import('./types.js').Config): import('./types.js').Config {
  return config;
}

/** Programmatic API: convert a parsed field group JSON to a fragment string. */
export function acfJsonToGraphQL(
  group: import('./types.js').AcfFieldGroup,
  config: import('./types.js').Config = {}
): string {
  return convertFieldGroup(group, config);
}
