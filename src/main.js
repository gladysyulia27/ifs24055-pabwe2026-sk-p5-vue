import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createAppRouter } from './router'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'

createApp(App).use(createPinia()).use(createAppRouter()).mount('#app')
