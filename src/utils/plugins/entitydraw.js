import * as Cesium from "cesium";
// 普通绘制
import EntityDraw from "./draw/EntityDraw";
// import appConfig from "@/js/appConfig"
/* 地标图片 */
import greenpng from "@/assets/images/green.png";
import redpng from "@/assets/images/red.png";
import bluepng from "@/assets/images/blue.png";
//水材质的图片
import waterJpg from "@/assets/images/cesium-images/waterNormals.jpg";

// Cesium粒子系统标绘实例
import ParticelPlotLayer from "./particeplot/ParticlePlotLayer";
import { getPlotCode } from "@/utils/cesiumExt/PlotBaseUtils";
import { cartesian3ToCoordinates } from "@/utils/cesiumExt/coordinate";

import * as turf from "@turf/turf";

// //全局变量存绘制的图形数据
// import useStore from "@/stores";
// const { iconProjectStore } = useStore();
// import { saveProjectIcon, getIconProjectList } from "../icondraw-api";

let cesiumInit = {
  viewer: null, //地图视图
  symbol: null, //符号样式
  geoEntity: null, //当前在绘制的图形实体
  labelEntity: null, //当前在绘制图形的文本标注实体
  geoIndex: 0, //图形索引
  currentIcon: null, //当前绘制的图形信息
  entityCollection: [],
  primitiveCollection: [],
  init(viewer) {
    this.viewer = viewer;
    this.initDrawTool();
    this.initPlot();
    //存储所有水面数据
    this.waterPrimitives = [];
    //this.addHeliuRegion();
  },

  //初始化绘制工具
  initDrawTool() {
    this.geoEntity = null;
    this.labelEntity = null;
    this.drawTool = new EntityDraw(this.viewer);
    // this.drawTool.DrawEndEvent.addEventListener((result, positions, drawType) => {
    //     result.remove();
    //     this.geoEntity = null;
    //     this.labelEntity = null;
    //     this.addDrawResult(positions, drawType);
    //     //存储数据
    //     this.toGeoJson(positions);
    //     console.log("绘制类型：" + drawType + "结果如下");
    //     console.log(positions);
    //     //console.log(latlongs, "经纬度坐标")
    // })
  },

  // 初始化标绘-烟火，喷泉，烟雾
  initPlot() {
    this.particlePlotLayer = new ParticelPlotLayer(this.viewer);
    this.particlePlotLayer.setPlotSelectable(true);
  },

  //添加绘制结果
  addDrawResult(positions, drawType, symbol = null, pid = null) {
    if (symbol != null) {
      this.symbol = symbol;
    }
    switch (drawType) {
      case "Point":
      case "billboard":
        this.generatePoint(positions, pid);
        break;
      case "Polyline":
        this.generatePolyline(positions, pid);
        break;
      case "Polygon":
        this.generatePolygon(positions, pid);
        break;
      case "Cube":
        this.generateCube(positions, pid);
        break;
      case "Text":
        this.generteLabel(positions[0], true, pid);
        break;
      case "Water":
        this.addWaterRegion(positions, pid);
        break;
      case "SpaceLength":
        this.addSpaceLength(positions, pid);
        break;
      case "Fire":
        this.addFire(positions[0], pid);
        break;
      case "Fountain":
        this.addFountain(positions[0], pid);
        break;
      case "Smoke":
        this.addSmoke(positions[0], pid);
        break;
    }

    // //缩放至
    // if (symbol != null) {
    //     if (drawType == "Text") {
    //         this.zoomTo(this.labelEntity);
    //     }
    //     else {
    //         this.zoomTo(this.geoEntity);
    //     }
    // }
  },

  //构造文本标注
  generteLabel(positions, bg = false, pid) {
    if (this.symbol) {
      if (this.symbol.text != "") {
        this.labelEntity = new Cesium.Entity({
          id: pid ? pid + "-Text" : new Date().getTime(),
          position: positions,
          label: {
            text: this.symbol.text,
            showBackground: bg,
            font: "normal " + this.symbol.textsize + "px MicroSoft YaHei",
            backgroundColor: Cesium.Color.fromCssColorString(
              this.symbol.background
            ),
            backgroundPadding: new Cesium.Cartesian2(15, 10),
            fillColor: Cesium.Color.fromCssColorString(this.symbol.textcolor),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            horizontalOrigin: Cesium.HorizontalOrigin.BOTTOM,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scale: 0.5,
            outlineWidth: this.symbol.outlinewidth,
            outlineColor: Cesium.Color.fromCssColorString(
              this.symbol.outlinecolor
            ),
            //pixelOffset: new Cesium.Cartesian2(0, -40),
            show: true,
            heightReference: this.symbol.isground
              ? Cesium.HeightReference.CLAMP_TO_GROUND
              : Cesium.HeightReference.NONE,
          },
        });
        let entity = this.viewer.entities.add(this.labelEntity);
      }
    }
  },

  //构造点图形label
  generteGeoLabel() {
    //图形标注文字
    if (this.symbol.text != "") {
      this.geoEntity.label = {
        text: this.symbol.text,
        showBackground: true,
        font: "normal " + this.symbol.textsize + "px MicroSoft YaHei",
        backgroundColor: Cesium.Color.fromCssColorString(
          this.symbol.background
        ),
        fillColor: Cesium.Color.fromCssColorString(this.symbol.textcolor),

        // pixelOffset: new Cesium.Cartesian2(0, -35),
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,

        // verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        // horizontalOrigin: Cesium.HorizontalOrigin.BOTTOM,
        //style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scale: 0.5,
        outlineWidth: this.symbol.outlinewidth,
        outlineColor: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
        pixelOffset:
          this.symbol.type == "billboard"
            ? new Cesium.Cartesian2(0, -35)
            : new Cesium.Cartesian2(0, Number(-this.symbol.geosize)),
        show: true,
        //让模型在地形上紧贴
        heightReference: this.symbol.isground
          ? Cesium.HeightReference.CLAMP_TO_GROUND
          : Cesium.HeightReference.NONE,
      };
    }
  },

  //构造点
  generatePoint(positions, pid) {
    let _symbol = null;
    if (this.symbol) {
      switch (this.symbol.type) {
        case "billboard":
          let image = greenpng;
          switch (this.symbol.image) {
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
            // height: 36,
            // // 宽度（以像素为单位）
            // width: 30,
            // // 逆时针旋转
            // rotation: 0,
            // 大小是否以米为单位
            //sizeInMeters: false,
            // 相对于坐标的垂直位置
            verticalOrigin: Cesium.VerticalOrigin.BASELINE,
            // 相对于坐标的水平位置
            // horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            // 该属性指定标签在屏幕空间中距此标签原点的像素偏移量
            //pixelOffset: new Cesium.Cartesian2(10, 0),
            //让模型在地形上紧贴
            heightReference: this.symbol.isground
              ? Cesium.HeightReference.CLAMP_TO_GROUND
              : Cesium.HeightReference.NONE,
            //disableDepthTestDistance: 10,
            scale: 0.35,
            // 是否显示
            show: true,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            //clampToGround: true,
          };
          this.geoEntity = new Cesium.Entity({
            id: pid ? pid + "-" + this.symbol.type : new Date().getTime(),
            position: positions[0],
            billboard: _symbol,
            //name: '',
          });
          break;
        default: //默认point
          this.geoEntity = new Cesium.Entity({
            id: pid ? pid + "-" + this.symbol.type : new Date().getTime(),
            position: positions[0],
            // name: '',
            point: {
              pixelSize: this.symbol.geosize,
              color: Cesium.Color.fromCssColorString(this.symbol.color),
              outlineWidth: this.symbol.outlinewidth,
              outlineColor: Cesium.Color.fromCssColorString(
                this.symbol.outlinecolor
              ),
              heightReference: this.symbol.isground
                ? Cesium.HeightReference.CLAMP_TO_GROUND
                : Cesium.HeightReference.NONE,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          });
          break;
      }
    }
    //图形标注文字
    this.generteGeoLabel();
    let entity = this.viewer.entities.add(this.geoEntity);

    // let entity = this.viewer.entities.add({
    //     position: positions[0],
    //     billboard: symbol
    //     // point: {
    //     //     pixelSize: 15,//点的大小
    //     //     color: Cesium.Color.RED,//点的颜色
    //     //     outlineWidth: 2,//边框宽度
    //     //     outlineColor: Cesium.Color.WHITE.withAlpha(0.4),//边框颜色
    //     // }
    // })
    console.log(entity, "entity");
  },

  //构造线
  generatePolyline(positions, pid) {
    this.geoEntity = new Cesium.Entity({
      id: pid ? pid + "-" + this.symbol.type : new Date().getTime(),
      polyline: {
        positions: positions,
        width: this.symbol.geosize,
        // material: new Cesium.PolylineDashMaterialProperty({
        //     color: Cesium.Color.fromCssColorString(this.symbol.color)// Cesium.Color.YELLOW,
        // }),
        // material: Cesium.Color.fromCssColorString(this.symbol.color),
        material: Cesium.Color.fromCssColorString(this.symbol.color),
        // depthFailMaterial: new Cesium.ImageMaterialProperty({
        //     image: allowpng,
        //     speed: 20,
        //     color: Cesium.Color.fromCssColorString(this.symbol.color),
        //     repeat: { x: 40, y: 1 }
        // }),
        //depthFailMaterial: Cesium.Color.fromCssColorString(this.symbol.color),
        //classificationType: Number(this.symbol.classificationtype),
        //depthFailMaterial: Cesium.Color.fromCssColorString(this.symbol.color),
        // clampToGround:this.symbol.isground ? true : false,
        classificationType:
          this.symbol.isground == true
            ? Cesium.ClassificationType.TERRAIN
            : Cesium.ClassificationType.BOTH, //多边形贴地形
        //clampToGround: this.symbol.isground == true ? true : false, //线贴地形
        //clampToGround: Number(this.symbol.classificationtype) == 1 ? false : true, //线贴地形
      },
    });

    //中心点
    //var pCenter = positions[positions.length / 2];
    if (this.symbol.text != "") {
      let transPos = [];
      let height = 0;
      positions.forEach((point) => {
        let _point = cartesian3ToCoordinates(point);
        height += _point[2];
        let _pointTruf = transPos.push(turf.point(_point));
      });
      height = height / positions.length;
      var features = turf.featureCollection(transPos);
      var center = turf.center(features);
      var pCenter = Cesium.Cartesian3.fromDegrees(
        center.geometry.coordinates[0],
        center.geometry.coordinates[1],
        height
      );
      //计算距离
      //let text = getLength(positions);
      // this.symbol.text = this.symbol.text + text;
      //图形标注文字
      this.generteLabel(pCenter, true, pid);
    }

    this.viewer.entities.add(this.geoEntity);
  },

  //构造面
  generatePolygon(positions, pid) {
    const cartographic = this.viewer.camera.positionCartographic;
    this.elevation =
      this.viewer.scene.globe.getHeight(cartographic) > 0
        ? this.viewer.scene.globe.getHeight(cartographic).toFixed(1)
        : 0;
    this.geoEntity = new Cesium.Entity({
      id: pid ? pid + "-" + this.symbol.type : new Date().getTime(),
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          return new Cesium.PolygonHierarchy(positions);
        }, false),
        // material: new PolylineAntialiasingMaterialProperty({ color: Cesium.Color.fromCssColorString(this.symbol.color) }),
        material: Cesium.Color.fromCssColorString(this.symbol.color),
        //perPositionHeight: false,
        //classificationType: Cesium.ClassificationType.BOTH, // 贴地表和贴模型,如果设置了，这不能使用挤出高度
        // classificationType: Number(this.symbol.classificationtype),
        //extrudedHeight: Number(this.elevation) + 10,
        //perPositionHeight: this.symbol.classificationtype == 1 ? true : false,//多边形贴地形不可以设置此参数
        //height: Number(this.elevation) + 10,
        //heightReference: this.symbol.classificationtype == 1 ? Cesium.HeightReference.RELATIVE_TO_GROUND : Cesium.HeightReference.CLAMP_TO_GROUND,
        classificationType:
          this.symbol.isground == true
            ? Cesium.ClassificationType.TERRAIN
            : Cesium.ClassificationType.BOTH, //多边形贴地形
        clampToGround: true, //线贴地形
      },
      polyline: {
        positions: positions.concat(positions[0]),
        width: this.symbol.outlinewidth,
        // material: new Cesium.PolylineDashMaterialProperty({
        //     color: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
        // }),
        material: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
        //classificationType: Cesium.ClassificationType.BOTH,
        //clampToGround: true, //线贴地形
        classificationType:
          this.symbol.isground == true
            ? Cesium.ClassificationType.TERRAIN
            : Cesium.ClassificationType.BOTH, //多边形贴地形
        clampToGround: true, //线贴地形
      },
    });
    //计算多边形中心点
    var pyPositions = this.geoEntity.polygon.hierarchy.getValue(
      Cesium.JulianDate.now()
    ).positions;
    //中心点
    var pCenter = Cesium.BoundingSphere.fromPoints(pyPositions).center;
    //图形标注文字
    this.generteLabel(pCenter, false, pid);
    this.viewer.entities.add(this.geoEntity);
  },

  //构建立方体
  generateCube(positions, pid) {
    let res_LatandLong = cartesian3ToCoordinates(positions[0]);
    console.log(res_LatandLong, "res_LatandLong");

    const cartographic = this.viewer.camera.positionCartographic;
    this.elevation =
      this.viewer.scene.globe.getHeight(cartographic) > 0
        ? this.viewer.scene.globe.getHeight(cartographic).toFixed(1)
        : 0;

    this.geoEntity = new Cesium.Entity({
      id: pid ? pid + "-" + this.symbol.type : new Date().getTime(),
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          return new Cesium.PolygonHierarchy(positions);
        }, false),
        //meterial: new Cesium.Color(colorobj.red, colorobj.green, colorobj.blue, colorobj.alpha),
        //material: Cesium.Color.RED.withAlpha(0.6),
        material: Cesium.Color.fromCssColorString(this.symbol.color),
        // classificationType: Number(this.symbol.classificationtype),//多边形贴地形
        classificationType:
          this.symbol.isground == true
            ? Cesium.ClassificationType.TERRAIN
            : Cesium.ClassificationType.BOTH, //多边形贴地形
        clampToGround: true, //线贴地形
        extrudedHeight: Number(this.elevation) + Number(this.symbol.height), //设置立体高度
        //height:  Number(this.elevation)+Number(this.symbol.height),
        //perPositionHeight: true,//多边形贴地形不可以设置此参数
        arcType: Cesium.ArcType.RHUMB,
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
      },
      polyline: {
        positions: new Cesium.CallbackProperty((e) => {
          return positions.concat(positions[0]);
        }, false),
        width: this.symbol.outlineWidth,
        // material: new Cesium.PolylineDashMaterialProperty({
        //     color: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),
        // }),
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
        }),
        //material: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),//Cesium.Color.RED.withAlpha(0.6),
        depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
        }),
        //classificationType: Cesium.ClassificationType.BOTH,
        //clampToGround: true, //线贴地形
        classificationType:
          this.symbol.isground == true
            ? Cesium.ClassificationType.TERRAIN
            : Cesium.ClassificationType.BOTH, //多边形贴地形
        clampToGround: true, //线贴地形
      },
    });
    //计算多边形中心点
    var pyPositions = this.geoEntity.polygon.hierarchy.getValue(
      Cesium.JulianDate.now()
    ).positions;
    //中心点
    var pCenter = Cesium.BoundingSphere.fromPoints(pyPositions).center;
    // var coordinatePoint = cartesian3ToCoordinates(pCenter);
    // console.log(coordinatePoint, "coordinatePoint");
    // pCenter = Cesium.Cartesian3.fromDegrees(coordinatePoint[1], coordinatePoint[2], Number(this.elevation) + Number(this.symbol.height));
    // //图形标注文字
    this.generteLabel(pCenter, false, pid);
    this.viewer.entities.add(this.geoEntity);
  },

  //添加河流水面
  addHeliuRegion() {
    const positions = [
      { x: -1573646.574385626, y: 5327862.998114007, z: 3122882.0126497806 },
      { x: -1573674.4927850217, y: 5327841.079208016, z: 3122905.0853668815 },
      { x: -1573697.300247773, y: 5327824.154858261, z: 3122922.2296030447 },
      { x: -1573723.2566743596, y: 5327804.220696046, z: 3122942.8339925 },
      { x: -1573758.6792294222, y: 5327780.238635048, z: 3122965.933496034 },
      { x: -1573782.7955957302, y: 5327764.660988683, z: 3122980.284263632 },
      { x: -1573802.0711376078, y: 5327753.162159477, z: 3122989.961597303 },
      { x: -1573818.2256981286, y: 5327743.702623943, z: 3122997.8881463786 },
      { x: -1573836.390515118, y: 5327730.24093674, z: 3123011.720182871 },
      { x: -1573853.867715565, y: 5327716.870771106, z: 3123025.672760408 },
      { x: -1573881.363708308, y: 5327696.189850067, z: 3123046.939113487 },
      { x: -1573917.6152507644, y: 5327669.018123424, z: 3123074.966586196 },
      { x: -1573926.9820208312, y: 5327662.461066732, z: 3123081.351110614 },
      { x: -1573938.1098204239, y: 5327654.702930395, z: 3123088.759295021 },
      { x: -1573954.0176107218, y: 5327644.379581239, z: 3123098.291348635 },
      { x: -1573964.7512216873, y: 5327635.925342955, z: 3123104.6748915347 },
      { x: -1573984.9669868168, y: 5327619.909903474, z: 3123116.289125795 },
      { x: -1573968.8319637552, y: 5327616.4065885795, z: 3123130.7026131423 },
      { x: -1573944.0563865206, y: 5327639.361826853, z: 3123111.33203873 },
      { x: -1573927.7554437916, y: 5327650.519985489, z: 3123100.7197816116 },
      { x: -1573904.7711183839, y: 5327666.247100797, z: 3123085.6995552983 },
      { x: -1573900.0844216363, y: 5327669.12337478, z: 3123083.13969443 },
      { x: -1573882.656988854, y: 5327682.386903352, z: 3123069.5155642116 },
      { x: -1573852.8168025815, y: 5327705.006477089, z: 3123045.985478789 },
      { x: -1573826.1044827306, y: 5327724.060820944, z: 3123027.076716561 },
      { x: -1573797.9909229, y: 5327743.687548958, z: 3123008.816503377 },
      { x: -1573768.141830067, y: 5327762.834272328, z: 3122990.471647622 },
      { x: -1573740.1560181207, y: 5327780.735847701, z: 3122974.151395415 },
      { x: -1573710.2984952328, y: 5327801.620498089, z: 3122953.746622961 },
      { x: -1573666.9494654608, y: 5327834.72201891, z: 3122919.660895541 },
      { x: -1573633.8838709379, y: 5327860.265334742, z: 3122893.1117008366 },
    ];
    this.addWaterRegion(positions);
  },

  //添加水面
  addWaterRegion(positions, pid) {
    //创建水体geometry
    var polygon1 = new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(positions),
      // perPositionHeight: true,
      // classificationType: Cesium.ClassificationType.BOTH,
      classificationType:
        this.symbol.isground == true
          ? Cesium.ClassificationType.TERRAIN
          : Cesium.ClassificationType.BOTH, //多边形贴地形
      // clampToGround: true, //线贴地形
      vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
    });

    //primitive的贴地设置用Cesium.GroundPrimitive，不能用Cesium.Primitive
    var primitive = new Cesium.GroundPrimitive({
      id: pid ? pid + "-" + this.symbol.type : new Date().getTime(),
      geometryInstances: new Cesium.GeometryInstance({
        geometry: polygon1,
      }),
      appearance: new Cesium.EllipsoidSurfaceAppearance({
        aboveGround: true,
      }),
      // classificationType: Number(this.symbol.classificationtype),
      classificationType:
        this.symbol.isground == true
          ? Cesium.ClassificationType.TERRAIN
          : Cesium.ClassificationType.BOTH, //多边形贴地形
      // clampToGround: true, //线贴地形
      show: true,
    });
    //创建水体材质
    var waterMaterial = this.createWaterMaterial();
    primitive.appearance.material = waterMaterial;

    this.geoPrimitive = this.viewer.scene.primitives.add(primitive); //添加到场景
    //this.waterPrimitives.push(this.geoPrimitive);
    let pindex = this.viewer.scene.primitives.length - 1;
    this.primitiveCollection.push({
      entityid: pid,
      index: pindex,
      geoPrimitive: this.geoPrimitive,
      positions: positions,
    });
  },

  //创建水体材质
  createWaterMaterial() {
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
  },

  //添加火焰
  addFire(position, entityid) {
    var geoFeature = {
      type: "Feature",
      properties: {
        id: entityid,
        plotCode: getPlotCode(),
        plotType: "fire",
        style: undefined,
        attr: {
          name: "火焰",
        },
        isadd: true,
      },
      geometry: {
        type: "Point",
        coordinates: cartesian3ToCoordinates(position),
      },
    };
    this.particlePlotLayer.addPlot(geoFeature);
    this.geoPrimitive = this.particlePlotLayer.particleSystem;
    this.geoEntity = this.particlePlotLayer.entity;
    let pindex = this.viewer.scene.primitives.length - 1;
    this.primitiveCollection.push({
      entityid: entityid,
      index: pindex,
      geoPrimitive: this.geoPrimitive,
    });
  },

  //添加烟雾
  addSmoke(position, entityid) {
    var geoFeature = {
      type: "Feature",
      properties: {
        id: entityid,
        plotCode: getPlotCode(),
        plotType: "smoke",
        style: undefined,
        attr: {
          name: "烟雾",
        },
        isadd: true,
      },
      geometry: {
        type: "Point",
        coordinates: cartesian3ToCoordinates(position),
      },
    };
    this.particlePlotLayer.addPlot(geoFeature);
    this.geoPrimitive = this.particlePlotLayer.particleSystem;
    this.geoEntity = this.particlePlotLayer.entity;
    let pindex = this.viewer.scene.primitives.length - 1;
    this.primitiveCollection.push({
      entityid: entityid,
      index: pindex,
      geoPrimitive: this.geoPrimitive,
    });
  },
  //添加喷泉
  addFountain(position, entityid) {
    var geoFeature = {
      type: "Feature",
      properties: {
        id: entityid,
        plotCode: getPlotCode(),
        plotType: "fountain",
        style: undefined,
        attr: {
          name: "喷泉",
        },
        isadd: true,
      },
      geometry: {
        type: "Point",
        coordinates: cartesian3ToCoordinates(position),
      },
    };
    this.particlePlotLayer.addPlot(geoFeature);
    this.geoPrimitive = this.particlePlotLayer.particleSystem;
    this.geoEntity = this.particlePlotLayer.entity;
    let pindex = this.viewer.scene.primitives.length - 1;
    this.primitiveCollection.push({
      entityid: entityid,
      index: pindex,
      geoPrimitive: this.geoPrimitive,
    });
  },

  //空间测距
  addSpaceLength(positions, pid) {
    this.geoEntity = new Cesium.Entity({
      id: pid ? pid + "-" + this.symbol.type : new Date().getTime(),
      polyline: {
        positions: positions,
        width: this.symbol.geosize,
        material: Cesium.Color.fromCssColorString(this.symbol.color),
        classificationType:
          this.symbol.isground == true
            ? Cesium.ClassificationType.TERRAIN
            : Cesium.ClassificationType.BOTH, //多边形贴地形
      },
    });
    this.viewer.entities.add(this.geoEntity);
  },

  //激活绘制工具
  drawActivate(symbol, currentIcon = null) {
    //type in Point Polyline Polygon

    this.symbol = symbol;
    console.log(symbol, "symbol");
    this.drawTool.activate(this.symbol);
  },

  //清除所有绘制
  clearDraw() {
    if (this.viewer) {
      this.viewer.entities.removeAll();

      this.waterPrimitives.forEach((item) => {
        this.viewer.scene.primitives.remove(item);
      });
      //this.viewer.scene.primitives.removeAll();
      this.waterPrimitives = [];

      this.particlePlotLayer.clear();
    }
  },

  //加载三维模型
  load3ditles() {
    var tileset = this.viewer.scene.primitives.add(
      new Cesium.Cesium3DTileset({
        url: "http://data.marsgis.cn/3dtiles/max-ytlhz/tileset.json",
      })
    );

    tileset.readyPromise
      .then((tileset) => {
        this.tileset = tileset;
        this.viewer.zoomTo(tileset);
      })
      .otherwise(function (error) {
        console.log(error);
      });
  },
  //设置视角
  setView(position) {
    console.log(position, "position");
    this.viewer.scene.camera.setView({
      duration: 1,
      destination: position,
      orientation: {
        heading: 20000,
        pitch: -2,
        range: 100000,
      },
    });
  },
  zoomTo(entity) {
    this.viewer.zoomTo(entity, {
      heading: 20000,
      pitch: -2,
      range: 100000,
    });
  },

  //设置模型高度
  setTilesetHeight(height) {
    var cartographic = Cesium.Cartographic.fromCartesian(
      this.tileset.boundingSphere.center
    );
    var surface = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height
    );
    var offset = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      height
    );
    var translation = Cesium.Cartesian3.subtract(
      offset,
      surface,
      new Cesium.Cartesian3()
    );
    this.tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
  },

  destroy() {
    if (this.viewer) {
      // this.viewer.entities.removeAll();
      // this.viewer.imageryLayers.removeAll(true);
      // this.viewer.destroy();
    }
  },
  toGeoJson(positions, pid) {
    let positionArr = [];
    positions.forEach((p) => {
      positionArr.push(cartesian3ToCoordinates(p));
    });
    var geoFeature = {
      type: "Feature",
      properties: {
        plotCode: pid,
        plotType: this.symbol.type,
        style: undefined,
        attr: this.symbol,
      },
      geometry: {
        type: this.symbol.type,
        coordinates: positionArr,
      },
    };

    return geoFeature;
    //保存数据到数据库
    // let res = await this.saveDrawData(geoFeature, childlist);
    // return res;
    // console.log(geoFeature);
  },
  //保存绘制的图形数据
  // async saveDrawData(geoFeature, drawExtSymbol = null, pid = 0) {
  //     debugger;
  //     let icondata = {
  //         pid: pid,
  //         name: drawExtSymbol ? drawExtSymbol.name : this.symbol.name,
  //         parentid: 1,
  //         userid: this.symbol ? this.symbol.userid : drawExtSymbol.userid,
  //         iconname: drawExtSymbol ? drawExtSymbol.iconname : this.symbol.iconname,
  //         iconPid: drawExtSymbol ? drawExtSymbol.iconpid : this.symbol.iconpid,
  //         graphicpoints: JSON.stringify(geoFeature)
  //     };
  //     const { data: res } = await saveProjectIcon(icondata);
  //     return res;
  //     // console.log(res, "saveDrawData");
  //     // this.getProjectIcons(childlist);
  // },

  async getProjectIcons() {
    const { data: res } = await getIconProjectList();
    return res;
    //projectList.value = res.data;
    // if (res.data.length > 0) {
    //     return res.data[0].childlist;
    //     // childlist.value = res.data[0].childlist;
    //     //console.log(childlist.value, "childlist.value");
    // }
  },

  //禁用绘制
  deactivate() {
    if (this.drawTool) {
      if (this.drawTool.tips != null) {
        this.viewer.entities.remove(this.drawTool.tips);
      }
      this.drawTool.animationSpeed;
      this.drawTool.deactivate();
    }
  },
};
export default cesiumInit;
