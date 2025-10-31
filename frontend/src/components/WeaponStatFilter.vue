<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed, ref, reactive, watch } from 'vue'

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

// Hardcoded ammunition map (id -> name) from backend/ammunition.csv
const AMMO_ID_TO_NAME = Object.freeze({
  '1': '9x19',
  '2': '.44',
  '3': '7.62x25',
  '4': '.45',
  '5': '5.7x28',
  '6': '7.62x39',
  '7': '5.56x45',
  '8': '7.62x51',
  '9': '5.45x39',
  '10': '5.8x42',
  '11': '12x70',
  '12': '7.62x54',
  '13': '9x39',
  '14': '.338',
})
const ammoIdToLabel = AMMO_ID_TO_NAME

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

// Reactive ammunition state from URL query (store IDs under old key)
const selectedAmmunitionTypes = computed({
  get: () => {
    const ids = route.query.ammunitionTypes
    return ids ? String(ids).split(',').filter(Boolean) : []
  },
  set: (value) => {
    updateAmmunitionTypes(value)
  }
})

// Popover state
const isPopoverOpen = ref(false)
const searchQuery = ref('')

// Filtered ammunition options based on search query and excluding selected IDs
const filteredAmmunition = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const selected = new Set(selectedAmmunitionTypes.value)
  const entries = Object.entries(AMMO_ID_TO_NAME).map(([id, name]) => ({ id, name }))
  return entries.filter(a => {
    if (selected.has(String(a.id))) return false
    if (!query) return true
    return String(a.name || '').toLowerCase().includes(query)
  })
})

const updateFilter = (key, value) => {
  router.push({
    path: route.path,
    query: { ...route.query, [key]: value || undefined },
  })
}

// Local state for number inputs so user can see invalid/conflicting values without pushing to URL
const inputValues = reactive({})
const invalidFields = reactive({})
const conflictFields = reactive({})
const keyToBounds = reactive({})

const initInputValuesFromRoute = () => {
  // Stats
  for (const cfg of filterConfigs) {
    const minKey = cfg.key + 'Min'
    const maxKey = cfg.key + 'Max'
    inputValues[minKey] = route.query[minKey] || ''
    inputValues[maxKey] = route.query[maxKey] || ''
    invalidFields[minKey] = false
    invalidFields[maxKey] = false
    conflictFields[minKey] = false
    conflictFields[maxKey] = false
    keyToBounds[minKey] = { min: cfg.min, max: cfg.max }
    keyToBounds[maxKey] = { min: cfg.min, max: cfg.max }
  }
  // Price
  inputValues.priceMin = route.query.priceMin || ''
  inputValues.priceMax = route.query.priceMax || ''
  invalidFields.priceMin = false
  invalidFields.priceMax = false
  conflictFields.priceMin = false
  conflictFields.priceMax = false
  keyToBounds.priceMin = { min: 0, max: 1000000 }
  keyToBounds.priceMax = { min: 0, max: 1000000 }
}

initInputValuesFromRoute()

// Selectively sync from route to avoid wiping user-typed invalid/conflicting inputs
watch(
  () => route.query,
  () => {
    // Stats
    for (const cfg of filterConfigs) {
      const minKey = cfg.key + 'Min'
      const maxKey = cfg.key + 'Max'
      if (!invalidFields[minKey] && !conflictFields[minKey]) {
        inputValues[minKey] = route.query[minKey] || ''
      }
      if (!invalidFields[maxKey] && !conflictFields[maxKey]) {
        inputValues[maxKey] = route.query[maxKey] || ''
      }
    }
    // Price
    if (!invalidFields.priceMin && !conflictFields.priceMin) {
      inputValues.priceMin = route.query.priceMin || ''
    }
    if (!invalidFields.priceMax && !conflictFields.priceMax) {
      inputValues.priceMax = route.query.priceMax || ''
    }
  }
)

const getPairKeys = (fieldKey) => {
  if (fieldKey.endsWith('Min')) {
    return { minKey: fieldKey, maxKey: fieldKey.slice(0, -3) + 'Max' }
  }
  if (fieldKey.endsWith('Max')) {
    return { minKey: fieldKey.slice(0, -3) + 'Min', maxKey: fieldKey }
  }
  if (fieldKey.startsWith('price')) {
    return { minKey: 'priceMin', maxKey: 'priceMax' }
  }
  return { minKey: fieldKey, maxKey: fieldKey }
}

const reconcilePairByField = (fieldKey) => {
  const { minKey, maxKey } = getPairKeys(fieldKey)
  const minStr = inputValues[minKey]
  const maxStr = inputValues[maxKey]

  const hasMin = minStr !== ''
  const hasMax = maxStr !== ''

  const minNum = Number(minStr)
  const maxNum = Number(maxStr)

  const minIsValid = hasMin && !Number.isNaN(minNum) && minNum >= keyToBounds[minKey].min && minNum <= keyToBounds[minKey].max && !invalidFields[minKey]
  const maxIsValid = hasMax && !Number.isNaN(maxNum) && maxNum >= keyToBounds[maxKey].min && maxNum <= keyToBounds[maxKey].max && !invalidFields[maxKey]

  const conflict = minIsValid && maxIsValid && minNum > maxNum

  conflictFields[minKey] = conflict
  conflictFields[maxKey] = conflict

  const newQuery = { ...route.query }

  if (conflict) {
    // Remove both keys from URL when conflict
    newQuery[minKey] = undefined
    newQuery[maxKey] = undefined
  } else {
    // Update URL with individually valid values
    newQuery[minKey] = minIsValid ? String(minNum) : (hasMin && !invalidFields[minKey] ? String(minStr) : undefined)
    newQuery[maxKey] = maxIsValid ? String(maxNum) : (hasMax && !invalidFields[maxKey] ? String(maxStr) : undefined)
  }

  router.push({ path: route.path, query: newQuery })
}

const onNumberInput = (fieldKey, min, max, valueStr) => {
  inputValues[fieldKey] = valueStr

  if (valueStr === '') {
    invalidFields[fieldKey] = false
    conflictFields[fieldKey] = false
    // Still reconcile to potentially clear the pair in URL
    reconcilePairByField(fieldKey)
    return
  }

  const numeric = Number(valueStr)
  const isValid = !Number.isNaN(numeric) && numeric >= min && numeric <= max

  if (isValid) {
    invalidFields[fieldKey] = false
    // Defer updating URL until we check pair conflicts
    reconcilePairByField(fieldKey)
  } else {
    invalidFields[fieldKey] = true
    conflictFields[fieldKey] = false
    // Do not update URL when invalid; also clear this key
    updateFilter(fieldKey, '')
  }
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

const updateAmmunitionTypes = (ids) => {
  router.push({
    path: route.path,
    query: {
      ...route.query,
      ammunitionTypes: ids.length > 0 ? ids.join(',') : undefined,
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

const addAmmunitionType = (id) => {
  const current = [...selectedAmmunitionTypes.value]
  const idStr = String(id)
  if (!current.includes(idStr)) {
    current.push(idStr)
    selectedAmmunitionTypes.value = current
  }
  searchQuery.value = ''
  isPopoverOpen.value = false
}

const removeAmmunitionType = (id) => {
  const idStr = String(id)
  const current = selectedAmmunitionTypes.value.filter(t => t !== idStr)
  selectedAmmunitionTypes.value = current
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
            :value="inputValues[config.key + 'Min']"
            :class="{ invalid: invalidFields[config.key + 'Min'], conflict: conflictFields[config.key + 'Min'] }"
            @input="onNumberInput(config.key + 'Min', config.min, config.max, $event.target.value)"
            placeholder="min"
            size-="small"
            type="number"
            :min="config.min"
            :max="config.max"
            aria-invalid="invalidFields[config.key + 'Min'] ? 'true' : 'false'"
          />
          <input
            :value="inputValues[config.key + 'Max']"
            :class="{ invalid: invalidFields[config.key + 'Max'], conflict: conflictFields[config.key + 'Max'] }"
            @input="onNumberInput(config.key + 'Max', config.min, config.max, $event.target.value)"
            placeholder="max"
            size-="small"
            type="number"
            :min="config.min"
            :max="config.max"
            aria-invalid="invalidFields[config.key + 'Max'] ? 'true' : 'false'"
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
            <div v-if="isPopoverOpen" class="ammunitionPopover">
              <div v-if="filteredAmmunition.length > 0">
                <div
                  v-for="ammo in filteredAmmunition"
                  :key="ammo.id"
                  class="ammunitionItem"
                  @mousedown.prevent="addAmmunitionType(ammo.id)"
                >
                  {{ ammo.name }}
                </div>
              </div>
              <div v-else class="ammunitionItem">No matches</div>
            </div>
          </div>
          <div v-if="selectedAmmunitionTypes.length > 0" class="selectedAmmunition">
            <span
              v-for="id in selectedAmmunitionTypes"
              :key="id"
              class="ammunitionTag"
              @click="removeAmmunitionType(id)"
            >
              {{ ammoIdToLabel[id] || id }}
            </span>
          </div>
        </div>
        <hr class="separator">
        <div class="priceFilter">
          <label>Price:</label>
          <input
            :value="inputValues.priceMin"
            :class="{ invalid: invalidFields.priceMin, conflict: conflictFields.priceMin }"
            @input="onNumberInput('priceMin', 0, 1000000, $event.target.value)"
            placeholder="min"
            size-="small"
            type="number"
            min="0"
            max="1000000"
            aria-invalid="invalidFields.priceMin ? 'true' : 'false'"
          />
          <input
            :value="inputValues.priceMax"
            :class="{ invalid: invalidFields.priceMax, conflict: conflictFields.priceMax }"
            @input="onNumberInput('priceMax', 0, 1000000, $event.target.value)"
            placeholder="max"
            size-="small"
            type="number"
            min="0"
            max="1000000"
            aria-invalid="invalidFields.priceMax ? 'true' : 'false'"
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

/* Hide number input arrows (spinners) */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

/* Invalid input state */
input.invalid {
  border-color: var(--red);
  color: var(--red);
}

/* Conflict (illogical range: min > max) */
input.conflict {
  border-color: var(--orange);
  color: var(--orange);
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
