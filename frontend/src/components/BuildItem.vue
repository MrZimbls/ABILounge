<script setup>
import { computed } from 'vue'

const props = defineProps({
  buildTitle: { type: String, required: true },
  build: { type: Object, default: () => ({}) },
  highlightedKeys: { type: Array, default: () => [] },
  selected: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false }
})

// Stats to display in the build item preview
const importanceOrder = [
  'vRecoil',
  'ergonomics',
  'price',
  'accuracy',
  'rpm',
  'range',
  'velocity',
  'stability',
  'hipfire',
  'hRecoil',
]

const labelMap = {
  vRecoil: 'V.Recoil',
  hRecoil: 'H.Recoil',
  ergonomics: 'Ergo',
  stability: 'Stability',
  accuracy: 'Accuracy',
  hipfire: 'Hipfire',
  range: 'Range',
  velocity: 'Vel',
  rpm: 'RPM',
  price: 'Price',
}

const MAX_STATS = 6

const prioritizedStats = computed(() => {
  const presentKeys = Object.keys(props.build || {})
  if (presentKeys.length === 0) return []

  // Map build keys to importance order
  const inImportance = importanceOrder.filter(k => {
    // Check for both direct key and prefixed versions
    return presentKeys.includes(k) || 
           presentKeys.includes(`b_${k}`) || 
           presentKeys.includes(`build_${k}`)
  })
  
  const highlighted = (props.highlightedKeys || []).filter(k => inImportance.includes(k))
  const rest = inImportance.filter(k => !highlighted.includes(k))
  const ordered = [...highlighted, ...rest]

  const items = ordered.slice(0, MAX_STATS).map(k => {
    // Try to get value from build object with various key formats
    const value = props.build[k] || props.build[`b_${k}`] || props.build[`build_${k}`] || ''
    return {
      key: k,
      label: labelMap[k] || k,
      value: value,
      highlighted: highlighted.includes(k)
    }
  })
  return items
})

// Extract tags if available
const tags = computed(() => {
  const buildTags = props.build?.tags || props.build?.tag_list || []
  if (Array.isArray(buildTags)) return buildTags
  if (typeof buildTags === 'string') return buildTags.split(',').filter(Boolean)
  return []
})
</script>

<template>
  <div box-="round" shear-="top" :class="['buildItem', { selected, clickable }]">
    <div class="itemHeader">
      <span is-="badge" :variant-="selected ? 'green' : 'background0'">{{ buildTitle }}</span>
      <div v-if="tags.length > 0" class="tags">
        <span 
          v-for="tag in tags.slice(0, 3)" 
          :key="tag" 
          class="tag"
          is-="badge" 
          variant-="purple"
        >
          {{ tag }}
        </span>
        <span v-if="tags.length > 3" class="tagMore">+{{ tags.length - 3 }}</span>
      </div>
    </div>
    <div class="itemBody">
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
        <div v-if="build.weapon_name || build.weapon" class="weaponName">
          Weapon: {{ build.weapon_name || build.weapon }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.buildItem { display: block; }
.buildItem.clickable { cursor: pointer; }
.buildItem.clickable:hover { background-color: var(--background1); }
.buildItem.selected { background-color: var(--background2); }
.itemHeader { 
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  gap: 1ch;
  flex-wrap: wrap;
}
.itemBody { display: flex; align-items: center; gap: 1ch; }
.summary { flex: 1 1 auto; min-width: 0; }
.statsLine { display: flex; gap: 1ch; align-items: center; flex-wrap: wrap; margin-right: 1ch; }
.stat { color: var(--gray2); }
.statText { margin: 0; }
.stat.hl { color: var(--wt-color-success, #8ec07c); outline: 1px solid currentColor; }
.statsLine > * + *::before { content: '|'; color: var(--gray2); margin: 0 .5ch; }
.tags {
  display: flex;
  gap: 0.5ch;
  align-items: center;
  flex-wrap: wrap;
}
.tag {
  font-size: 0.85em;
}
.tagMore {
  font-size: 0.85em;
  opacity: 0.7;
}
.weaponName {
  margin-top: 0.5ch;
  font-size: 0.9em;
  opacity: 0.8;
  color: var(--gray2);
}
</style>

