<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/composables/useNotifications'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const { unread, load } = useNotifications()

const albumsActive = computed(() => {
  const name = String(route.name ?? '')
  return name === 'albums' || name.startsWith('album-')
})

const notificationsActive = computed(() => route.name === 'notifications')

async function signOut(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}

onMounted(load)
</script>

<template>
  <aside class="rail">
    <p class="wordmark title-serif">photo-manager</p>

    <nav class="sections" aria-label="Secciones del panel">
      <RouterLink
        class="link"
        :class="{ active: albumsActive }"
        :aria-current="albumsActive ? 'page' : undefined"
        :to="{ name: 'albums' }"
      >
        Álbumes
      </RouterLink>
      <RouterLink
        class="link"
        :class="{ active: notificationsActive }"
        :aria-current="notificationsActive ? 'page' : undefined"
        :to="{ name: 'notifications' }"
      >
        Notificaciones
        <span
          v-if="unread > 0"
          class="badge counter"
          :aria-label="`${unread} notificaciones sin leer`"
        >
          {{ unread }}
        </span>
      </RouterLink>
    </nav>

    <footer class="session">
      <p class="email">{{ auth.user?.email }}</p>
      <button type="button" class="signout" @click="signOut">Salir</button>
    </footer>
  </aside>
</template>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-4);
  border-right: var(--hairline) solid var(--color-line);
  position: sticky;
  top: 0;
  height: 100svh;
}

.wordmark {
  font-size: var(--text-lg);
}

.sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.375rem 0.5rem;
  color: var(--color-ink-soft);
  border-left: 3px solid transparent;
}

.link:hover {
  color: var(--color-ink);
  text-decoration: none;
}

.link.active {
  color: var(--color-ink);
  background: var(--color-surface);
  border-left-color: var(--color-accent);
}

.badge {
  min-width: 1.25rem;
  padding: 0 0.3rem;
  margin-left: auto;
  font-size: var(--text-xs);
  line-height: 1.25rem;
  text-align: center;
  color: #fff;
  background: var(--color-accent);
  border-radius: var(--radius-pill);
}

.session {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: auto;
  padding-top: var(--space-3);
  border-top: var(--hairline) solid var(--color-line);
}

.email {
  overflow: hidden;
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.signout {
  align-self: flex-start;
  padding: 0;
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
  background: none;
  border: none;
  cursor: pointer;
}

.signout:hover {
  color: var(--color-ink);
  text-decoration: underline;
}

/* Pantallas estrechas: el rail colapsa a una barra superior — tarea 2.3 */
@media (max-width: 720px) {
  .rail {
    height: auto;
    position: static;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4) 0;
    border-right: none;
    border-bottom: var(--hairline) solid var(--color-line);
  }

  .sections {
    flex-direction: row;
    gap: var(--space-4);
  }

  .link {
    padding: var(--space-1) 0;
    border-left: none;
    border-bottom: 3px solid transparent;
  }

  .link.active {
    border-bottom-color: var(--color-accent);
  }

  .session {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-4);
    margin-top: 0;
    padding-top: 0;
    padding-bottom: var(--space-2);
    border-top: none;
  }
}
</style>
