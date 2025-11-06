<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed, ref } from 'vue'

const router = useRouter()
const route = useRoute()

// Available sort options for builds
const sortOptions = [
  { key: 'title', label: 'Title' },
  { key: 'created', label: 'Created Date' },
  { key: 'updated', label: 'Updated Date' },
  { key: 'rating', label: 'Rating' },
  { key: 'views', label: 'Views' },
  { key: 'price', label: 'Build Price' },
  { key: 'vRecoil', label: 'V. Recoil Control' },
  { key: 'hRecoil', label: 'H. Recoil Control' },
  { key: 'ergo', label: 'Ergonomics' },
  { key: 'wStab', label: 'Weapon Stability' },
  { key: 'accuracy', label: 'Accuracy' },
]

// Reactive selected sort from URL query
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

// Popover state for selecting sort option
const isPopoverOpen = ref(false)
const searchQuery = ref('')

const filteredSortOptions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return sortOptions
  return sortOptions.filter((opt) =>
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

const chooseSort = (opt) => {
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
      <div class="sortPicker">
        <label>Sort by:</label>
        <div class="inputWrapper">
          <input
            :value="selectedSortStat ? (sortOptions.find(o => o.key === selectedSortStat)?.label || selectedSortStat) : searchQuery"
            @input="searchQuery = $event.target.value"
            @focus="handleInputFocus"
            @blur="handleInputBlur"
            :placeholder="selectedSortStat ? '' : 'Search sort option...'"
            size-="small"
            type="text"
            :readonly="!!selectedSortStat"
          />
          <button
            class="clearBtn"
            size-="small"
            :class="{ disabled: !selectedSortStat }"
            @click="selectedSortStat && clearSelection()"
            aria-label="Clear selected sort"
            title="Clear"
          >
            <span class="nf icon" aria-hidden="true"></span>
          </button>
          <div v-if="!selectedSortStat && isPopoverOpen && filteredSortOptions.length > 0" class="popover">
            <div
              v-for="opt in filteredSortOptions"
              :key="opt.key"
              class="popoverItem"
              @mousedown.prevent="chooseSort(opt)"
            >
              {{ opt.label }}
            </div>
          </div>
        </div>
      </div>
      <div class="orderPicker">
        <label :class="{ active: isAscending }">Ascending</label>
        <input type="checkbox" is-="switch" bar-="thin" :checked="!isAscending" @change="isAscending = !$event.target.checked" />
        <label :class="{ active: !isAscending }">Descending</label>
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

.sortPicker {
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

.orderPicker label {
  color: var(--gray1);
}

.orderPicker label.active {
  color: var(--foreground0);
  font-weight: 700;
}

input[is-='switch'] {
  --switch-thumb-color: var(--foreground0);
  --switch-track-color: var(--background1);
}

.inputWrapper input[type='text'] {
  padding-right: 2.25em;
}

.clearBtn {
  position: absolute;
  right: 0.25em;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 0.25em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--foreground0);
  cursor: pointer;
}

.clearBtn .nf {
  font-size: 1em;
}

.clearBtn .icon::before {
  content: "\f014";
  font-family: "Symbols Nerd Font";
}

.clearBtn:hover {
  color: var(--gray0);
}

.clearBtn.disabled {
  color: var(--gray1);
  cursor: default;
  pointer-events: none;
}
</style>

