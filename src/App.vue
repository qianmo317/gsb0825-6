<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AdminLayout from "./layouts/AdminLayout.vue";

const route = useRoute();

const layout = computed(() => {
  return route.meta.layout || null;
});
</script>

<template>
  <component :is="layout === 'AdminLayout' ? AdminLayout : 'div'">
    <router-view v-if="!layout" />
  </component>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  overflow-x: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
  min-height: 100vh;
  min-width: 100vw;
  padding: 0;
}
</style>
