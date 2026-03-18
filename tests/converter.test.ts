import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { convertFieldGroup } from '../src/converter.js';
import type { AcfFieldGroup, Config } from '../src/types.js';

function loadFixture(name: string): AcfFieldGroup {
  return JSON.parse(
    readFileSync(join(import.meta.dirname, `fixtures/${name}.json`), 'utf-8')
  ) as AcfFieldGroup;
}

const homepageJson = loadFixture('homepage');
const projectJson = loadFixture('project');
const collisionJson = loadFixture('collision');

const config: Config = {
  relationshipFragments: {
    project: `
      title
      excerpt
      projectFields {
        year
      }
      terms {
        nodes {
          id
          name
        }
      }
    `,
  },
};

describe('convertFieldGroup', () => {
  it('generates the homepage fragment', () => {
    const result = convertFieldGroup(homepageJson, config);

    // Top-level structure
    expect(result).toContain('homepage {');

    // group fields
    expect(result).toContain('about {');
    expect(result).toContain('experience {');
    expect(result).toContain('introduction {');
    expect(result).toContain('homeProjects {');

    // scalar wysiwyg inside groups
    expect(result).toContain('contentAbout');
    expect(result).toContain('contentExperience');
    expect(result).toContain('contentIntroduction');

    // flexible_content inline fragments (the critical naming test)
    expect(result).toContain('... on HomepageSummaryColumnLayout {');
    expect(result).toContain('... on HomepageSummaryLinksLinkLayoutLayout {');
    expect(result).toContain('... on HomepageSummarySummaryItemSummaryItemLayout {');
    expect(result).toContain('... on HomepageAboutLinksAboutLinkLayoutLayout {');
    expect(result).toContain('... on HomepageExperienceLinksExperienceLinkLayoutLayout {');
    expect(result).toContain('... on HomepageIntroductionLinksIntroductionLinkLayoutLayout {');

    // link fields
    expect(result).toContain('linkLinksAbout {');
    expect(result).toContain('target');
    expect(result).toContain('title');
    expect(result).toContain('url');

    // relationship field
    expect(result).toContain('highlightedProjects {');
    expect(result).toContain('nodes {');
    expect(result).toContain('... on Project {');
    expect(result).toContain('projectFields {');
  });

  it('renders link fields with target/title/url', () => {
    const result = convertFieldGroup(homepageJson, config);
    // linkToArchive is a direct link field in homeProjects group
    expect(result).toContain('linkToArchive {');
  });

  it('works with empty config (no relationship fragments)', () => {
    const result = convertFieldGroup(homepageJson, {});
    // should still generate relationship block with fallback
    expect(result).toContain('highlightedProjects {');
    expect(result).toContain('... on Project {');
  });
});

describe('convertFieldGroup — project (advanced)', () => {
  it('generates top-level scalar and image fields', () => {
    const result = convertFieldGroup(projectJson, {});

    expect(result).toContain('projectFields {');
    expect(result).toContain('year');
    expect(result).toContain('siteUrl');
    expect(result).toContain('featuredImage {');
    expect(result).toContain('node {');
    expect(result).toContain('sourceUrl');
    expect(result).toContain('altText');
    expect(result).toContain('mediaDetails {');
    expect(result).toContain('sizes {');
  });

  it('generates relationship with config fragment', () => {
    const result = convertFieldGroup(projectJson, config);

    expect(result).toContain('relatedProjects {');
    expect(result).toContain('... on Project {');
    expect(result).toContain('projectFields {');
  });

  it('generates group with nested repeater', () => {
    const result = convertFieldGroup(projectJson, {});

    // group
    expect(result).toContain('meta {');
    expect(result).toContain('client');
    // link inside group
    expect(result).toContain('designer {');
    // repeater inside group
    expect(result).toContain('credits {');
    expect(result).toContain('name');
    expect(result).toContain('role');
  });

  it('generates top-level repeater with nested group', () => {
    const result = convertFieldGroup(projectJson, {});

    expect(result).toContain('awards {');
    expect(result).toContain('organisation {');
    // image inside group inside repeater
    expect(result).toContain('logo {');
    // link inside group inside repeater
    expect(result).toContain('website {');
  });

  it('generates flexible_content sections with correct layout type names', () => {
    const result = convertFieldGroup(projectJson, {});

    expect(result).toContain('sections {');
    expect(result).toContain('... on ProjectFieldsSectionsHeroLayout {');
    expect(result).toContain('... on ProjectFieldsSectionsGalleryLayout {');
    expect(result).toContain('... on ProjectFieldsSectionsContentBlockLayout {');
    expect(result).toContain('... on ProjectFieldsSectionsMetricsLayout {');
  });

  it('generates nested flexible_content (ctas inside hero layout)', () => {
    const result = convertFieldGroup(projectJson, {});

    expect(result).toContain('ctas {');
    expect(result).toContain('... on ProjectFieldsSectionsCtasPrimaryLayout {');
    expect(result).toContain('... on ProjectFieldsSectionsCtasSecondaryLayout {');
    expect(result).toContain('style');
  });

  it('generates group inside flexible_content layout', () => {
    const result = convertFieldGroup(projectJson, {});

    // aside group inside content_block layout
    expect(result).toContain('aside {');
    expect(result).toContain('quote');
    expect(result).toContain('attribution');
  });

  it('generates repeater inside flexible_content layout', () => {
    const result = convertFieldGroup(projectJson, {});

    // links repeater inside content_block layout
    expect(result).toContain('links {');
    expect(result).toContain('label');

    // items repeater inside metrics layout with image
    expect(result).toContain('items {');
    expect(result).toContain('icon {');
  });

  it('generates post_object inside flexible_content layout', () => {
    const result = convertFieldGroup(projectJson, {});

    expect(result).toContain('featuredProject {');
    expect(result).toContain('... on Project {');
  });

  it('generates gallery field inside flexible_content layout', () => {
    const result = convertFieldGroup(projectJson, {});

    expect(result).toContain('images {');
    expect(result).toContain('nodes {');
  });
});

describe('convertFieldGroup — real-world collision fixture', () => {
  it('generates flexible_content with repeater and nested group', () => {
    const result = convertFieldGroup(collisionJson, {});

    expect(result).toContain('... on CollisionTestTestSubLayout {');
    expect(result).toContain('repeat {');
    expect(result).toContain('text');
    expect(result).toContain('timePicker');
    expect(result).toContain('weirdGroup {');
    expect(result).toContain('groupText');
  });

  it('generates post_object with empty post_type without ... on Type wrapper', () => {
    const result = convertFieldGroup(collisionJson, {});

    expect(result).toContain('... on CollisionTestTestGeorgeLayout {');
    // no ... on Post wrapper — post_type is "" so we query base fields only
    expect(result).toContain('test {');
    expect(result).toContain('nodes {');
    expect(result).not.toContain('... on Post {');
  });

  it('skips icon_picker with no show_in_graphql', () => {
    const result = convertFieldGroup(collisionJson, {});

    expect(result).not.toContain('iconPicker');
  });

  it('generates range as scalar', () => {
    const result = convertFieldGroup(collisionJson, {});

    expect(result).toContain('range');
  });
});

describe('convertFieldGroup — console.warn paths', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns on duplicate inline fragment type names', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const group: AcfFieldGroup = {
      fields: [
        {
          graphql_field_name: 'flexA',
          key: 'f1',
          label: 'Flex A',
          layouts: {
            la: { key: 'la', label: 'Hero', name: 'hero', sub_fields: [] },
          },
          name: 'flex_a',
          show_in_graphql: 1,
          type: 'flexible_content',
        },
        {
          graphql_field_name: 'flexB',
          key: 'f2',
          label: 'Flex B',
          layouts: {
            lb: { key: 'lb', label: 'Hero', name: 'hero', sub_fields: [] },
          },
          name: 'flex_b',
          show_in_graphql: 1,
          type: 'flexible_content',
        },
      ],
      graphql_field_name: 'dup',
      key: 'group_dup',
      show_in_graphql: 1,
      title: 'Dup',
    };

    convertFieldGroup(group, {});

    expect(warn).not.toHaveBeenCalled();

    // Same flexible_content field name in two sibling fields → same context → collision
    const groupColliding: AcfFieldGroup = {
      fields: [
        {
          graphql_field_name: 'flex',
          key: 'f3',
          label: 'Flex',
          layouts: {
            l1: { key: 'l1', label: 'Item', name: 'item', sub_fields: [] },
            l2: { key: 'l2', label: 'Item 2', name: 'item', sub_fields: [] },
          },
          name: 'flex',
          show_in_graphql: 1,
          type: 'flexible_content',
        },
      ],
      graphql_field_name: 'col',
      key: 'group_col',
      show_in_graphql: 1,
      title: 'Col',
    };

    convertFieldGroup(groupColliding, {});

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('duplicate inline fragment type');
    expect(warn.mock.calls[0][0]).toContain('ColFlexItemLayout');
  });

  it('warns on unknown field type and emits as scalar', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const group: AcfFieldGroup = {
      fields: [
        {
          graphql_field_name: 'widget',
          key: 'f1',
          label: 'Widget',
          name: 'widget',
          show_in_graphql: 1,
          type: 'custom_widget',
        },
      ],
      graphql_field_name: 'unk',
      key: 'group_unk',
      show_in_graphql: 1,
      title: 'Unk',
    };

    const result = convertFieldGroup(group, {});

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('unknown field type "custom_widget"');
    expect(result).toContain('widget');
  });

  it('warns when relationship targets multiple post types', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const group: AcfFieldGroup = {
      fields: [
        {
          graphql_field_name: 'related',
          key: 'f1',
          label: 'Related',
          name: 'related',
          post_type: ['post', 'project'],
          show_in_graphql: 1,
          type: 'relationship',
        },
      ],
      graphql_field_name: 'rel',
      key: 'group_rel',
      show_in_graphql: 1,
      title: 'Rel',
    };

    convertFieldGroup(group, {});

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('targets multiple post types');
    expect(warn.mock.calls[0][0]).toContain('"post"');
  });
});
