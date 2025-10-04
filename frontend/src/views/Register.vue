<template>
  <div class="container mt-5">
    <h2>Регистрация</h2>
    <form @submit.prevent="register">
        <div class="mb-3">
            <label for="email" class="form-label">Логин</label>
            <input type="email" 
            class="form-control" 
            :class="{'is-invalid': emailError}"
            id="email" 
            v-model.trim="email" 
            placeholder="Введите логин" required/>
        <div v-if="emailError" 
        class="invalid-feedback">{{emailError}}</div>
        </div>
         <div class="mb-3">
            <label for="password" class="form-label">Пароль</label>
            <div class="input-group">
            <input 
            :type="showPassword ? 'text': 'password' " 
            class="form-control" 
            :class="{'is-invalid': passwordError}" 
            id="password" 
            v-model.trim="password" 
            placeholder="Введите пароль (мин. 6 символов)" 
            required/>
            <button type="button"
            class="btn btn-outline-secondary" 
            @click="togglePassword"
            >
            <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
        <div v-if="passwordError" class="invalid-feedback">{{passwordError}}</div>
        </div>
    </div>
          <div class="mb-3">
            <label for="confirmPassword" 
            class="form-label">Потверждение пароля</label>
            <div class="input-group">
            <input :type="showConfirmPassword ? 'text' :'password'" 
            class="form-control" 
            :class="{'is-invalid': confirmPasswordError}" 
            id="confirmPassword" 
            v-model.trim="confirmPassword" 
            placeholder="Повторите пароль" required/>
            <button type="button" class="btn btn-outline-secondary" @click="toggleConfirmPassword">
                 <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
        <div v-if="confirmPasswordError" class="invalid-feedback">{{confirmPasswordError}}</div>
        </div>
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
            confirmPassword: '',
            emailError: '',
            passwordError: '',
            confirmPasswordError: '',
            showPassword: false,
            showConfirmPassword: false
        };
    },
    methods: {
        validateForm(){
            this.emailError = '';
            this.passwordError = '';
            this.confirmPasswordError = '';
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.email)) {
                this.emailError = 'Некорректный формат email'
                return false;
            }
            if (this.password.length < 6) {
                this.passwordError = 'Пароль должен быть не менее 6 символов';
                return false;
            }
            const passwordTrimmed = this.password.trim();
            const confirmPasswordTrimmed = this.confirmPassword.trim();
            if (passwordTrimmed !== confirmPasswordTrimmed) {
                this.confirmPasswordError = 'Пароли не совпадают';
                console.log('Пароли не совпадают:', passwordTrimmed, 'vs', confirmPasswordTrimmed);
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
                }, {withCredentials: true});
                alert('Успешная регистрация: ' + response.data.message);
                this.$router.push('/login');
            } catch (error) {
                alert('Ошибка регистрации: ' + (error.response?.data?.message || 'Ошибка сервера'));
            }
        },
    togglePassword(){
        this.showPassword = !this.showPassword;
    },
    toggleConfirmPassword(){
        this.showConfirmPassword = !this.showConfirmPassword;
    }
    },
};
</script>
<style scoped>
.container{
    max-width: 400px;
    margin-top: 60px;
}
.input-group .btn{
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>