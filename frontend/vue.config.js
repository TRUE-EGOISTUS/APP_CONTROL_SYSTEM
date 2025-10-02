
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: (config) => {
    // Настройка для .js файлов
    config.module
      .rule('js')
      .test(/\.js$/)
      .use('babel-loader')
      .loader('babel-loader')
      .tap(options => ({
        ...options,
        sourceType: 'unambiguous', // Автоматическое определение типа модуля
      }));

    // Исключаем webpack-dev-server из обработки Babel
    config.module
      .rule('js')
      .exclude.add(/node_modules\/webpack-dev-server/)
      .end();

    // Настройка для .vue файлов
    config.module
      .rule('vue')
      .test(/\.vue$/)
      .use('vue-loader')
      .loader('vue-loader');
  },
});