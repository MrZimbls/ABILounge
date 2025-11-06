<script setup>
import { ref } from 'vue'
import NavBar from '../components/NavBar.vue'
import BuildStatFilter from '../components/BuildStatFilter.vue'
import BuildWeaponFilter from '../components/BuildWeaponFilter.vue'
import BuildTagFilter from '../components/BuildTagFilter.vue'
import BuildSearch from '../components/BuildSearch.vue'
import BuildSelectSort from '../components/BuildSelectSort.vue'
import BuildFilteredList from '../components/BuildFilteredList.vue'

const refreshTick = ref(0)
const refreshResults = () => { refreshTick.value += 1 }
</script>

<template>
  <div>
    <NavBar :disabledButton="'builds'"/>
    <div class="topRow">
      <div class="searchCol">
        <BuildSearch />
      </div>
      <div class="sortCol">
        <BuildSelectSort />
      </div>
    </div>
    <div class="mainArea">
      <aside class="sidebar">
        <div class="sidebar-item" style="position: relative; z-index: 100;">
          <BuildTagFilter />
        </div>
        <div class="sidebar-item" style="position: relative; z-index: 90;">
          <BuildWeaponFilter />
        </div>
        <div class="sidebar-item" style="position: relative; z-index: 80;">
          <BuildStatFilter />
        </div>
        <div style="margin-top: 1ch; display: flex;">
          <button @click="refreshResults" style="width: 100%;" size-="small">Refresh results</button>
        </div>
      </aside>
      <section class="rightContent">
        <BuildFilteredList :refresh-tick="refreshTick" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.mainArea {
  display: flex;
  gap: 2ch;
  align-items: stretch;
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
  margin-top: 2ch;
  flex-wrap: wrap;
}

.searchCol { flex: 1 1 auto; min-width: 20ch; }
.sortCol { flex: 0 0 auto; z-index: 100; }

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1ch;
}

/* rightContent will host future combined list+preview component */
</style>

