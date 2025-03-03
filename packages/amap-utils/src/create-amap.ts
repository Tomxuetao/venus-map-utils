import { CustomMap, MassMarks } from './types'
import { removeAllLayers } from './layer-utils'
import { createBaseImageLayer } from './base-layer'

export let instance: CustomMap
let mapCenter: [number, number] = [119.72, 29.95]

/**
 * 创建地图实例
 */
export const createAMapInstance = (
  container: string = 'container',
  mapConfig: AMap.MapOptions = {
    pitch: 0,
    zoom: 9.25,
    zooms: [9.25, 20],
    mapStyle: '',
    features: [],
    viewMode: '3D',
    dragEnable: true,
    pitchEnable: false,
    center: mapCenter,
    layers: [createBaseImageLayer()]
  }
) => {
  if (instance) {
    return instance
  }

  instance = new AMap.Map(container, {
    pitch: 0,
    zoom: 9.25,
    zooms: [9.25, 20],
    mapStyle: '',
    features: [],
    viewMode: '3D',
    dragEnable: true,
    pitchEnable: false,
    center: mapCenter,
    layers: [createBaseImageLayer()],
    ...mapConfig
  })
  mapCenter = mapConfig.center || mapCenter
  instance._massMarksLayers = [] as MassMarks[]
  return instance
}

/**
 * 获取地图实例
 */
export const getAMapInstance = (container = 'container') => {
  return createAMapInstance(container)
}

/**
 * 重置地图缩放和中心点
 */
export const resetZoomAndCenter = (center = mapCenter) => {
  instance?.setZoomAndCenter(9.25, center, false, 1000)
}

/**
 * 重置地图
 * @param config
 */
export const resetMap = (config = { center: mapCenter, isClearAll: true }) => {
  removeAllLayers(config.isClearAll)
  resetZoomAndCenter(config.center || mapCenter)
}

/**
 * 销毁地图
 */
export const disposeMap = () => {
  if (instance) {
    instance.destroy()
    // @ts-ignore
    instance = null
  }
}
