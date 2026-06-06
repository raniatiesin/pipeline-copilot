/**
 * Metro bundler configuration.
 *
 * Web platform overrides:
 *  - @powersync/react-native  →  @powersync/web
 *    (react-native-quick-sqlite is native-only; WASQLite handles web)
 *  - @journeyapps/react-native-quick-sqlite  →  empty module stub
 *  - @azure/core-asynciterator-polyfill  →  empty (browsers support async
 *    iterators natively; polyfill is only needed on Android/iOS)
 *
 * @module metro.config
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === '@powersync/react-native') {
      return (originalResolveRequest ?? context.resolveRequest)(
        context,
        '@powersync/web',
        platform,
      );
    }
    if (
      moduleName === '@journeyapps/react-native-quick-sqlite' ||
      moduleName === '@azure/core-asynciterator-polyfill'
    ) {
      return { type: 'empty' };
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
