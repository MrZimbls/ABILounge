<script setup>
import { useRouter } from 'vue-router'

defineProps({
  disabledButton: {
    type: String,
    default: null
  }
})

const router = useRouter()

const navigateToLandingPage = () => {
  router.push('/')
}

const navigateToWeapons = () => {
  router.push('/weapons')
}

const navigateToBuilds = () => {
  // router.push('/builds')
  console.log('Navigating to builds (not implemented yet)')
}

const navigateToKits = () => {
  // router.push('/kits')
  console.log('Navigating to kits (not implemented yet)')
}

const navigateToAbout = () => {
  // router.push('/about')
  console.log('Navigating to about (not implemented yet)')
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
}

.button-wrapper {
  display: flex;
  gap: 2ch;
  padding-left: 4ch;
}
</style>

<style>
/* Target badge using the proper selector */
span[is~='badge'] {
  cursor: pointer;
}
</style>
