/**
 * Root ESLint config to support running eslint from the repository root
 * and in subfolders (including `mrazota-site`). This is intentionally minimal
 * and will delegate to recommended rules. It also declares ignored paths.
 */
module.exports = {
  root: true,
  ignores: [
    'node_modules/**',
    'hostinger_deploy/full_pack_tmp/**',
    'mrazota-site-backup-*/**',
    'worktrees/**'
  ],
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  rules: {}
};
