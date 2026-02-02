const path = require('path');

module.exports = function override(config) {
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
};
