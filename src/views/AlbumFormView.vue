<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import ErrorNotice from '@/components/ui/ErrorNotice.vue'
import TextField from '@/components/ui/TextField.vue'
import { useAlbumForm } from '@/composables/useAlbumForm'

const route = useRoute()
const router = useRouter()
const albumId = route.params.id ? Number(route.params.id) : null

const { title, quota, password, error, loading, submitting, load, save } = useAlbumForm(albumId)

onMounted(load)

async function submit(): Promise<void> {
  const created = await save()
  if (created) {
    await router.push({ name: 'albums' })
  }
}
</script>

<template>
  <section class="album-form">
    <h1 class="title-serif page-title">
      {{ albumId === null ? 'Nuevo álbum' : 'Editar álbum' }}
    </h1>

    <p v-if="loading" class="state-line" role="status">Cargando álbum…</p>

    <form v-else @submit.prevent="submit">
      <TextField v-model="title" label="Título" required :max-length="255" />
      <TextField
        v-model.number="quota"
        label="Cuota de fotos elegibles"
        type="number"
        required
        :min="1"
      />
      <TextField
        v-model="password"
        label="Contraseña (opcional)"
        type="password"
        autocomplete="new-password"
        hint="Sin contraseña el álbum queda abierto para quien tenga el enlace."
      />

      <ErrorNotice v-if="error">{{ error }}</ErrorNotice>

      <div class="buttons">
        <AppButton type="submit" variant="primary" :busy="submitting">
          {{ submitting ? 'Guardando…' : 'Guardar' }}
        </AppButton>
        <RouterLink class="cancel" :to="{ name: 'albums' }">Cancelar</RouterLink>
      </div>
    </form>
  </section>
</template>

<style scoped>
.album-form {
  max-width: 26rem;
}

.page-title {
  font-size: var(--text-xl);
  margin-bottom: var(--space-5);
}

.state-line {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.buttons {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.cancel {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

.cancel:hover {
  color: var(--color-ink);
}
</style>
