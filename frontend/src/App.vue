<template>
  <div id="app">
    <nav v-if="!loading" class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">Моё приложение</a>
        <div class="navbar-nav">
          <div v-if="isAuthenticated">
            <router-link v-if="userRole !== 'observer'" class="nav-link me-2" to="/projects">Проекты</router-link> <!-- Наблюдатель не видит проекты для редактирования -->
            <router-link class="nav-link me-2" to="/profile">Профиль</router-link>
            <button class="nav-link btn btn-link" @click="logout">Выйти</button>
          </div>
          <div v-else>
            <router-link class="nav-link me-2" to="/login">Войти</router-link>
            <router-link class="nav-link" to="/register">Регистрация</router-link>
          </div>
        </div>
      </div>
    </nav>
    <div v-else class="text-center mt-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
      <p>Загрузка...</p>
    </div>
    <div class="container mt-4">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'App',
  data() {
    return {
      isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
      userRole: localStorage.getItem('userRole') || null, // Добавляем роль для проверки в навигации
      loading: true,
    };
  },
  methods: {
    async checkAuth() {
      this.loading = true;
      try {
        const response = await axios.get('http://localhost:3000/api/profile', { withCredentials: true });
        this.isAuthenticated = true;
        this.userRole = response.data.user.role;
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', this.userRole);
        console.log('App.vue: Пользователь аутентифицирован, роль:', this.userRole);
      } catch (error) {
        this.isAuthenticated = false;
        this.userRole = null;
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        console.log('App.vue: Пользователь не аутентифицирован');
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      try {
        await axios.post('http://localhost:3000/api/logout', {}, { withCredentials: true });
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        this.isAuthenticated = false;
        this.userRole = null;
        this.$router.push('/');
        console.log('App.vue: Выход успешен');
      } catch (error) {
        alert('Ошибка выхода: ' + (error.response?.data?.message || 'Ошибка сервера'));
      }
    },
  },
  mounted() {
    this.checkAuth();
  },
  watch: {
    '$route'() {
      this.checkAuth();
    },
  },
};
</script>

<style scoped>
.navbar {
  margin-bottom: 20px;
}
</style>
