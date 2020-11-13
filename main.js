import 'babel-polyfill'
import { createApp } from 'vue'
import App from './app.vue'

import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

import './customization.css'
import 'line-awesome/dist/line-awesome/css/line-awesome.min.css'

import 'xterm/css/xterm.css'
import 'xterm/lib/xterm.js'

const app = createApp(App)

import InputSwitch from 'primevue/inputswitch'
app.component('InputSwitch', InputSwitch)

import Menu from 'primevue/menu'
app.component('Menu', Menu)

import InputText from 'primevue/inputtext'
app.component('InputText', InputText)

import ToastService from 'primevue/toastservice'
app.use(ToastService)

import Toast from 'primevue/toast'
app.component('Toast', Toast)

import Button from 'primevue/button'
app.component('Button', Button)

import SplitButton from 'primevue/splitbutton'
app.component('SplitButton', SplitButton)

import Dialog from 'primevue/dialog'
app.component('Dialog', Dialog)

import Fieldset from 'primevue/fieldset'
app.component('Fieldset', Fieldset)

import Listbox from 'primevue/listbox'
app.component('Listbox', Listbox)

import Toolbar from 'primevue/toolbar'
app.component('Toolbar', Toolbar)

import Dropdown from 'primevue/dropdown'
app.component('Dropdown', Dropdown)

import Sidebar from 'primevue/sidebar'
app.component('Sidebar', Sidebar)

import Checkbox from 'primevue/checkbox'
app.component('Checkbox', Checkbox)

import TabView from 'primevue/tabview'
app.component('TabView', TabView)

import TabPanel from 'primevue/tabpanel'
app.component('TabPanel', TabPanel)

import DataTable from 'primevue/datatable'
app.component('DataTable', DataTable)

import Column from 'primevue/column'
app.component('Column', Column)

import Tree from 'primevue/tree'
app.component('Tree', Tree)

import Textarea from 'primevue/textarea'
app.component('Textarea', Textarea)

import ProgressBar from 'primevue/progressbar'
app.component('ProgressBar', ProgressBar)

app.mount('#app')
