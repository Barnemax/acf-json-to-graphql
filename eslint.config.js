import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      'indent': ['error', 2],
      'padding-line-between-statements': ['error', { blankLine: 'always', next: 'return', prev: '*' }],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'sort-keys': ['error', 'asc', { caseSensitive: false, natural: true }],
    },
  },
]
