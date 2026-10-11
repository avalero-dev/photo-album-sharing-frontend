<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorNotice from '@/components/ui/ErrorNotice.vue'
import { useNotifications } from '@/composables/useNotifications'

const { items, unread, loading, error, busyId, load, markRead } = useNotifications()

const typeLabels: Record<string, string> = {
  ALBUM_PUBLISHED: 'Álbum publicado',
  SELECTION_FINALIZED: 'Selección finalizada',
  ORIGINALS_UPLOADED: 'Originales subidos',
  DELIVERY_OPENED: 'Entrega abierta',
}

function label(type: string): string {
  return typeLabels[type] ?? type
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-CL')
}

onMounted(load)
</script>

<template>
  <section class="notifications">
    <header class="page-header">
      <h1 class="title-serif page-title">Notificaciones</h1>
      <p class="unread-note">
        <span v-if="unread > 0" class="counter">{{ unread }} sin leer</span>
        <span v-else class="calm">Nada sin leer</span>
      </p>
    </header>

    <ErrorNotice v-if="error">{{ error }}</ErrorNotice>

    <p v-if="loading" class="state-line" role="status">Cargando notificaciones…</p>

    <EmptyState
      v-else-if="items.length === 0"
      title="No hay notificaciones"
      description="Cuando algo ocurra con tus álbumes —publicación, selección del cliente, entrega— aparecerá aquí."
    />

    <ul v-else class="list">
      <li v-for="item in items" :key="item.id" class="row" :class="{ 'row-unread': !item.read }">
        <div class="body">
          <span class="type">{{ label(item.type) }}</span>
          <span class="meta"
            >Álbum #<span class="counter">{{ item.albumId }}</span> ·
            {{ formatDate(item.occurredAt) }}</span
          >
        </div>

        <RouterLink
          v-if="item.type === 'SELECTION_FINALIZED'"
          class="see-album"
          :to="{ name: 'album-photos', params: { id: item.albumId } }"
        >
          Ver álbum
        </RouterLink>

        <AppButton
          v-if="!item.read"
          variant="ghost"
          :busy="busyId === item.id"
          @click="markRead(item)"
        >
          {{ busyId === item.id ? 'Marcando…' : 'Marcar como leída' }}
        </AppButton>
        <span v-else class="read-tag">Leída</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.page-title {
  font-size: var(--text-xl);
}

.unread-note {
  font-size: var(--text-sm);
  color: var(--color-accent);
}

.calm {
  color: var(--color-ink-soft);
}

.state-line {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

.list {
  list-style: none;
  padding: 0;
  border-top: var(--hairline) solid var(--color-line);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-bottom: var(--hairline) solid var(--color-line);
}

.row-unread .type {
  color: var(--color-ink);
}

.row-unread .type::before {
  content: '';
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin-right: var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  flex: 1;
}

.type {
  font-weight: 500;
  color: var(--color-ink-soft);
}

.meta {
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
}

.see-album {
  flex: none;
  font-size: var(--text-sm);
}

.read-tag {
  flex: none;
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
}

@media (max-width: 560px) {
  .row {
    flex-wrap: wrap;
  }

  .body {
    flex-basis: 100%;
  }
}
</style>
