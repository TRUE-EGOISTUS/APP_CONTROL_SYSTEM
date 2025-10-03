import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: () => import('../App.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;