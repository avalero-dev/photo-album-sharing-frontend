<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import ErrorNotice from '@/components/ui/ErrorNotice.vue'
import TextField from '@/components/ui/TextField.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const submitting = ref(false)

async function submit(): Promise<void> {
  errorMessage.value = ''
  submitting.value = true
  try {
    await auth.login(email.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin'
    await router.push(redirect)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="login">
    <p class="wordmark title-serif">photo-manager</p>
    <h1 class="title-serif page-title">Panel del fotógrafo</h1>

    <form @submit.prevent="submit">
      <TextField v-model="email" label="Email" type="email" required autocomplete="username" />
      <TextField
        v-model="password"
        label="Contraseña"
        type="password"
        required
        autocomplete="current-password"
      />
      <ErrorNotice v-if="errorMessage">{{ errorMessage }}</ErrorNotice>
      <AppButton type="submit" variant="primary" :busy="submitting">
        {{ submitting ? 'Entrando…' : 'Entrar' }}
      </AppButton>
    </form>
  </main>
</template>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-5);
  max-width: 21rem;
  min-height: 100svh;
  margin: 0 auto;
  padding: var(--space-5);
}

.wordmark {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

.page-title {
  font-size: var(--text-xl);
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
