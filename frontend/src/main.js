import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'bootstrap/dist/css/bootstrap.min.css'; // CSS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // JS бандл с Modal и другими компонентами

const app = createApp(App);
app.use(router);
app.mount('#app');