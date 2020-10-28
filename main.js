import 'babel-polyfill'
import { createApp } from 'vue'
import App from './app.vue'

import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

import './customization.css'
import 'line-awesome/dist/line-awesome/css/line-awesome.min.css'

const app = createApp(App)

import InputSwitch from 'primevue/inputswitch'
app.component('InputSwitch', InputSwitch)

import Sidebar from 'primevue/sidebar'
app.component('Sidebar', Sidebar)

import Menu from 'primevue/menu'
app.component('Menu', Menu)

import InputText from 'primevue/inputtext'
app.component('InputText', InputText)

import ToastService from 'primevue/toastservice'
app.use(ToastService)

import Toast from 'primevue/toast'
app.component('Toast', Toast)

import SplitButton from 'primevue/splitbutton'
app.component('SplitButton', SplitButton)

import Dialog from 'primevue/dialog'
app.component('Dialog', Dialog)

import Fieldset from 'primevue/fieldset'
app.component('Fieldset', Fieldset)

app.mount('#app')
