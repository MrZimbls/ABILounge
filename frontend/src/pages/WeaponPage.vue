<script setup>
import { ref } from 'vue'
import NavBar from '../components/NavBar.vue'
import WeaponStatFilter from '../components/WeaponStatFilter.vue'
import WeaponTypeFilter from '../components/WeaponTypeFilter.vue'
import WeaponSelectSort from '../components/WeaponSelectSort.vue'
import WeaponFilteredList from '../components/WeaponFilteredList.vue'

const refreshTick = ref(0)
const refreshResults = () => { refreshTick.value += 1 }
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
    <div class="mainArea">
      <aside class="sidebar">
        <WeaponStatFilter />
        <div style="margin-top: 1ch; display: flex;">
          <button @click="refreshResults" style="width: 100%;" size-="small">Refresh results</button>
        </div>
      </aside>
      <section class="rightContent">
        <WeaponFilteredList :refresh-tick="refreshTick" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.mainArea {
  display: flex;
  gap: 2ch;
  align-items: stretch;
  margin-top: 2ch;
}

.sidebar {
  flex: 0 0 20%;
  min-width: 33ch;
}

.rightContent { flex: 1 1 auto; min-width: 0; }

.topRow {
  display: flex;
  gap: 2ch;
  align-items: stretch;
}

.typeCol { flex: 1 1 auto; min-width: 0; }
.sortCol { flex: 0 0 auto; z-index: 100;}

/* rightContent will host future combined list+preview component */
</style>
