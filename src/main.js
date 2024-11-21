import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/mbo.css'
import './assets/tailwindcss.css'
import naive from 'naive-ui'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(naive)
app.mount('#app')