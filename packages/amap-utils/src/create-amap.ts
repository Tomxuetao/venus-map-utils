import type { MassMarks } from './types.ts'
import { removeAllLayers } from './layer-utils'
import { createBaseImageLayer } from './base-layer'

export let instance: any
/**
 * 创建地图实例
 */
export const createAMapInstance = async (
  container: string = 'container',
  mapConfig: AMap.Map.Options = {
    pitch: 0,
    zoom: 9.25,
    zooms: [9.25, 20],
    mapStyle: '',
    features: [],
    viewMode: '3D',
    dragEnable: true,
    pitchEnable: false,
    center: [119.72, 30.12],
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
    center: [119.72, 30.12],
    layers: [createBaseImageLayer()],
    ...mapConfig
  })
  instance._massMarksLayers = [] as MassMarks[]
  return instance
}

/**
 * 获取地图实例
 */
export const getAMapInstance = async (container = 'container') => {
  return await createAMapInstance(container)
}

/**
 * 重置地图缩放和中心点
 */
export const resetZoomAndCenter = (center = [119.72, 29.95]) => {
  // @ts-ignore
  instance?.setZoomAndCenter(9.25, center, false, 1000)
}

/**
 * 重置地图
 * @param config
 */
export const resetMap = (
  config = { center: [119.72, 29.95], isClearAll: true }
) => {
  removeAllLayers(config.isClearAll)
  resetZoomAndCenter(config.center || [119.72, 29.95])
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
