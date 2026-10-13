<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AlbumRow from '@/components/albums/AlbumRow.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorNotice from '@/components/ui/ErrorNotice.vue'
import { useAlbumList } from '@/composables/useAlbum'

const { albums, loading, error, load, publish, busyAlbumId } = useAlbumList()

onMounted(load)
</script>

<template>
  <section class="albums">
    <header class="page-header">
      <h1 class="title-serif page-title">Álbumes</h1>
      <RouterLink class="new-album" :to="{ name: 'album-new' }">Nuevo álbum</RouterLink>
    </header>

    <ErrorNotice v-if="error">{{ error }}</ErrorNotice>

    <p v-if="loading" class="state-line" role="status">Cargando álbumes…</p>

    <template v-else>
      <EmptyState
        v-if="albums.length === 0"
        title="Todavía no hay álbumes"
        description="Crea tu primer álbum para preparar la entrega con tu cliente."
      >
        <template #actions>
          <RouterLink class="new-album" :to="{ name: 'album-new' }">Nuevo álbum</RouterLink>
        </template>
      </EmptyState>

      <ul v-else class="rows">
        <AlbumRow
          v-for="album in albums"
          :key="album.id"
          :album="album"
          :busy="busyAlbumId === album.id"
          @publish="publish"
        />
      </ul>
    </template>
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

.new-album {
  padding: 0.5rem 1rem;
  color: #fff;
  font-weight: 500;
  background: var(--color-accent);
  border-radius: var(--radius-sm);
}

.new-album:hover {
  color: #fff;
  text-decoration: none;
  background: var(--color-accent-strong);
}

.state-line {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
  margin-bottom: var(--space-5);
}

.rows {
  list-style: none;
  padding: 0;
  border-top: var(--hairline) solid var(--color-line);
}
</style>
