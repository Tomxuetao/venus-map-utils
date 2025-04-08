<template>
  <div class="site-wrapper">
    <div id="container" class="map-container"></div>
  </div>
</template>

<script setup>
import { createAMapInstance } from 'venus-amap'
import { nextTick, onMounted, onBeforeUnmount } from 'vue'

let mapInstance
const initMapHandler = () => {
  mapInstance = createAMapInstance('container', {
    layerStyle: ''
  })
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
