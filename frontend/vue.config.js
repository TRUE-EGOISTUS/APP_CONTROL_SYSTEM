const { defineConfig } = require('@vue/cli-service');
const webpack = require('webpack');

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      fallback: {
        assert: require.resolve('assert/'),
        path: require.resolve('path-browserify'),
        fs: false,
        worker_threads: false,
        module: false
      }
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser' // Глобально предоставляем process
      }),
      {
        apply: (compiler) => {
          compiler.hooks.done.tap('LogPlugin', () => {
            console.log('Webpack config loaded successfully');
          });
        }
      }
    ]
  },
  chainWebpack: (config) => {
    // Настройка для .js файлов
    config.module
      .rule('js')
      .test(/\.js$/)
      .use('babel-loader')
      .loader('babel-loader')
      .tap(options => ({
        ...options,
        sourceType: 'unambiguous'
      }))
      .end()
      .exclude
      .add(/node_modules\/webpack-dev-server/)
      .end();

    // Настройка для .vue файлов
    config.module
      .rule('vue')
      .test(/\.vue$/)
      .use('vue-loader')
      .loader('vue-loader');
  }
});