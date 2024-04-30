import { configs, config } from 'typescript-eslint'

export default config({
  files: ['**/src/*.ts'],
  extends: [configs.base],
  ignores: ['dist', 'dist/**'],
  languageOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
    parserOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      project: './tsconfig.json'
    }
  },
  rules: {
    'import/extensions': 'off',
    'semi': ['error', 'never'],
    'quotes': ['error', 'single'],
    'import/no-unresolved': 'off',
    'import/no-absolute-path': 'off',
    'comma-dangle': ['error', 'never'],
    'max-len': ['error', { code: 300 }],
    'import/no-extraneous-dependencies': 'off',
    'no-param-reassign': ['error', { props: false }],
    'no-plusplus': ['off', { allowForLoopAfterthoughts: true }],
    'newline-per-chained-call': ['error', { ignoreChainWithDepth: 10 }],
    'object-curly-newline': ['error', { ImportDeclaration: 'never', ExportDeclaration: 'never' }]
  }
}, {
  ignores: ['dist', 'dist/**']
})
