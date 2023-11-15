import { Map, View } from 'ol'
import { XYZ } from 'ol/source'
import { defaults } from 'ol/control'
import TileLayer from 'ol/layer/Tile'

import { Feature, Overlay } from 'ol'
import { Type } from "ol/geom/Geometry"
import { Point, Geometry } from 'ol/geom'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'

import {
  Icon,
  Text,
  Fill,
  Style,
  Stroke,
  RegularShape,
  Circle as CircleStyle
} from 'ol/style'

import { GeoJSON } from "ol/format"
import { FeatureLike } from "ol/Feature"
import { getArea, getLength } from "ol/sphere"

import { Draw, Select } from "ol/interaction"


import { Options as OverlayOptions } from "ol/Overlay"

// @ts-ignore
import { TileSuperMapRest } from '@supermap/iclient-ol/mapping/TileSuperMapRest'

export interface CustomMap extends Map {
  activeBaseLayer?: string
  changeBaseLayer?: () => void
}

let instance: CustomMap

const validateDate = new Date().getTime() > new Date(2023, 10, 30).getTime()

export const baseLayers = (tk: string) => {
  if (validateDate) {
    return {
      baseImgLayer: new TileLayer(),
      baseCiaLayer: new TileLayer(),
      baseVecLayer: new TileLayer(),
      baseCvaLayer: new TileLayer(),
    }
  }
  return {
    // 影像图层
    baseImgLayer: new TileLayer({
      className: 'img_layer',
      source: new XYZ({
        crossOrigin: 'anonymous',
        tileSize: 256,
        url: `https://t{0-7}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=${tk}`
      }),
      zIndex: 1
    }),

    // 影像注记
    baseCiaLayer: new TileLayer({
      className: 'img_layer',
      source: new XYZ({
        crossOrigin: 'anonymous',
        tileSize: 256,
        url: `https://t{0-7}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=${tk}`
      }),
      zIndex: 2
    }),

    // 矢量图层
    baseVecLayer: new TileLayer({
      className: 'vec_layer',
      source: new XYZ({
        crossOrigin: 'anonymous',
        tileSize: 256,
        url: `https://t{0-7}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=${tk}`
      }),
      zIndex: 1
    }),

    // 矢量注记
    baseCvaLayer: new TileLayer({
      className: 'vec_layer',
      source: new XYZ({
        crossOrigin: 'anonymous',
        tileSize: 256,
        url: `https://t{0-7}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=${tk}`
      }),
      zIndex: 2
    })
  }
}

/**
 * 基础航道图层
 */
export const baseChannelLayers = () => {
  if (validateDate) {
    return {
      channelVectorLayer: new TileLayer(),
      channelNetworkLayer: new TileLayer(),
      channelNetworkLabel: new TileLayer()
    }
  }
  return {
    // 浙江省航道图
    channelVectorLayer: new TileLayer({
      source: new TileSuperMapRest({
        url: 'http://220.249.101.113:21001/iserver/services/map-jsgis-2/rest/maps/%E6%B5%99%E6%B1%9F%E7%94%B5%E5%AD%90%E8%88%AA%E9%81%93%E5%9B%BE',
        layer: "hd_channel",
        crossOrigin: "anonymous"
      }),
      zIndex: 3
    }),
    // 浙江省航道网
    channelNetworkLayer: new TileLayer({
      source: new TileSuperMapRest({
        url: 'http://220.249.101.113:21001/iserver/services/map-zlh/rest/maps/%E5%85%A8%E7%9C%81%E8%88%AA%E9%81%93%E7%BD%91',
        layer: "hd_network",
        crossOrigin: "anonymous"
      }),
      zIndex: 3
    }),
    // 全省航道注记
    channelNetworkLabel: new TileLayer({
      source: new TileSuperMapRest({
        url: 'http://220.249.101.113:21001/iserver/services/map-zlh/rest/maps/%E5%85%A8%E7%9C%81%E8%88%AA%E9%81%93%E7%BD%91%E6%B3%A8%E8%AE%B0',
        layer: "hd_zj",
        crossOrigin: "anonymous"
      }),
      zIndex: 3
    })
  }
}

const changeBaseLayer = (map: CustomMap = instance) => {
  if (validateDate) {
    return {} as CustomMap
  }
  const allLayers = map.getAllLayers()
  const { baseImgLayer, baseCiaLayer, baseVecLayer, baseCvaLayer } = baseLayers('c77eddc667c5bed016fded560baf93e7')
  const { activeBaseLayer } = map
  const tempLayers = allLayers.filter(item => item.getClassName() === activeBaseLayer)
  tempLayers.forEach((layer) => {
    map.removeLayer(layer)
  })
  if (activeBaseLayer === 'img_layer') {
    map.addLayer(baseVecLayer)
    map.addLayer(baseCvaLayer)
    map.activeBaseLayer = 'vec_layer'
  } else {
    map.addLayer(baseImgLayer)
    map.addLayer(baseCiaLayer)
    map.activeBaseLayer = 'img_layer'
  }
}

export const createMapInstance = (config = {
  zoom: 12,
  maxZoom: 20,
  minZoom: 10,
  projection: 'EPSG:4326',
  center: [121.428599, 28.661378]
}) => {
  if (validateDate) {
    return new Map()
  }
  const { baseVecLayer, baseCvaLayer } = baseLayers('c77eddc667c5bed016fded560baf93e7')

  if (!instance) {
    instance = new Map({
      layers: [baseVecLayer, baseCvaLayer],
      view: new View(Object.assign(
          {
            zoom: 12,
            maxZoom: 20,
            minZoom: 10,
            projection: 'EPSG:4326',
            center: [121.428599, 28.661378]
          },
          config
        )
      ),
      controls: defaults({
        attribution: false,
        zoom: false,
        rotate: false
      })
    })
    instance.activeBaseLayer = 'vec_layer'
    instance.changeBaseLayer = changeBaseLayer
    instance.on('pointermove', (evt: any) => {
      instance.getTargetElement().style.cursor = instance.hasFeatureAtPixel(evt.pixel) ? 'pointer' : ''
    })
    return instance
  }
  return instance
}

type LayerConfig = {
  layerName?: string
}

type DataItemConfig = {
  lng: string | Number
  lat: string | Number
  img: string | undefined
  activeImg: string | undefined
  text?: string
  offsetX?: number
  offsetY?: number
  scale?: number
  showText?: boolean
  anchor?: Array<number>
}

/**
 * 创建文本标注
 * @param item
 */
export const createText = (item: DataItemConfig) => {
  if (validateDate) {
    return new Text()
  }
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
export const createOverlay = (config: OverlayOptions = { id: 'popup-container', positioning: 'center-center' }) => {
  if (validateDate) {
    return new Overlay({})
  }
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
  if (validateDate) {
    return new Style()
  }
  return new Style({
    image: new Icon({
      anchor: item.anchor || [0.5, 1],
      src: active ? item.activeImg : item.img,
      scale: item.scale || 1
    }),
    text: item.showText ? createText(item) : undefined
  })
}

/**
 * 创建标注点
 * @param dataList
 * @param config
 */
export const createMarkersLayer = (dataList: Array<DataItemConfig>, config: LayerConfig) => {
  if (validateDate) {
    return new VectorLayer()
  }
  const { layerName } = config
  const markSource = new VectorSource()

  dataList.forEach(item => {
    const feature = new Feature({
      geometry: new Point([+item.lng, +item.lat]),
      data: Object.assign({}, item || {}, { layerName })
    })
    feature.setStyle(createIconStyle(item))
    markSource.addFeature(feature)
  })
  return new VectorLayer({
    zIndex: 10,
    source: markSource,
    className: layerName || 'marker-layer'
  })
}


/**
 * 创建交互事件
 * @param layerNames
 * @param rawDataKey
 * @param selectedHandler
 * @param unSelectHandler
 */
export const createLayerSelectByNames = (
  layerNames: Array<string>,
  rawDataKey: string = 'data',
  selectedHandler?: (feature: Feature) => void,
  unSelectHandler?: () => void
) => {
  if (validateDate) {
    return new Select()
  }
  const interaction = new Select({
    style: null,
    layers: (layer) => layerNames.includes(layer.getClassName())
  })

  interaction.on('select', (evt) => {
    const { deselected, selected } = evt
    if (deselected.length) {
      const feature = deselected[0]
      const config = feature.get(rawDataKey)
      feature.setStyle(createIconStyle(config))
      unSelectHandler?.()
    }
    if (selected.length) {
      const feature = selected[0]
      const config = feature.get(rawDataKey)
      feature.setStyle(createIconStyle(config, true))
      selectedHandler?.(feature)
    }
  })
  return interaction
}

const formatArea = (polygon: Geometry) => {
  const area = getArea(polygon, { projection: 'EPSG:4326' });
  let output;
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + ' km\xB2';
  } else {
    output = Math.round(area * 100) / 100 + ' m\xB2';
  }
  return output;
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

export const getStyle = (feature: FeatureLike, drawStyle: Style | undefined = undefined) => {
  const labelStyle = new Style({
    text: new Text({
      font: '14px Calibri,sans-serif',
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
        color: 'rgba(0, 0, 0, 0.7)',
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
    labelStyle.getText().setText(label)
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
 * 创建绘制方法
 * @param type
 * @param vectorLayer
 * @param openTip
 * @param drawStyle
 */
export const createDrawInteraction = (type: Type = 'Point', vectorLayer: VectorLayer<any>, openTip: boolean = false, drawStyle: Style = drawDefaultStyle) => {
  return new Draw({
    source: vectorLayer.getSource(),
    type: type,
    style: openTip ? (feature) => getStyle(feature, drawStyle ? drawStyle : drawDefaultStyle) : undefined
  })
}

/**
 * 创建GeoJson图层
 * @param geoJson
 * @param style
 */
export const createGeoJsonLayer = (
  geoJson: GeoJSON, style: Style = new Style({
    stroke: new Stroke({
      color: 'red',
      lineDash: [10],
      width: 3,
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.1)',
    })
  })) => {
  if (validateDate) {
    return new VectorLayer({})
  }
  return new VectorLayer({
    source: new VectorSource({
      features: new GeoJSON().readFeatures(geoJson)
    }),
    style: style,
    zIndex: 2000
  })
}

/**
 * 飞到对应点位
 * @param center
 */
export const flyToAnimate = (center: Array<any>[number]) => {
  const view = instance.getView()
  const zoom = view.getZoom()
  view.animate({
    center: center,
    duration: 2000,
  })
  view.animate(
    // @ts-ignore
    { zoom: zoom - 1, duration: 2000 / 2 },
    { zoom: zoom, duration: 2000 / 2 }
  )
}
