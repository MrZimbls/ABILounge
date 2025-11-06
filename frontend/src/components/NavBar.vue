<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

defineProps({
  disabledButton: {
    type: String,
    default: null
  }
})

const router = useRouter()
const { logout } = useAuth()

const navigateToLandingPage = () => {
  router.push('/')
}

const navigateToWeapons = () => {
  router.push('/weapons')
}

const navigateToAmmunition = () => {
  router.push('/ammunition')
}

const navigateToBuilds = () => {
  router.push('/builds')
}

const navigateToKits = () => {
  // router.push('/kits')
  console.log('Navigating to kits (not implemented yet)')
}

const navigateToAbout = () => {
  // router.push('/about')
  console.log('Navigating to about (not implemented yet)')
}

const handleReauthenticate = () => {
  logout()
  router.push('/')
}
</script>

<template>
  <div class="box" box-="round" shear-="top">
    <span class="header">Nav</span>
    <div class="navbar-content">
      <span @click="navigateToLandingPage" is-="badge" cap-="round ribbon" variant-="yellow">ABILounge: </span>
      <div class="button-wrapper">
        <button 
          @click="navigateToWeapons" 
          class="button" 
          size-="small" 
          variant-="orange"
          :disabled="disabledButton === 'weapons'">
          Weapons
        </button>
        <button 
          @click="navigateToAmmunition" 
          class="button" 
          size-="small" 
          variant-="blue"
          :disabled="disabledButton === 'ammunition'">
          Ammunition
        </button>
        <button 
          @click="navigateToBuilds" 
          class="button" 
          size-="small" 
          variant-="purple"
          :disabled="disabledButton === 'builds'">
          Builds
        </button>
        <button 
          @click="navigateToKits" 
          class="button" 
          size-="small" 
          variant-="aqua"
          :disabled="disabledButton === 'kits'">
          Kits
        </button>
        <button 
          @click="navigateToAbout" 
          class="button" 
          size-="small" 
          variant-="green"
          :disabled="disabledButton === 'about'">
          About
        </button>
      </div>
      <div class="right-actions">
        <button 
          @click="handleReauthenticate" 
          class="button" 
          size-="small" 
          variant-="red">
          Re-authenticate
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  background-color: var(--background0);
  padding: 0 1ch;
}

.navbar-content {
  display: flex;
  align-items: center;
  gap: 1ch;
  justify-content: space-between;
  width: 100%;
}

.button-wrapper {
  display: flex;
  gap: 2ch;
  padding-left: 4ch;
}

.right-actions {
  display: flex;
  gap: 2ch;
  margin-left: auto;
}

.button-wrapper button:disabled {
  text-decoration: underline !important;
  font-weight: bold !important;
}
</style>

<style>
/* Target badge using the proper selector */
span[is~='badge'] {
  cursor: pointer;
}
</style>
