<script setup>
import { computed } from 'vue'

const props = defineProps({
  weaponName: { type: String, required: true },
  stats: { type: Object, default: () => ({}) },
  highlightedKeys: { type: Array, default: () => [] },
  selected: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false }
})

// Eagerly import all small weapon icons as URLs; includes placeholder.png
const imageModules = import.meta.glob('../../resources/SmallWeaponIcons/*.png', { eager: true, as: 'url' })

const imageUrl = computed(() => {
  const lowerName = `${props.weaponName}.png`.toLowerCase()
  let matchUrl
  let placeholderUrl

  for (const [path, url] of Object.entries(imageModules)) {
    const lowerPath = path.toLowerCase()
    if (lowerPath.endsWith(`/${lowerName}`)) {
      matchUrl = url
    }
    if (lowerPath.endsWith('/placeholder.png')) {
      placeholderUrl = url
    }
  }

  return matchUrl ?? placeholderUrl ?? ''
})

// Importance order (restored)
const importanceOrder = [
  'w_vrecoil',
  'w_ergonomics',
  'w_price',
  'w_accuracy',
  'w_rpm',
  'w_range',
  'w_power',
  'w_ammunition',
  'w_velocity',
  'w_stability',
  'w_hipfire',
  'w_hrecoil',
  'w_firingmode'
]

const labelMap = {
  w_power: 'Power',
  w_rpm: 'RPM',
  w_accuracy: 'Accuracy',
  w_range: 'Range',
  w_velocity: 'Vel',
  w_stability: 'Stability',
  w_ergonomics: 'Ergo',
  w_hipfire: 'Hipfire',
  w_vrecoil: 'V.Recoil',
  w_hrecoil: 'H.Recoil',
  w_price: 'Price',
  w_ammunition: 'Ammo',
  w_firingmode: 'Mode'
}

const MAX_STATS = 6

const prioritizedStats = computed(() => {
  const presentKeys = Object.keys(props.stats || {})
  if (presentKeys.length === 0) return []

  const inImportance = importanceOrder.filter(k => presentKeys.includes(k))
  const highlighted = (props.highlightedKeys || []).filter(k => inImportance.includes(k))
  const rest = inImportance.filter(k => !highlighted.includes(k))
  const ordered = [...highlighted, ...rest]

  const items = ordered.slice(0, MAX_STATS).map(k => ({
    key: k,
    label: labelMap[k] || k,
    value: props.stats[k],
    highlighted: highlighted.includes(k)
  }))
  return items
})
</script>

<template>
  <div box-="round" shear-="top" :class="['weaponItem', { selected, clickable }]">
    <div class="itemHeader">
      <span is-="badge" :variant-="selected ? 'green' : 'background0'">{{ weaponName }}</span>
    </div>
    <div class="itemBody">
      <img class="thumb" :src="imageUrl" :alt="weaponName" />
      <div class="summary">
        <div class="statsLine">
          <template v-for="s in prioritizedStats" :key="s.key">
            <span v-if="s.highlighted" class="stat hl" is-="badge" variant-="background0">
              {{ s.label }}: {{ s.value }}
            </span>
            <p v-else class="stat statText">
              {{ s.label }}: {{ s.value }}
            </p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weaponItem { display: block; }
.weaponItem.clickable { cursor: pointer; }
/* Hover background for clickable items */
.weaponItem.clickable:hover { background-color: var(--background1); }
/* Use a different background for the selected box */
.weaponItem.selected { background-color: var(--background2); }
.itemHeader { display: flex; justify-content: space-between; }
.itemBody { display: flex; align-items: center; gap: 1ch; }
.thumb { width: 120px; height: 62px; object-fit: contain; }
.summary { flex: 1 1 auto; min-width: 0; }
.statsLine { display: flex; gap: 1ch; align-items: center; flex-wrap: wrap; margin-right: 1ch;}
.stat { color: var(--gray2); }
.statText { margin: 0; }
.stat.hl { color: var(--wt-color-success, #8ec07c); outline: 1px solid currentColor; }
/* Insert a separator between each stat (not before the first) */
.statsLine > * + *::before { content: '|'; color: var(--gray2); margin: 0 .5ch; }
</style>


