/**
 * Root ESLint config to support running eslint from the repository root
 * and in subfolders (including `mrazota-site`). This is intentionally minimal
 * and will delegate to recommended rules. It also declares ignored paths.
 */
// Flat config format for ESLint v9+ (module.exports is an array of config objects)
module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'public/**',
      'hostinger_deploy/**',
      'hostinger_deploy/full_pack_tmp/**',
      'mrazota-site-backup-*/**',
      'worktrees/**',
      'ai_merged_old/**',
      'legacy*/**',
      'old-site/**',
      'legacy_src/**',
      'ai_merge/**'
    ]
  },
  {
    // Root lint config kept minimal. Only check JS/JSX files to avoid requiring
    // TypeScript parser packages during this repair pass.
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {}
  }
];
