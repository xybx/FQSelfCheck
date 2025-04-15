import * as Cesium from "cesium";
//水材质的图片
import waterJpg from "@/assets/images/cesium-images/waterNormals.jpg";
import {
  Cartesian3,
  Matrix4,
  Transforms,
  TextureUniform,
  Cesium3DTileset,
  CustomShader,
  UniformType,
} from "cesium";
import { isLonLat, isNumber } from "@/utils/validate";
import { getPositionFromGeom, getDistance } from "@/utils/turf-tool";

/* 取值 pinia */
import useStore from "@/stores";
const { viewStore } = useStore();
import { initLayerByKind } from "@/utils/common-map";
// 图片
import greenpng from "@/assets/images/green.png";
import redpng from "@/assets/images/red.png";
import bluepng from "@/assets/images/blue.png";

let primitives = <any>[];
// alpha
let redLineAlpha = 1;
// 获取viewer
const getViewer = (key = "default") => {
  if (key === "default") {
    return window.viewer;
  }
};
// 创建 dataSource
const createDataSource = () => {
  return new Cesium.CustomDataSource();
};

// 判断是不是笛卡尔数组
const isCartesianArray = (array: any, length: number = 3) => {
  if (!Array.isArray(array)) {
    return false;
  }
  if (array.length < length) {
    return false;
  }
  const firstElement = array[0];
  if (
    !(
      typeof firstElement === "object" &&
      "x" in firstElement &&
      "y" in firstElement &&
      "z" in firstElement
    )
  ) {
    return false;
  }
  return true;
};

// 当前只添加数据到主屏
const cesiumHelper = {
  // datasource 集合
  collection: {},

  // new datasource
  getDataSource(key: string) {
    debugger;
    let datasource = this.collection[key];
    if (!datasource) {
      datasource = createDataSource();
      this.collection[key] = datasource;
      getViewer().dataSources.add(datasource);
    }
    return datasource;
  },
  // 添加项目点位
  addPoints(data: any, key: string = "pro_point") {
    if (!data) {
      return;
    }
    let datasource = this.getDataSource(key);
    datasource.entities.removeAll();
    datasource.show = false;
    for (let i = 0; i < data.length; i++) {
      let item = data[i];
      let { centerX, centerY, centerZ, prjname, prjstatus } = item;
      let lonlat = isLonLat(centerX, centerY);
      let height = isNumber(centerZ);
      if (lonlat) {
        datasource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lonlat[0], lonlat[1], height),
          label: {
            text: prjname,
            font: "16px",
            pixelOffset: new Cesium.Cartesian2(0, -45),
            fillColor: Cesium.Color.fromCssColorString("#F98C64"),
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString("#DADAD4"),
            disableDepthTestDistance: 1 / 0,
          },
          billboard: {
            image: prjstatus == 1 ? greenpng : redpng,
            width: 40,
            height: 40,
            disableDepthTestDistance: 1 / 0,
          },
        });
      }
    }
  },
  // 控制现隐
  visibleDatSource(key: string, value: boolean) {
    let datasource = this.getDataSource(key);
    if (datasource) {
      datasource.show = value;
    }
    if (primitives.length > 0) {
      let primitive = primitives.filter((p) => p.key == key);
      if (primitive.length > 0) {
        let _primitive = getViewer().scene.primitives.get(primitive[0].index);
        if (_primitive) {
          _primitive.show = value;
        }
        if (primitive[0].geoEntity) {
          let _entity = getViewer().entities.getById(primitive[0].key);
          if (_entity) {
            _entity.show = value;
          }
        }
      }
    }
  },
  // 清除datasource
  clearDataSourceEntity(key: string) {
    let source = this.collection[key];
    if (source) {
      source.entities.removeAll();
    }
    if (primitives.length > 0) {
      primitives.forEach((p) => {
        let _primitive = getViewer().scene.primitives.get(p.index);
        getViewer().scene.primitives.remove(_primitive);
      });
    }
    primitives = [];
  },
  destroyDataSource(key: string) {
    let source = this.collection[key];
    if (source) {
      getViewer().dataSources.remove(source);
    }
    this.collection[key] = null;

    if (primitives.length > 0) {
      primitives.forEach((p) => {
        let _primitive = getViewer().scene.primitives.get(p.index);
        getViewer().scene.primitives.remove(_primitive);
      });
    }
    primitives = [];
  },
  flyToDataSource(key: string) {
    debugger;
    let source = this.collection[key];
    if (source) {
      getViewer().flyTo(source.entities);
    }
    if (primitives.length > 0) {
      let primitive = primitives.filter((p) => p.key == key);
      if (primitive.length > 0) {
        let _primitive = getViewer().scene.primitives.get(primitive[0].index);
        // if (_primitive) {
        //   getViewer().flyTo(_primitive);
        // }
        if (primitive[0].geoEntity) {
          getViewer().flyTo(primitive[0].geoEntity);
        } else {
          getViewer().camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              primitive[0].center[0],
              primitive[0].center[1],
              2000
            ),
          });
        }
        // if (primitive[0].geoEntity) {
        //   let _entity = getViewer().entities.getById(primitive[0].key);
        //   if (_entity) {
        //     _entity.show = value;
        //   }
        // }
      }
    }
  },
  // 添加用地红线
  addLine(geojson: any, trans: number, key: string = "ydhx") {
    let datasource = this.getDataSource(key);
    datasource.entities.removeAll();
    let { geometry, properties } = geojson;
    let { coordinates, type } = geometry;
    let {
      classificationtype,
      color,
      defaultShow,
      isground,
      opacity,
      outlinecolor,
      outlinewidth,
    } = properties.attr;
    redLineAlpha = opacity;
    if (type === "Polygon") {
      let positions = coordinates[0].map((e: any) => {
        return Cesium.Cartesian3.fromDegrees(e[0], e[1]);
      });
      let startPoint = Cesium.Cartesian3.clone(positions[0]);
      datasource.entities.add({
        polyline: {
          positions: [...positions, startPoint],
          width: outlinewidth,
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty(() => {
              // return Cesium.Color.fromCssColorString(outlinecolor).withAlpha(redLineAlpha)
              return Cesium.Color.fromCssColorString(outlinecolor);
            }, false)
          ),
          clampToGround: isground,
          show: defaultShow,
        },
        polygon: {
          hierarchy: { positions },
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty(() => {
              return Cesium.Color.fromCssColorString(color).withAlpha(
                redLineAlpha
              );
            }, false)
          ),
          //material: Cesium.Color.fromCssColorString(color).withAlpha(redLineAlpha),
          show: defaultShow,
          classificationType: isground
            ? Cesium.ClassificationType.BOTH
            : Cesium.ClassificationType.CESIUM_3D_TILE,
        },
      });
    }
  },
  setEntityShow(key: string, type: string, value: boolean) {
    let datasource = this.getDataSource(key);
    let entities = datasource.entities.values;
    entities.forEach((item: any) => {
      if (item[type]) {
        item[type].show = value;
      }
    });
  },
  // 修改entity透明度
  changeTrans(key: string, num: number, type = "polyline") {
    redLineAlpha = num;
  },

  flatOtherTilesets(
    viewer: Cesium.Viewer,
    tileset?: Cesium3DTileset | null,
    polygon?: number[][] | null
  ) {
    let ta = (viewer.scene.primitives as any)._primitives;
    if (tileset != null) {
      ta = (viewer.scene.primitives as any)._primitives.filter(
        (v: any) => v instanceof Cesium3DTileset && v._url !== tileset._url
      ) as Cesium3DTileset[];
    }
    debugger
    this.flatTilesets(ta, polygon);
  },
  flatTilesets(tilesets: Cesium3DTileset[], polygon?: number[][] | null) {
    if (polygon == null || polygon.length < 3) {
      tilesets.forEach((v) => {
        v.customShader = null;
      });
      return;
    }
    tilesets.forEach((v) => {
      //排除掉不是3dtile的图层
      if (!v._url || !v.boundingSphere) {
        return;
      }
      const { center: cp, radius: r } = v.boundingSphere;
      const m1 = Transforms.eastNorthUpToFixedFrame(cp);
      const m2 = Matrix4.inverseTransformation(m1, new Matrix4());
      const c = document.createElement("canvas");
      c.width = c.height = 1024;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#000";
      ctx.beginPath();
      let fm = true;
      let zlskh = null;
      console.log(m2, "inverseTransformation");
      for (const pi of polygon) {
        let { x, y, z } = Matrix4.multiplyByPoint(
          m2,
          Cartesian3.fromDegrees(
            ...(pi as [number, number, number | null | undefined])
          ),
          new Cartesian3()
        );
        console.log(x, y, z, "multiplyByPoint");
        zlskh ??= z ?? 0;
        [x, y] = [((x + r) * 512) / r, 1024 - ((y + r) * 512) / r];
        ctx[fm ? "moveTo" : "lineTo"](x, y);
        console.log(x, y, "multiplyByPoint1");
        fm = false;
      }
      ctx.closePath();
      ctx.fill();
      const id = ctx.getImageData(0, 0, 1024, 1024).data;
      const ta = new Array(id.length).fill(0);
      for (let i = 0; i < 1024; i++) {
        for (let j = 0; j < 1024; j++) {
          ta[(i * 1024 + j) * 4 + 3] = id[((1024 - 1 - i) * 1024 + j) * 4 + 3];
        }
      }
      const zlska = new TextureUniform({
        typedArray: new Uint8Array(ta),
        width: 1024,
        height: 1024,
      });
      v.customShader = new CustomShader({
        uniforms: {
          zlskm1: {
            type: UniformType.MAT4,
            value: m1,
          },
          zlskm2: {
            type: UniformType.MAT4,
            value: m2,
          },
          zlskr: {
            type: UniformType.FLOAT,
            value: r,
          },
          zlska: {
            type: UniformType.SAMPLER_2D,
            value: zlska,
          },
          zlskh: {
            type: UniformType.FLOAT,
            value: zlskh,
          },
        },
        vertexShaderText: `
                    void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput){
                        vec4 p = zlskm2 * czm_model * vec4(vsInput.attributes.positionMC, 1.0);
                        vec4 c = texture(zlska, (p.xy - vec2(-zlskr)) / vec2(zlskr * 2.0));
                        if(c.w > 0.5){
                            p.z = zlskh;
                            vsOutput.positionMC = (czm_inverseModel * zlskm1 * p).xyz;
                        }
                    }
                `.replace(/\s+/gi, " "),
      });
    });
  },
  // 获取地形高度
  getTerrainHeight(lon: any, lat: any) {
    // let cartesian3 = Cesium.Cartesian3.fromDegrees(lon, lat)
    var cartographic = Cesium.Cartographic.fromDegrees(lon, lat);
    let viewer = getViewer();
    return new Promise((resolve) => {
      if (viewer.terrainProvider._ready) {
        Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [
          cartographic,
        ]).then((updatedPositions) => {
          resolve(updatedPositions[0]);
        });
      } else {
        resolve({ height: 15 });
      }
    });
  },

  // 批量获取坐标点在地形上的高度
  getBatchTerrainHeight(coordinates) {
    // let cartesian3 = Cesium.Cartesian3.fromDegrees(lon, lat)
    coordinates.forEach((c) => {
      var cartographic = Cesium.Cartographic.fromDegrees(c[0], c[1]);
      let viewer = getViewer();
      let height = new Promise((resolve) => {
        if (viewer.terrainProvider._ready) {
          Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [
            cartographic,
          ]).then((updatedPositions) => {
            resolve(updatedPositions[0]);
          });
        } else {
          resolve({ height: 15 });
        }
      });
      console.log(height, "height");
    });
  },
};

//初始化烟火，烟雾，喷泉
let particlePlotLayer = null;

//添加火焰
export function addFire(geojson, key) {
  var geoFeature = {
    type: "Feature",
    properties: {
      id: key,
      //plotCode: getPlotCode(),
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
  let pindex = getViewer().scene.primitives.length - 1;
  primitives.push({
    index: pindex,
    key: key,
    geoEntity: geoEntity,
  });
}

//添加烟雾
export function addSmoke(geojson, key) {
  var geoFeature = {
    type: "Feature",
    properties: {
      id: key,
      //plotCode: getPlotCode(),
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
  let pindex = getViewer().scene.primitives.length - 1;
  primitives.push({
    index: pindex,
    key: key,
    geoEntity: geoEntity,
  });
}
//添加喷泉
export function addFountain(geojson, key) {
  var geoFeature = {
    type: "Feature",
    properties: {
      id: key,
      //   plotCode: getPlotCode(),
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
  let pindex = getViewer().scene.primitives.length - 1;
  primitives.push({
    index: pindex,
    key: key,
    geoEntity: geoEntity,
  });
}

// 直线箭头开始
const getArrowConfig = () => {
  return {
    tailWidthFactor: 0.1,
    neckWidthFactor: 0.2,
    headWidthFactor: 0.25,
    headAngle: Math.PI / 8.5,
    neckAngle: Math.PI / 13,
  };
};
const getThirdPoint = (t: any, o: any, e: any, r: any, n: any) => {
  var g = getAzimuth(t, o),
    i = n ? g + e : g - e,
    s = r * Math.cos(i),
    a = r * Math.sin(i);
  return [o[0] + s, o[1] + a];
};

const getAzimuth = (t: any, o: any) => {
  var e,
    r = Math.asin(Math.abs(o[1] - t[1]) / distance(t, o));
  return (
    o[1] >= t[1] && o[0] >= t[0]
      ? (e = r + Math.PI)
      : o[1] >= t[1] && o[0] < t[0]
      ? (e = 2 * Math.PI - r)
      : o[1] < t[1] && o[0] < t[0]
      ? (e = r)
      : o[1] < t[1] && o[0] >= t[0] && (e = Math.PI - r),
    e
  );
};

const distance = (t: any, o: any) => {
  return Math.sqrt(Math.pow(t[0] - o[0], 2) + Math.pow(t[1] - o[1], 2));
};
const getBaseLength = (t: any) => {
  return Math.pow(wholeDistance(t), 0.99);
};

const wholeDistance = (t: any) => {
  for (var o = 0, e = 0; e < t.length - 1; e++) o += distance(t[e], t[e + 1]);
  return o;
};

const fineArrow = (tailPoint: any, headerPoint: any) => {
  if (tailPoint.length < 2 || headerPoint.length < 2) return;
  let tailWidthFactor = getArrowConfig().tailWidthFactor;
  let neckWidthFactor = getArrowConfig().neckWidthFactor;
  let headWidthFactor = getArrowConfig().headWidthFactor;
  let headAngle = getArrowConfig().headAngle;
  let neckAngle = getArrowConfig().neckAngle;
  var o = [];
  o[0] = tailPoint;
  o[1] = headerPoint;
  var e = o[0],
    r = o[1],
    n = getBaseLength(o),
    g = n * tailWidthFactor,
    i = n * neckWidthFactor,
    s = n * headWidthFactor,
    a = getThirdPoint(r, e, Math.PI / 2, g, !0),
    l = getThirdPoint(r, e, Math.PI / 2, g, !1),
    u = getThirdPoint(e, r, headAngle, s, !1),
    c = getThirdPoint(e, r, headAngle, s, !0),
    p = getThirdPoint(e, r, neckAngle, i, !1),
    h = getThirdPoint(e, r, neckAngle, i, !0),
    d = [];
  d.push(
    a[0],
    a[1],
    p[0],
    p[1],
    u[0],
    u[1],
    r[0],
    r[1],
    c[0],
    c[1],
    h[0],
    h[1],
    l[0],
    l[1],
    e[0],
    e[1]
  );
  return Cesium.Cartesian3.fromDegreesArray(d);
};

const getArrow = (data: any) => {
  if (data.length < 2) {
    return null;
  }
  var length = data.length;
  var p1 = data[0];
  var p2 = data[length - 1];
  var arrow = [];
  var res = fineArrow([p1[0], p1[1]], [p2[0], p2[1]]);
  for (var i = 0; i < res.length; i++) {
    var cart3 = new Cesium.Cartesian3(res[i].x, res[i].y, res[i].z);
    arrow.push(cart3);
  }
  return arrow;
};

// 直线箭头结束

const getLabelOptions = (item: any) => {
  let {
    text,
    textsize,
    textcolor,
    background,
    outlinewidth,
    outlinecolor,
    isground,
  } = item;
  if (!text) {
    return {};
  }
  return {
    text: text,
    showBackground: true,
    font: "normal " + textsize + "px MicroSoft YaHei",
    backgroundColor: Cesium.Color.fromCssColorString(background),
    backgroundPadding: new Cesium.Cartesian2(15, 10),
    fillColor: Cesium.Color.fromCssColorString(textcolor),
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    scale: 0.5,
    outlineWidth: outlinewidth,
    outlineColor: Cesium.Color.fromCssColorString(outlinecolor),
    show: true,
    pixelOffset: new Cesium.Cartesian2(0, -textsize),
    heightReference: isground
      ? Cesium.HeightReference.CLAMP_TO_GROUND
      : Cesium.HeightReference.NONE,
  };
};

export { getViewer, cesiumHelper };
