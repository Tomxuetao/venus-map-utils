import emitter from './emitter'
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
  buildMassMarksStyles,
  createMassMarksLayer,
  createAnimationMarker,
  createVectorFaceLayer,
  createVectorLineLayer,
  updateMarksLayersByStatus
}
