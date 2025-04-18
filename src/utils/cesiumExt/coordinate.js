// 笛卡尔转经纬度点

import * as Cesium from "cesium";

export function cartesian3ToCoordinates(position) {
    const c = Cesium.Cartographic.fromCartesian(position);
    return [
        Cesium.Math.toDegrees(c.longitude),
        Cesium.Math.toDegrees(c.latitude),
        c.height
    ];
}

//笛卡尔坐标转为经纬度（二维）
export function cartesian3ToDegrees(position) {
    let c = Cesium.Cartographic.fromCartesian(position);
    return [Cesium.Math.toDegrees(c.longitude), Cesium.Math.toDegrees(c.latitude)];
}


//经纬度坐标转为笛卡尔（三维）
export function coordinatesToCartesian3(coordinate) {
    let position = Cesium.Cartesian3.fromDegrees(coordinate[0], coordinate[1], coordinate[2])
    return position;
}