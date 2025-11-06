<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

// Reactive search query from URL
const searchQuery = computed({
  get: () => (route.query.search || ''),
  set: (value) => {
    router.push({
      path: route.path,
      query: { ...route.query, search: value || undefined, page: '1' },
    })
  },
})
</script>

<template>
  <div class="box" box-="round" shear-="top">
    <span class="header" is-="badge" variant-="purple">search</span>
    <div class="searchControls">
      <input
        v-model="searchQuery"
        placeholder="Search build titles..."
        size-="small"
        type="text"
      />
    </div>
  </div>
</template>

<style scoped>
.searchControls {
  display: flex;
  gap: 1ch;
  align-items: center;
}

.searchControls input {
  flex: 1;
  min-width: 0;
}
</style>

