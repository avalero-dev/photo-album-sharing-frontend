import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'albums' } },
    {
      path: '/a/:token',
      name: 'public-gallery',
      component: () => import('@/views/PublicGalleryView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/admin',
      name: 'albums',
      component: () => import('@/views/AlbumListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/albums/new',
      name: 'album-new',
      component: () => import('@/views/AlbumFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/albums/:id/edit',
      name: 'album-edit',
      component: () => import('@/views/AlbumFormView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.user === null) {
    await auth.load()
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'albums' }
  }
  return true
})

export default router
