import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../App.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Profile from '../views/Profile.vue';
import Projects from '../views/Projects.vue';
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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      await axios.get('http://localhost:3000/api/profile', { withCredentials: true });
      next();
    } catch (error) {
      next('/login');
    }
  } else {
    next();
  }
});
export default router;