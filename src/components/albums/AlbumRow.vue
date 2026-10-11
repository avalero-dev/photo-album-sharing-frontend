<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Album } from '@/services/api'
import AlbumPublicLink from '@/components/albums/AlbumPublicLink.vue'
import StatusMarker from '@/components/ui/StatusMarker.vue'
import { albumStatusLabel, albumStatusTone } from '@/lib/albumStatus'

defineProps<{
  album: Album
  busy?: boolean
}>()

defineEmits<{
  publish: [album: Album]
}>()
</script>

<template>
  <li class="row">
    <RouterLink class="title title-serif" :to="{ name: 'album-photos', params: { id: album.id } }">
      {{ album.title }}
    </RouterLink>

    <StatusMarker :tone="albumStatusTone(album.status)" :text="albumStatusLabel(album.status)" />

    <span class="quota counter">{{ album.quota }} fotos</span>

    <div class="link-slot">
      <AlbumPublicLink v-if="album.status !== 'DRAFT'" :album="album" />
      <span v-else class="muted" aria-hidden="true">—</span>
    </div>

    <div class="actions">
      <RouterLink class="action" :to="{ name: 'album-edit', params: { id: album.id } }">
        Editar
      </RouterLink>
      <button
        v-if="album.status === 'DRAFT'"
        type="button"
        class="action"
        :disabled="busy"
        @click="$emit('publish', album)"
      >
        {{ busy ? 'Publicando…' : 'Publicar' }}
      </button>
    </div>
  </li>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) auto auto minmax(0, 1.5fr) auto;
  grid-template-areas: 'title status quota link actions';
  align-items: baseline;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-bottom: var(--hairline) solid var(--color-line);
}

.row:hover .title {
  color: var(--color-accent-strong);
}

.title {
  grid-area: title;
  font-size: var(--text-lg);
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quota {
  grid-area: quota;
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

.link-slot {
  grid-area: link;
  min-width: 0;
}

.muted {
  color: var(--color-line);
}

.link-slot :deep(.path) {
  vertical-align: middle;
}

.actions {
  grid-area: actions;
  display: flex;
  justify-content: flex-end;
  gap: var(--space-4);
}

.action {
  padding: 0;
  font-size: var(--text-sm);
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
}

.action:hover:not(:disabled) {
  color: var(--color-accent-strong);
  text-decoration: underline;
}

.action:disabled {
  opacity: 0.55;
  cursor: default;
}

/* Panel estrecho: la fila pasa a dos líneas y el enlace público baja a su propia
   línea, sin desplazamiento horizontal — tarea 6.2 */
@media (max-width: 900px) {
  .row {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'status title quota'
      'link   link  link'
      'actions actions actions';
    row-gap: var(--space-2);
  }

  .title {
    white-space: normal;
    font-size: var(--text-base);
    line-height: var(--lh-snug);
  }

  .actions {
    justify-content: flex-start;
  }
}
</style>
