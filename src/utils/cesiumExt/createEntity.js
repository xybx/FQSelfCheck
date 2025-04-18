import * as Cesium from "cesium";
import * as turf from "@turf/turf";

/* 地标图片 */
import greenpng from "@/assets/images/green.png";
import redpng from "@/assets/images/red.png";
import bluepng from "@/assets/images/blue.png";

/*绘制箭头，燕尾箭头 */
import cesiumAllowInit from "@/utils/plugins/MilitaryPlotDraw";
/*烟火，烟雾，喷泉 */
import ParticelPlotLayer from "../plugins/particeplot/ParticlePlotLayer";
import { getPlotCode } from "@/utils/cesiumExt/PlotBaseUtils";
import { addPoint, addLabel, getLength } from "@/utils/cesiumExt/tool";

//水材质的图片
import waterJpg from "@/assets/images/cesium-images/waterNormals.jpg";

//添加绘制结果
export function createEntity(pid, geojsonstr, viewer) {
  if (geojsonstr) {
    debugger;
    let geojson = JSON.parse(geojsonstr);
    switch (geojson.properties.plotType) {
      case "Point":
      case "billboard":
        return generatePoint(geojson, pid);
      case "Polyline":
        return generatePolyline(geojson, pid);
      case "squadcombat":
      case "tailedsquadcombat":
        debugger;
        let entitys = [];
        // //箭头，燕尾箭头
        cesiumAllowInit.init(viewer);
        cesiumAllowInit.militaryPlotLayer.addPlot(
          geojson,
          geojson.properties.attr
        );
        viewer.entities.remove(cesiumAllowInit.militaryPlotLayer.geoEntity);

        entitys.push(cesiumAllowInit.militaryPlotLayer.geoEntity);
        if (cesiumAllowInit.militaryPlotLayer.labelEntity) {
          viewer.entities.remove(cesiumAllowInit.militaryPlotLayer.labelEntity);
          entitys.push(cesiumAllowInit.militaryPlotLayer.labelEntity);
        }
        return entitys;
      //return generatePolygon(geojson, pid);
      case "Polygon":
        return generatePolygon(geojson, pid);

      case "Cube":
        return generateCube(geojson, viewer, pid);
      case "Text":
        let positions = [];
        geojson.geometry.coordinates.forEach((point) => {
          positions.push(
            Cesium.Cartesian3.fromDegrees(point[0], point[1], point[2])
          );
        });
        let geoEntity = generteLabel(geojson, positions[0], pid, true);
        return [geoEntity];
      case "SpaceLength":
        return generateSpaceLength(geojson, pid);
      case "Water":
        return addWaterRegion(geojson, pid, viewer);
        break;
      case "Fire":
        return addFire(geojson, pid, viewer);

      case "Fountain":
        return addFountain(geojson, pid, viewer);
      case "Smoke":
        return addSmoke(geojson, pid, viewer);
    }
  } else return [];
}

//构造文本标注
export function generteLabel(geojson, positions, pid, bg = true) {
  let symbol = geojson.properties.attr;
  let labelEntity = null;
  if (symbol.text != "") {
    labelEntity = new Cesium.Entity({
      id: pid + "-Text",
      position: positions,
      label: {
        text: symbol.text,
        showBackground: bg,
        font: "normal " + symbol.textsize + "px MicroSoft YaHei",
        backgroundColor: Cesium.Color.fromCssColorString(symbol.background),
        backgroundPadding: new Cesium.Cartesian2(15, 10),
        fillColor: Cesium.Color.fromCssColorString(symbol.textcolor),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        horizontalOrigin: Cesium.HorizontalOrigin.BOTTOM,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scale: 0.5,
        outlineWidth: symbol.outlinewidth,
        outlineColor: Cesium.Color.fromCssColorString(symbol.outlinecolor),
        //pixelOffset: new Cesium.Cartesian2(0, -40),
        show: true,
        heightReference: symbol.isground
          ? Cesium.HeightReference.CLAMP_TO_GROUND
          : Cesium.HeightReference.NONE,
      },
    });
  }
  return labelEntity;
}

//构造点
export function generatePoint(geojson, pid) {
  let positions = [];
  let geoEntity = null;
  geojson.geometry.coordinates.forEach((point) => {
    positions.push(Cesium.Cartesian3.fromDegrees(point[0], point[1], point[2]));
  });
  let symbol = geojson.properties.attr;
  switch (geojson.geometry.type) {
    case "billboard":
      let _symbol = null;
      let image = geojson.properties.attr.image;
      switch (image) {
        case "redpng":
          image = redpng;
          break;
        case "bluepng":
          image = bluepng;
          break;
        default:
          image = greenpng;
          break;
      }
      _symbol = {
        // 图像地址，URI或Canvas的属性
        image: image,
        // 设置颜色和透明度
        //color: Cesium.Color.fromCssColorString(this.symbol.color), //Cesium.Color.WHITE.withAlpha(0.8)
        //scaleByDistance: new Cesium.NearFarScalar(300, 1, 1200, 0.6), //设置随图缩放距离和比例
        // 高度（以像素为单位）
        height: 36,
        // 宽度（以像素为单位）
        width: 30,
        // 逆时针旋转
        rotation: 0,
        // 大小是否以米为单位
        sizeInMeters: false,
        // 相对于坐标的垂直位置
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        // 相对于坐标的水平位置
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        // 该属性指定标签在屏幕空间中距此标签原点的像素偏移量
        // pixelOffset: new Cesium.Cartesian2(10, 0),
        //让模型在地形上紧贴
        heightReference: symbol.isground
          ? Cesium.HeightReference.CLAMP_TO_GROUND
          : Cesium.HeightReference.NONE,
        //disableDepthTestDistance: 10,
        scale: 1.0,
        // 是否显示
        show: true,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        //clampToGround: true,
      };
      geoEntity = new Cesium.Entity({
        id: pid + "-" + geojson.geometry.type,
        position: positions[0],
        billboard: _symbol,
      });
      break;
    default: //默认point
      geoEntity = new Cesium.Entity({
        id: pid + "-" + geojson.geometry.type,
        position: positions[0],
        point: {
          pixelSize: symbol.geosize,
          color: Cesium.Color.fromCssColorString(symbol.color),
          outlineWidth: symbol.outlinewidth,
          outlineColor: Cesium.Color.fromCssColorString(symbol.outlinecolor),
          heightReference: symbol.isground
            ? Cesium.HeightReference.CLAMP_TO_GROUND
            : Cesium.HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0.0,
            Number.MAX_VALUE
          ),
        },
      });
      break;
  }
  //图形标注文字
  generteGeoLabel(symbol, geoEntity);
  return [geoEntity];
}

//构造点图形label
export function generteGeoLabel(symbol, geoEntity) {
  //图形标注文字
  if (symbol.text != "") {
    geoEntity.label = {
      text: symbol.text,
      showBackground: true,
      font: "normal " + symbol.textsize + "px MicroSoft YaHei",
      backgroundColor: Cesium.Color.fromCssColorString(symbol.background),
      fillColor: Cesium.Color.fromCssColorString(symbol.textcolor),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      horizontalOrigin: Cesium.HorizontalOrigin.BOTTOM,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scale: 0.5,
      outlineWidth: symbol.outlinewidth,
      outlineColor: Cesium.Color.fromCssColorString(symbol.outlinecolor),
      pixelOffset:
        symbol.type == "billboard"
          ? new Cesium.Cartesian2(0, -40)
          : new Cesium.Cartesian2(0, Number(-symbol.geosize)),
      show: true,
      //让模型在地形上紧贴
      heightReference: symbol.isground
        ? Cesium.HeightReference.CLAMP_TO_GROUND
        : Cesium.HeightReference.NONE,
    };
  }
}

//构造线
export function generatePolyline(geojson, pid) {
  let positions = [];
  let transPos = [];
  geojson.geometry.coordinates.forEach((point) => {
    transPos.push(turf.point(point));
    positions.push(Cesium.Cartesian3.fromDegrees(point[0], point[1], point[2]));
  });
  let symbol = geojson.properties.attr;
  let geoEntity = new Cesium.Entity({
    id: pid + "-" + geojson.geometry.type,
    polyline: {
      positions: positions,
      width: symbol.geosize,
      // material: new Cesium.PolylineDashMaterialProperty({
      //     color: Cesium.Color.fromCssColorString(this.symbol.color)// Cesium.Color.YELLOW,
      // }),
      material: Cesium.Color.fromCssColorString(symbol.color),
      // material: new Cesium.ImageMaterialProperty({
      //     image: allowpng,
      //     speed: 20,
      //     color: Cesium.Color.fromCssColorString(symbol.color),
      //     repeat: { x: 40, y: 1 }
      // }),

      classificationType:
        symbol.isground == true
          ? Cesium.ClassificationType.TERRAIN
          : Cesium.ClassificationType.BOTH, //多边形贴地形
      // clampToGround: symbol.isground == true ? true : false, //线贴地形
    },
  });

  //var pCenter = positions[positions.length / 2];

  var features = turf.featureCollection(transPos);

  var center = turf.center(features);
  var pCenter = Cesium.Cartesian3.fromDegrees(
    center.geometry.coordinates[0],
    center.geometry.coordinates[1],
    geojson.geometry.coordinates[0][2]
  );
  console.log(center, "center");

  //图形标注文字
  let labelEntity = generteLabel(geojson, pCenter, pid);
  return [geoEntity, labelEntity];
}

//构造面
export function generatePolygon(geojson, pid) {
  let positions = [];
  geojson.geometry.coordinates.forEach((point) => {
    positions.push(Cesium.Cartesian3.fromDegrees(point[0], point[1], point[2]));
  });
  let symbol = geojson.properties.attr;
  let geoEntity = new Cesium.Entity({
    id: pid + "-" + geojson.geometry.type,
    polygon: {
      hierarchy: new Cesium.CallbackProperty(() => {
        return new Cesium.PolygonHierarchy(positions);
      }, false),
      // material: new PolylineAntialiasingMaterialProperty({ color: Cesium.Color.fromCssColorString(this.symbol.color) }),
      material: Cesium.Color.fromCssColorString(symbol.color),
      classificationType:
        symbol.isground == true
          ? Cesium.ClassificationType.TERRAIN
          : Cesium.ClassificationType.BOTH, //多边形贴地形
      clampToGround: symbol.isground, //线贴地形
      // 边框
      outline: true,
      // 边框颜色
      outlineColor: Cesium.Color.fromCssColorString(symbol.outlinecolor),
      // 边框尺寸
      outlineWidth: symbol.outlinewidth,
    },
    // polyline: {
    //     positions: positions.concat(positions[0]),
    //     width: symbol.outlinewidth,
    //     // material: new Cesium.PolylineDashMaterialProperty({
    //     //     color: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
    //     // }),
    //     material: Cesium.Color.fromCssColorString(symbol.outlinecolor),
    //     //classificationType: Cesium.ClassificationType.BOTH,
    //     //clampToGround: true, //线贴地形
    //     classificationType: symbol.isground == true ? Cesium.ClassificationType.TERRAIN : Cesium.ClassificationType.BOTH,//多边形贴地形
    //     clampToGround: symbol.isground, //线贴地形
    // }
  });
  //计算多边形中心点
  var pyPositions = geoEntity.polygon.hierarchy.getValue(
    Cesium.JulianDate.now()
  ).positions;
  //     //中心点
  //        //     var pyPositions = polyline.polyline.positions.getValue();
  //             //     var pCenter = Cesium.BoundingSphere.fromPoints(pyPositions).center;
  var pCenter = Cesium.BoundingSphere.fromPoints(pyPositions).center;
  let polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(pCenter);
  //图形标注文字
  let labelEntity = generteLabel(geojson, polyCenter, pid);
  return [geoEntity, labelEntity];
}

//构建立方体
export function generateCube(geojson, viewer, pid) {
  let positions = [];
  geojson.geometry.coordinates.forEach((point) => {
    positions.push(Cesium.Cartesian3.fromDegrees(point[0], point[1], point[2]));
  });
  let symbol = geojson.properties.attr;

  //获取高程
  const cartographic = viewer.camera.positionCartographic;
  let elevation =
    viewer.scene.globe.getHeight(cartographic) > 0
      ? viewer.scene.globe.getHeight(cartographic).toFixed(1)
      : 0;

  let geoEntity = new Cesium.Entity({
    id: pid + "-" + geojson.geometry.type,
    polygon: {
      hierarchy: new Cesium.CallbackProperty(() => {
        return new Cesium.PolygonHierarchy(positions);
      }, false),
      //meterial: new Cesium.Color(colorobj.red, colorobj.green, colorobj.blue, colorobj.alpha),
      //material: Cesium.Color.RED.withAlpha(0.6),
      material: Cesium.Color.fromCssColorString(symbol.color),
      // classificationType: Number(this.symbol.classificationtype),//多边形贴地形
      classificationType:
        symbol.isground == true
          ? Cesium.ClassificationType.TERRAIN
          : Cesium.ClassificationType.BOTH, //多边形贴地形
      clampToGround: symbol.isground, //线贴地形
      extrudedHeight: Number(elevation) + Number(symbol.height), //设置立体高度
      //height:  Number(this.elevation)+Number(this.symbol.height),
      //perPositionHeight: true,//多边形贴地形不可以设置此参数
      arcType: Cesium.ArcType.RHUMB,
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString(symbol.outlinecolor),
    },
    polyline: {
      positions: new Cesium.CallbackProperty((e) => {
        return positions.concat(positions[0]);
      }, false),
      width: symbol.outlineWidth,
      // material: new Cesium.PolylineDashMaterialProperty({
      //     color: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),
      // }),
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.fromCssColorString(symbol.outlinecolor),
      }),
      //material: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),//Cesium.Color.RED.withAlpha(0.6),
      depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.fromCssColorString(symbol.outlinecolor),
      }),
      //classificationType: Cesium.ClassificationType.BOTH,
      //clampToGround: true, //线贴地形
      classificationType:
        symbol.isground == true
          ? Cesium.ClassificationType.TERRAIN
          : Cesium.ClassificationType.BOTH, //多边形贴地形
      clampToGround: symbol.isground, //线贴地形
    },
  });
  //计算多边形中心点
  var pyPositions = geoEntity.polygon.hierarchy.getValue(
    Cesium.JulianDate.now()
  ).positions;
  //中心点
  var pCenter = Cesium.BoundingSphere.fromPoints(pyPositions).center;
  let polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(pCenter);
  //图形标注文字
  let labelEntity = generteLabel(geojson, polyCenter, pid);

  return [geoEntity, labelEntity];
  //this.viewer.entities.add(this.geoEntity);
}

//空间测距图形构建
export function generateSpaceLength(geojson, pid) {
  let positions = [];
  let index = 0;
  let symbol = geojson.properties.attr;
  let entitys = [];
  geojson.geometry.coordinates.forEach((point) => {
    let Cartesian3Point = Cesium.Cartesian3.fromDegrees(
      point[0],
      point[1],
      point[2]
    );
    positions.push(Cartesian3Point);
    let pointEntity = addPoint(Cartesian3Point, symbol, pid);
    entitys.push(pointEntity);
    if (index > 0) {
      let prePoint = null;
      let _prePoint = null;
      if (index == 1) {
        _prePoint = geojson.geometry.coordinates[0];
        prePoint = turf.point(_prePoint);
      } else {
        _prePoint = geojson.geometry.coordinates[index - 1];
        prePoint = turf.point(_prePoint);
      }
      let height =
        (Number(_prePoint[2]) +
          Number(geojson.geometry.coordinates[index][2])) /
        2;
      var features = turf.featureCollection([
        prePoint,
        turf.point(geojson.geometry.coordinates[index]),
      ]);
      var center = turf.center(features);
      var pCenter = Cesium.Cartesian3.fromDegrees(
        center.geometry.coordinates[0],
        center.geometry.coordinates[1],
        height
      );
      let text = getLength(positions);
      let labelEntity = addLabel(pCenter, text, symbol, pid);
      entitys.push(labelEntity);
    }
    index++;
  });

  let geoEntity = new Cesium.Entity({
    id: pid + "-" + geojson.geometry.type,
    polyline: {
      positions: positions,
      width: symbol.geosize,
      material: Cesium.Color.fromCssColorString(symbol.color),
      classificationType:
        symbol.isground == true
          ? Cesium.ClassificationType.TERRAIN
          : Cesium.ClassificationType.BOTH, //多边形贴地形
    },
  });
  entitys.push(geoEntity);
  return entitys;
}

//添加水面
export function addWaterRegion(geojson, pid, viewer) {
  let positions = [];
  geojson.geometry.coordinates.forEach((point) => {
    positions.push(Cesium.Cartesian3.fromDegrees(point[0], point[1], point[2]));
  });
  let symbol = geojson.properties.attr;
  //创建水体geometry
  var polygon1 = new Cesium.PolygonGeometry({
    polygonHierarchy: new Cesium.PolygonHierarchy(positions),
    // perPositionHeight: true,
    // classificationType: Cesium.ClassificationType.BOTH,
    classificationType:
      symbol.isground == true
        ? Cesium.ClassificationType.TERRAIN
        : Cesium.ClassificationType.BOTH, //多边形贴地形
    // clampToGround: true, //线贴地形
    vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
  });

  //primitive的贴地设置用Cesium.GroundPrimitive，不能用Cesium.Primitive
  var primitive = new Cesium.GroundPrimitive({
    id: pid ? pid + "-" + symbol.type : new Date().getTime(),
    geometryInstances: new Cesium.GeometryInstance({
      geometry: polygon1,
    }),
    appearance: new Cesium.EllipsoidSurfaceAppearance({
      aboveGround: true,
    }),
    // classificationType: Number(this.symbol.classificationtype),
    classificationType:
      symbol.isground == true
        ? Cesium.ClassificationType.TERRAIN
        : Cesium.ClassificationType.BOTH, //多边形贴地形
    // clampToGround: true, //线贴地形
    show: true,
  });
  //创建水体材质
  var waterMaterial = createWaterMaterial();
  primitive.appearance.material = waterMaterial;

  let geoPrimitive = viewer.scene.primitives.add(primitive); //添加到场景
  //this.waterPrimitives.push(this.geoPrimitive);
  let pindex = viewer.scene.primitives.length - 1;
  //   this.primitiveCollection.push({
  //     entityid: pid,
  //     index: pindex,
  //     geoPrimitive: this.geoPrimitive,
  //     positions: positions,
  //   });
  return {
    entityid: pid,
    index: pindex,
    geoPrimitive: geoPrimitive,
    positions: positions,
  };
}
//创建水体材质
function createWaterMaterial() {
  return new Cesium.Material({
    fabric: {
      type: "Water",
      uniforms: {
        baseWaterColor: Cesium.Color.CORNFLOWERBLUE.withAlpha(0.8),
        //normalMap: 'static/images/effects/waterNormalsSmall.jpg',
        normalMap: waterJpg,
        frequency: 1000.0,
        animationSpeed: 0.03,
        amplitude: 10.0,
        specularIntensity: 5,
      },
    },
  });
}

//初始化烟火，烟雾，喷泉
let particlePlotLayer = null;
export function initPlot(viewer) {
  particlePlotLayer = new ParticelPlotLayer(viewer);
  particlePlotLayer.setPlotSelectable(true);
}

//添加火焰
export function addFire(geojson, pid, viewer) {
  // let particlePlotLayer = new ParticelPlotLayer(viewer);
  // particlePlotLayer.setPlotSelectable(true);
  // let positions = [];
  // geojson.geometry.coordinates.forEach((point) => {
  //   positions.push(Cesium.Cartesian3.fromDegrees(point[0], point[1], point[2]));
  // });
  var geoFeature = {
    type: "Feature",
    properties: {
      id: pid,
      plotCode: getPlotCode(),
      plotType: "fire",
      style: undefined,
      attr: {
        name: "火焰",
      },
      isadd: false,
    },
    geometry: {
      type: "Point",
      coordinates: geojson.geometry.coordinates[0],
    },
  };
  particlePlotLayer.addPlot(geoFeature);
  let geoPrimitive = particlePlotLayer.particleSystem;
  let geoEntity = particlePlotLayer.entity;
  let pindex = viewer.scene.primitives.length - 1;
  return {
    entity: geoEntity,
    primitive: {
      entityid: pid,
      index: pindex,
      geoPrimitive: geoPrimitive,
    },
  };
}

//添加烟雾
export function addSmoke(geojson, pid, viewer) {
  // let particlePlotLayer = new ParticelPlotLayer(viewer);
  // particlePlotLayer.setPlotSelectable(true);
  var geoFeature = {
    type: "Feature",
    properties: {
      id: pid,
      plotCode: getPlotCode(),
      plotType: "smoke",
      style: undefined,
      attr: {
        name: "烟雾",
      },
      isadd: false,
    },
    geometry: {
      type: "Point",
      coordinates: geojson.geometry.coordinates[0],
    },
  };
  particlePlotLayer.addPlot(geoFeature);
  let geoPrimitive = particlePlotLayer.particleSystem;
  let geoEntity = particlePlotLayer.entity;
  let pindex = viewer.scene.primitives.length - 1;
  return {
    entity: geoEntity,
    primitive: {
      entityid: pid,
      index: pindex,
      geoPrimitive: geoPrimitive,
    },
  };
}
//添加喷泉
export function addFountain(geojson, pid, viewer) {
  // let particlePlotLayer = new ParticelPlotLayer(viewer);
  // particlePlotLayer.setPlotSelectable(true);
  var geoFeature = {
    type: "Feature",
    properties: {
      id: pid,
      plotCode: getPlotCode(),
      plotType: "fountain",
      style: undefined,
      attr: {
        name: "喷泉",
      },
      isadd: false,
    },
    geometry: {
      type: "Point",
      coordinates: geojson.geometry.coordinates[0],
    },
  };
  particlePlotLayer.addPlot(geoFeature);
  let geoPrimitive = particlePlotLayer.particleSystem;
  let geoEntity = particlePlotLayer.entity;
  let pindex = viewer.scene.primitives.length - 1;
  return {
    entity: geoEntity,
    primitive: {
      entityid: pid,
      index: pindex,
      geoPrimitive: geoPrimitive,
    },
  };
}
