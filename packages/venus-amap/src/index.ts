import emitter from './emitter'
import { createBaseImageLayer } from './base-layer'
import {
  instance,
  resetMap,
  disposeMap,
  getAMapInstance,
  createAMapInstance,
  resetZoomAndCenter
} from './create-amap'

import {
  removeAllLayers,
  resetActiveVector,
  addMassMarksLayer,
  activeMarkerByUid,
  resetActiveMarker,
  buildMassMarksStyles,
  createMassMarksLayer,
  createAnimationMarker,
  createVectorFaceLayer,
  createVectorLineLayer,
  updateMarksLayersByStatus
} from './layer-utils'

export {
  emitter,
  instance,
  resetMap,
  disposeMap,
  removeAllLayers,
  getAMapInstance,
  resetActiveVector,
  addMassMarksLayer,
  activeMarkerByUid,
  resetActiveMarker,
  resetZoomAndCenter,
  createAMapInstance,
  createBaseImageLayer,
  buildMassMarksStyles,
  createMassMarksLayer,
  createAnimationMarker,
  createVectorFaceLayer,
  createVectorLineLayer,
  updateMarksLayersByStatus
}
