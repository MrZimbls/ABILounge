<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed, ref } from 'vue'

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

// Ammunition type options
const ammunitionTypes = [
  '5.45x39mm',
  '5.56x45mm',
  '7.62x39mm',
  '7.62x51mm',
  '7.62x54mmR',
  '9x19mm',
  '9x21mm',
  '9x39mm',
  '12.7x55mm',
  '4.6x30mm',
  '5.7x28mm',
  '.366 TKM',
  '.45 ACP',
  '12x70mm',
  '20x70mm',
  '23x75mm',
  '9x18mm',
  '9x33mmR',
  '40x46mm',
  '30x29mm',
]

// Reactive firing mode state from URL query (excluded modes)
const excludedFiringModes = computed({
  get: () => {
    const modes = route.query.excludedFiringModes
    return modes ? modes.split(',') : []
  },
  set: (value) => {
    updateExcludedFiringModes(value)
  }
})

// Reactive ammunition types state from URL query
const selectedAmmunitionTypes = computed({
  get: () => {
    const types = route.query.ammunitionTypes
    return types ? types.split(',') : []
  },
  set: (value) => {
    updateAmmunitionTypes(value)
  }
})

// Popover state
const isPopoverOpen = ref(false)
const searchQuery = ref('')

// Filtered ammunition types based on search query
const filteredAmmunitionTypes = computed(() => {
  if (!searchQuery.value) {
    return ammunitionTypes.filter(type => !selectedAmmunitionTypes.value.includes(type))
  }
  return ammunitionTypes.filter(type => 
    !selectedAmmunitionTypes.value.includes(type) &&
    type.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
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

const updateAmmunitionTypes = (types) => {
  router.push({
    path: route.path,
    query: { 
      ...route.query, 
      ammunitionTypes: types.length > 0 ? types.join(',') : undefined 
    },
  })
}

const toggleFiringMode = (mode) => {
  const currentExcluded = [...excludedFiringModes.value]
  const index = currentExcluded.indexOf(mode)
  
  if (index > -1) {
    currentExcluded.splice(index, 1)
  } else {
    currentExcluded.push(mode)
  }
  
  excludedFiringModes.value = currentExcluded
}

const addAmmunitionType = (type) => {
  const currentTypes = [...selectedAmmunitionTypes.value]
  if (!currentTypes.includes(type)) {
    currentTypes.push(type)
    selectedAmmunitionTypes.value = currentTypes
  }
  searchQuery.value = ''
  isPopoverOpen.value = false
}

const removeAmmunitionType = (type) => {
  const currentTypes = selectedAmmunitionTypes.value.filter(t => t !== type)
  selectedAmmunitionTypes.value = currentTypes
}

const handleInputFocus = () => {
  isPopoverOpen.value = true
}

const handleInputBlur = () => {
  // Delay hiding popover to allow clicks on items
  setTimeout(() => {
    isPopoverOpen.value = false
  }, 200)
}
</script>

<template>
  <div class="box" box-="round" shear-="top">
    <span class="header" is-="badge" variant-="red">stat-filter</span>
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
        <div class="ammunitionFilter">
          <label>Ammunition:</label>
          <div class="ammunitionInputWrapper">
            <input
              v-model="searchQuery"
              @focus="handleInputFocus"
              @blur="handleInputBlur"
              placeholder="Search ammunition type..."
              size-="small"
              type="text"
            />
            <div v-if="isPopoverOpen && filteredAmmunitionTypes.length > 0" class="ammunitionPopover">
              <div
                v-for="ammo in filteredAmmunitionTypes"
                :key="ammo"
                class="ammunitionItem"
                @mousedown.prevent="addAmmunitionType(ammo)"
              >
                {{ ammo }}
              </div>
            </div>
          </div>
          <div v-if="selectedAmmunitionTypes.length > 0" class="selectedAmmunition">
            <span
              v-for="ammo in selectedAmmunitionTypes"
              :key="ammo"
              class="ammunitionTag"
              @click="removeAmmunitionType(ammo)"
            >
              {{ ammo }}
            </span>
          </div>
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
  gap: 1ch;
}

.filterTitle {
  width: 19ch;
  flex-shrink: 0;
}

.priceFilter {
  display: flex;
  gap: 1ch;
}

.firingModeRow {
  display: flex;
  gap: 1ch;
}

.firingModeRow .filterTitle {
  width: 6ch;
  flex-shrink: 0;
}

input {
  flex: 1;
  min-width: 4ch;
}

.separator {
  background-color: var(--fg);
  border: none;
  height: 1px;
  margin: 0.75ch;
}

.ammunitionFilter {
  display: flex;
  flex-direction: column;
  gap: 0.5ch;
}

.ammunitionInputWrapper {
  position: relative;
}

.ammunitionPopover {
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

.ammunitionItem {
  padding: 0.5ch 1ch;
  cursor: pointer;
}

.ammunitionItem:hover {
  background-color: var(--background0);
}

.selectedAmmunition {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5ch;
}

.ammunitionTag {
  display: inline-block;
  padding: 0.25ch 0.75ch;
  background-color: var(--blue);
  color: var(--background0);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.ammunitionTag:hover {
  background-color: var(--red);
}
</style>
