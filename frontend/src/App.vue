<template>
  <div id="app" class="container">
    <h1>Добро пожаловать в Систему Контроля!</h1>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style>
#app {
  text-align: center;
  margin-top: 60px;
}
</style>