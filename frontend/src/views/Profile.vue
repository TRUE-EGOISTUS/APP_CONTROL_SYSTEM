<template>
  <div class="container mt-5">
    <h2>Профиль</h2>
    <div v-if="user">
        <p><strong>Email:</strong>{{user.email}}</p>
        <p><strong>ID:</strong>{{user.id}}</p>
    </div>
    <div v-else>
        <p>Загрузка данных профиля...</p>
    </div>
    <button @click="logout" class="btn btn-danger">Выйти</button>
  </div>
</template>

<script>
import axios from 'axios'
export default {
    name: 'Profile',
    data() {
        return {
            user: null
        }
    },
    methods: {
        async fetchProfile() {
            try {
                const response = await axios.get('http://localhost:3000/api/profile', {
                    withCredentials: true
                });
                this.user = response.data.user;  
            } catch (error) {
                alert('Ошибка загрузки профиля:' + (error.response?.data?.message || 'Ошибка сервера'));
                this.$router.push('/login');
            }
        },
        async logout(){
            try {
                await axios.post('http://localhost:3000/api/logout', {}, {withCredentials: true});
                this.$router.push('/login');
            } catch (error) {
                alert('Ошибка входа:' + error.response?.data?.message || 'Ошибка сервера');
            }
        },
    },
    mounted() {
        this.fetchProfile();
    },
};
</script>

<style>

</style>