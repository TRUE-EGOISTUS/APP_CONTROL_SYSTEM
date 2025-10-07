<template>
  <div class="container mt-5 text-center">
    <h1>Добро пожаловать в систему управления проектами!</h1>
    <p class="mt-4">Выберите действие:</p>
    <div class="mt-3">
      <router-link to="/login" class="btn btn-primary me-2">Войти</router-link>
      <router-link to="/register" class="btn btn-secondary me-2">Зарегистрироваться</router-link>
      <router-link to="/projects" class="btn btn-info" v-if="isAuthenticated">Мои проекты</router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      isAuthenticated: false
    };
  },
  methods: {
    async checkAuth() {
      try {
        const response = await axios.get('http://localhost:3000/api/profile', { withCredentials: true });
        this.isAuthenticated = true;
      } catch (error) {
        this.isAuthenticated = false;
      }
    }
  },
  mounted() {
    this.checkAuth();
  }
};
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: auto;
}
</style>