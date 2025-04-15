import { indexOf } from "lodash";
import { getProject } from "./common-api";
import { ElMessage } from "element-plus";
import * as turf from "@turf/turf";
import * as Cesium from "cesium";
// 接口
import { get3DJson } from "@/utils/common-api";

/*对象分组
array:要分组的数组对象
f:分组字段函数
*/
export const groupby = (array: any, f: any) => {
  let groups = <any>{};
  array.forEach(function (o: any) {
    let group = JSON.stringify(f(o));
    groups[group] = groups[group] || [];
    groups[group].push(o);
  });
  return Object.keys(groups).map(function (group) {
    return groups[group];
  });
};

/*坐标系转换
inSR:传入的坐标
outSR:输入的坐标
geometryType:图形类型
geometry:图形
*/
export const getGeoProject = async (
  inSR: any,
  outSR: any,
  geometryType: any,
  geometry: any
) => {
  let geometries = <any>null;
  switch (geometryType) {
    case "esriGeometryPoint":
      geometries = {
        geometryType: geometryType,
        geometries: [{ x: geometry.x, y: geometry.y }],
      };
      break;
    case "esriGeometryPolygon":
      let polygons = <any>[];
      polygons.push({ rings: geometry.rings });
      geometries = {
        geometryType: geometryType,
        geometries: polygons,
      };
      break;
    case "esriGeometryPolyline":
      let polylines = <any>[];
      polylines.push({ paths: geometry.paths });
      geometries = {
        geometryType: geometryType,
        geometries: polylines,
      };
      break;
  }

  let data = <any>{};
  data.inSR = inSR;
  data.outSR = outSR;
  data.geometries = JSON.stringify(geometries);
  data.f = "pjson";

  let error = await getProject(window.geometryServer, data).catch(() => {});
  if (!error) return;

  let result = await getProject(window.geometryServer, data);
  console.log(result, "getGeoProject-result");
  return result;
};

// 解析数据并计算中心点和外包范围平面，json为请求tileset.json文件得到的数据对象
export async function calc3DTileBox(layer: any) {
  let { data: json } = await get3DJson(layer.customAttr.url);
  console.log(json);

  debugger;
  let root = json.root;
  let geometry = null;
  let center = null;
  let boundingVolume = root.boundingVolume;
  if (boundingVolume.hasOwnProperty("box")) {
    // 中心点
    center = new Cesium.Cartesian4(
      boundingVolume.box[0],
      boundingVolume.box[1],
      boundingVolume.box[2],
      1
    );
    center = toDegrees(center, root.transform);
    // 左上
    let leftTop = new Cesium.Cartesian4(
      boundingVolume.box[0] - boundingVolume.box[3],
      boundingVolume.box[1] + boundingVolume.box[7],
      boundingVolume.box[2],
      1
    );
    // 左下
    leftTop = toDegrees(leftTop, root.transform);
    let leftButtom = new Cesium.Cartesian4(
      boundingVolume.box[0] - boundingVolume.box[3],
      boundingVolume.box[1] - boundingVolume.box[7],
      boundingVolume.box[2],
      1
    );
    // 右上
    leftButtom = toDegrees(leftButtom, root.transform);
    let rightButtom = new Cesium.Cartesian4(
      boundingVolume.box[0] + boundingVolume.box[3],
      boundingVolume.box[1] - boundingVolume.box[7],
      boundingVolume.box[2],
      1
    );
    // 右下
    rightButtom = toDegrees(rightButtom, root.transform);
    let rightTop = new Cesium.Cartesian4(
      boundingVolume.box[0] + boundingVolume.box[3],
      boundingVolume.box[1] + boundingVolume.box[7],
      boundingVolume.box[2],
      1
    );
    // 右上
    rightTop = toDegrees(rightTop, root.transform);
    // 使用turf工具生成polygon
    geometry = turf.polygon([
      [leftTop, leftButtom, rightButtom, rightTop, leftTop],
    ]);
  } else if (boundingVolume.hasOwnProperty("region")) {
    debugger;
    // 中心点
    let centerGraphic = new Cesium.Cartographic(
      (boundingVolume.region[0] + boundingVolume.region[2]) / 2,
      (boundingVolume.region[1] + boundingVolume.region[3]) / 2,
      (boundingVolume.region[4] + boundingVolume.region[5]) / 2
    );
    let centerCartesian = Cesium.Cartographic.toCartesian(centerGraphic);
    center = new Cesium.Cartesian4(
      centerCartesian.x,
      centerCartesian.y,
      centerCartesian.z,
      1
    );
    center = toDegrees(center, root.transform);

    // 左上
    let leftTopGraphic = new Cesium.Cartographic(
      boundingVolume.region[0],
      boundingVolume.region[3],
      (boundingVolume.region[4] + boundingVolume.region[5]) / 2
    );
    let leftTopCartesian = Cesium.Cartographic.toCartesian(leftTopGraphic);
    let leftTop = new Cesium.Cartesian4(
      leftTopCartesian.x,
      leftTopCartesian.y,
      leftTopCartesian.z,
      1
    );
    leftTop = toDegrees(leftTop, root.transform);

    // 左下
    let leftButtomGraphic = new Cesium.Cartographic(
      boundingVolume.region[0],
      boundingVolume.region[1],
      (boundingVolume.region[4] + boundingVolume.region[5]) / 2
    );
    let leftButtomCartesian =
      Cesium.Cartographic.toCartesian(leftButtomGraphic);
    let leftButtom = new Cesium.Cartesian4(
      leftButtomCartesian.x,
      leftButtomCartesian.y,
      leftButtomCartesian.z,
      1
    );
    leftButtom = toDegrees(leftButtom, root.transform);

    // 右下
    let rightButtomGraphic = new Cesium.Cartographic(
      // boundingVolume.region[0],
      // boundingVolume.region[1],
      boundingVolume.region[2],
      boundingVolume.region[1],
      (boundingVolume.region[4] + boundingVolume.region[5]) / 2
    );
    let rightButtomCartesian =
      Cesium.Cartographic.toCartesian(rightButtomGraphic);
    let rightButtom = new Cesium.Cartesian4(
      rightButtomCartesian.x,
      rightButtomCartesian.y,
      rightButtomCartesian.z,
      1
    );
    rightButtom = toDegrees(rightButtom, root.transform);

    // 右上
    let rightTopGraphic = new Cesium.Cartographic(
      // boundingVolume.region[0],
      // boundingVolume.region[1],
      boundingVolume.region[2],
      boundingVolume.region[3],
      (boundingVolume.region[4] + boundingVolume.region[5]) / 2
    );
    let rightTopCartesian = Cesium.Cartographic.toCartesian(rightTopGraphic);
    let rightTop = new Cesium.Cartesian4(
      rightTopCartesian.x,
      rightTopCartesian.y,
      rightTopCartesian.z,
      1
    );
    rightTop = toDegrees(rightTop, root.transform);
    // 使用turf工具生成polygon
    geometry = turf.polygon([
      [leftTop, leftButtom, rightButtom, rightTop, leftTop],
    ]);
  } else if (boundingVolume.hasOwnProperty("sphere")) {
    debugger;
    center = new Cesium.Cartesian4(
      boundingVolume.sphere[0],
      boundingVolume.sphere[1],
      boundingVolume.sphere[2],
      1
    );
    center = toDegrees(center, root.transform);
    var radius = boundingVolume.sphere[3];
    var options = { units: "meters" };
    // 使用turf工具生成circle
    geometry = turf.circle(center, radius, options);
  }

  return {
    center: center,
    geometry: geometry,
  };
}

/**
 * 笛卡尔点转换经纬度，这里根据需要只取平面坐标
 * @param {Object} point
 * @param {Object} transform
 */
export function toDegrees(point, transform) {
  let result = null;
  // 是否有转换矩阵
  if (transform) {
    let matrix4 = Cesium.Matrix4.fromColumnMajorArray(transform);
    let wgs84Cartesian4 = Cesium.Matrix4.multiplyByVector(
      matrix4,
      point,
      new Cesium.Cartesian4()
    );
    let wgs84Cartesian3 = Cesium.Cartesian3.fromCartesian4(wgs84Cartesian4);
    let wgs84Cartographic = Cesium.Cartographic.fromCartesian(wgs84Cartesian3);
    let lon = Cesium.Math.toDegrees(wgs84Cartographic.longitude);
    let lat = Cesium.Math.toDegrees(wgs84Cartographic.latitude);
    let height = wgs84Cartographic.height;
    result = [lon, lat];
  } else {
    let wgs84Cartographic = Cesium.Cartographic.fromCartesian(point);
    let lon = Cesium.Math.toDegrees(wgs84Cartographic.longitude);
    let lat = Cesium.Math.toDegrees(wgs84Cartographic.latitude);
    let height = wgs84Cartographic.height;
    result = [lon, lat];
  }
  return result;
}

