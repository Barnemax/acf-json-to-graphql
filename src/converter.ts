import type { AcfField, AcfFieldGroup, AcfLayout, Config } from './types.js';

export function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/** Build the WPGraphQL inline-fragment type name.
 *  context = accumulated graphql_field_names from the group root down to (but not including) this field.
 *  layoutName = the layout's `name` property.
 */
function buildFragmentType(context: string[], layoutName: string): string {
  return [...context, toPascalCase(layoutName), 'Layout'].join('');
}

const SCALAR_TYPES = new Set([
  'text',
  'textarea',
  'number',
  'range',
  'email',
  'url',
  'password',
  'wysiwyg',
  'oembed',
  'select',
  'checkbox',
  'radio',
  'button_group',
  'true_false',
  'date_picker',
  'date_time_picker',
  'time_picker',
  'color_picker',
  'taxonomy',
  'user',
  'file',
]);

function indent(str: string, depth: number): string {
  const pad = '  '.repeat(depth);

  return str
    .split('\n')
    .map((l) => (l.trim() === '' ? '' : pad + l))
    .join('\n');
}

function convertField(
  field: AcfField,
  context: string[],
  config: Config,
  depth: number,
  seen: Map<string, string>
): string {
  if (!field.show_in_graphql) return '';

  const fieldName = field.graphql_field_name || field.name;
  const pad = '  '.repeat(depth);

  switch (field.type) {
  case 'flexible_content': {
    const newContext = [...context, toPascalCase(fieldName)];
    const layouts = Object.values(field.layouts ?? {});
    const layoutBlocks = layouts
      .map((layout) => {
        const typeName = buildFragmentType(newContext, layout.name);
        if (seen.has(typeName)) {
          console.warn(
            `  warning: duplicate inline fragment type "${typeName}" in field "${fieldName}". ` +
            `First seen under "${seen.get(typeName)}", now under "${fieldName}". ` +
            'WPGraphQL will silently drop fields from the second definition.'
          );
        } else {
          seen.set(typeName, fieldName);
        }

        return convertLayout(layout, newContext, config, depth + 1, seen);
      })
      .filter(Boolean)
      .join('\n');

    return `${pad}${fieldName} {\n${layoutBlocks}\n${pad}}`;
  }

  case 'group':
  case 'repeater': {
    const newContext = [...context, toPascalCase(fieldName)];
    const subContent = (field.sub_fields ?? [])
      .map((f) => convertField(f, newContext, config, depth + 1, seen))
      .filter(Boolean)
      .join('\n');

    return `${pad}${fieldName} {\n${subContent}\n${pad}}`;
  }

  case 'link': {
    return `${pad}${fieldName} {\n${pad}  target\n${pad}  title\n${pad}  url\n${pad}}`;
  }

  case 'image': {
    return (
      `${pad}${fieldName} {\n` +
        `${pad}  node {\n` +
        `${pad}    altText\n` +
        `${pad}    mediaDetails {\n` +
        `${pad}      height\n` +
        `${pad}      sizes {\n` +
        `${pad}        height\n` +
        `${pad}        name\n` +
        `${pad}        sourceUrl\n` +
        `${pad}        width\n` +
        `${pad}      }\n` +
        `${pad}      width\n` +
        `${pad}    }\n` +
        `${pad}    sourceUrl\n` +
        `${pad}  }\n` +
        `${pad}}`
    );
  }

  case 'relationship':
  case 'post_object': {
    const postTypes = (Array.isArray(field.post_type) ? field.post_type : []).filter(Boolean);

    if (postTypes.length > 1) {
      console.warn(`  warning: "${fieldName}" targets multiple post types — only "${postTypes[0]}" will be used. Add a relationshipFragments override in your config if needed.`);
    }

    const postType = postTypes[0];

    if (!postType) {
      // No post type restriction — query base fields only, no ... on Type wrapper
      return (
        `${pad}${fieldName} {\n` +
          `${pad}  nodes {\n` +
          `${pad}    id\n` +
          `${pad}    slug\n` +
          `${pad}  }\n` +
          `${pad}}`
      );
    }

    const fragment = config.relationshipFragments?.[postType];
    const inner = fragment
      ? indent(fragment.trim(), depth + 3)
      : `${'  '.repeat(depth + 3)}title`;

    return (
      `${pad}${fieldName} {\n` +
        `${pad}  nodes {\n` +
        `${pad}    id\n` +
        `${pad}    slug\n` +
        `${pad}    ... on ${toPascalCase(postType)} {\n` +
        `${inner}\n` +
        `${pad}    }\n` +
        `${pad}  }\n` +
        `${pad}}`
    );
  }

  case 'gallery': {
    return (
      `${pad}${fieldName} {\n` +
        `${pad}  nodes {\n` +
        `${pad}    sourceUrl\n` +
        `${pad}    altText\n` +
        `${pad}  }\n` +
        `${pad}}`
    );
  }

  default: {
    if (!SCALAR_TYPES.has(field.type)) {
      console.warn(`  warning: unknown field type "${field.type}" on "${fieldName}" — emitting as scalar`);
    }

    return `${pad}${fieldName}`;
  }
  }
}

function convertLayout(
  layout: AcfLayout,
  context: string[],
  config: Config,
  depth: number,
  seen: Map<string, string>
): string {
  const typeName = buildFragmentType(context, layout.name);
  const pad = '  '.repeat(depth);
  const subContent = layout.sub_fields
    .map((f) => convertField(f, context, config, depth + 1, seen))
    .filter(Boolean)
    .join('\n');

  return `${pad}... on ${typeName} {\n${subContent}\n${pad}}`;
}

export function convertFieldGroup(group: AcfFieldGroup, config: Config): string {
  if (group.show_in_graphql === 0) return '';

  const seen = new Map<string, string>();
  const groupName = group.graphql_field_name;
  const context = [toPascalCase(groupName)];
  const fieldsContent = group.fields
    .map((f) => convertField(f, context, config, 2, seen))
    .filter(Boolean)
    .join('\n');

  return `  ${groupName} {\n${fieldsContent}\n  }`;
}
