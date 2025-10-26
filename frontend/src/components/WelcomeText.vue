<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateToWeapons = () => {
  router.push('/weapons')
}

const asciiArt = `
   █████╗ ██████╗ ██╗   ██╗      ██████╗ ██╗   ██╗███╗   ██╗ ██████╗ ███████╗  
  ██╔══██╗██╔══██╗██║   ██║     ██╔═══██╗██║   ██║████╗  ██║██╔════╝ ██╔════╝  
  ███████║██████╔╝██║   ██║     ██║   ██║██║   ██║██╔██╗ ██║██║  ███╗█████╗    
  ██╔══██║██╔══██╗██║   ██║     ██║   ██║██║   ██║██║╚██╗██║██║   ██║██╔══╝    
  ██║  ██║██████╔╝██║   ███████╗╚██████╔╝╚██████╔╝██║ ╚████║╚██████╔╝███████╗  
  ╚═╝  ╚═╝╚═════╝ ╚═╝   ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝  
  `
</script>

<template>
  <div class="box" box-="round" shear-="bottom">
    <pre class="ascii-art">{{ asciiArt }}</pre>
    <div class="button-wrapper">
      <button @click="navigateToWeapons" class="button" variant-="orange">Weapons</button>
      <button @click="navigateToWeapons" class="button" variant-="purple">Builds</button>
      <button @click="navigateToWeapons" class="button" variant-="aqua">Kits</button>
      <button @click="navigateToWeapons" class="button" variant-="green">About</button>
    </div>
    <div class="header">
      <span>Welcome to the Lounge</span>
    </div>
  </div>
</template>

<style scoped>
.ascii-art {
  color: var(--yellow);
}
.button-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 2ch;
  padding: 0 2ch 1ch 2ch;
}
.button{
  flex: 1;
}
.header {
  display: flex;
  justify-content: space-between;
}
span {
  background-color: var(--background0);
  padding: 0 1ch;
}
</style>
