import { createRouter, createWebHistory } from 'vue-router';

// Определяем маршруты
const routes = [
  {
    path: '/', // URL для главной страницы
    name: 'HomePage',
    component: () => import('../views/HomePage.vue'), // Ссылаемся на HomePage.vue
  },
];

const router = createRouter({
  history: createWebHistory(), // Используем history mode
  routes,
});

export default router;