<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed, ref } from 'vue'

const router = useRouter()
const route = useRoute()

// Available stats to sort by
const statOptions = [
  { key: 'vRecoil', label: 'V. Recoil Control' },
  { key: 'hRecoil', label: 'H. Recoil Control' },
  { key: 'ergo', label: 'Ergonomics' },
  { key: 'wStab', label: 'Weapon Stability' },
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'hfStab', label: 'Hip-Fire Stability' },
  { key: 'range', label: 'Effective Range' },
  { key: 'velocity', label: 'Muzzle Velocity' },
  { key: 'rpm', label: 'Rate of Fire' },
  { key: 'price', label: 'Price' },
]

// Reactive selected stat from URL query
const selectedSortStat = computed({
  get: () => (route.query.sortStat || ''),
  set: (value) => {
    router.push({
      path: route.path,
      query: { ...route.query, sortStat: value || undefined },
    })
  },
})

// Reactive sort order (asc/desc) from URL query
const isAscending = computed({
  get: () => {
    const order = (route.query.sortOrder || 'asc').toString().toLowerCase()
    return order !== 'desc'
  },
  set: (value) => {
    router.push({
      path: route.path,
      query: { ...route.query, sortOrder: value ? 'asc' : 'desc' },
    })
  },
})

// Popover state for selecting stat
const isPopoverOpen = ref(false)
const searchQuery = ref('')

const filteredStatOptions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return statOptions
  return statOptions.filter((opt) =>
    opt.label.toLowerCase().includes(q) || opt.key.toLowerCase().includes(q)
  )
})

const handleInputFocus = () => {
  isPopoverOpen.value = true
}

const handleInputBlur = () => {
  setTimeout(() => {
    isPopoverOpen.value = false
  }, 200)
}

const chooseStat = (opt) => {
  selectedSortStat.value = opt.key
  searchQuery.value = ''
  isPopoverOpen.value = false
}

const clearSelection = () => {
  selectedSortStat.value = ''
}

</script>

<template>
  <div class="box" box-="round" shear-="top">
    <span class="header" is-="badge" variant-="blue">sort</span>
    <div class="sortControls">
      <div class="statPicker">
        <label>Sort by:</label>
        <div class="inputWrapper">
          <input
            :value="selectedSortStat ? (statOptions.find(o => o.key === selectedSortStat)?.label || selectedSortStat) : searchQuery"
            @input="searchQuery = $event.target.value"
            @focus="handleInputFocus"
            @blur="handleInputBlur"
            :placeholder="selectedSortStat ? '' : 'Search stat to sort...'"
            size-="small"
            type="text"
            :readonly="!!selectedSortStat"
          />
          <button v-if="selectedSortStat" size-="small" @click="clearSelection">Clear</button>
          <div v-if="!selectedSortStat && isPopoverOpen && filteredStatOptions.length > 0" class="popover">
            <div
              v-for="opt in filteredStatOptions"
              :key="opt.key"
              class="popoverItem"
              @mousedown.prevent="chooseStat(opt)"
            >
              {{ opt.label }}
            </div>
          </div>
        </div>
      </div>
      <div class="orderPicker">
        <label>Ascending</label>
        <input type="checkbox" is-="switch" bar-="thin" :checked="isAscending" @change="isAscending = $event.target.checked" />
        <label>Descending</label>
      </div>
    </div>
  </div>
  
</template>

<style scoped>
.sortControls {
  display: flex;
  gap: 2ch;
  align-items: center;
}

.statPicker {
  display: flex;
  align-items: center;
  gap: 1ch;
  flex: 1;
}

.inputWrapper {
  position: relative;
  flex: 1;
}

.popover {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--background1);
  border: 1px solid var(--fg);
  border-radius: 4px;
  max-height: 20ch;
  overflow-y: auto;
  z-index: 100;
  margin-top: 0.25ch;
}

.popoverItem {
  padding: 0.5ch 1ch;
  cursor: pointer;
}

.popoverItem:hover {
  background-color: var(--background0);
}

.orderPicker {
  display: flex;
  align-items: center;
  gap: 1ch;
}

input[is-='switch'] {
  --switch-thumb-color: var(--foreground0);
  --switch-track-color: var(--background1);
}
</style>
