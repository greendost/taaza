const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common');
const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = merge(common, {
  entry: ['webpack-hot-middleware/client', './client/index.js'],
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  watch: true,
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new CircularDependencyPlugin({
      failOnError: true,
      cwd: process.cwd(),
      onStart({ compilation }) {
        console.log('start detecting webpack modules cycles');
      },
      onEnd({ compilation }) {
        console.log('end detecting webpack modules cycles');
      }
    })
  ]
});
