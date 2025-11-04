import { ref, computed } from 'vue'
import { authenticateDemoCode } from '../api/auth.js'

// Global auth state
const user = ref(null)
const isAuthenticated = computed(() => user.value !== null)
const userRole = computed(() => user.value?.role || null)

// Role hierarchy: viewer < developer < admin
const roleHierarchy = {
  viewer: 1,
  developer: 2,
  admin: 3
}

export function useAuth() {
  const hasMinimumRole = (requiredRole) => {
    if (!isAuthenticated.value) return false
    const userLevel = roleHierarchy[userRole.value] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0
    return userLevel >= requiredLevel
  }

  const login = async (code) => {
    try {
      const response = await authenticateDemoCode(code)
      if (response.success) {
        user.value = {
          code: response.code,
          role: response.role,
          last_use: response.last_use
        }
        // Store in localStorage for persistence
        localStorage.setItem('auth_user', JSON.stringify(user.value))
        return { success: true }
      }
      return { success: false, error: 'Invalid response' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    user.value = null
    localStorage.removeItem('auth_user')
  }

  const loadStoredAuth = () => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        user.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error)
      localStorage.removeItem('auth_user')
    }
  }

  return {
    user,
    isAuthenticated,
    userRole,
    hasMinimumRole,
    login,
    logout,
    loadStoredAuth
  }
}

