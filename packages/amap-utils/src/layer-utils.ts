import emitter from './emitter'
import { instance } from './create-amap'
import type {Marker,
  Polygon,
  Polyline,
  MassData,
  TileLayer,
  MassMarks,
  GetImgUrl,
  LineConfig,
  IconConfig,
  GetImgUrlFn,
  OverlayGroup} from './types.ts'

/**
 * 重置激活的矢量数据
 * @param type
 */
export const resetActiveVector = (type = 'polygon') => {
  const overlays = instance?.getAllOverlays(type)
  const activeOverlay = overlays.find(
    (overlay: { _isActive: boolean }) => overlay._isActive
  )
  if (activeOverlay) {
    activeOverlay._isActive = false
    if (activeOverlay._isRaw) {
      activeOverlay.setOptions(activeOverlay._options)
    } else {
      instance.remove(activeOverlay)
    }
  }
  // 移除一些附带的Marker标注
  const targetLayers = instance
    .getLayers()
    .filter((layer: TileLayer) => layer._layerName === 'river-marker')
  instance.remove(targetLayers)
}

/**
 * 组装线数据配置
 * @param dataList
 * @param config
 */
export const assembleLineOptions = (
  dataList: any[],
  config: LineConfig = {
    key: 'facilitytrajectory',
    width: 4,
    strokeStyle: 'solid',
    strokeColor: ''
  }
) => {
  const {
    key = 'facilitytrajectory',
    width = 4,
    strokeColor,
    strokeStyle = 'solid'
  } = config

  const optionsList: AMap.Polyline.Options[] = []
  dataList.forEach((item: { [x: string]: any }) => {
    const pathArray = Array.isArray(item[key])
      ? item[key]
      : JSON.parse(item[key] || '[]')
    if (pathArray.length) {
      optionsList.push({
        ...config,
        extData: item,
        path: pathArray,
        strokeOpacity: 0.5,
        strokeWeight: width,
        strokeColor: strokeColor,
        strokeStyle: strokeStyle === 'dashed' ? 'dashed' : 'solid'
      })
    }
  })

  return optionsList
}

/**
 * 创建矢量连图层
 * @param dataList
 * @param config
 */
export const createVectorLineLayer = (
  dataList: any[] = [],
  config: LineConfig
) => {
  const lineOptions = assembleLineOptions(dataList, config)
  const { isRaw = true, openClick = true } = config

  const polylineList: AMap.Polyline[] = []
  lineOptions.forEach((item) => {
    try {
      const options = Object.assign({ zIndex: -1, cursor: 'pointer' }, item)
      const polyline: Polyline = new AMap.Polyline(options)
      polyline._isActive = false
      polyline._isRaw = isRaw
      polyline._options = { ...options }
      polyline._id = item.extData.id
      polyline._uuid = item.extData._uuid
      polylineList.push(polyline)
    } catch (e) {
      console.error(e)
      console.error(`创建线状数据失败：${item.toString()}`)
    }
  })

  const overlayGroup: OverlayGroup = new AMap.OverlayGroup()
  overlayGroup._isCustom = true
  overlayGroup.addOverlays(polylineList)

  if (openClick) {
    overlayGroup.on('click', ({ target }) => {
      resetActiveVector('polyline')
      target._isActive = true
      emitter.emit('layer-click', target.getExtData())
    })
  }
  return overlayGroup
}

/**
 * 组装面数据配置
 * @param dataList
 * @param config
 */
export const assembleFaceOptions = (dataList: any, config: any) => {
  const {
    key = 'coordinates',
    fillColor,
    fillOpacity = 1,
    colorKey,
    colorMap = new Map(),
    strokeStyle = 'solid',
    strokeColor,
    strokeWeight,
    borderWeight = 0
  } = config

  const optionsList: AMap.Polygon.Options[] = []
  dataList.forEach((item: any) => {
    const pathArray = Array.isArray(item[key])
      ? item[key]
      : JSON.parse(item[key] || '[]')
    if (pathArray.length) {
      optionsList.push({
        ...config,
        extData: item,
        path: pathArray,
        strokeStyle: strokeStyle,
        fillOpacity: fillOpacity,
        strokeWeight: strokeWeight,
        borderWeight: borderWeight,
        fillColor: colorMap.get(item[colorKey]) || fillColor,
        strokeColor: colorMap.get(item[colorKey]) || strokeColor
      })
    }
  })
  return optionsList
}

/**
 * 创建面状数据
 * @param dataList
 * @param config
 */
export const createVectorFaceLayer = (
  dataList = [],
  config: {
    key?: string
    fillOpacity?: number
    fillColor?: string
    strokeWeight?: number
    strokeColor?: string
    strokeStyle?: string
    isRaw?: any
    openClick?: any
  }
) => {
  const { isRaw = true, openClick = true } = config
  const faceOptions = assembleFaceOptions(dataList, config)
  const polygonList: Polygon[] = []
  faceOptions.forEach((item) => {
    try {
      const options = { zIndex: -1, cursor: 'pointer', ...item }
      const polygon: Polygon = new AMap.Polygon()
      polygon.setOptions(options)
      polygon._isActive = false
      polygon._isRaw = isRaw
      polygon._options = { ...options }
      polygon._id = item.extData.id
      polygon._uuid = item.extData._uuid
      polygonList.push(polygon)
    } catch (e) {
      console.error(e)
      console.error(`创建面状数据失败：${item.toString()}`)
    }
  })

  const overlayGroup: OverlayGroup = new AMap.OverlayGroup()
  overlayGroup._isCustom = true
  overlayGroup.addOverlays(polygonList)

  if (openClick) {
    overlayGroup.on('click', ({ target }) => {
      resetActiveVector()
      target._isActive = true
      emitter.emit('layer-click', target.getExtData())
    })
  }
  return overlayGroup
}

/**
 * 移除覆盖物已经自定义图层
 * @param isClearAll
 */
export const removeAllLayers = (isClearAll = true) => {
  if (instance) {
    const massMarksLayers = instance._massMarksLayers
    if (Array.isArray(massMarksLayers)) {
      massMarksLayers.forEach((layer) => {
        layer.clear()
        layer.setMap(null)
      })
      instance._massMarksLayers = []
    }
    if (isClearAll) {
      instance?.clearMap()
    }
    instance?.remove(
      instance?.getLayers().filter((item: TileLayer) => item._isCustom)
    )
  }
}

/**
 * 根据当前Marker创建一个动画Marker
 * @param lnglat
 * @param config
 */
export const createAnimationMarker = (
  lnglat: AMap.LocationValue,
  config: {
    alarmLevel: number | string
    getAnimationUrl: GetImgUrl
    size: any
  }
) => {
  const { size, alarmLevel, getAnimationUrl } = config

  const activeAnimation: Marker = new AMap.Marker({
    position: lnglat,
    zIndex: 101,
    bubble: false,
    clickable: false,
    topWhenClick: true,
    anchor: 'bottom-center',
    icon: new AMap.Icon({
      size: size,
      imageSize: size,
      image: `${getAnimationUrl(`marker-${alarmLevel}-active`, '.png')}`
    })
  })
  activeAnimation._isAnimation = true

  return activeAnimation
}

/**
 * 重置激活Marker
 */
export const resetActiveMarker = () => {
  if (instance) {
    const massMarksLayers: MassMarks[] = instance._massMarksLayers.filter(
      (layer: MassMarks) => layer._isMassMarksLayer && layer._hasActive
    )
    // 重置MassMarksLayer图层数据
    massMarksLayers.forEach((layer: MassMarks) => {
      const dataList: MassData[] = layer.getData()
      const tempIndex = dataList.findIndex(
        (item: MassData) => item.style! >= layer._statusNum!
      )
      if (tempIndex !== -1) {
        const tempData: MassData = dataList[tempIndex]
        dataList[tempIndex] = {
          ...tempData,
          style: tempData.style! - layer._statusNum!
        }
        layer.setData(dataList)
        layer._hasActive = false
      }
    })

    // 移除Animation Marker
    const overlays: Marker[] = instance
      ?.getAllOverlays()
      .filter((overlay: Marker) => overlay._isAnimation)
    overlays.forEach((overlay) => {
      instance.remove(overlay)
    })
  }
}

/**
 * 激活标注点
 * @param getAnimationUrl
 */
export const activeMarkerByUid = (getAnimationUrl: GetImgUrl) => {
  return (uid: string, setFitView = true) => {
    resetActiveMarker()
    const massMarksLayers = instance._massMarksLayers.filter(
      (layer: MassMarks) => layer._isMassMarksLayer
    )
    massMarksLayers.forEach((layer: MassMarks) => {
      const dataList: MassData[] = layer.getData()
      const tempIndex = dataList.findIndex((item) => item._uuid === uid)
      if (tempIndex !== -1) {
        const tempData: MassData = dataList[tempIndex]
        const styleIndex = tempData.style! + layer._statusNum!
        dataList[tempIndex] = {
          ...tempData,
          style: styleIndex
        }

        layer.setData(dataList)
        layer._hasActive = true
        if (setFitView) {
          instance.setZoomAndCenter(12, tempData.lnglat, false, 800)
        }
        if (layer._isDynamic) {
          const styleList = layer.getStyle() as AMap.MassMarks.Style[]
          instance.add(
            createAnimationMarker(tempData.lnglat, {
              ...styleList[styleIndex],
              alarmLevel: tempData.style!,
              getAnimationUrl
            })
          )
        }
      }
    })
  }
}

/**
 * 构建MassMarks样式数组
 */
export const buildMassMarksStyles = (getImgUrlFn: GetImgUrlFn) => {
  return (iconConfig: IconConfig) => {
    const {
      baseUrl,
      markerIcon,
      markerSize = [32, 32],
      statusNum = 5,
      activeScale = 1.3
    } = iconConfig
    const getMarkerUrl: GetImgUrl = getImgUrlFn(baseUrl)
    const [x, y] = markerSize
    const massMarksStyles = new Array(statusNum * 2)
    for (let i = 0; i < statusNum; i++) {
      // 默认样式
      const imageUrl = getMarkerUrl(`${markerIcon}-${i}`, '.webp')
      massMarksStyles[i] = {
        zIndex: 88 + i,
        url: imageUrl,
        size: markerSize,
        anchor: [x / 2, y]
      }

      // 激活样式
      const activeImage = getMarkerUrl(`${markerIcon}-${i}-active`, '.webp')
      massMarksStyles[i + statusNum] = {
        zIndex: 102,
        url: activeImage ? activeImage : imageUrl,
        size: markerSize.map((item: number) => item * activeScale),
        anchor: [(x / 2) * activeScale, y * activeScale]
      }
    }
    return massMarksStyles
  }
}

/**
 * 创建massMarksLayer
 * @param dataList
 * @param styleList
 * @param openClick
 */
export const createMassMarksLayer = (
  dataList: MassData[],
  styleList: AMap.MassMarks.Style[] = [],
  openClick: boolean = true
) => {
  const massMarksLayer: MassMarks = new AMap.MassMarks(dataList, {
    zIndex: 240,
    style: styleList,
    cursor: 'pointer'
  })
  massMarksLayer._isCustom = true
  massMarksLayer._isMassMarksLayer = true
  massMarksLayer._dataList = dataList
  massMarksLayer._statusNum = styleList.length / 2
  if (openClick) {
    massMarksLayer.on('click', ({ data }) => {
      emitter.emit('marker-click', data)
    })

    const infoWindow = new AMap.InfoWindow({
      anchor: 'top-center'
    })
    massMarksLayer.on('mouseout', () => {
      infoWindow.close()
    })
    massMarksLayer.on('mouseover', ({ data }) => {
      infoWindow.setContent(`${data.name}`)
      infoWindow.open(instance, data.lnglat)
    })
  }

  instance._massMarksLayers.push(massMarksLayer)
  return massMarksLayer
}

/**
 * 添加massMarksLayer
 * @param getImgUrlFn
 */
export const addMassMarksLayer = (getImgUrlFn: GetImgUrlFn) => {
  return (dataList = [], iconConfig: IconConfig, openClick = true) => {
    const {
      baseUrl,
      markerIcon,
      markerSize,
      isDynamic,
      statusNum,
      hasLine,
      hasFace
    } = iconConfig
    const massMarksStyles: AMap.MassMarks.Style[] = buildMassMarksStyles(
      getImgUrlFn
    )({
      baseUrl,
      markerIcon,
      markerSize,
      activeScale: 1.3,
      statusNum: statusNum || 5
    })
    const massMarksLayer = createMassMarksLayer(
      dataList,
      massMarksStyles,
      openClick
    )
    if (hasLine) {
      massMarksLayer._hasLine = true
      instance.add(
        createVectorLineLayer(dataList, {
          key: 'line',
          strokeColor: 'rgba(29, 235, 255, 0.8)'
        })
      )
    }

    if (hasFace) {
      massMarksLayer._hasFace = true
      instance.add(
        createVectorFaceLayer(dataList, {
          key: 'faceList',
          fillOpacity: 0.1,
          fillColor: '#4247DF',
          strokeWeight: 1,
          strokeColor: '#4247DF',
          strokeStyle: 'dashed'
        })
      )
    }
    massMarksLayer._isDynamic = isDynamic
    massMarksLayer.setMap(instance)
    return massMarksLayer
  }
}

/**
 * 更新图层根据选中状态列表
 */
export const updateMarksLayersByStatus = (checkedStatusList: any[] = []) => {
  const massMarksLayers: MassMarks[] = instance._massMarksLayers
  const tempDataList: MassData[] = []
  massMarksLayers.forEach((layer: MassMarks) => {
    layer.clear()
    const dataList: MassData[] = layer._dataList?.filter((item) =>
      checkedStatusList.includes(item._status || item.status)
    )!
    tempDataList.push(...dataList)
    layer.setData(tempDataList)
    if (layer._hasLine) {
      instance?.getAllOverlays().forEach((overlay: Polyline) => {
        if (dataList.includes(overlay.getExtData())) {
          overlay.show()
        } else {
          overlay.hide()
        }
      })
    }
  })

  return tempDataList
}
