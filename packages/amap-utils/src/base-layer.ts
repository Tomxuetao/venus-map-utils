import gcoord from 'gcoord'
import type { BaseLayerConfig, CustomFlexibleLayer, LngLat } from './types.ts'

export const math_sinh = (x: number) => (Math.exp(x) - Math.exp(-x)) / 2

export const getMapSize = (level: number) => Math.pow(2, level)

export const pixelXToLng = (pixelX: number, tileX: number, level: number) => {
  const pixelXToTileAddition = pixelX / 256.0
  return ((tileX + pixelXToTileAddition) / getMapSize(level)) * 360 - 180
}

export const pixelYToLat = (pixelY: number, tileY: number, level: number) => {
  return (
    (Math.atan(
      math_sinh(
        Math.PI * (1 - (2 * (tileY + pixelY / 256.0)) / getMapSize(level))
      )
    ) *
      180.0) /
    Math.PI
  )
}

export const pixelToLnglat = (
  pixelX: number,
  pixelY: number,
  tileX: number,
  tileY: number,
  level: number
) => {
  return {
    lng: pixelXToLng(pixelX, tileX, level),
    lat: pixelYToLat(pixelY, tileY, level)
  }
}

export class ImgLoader {
  url: string
  onload: (img: HTMLImageElement) => void
  onerror: (url: string) => void
  called: boolean

  constructor(
    url: string,
    onload: (img: HTMLImageElement) => void,
    onerror: (url: string) => void
  ) {
    this.url = url
    this.onload = onload
    this.onerror = onerror
    this.called = false
    this.loadImg()
  }

  loadImg() {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = this.url
    // 加载完成
    img.onload = () => {
      if (!this.called) {
        this.onload(img)
        this.called = true
      }
    }
    img.onerror = () => {
      this.onerror(this.url)
    }
  }
}

export const layerConfig: BaseLayerConfig = {
  resolutions: [
    0.00549933137239034, 0.00274966568619517, 0.00137483284309758,
    0.000687416421548792, 0.000343708210774396, 0.000171854105387198,
    8.5927052693599e-5, 4.29635263467995e-5, 2.14817631733998e-5,
    1.07408815866999e-5, 5.37044079334994e-6, 2.68522039667497e-6,
    1.34261019833748e-6
  ],
  tileSize: 256,
  cacheSize: 5000,
  origin: [118.122911693886, 31.2869311022836],
  bounds: [
    [118.339420417, 20.1883223780912],
    [120.725803952416, 40.5653723350001]
  ],
  upstream: [
    'https://cb.hangzhoumap.gov.cn/E36CCEA93443D1495DB9B9F2B2FFE348CB1A367D75176F815040AB19E54CDCA5DAAA25813AF965E2ABD0CC2463DD1223/PBS/rest/services/hzsyvector_dark/Mapserver/tile'
  ]
}

const getWgs84BoundsByXYZ = (x: number, y: number, z: number) => {
  const wgs84NW = pixelToLnglat(0, 0, x, y, z)
  const wgs84SE = pixelToLnglat(0, 0, x + 1, y + 1, z)
  const arrNW = gcoord.transform(
    [wgs84NW.lng, wgs84NW.lat],
    gcoord.GCJ02,
    gcoord.WGS84
  )
  const arrSE = gcoord.transform(
    [wgs84SE.lng, wgs84SE.lat],
    gcoord.GCJ02,
    gcoord.WGS84
  )

  return {
    nw: {
      lng: arrNW[0],
      lat: arrNW[1]
    },
    se: {
      lng: arrSE[0],
      lat: arrSE[1]
    }
  }
}

const getXYZByLevelAndConfig = (
  level: number,
  lngLat: LngLat,
  config: BaseLayerConfig
) => {
  const { lng, lat } = lngLat
  const { origin, tileSize, resolutions } = config
  const tempLngLat: LngLat = {
    lng: lng - origin[0],
    lat: origin[1] - lat
  }

  const resolution = resolutions[level]

  const tileX: number = Math.floor(tempLngLat.lng / resolution / tileSize)
  const tileY: number = Math.floor(tempLngLat.lat / resolution / tileSize)
  const pixelX: number = Math.round(
    tempLngLat.lng / resolution - tileX * tileSize
  )
  const pixelY: number = Math.round(
    tempLngLat.lat / resolution - tileY * tileSize
  )

  return {
    x: tileX,
    y: tileY,
    z: level,
    pixelX: pixelX,
    pixelY: pixelY
  }
}

const cachesMap = new Map()

export const createBaseImageLayer = (config = layerConfig) => {
  const { tileSize = 256, cacheSize, upstream: urls } = config
  const tileLayer: CustomFlexibleLayer = new AMap.TileLayer.Flexible({
    tileSize: tileSize,
    cacheSize: cacheSize,
    createTile: (
      x: number,
      y: number,
      z: number,
      success: (canvas: HTMLCanvasElement) => void
    ) => {
      const targetUrl = urls[(x + y + z) % urls.length]
      const canvas = document.createElement('canvas')
      canvas.width = tileSize
      canvas.height = tileSize

      const level = z - 8
      const { nw, se } = getWgs84BoundsByXYZ(x, y, z)
      const minRC = getXYZByLevelAndConfig(level, nw, config)
      const maxRC = getXYZByLevelAndConfig(level, se, config)

      const realTileSizeX: number =
        tileSize -
        minRC.pixelX +
        maxRC.pixelX +
        (maxRC.x - minRC.x - 1) * tileSize
      const realTileSizeY: number =
        tileSize -
        minRC.pixelY +
        maxRC.pixelY +
        (maxRC.y - minRC.y - 1) * tileSize

      const scale: number[] = [
        tileSize / realTileSizeX,
        tileSize / realTileSizeY
      ]

      const tempAll = []
      for (let { y } = minRC; y <= maxRC.y; y++) {
        for (let { x } = minRC; x <= maxRC.x; x++) {
          const tempCondition = x < 0 || y < 0 || level < 0
          if (!tempCondition) {
            const tempZYX = `${level}/${y}/${x}`
            const tempUrl = `${targetUrl}/${tempZYX}`
            const position = {
              x: ((x - minRC.x) * tileSize - minRC.pixelX) * scale[0],
              y: ((y - minRC.y) * tileSize - minRC.pixelY) * scale[1]
            }
            const ctx = canvas.getContext('2d')!
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'
            tempAll.push(
              new Promise<void>((resolve) => {
                const image = cachesMap.get(tempZYX)
                if (image) {
                  ctx.drawImage(
                    image,
                    0,
                    0,
                    tileSize,
                    tileSize,
                    position.x,
                    position.y,
                    tileSize * scale[0],
                    tileSize * scale[1]
                  )
                  resolve()
                } else {
                  new ImgLoader(
                    tempUrl,
                    (image) => {
                      ctx.drawImage(
                        image,
                        0,
                        0,
                        tileSize,
                        tileSize,
                        position.x,
                        position.y,
                        tileSize * scale[0],
                        tileSize * scale[1]
                      )
                      cachesMap.set(tempZYX, image)
                      resolve()
                    },
                    () => {
                      resolve()
                    }
                  )
                }
              })
            )
          }
        }
      }
      Promise.all(tempAll).then(() => {
        success(canvas)
      })
    }
  })
  tileLayer._layerName = 'baseImageLayer'
  return tileLayer
}
