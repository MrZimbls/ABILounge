<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed, ref } from 'vue'

const router = useRouter()
const route = useRoute()

// Example tags - this should be populated from backend or config
const availableTags = [
  { key: 'pvp', label: 'PvP' },
  { key: 'pve', label: 'PvE' },
  { key: 'budget', label: 'Budget' },
  { key: 'meta', label: 'Meta' },
  { key: 'stealth', label: 'Stealth' },
  { key: 'long-range', label: 'Long Range' },
  { key: 'close-range', label: 'Close Range' },
  { key: 'versatile', label: 'Versatile' },
]

// Reactive selected tags from URL query
const selectedTags = computed({
  get: () => {
    const tags = route.query.tags
    return tags ? tags.split(',').filter(Boolean) : []
  },
  set: (value) => {
    updateTags(value)
  }
})

const updateTags = (tags) => {
  router.push({
    path: route.path,
    query: {
      ...route.query,
      tags: tags.length > 0 ? tags.join(',') : undefined,
      page: '1',
    },
  })
}

const toggleTag = (tagKey) => {
  const currentTags = [...selectedTags.value]
  const index = currentTags.indexOf(tagKey)
  
  if (index > -1) {
    currentTags.splice(index, 1)
  } else {
    currentTags.push(tagKey)
  }
  
  selectedTags.value = currentTags
}

// Popover state for searching tags
const isPopoverOpen = ref(false)
const searchQuery = ref('')

const filteredTags = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const selected = new Set(selectedTags.value)
  return availableTags.filter(tag => {
    if (selected.has(tag.key)) return false
    if (!query) return true
    return tag.label.toLowerCase().includes(query) || tag.key.toLowerCase().includes(query)
  })
})

const addTag = (tagKey) => {
  const current = [...selectedTags.value]
  if (!current.includes(tagKey)) {
    current.push(tagKey)
    selectedTags.value = current
  }
  searchQuery.value = ''
  isPopoverOpen.value = false
}

const removeTag = (tagKey) => {
  const current = selectedTags.value.filter(t => t !== tagKey)
  selectedTags.value = current
}

const handleInputFocus = () => {
  isPopoverOpen.value = true
}

const handleInputBlur = () => {
  setTimeout(() => {
    isPopoverOpen.value = false
  }, 200)
}
</script>

<template>
  <div class="box" box-="round" shear-="top">
    <span class="header" is-="badge" variant-="purple">tags</span>
    <div class="tagControls">
      <div class="tagInputWrapper">
        <input
          v-model="searchQuery"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
          placeholder="Search tags..."
          size-="small"
          type="text"
        />
        <div v-if="isPopoverOpen && filteredTags.length > 0" class="tagPopover">
          <div
            v-for="tag in filteredTags"
            :key="tag.key"
            class="tagPopoverItem"
            @mousedown.prevent="addTag(tag.key)"
          >
            {{ tag.label }}
          </div>
        </div>
        <div v-else-if="isPopoverOpen && filteredTags.length === 0" class="tagPopover">
          <div class="tagPopoverItem">No matches</div>
        </div>
      </div>
      <div v-if="selectedTags.length > 0" class="selectedTags">
        <span
          v-for="tagKey in selectedTags"
          :key="tagKey"
          class="tagBadge"
          @click="removeTag(tagKey)"
        >
          {{ availableTags.find(t => t.key === tagKey)?.label || tagKey }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tagControls {
  display: flex;
  flex-direction: column;
  gap: 0.5ch;
}

.tagInputWrapper {
  position: relative;
}

.tagPopover {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--background1);
  border: 1px solid var(--fg);
  border-radius: 4px;
  max-height: 20ch;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 0.25ch;
}

.tagPopoverItem {
  padding: 0.5ch 1ch;
  cursor: pointer;
}

.tagPopoverItem:hover {
  background-color: var(--background0);
}

.selectedTags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5ch;
}

.tagBadge {
  display: inline-block;
  padding: 0.25ch 0.75ch;
  background-color: var(--purple);
  color: var(--background0);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.tagBadge:hover {
  background-color: var(--red);
}
</style>

