import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchMe, login as apiLogin, logout as apiLogout, type AdminUser } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AdminUser | null>(null)
  const isAuthenticated = computed(() => user.value !== null)

  async function login(email: string, password: string): Promise<void> {
    user.value = await apiLogin(email, password)
  }

  async function logout(): Promise<void> {
    await apiLogout()
    user.value = null
  }

  async function load(): Promise<void> {
    try {
      user.value = await fetchMe()
    } catch {
      user.value = null
    }
  }

  return { user, isAuthenticated, login, logout, load }
})
