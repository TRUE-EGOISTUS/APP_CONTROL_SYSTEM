import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Projects from '../views/Projects.vue';
import Defects from '../views/Defects.vue';
import Home from '../views/Home.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/projects',
    name: 'Projects',
    component: Projects,
    meta: { requiresAuth: true }
  },
  {
    path: '/defects/:projectId',
    name: 'Defects',
    component: Defects,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Защита маршрутов с проверкой куки
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (to.meta.requiresAuth && !isAuthenticated) {
    try {
      await axios.get('http://localhost:3000/api/profile', { withCredentials: true });
      localStorage.setItem('isAuthenticated', 'true');
    } catch (error) {
      localStorage.removeItem('isAuthenticated');
      if (to.path !== '/login') {
        next('/login');
        return;
      }
    }
  }
  next();
});

export default router;