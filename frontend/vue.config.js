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
        sourceType: 'module', // Явно указываем ES-модули
      }));

    // Настройка для .vue файлов
    config.module
      .rule('vue')
      .test(/\.vue$/)
      .use('vue-loader')
      .loader('vue-loader');

    // Убедимся, что Webpack использует ES-модули
    config.output.module(true);
  },
});
