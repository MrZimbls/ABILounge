<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import NavBar from '../components/NavBar.vue'
import { listAmmunitionTypes } from '../api/weapons.js'

const loading = ref(true)
const errorMessage = ref('')
const rawRows = ref([])

// Filter configurations
const filterConfigs = [
  { key: 'at_damage', label: 'Damage', min: 0, max: 1000 },
  { key: 'at_penetration', label: 'Penetration', min: 0, max: 1000 },
  { key: 'at_pierce', label: 'Pierce', min: 0, max: 1000 },
  { key: 'at_armor_damage', label: 'Armor Damage', min: 0, max: 1000 },
  { key: 'at_velocity', label: 'Velocity', min: 0, max: 10000 },
  { key: 'at_price', label: 'Price', min: 0, max: 1000000 },
]

// Local state for number inputs
const inputValues = reactive({})
const invalidFields = reactive({})
const conflictFields = reactive({})
const keyToBounds = reactive({})

// Curated column order and readable labels
const COLUMN_ORDER = [
  'at_id',
  'at_name',
  'at_damage',
  'at_penetration',
  'at_pierce',
  'at_armor_damage',
  'at_velocity',
  'at_wound',
  'at_seller',
  'at_price',
  'at_caliber',
  // fallback synthetic when at_caliber is not present in rows
  'caliber',
]

const COLUMN_LABELS = Object.freeze({
  at_id: 'ID',
  at_name: 'Name',
  at_damage: 'Damage',
  at_penetration: 'Penetration',
  at_pierce: 'Pierce',
  at_armor_damage: 'Armor Damage',
  at_velocity: 'Velocity',
  at_wound: 'Wound',
  at_seller: 'Seller',
  at_price: 'Price',
  at_caliber: 'Caliber',
  caliber: 'Caliber',
})

// Compute available columns from data using curated order
const allColumns = computed(() => {
  const first = rawRows.value[0]
  if (!first) return []
  const keys = new Set(Object.keys(first))
  const hasJoinedCaliber = !!first?.t_ammunition?.a_caliber
  const out = []
  for (const key of COLUMN_ORDER) {
    if (key === 'caliber') {
      if (!keys.has('at_caliber') && hasJoinedCaliber) out.push('caliber')
      continue
    }
    if (keys.has(key)) out.push(key)
  }
  return out
})

// Checkbox state for columns
const columnChecks = ref({})
const displayedColumns = computed(() => allColumns.value.filter(c => columnChecks.value[c]))

// Unique calibers from joined relation OR at_caliber
const allCalibers = computed(() => {
  const set = new Set()
  for (const r of rawRows.value) {
    const cal = r?.t_ammunition?.a_caliber ?? r?.at_caliber
    if (cal) set.add(String(cal))
  }
  return Array.from(set).sort((a,b) => a.localeCompare(b))
})

// Excluded calibers (via popover input)
const excludedCalibers = ref([])
const caliberSearch = ref('')
const popoverOpen = ref(false)

const filteredCaliberOptions = computed(() => {
  const q = caliberSearch.value.toLowerCase()
  const excluded = new Set(excludedCalibers.value)
  return allCalibers.value.filter(name => !excluded.has(name) && (!q || name.toLowerCase().includes(q)))
})

function addExcludedCaliber(name) {
  if (!excludedCalibers.value.includes(name)) excludedCalibers.value = [...excludedCalibers.value, name]
  caliberSearch.value = ''
  popoverOpen.value = false
}

function removeExcludedCaliber(name) {
  excludedCalibers.value = excludedCalibers.value.filter(n => n !== name)
}

function onCaliberFocus() {
  popoverOpen.value = true
}

function onCaliberBlur() {
  setTimeout(() => { popoverOpen.value = false }, 200)
}

// Sorting
const sortKey = ref('')
const sortDir = ref('asc') // 'asc' | 'desc'

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function getCellValue(row, key) {
  if (key === 'caliber') return row?.t_ammunition?.a_caliber ?? ''
  if (key === 'at_caliber') return row?.t_ammunition?.a_caliber ?? row?.at_caliber ?? ''
  return row?.[key]
}

function initInputValues() {
  for (const cfg of filterConfigs) {
    const minKey = cfg.key + 'Min'
    const maxKey = cfg.key + 'Max'
    inputValues[minKey] = ''
    inputValues[maxKey] = ''
    invalidFields[minKey] = false
    invalidFields[maxKey] = false
    conflictFields[minKey] = false
    conflictFields[maxKey] = false
    keyToBounds[minKey] = { min: cfg.min, max: cfg.max }
    keyToBounds[maxKey] = { min: cfg.min, max: cfg.max }
  }
}

function getPairKeys(fieldKey) {
  if (fieldKey.endsWith('Min')) {
    return { minKey: fieldKey, maxKey: fieldKey.slice(0, -3) + 'Max' }
  }
  if (fieldKey.endsWith('Max')) {
    return { minKey: fieldKey.slice(0, -3) + 'Min', maxKey: fieldKey }
  }
  return { minKey: fieldKey, maxKey: fieldKey }
}

function reconcilePairByField(fieldKey) {
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
}

function onNumberInput(fieldKey, min, max, valueStr) {
  inputValues[fieldKey] = valueStr

  if (valueStr === '') {
    invalidFields[fieldKey] = false
    conflictFields[fieldKey] = false
    reconcilePairByField(fieldKey)
    return
  }

  const numeric = Number(valueStr)
  const isValid = !Number.isNaN(numeric) && numeric >= min && numeric <= max

  if (isValid) {
    invalidFields[fieldKey] = false
    reconcilePairByField(fieldKey)
  } else {
    invalidFields[fieldKey] = true
    conflictFields[fieldKey] = false
  }
}

function getNumericFilterValue(key) {
  const minKey = key + 'Min'
  const maxKey = key + 'Max'
  const minStr = inputValues[minKey]
  const maxStr = inputValues[maxKey]
  
  const minNum = minStr ? Number(minStr) : null
  const maxNum = maxStr ? Number(maxStr) : null
  
  return {
    min: minNum !== null && !Number.isNaN(minNum) && !invalidFields[minKey] && !conflictFields[minKey] ? minNum : null,
    max: maxNum !== null && !Number.isNaN(maxNum) && !invalidFields[maxKey] && !conflictFields[maxKey] ? maxNum : null,
  }
}

const displayedRows = computed(() => {
  const excluded = new Set(excludedCalibers.value)
  let rows = rawRows.value.filter(r => !excluded.has(String(r?.t_ammunition?.a_caliber ?? r?.at_caliber ?? '')))

  // Apply numeric filters
  for (const cfg of filterConfigs) {
    const filter = getNumericFilterValue(cfg.key)
    if (filter.min !== null || filter.max !== null) {
      rows = rows.filter(row => {
        const value = Number(getCellValue(row, cfg.key))
        if (Number.isNaN(value)) return false
        if (filter.min !== null && value < filter.min) return false
        if (filter.max !== null && value > filter.max) return false
        return true
      })
    }
  }

  if (sortKey.value) {
    const key = sortKey.value
    const dir = sortDir.value === 'asc' ? 1 : -1
    rows = [...rows].sort((a, b) => {
      const av = getCellValue(a, key)
      const bv = getCellValue(b, key)
      // Numeric sort if both look like numbers
      const an = Number(av)
      const bn = Number(bv)
      const aIsNum = !Number.isNaN(an) && av !== '' && av !== null
      const bIsNum = !Number.isNaN(bn) && bv !== '' && bv !== null
      if (aIsNum && bIsNum) return (an - bn) * dir
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir
    })
  }

  return rows
})

onMounted(async () => {
  try {
    const { data } = await listAmmunitionTypes()
    rawRows.value = Array.isArray(data) ? data : []
    // Initialize column checks (default all true)
    const checks = {}
    for (const c of allColumns.value) checks[c] = true
    columnChecks.value = checks
    // Initialize filter input values
    initInputValues()
  } catch (e) {
    errorMessage.value = String(e?.message || e || 'Failed to load ammunition')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <NavBar :disabledButton="'ammunition'" />

    <div class="page">
      <div class="box sidebar" box-="round" shear-="top">
        <span class="header" is-="badge" variant-="red">Filters</span>

        <div class="section">
          <label class="sectionTitle">Columns</label>
          <ul marker-="tree">
            <li v-for="col in allColumns" :key="col" class="colRow">
              <span class="filterTitle">{{ COLUMN_LABELS[col] || col }}:</span>
              <input type="checkbox" v-model="columnChecks[col]" />
            </li>
          </ul>
        </div>

        <hr class="separator" />

        <div class="section">
          <label class="sectionTitle">Stats</label>
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
        </div>

        <hr class="separator" />

        <div class="section">
          <label class="sectionTitle">Exclude calibers</label>
          <div class="ammunitionInputWrapper">
            <input
              v-model="caliberSearch"
              @focus="onCaliberFocus"
              @blur="onCaliberBlur"
              placeholder="Search caliber..."
              size-="small"
              type="text"
            />
            <div v-if="popoverOpen" class="ammunitionPopover">
              <div v-if="filteredCaliberOptions.length > 0">
                <div
                  v-for="name in filteredCaliberOptions"
                  :key="name"
                  class="ammunitionItem"
                  @mousedown.prevent="addExcludedCaliber(name)"
                >
                  {{ name }}
                </div>
              </div>
              <div v-else class="ammunitionItem">No matches</div>
            </div>
          </div>
          <div v-if="excludedCalibers.length > 0" class="selectedAmmunition">
            <span
              v-for="name in excludedCalibers"
              :key="name"
              class="ammunitionTag"
              @click="removeExcludedCaliber(name)"
            >
              {{ name }}
            </span>
          </div>
        </div>
      </div>

      <div class="box tableBox" box-="round" shear-="top">
        <span class="header" is-="badge" variant-="red">ammunition</span>

        <div v-if="loading" class="status">Loading…</div>
        <div v-else-if="errorMessage" class="status error">{{ errorMessage }}</div>
        <div v-else class="tableWrapper">
          <table class="ammoTable">
            <thead>
              <tr>
                <th
                  v-for="col in displayedColumns"
                  :key="col"
                  @click="toggleSort(col)"
                  class="sortable"
                >
                  <span>{{ COLUMN_LABELS[col] || col }}</span>
                  <span v-if="sortKey === col" class="sortDir">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in displayedRows" :key="row.id || row.a_id || JSON.stringify(row)">
                <td v-for="col in displayedColumns" :key="col">
                  {{ getCellValue(row, col) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: flex-start;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 0 0 35ch;
}

.sidebar .header {
  width: fit-content;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.sectionTitle {
  font-weight: 600;
  width: fit-content;
}

.colRow {
  display: flex;
  gap: 1ch;
}

.filterRow {
  display: flex;
  gap: 1ch;
  align-items: center;
}

.filterTitle {
  width: 14ch;
  flex-shrink: 0;
}

input {
  flex: 1;
  min-width: 5ch;
  max-width: 6ch;
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
  margin: 0.75ch 0;
}

.tableBox {
  flex: 1;
  overflow: auto;
}

.tableWrapper {
  width: 100%;
  overflow: auto;
}

.ammoTable {
  width: 100%;
  border-collapse: collapse;
}

.ammoTable th,
.ammoTable td {
  border-bottom: 1px solid var(--fg);
  padding: 0.5rem;
  text-align: left;
}

.sortable { cursor: pointer; user-select: none; }
.sortDir { margin-left: 0.5ch; }

/* Popover styles (reused from WeaponStatFilter) */
.ammunitionInputWrapper { position: relative; }
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
.ammunitionItem { padding: 0.5ch 1ch; cursor: pointer; }
.ammunitionItem:hover { background-color: var(--background0); }
.selectedAmmunition { display: flex; flex-wrap: wrap; gap: 0.5ch; margin-top: 0.5rem; }
.ammunitionTag {
  display: inline-block;
  padding: 0.25ch 0.75ch;
  background-color: var(--blue);
  color: var(--background0);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}
.ammunitionTag:hover { background-color: var(--red); }

.status { padding: 0.75rem; }
.status.error { color: var(--red); }
</style>


