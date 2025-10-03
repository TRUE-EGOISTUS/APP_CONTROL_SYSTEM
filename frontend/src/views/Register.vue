<template>
  <div class="container mt-5">
    <h2>Регистрация</h2>
    <form @submit.prevent="register">
        <div class="mb-3">
            <label for="email" class="form-label">Логин</label>
            <input type="email" class="form-control" :class="{'is-invalid': emailError}" id="email" v-model="email" placeholder="Введите логин" required/>
        <div v-if="emailError" class="invalid-feedback">{{emailError}}</div>
        </div>
         <div class="mb-3">
            <label for="password" class="form-label">Пароль</label>
            <input type="password" class="form-control" :class="{'is-invalid': passwordError}" id="password" v-model="password" placeholder="Введите пароль (мин. 6 символов)" required/>
        <div v-if="passwordError" class="invalid-feedback">{{passwordError}}</div>
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
            emailError: '',
            passwordError: '',
        };
    },
    methods: {
        validateForm(){
            this.emailError = '';
            this.passwordError = '';

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.email)) {
                this.emailError = 'Некорректный формат email'
                return false;
            }
            if (this.password.length < 6) {
                this.passwordError = 'Пароль должен быть не менее 6 символов';
                return false;
            }
            return true;
        },   
        async register() {
            if (!this.validateForm()){
                return;
            }
            try {
                const response = await axios.post('http://localhost:3000/api/register',{
                    email: this.email,
                    password: this.password
                });
                alert('Успешная регистрация: ' + response.data.message);
                this.$router.push('/login');
            } catch (error) {
                alert('Ошибка регистрации: ' + (error.response?.data?.message || 'Ошибка сервера'));
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