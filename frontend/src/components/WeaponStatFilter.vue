<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

// Configuration for all weapon stat filters
const filterConfigs = [
  {
    key: 'vRecoil',
    label: 'V. Recoil Control',
    min: 0,
    max: 1000,
  },
  {
    key: 'hRecoil',
    label: 'H. Recoil Control',
    min: 0,
    max: 1000,
  },
  {
    key: 'ergo',
    label: 'Ergonomics',
    min: 0,
    max: 1000,
  },
  {
    key: 'wStab',
    label: 'Weapon Stability',
    min: 0,
    max: 1000,
  },
  {
    key: 'accuracy',
    label: 'Accuracy',
    min: 0,
    max: 100,
  },
  {
    key: 'hfStab',
    label: 'Hip-Fire Stability',
    min: 0,
    max: 1000,
  },
  {
    key: 'range',
    label: 'Effective Range',
    min: 0,
    max: 10000,
  },
  {
    key: 'velocity',
    label: 'Muzzle Velocity',
    min: 0,
    max: 10000,
  },
  {
    key: 'rpm',
    label: 'Rate of Fire',
    min: 0,
    max: 10000,
  },
]

// Firing mode options
const firingModes = [
  { key: 'semi', label: 'Semi' },
  { key: 'burst', label: 'Burst' },
  { key: 'full', label: 'Full' }
]

// Reactive firing mode state from URL query (excluded modes)
const excludedFiringModes = computed({
  get: () => {
    const modes = route.query.excludedFiringModes
    return modes ? modes.split(',') : [] // Default to none excluded (all selected)
  },
  set: (value) => {
    updateExcludedFiringModes(value)
  }
})

const updateFilter = (key, value) => {
  router.push({
    path: route.path,
    query: { ...route.query, [key]: value || undefined },
  })
}

const updateExcludedFiringModes = (modes) => {
  router.push({
    path: route.path,
    query: { 
      ...route.query, 
      excludedFiringModes: modes.length > 0 ? modes.join(',') : undefined 
    },
  })
}

const toggleFiringMode = (mode) => {
  const currentExcluded = [...excludedFiringModes.value]
  const index = currentExcluded.indexOf(mode)
  
  if (index > -1) {
    // Remove from excluded list (checkbox becomes checked)
    currentExcluded.splice(index, 1)
  } else {
    // Add to excluded list (checkbox becomes unchecked)
    currentExcluded.push(mode)
  }
  
  excludedFiringModes.value = currentExcluded
}
</script>

<template>
  <div class="box" box-="round" shear-="top">
    <span class="header">Weapon stats filter</span>
    <div class="filters">
      <ul marker-="tree">
        <li v-for="config in filterConfigs" :key="config.key" class="filterRow">
          <p class="filterTitle">{{ config.label }}:</p>
          <input
            :value="route.query[config.key + 'Min'] || ''"
            @input="updateFilter(config.key + 'Min', $event.target.value)"
            placeholder="min"
            size-="small"
            type="number"
            :min="config.min"
            :max="config.max"
          />
          <input
            :value="route.query[config.key + 'Max'] || ''"
            @input="updateFilter(config.key + 'Max', $event.target.value)"
            placeholder="max"
            size-="small"
            type="number"
            :min="config.min"
            :max="config.max"
          />
        </li>
      </ul>
        <hr class="separator">
        <div class="firingModes">
          <label>Fire mode:</label>
          <ul marker-="tree">
            <li v-for="mode in firingModes" :key="mode.key" class="firingModeRow">
              <span class="filterTitle">{{ mode.label }}:</span>
              <input 
                type="checkbox" 
                :checked="!excludedFiringModes.includes(mode.key)"
                @change="toggleFiringMode(mode.key)"
              />
            </li>
          </ul>
        </div>
        <hr class="separator">
        <div class="priceFilter">
          <label>Price:</label>
          <input
            :value="route.query.priceMin || ''"
            @input="updateFilter('priceMin', $event.target.value)"
            placeholder="min"
            size-="small"
            type="number"
            min="0"
            max="1000000"
          />
          <input
            :value="route.query.priceMax || ''"
            @input="updateFilter('priceMax', $event.target.value)"
            placeholder="max"
            size-="small"
            type="number"
            min="0"
            max="1000000"
          />
        </div>
    </div>
  </div>
</template>

<style scoped>
.filterRow {
  display: flex;
  align-items: center;
  gap: 1ch;
}

.filterTitle {
  white-space: nowrap;
  width: 18ch;
  flex-shrink: 0;
}

.header {
  background-color: var(--background0);
  padding: 0 1ch;
}

input {
  flex: 1;
  min-width: 3ch;
  padding: 0.25ch;
  text-align: center;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  margin: 0;
}

.priceFilter {
  display: flex;
  align-items: center;
  gap: 1ch;
}

.priceFilter input {
  flex: 1;
  min-width: 5ch;
  padding: 0.25ch;
  text-align: center;
}

.separator {
  border: none;
  height: 1px;
  background-color: #666;
  margin: 0.8ch 0;
  width: 100%;
}

.firingModes .header {
  background-color: var(--background0);
  padding: 0 1ch;
}

.firingModeRow {
  display: flex;
  align-items: center;
  gap: 1ch;
}

.firingModeRow .filterTitle {
  white-space: nowrap;
  width: 6ch;
  flex-shrink: 0;
}

.firingModeRow input {
  cursor: pointer;
  margin: 0;
  vertical-align: middle;
  height: 1em;
  width: 1em;
}
</style>
