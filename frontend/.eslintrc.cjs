module.exports = {
  // Minimal ESLint config for the frontend package to allow parsing JSX/TSX and
  // to run auto-fixes. This keeps rules conservative so we don't change style
  // drastically during the automated pass.
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    allowJs: true,
    extraFileExtensions: ['.jsx', '.tsx'],
    // no project field to avoid requiring TS project files in CI for now
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended'],
  settings: {
    react: { version: 'detect' },
  },
  env: { browser: true, node: true, es2021: true },
  rules: {
    // keep changes minimal — enable some useful auto-fixable rules
    'no-unused-vars': 'warn',
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/consistent-type-imports': 'warn'
  }
}
