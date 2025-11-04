<script setup>
import { ref, onMounted } from 'vue'
import WelcomeText from '../components/WelcomeText.vue'
import { useAuth } from '../composables/useAuth.js'

const { login, loadStoredAuth, isAuthenticated } = useAuth()

const dialog = ref(null)
const demoCode = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

onMounted(() => {
  loadStoredAuth()
  // Show dialog on mount if not authenticated
  if (!isAuthenticated.value) {
    setTimeout(() => {
      if (dialog.value) {
        dialog.value.showModal()
      }
    }, 0)
  }
})

const handleSubmit = async () => {
  if (!demoCode.value.trim()) {
    errorMessage.value = 'Please enter a demo code'
    return
  }

  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const result = await login(demoCode.value.trim())
    if (result.success) {
      // Close dialog and redirect if needed
      if (dialog.value) {
        dialog.value.close()
      }
      // If user was trying to access a protected route, router guard will handle redirect
    } else {
      errorMessage.value = result.error || 'Authentication failed'
    }
  } catch (error) {
    errorMessage.value = error.message || 'An error occurred'
  } finally {
    isSubmitting.value = false
  }
}

const handleKeyPress = (event) => {
  if (event.key === 'Enter') {
    handleSubmit()
  }
}
</script>

<template>
  <div class="flex-container">
    <WelcomeText/>
    
    <dialog 
      ref="dialog" 
      position-="center start" 
      class="construction-dialog"
    >
      <div box-="round" class="dialog-content">
        <h2 class="dialog-title">Under Construction</h2>
        <p class="dialog-message">
          This website is currently under construction. If you have a demo code, enter it below to access the site.
        </p>
        
        <div class="input-group">
          <label for="demo-code">Demo Code:</label>
          <input
            id="demo-code"
            type="text"
            v-model="demoCode"
            @keypress="handleKeyPress"
            placeholder="Enter your demo code"
            :disabled="isSubmitting"
            class="demo-code-input"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="dialog-buttons">
          <button 
            @click="handleSubmit" 
            :disabled="isSubmitting || !demoCode.trim()"
            box-="round"
          >
            {{ isSubmitting ? 'Authenticating...' : 'Authenticate' }}
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.flex-container {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  align-content: center;
  height: 100vh;
  background-color: var(--background0);
}

:deep(.construction-dialog) {
  padding: 0;
}

:deep(.construction-dialog::backdrop) {
  background-color: rgba(0, 0, 0, 0.5);
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.5lh;
  padding: 2lh 2ch;
  background-color: var(--background1);
  min-width: 40ch;
}

.dialog-title {
  margin: 0;
  font-size: 1.2em;
  font-weight: bold;
}

.dialog-message {
  margin: 0;
  line-height: 1.6;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5lh;
}

.input-group label {
  font-weight: 500;
}

.demo-code-input {
  width: 100%;
  padding: 0.5lh 1ch;
}

.error-message {
  color: var(--error, #ff4444);
  font-size: 0.9em;
  padding: 0.5lh 1ch;
  background-color: var(--background2, rgba(255, 68, 68, 0.1));
  border-radius: 2px;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1ch;
  margin-top: 0.5lh;
}

.dialog-buttons button {
  min-width: 10ch;
}

.dialog-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
