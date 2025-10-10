const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies only from the project root's node_modules
config.resolver.disableHierarchicalLookup = true;

// 4. Fix for the unstable_path.match error
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 5. Add support for additional file extensions
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db'
);

// 6. Support for workspace packages
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
