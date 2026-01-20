import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'claude-audit-report/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        React: 'readonly',
      },
    },
    plugins: {
      react: react,
      'react-hooks': reactHooks,
    },
    rules: {
      // JavaScript rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // React hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/setupTests.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  }
);
