export interface AcfField {
  key: string;
  label: string;
  name: string;
  type: string;
  show_in_graphql?: number;
  graphql_field_name?: string;
  // flexible_content
  layouts?: Record<string, AcfLayout>;
  // group / repeater
  sub_fields?: AcfField[];
  // relationship / post_object — ACF stores "" when no post type is selected
  post_type?: string[] | string;
  return_format?: string;
}

export interface AcfLayout {
  key: string;
  name: string;
  label: string;
  sub_fields: AcfField[];
}

export interface AcfFieldGroup {
  key: string;
  title: string;
  graphql_field_name: string;
  show_in_graphql?: number;
  graphql_types?: string[];
  fields: AcfField[];
}

export interface Config {
  /** Fragments to inline for relationship/post_object fields, keyed by post type slug. */
  relationshipFragments?: Record<string, string>;
}
