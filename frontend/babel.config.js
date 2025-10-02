module.exports = {
  presets: [
    ['@vue/cli-plugin-babel/preset', { modules: false }], // Отключаем CommonJS
  ],
  plugins: [
    '@babel/plugin-syntax-import-assertions',
  ],
};