import * as Cesium from "cesium";

// 计算距离
export function getLength(points) {
    var length = 0;
    for (var i = 0; i < points.length - 1; i++) {
        var point1cartographic = Cesium.Cartographic.fromCartesian(points[i]);
        var point2cartographic = Cesium.Cartographic.fromCartesian(
            points[i + 1]
        );
        /**根据经纬度计算出距离**/
        var geodesic = new Cesium.EllipsoidGeodesic();
        geodesic.setEndPoints(point1cartographic, point2cartographic);
        var s = geodesic.surfaceDistance;
        //返回两点之间的距离
        s = Math.sqrt(
            Math.pow(s, 2) +
            Math.pow(
                point2cartographic.height - point1cartographic.height,
                2
            )
        );
        length = length + s;
    }
    if (length > 1000) {
        length = `${(length / 1000).toFixed(2)} km`;
    } else {
        length = `${length.toFixed(2)} m`;
    }
    return length;
}
//量算功能方法
//辅助点
export function addPoint(centerPoint, drawSymbol, pid = 0) {
    return new Cesium.Entity({
        pid: pid ? pid + "-Point" : new Date().getTime(),
        // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
        position: centerPoint,
        point: {
            // 点的大小（像素）
            pixelSize: drawSymbol.geosize + 3,
            // 点位颜色，fromCssColorString 可以直接使用CSS颜色
            color: Cesium.Color.fromCssColorString('#ee0000'),
            // 边框颜色
            outlineColor: Cesium.Color.fromCssColorString('#fff'),
            // 边框宽度(像素)
            outlineWidth: 4,
            // 显示在距相机的距离处的属性，多少区间内是可以显示的
            // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1500),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,

            // 是否显示
            show: true,
        },
    });
    //return viewer.entities.add();
};
// 添加文字
export function addLabel(point, text, drawSymbol, pid = 0) {

    return new Cesium.Entity({
        pid: pid ? pid + "-Text" : new Date().getTime(),
        position: point,
        label: {
            text: drawSymbol.text + ":【" + text + "】",
            font: 'normal ' + drawSymbol.textsize + 'px MicroSoft YaHei',
            //font: drawSymbol.textsize + 'px sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE, //FILL  FILL_AND_OUTLINE OUTLINE
            fillColor: Cesium.Color.fromCssColorString(drawSymbol.textcolor),
            showBackground: true, //指定标签后面背景的可见性
            backgroundColor: Cesium.Color.fromCssColorString(drawSymbol.background), // 背景颜色
            backgroundPadding: new Cesium.Cartesian2(6, 6), //指定以像素为单位的水平和垂直背景填充
            pixelOffset: new Cesium.Cartesian2(0, -25),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scale: 0.5,
        },
    });
};