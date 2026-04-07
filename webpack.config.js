const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  const appDir = path.resolve(__dirname, 'app');

  process.env.EXPO_ROUTER_APP_ROOT = appDir;
  process.env.EXPO_ROUTER_ABS_APP_ROOT = appDir;

  const config = await createExpoWebpackConfigAsync(env, argv);

  // Force override via DefinePlugin — this wins over Babel's replacement
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.EXPO_ROUTER_APP_ROOT': JSON.stringify(appDir),
      'process.env.EXPO_ROUTER_ABS_APP_ROOT': JSON.stringify(appDir),
    })
  );

  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    vm: false,
  };

  return config;
};