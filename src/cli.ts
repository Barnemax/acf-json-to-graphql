import { Command } from 'commander';
import { loadConfig } from './config.js';
import { scanAcfJson } from './scanner.js';
import { selectFieldGroups } from './selector.js';
import { convertFieldGroup } from './converter.js';
import { writeFragments, printFragments } from './writer.js';
import type { AcfFieldGroup } from './types.js';

const program = new Command();

program
  .name('acf-json-to-graphql')
  .description('Generate WPGraphQL query fragments from ACF JSON sync files')
  .option('--path <dir>', 'Path to ACF JSON sync folder')
  .option('--out <dir>', 'Output directory for generated .graphql files')
  .option('--all', 'Convert all field groups without prompting')
  .action(async (opts: { path?: string; out?: string; all?: boolean }) => {
    const config = await loadConfig();

    const acfPath = opts.path ?? './acf-json';
    const outDir = opts.out;

    let groups: AcfFieldGroup[];
    try {
      groups = await scanAcfJson(acfPath);
    } catch {
      console.error(`Could not read ACF JSON from: ${acfPath}`);
      process.exit(1);
    }

    if (groups.length === 0) {
      console.error('No valid ACF field group JSON files found.');
      process.exit(1);
    }

    const selected = opts.all ? groups : await selectFieldGroups(groups);
    if (selected.length === 0) {
      console.log('Nothing selected.');

      return;
    }

    const fragments = new Map<string, string>();
    for (const group of selected) {
      fragments.set(group.key, convertFieldGroup(group, config));
    }

    if (outDir) {
      await writeFragments(selected, fragments, outDir);
    } else {
      printFragments(selected, fragments);
    }
  });

program.parse();
