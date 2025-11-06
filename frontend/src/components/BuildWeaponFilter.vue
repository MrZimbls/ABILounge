<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed, ref } from 'vue'

const router = useRouter()
const route = useRoute()

// Reactive selected weapons from URL query
const selectedWeapons = computed({
  get: () => {
    const weapons = route.query.weapons
    return weapons ? weapons.split(',').filter(Boolean) : []
  },
  set: (value) => {
    updateWeapons(value)
  }
})

const updateWeapons = (weapons) => {
  router.push({
    path: route.path,
    query: {
      ...route.query,
      weapons: weapons.length > 0 ? weapons.join(',') : undefined,
      page: '1',
    },
  })
}

// Popover state for searching weapons
const isPopoverOpen = ref(false)
const searchQuery = ref('')

// This would typically come from an API or be loaded from available weapons
// For now, placeholder structure
const availableWeapons = ref([])

const filteredWeapons = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const selected = new Set(selectedWeapons.value)
  return availableWeapons.value.filter(weapon => {
    if (selected.has(String(weapon.id || weapon.name))) return false
    if (!query) return true
    const name = weapon.name || weapon.w_name || ''
    return name.toLowerCase().includes(query)
  })
})

const addWeapon = (weaponId) => {
  const idStr = String(weaponId)
  const current = [...selectedWeapons.value]
  if (!current.includes(idStr)) {
    current.push(idStr)
    selectedWeapons.value = current
  }
  searchQuery.value = ''
  isPopoverOpen.value = false
}

const removeWeapon = (weaponId) => {
  const idStr = String(weaponId)
  const current = selectedWeapons.value.filter(w => w !== idStr)
  selectedWeapons.value = current
}

const handleInputFocus = () => {
  isPopoverOpen.value = true
}

const handleInputBlur = () => {
  setTimeout(() => {
    isPopoverOpen.value = false
  }, 200)
}

// TODO: Load available weapons from API or store
</script>

<template>
  <div class="box" box-="round" shear-="top">
    <span class="header" is-="badge" variant-="orange">weapons</span>
    <div class="weaponControls">
      <div class="weaponInputWrapper">
        <input
          v-model="searchQuery"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
          placeholder="Search weapons..."
          size-="small"
          type="text"
        />
        <div v-if="isPopoverOpen && filteredWeapons.length > 0" class="weaponPopover">
          <div
            v-for="weapon in filteredWeapons"
            :key="weapon.id || weapon.name"
            class="weaponPopoverItem"
            @mousedown.prevent="addWeapon(weapon.id || weapon.name)"
          >
            {{ weapon.name || weapon.w_name || weapon.id }}
          </div>
        </div>
        <div v-else-if="isPopoverOpen && filteredWeapons.length === 0 && searchQuery" class="weaponPopover">
          <div class="weaponPopoverItem">No matches</div>
        </div>
      </div>
      <div v-if="selectedWeapons.length > 0" class="selectedWeapons">
        <span
          v-for="weaponId in selectedWeapons"
          :key="weaponId"
          class="weaponBadge"
          @click="removeWeapon(weaponId)"
        >
          {{ weaponId }}
          <!-- TODO: Display weapon name instead of ID -->
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weaponControls {
  display: flex;
  flex-direction: column;
  gap: 0.5ch;
}

.weaponInputWrapper {
  position: relative;
}

.weaponPopover {
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

.weaponPopoverItem {
  padding: 0.5ch 1ch;
  cursor: pointer;
}

.weaponPopoverItem:hover {
  background-color: var(--background0);
}

.selectedWeapons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5ch;
}

.weaponBadge {
  display: inline-block;
  padding: 0.25ch 0.75ch;
  background-color: var(--orange);
  color: var(--background0);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.weaponBadge:hover {
  background-color: var(--red);
}
</style>

