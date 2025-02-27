import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import typescriptEslint from '@typescript-eslint/eslint-plugin'

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        parser: '@typescript-eslint/parser'
      },
      globals: { ...globals.node, ...globals.browser, AMap: true }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier: prettier
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
      ...prettierConfig.rules,
      'prefer-destructuring': ['error', { object: true, array: false }],
      indent: ['error', 2],
      'semi': ['error', 'never'],
      'quotes': ['error', 'single'],
      'comma-dangle': ['error', 'never'],
      'max-len': ['error', { code: 300 }],
      'no-param-reassign': 'off',
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
      'import/no-absolute-path': 'off',
      'import/no-extraneous-dependencies': 'off',
      'no-plusplus': ['off', { allowForLoopAfterthoughts: true }],
      'newline-per-chained-call': ['error', { ignoreChainWithDepth: 10 }],
      'object-curly-newline': [
        'error', {
          ExportDeclaration: {
            multiline: true,
            minProperties: 3
          },
          ImportDeclaration: {
            multiline: true,
            minProperties: 3
          }
        }
      ],
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off'
    },
    ignores: ['node_modules', 'dist', '*.d.ts', '.husky']
  }
)
