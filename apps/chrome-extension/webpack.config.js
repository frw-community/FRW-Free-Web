const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'background/service-worker': './src/background/service-worker.ts',
    'popup/popup': './src/popup/popup.ts',
    'viewer/viewer': './src/viewer/viewer.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      'crypto': false,  // Not needed for verification
      'stream': false,
      'buffer': false
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup/popup.html' },
        { from: 'src/popup/popup.css', to: 'popup/popup.css' },
        { from: 'src/viewer/viewer.html', to: 'viewer/viewer.html' },
        { from: 'src/viewer/viewer.css', to: 'viewer/viewer.css' },
        { from: 'icons', to: 'icons' }
      ]
    })
  ],
  mode: 'production',
  devtool: 'source-map'
};
