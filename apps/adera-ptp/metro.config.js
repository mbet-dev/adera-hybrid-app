const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot, {
  // Enable CSS support.
  isCSSEnabled: true,
});

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// 4. Symlink support for pnpm
config.resolver.unstable_enableSymlinks = true;

// Add support for platform-specific extensions
config.resolver.sourceExts = process.env.RN_PLATFORM === 'web'
  ? [...config.resolver.sourceExts, 'web.js', 'web.jsx', 'web.ts', 'web.tsx']
  : [...config.resolver.sourceExts, 'native.js', 'native.jsx', 'native.ts', 'native.tsx'];

module.exports = config;
