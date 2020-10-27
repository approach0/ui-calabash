import 'babel-polyfill'
import { createApp } from 'vue'
import App from './app.vue'

import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

import './customization.css'
import 'line-awesome/dist/line-awesome/css/line-awesome.min.css'

const app = createApp(App)

import Toolbar from 'primevue/toolbar'
app.component('Toolbar', Toolbar)

import InputSwitch from 'primevue/inputswitch'
app.component('InputSwitch', InputSwitch)

app.mount('#app')
