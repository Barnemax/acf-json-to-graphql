import { checkbox } from '@inquirer/prompts';
import type { AcfFieldGroup } from './types.js';

export async function selectFieldGroups(
  groups: AcfFieldGroup[]
): Promise<AcfFieldGroup[]> {
  const chosen = await checkbox({
    choices: groups.map((g) => ({
      checked: true,
      name: `${g.title} (${g.graphql_field_name})`,
      value: g.key,
    })),
    message: 'Select field groups to convert',
  });

  return groups.filter((g) => chosen.includes(g.key));
}
