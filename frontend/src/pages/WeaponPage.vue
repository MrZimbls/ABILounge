<script setup>
import NavBar from '../components/NavBar.vue'
import WeaponStatFilter from '../components/WeaponStatFilter.vue'
</script>

<template>
  <div>
    <NavBar :disabledButton="'weapons'"/>
    <div style="padding: 2ch;">
      <WeaponStatFilter />
    </div>
  </div>
</template>

<style scoped></style>
