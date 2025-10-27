<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

// Weapon type options
const weaponTypes = [
  { key: 'assault-rifles', label: 'Assault Rifles' },
  { key: 'submachine-guns', label: 'Submachine Guns' },
  { key: 'carbine', label: 'Carbine' },
  { key: 'marksman-rifle', label: 'Marksman Rifle' },
  { key: 'bolt-action-rifle', label: 'Bolt-Action Rifle' },
  { key: 'shotgun', label: 'Shotgun' },
  { key: 'light-machine-gun', label: 'Light Machine Gun' },
  { key: 'pistol', label: 'Pistol' }
]

// Reactive weapon type state from URL query (excluded types)
const excludedWeaponTypes = computed({
  get: () => {
    const types = route.query.excludedWeaponTypes
    return types ? types.split(',') : [] // Default to none excluded (all selected)
  },
  set: (value) => {
    updateExcludedWeaponTypes(value)
  }
})

const updateExcludedWeaponTypes = (types) => {
  router.push({
    path: route.path,
    query: { 
      ...route.query, 
      excludedWeaponTypes: types.length > 0 ? types.join(',') : undefined 
    },
  })
}

const toggleWeaponType = (type) => {
  const currentExcluded = [...excludedWeaponTypes.value]
  const index = currentExcluded.indexOf(type)
  
  if (index > -1) {
    // Remove from excluded list (checkbox becomes checked)
    currentExcluded.splice(index, 1)
  } else {
    // Add to excluded list (checkbox becomes unchecked)
    currentExcluded.push(type)
  }
  
  excludedWeaponTypes.value = currentExcluded
}
</script>

<template>
  <div class="box" box-="round" shear-="top">
    <span class="header" is-="badge" variant-="blue">type-filter</span>
    <div class="filters">
      <div class="weaponTypes">
        <div class="weaponTypeRow">
          <div v-for="type in weaponTypes" :key="type.key" class="weaponTypeItem">
            <input 
              type="checkbox" 
              :id="type.key"
              :checked="!excludedWeaponTypes.includes(type.key)"
              @change="toggleWeaponType(type.key)"
            />
            <label :for="type.key" class="weaponTypeLabel">{{ type.label }}</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weaponTypeRow {
  display: flex;
  flex-wrap: wrap;
  gap: 1ch;
}

.weaponTypeItem {
  white-space: nowrap;
}
</style>
