<script setup>
import NavBar from '../components/NavBar.vue'
import WeaponStatFilter from '../components/WeaponStatFilter.vue'
import WeaponTypeFilter from '../components/WeaponTypeFilter.vue'
</script>

<template>
  <div>
    <NavBar :disabledButton="'weapons'"/>
    <WeaponTypeFilter />
    <WeaponStatFilter />
  </div>
</template>

<style scoped></style>
