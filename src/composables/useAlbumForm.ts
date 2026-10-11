import { computed, ref } from 'vue'
import { createAlbum, getAlbum, updateAlbum, type AlbumInput } from '@/services/api'

// Alta y edición de álbumes, extraída de AlbumFormView — tarea 3.1.

export function useAlbumForm(albumId: number | null) {
  const title = ref('')
  const quota = ref<number>(10)
  const password = ref('')
  const error = ref('')
  const loading = ref(albumId !== null)
  const submitting = ref(false)

  async function load(): Promise<void> {
    if (albumId === null) {
      return
    }
    try {
      const album = await getAlbum(albumId)
      title.value = album.title
      quota.value = album.quota
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error inesperado'
    } finally {
      loading.value = false
    }
  }

  const isValid = computed(
    () => title.value.trim().length > 0 && Number.isInteger(quota.value) && quota.value >= 1,
  )

  async function save(): Promise<boolean> {
    error.value = ''
    if (!isValid.value) {
      error.value = 'Revisa el título y la cuota: debe ser un número entero mayor que cero.'
      return false
    }
    submitting.value = true
    try {
      const input: AlbumInput = { title: title.value.trim(), quota: quota.value }
      if (password.value !== '') {
        input.password = password.value
      }
      if (albumId === null) {
        await createAlbum(input)
      } else {
        await updateAlbum(albumId, input)
      }
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error inesperado'
      return false
    } finally {
      submitting.value = false
    }
  }

  return { title, quota, password, error, loading, submitting, load, save }
}
