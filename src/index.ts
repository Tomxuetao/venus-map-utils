import { defaults } from 'ol/control'
import TileLayer from 'ol/layer/Tile'

import { Point, Geometry } from 'ol/geom'
import RasterSource from 'ol/source/Raster'
import VectorImageLayer from 'ol/layer/Image'
import { Layer, Vector as VectorLayer } from 'ol/layer'
import { Collection, Map, View, Feature, Overlay } from 'ol'

import { Vector as VectorSource, Source, XYZ } from 'ol/source'

import {Icon,
  Text,
  Fill,
  Style,
  Stroke,
  RegularShape,
  Circle as CircleStyle} from 'ol/style'

import { GeoJSON } from 'ol/format'
import { Options } from 'ol/Overlay'
import { Type } from 'ol/geom/Geometry'
import { FeatureLike } from 'ol/Feature'
import { StyleLike } from 'ol/style/Style'
import { Draw, Select } from 'ol/interaction'
import { FlatStyleLike } from 'ol/style/flat'
import { getArea, getLength } from 'ol/sphere'

export interface CustomMap extends Map {
  activeBaseLayer?: string
  changeBaseLayer?: () => void
  removeLayerByName?: (name: string) => void
  getLayerByName?: (name: string) => Layer<Source> | undefined
  changeLayersByNames?: (activeNames: Array<string>, allLayerNames: Array<string>) => void
}

export type LayerConfig = {
  zIndex?: number,
  visible?: boolean,
  minZoom?: number,
  maxZoom?: number,
  layerName: string
}

export type DataItemConfig = {
  lng: string | Number
  lat: string | Number
  img: string | undefined
  activeImg?: string | undefined
  text?: string
  offsetX?: number
  offsetY?: number
  scale?: number
  showText?: boolean
  anchor?: Array<number>
  rawData?: any,
  rotation?: number
}

export interface ElasticDataItemConfig extends DataItemConfig {
  smallImg: string
  largeImg: string
}

let instance: CustomMap

/**
 * 切换Source
 * @param layer
 * @param rgbColorArray
 * @param ratioArray
 */
export const changeSource = (layer: Layer, rgbColorArray: number[], ratioArray: number[]) => {
  const rasterSource = new RasterSource({
    sources: [layer],
    operationType: 'image',
    operation: (pixels, data) => {
      const reverseFunc = (pixelArray: number[], data: any) => {
        if (Object.keys(data).includes('rgbColorArray')) {
          const { ratioArray, rgbColorArray } = data
          for (let i = 0; i < pixelArray.length; i += 4) {
            const r = pixelArray[i]
            const g = pixelArray[i + 1]
            const b = pixelArray[i + 2]

            const [rRatio, gRatio, bRatio] = ratioArray
            // 设置灰度值
            const grey = r * rRatio + g * gRatio + b * bRatio
            // 将rgb的值替换为灰度值
            pixelArray[i] = grey
            pixelArray[i + 1] = grey
            pixelArray[i + 2] = grey
            // 黑色，依赖上边的灰色
            pixelArray[i] = rgbColorArray[0] - pixelArray[i]
            pixelArray[i + 1] = rgbColorArray[1] - pixelArray[i + 1]
            pixelArray[i + 2] = rgbColorArray[2] - pixelArray[i + 2]
          }
        }
      }
      // @ts-ignore
      reverseFunc(pixels[0].data, data)
      return pixels[0]
    },
    threads: 10
  })
  rasterSource.on('beforeoperations', (event) => {
    event.data.ratioArray = ratioArray
    event.data.rgbColorArray = rgbColorArray
  })

  return rasterSource
}

/**
 * 转换png样式
 * @param layer
 * @param rgbColorArray
 * @param ratioArray
 */
export const changeLayer = (layer: Layer, rgbColorArray: number[], ratioArray: number[]) => {
  return new VectorImageLayer({
    source: changeSource(layer, rgbColorArray, ratioArray)
  })
}

export const baseLayers = (tk: string) => {
  return {
    // 影像图层
    baseImgLayer: new TileLayer({
      className: 'img-layer',
      source: new XYZ({
        crossOrigin: 'anonymous',
        tileSize: 256,
        url: `https://t{0-7}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=${tk}`
      }),
      zIndex: 1
    }),

    // 影像注记
    baseCiaLayer: new TileLayer({
      className: 'img-layer',
      source: new XYZ({
        crossOrigin: 'anonymous',
        tileSize: 256,
        url: `https://t{0-7}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=${tk}`
      }),
      zIndex: 2
    }),

    // 矢量图层
    baseVecLayer: new TileLayer({
      className: 'vec-layer',
      source: new XYZ({
        crossOrigin: 'anonymous',
        tileSize: 256,
        url: `https://t{0-7}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=${tk}`
      }),
      zIndex: 1
    }),

    // 矢量注记
    baseCvaLayer: new TileLayer({
      className: 'vec-layer',
      source: new XYZ({
        crossOrigin: 'anonymous',
        tileSize: 256,
        url: `https://t{0-7}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=${tk}`
      }),
      zIndex: 2
    })
  }
}

const changeBaseLayer = (map: CustomMap = instance) => {
  const allLayers = map.getAllLayers()
  const { baseImgLayer, baseCiaLayer, baseVecLayer, baseCvaLayer } = baseLayers('c77eddc667c5bed016fded560baf93e7')
  const { activeBaseLayer } = map
  const tempLayers = allLayers.filter(item => item.getClassName() === activeBaseLayer)
  tempLayers.forEach((layer) => {
    map.removeLayer(layer)
  })
  if (activeBaseLayer === 'img-layer') {
    map.addLayer(baseVecLayer)
    map.addLayer(baseCvaLayer)
    map.activeBaseLayer = 'vec-layer'
  } else {
    map.addLayer(baseImgLayer)
    map.addLayer(baseCiaLayer)
    map.activeBaseLayer = 'img-layer'
  }
}

const removeLayerByName = (name: string) => {
  const tempLayer = instance.getAllLayers().find(item => item.getClassName() === name)
  if (tempLayer) {
    instance.removeLayer(tempLayer)
  }
}

/**
 * 切换图层的显示、隐藏
 * @param activeNames
 * @param allLayerNames
 */
const changeLayersByNames = (activeNames: Array<string>, allLayerNames: Array<string>) => {
  const changeLayers = instance.getAllLayers().filter(item => allLayerNames?.includes(item.getClassName()))

  changeLayers.forEach(layer => {
    layer.setVisible(activeNames?.includes(layer.getClassName()))
  })
}

const getLayerByName = (name: string) => {
  return instance.getAllLayers().find(item => item.getClassName() === name)
}

/**
 * 创建地图实例
 * @param rgb
 * @param ratioArray
 * @param config
 */
export const createMapInstance = (rgb: number[] | undefined, ratioArray = [0.05, 0.55, 0.05], config = {
  zoom: 12,
  maxZoom: 18,
  minZoom: 10,
  projection: 'EPSG:4326',
  center: [121.428599, 28.661378],
  token: 'c77eddc667c5bed016fded560baf93e7'
}) => {
  let _config = config
  if (!config) {
    _config = {
      zoom: 12,
      maxZoom: 18,
      minZoom: 10,
      projection: 'EPSG:4326',
      center: [121.428599, 28.661378],
      token: 'c77eddc667c5bed016fded560baf93e7'
    }
  }
  const { baseVecLayer, baseCvaLayer } = baseLayers(_config.token || 'c77eddc667c5bed016fded560baf93e7')

  if (!instance) {
    instance = new Map({
      layers: rgb ? [changeLayer(baseVecLayer, rgb, ratioArray), changeLayer(baseCvaLayer, rgb, ratioArray)] : [baseVecLayer, baseCvaLayer],
      view: new View(Object.assign(
          {
            zoom: 8,
            minZoom: 10,
            maxZoom: 20,
            projection: 'EPSG:4326',
            center: [121.428599, 28.661378],
            smoothExtentConstraint: false
          },
        _config
        )
      ),
      controls: defaults({
        attribution: false,
        zoom: false,
        rotate: false
      })
    })
    instance.activeBaseLayer = 'vec-layer'
    instance.getLayerByName = getLayerByName
    instance.changeBaseLayer = changeBaseLayer
    instance.removeLayerByName = removeLayerByName
    instance.changeLayersByNames = changeLayersByNames
    instance.on('pointermove', (evt: any) => {
      instance.getTargetElement().style.cursor = instance.hasFeatureAtPixel(evt.pixel) ? 'pointer' : ''
    })
    return instance
  }
  return instance
}
/**
 * 创建文本标注
 * @param item
 */
export const createText = (item: DataItemConfig) => {
  return new Text({
    text: item.text,
    offsetY: item.offsetY,
    offsetX: item.offsetX,
    justify: 'center',
    textAlign: 'center',
    font: '16px PingFangSC-Semibold',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.8)'
    })
  })
}


/**
 * 创建Overlay
 * @param config
 */
export const createOverlay = (config: Options = { id: 'popup-container', positioning: 'center-center' }) => {
  return new Overlay(Object.assign(
    {
      element: document.getElementById(<string>config.id) || undefined
    },
    config
  ))
}

/**
 * 创建标注点样式
 * @param item
 * @param active
 */
export const createIconStyle = (item: DataItemConfig, active: boolean = false) => {
  return new Style({
    image: new Icon({
      scale: item.scale || 1,
      rotation: item.rotation || 0,
      anchor: item.anchor || [0.5, 1],
      src: active ? (item.activeImg ? item.activeImg : item.img) : item.img
    }),
    text: item.showText ? createText(item) : undefined
  })
}

export const createMarker = (item: DataItemConfig, config: LayerConfig) => {
  const feature = new Feature({
    geometry: new Point([+item.lng, +item.lat]),
    data: Object.assign({}, item || {}, { layerName: config.layerName })
  })
  feature.setStyle(createIconStyle(item))
  return feature
}

/**
 * 创建标注点
 * @param dataList
 * @param config
 */
export const createMarkersLayer = (dataList: Array<DataItemConfig>, config: LayerConfig) => {
  const { layerName, visible = true, zIndex = 10 } = config
  const markSource = new VectorSource()

  dataList.forEach(item => {
    const feature = createMarker(item, config)
    markSource.addFeature(feature)
  })

  return new VectorLayer({
    zIndex: zIndex,
    visible: visible,
    source: markSource,
    className: layerName || 'marker-layer'
  })
}

const setElasticMarkerStyle = (featureList: Feature<Geometry>[] | Collection<Feature>, curZoom: number) => {
  const changeStyle = (featureList: Feature<Geometry>[] | Collection<Feature>, imgKey: string) => {
    featureList.forEach(feature => {
      const config = feature.get('data')
      if (!config.isSelected) {
        feature.setStyle(createIconStyle(Object.assign({}, config, { img: config[imgKey] }), false))
      }
    })
  }

  changeStyle(featureList, curZoom >= 14 ? 'largeImg' : curZoom >= 11 ? 'smallImg' : 'img')
}

/**
 * 提供给外部关闭弹窗时，切换选中状态
 * @param featureList
 */
export const changeUnselectStyle = (featureList: Collection<Feature>) => {
  featureList.forEach(feature => {
    const config = feature.get('data')
    feature.set('data', { ...config, isSelected: false })
    if (config.isElastic) {
      setElasticMarkerStyle([feature], instance.getView().getZoom()!)
    } else {
      feature.setStyle(createIconStyle(config, false))
    }
  })
  featureList.clear()
}

/**
 * 创建有弹性的Marker标注图层
 * @param dataList
 * @param config
 */
export const createElasticMarkerLayer = (dataList: Array<ElasticDataItemConfig>, config: LayerConfig) => {
  const tempDataList = dataList.map(item => {
    return {
      ...item,
      isElastic: true
    }
  })

  const vectorLayer = createMarkersLayer(tempDataList, config)
  const featureList = vectorLayer.getSource()!.getFeatures()
  setElasticMarkerStyle(featureList, instance.getView().getZoom()!)

  instance.getView().on('change:resolution', ({ target }) => {
    const curZoom = target.get('zoom')
    setElasticMarkerStyle(featureList, curZoom)
  })

  return vectorLayer
}


/**
 * 创建交互事件
 * @param layerNames
 * @param selectedHandler
 * @param unSelectHandler
 */
export const createLayerSelectByNames = (
  layerNames: Array<string>,
  selectedHandler?: (feature: Feature) => void,
  unSelectHandler?: (feature: Feature) => void
) => {
  const interaction = new Select({
    style: null,
    layers: (layer) => layerNames.includes(layer.getClassName())
  })

  interaction.on('select', (evt) => {
    const { deselected, selected } = evt
    if (deselected.length) {
      const feature = deselected[0]
      let config = feature.get('data')
      if (config.isElastic) {
        feature.set('data', Object.assign(config, { isSelected: false }))
        setElasticMarkerStyle([feature], instance.getView().getZoom()!)
      } else {
        feature.setStyle(createIconStyle(Object.assign(config, { isSelected: false }), false))
      }
      unSelectHandler?.(feature)
    }
    if (selected.length) {
      const feature = selected[0]
      const config = feature.get('data')
      if (config.isElastic) {
        feature.set('data', Object.assign(config, { isSelected: true }))
        setElasticMarkerStyle([feature], instance.getView().getZoom()!)
      } else {
        feature.setStyle(createIconStyle(Object.assign(config, { isSelected: true }), true))
      }
      selectedHandler?.(feature)
    }
  })
  return interaction
}

const formatArea = (polygon: Geometry) => {
  const area = getArea(polygon, { projection: 'EPSG:4326' })
  let output
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + ' km\xB2'
  } else {
    output = Math.round(area * 100) / 100 + ' m\xB2'
  }
  return output
}

const formatLength = (line: Geometry) => {
  const length = getLength(line, { projection: 'EPSG:4326' })
  let output
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + ' km'
  } else {
    output = Math.round(length * 100) / 100 + ' m'
  }
  return output
}


/**
 *
 * @param feature
 * @param drawStyle
 */
export const getDrawStyle = (feature: FeatureLike, drawStyle: Style | undefined = drawDefaultStyle) => {
  const labelStyle = new Style({
    text: new Text({
      font: '14px',
      fill: new Fill({
        color: 'rgba(255, 255, 255, 1)'
      }),
      backgroundFill: new Fill({
        color: 'rgba(0, 0, 0, 0.7)'
      }),
      padding: [3, 3, 3, 3],
      textBaseline: 'bottom',
      offsetY: -15
    }),
    image: new RegularShape({
      radius: 8,
      points: 3,
      angle: Math.PI,
      displacement: [0, 10],
      fill: new Fill({
        color: 'rgba(0, 0, 0, 0.7)'
      })
    })
  })

  const styles = drawStyle ? [drawStyle] : []

  const geometry = feature.getGeometry()! as Geometry
  const type = geometry.getType()
  let point, label

  if (type === 'Polygon') {
    // @ts-ignore
    point = geometry.getInteriorPoint()
    label = formatArea(geometry)
  } else if (type === 'LineString') {
    // @ts-ignore
    point = new Point(geometry.getLastCoordinate())
    label = formatLength(geometry)
  }
  if (label) {
    labelStyle.setGeometry(point)
    labelStyle.getText()!.setText(label)
    styles.push(labelStyle)
  }
  return styles
}

const drawDefaultStyle: Style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)'
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 0.5)',
    lineDash: [10, 10],
    width: 2
  }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)'
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    })
  })
})

/**
 * 飞到对应点位
 * @param center
 * @param zoom
 */
export const flyToAnimate = (center: Array<any>[number], zoom?: number) => {
  const view = instance.getView()
  const tempZoom = view.getZoom()!
  view.animate({
    center: center,
    duration: 2000
  })
  if (!zoom) {
    view.animate(
      { zoom: tempZoom - 2, duration: 2000 / 2 },
      { zoom: tempZoom + 2 > 12 ? 12 : tempZoom + 2, duration: 2000 / 2 }
    )
  } else {
    view.animate(
      { zoom: zoom - 2, duration: 2000 / 2 },
      { zoom: zoom, duration: 2000 / 2 }
    )
  }
}

/**
 * 创建绘制方法
 * @param type
 * @param vectorLayer
 * @param openTip
 */
export const createDrawInteraction = (type: Type = 'Point', vectorLayer: VectorLayer<any>, openTip?: boolean) => {
  return new Draw({
    source: vectorLayer.getSource(),
    type: type,
    style: openTip ? (feature) => getDrawStyle(feature, undefined) : undefined
  })
}

/**
 * 创建GeoJson图层
 * @param geoJson
 * @param style
 * @param config
 */
export const createGeoJsonLayer = (geoJson: any, style: StyleLike | FlatStyleLike | null | undefined, config?: LayerConfig) => {
  const { layerName } = config || {}
  const layerConfig = Object.assign({
    className: layerName ? layerName : 'ol-layer',
    source: new VectorSource({
      features: new GeoJSON().readFeatures(geoJson)
    }),
    style: style ? style : new Style({
      stroke: new Stroke({
        color: 'red',
        lineDash: [10],
        width: 3
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0.1)'
      })
    })
  }, config ? config : {})

  return new VectorLayer(layerConfig)
}

export const createMoveMarkerLayer = (dataItem: DataItemConfig, config: LayerConfig) => {
  const marker = createMarker(dataItem, config)
  const { layerName } = config
  const vectorSource = new VectorSource({
    features: [marker]
  })
  const vectorLayer = new VectorLayer({
    className: layerName ? layerName : 'ol-layer',
    source: vectorSource
  })

  vectorLayer.on('postrender', (event) => {
    console.log(event)
  })

  instance.addLayer(vectorLayer)

  return {
    vectorLayer
  }
}


/**
 * 废弃地图
 */
export const disposeInstance = () => {
  const layers = instance.getAllLayers()
  layers.forEach(layer => {
    instance.removeLayer(layer)
  })
  instance.setTarget('')
  // @ts-ignore
  instance = undefined
}
