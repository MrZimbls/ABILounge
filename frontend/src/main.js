import { createApp } from 'vue'
import App from './App.vue'

import "./global.css"

import { createWebHistory, createRouter } from 'vue-router'

import LandingPage from './pages/LandingPage.vue'
import WeaponPage from './pages/WeaponPage.vue'
import AmmunitionPage from './pages/AmmunitionPage.vue'

const routes = [
  { path: '/', component: LandingPage },
  { path: '/weapons', component: WeaponPage },
  { path: '/ammunition', component: AmmunitionPage },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

createApp(App).use(router).mount('#app')
