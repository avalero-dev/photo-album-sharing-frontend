<script setup lang="ts">
import { ref } from 'vue'
import type { Album } from '@/services/api'

const props = defineProps<{
  album: Album
}>()

const copied = ref(false)

function publicAlbumPath(album: Album): string {
  return `/a/${album.token}`
}

async function copyLink(): Promise<void> {
  const url = `${window.location.origin}${publicAlbumPath(props.album)}`
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    window.prompt('Copia el enlace público:', url)
  }
}
</script>

<template>
  <span class="public-link">
    <a class="path" :href="publicAlbumPath(album)" target="_blank" rel="noopener">
      {{ publicAlbumPath(album) }}
      <span class="sr-only">(se abre en una pestaña nueva)</span>
    </a>
    <button type="button" class="copy" @click="copyLink">
      {{ copied ? 'Copiado' : 'Copiar' }}
    </button>
  </span>
</template>

<style scoped>
.public-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.path {
  max-width: 14rem;
  overflow: hidden;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy {
  flex: none;
  padding: 0;
  font-size: var(--text-xs);
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
}

.copy:hover {
  color: var(--color-accent-strong);
  text-decoration: underline;
}
</style>
