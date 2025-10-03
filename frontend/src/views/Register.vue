<template>
  <div class="container mt-5">
    <h2>Регистрация</h2>
    <form @submit.prevent="register">
        <div class="mb-3">
            <label for="email" class="form-label">Логин</label>
            <input type="email" class="form-control" id="email" v-model="email" placeholder="Введите свой логин" required/>
        </div>
         <div class="mb-3">
            <label for="password" class="form-label">Пароль</label>
            <input type="password" class="form-control" id="password" v-model="password" placeholder="Введите свой пароль" required/>
        </div>
        <button type="submit" class="btn btn-primary">Зарегистрироваться</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios'
export default {
    name: 'Register',
    data() {
        return {
            email: '',
            password: '',
        };
    },
    methods: {
        async register() {
            try {
                const response = await axios.post('http://localhost:3000/api/register',{
                    email: this.email,
                    password: this.password
                });
                alert('Успешная регистрация: ${response.data.message}');
                this.$router.push('/login');
            } catch (error) {
                alert("Ошибка регистрации: ${error.response?.data?.message || 'Ошибка сервера'}");
            }
        }
    },
}
</script>

<style scoped>
.container{
    max-width: 400px;
    margin:auto;
}
</style>