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
    '@typescript-eslint/ban-ts-comment': 'warn',
    camelcase: 'warn',
    'spaced-comment': 'warn',
    'no-async-promise-executor': 'warn',
    'space-before-function-paren': 'warn',
    'guard-for-in': 'warn',
    'no-var': 'warn',
    'operator-linebreak': 'off',
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
    // 'operator-linebreak': ['warn', 'before'],
    'no-extra-boolean-cast': 'off',
    curly: 'off',
    '@typescript-eslint/no-inferrable-types': [
      'warn',
      { ignoreParameters: true, ignoreProperties: true },
    ],
  },
};
