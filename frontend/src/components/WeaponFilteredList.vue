<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import WeaponItem from './WeaponItem.vue'
import { searchWeapons } from '@/api/weapons.js'

const props = defineProps({
  refreshTick: { type: Number, default: 0 },
})

const route = useRoute()

const loading = ref(false)
const error = ref('')
const weapons = ref([])
const total = ref(0)

const numericKeys = ['vRecoil','hRecoil','ergo','wStab','accuracy','hfStab','range','velocity','rpm','price']

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

async function loadWeapons() {
  loading.value = true
  error.value = ''
  try {
    const { data, total: t } = await searchWeapons({
      page: 1,
      perPage: 20,
      sortBy: sortBy.value || undefined,
      sortDir: sortDir.value || 'asc',
      filters: filters.value,
    })
    weapons.value = Array.isArray(data) ? data : []
    total.value = Number(t) || 0
  } catch (e) {
    error.value = e?.message || 'Failed to load weapons'
    weapons.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

watch(() => props.refreshTick, () => { loadWeapons() }, { immediate: true })
</script>

<template>
  <div box-="round" class="filteredRoot">
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
            />
            <div v-if="!weapons.length && !error">No results</div>
          </template>
        </div>
      </div>
      <div class="previewPane">
        <div box-="round" class="paneBox">Preview area</div>
      </div>
    </div>
  </div>
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
}

.previewPane {
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
  gap: 1lh;
}

.itemHeader {
  display: flex;
  justify-content: space-between;
}
</style>


