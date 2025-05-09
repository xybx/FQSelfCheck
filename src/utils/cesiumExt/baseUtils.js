import * as turf from "@turf/turf";
import * as Cesium from "cesium";
import { cartesian3ToDegrees, cartesian3ToCoordinates } from "./coordinate";
import { h } from "vue";

//判断笛卡尔坐标串是否为顺时针
export function booleanClockwise(positions) {
  let degreesArrary = [];
  positions.map((position) => {
    degreesArrary.push(cartesian3ToDegrees(position));
  });
  //首尾闭合
  degreesArrary.push(degreesArrary[0]);
  let lineString = turf.lineString(degreesArrary);
  return turf.booleanClockwise(lineString);
}

//根据坐标串获取ClippingPlanes 传入的坐标必须为逆时针顺序
export function getClippingPlanes(positions) {
  let pLength = positions.length;
  let clippingPlanes = []; // 存储ClippingPlane集合
  for (let i = 0; i < pLength; ++i) {
    let nextIndex = (i + 1) % pLength;
    let midpoint = Cesium.Cartesian3.add(
      positions[i],
      positions[nextIndex],
      new Cesium.Cartesian3()
    );
    midpoint = Cesium.Cartesian3.multiplyByScalar(midpoint, 0.5, midpoint);

    let up = Cesium.Cartesian3.normalize(midpoint, new Cesium.Cartesian3());
    let right = Cesium.Cartesian3.subtract(
      positions[nextIndex],
      midpoint,
      new Cesium.Cartesian3()
    );
    right = Cesium.Cartesian3.normalize(right, right);

    let normal = Cesium.Cartesian3.cross(right, up, new Cesium.Cartesian3());
    normal = Cesium.Cartesian3.normalize(normal, normal);

    let originCenteredPlane = new Cesium.Plane(normal, 0.0);
    let distance = Cesium.Plane.getPointDistance(originCenteredPlane, midpoint);
    clippingPlanes.push(new Cesium.ClippingPlane(normal, distance));
  }
  return clippingPlanes;
}

//获取所有点中的最低高度（地表高度）
export function getMinHeight(positions) {
  let minHeight = 1000000;
  positions.map((position) => {
    var _position = Cesium.Cartographic.fromCartesian(position);
    var height = window.viewer.scene.globe.getHeight(_position);
    console.log(height, "getHeight");
    if (minHeight > height) {
      minHeight = height;
    }
  });
  return minHeight;
}

//获取所有点在地形上的最高点高度
export async function getMaxHeightToTerrain(positions, viewer) {
  let heights = await getHeights(positions, viewer);
  let maxHeight = 0;
  heights.forEach((h) => {
    if (h > maxHeight) {
      maxHeight = h;
    }
  });
  return maxHeight;
}

//获取所有点在地形上的最低点高度
export async function getMinHeightToTerrain(positions, viewer) {
  let heights = await getHeights(positions, viewer);
  let minHeight = 1000000;
  heights.forEach((h) => {
    if (minHeight > h) {
      minHeight = h;
    }
  });
  return minHeight;
}

//获取所有点在地形上的高度
export async function getHeights(positions, viewer) {
  let fromCartesians = [];
  positions.forEach((p) => {
    let ps = Cesium.Cartographic.fromCartesian(p);
    fromCartesians.push(ps);
  });
  let terrain = viewer.terrainProvider;
  let heights = [];
  const updatedPositions = await Cesium.sampleTerrainMostDetailed(
    terrain,
    fromCartesians
  );
  for (var i = 0; i < updatedPositions.length; ++i) {
    if (updatedPositions[i]) {
      heights.push(updatedPositions[i].height);
    }
  }
  //console.log(heights,"heights")
  return heights;
}

//获取平均高度（地表高度）
export function getAvgHeight(positions) {
  let sumHeight = 0;
  positions.map((position) => {
    //degreesHeight = cartesian3ToCoordinates(position);
    var _position = Cesium.Cartographic.fromCartesian(position);
    var height = window.viewer.scene.globe.getHeight(_position);
    sumHeight += Number(height);
    // if (minHeight > degreesHeight[2]) {
    //     minHeight = degreesHeight[2];
    // }
  });
  let avgHeight = positions.length == 0 ? 0 : sumHeight / positions.length;
  return avgHeight;
}

//获取最高高度（地表高度）
export function getMaxHeight(positions) {
  let maxHeight = 0;

  positions.map((position) => {
    //degreesHeight = cartesian3ToCoordinates(position);
    var _position = Cesium.Cartographic.fromCartesian(position);
    var height = window.viewer.scene.globe.getHeight(_position);
    if (height > maxHeight) {
      maxHeight = height;
    }
  });
  return maxHeight;
}

//计算单个多边形面积
export function getPolygonArea(positions) {
  let degreesPoint = [];
  positions.map((position) => {
    let degrees = cartesian3ToDegrees(position);
    degreesPoint.push(degrees);
  });
  degreesPoint.push(degreesPoint[0]);
  var polygon = turf.polygon([degreesPoint]);
  var area = turf.area(polygon);
  return area;
}
