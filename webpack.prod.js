const merge = require('webpack-merge');
const common = require('./webpack.common');

module.exports = merge(common, {
    entry: ['./client/index.js'],
    mode: 'production'
});