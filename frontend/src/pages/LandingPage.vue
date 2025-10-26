<script setup>
import WelcomeText from '../components/WelcomeText.vue'
</script>

<template>
  <div class="flex-container">
    <WelcomeText/>
  </div>
</template>

<style scoped>
.flex-container {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  align-content: center;
  height: 100vh;
  background-color: var(--background0);
}
</style>
