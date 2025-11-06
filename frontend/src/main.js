import { createApp } from 'vue'
import App from './App.vue'

import "./global.css"

import { createWebHistory, createRouter } from 'vue-router'

import LandingPage from './pages/LandingPage.vue'
import WeaponPage from './pages/WeaponPage.vue'
import AmmunitionPage from './pages/AmmunitionPage.vue'
import BuildsPage from './pages/BuildsPage.vue'
import { useAuth } from './composables/useAuth.js'

const routes = [
  { path: '/', component: LandingPage },
  { 
    path: '/weapons', 
    component: WeaponPage,
    meta: { requiresAuth: true, minRole: 'viewer' }
  },
  { 
    path: '/ammunition', 
    component: AmmunitionPage,
    meta: { requiresAuth: true, minRole: 'viewer' }
  },
  { 
    path: '/builds', 
    component: BuildsPage,
    meta: { requiresAuth: true, minRole: 'viewer' }
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard to protect routes
router.beforeEach((to, from, next) => {
  // Load auth state from localStorage
  const { isAuthenticated, hasMinimumRole, loadStoredAuth } = useAuth()
  loadStoredAuth()
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!isAuthenticated.value) {
      // Redirect to landing page if not authenticated
      next('/')
      return
    }
    
    // Check role requirement
    const minRole = to.meta.minRole || 'viewer'
    if (!hasMinimumRole(minRole)) {
      // Redirect to landing page if insufficient role
      next('/')
      return
    }
  }
  
  next()
})

createApp(App).use(router).mount('#app')
