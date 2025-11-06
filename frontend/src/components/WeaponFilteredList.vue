<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WeaponItem from './WeaponItem.vue'
import { searchWeapons, updateWeapon } from '@/api/weapons.js'
import { useAuth } from '@/composables/useAuth.js'

const props = defineProps({
  refreshTick: { type: Number, default: 0 },
})

const route = useRoute()
const router = useRouter()

// Authentication
const { hasMinimumRole, user } = useAuth()
const canEdit = computed(() => hasMinimumRole('developer'))

// Edit dialog state
const editDialog = ref(null)
const editingWeapon = ref(null)
const editFormData = reactive({})
const isSaving = ref(false)
const saveError = ref('')

const loading = ref(false)
const error = ref('')
const weapons = ref([])
const total = ref(0)
const PER_PAGE = 7

const selectedWeapon = ref(null)

const currentPage = computed(() => {
  const raw = Number(route.query.page)
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1
})

const numericKeys = ['vRecoil','hRecoil','ergo','wStab','accuracy','hfStab','range','velocity','rpm','price']

const numericFields = [
  'w_ergonomics', 'w_stability', 'w_accuracy', 'w_hipfire', 
  'w_vrecoil', 'w_hrecoil', 'w_range', 'w_velocity', 'w_rpm', 'w_price'
]

const filters = computed(() => {
  const q = route.query
  const f = {}
  for (const k of numericKeys) {
    const minKey = `${k}Min`
    const maxKey = `${k}Max`
    if (q[minKey] !== undefined && q[minKey] !== '') f[minKey] = q[minKey]
    if (q[maxKey] !== undefined && q[maxKey] !== '') f[maxKey] = q[maxKey]
  }
  if (q.excludedWeaponTypes) f.excludedWeaponTypes = String(q.excludedWeaponTypes).split(',')
  if (q.excludedFiringModes) f.excludedFiringModes = String(q.excludedFiringModes).split(',')
  if (q.ammunitionTypes) f.ammunitionTypes = String(q.ammunitionTypes).split(',')
  return f
})

const sortBy = computed(() => route.query.sortStat || null)
const sortDir = computed(() => (route.query.sortOrder || 'asc'))

const sortToDbKey = {
  vRecoil: 'w_vrecoil',
  hRecoil: 'w_hrecoil',
  ergo: 'w_ergonomics',
  wStab: 'w_stability',
  accuracy: 'w_accuracy',
  hfStab: 'w_hipfire',
  range: 'w_range',
  velocity: 'w_velocity',
  rpm: 'w_rpm',
  price: 'w_price',
}

const highlightedKeys = computed(() => {
  const key = sortBy.value
  return key && sortToDbKey[key] ? [sortToDbKey[key]] : []
})

// Keys that should render as 0-100 progress bars (assume 100 is max)
const progressKeys = new Set([
  'w_ergonomics',
  'w_stability',
  'w_accuracy',
  'w_hipfire',
  'w_vrecoil',
  'w_hrecoil',
])

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function clampPercent(n) {
  if (n === null) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function prettifyLabel(key) {
  if (!key) return ''
  const k = String(key).replace(/^w_/, '')
  const map = {
    name: 'Name',
    ergonomics: 'Ergonomics',
    stability: 'Stability',
    accuracy: 'Accuracy',
    hipfire: 'Hipfire',
    vrecoil: 'Vertical Recoil',
    hrecoil: 'Horizontal Recoil',
    range: 'Range',
    velocity: 'Velocity',
    rpm: 'Rate of Fire',
    price: 'Price',
    type: 'Type',
    firing_modes: 'Firing Modes',
    caliber: 'Caliber',
    manufacturer: 'Manufacturer',
  }
  if (map[k]) return map[k]
  // Fallback: Title Case
  return k
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

const categorizedDetails = computed(() => {
  const w = selectedWeapon.value
  if (!w) return []

  // Collect all visible entries
  const rawEntries = Object.entries(w)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)

  const excludeKeys = new Set(['id'])

  const buckets = {
    Basics: new Set(['w_name', 'w_type', 'w_firing_modes', 'caliber', 'manufacturer']),
    Performance: new Set(['w_ergonomics', 'w_stability', 'w_accuracy', 'w_hipfire', 'w_vrecoil', 'w_hrecoil']),
    Ballistics: new Set(['w_range', 'w_velocity']),
    Firecontrol: new Set(['w_rpm']),
    Economy: new Set(['w_price']),
  }

  const placed = new Set()
  const result = []

  for (const [groupName, keys] of Object.entries(buckets)) {
    const items = []
    for (const [k, v] of rawEntries) {
      if (excludeKeys.has(k)) continue
      if (!keys.has(k)) continue
      placed.add(k)
      const num = toNumber(v)
      const isProgress = progressKeys.has(k) && num !== null
      items.push({
        key: k,
        label: prettifyLabel(k),
        isProgress,
        progress: isProgress ? clampPercent(num) : 0,
        max: 100,
        exact: num,
        display: Array.isArray(v) ? v.join(', ') : String(v),
      })
    }
    if (items.length) result.push({ name: groupName, items })
  }

  // Other (anything not placed)
  const otherItems = []
  for (const [k, v] of rawEntries) {
    if (excludeKeys.has(k)) continue
    if (placed.has(k)) continue
    const num = toNumber(v)
    const isProgress = progressKeys.has(k) && num !== null
    otherItems.push({
      key: k,
      label: prettifyLabel(k),
      isProgress,
      progress: isProgress ? clampPercent(num) : 0,
      max: 100,
      exact: num,
      display: Array.isArray(v) ? v.join(', ') : String(v),
    })
  }
  if (otherItems.length) result.push({ name: 'Other', items: otherItems })

  return result
})

async function loadWeapons() {
  loading.value = true
  error.value = ''
  try {
    const { data, total: t } = await searchWeapons({
      page: currentPage.value,
      perPage: PER_PAGE,
      sortBy: sortBy.value || undefined,
      sortDir: sortDir.value || 'asc',
      filters: filters.value,
    })
    weapons.value = Array.isArray(data) ? data : []
    total.value = Number(t) || 0
    // If current selection no longer exists in the new page/filter results, clear it
    if (selectedWeapon.value) {
      const sel = selectedWeapon.value
      const exists = weapons.value.find(x =>
        (sel?.id && x?.id && sel.id === x.id) ||
        (sel?.w_name && x?.w_name && sel.w_name === x.w_name)
      )
      if (!exists) selectedWeapon.value = null
    }
    // If current page is out of bounds after filters/sort changed, clamp to last page
    const pageCount = Math.max(1, Math.ceil(total.value / PER_PAGE))
    if (currentPage.value > pageCount && pageCount >= 1) {
      setPage(pageCount)
    }
  } catch (e) {
    error.value = e?.message || 'Failed to load weapons'
    weapons.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function selectWeapon(w) { selectedWeapon.value = w }

function setPage(pageNumber) {
  const target = Math.max(1, Math.floor(Number(pageNumber) || 1))
  if (target === currentPage.value) return
  router.push({ query: { ...route.query, page: String(target) } })
}

function goPrev() { if (currentPage.value > 1) setPage(currentPage.value - 1) }
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PER_PAGE)))
function goNext() { if (currentPage.value < pageCount.value) setPage(currentPage.value + 1) }

const pagesToShow = computed(() => {
  const totalPages = pageCount.value
  const cur = currentPage.value
  // Show a compact sequence with first/last and around current
  const result = []
  const push = (v) => { if (result[result.length - 1] !== v) result.push(v) }
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) push(i)
    return result
  }
  push(1)
  if (cur > 3) push('…')
  for (let i = Math.max(2, cur - 1); i <= Math.min(totalPages - 1, cur + 1); i++) push(i)
  if (cur < totalPages - 2) push('…')
  push(totalPages)
  return result
})

// Track previous values to detect filter/sort changes (not page changes)
const prevFilters = ref(JSON.stringify(filters.value))
const prevSortBy = ref(sortBy.value)
const prevSortDir = ref(sortDir.value)

watch([filters, sortBy, sortDir], ([newFilters, newSortBy, newSortDir]) => {
  const filtersChanged = JSON.stringify(newFilters) !== prevFilters.value
  const sortChanged = newSortBy !== prevSortBy.value || newSortDir !== prevSortDir.value
  
  if (filtersChanged || sortChanged) {
    prevFilters.value = JSON.stringify(newFilters)
    prevSortBy.value = newSortBy
    prevSortDir.value = newSortDir
    
    if (currentPage.value !== 1) {
      router.push({ query: { ...route.query, page: '1' } })
    }
  }
}, { immediate: false })

// Refresh when route query (filters/sort/page) or explicit refresh tick changes
watch([() => route.query, () => props.refreshTick], () => { loadWeapons() }, { immediate: true, deep: true })

// Edit functions
function openEditDialog(weapon) {
  editingWeapon.value = weapon
  // Initialize form data with current weapon values
  // Exclude nested objects and only include direct properties
  Object.keys(weapon).forEach(key => {
    if (typeof weapon[key] !== 'object') {
      editFormData[key] = weapon[key] ?? ''
    }
  })
  saveError.value = ''
  if (editDialog.value) {
    editDialog.value.showModal()
  }
}

function closeEditDialog() {
  if (editDialog.value) {
    editDialog.value.close()
  }
  editingWeapon.value = null
  Object.keys(editFormData).forEach(key => delete editFormData[key])
  saveError.value = ''
}

async function saveEdit() {
  const weaponId = editingWeapon.value?.w_id || editingWeapon.value?.id
  if (!editingWeapon.value || !weaponId) {
    saveError.value = 'Invalid weapon to edit'
    return
  }

  isSaving.value = true
  saveError.value = ''

  try {
    const token = user.value?.code
    if (!token) {
      throw new Error('Authentication required')
    }

    // Prepare update data (exclude id fields and nested objects)
    const updateData = {}
    const numericFields = [
      'w_ergonomics', 'w_stability', 'w_accuracy', 'w_hipfire', 
      'w_vrecoil', 'w_hrecoil', 'w_range', 'w_velocity', 'w_rpm', 'w_price'
    ]
    
    Object.keys(editFormData).forEach(key => {
      if (key !== 'id' && key !== 'w_id' && typeof editFormData[key] !== 'object') {
        const value = editFormData[key]
        
        if (value === '' || value === null || value === undefined) {
          // Convert empty values to null for numeric fields, empty string for text fields
          if (numericFields.includes(key)) {
            updateData[key] = null
          } else {
            updateData[key] = ''
          }
        } else if (numericFields.includes(key)) {
          // Convert to number for numeric fields
          const numValue = Number(value)
          updateData[key] = !isNaN(numValue) ? numValue : null
        } else {
          // Keep as string for text fields
          updateData[key] = String(value)
        }
      }
    })

    await updateWeapon(weaponId, updateData, { token })
    
    // Reload the data
    await loadWeapons()
    
    // Update selected weapon if it was the one being edited
    const selectedId = selectedWeapon.value?.w_id || selectedWeapon.value?.id
    if (selectedWeapon.value && selectedId === weaponId) {
      const updated = weapons.value.find(w => (w.w_id || w.id) === weaponId)
      if (updated) {
        selectedWeapon.value = updated
      }
    }
    
    closeEditDialog()
  } catch (e) {
    saveError.value = String(e?.message || e || 'Failed to save changes')
  } finally {
    isSaving.value = false
  }
}

// Get all editable fields from weapon
const editableFields = computed(() => {
  if (!editingWeapon.value) return []
  const fields = []
  const excludeKeys = new Set(['id', 'w_id'])
  
  // Get all keys from the weapon object
  for (const key of Object.keys(editingWeapon.value)) {
    if (excludeKeys.has(key)) continue
    if (typeof editingWeapon.value[key] === 'object') continue
    fields.push(key)
  }
  
  // Sort fields in a logical order
  const fieldOrder = [
    'w_name', 'w_type', 'w_firing_modes', 'caliber', 'manufacturer',
    'w_ergonomics', 'w_stability', 'w_accuracy', 'w_hipfire', 
    'w_vrecoil', 'w_hrecoil', 'w_range', 'w_velocity', 'w_rpm', 'w_price'
  ]
  
  const ordered = []
  for (const key of fieldOrder) {
    if (fields.includes(key)) {
      ordered.push(key)
    }
  }
  
  // Add any remaining fields
  for (const key of fields) {
    if (!ordered.includes(key)) {
      ordered.push(key)
    }
  }
  
  return ordered
})
</script>

<template>
  <div class="filteredRoot">
    <div class="layoutRow">
      <div class="listPane">
        <div class="listContent">
          <div v-if="loading">Loading...</div>
          <div v-else-if="error">{{ error }}</div>
          <template v-else>
            <WeaponItem
              v-for="w in weapons"
              :key="w.id || w.w_name"
              :weaponName="w.w_name || 'Unknown'"
              :stats="w"
              :highlighted-keys="highlightedKeys"
              :selected="(selectedWeapon && ((selectedWeapon.id && w.id && selectedWeapon.id === w.id) || (selectedWeapon.w_name && w.w_name && selectedWeapon.w_name === w.w_name)))"
              :clickable="true"
              @click="selectWeapon(w)"
            />
            <div v-if="!weapons.length && !error">No results</div>
            <div v-else class="pager">
              <button size-="small" @click="goPrev" :disabled="currentPage <= 1">Prev</button>
              <template v-for="p in pagesToShow" :key="`p-${p}`">
                <button size-="small"
                  v-if="typeof p === 'number'"
                  :class="['pageBtn', { active: p === currentPage }]"
                  @click="setPage(p)"
                >{{ p }}</button>
                <span v-else class="ellipsis">{{ p }}</span>
              </template>
              <button size-="small" @click="goNext" :disabled="currentPage >= pageCount">Next</button>
            </div>
          </template>
        </div>
      </div>
      <div class="detailsPane">
        <div box-="round" class="paneBox">
          <div v-if="!selectedWeapon">Select a weapon to view details</div>
          <div v-else class="details">
            <div v-if="canEdit" class="editButtonContainer">
              <button 
                @click="openEditDialog(selectedWeapon)"
                size-="small"
                variant-="blue"
                class="editButton"
              >
                Edit
              </button>
            </div>
            <div class="treeList">
              <details v-for="cat in categorizedDetails" :key="cat.name" open class="treeGroup">
                <summary class="treeSummary">{{ cat.name }}</summary>
                <ul class="treeItems">
                  <li v-for="item in cat.items" :key="item.key" class="treeItem">
                    <div class="treeItemRow">
                      <div class="treeItemLabel">{{ item.label }}</div>
                      <div class="treeItemValue" v-if="item.isProgress">
                        <progress :value="item.progress" :max="item.max" class="statProgress"></progress>
                        <span class="statNumber">{{ item.exact }}</span>
                      </div>
                      <div class="treeItemValue" v-else>{{ item.display }}</div>
                    </div>
                  </li>
                </ul>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Dialog -->
  <dialog 
    ref="editDialog" 
    position-="center start" 
    container-="auto"
    class="edit-dialog"
  >
    <div class="dialog-content">
      <h2 class="dialog-title">Edit Weapon</h2>
      
      <div v-if="editingWeapon" class="edit-form">
        <div 
          v-for="field in editableFields" 
          :key="field"
          class="form-field"
        >
          <label :for="`edit-${field}`" class="form-label">
            {{ prettifyLabel(field) }}:
          </label>
            <input
              :id="`edit-${field}`"
              v-model="editFormData[field]"
              :type="numericFields.includes(field) ? 'number' : 'text'"
              :disabled="field === 'id' || field === 'w_id'"
              :placeholder="String(editingWeapon[field] || '')"
              size-="small"
            />
        </div>
      </div>

      <div v-if="saveError" class="error-message">
        {{ saveError }}
      </div>

      <div class="dialog-buttons">
        <button 
          @click="closeEditDialog"
          :disabled="isSaving"
          variant-="blue"
          size-="small"
        >
          Cancel
        </button>
        <button 
          @click="saveEdit" 
          :disabled="isSaving"
          variant-="red"
          size-="small"
        >
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.filteredRoot {
  min-height: 60vh;
}

.layoutRow {
  display: flex;
  gap: 2ch;
  align-items: stretch;
  width: 100%;
  height: 100%;
}

.listPane {
  flex: 3 1 0;
  min-width: 0;
  display: flex;
  padding-left: 2ch;
}

.detailsPane {
  flex: 2 1 0;
  min-width: 0;
  display: flex;
}

.paneBox {
  width: 100%;
  height: 100%;
}

.listContent {
  display: flex;
  flex-direction: column;
}

.itemHeader {
  display: flex;
  justify-content: space-between;
}

.pager {
  display: flex;
  gap: 0.75ch;
  align-items: center;
  justify-content: center;
  margin-top: 1ch;
  flex-wrap: wrap;
}

.pageBtn {
  padding: 0.25rem 0.6rem;
}

.pageBtn.active {
  font-weight: 700;
}

.ellipsis { opacity: 0.7; }

.details { display: flex; flex-direction: column; gap: 1rem; }
.detailsHeader { font-weight: 700; }

/* Tree list */
.treeList { display: flex; flex-direction: column; gap: 0.5rem; }
.treeGroup { padding: 0.25rem 0.5rem; }
.treeSummary { cursor: pointer; font-weight: 600; }
.treeItems { list-style: none; padding-left: 1rem; margin: 0.25rem 0 0; display: flex; flex-direction: column; gap: 0.25rem; }
.treeItem { position: relative; }
.treeItems li::before { content: none !important; }
.treeItems li::marker { content: '' !important; }
.treeItemRow { display: grid; grid-template-columns: 1fr 2fr; align-items: center; gap: 0.75rem; }
.treeItemLabel { opacity: 0.85; }
.treeItemValue { display: flex; align-items: center; justify-content: flex-start; }

/* WebTUI progress tweaks */
.statProgress {
  width: 100%;
  max-width: 28ch;
  --progress-value-background: var(--foreground2);
  --progress-empty-background: var(--background2);
}
.treeItemValue { gap: 0.75ch; }
.statNumber { min-width: 4ch; text-align: right; opacity: 0.9; }

.editButtonContainer {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.editButton {
  padding: 0.25rem 0.75rem;
  font-size: 0.9em;
}

/* Edit Dialog Styles */
:deep(.edit-dialog::backdrop) {
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

:deep(.edit-dialog) {
  padding: 0;
  border: none;
  background: transparent;
}

.edit-dialog .dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem 2ch;
  max-width: 80ch;
  max-height: 85vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.dialog-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.3em;
  font-weight: bold;
  color: var(--foreground1);
  border-bottom: 1px solid var(--foreground2);
  padding-bottom: 0.75rem;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.form-field {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  align-items: center;
  padding: 0.5rem 0;
}

.form-label {
  font-weight: 600;
  font-size: 0.9em;
  width: 18ch;
  flex-shrink: 0;
}

.form-field input {
  flex: 1;
  min-width: 20ch;
}

/* Hide number input arrows (spinners) */
.form-field input[type="number"]::-webkit-outer-spin-button,
.form-field input[type="number"]::-webkit-inner-spin-button {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
}
.form-field input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.dialog-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--foreground2);
}

.error-message {
  color: var(--red);
  padding: 0.75rem 1rem;
  background-color: var(--background0);
  border: 1px solid var(--red);
  border-radius: 4px;
  margin: 0.5rem 0;
}
</style>


