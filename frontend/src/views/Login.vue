<template>
  <div class="container">
    <h2>Вход</h2>
    <form @submit.prevent = "login">
        <div class="mb-3">
            <label for="email" class="form-label">Логин</label>
            <input type="email" class="form-control" id="email" v-model="email" required >
        </div>
        <div class="mb-3">
            <label for="password" class="form-label">Пароль</label>
            <input type="password" class="form-control" id="password" v-model="password" required >
        </div>
        <button type="submit" class="btn btn-primary">Войти</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios'
export default {
    name:'Login',
    data() {
        return {
            email: '',
            password: '',
        };
    },
    methods: {
        async login(){
            try {
                const response = await axios.post('http://localhost:3000/api/login',{
                    email: this.email,
                    password: this.password,
                });
                alert('Успешный вход: ' + response.data.message);
                this.$router.push('/');
            } catch (error) {
                alert('Ошибка входа: ' + (error.response?.data?.message || 'Сервер не отвечает'));
            }
        }
    },
}
</script>

<style scoped>
.container {
  max-width: 400px;
  margin-top: 60px;
}
</style>