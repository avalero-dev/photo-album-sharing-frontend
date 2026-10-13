import { computed, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { ApiError, getAlbum, listAlbums, publishAlbum, type Album } from '@/services/api'

// Estado de las vistas de álbumes: listado/gestión y detalle. — tarea 3.1
// `error` del listado permanece inline (estado de pantalla); el fallo al
// publicar es feedback transitorio de acción y se comunica con toast (D2/D4).

export function useAlbumList() {
  const toast = useToast()
  const albums = ref<Album[]>([])
  const loading = ref(true)
  const error = ref('')
  const busyAlbumId = ref<number | null>(null)

  async function load(): Promise<void> {
    error.value = ''
    loading.value = true
    try {
      albums.value = await listAlbums()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error inesperado'
    } finally {
      loading.value = false
    }
  }

  async function publish(album: Album): Promise<void> {
    busyAlbumId.value = album.id
    try {
      await publishAlbum(album.id)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      busyAlbumId.value = null
    }
  }

  return { albums, loading, error, load, publish, busyAlbumId }
}

export function useAlbum(albumId: () => number) {
  const album = ref<Album | null>(null)
  const loading = ref(false)
  const error = ref('')

  async function load(): Promise<void> {
    error.value = ''
    loading.value = true
    try {
      album.value = await getAlbum(albumId())
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        error.value = 'Álbum no encontrado'
      } else {
        error.value = e instanceof Error ? e.message : 'Error inesperado'
      }
    } finally {
      loading.value = false
    }
  }

  const status = computed(() => album.value?.status ?? null)

  return { album, loading, error, load, status }
}
