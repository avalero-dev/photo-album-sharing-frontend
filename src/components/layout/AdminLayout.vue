<script setup lang="ts">
import { RouterView } from 'vue-router'
import AdminNav from '@/components/layout/AdminNav.vue'
</script>

<template>
  <div class="admin">
    <AdminNav />
    <main id="contenido-principal" class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin {
  display: grid;
  grid-template-columns: 14rem minmax(0, 1fr);
  min-height: 100svh;
}

.content {
  max-width: 76rem;
  padding: var(--space-6) var(--space-5);
}

@media (max-width: 720px) {
  .admin {
    grid-template-columns: 1fr;
  }

  .content {
    padding: var(--space-5) var(--space-4);
  }
}
</style>
