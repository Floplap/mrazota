/**
 * Flat ESLint config for the frontend package (ESLint v9+)
 * This file is intentionally minimal — it enables parsing of JSX/TSX and a
 * small set of sensible rules so `npx eslint` works when executed inside
 * the frontend folder.
 */
module.exports = [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["node_modules/**"],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        allowJs: true,
        extraFileExtensions: ['.jsx', '.tsx'],
      },
      globals: {},
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
]
