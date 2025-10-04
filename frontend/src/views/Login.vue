
<template>
  <div class="container mt-5">
    <h2>Вход</h2>
    <form @submit.prevent="login">
      <div class="mb-3">
        <label for="email" class="form-label">Логин</label>
        <input
          type="email"
          class="form-control"
          :class="{ 'is-invalid': emailError }"
          id="email"
          v-model.trim="email"
          placeholder="Введите Логин"
          required
        />
        <div v-if="emailError" class="invalid-feedback">{{ emailError }}</div>
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Пароль</label>
        <div class="input-group">
          <input
            :type="showPassword ? 'text' : 'password'"
            class="form-control"
            :class="{ 'is-invalid': passwordError }"
            id="password"
            v-model.trim="password"
            placeholder="Введите пароль (мин. 6 символов)"
            required
          />
          <button
            type="button"
            class="btn btn-outline-secondary"
            @click="togglePassword"
          >
            <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
          <div v-if="passwordError" class="invalid-feedback">{{ passwordError }}</div>
        </div>
      </div>
      <button type="submit" class="btn btn-primary">Войти</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Login',
  data() {
    return {
      email: '',
      password: '',
      emailError: '',
      passwordError: '',
      showPassword: false
    };
  },
  methods: {
    validateForm() {
      this.emailError = '';
      this.passwordError = '';

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        this.emailError = 'Некорректный формат email';
        return false;
      }
      if (this.password.length < 6) {
        this.passwordError = 'Пароль должен быть не менее 6 символов';
        return false;
      }
      return true;
    },
    async login() {
      if (!this.validateForm()) {
        console.log('Валидация не пройдена:', { emailError: this.emailError, passwordError: this.passwordError });
        return;
      }
      try {
        console.log('Отправка запроса на /api/login:', { email: this.email });
        const response = await axios.post('http://localhost:3000/api/login', {
          email: this.email,
          password: this.password
        }, { withCredentials: true });
        console.log('Авторизация успешна:', response.data);
        alert(`Успешный вход: ${response.data.message}`);
        console.log('Перенаправление на /projects');
        this.$router.push('/projects').catch(err => {
          console.error('Ошибка перенаправления:', err);
          alert('Ошибка перенаправления: ' + err.message);
        });
      } catch (error) {
        console.error('Ошибка авторизации:', error.response?.data || error.message);
        alert(`Ошибка входа: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    togglePassword() {
      this.showPassword = !this.showPassword;
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 400px;
  margin: auto;
}
.input-group .btn {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
