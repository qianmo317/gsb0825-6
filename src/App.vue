<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from './layouts/AdminLayout.vue'

const route = useRoute()

const layout = computed(() => {
  return route.meta.layout || null
})
</script>

<template>
  <component :is="layout === 'AdminLayout' ? AdminLayout : 'div'">
    <router-view v-if="!layout" />
  </component>
</template>

<style>
#app {
  height: 100vh;
  width: 100%;
}
</style>
