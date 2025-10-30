<script setup>
import NavBar from '../components/NavBar.vue'
import WeaponStatFilter from '../components/WeaponStatFilter.vue'
import WeaponTypeFilter from '../components/WeaponTypeFilter.vue'
import WeaponSelectSort from '../components/WeaponSelectSort.vue'
</script>

<template>
  <div>
    <NavBar :disabledButton="'weapons'"/>
    <div class="topRow">
      <div class="typeCol">
        <WeaponTypeFilter />
      </div>
      <div class="sortCol">
        <WeaponSelectSort />
      </div>
    </div>
    <WeaponStatFilter />
  </div>
</template>

<style scoped>
.topRow {
  display: flex;
  gap: 2ch;
  align-items: stretch;
}

.typeCol { flex: 1 1 auto; min-width: 0; }
.sortCol { flex: 0 0 auto; z-index: 100;}
</style>
