module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'google',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
    '/dist/**/*',
    '/seed/**',
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    quotes: ['warn', 'single'],
    'quote-props': ['warn', 'as-needed'],
    'import/no-unresolved': 0,
    'object-curly-spacing': ['warn', 'always'],
    // https://eslint.org/docs/rules/indent
    indent: ['warn', 2, { SwitchCase: 1 }],
    'max-len': [
      'warn',
      {
        code: 100,
        ignoreComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
    'prefer-const': 'warn',
    'prefer-promise-reject-errors': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-empty-interface': 'warn',
    camelcase: 'warn',
    'spaced-comment': 'warn',
    'no-async-promise-executor': 'warn',
    'space-before-function-paren': 'warn',
    'guard-for-in': 'warn',
    'no-var': 'warn',
    'operator-linebreak': 'off',
    'new-cap': 'warn',
    semi: 'warn',
    'comma-dangle': 'off',
    'arrow-parens': 'off',
    'no-trailing-spaces': 'warn',
    'no-multiple-empty-lines': 'warn',
    'no-multi-spaces': ['warn', { ignoreEOLComments: true }],
    'require-jsdoc': [
      'warn',
      {
        require: {
          FunctionDeclaration: false,
          MethodDefinition: false,
          ClassDeclaration: false,
          ArrowFunctionExpression: false,
          FunctionExpression: false,
        },
      },
    ],
    'valid-jsdoc': [
      2,
      {
        prefer: {
          return: 'returns',
        },
      },
    ],
    // 'operator-linebreak': ['warn', 'before'],
    'no-extra-boolean-cast': 'off',
    curly: 'off',
    '@typescript-eslint/no-inferrable-types': [
      'warn',
      { ignoreParameters: true, ignoreProperties: true },
    ],
    'import/order': [
      'warn', // 'off', //
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
        ],
      },
    ],
    'import/no-named-as-default': 'off',
  },
};
