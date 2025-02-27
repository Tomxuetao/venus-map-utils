<template>
  <div class="site-wrapper">
    <div id="container" class="map-container"></div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onBeforeUnmount } from 'vue'
import { createAMapInstance } from 'venus-amap'

let mapInstance
const initMapHandler = async () => {
  mapInstance = await createAMapInstance()
}

onMounted(() => {
  nextTick(() => {
    initMapHandler()
  })
})

onBeforeUnmount(() => {
  mapInstance.destroy()
})
</script>

<style scoped>
.site-wrapper {
  width: 100vw;
  height: 100vh;

  .map-container {
    width: 100vw;
    height: 100vh;
  }
}
</style>
