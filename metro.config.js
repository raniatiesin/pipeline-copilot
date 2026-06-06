const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * For web builds, redirect native-only packages to local stubs.
 * @powersync/react-native and the azure polyfill require native SQLite —
 * they are not bundleable on web. The stubs keep the web preview running.
 */
const WEB_STUBS = {
  '@azure/core-asynciterator-polyfill': path.resolve(__dirname, 'stubs/polyfill.js'),
  '@powersync/react-native': path.resolve(__dirname, 'stubs/powersync-react-native.js'),
  '@journeyapps/react-native-quick-sqlite': path.resolve(__dirname, 'stubs/polyfill.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_STUBS[moduleName]) {
    return { filePath: WEB_STUBS[moduleName], type: 'sourceFile' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
