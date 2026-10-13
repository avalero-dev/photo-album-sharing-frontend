import '@fontsource/newsreader/400.css'
import '@fontsource/newsreader/500.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import 'vue-toastification/dist/index.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast, { POSITION, TYPE, type PluginOptions } from 'vue-toastification'

import App from './App.vue'
import router from './router'

const toastOptions: PluginOptions = {
  position: POSITION.BOTTOM_RIGHT,
  timeout: 3000,
  // Design D2: los errores disponen de más tiempo de lectura que los éxitos.
  toastDefaults: {
    [TYPE.ERROR]: { timeout: 8000 },
    [TYPE.SUCCESS]: { timeout: 3000 },
  },
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Toast, toastOptions)

app.mount('#app')
