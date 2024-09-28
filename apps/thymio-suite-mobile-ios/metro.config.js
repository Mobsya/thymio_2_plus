const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resetCache: true,
  transformer: {
    verbose: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);