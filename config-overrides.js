const path = require('path');

function overrideWebpack(config) {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
  };

  // Fix for prismjs module resolution in oxygen-ui
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });

  // Ignore source map warnings from node_modules
  config.ignoreWarnings = [
    function ignoreSourcemapsloaderWarnings(warning) {
      return (
        warning.module &&
        warning.module.resource.includes('node_modules') &&
        warning.details &&
        warning.details.includes('source-map-loader')
      );
    },
  ];

  return config;
}

function overrideDevServer(configFunction) {
  return function configureDevServer(proxy, allowedHost) {
    const config = configFunction(proxy, allowedHost);

    config.historyApiFallback = {
      ...config.historyApiFallback,
      disableDotRule: true,
    };

    return config;
  };
}

module.exports = {
  webpack: overrideWebpack,
  devServer: overrideDevServer,
};
