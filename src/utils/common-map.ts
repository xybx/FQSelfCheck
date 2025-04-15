import * as Cesium from "cesium";
import * as turf from "@turf/turf";

import loadGeoJson from "@/utils/cesiumExt/loadGeoJson";
import wkt from "terraformer-wkt-parser";

import useStore from "@/stores";
/*api*/
import {
    getProjectById,
    getQuery,
    GetBoxById,
    getModuleConfig,
} from "./common-api";
import { getPlotCode } from "@/utils/cesiumExt/PlotBaseUtils";
import createCommonEntity from "@/utils/createCommonEntity";

import { ElMessage } from "element-plus";
import {
    getMinHeight,
    getMinHeightToTerrain,
    getMaxHeightToTerrain,
} from "./cesiumExt/baseUtils";
import {
    coordinatesToCartesian3,
    cartesian3ToCoordinates,
} from "@/utils/cesiumExt/coordinate";

/* 取值 pinia */
const { viewStore } = useStore();

/*
    图层加载
    @viewer 视图
    @isShow 显隐
    @kind 类型
        10 -> 天地图
        12 -> ArcGIS动态服务
        16 -> 倾斜摄影
        19 -> 高程模型
        20 -> 项目红线
        99 -> 道路红线
        101 -> 福清天地图
        102 -> 福清新天地图
*/

export const initLayerByKind = async (
    viewer: any,
    data: any,
    isShow: boolean,
    prjid = 0
) => {
    let layer = <any>null;
    switch (data.kind) {
        case 10:
            layer = new Cesium.ImageryLayer(
                new Cesium.WebMapTileServiceImageryProvider({
                    url: data.url + "a6798a0c841004f84487f874a146cba6",
                    layer: data.label,
                    style: "default",
                    format: "tiles",
                    tileMatrixSetID: "c",
                    subdomains: viewStore.subdomains,
                    tilingScheme: new Cesium.GeographicTilingScheme(),
                    tileMatrixLabels: viewStore.tileMatrixLabels,
                    maximumLevel: 18,
                }),
                {
                    show: isShow,
                }
            );
            console.log(layer);
            layer.customAttr = data;
            viewer.imageryLayers.add(layer);
            break;
        case 12:
            layer = new Cesium.ImageryLayer(
                await Cesium.ArcGisMapServerImageryProvider.fromUrl(data.url),
                {
                    show: isShow,
                }
            );
            layer.customAttr = data;
            viewer.imageryLayers.add(layer);
            break;
        case 16:
            layer = await Cesium.Cesium3DTileset.fromUrl(data.url, {
                show: isShow,
            });
            layer.customAttr = data;
            let tileset = viewer.scene.primitives.add(layer);
            //存储三维方案layer到window中
            if (data.pid == 4) {
                window.modelLayer = tileset;
                let baseHeight = await getRedLineMinHeight();
                viewStore.currRedLineMinHeight = Number(baseHeight.toFixed(2));
                get3DTilesCenterAndMatrix(tileset);

                let center = Cesium.Cartographic.fromCartesian(
                    viewStore.renCenter
                );

                // 获取模型保存信息
                let params = {
                    code: JSON.parse(
                        sessionStorage.getItem("23vUser") as string
                    )?.dzbpPassword,
                };
                const { data: res } = await getModuleConfig(params);
                if (res.code !== 200) return ElMessage.warning(res.msg);
                console.log(res, "modelres");
                setModelHeight(tileset, {
                    tx: res.data.modelX
                        ? Number(res.data.modelX)
                        : Cesium.Math.toDegrees(center.longitude),
                    ty: res.data.modelY
                        ? Number(res.data.modelY)
                        : Cesium.Math.toDegrees(center.latitude),
                    tz: res.data.modelHeight
                        ? Number(res.data.modelHeight)
                        : baseHeight,
                    rx: res.data.rotateX ? Number(res.data.rotateX) : 0, //X轴（经度）方向旋转角度（单：度）
                    ry: res.data.rotateY ? Number(res.data.rotateY) : 0, //Y轴（纬度）方向旋转角度（单位：度）
                    rz: res.data.rotateZ ? Number(res.data.rotateZ) : 0, //Z轴（高程）方向旋转角度（单位：度）
                });
            }
            break;
        case 19:
            layer = await Cesium.CesiumTerrainProvider.fromUrl(data.url);
            layer.customAttr = data;
            viewer.terrainProvider = layer;
            break;
        case 99:
            let options = {
                symbol: {
                    color: "rgba(0, 0, 255, 0.8)",
                    geosize: 8,
                },
                viewer: viewer,
            };
            createCommonEntity.init(options);
            layer = await getRoadRedLine(data, prjid, viewer);
            layer.show = isShow;
            //console.log(layer, "99");
            viewer.dataSources.add(layer);
            break;
        case 20:
            break;
        case 100:
            await getBoxList(prjid);
            let geojson = {
                type: "FeatureCollection",
                features: [],
            } as any;
            viewStore.currBoxList.forEach((b) => {
                geojson.features.push(b.geo);
            });

            layer = await loadGeoJson.loadGeoJsonMethod(
                geojson,
                window.viewer,
                isShow
            );
            break;
        // 福清天地图
        case 101:
            layer = new Cesium.ImageryLayer(
                new Cesium.WebMapTileServiceImageryProvider({
                    url: data.url,
                    layer: data.label,
                    style: "default",
                    // format: "image/png",
                    format: "tiles",
                    tileMatrixSetID: "default028mm",
                    tilingScheme: new Cesium.GeographicTilingScheme(),
                }),
                {
                    show: isShow,
                }
            );
            console.log(layer);
            layer.customAttr = data;
            viewer.imageryLayers.add(layer);
            break;
        // 福清新天地图
        case 102:
            layer = new Cesium.ImageryLayer(
                new Cesium.UrlTemplateImageryProvider({
                    url: `${data.url}/tile/{z}/{y}/{x}`,
                    tileHeight: 256,
                    tileWidth: 256,
                    minimumLevel: 1,
                    maximumLevel: 20,
                    tilingScheme: new Cesium.GeographicTilingScheme({
                        ellipsoid: Cesium.Ellipsoid.WGS84
                    })
                }), {
                show: isShow
            })
            layer.customAttr = data
            viewer.imageryLayers.add(layer)
            break;
        default:
            break;
    }
    return layer;
};
/*  query查询传入参数设置如下：
   // let data = <any>{};
        //data.geometry = "{'rings': [[[107.11666700000018,29.166667000000132],[114.50000000000011,29.60000000000008],[114.35000000000014,25.400000000000148],[107.18333300000006,24.966667000000143],[107.11666700000018,29.166667000000132]]]}";
        //data.geometryType = "esriGeometryPolygon";
        //data.spatialRel = "esriSpatialRelIntersects";
        //data.units = "esriSRUnit_Meter";
        //data.outSpatialReference = JSON.stringify(spa);
        //data.where = "1=1";
        //data.returnGeometry = true;
        //data.f = "pjson";
        //data.outFields = "*";
        //const res = await getQuery(d.url, data);
        //console.log(res, "query-result");
 */
//处理道路红线图层（仅显示项目红线周边1km范围内数据）
let roadRedLines = new Cesium.CustomDataSource("roadRedLine");
const getRoadRedLine = async (data: any, prjid: number, viewer: any) => {
    debugger;
    roadRedLines.entities.removeAll();
    let redlineBuffer = await getRedlineBuffer(prjid, viewer);
    if (redlineBuffer) {
        let dataParams = {
            geometry: JSON.stringify({
                rings: redlineBuffer.geometry.coordinates,
            }),
            geometryType: "esriGeometryPolygon",
            spatialRel: "esriSpatialRelIntersects",
            where: "1=1",
            returnGeometry: true,
            f: "pjson",
            outFields: "*",
            units: "esriSRUnit_Meter",
        };
        console.log(data, "data");
        let queryRes = await getQuery(data.url, dataParams);
        console.log(queryRes, "queryRes");
        (createCommonEntity.symbol as any).color = "rgba(0, 0, 255, 0.8)";
        (createCommonEntity.symbol as any).geosize = 3;
        if (queryRes) {
            if (queryRes.data.features.length > 0) {
                queryRes.data.features.forEach(async (f) => {
                    let roadname = f.attributes.FNAME;
                    (createCommonEntity.symbol as any).text = roadname;
                    let paths = f.geometry.paths;
                    paths.forEach(async (p) => {
                        let options = {
                            coordinates: p,
                        };

                        //var line = turf.lineString(p);
                        //var polyline = turf.lineString(redlineBuffer.geometry.coordinates[0]);
                        //var intersection = turf.intersect(line, poly);
                        //var intersects = turf.lineIntersect(line, polyline);
                        //console.log(intersects, "intersects");
                        // if (intersects.features.length > 0) {
                        //     options.coordinates = [];
                        //     if (intersects.features.length == 1) {
                        //         options.coordinates.push(p[0]);
                        //         options.coordinates.push(intersects.features[0].geometry.coordinates);
                        //     }
                        //     else if (intersects.features.length > 1) {
                        //         var point = turf.point(p[0]);
                        //         var polygon = turf.polygon(redlineBuffer.geometry.coordinates);
                        //        // console.log(turf.booleanContains(polyline, point), turf.booleanPointInPolygon(point, polygon));
                        //         // if (turf.booleanPointInPolygon(point, polygon)) {

                        //         //     options.coordinates.push(p[0]);
                        //         // }
                        //         intersects.features.forEach(fea => {
                        //             options.coordinates.push(fea.geometry.coordinates);
                        //         });
                        //     }
                        // }
                        createCommonEntity.setPositions(options);
                        let entityid = Math.random().toString(36).slice(2);
                        //console.log(entityid, "entityid");
                        let entity = await createCommonEntity.createPolyline(
                            entityid
                        );
                        roadRedLines.entities.add(entity);
                    });
                });
            }
        }
    } else {
        console.log("为提取到当前项目的红线数据");
    }
    return roadRedLines;
};

/*
    获取项目红线
    @prjid -> 项目ID
    @type -> 类型：1-红线，2-模型
*/
export const getProjectRedLine = async (prjid: number, type: number) => {
    let redline = <any>null;
    let modelData = <any>null;
    let params = {
        pid: prjid,
    };
    const { data: res } = await getProjectById(params);
    console.log(res, "getProjectRedLine");
    if (res.code !== 200) return ElMessage.warning(res.msg);
    if (res.data != null) {
        if (type === 1) {
            redline = JSON.parse(res.data.redlinedata);
            viewStore.currRedLine = redline;
            console.log(viewStore.currRedLine, "viewStore.currRedLine");
            // debugger;
            return redline;
        } else {
            modelData = {
                url: res.data.modelurl,
                kind: res.data.kind,
            };
            viewStore.currModel = modelData;
            return modelData;
        }
    }
};

//计算红线1km缓冲区
const getRedlineBuffer = async (prjid: number, viewer: any) => {
    //let redlineJson = (await getProjectRedLine(prjid, 1)) as any;
    let redlineJson = viewStore.currRedLine;
    if (redlineJson) {
        let points = redlineJson.geometry.coordinates[0];
        points.push(redlineJson.geometry.coordinates[0][0]);
        //console.log(JSON.stringify(redlineJson.geometry.coordinates), "redlineJson.geometry.coordinates");
        var polygon = turf.polygon([points]);
        var buffered = turf.buffer(polygon, window.redLineBufferRadius, {
            units: "meters",
        });
        console.log(buffered, "buffered");

        (createCommonEntity.symbol as any).color = "rgba(255, 0, 0, 0.3)";
        createCommonEntity.setPositions({
            coordinates: buffered.geometry.coordinates[0],
        });
        let entityid = Math.random().toString(36).slice(2);
        let entity = await createCommonEntity.createPolygon(entityid);
        return buffered;
    }
    return null;
};

/* 初始化地图 */
export const initView = (el: string) => {
    Cesium.Ion.defaultAccessToken = window.cesiumToken;
    let viewer = new Cesium.Viewer("map", {
        animation: false, //是否显示动画控件
        homeButton: false, //是否显示home键
        geocoder: false, //是否显示查找控件
        baseLayerPicker: false, //是否显示图层选择控件
        timeline: false, //是否显示时间线控件
        fullscreenButton: false, //是否全屏显示
        scene3DOnly: false, //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
        infoBox: false, //是否显示点击要素之后显示的信息
        sceneModePicker: false, //是否显示投影方式控件  三维/二维
        navigationInstructionsInitiallyVisible: false,
        navigationHelpButton: false, //是否显示帮助信息控件
        selectionIndicator: false, //是否显示指示器组件
        shouldAnimate: true,
        contextOptions: {
            webgl: {
                alpha: true,
                depth: true,
                stencil: true,
                antialias: true,
                premultipliedAlpha: true,
                // 通过canvas.toDataURL()实现截图需要将该项设置为true
                preserveDrawingBuffer: true,
                failIfMajorPerformanceCaveat: true,
            },
        },
    });
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.imageryLayers.removeAll();
    // 隐藏logo信息
    (viewer.cesiumWidget.creditContainer as HTMLImageElement).style.display =
        "none";
    return viewer;
};

/* 加载项目红线内以及相交详规盒子数据 */
export const getBoxList = async (prjid: any) => {
    //let boxList = [];
    let params = {
        pid: prjid,
    };
    let res = await GetBoxById(params);
    if (res.data.code == 200) {
        let index = 1;
        res.data.data.forEach(async (d) => {
            let geo = wkt.parse(d.geom) as any;
            //console.log(geo, "geo");
            loadGeoJson.setPositions({ coordinates: geo.coordinates[0][0] });
            let geojson = {
                type: "Feature",
                geometry: geo,
                properties: d,
            };
            console.log(geojson, "res-getBoxList");
            let name = "建筑管控" + index;
            let baseHeight = await getMinHeightToTerrain(
                loadGeoJson.positions,
                window.viewer
            );
            let baseTerrHeight = await getMinHeight(loadGeoJson.positions);
            // boxList.push();
            viewStore.currBoxList.push({
                check: false,
                baseHeight: baseHeight ? Number(baseHeight.toFixed(3)) : 0,
                TerrainHeight: baseTerrHeight,
                name: name,
                geo: geojson,
                gid: d.gid,
                height: d.jzgd,
                ydbh: d.ydbh,
                index: index,
                positions: loadGeoJson.positions,
            });
            index++;
        });
        // = boxList;
    }
};

//根据项目红线范围线计算与地形相交的最低点的高度
export const getRedLineMinHeight = async () => {
    debugger;
    let feature = viewStore.currRedLine;
    let positions = [];
    loadGeoJson.setPositions({ coordinates: feature.geometry.coordinates[0] });
    //positions=loadGeoJson.positions;

    //根据项目红线范围计算最小矩形范围
    let rectangleGeo = Cesium.Rectangle.fromCartesianArray(
        loadGeoJson.positions,
        Cesium.Ellipsoid.WGS84
    );

    let xmax = Cesium.Math.toDegrees(rectangleGeo.east);
    let ymax = Cesium.Math.toDegrees(rectangleGeo.north);
    let xmin = Cesium.Math.toDegrees(rectangleGeo.west);
    let ymin = Cesium.Math.toDegrees(rectangleGeo.south);

    var extent = [xmin, ymin, xmax, ymax] as any;
    var cellSide = 10;
    var options = { units: "meters" } as any;

    var grid = turf.pointGrid(extent, cellSide, options);
    let postionArr = <any>[];
    grid.features.forEach((f: any) => {
        let coordinate = f.geometry.coordinates;
        let cartesian3 = coordinatesToCartesian3(coordinate);
        postionArr.push(cartesian3);
    });
    let baseHeight = await getMinHeightToTerrain(postionArr, window.viewer);

    console.log(baseHeight, "baseHeight");
    return baseHeight;
};

//调整模型高度
export const setModelHeight = (tileset: any, params: any) => {
    if (tileset) {
        debugger;
        let center = Cesium.Cartographic.fromCartesian(viewStore.renCenter);
        update3dtilesMaxtrix(tileset, params);
    } else {
        return ElMessage({ type: "warning", message: "未加载有方案模型！" });
    }
};

//获取3dtileset模型的中心点
export async function get3DTilesCenterAndMatrix(
    tileset: Cesium.Cesium3DTileset
) {
    if (tileset) {
        let cartesian3_center = tileset.boundingSphere.center;
        //转经纬度
        let coordinates_center = cartesian3ToCoordinates(cartesian3_center);
        console.log(coordinates_center);

        // 获取模型保存信息
        let params = {
            code: JSON.parse(sessionStorage.getItem("23vUser") as string)
                ?.dzbpPassword,
        };
        const { data: res } = await getModuleConfig(params);
        if (res.code !== 200) return ElMessage.warning(res.msg);
        viewStore.currRedLineMinHeight = res.data.modelHeight
            ? Number(res.data.modelHeight)
            : Number(coordinates_center[2].toFixed(4));
        viewStore.modelOrgMatrix = {
            modelx: res.data.modelX
                ? Number(res.data.modelX)
                : Number(coordinates_center[0].toFixed(4)),
            modely: res.data.modelY
                ? Number(res.data.modelY)
                : Number(coordinates_center[1].toFixed(4)),
            modelz: res.data.modelHeight
                ? Number(res.data.modelHeight)
                : Number(coordinates_center[2].toFixed(4)),
            modelanglex: res.data.rotateX ? Number(res.data.rotateX) : 0,
            modelangley: res.data.rotateY ? Number(res.data.rotateY) : 0,
            modelanglez: res.data.rotateZ ? Number(res.data.rotateZ) : 0,
            planeHeight: res.data.planeHeight
                ? Number(res.data.planeHeight)
                : 0,
            whiteHeight: res.data.whiteHeight
                ? Number(res.data.whiteHeight)
                : 0,
        };
        console.log(viewStore.modelOrgMatrix);
    }
}

//平移，选转模型
// let params = {
//     tx: 120.257, //模型中心X轴坐标（经度，单位：十进制度）
//     ty: 31.226, //模型中心Y轴坐标（纬度，单位：十进制度）
//     tz: 2800, //模型中心Z轴坐标（高程，单位：米）
//     rx: 0, //X轴（经度）方向旋转角度（单位：度）
//     ry: 0, //Y轴（纬度）方向旋转角度（单位：度）
//     rz: -1 //Z轴（高程）方向旋转角度（单位：度）
// };
export async function update3dtilesMaxtrix(tileset, params) {
    //旋转
    console.log(params);
    debugger;
    var mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(params.rx));
    var my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(params.ry));
    var mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(params.rz));
    var rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
    var rotationY = Cesium.Matrix4.fromRotationTranslation(my);
    var rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
    //平移
    var position = Cesium.Cartesian3.fromDegrees(
        params.tx,
        params.ty,
        params.tz
    );
    // var m = tileset.modelMatrix;
    var m = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    //旋转、平移矩阵相乘
    Cesium.Matrix4.multiply(m, rotationX, m);
    Cesium.Matrix4.multiply(m, rotationY, m);
    Cesium.Matrix4.multiply(m, rotationZ, m);
    //赋值给tileset
    tileset._root.transform = m;
    debugger;
}
