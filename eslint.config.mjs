import js from '@eslint/js';
import globals from 'globals';
import nodejs from 'eslint-plugin-n';

export default [
  // Base configurations
  js.configs.recommended,
  nodejs.configs['flat/recommended'],

  // Global variables
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    }
  },

  // File patterns and ignored files
  {
    ignores: [
      'node_modules/',
      'coverage/',
      '.github/',
      'dist/',
      'build/',
      '**/*.min.js',
      'jest.config.mjs'
    ]
  },

  // Rules configuration
  {
    rules: {
      // Disable specific rules for this project
      'no-undef': 'off', // Disable undefined variable checks (we have variables from outer scopes)
      // Error prevention
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-constant-condition': 'warn',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'warn',
      'no-extra-boolean-cast': 'warn',
      'no-fallthrough': 'warn',
      'no-irregular-whitespace': 'warn',
      'no-prototype-builtins': 'warn',
      'no-return-await': 'warn',
      'no-var': 'error',
      'prefer-const': 'warn',

      // Style
      'camelcase': ['warn', { properties: 'never' }],
      'semi': ['error', 'always'],
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'quotes': ['warn', 'single', { allowTemplateLiterals: true, avoidEscape: true }],
      'arrow-spacing': ['warn', { before: true, after: true }],
      'block-spacing': ['warn', 'always'],
      'brace-style': ['warn', '1tbs', { allowSingleLine: true }],
      'comma-dangle': ['warn', 'only-multiline'],
      'comma-spacing': ['warn', { before: false, after: true }],
      'comma-style': ['warn', 'last'],
      'eol-last': ['warn', 'always'],
      'func-call-spacing': ['warn', 'never'],
      'key-spacing': ['warn', { beforeColon: false, afterColon: true }],
      'keyword-spacing': ['warn', { before: true, after: true }],
      'linebreak-style': ['error', 'unix'],
      'max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
      'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
      'no-trailing-spaces': 'warn',
      'object-curly-spacing': ['warn', 'always'],
      'padded-blocks': ['warn', 'never'],
      'space-before-blocks': ['warn', 'always'],
      'space-before-function-paren': ['warn', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
      'space-in-parens': ['warn', 'never'],
      'space-infix-ops': 'warn',

      // Node.js specific
      'n/exports-style': ['error', 'module.exports'],
      'n/file-extension-in-import': ['error', 'always', { '.js': 'never', '.mjs': 'always' }],
      'n/prefer-global/buffer': ['error', 'always'],
      'n/prefer-global/console': ['error', 'always'],
      'n/prefer-global/process': ['error', 'always'],
      'n/prefer-global/url-search-params': ['error', 'always'],
      'n/prefer-global/url': ['error', 'always'],
      'n/prefer-promises/dns': 'error',
      'n/prefer-promises/fs': 'error',
      'n/no-deprecated-api': 'warn',
      'n/no-unpublished-require': 'off',
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
      // Allow process.exit() in CLI applications
      'n/no-process-exit': 'off'
    }
  }
];
