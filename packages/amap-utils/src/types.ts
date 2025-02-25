export type LngLat = {
  lat: number
  lng: number
}

export type BaseLayerConfig = {
  tileSize: number
  cacheSize: number
  resolutions: number[]
  origin: [number, number]
  upstream: string[]
  bounds: [[number, number], [number, number]]
}

export type LineConfig = {
  key?: string
  width?: number
  isRaw?: boolean
  openClick?: boolean
  strokeColor?: string
  strokeStyle?: string
}

export type GetImgUrl = (name: string, ext?: string) => string

export type GetImgUrlFn = (baseUrl: string) => GetImgUrl

export interface CustomFlexibleLayer extends AMap.TileLayer.Flexible {
  _layerName?: string
}

export interface OverlayGroup extends AMap.OverlayGroup {
  _isCustom?: boolean
}

export interface Polyline extends AMap.Polyline {
  _id?: string
  _uuid?: string
  _isRaw?: boolean
  _options?: object
  _isActive?: boolean
}

export interface Polygon extends AMap.Polygon {
  _id?: string
  _uuid?: string
  _isRaw?: boolean
  _options?: object
  _isActive?: boolean
}

export interface Marker extends AMap.Marker {
  _isAnimation?: boolean
}

export interface TileLayer extends AMap.TileLayer {
  _layerName?: string
  _isCustom?: boolean
}

export interface MassData extends AMap.MassMarks.Data {
  style?: number
  _uuid?: string
  lnglat: any
  status?: number | string | undefined
  _status?: number | string | undefined
}

export interface MassMarks extends AMap.MassMarks {
  _uuid?: string
  _isCustom?: boolean
  _hasLine?: boolean
  _hasFace?: boolean
  _isActive?: boolean
  _statusNum?: number
  _isDynamic?: boolean
  _hasActive?: boolean
  _dataList?: MassData[]
  _isMassMarksLayer?: boolean
}

export type IconConfig = {
  baseUrl: string
  hasLine?: boolean
  hasFace?: boolean
  statusNum: number
  isDynamic?: boolean
  markerIcon: string
  activeScale?: number
  markerSize: [number, number]
}
