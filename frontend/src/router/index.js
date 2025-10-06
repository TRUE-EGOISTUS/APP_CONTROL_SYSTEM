import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../App.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Profile from '../views/Profile.vue';
import Projects from '../views/Projects.vue';
import Defects from '../views/Defects.vue';
import axios  from 'axios';
const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: HomePage,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path:'/projects',
    name:'Projects',
    component: Projects,
    meta: { requiresAuth: true }
  },
  { 
    path:'/defects/:projectId',
    name: 'Defects',
    component: Defects,
    meta: {requiresAuth:true}
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
router.beforeEach(async (to, from, next) => {
  console.log('Router: Переход на:', to.path);
  if (to.meta.requiresAuth) {
    try {
      console.log('Router: Проверка авторизации для', to.path);
      const response = await axios.get('http://localhost:3000/api/profile', { withCredentials: true });
      console.log('Router: Проверка авторизации успешна:', response.data);
      next();
    } catch (error) {
      console.error('Router: Ошибка проверки авторизации:', error.response?.data || error.message);
      console.log('Router: Перенаправление на /login');
      next('/login');
    }
  } else {
    console.log('Router: Доступ без авторизации к', to.path);
    next();
  }
});
export default router;