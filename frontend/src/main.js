import { createApp } from 'vue'
import App from './App.vue'

import "./global.css"

import { createWebHistory, createRouter } from 'vue-router'

import LandingPage from './pages/LandingPage.vue'
import WeaponPage from './pages/WeaponPage.vue'

const routes = [
  { path: '/', component: LandingPage },
  { path: '/weapons', component: WeaponPage },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

createApp(App).use(router).mount('#app')
