<template>
    <!-- 图层栏 -->
    <transition name="el-fade-in">
        <div class="layer-bar" v-show="layerVisible">
            <div class="layer-head">
                <span
                    class="iconfont icon-xiangmuliebiao"
                    @click="toggleShowLayer"
                ></span>
                <span>数据资源目录</span>
                <span></span>
            </div>

            <div class="layer-main">
                <el-tree
                    :props="layerProps"
                    show-checkbox
                    :data="layerData"
                    class="layer-tree"
                    :filter-node-method="filterNode"
                    empty-text="暂无数据"
                    ref="layerTree"
                    @check-change="changeLayerNode"
                    :highlight-current="true"
                    :render-after-expand="false"
                    node-key="pid"
                >
                    <template #default="{ node, data }">
                        <span
                            class="custom-tree-node"
                            :class="data.level !== 3 ? 'not-server' : ''"
                        >
                            <span>{{ node.label }}</span>
                            <span
                                class="tree-tools"
                                v-if="data.level === 3 && node.checked"
                            >
                                <el-tooltip
                                    content="缩放至图层"
                                    placement="bottom"
                                    effect="light"
                                >
                                    <i
                                        class="iconfont icon-fullscreen"
                                        @click="handleZoom(node, data)"
                                    ></i>
                                </el-tooltip>

                                <el-popover
                                    placement="right"
                                    trigger="hover"
                                    popper-class="opacity-popper"
                                    :offset="30"
                                >
                                    <template #reference>
                                        <i
                                            class="iconfont icon-kaiqitaiyangguangshezhi"
                                        ></i>
                                    </template>
                                    <el-slider
                                        v-model="data.opacity"
                                        size="small"
                                        @change="handleOpacity(node, data)"
                                    />
                                </el-popover>
                            </span>
                        </span>
                    </template>
                </el-tree>
            </div>
        </div>
    </transition>
    <span
        class="show-tree"
        :class="layerVisible ? '' : 'hide-btn'"
        @click="toggleShowLayer"
    >
        <i
            class="iconfont"
            :class="
                layerVisible ? 'icon-xiangzuojiantou' : 'icon-xiangyoujiantou'
            "
        ></i>
    </span>
</template>

<script lang="ts" setup>
/* 依赖包 */
import { ref, onMounted, watch, nextTick } from "vue";
import useStore from "@/stores";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { ElMessage, ElTree } from "element-plus";
import * as Cesium from "cesium";
import { encode, decode } from "js-base64";
import loadGeoJson from "@/utils/cesiumExt/loadGeoJson";
/* 接口 API */
import { getLayersApi } from "./layer-api";
import {
    initLayerByKind,
    getProjectRedLine,
    get3DTilesCenterAndMatrix,
} from "@/utils/common-map";
import { getGeoProject } from "@/utils/common-tool";
import { getProjectById } from "@/utils/common-api";
import createCommonEntity from "@/utils/createCommonEntity";
import { getPositionFromGeom } from "@/utils/turf-tool";
import {
    cartesian3ToCoordinates,
    coordinatesToCartesian3,
} from "@/utils/cesiumExt/coordinate";
/*绘制图形 */
import drawInit from "@/utils/plugins/MilitaryPlotDraw";

const route = useRoute();

/* pinia数据 */
const { viewStore, mapStore, menuStore } = useStore();

/* 图层栏搜索框 */
const searchVal = ref("");
const layerTree = ref<InstanceType<typeof ElTree>>();

/* 监听搜索框值 */
watch(searchVal, (val) => {
    layerTree.value!.filter(val);
});

/* 图层默认字段 */
const layerProps = {
    children: "children",
    label: "label",
    disabled: "uncheck",
};

/* 图层数据 */
const layerData = ref([]);

/* 切换图层显隐 */
const layerVisible = ref(true);
const toggleShowLayer = () => {
    layerVisible.value = !layerVisible.value;
    menuStore.handleLayerShow(layerVisible.value);
};

/* 获取图层树列表 */
const getLayerData = async () => {
    let params = {
        prjtype: 2,
    };
    layerData.value = window.layerData;

    // 项目红线组装
    const redFeature = await getProjectRedLine(
        JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
        1
    );
    console.log(redFeature, "redfeature");

    debugger;
    let redlineLayerObj = layerData.value.filter((p) => p.pid == 1800)[0];
    redlineLayerObj.opacity = redFeature.properties.attr.opacity * 100;
    redlineLayerObj.feature = redFeature;

    // 三维模型组装
    const modelData = await getProjectRedLine(
        JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
        2
    );

    layerData.value.filter((p) => p.pid == 4)[0].kind = !modelData.kind
        ? 16
        : modelData.kind;
    layerData.value.filter((p) => p.pid == 4)[0].url = modelData.url;

    menuStore.handleTreeRef(layerTree);

    // 设置勾选
    let selKeyData: any = [];
    let redItem: any = null;
    layerData.value.map((item: any) => {
        if (item.visible) {
            selKeyData.push(item.pid);
            // 定位到项目红线
            if (item.isPrjRed) {
                redItem = item;
            }
        }
    });

    console.log(selKeyData, "selKeyData");
    // selKeyData.push(1800);
    layerTree.value.setCheckedKeys(selKeyData);
    if (redItem) {
        adddesignLayer();
    }
};

/* 定位到项目红线 */

/* 图层过滤方法 */
const filterNode = (value: any, data: any, node: any) => {
    if (!value) return true;
    let _array: any = [];
    getReturnNode(node, _array, value);
    let result = false;
    _array.forEach((item: any) => {
        result = result || item;
    });
    return result;
};

/* 返回图层过滤后数据 */
const getReturnNode = (node: any, _array: any, value: any) => {
    let isPass =
        node.data && node.data.label && node.data.label.indexOf(value) !== -1;
    isPass ? _array.push(isPass) : "";
    if (!isPass && node.level != 1 && node.parent) {
        getReturnNode(node.parent, _array, value);
    }
};
//分屏当前叠加的图层
let layer: any;
let layerTop: any;
let layerBot: any;

/* 缩放至图层 */
// let locateRectEntity = <any>null;
const handleZoom = (node: any, data: any) => {
    // 红线图形
    if (data.isPrjRed) {
        window.viewer.flyTo(drawInit.militaryPlotLayer.geoEntity);
    }
    // 二维
    else if (data.maptype == 1) {
        positionLayer(data);
    }
    // 三维
    else {
        let hasLayer = window.addLayers.filter((item: any) => {
            return item.pid == data.pid;
        });
        debugger
        if (hasLayer[0].layer.customAttr.isTiandi == 1) {
            window.viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(
                    Number(window.initViewData.longitude),
                    Number(window.initViewData.latitude),
                    Number(window.initViewData.shigao)
                ),
            });
        } else {
            window.viewer.flyTo(hasLayer[0].layer);
        }
    }
};

/* 二维缩放定位图层 */
let locationRectEntity: any = null;
const positionLayer = (data: any) => {
    if (locationRectEntity) {
        window.viewer.entities.remove(locationRectEntity);
        locationRectEntity = null;
    }

    let range = data.range.split(",");
    let extentArr = [
        {
            geo: {
                x: range[0],
                y: range[1],
            },
            inSR: range[4],
            outSR: 4326,
            type: "esriGeometryPoint",
        },
        {
            geo: {
                x: range[2],
                y: range[3],
            },
            inSR: range[4],
            outSR: 4326,
            type: "esriGeometryPoint",
        },
    ];
    let resArr: any = [];
    extentArr.map(async (item: any) => {
        let { data: result } = await getGeoProject(
            item.inSR,
            item.outSR,
            item.type,
            item.geo
        );
        resArr.push(result.geometries[0].x, result.geometries[0].y);

        if (resArr.length == 4) {
            locationRectEntity = window.viewer.entities.add({
                name: "locationRectangle",
                id: "locationRectangle",
                rectangle: {
                    coordinates: Cesium.Rectangle.fromDegrees(
                        Math.min(resArr[0], resArr[2]), // 西边界
                        Math.min(resArr[1], resArr[3]), // 南边界
                        Math.max(resArr[0], resArr[2]), // 东边界
                        Math.max(resArr[1], resArr[3]) // 北边界
                    ),
                    material: Cesium.Color.GREEN.withAlpha(0),
                    height: 1.0,
                    outline: false,
                },
            });
            window.viewer.flyTo(locationRectEntity);
        }
    });
};

// 定位中心点
async function adddesignLayer() {
    let { data } = await getProjectById({
        pid: JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
    });
    window.unit = data.data.constructionname;
    window.projectname = data.data.prjname;
    if (data.data.viewpointX) {
        window.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                Number(data.data.viewpointX),
                Number(data.data.viewpointY),
                Number(data.data.viewpointZ)
            ),
            orientation: {
                heading: Cesium.Math.toRadians(Number(data.data.azimuth)),
                pitch: Cesium.Math.toRadians(Number(data.data.pitchangle)),
                // roll : 0.0
            },
        });
    } else {
        var pyPositions = window.redlineEntity.polygon.hierarchy.getValue(
            Cesium.JulianDate.now()
        ).positions;
        //   //中心点
        var pCenter = Cesium.BoundingSphere.fromPoints(pyPositions).center;
        let polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(pCenter);
        let new_center = new Cesium.Cartesian3(
            polyCenter.x,
            polyCenter.y,
            polyCenter.z - 1500
        );
        let coordinate = cartesian3ToCoordinates(new_center);
        window.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                Number(coordinate[0]),
                Number(coordinate[1]),
                Number(window.initViewData.height)
            ),
            orientation: {
                heading: Cesium.Math.toRadians(
                    Number(window.initViewData.heading)
                ),
                pitch: Cesium.Math.toRadians(Number(window.initViewData.pitch)),
            },
        });
    }
}

/* 图层点击事件 */
const changeLayerNode = async (data: any, isClick: boolean) => {
    debugger;
    if (data.level !== 3) return false;
    console.log(data, "data");

    // 项目红线处理
    if (data.isPrjRed) {
        if (isClick) {
            debugger;
            let symbol = data.feature.properties.attr;
            drawInit.deactivate();
            drawInit.init(window.viewer);
            drawInit.clear();
            drawInit.militaryPlotLayer.addPlot(data.feature, symbol);
            window.redlineEntity = drawInit.militaryPlotLayer.geoEntity;

            console.log(window.redlineEntity, "项目红线");
            // 红线中心点
            var hierarchy = window.redlineEntity.polygon.hierarchy.getValue(
                Cesium.JulianDate.now()
            );
            var positions = hierarchy.positions; // 直接从hierarchy中获取positions数组 // 计算多边形质心（中心点）

            var centerOfMass;
            if (positions) {
                var sum = new Cesium.Cartesian3();
                var length = positions.length;
                for (var i = 0; i < length; ++i) {
                    Cesium.Cartesian3.add(positions[i], sum, sum);
                }
                centerOfMass = Cesium.Cartesian3.divideByScalar(
                    sum,
                    length,
                    new Cesium.Cartesian3()
                );
            }

            // 或者使用BoundingSphere来计算一个包围球的中心作为近似的几何中心
            var boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
            var centerApproximation = boundingSphere.center;
            debugger
            viewStore.renCenter = centerApproximation;
        } else {
            drawInit.clear();
            window.viewer.entities.remove(drawInit.militaryPlotLayer.geoEntity);
        }
    } else {
        // 判断地址是否为空
        if (data.url == "" || !Boolean(data.url))
            return ElMessage.warning(
                "上传模型后请等待三维服务自动发布，请30分钟后叠加模型！"
            );
        // 是否第一次加载
        let hasLayer = window.addLayers.filter((item: any) => {
            return item.pid == data.pid;
        });

        console.log(hasLayer, "haslayer");
        debugger

        if (hasLayer.length <= 0) {
            let prjid = JSON.parse(
                sessionStorage.getItem("23vUser") as string
            )?.projectId;
            const layer = await initLayerByKind(
                window.viewer,
                data,
                true,
                prjid
            );
            window.addLayers.push({
                layer,
                pid: data.pid,
            });

            // if (data.pid == 4) {
            //     debugger;
            //     get3DTilesCenterAndMatrix(layer);
            // }
        } else {
            if (data.kind == 100) {
                let entities = hasLayer[0].layer.entities.values;
                for (let i = 0; i < entities.length; i++) {
                    let entity = entities[i];
                    entity.show = isClick;
                }
            } else {
                hasLayer[0].layer.show = isClick;
                if (data.pid == 4) {
                    get3DTilesCenterAndMatrix(hasLayer[0].layer);
                }
            }
        }

        // 天地图处理
        if (data.isTiandi === 1) {
            handleTiandi(data, isClick);
        }
        // 地形处理
        if (data.isTerrain === 1) {
            handleTerrain(data, isClick);
        }
    }
};

// 项目红线渲染：与顶部用地红线保持一致
const getPrjRed = async () => {
    let params = {
        pid: JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
    };
    const { data: res } = await getProjectById(params);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    if (res.data != null) {
        let geoJson = JSON.parse(res.data.redlinedata);
        return geoJson.symbol;
    }
};

// 天地图处理
const handleTiandi = async (data: any, isClick: boolean) => {
    // 选中
    if (isClick) {
        let hasLayer = window.addLayers.filter((item: any) => {
            return item.pid == `label-${data.pid}`;
        });
        if (hasLayer.length > 0) {
            hasLayer[0].layer.show = isClick;
        } else {
            if (data.basemapType === 1) {
                debugger;
                let labelItem = Object.assign({}, data, {
                    pid: `label-${data.pid}`,
                    label: `${data.label}标注`,
                    url: `${data.url.replaceAll("vec", "cva")}`,
                });
                let addLabelLayer = await initLayerByKind(
                    window.viewer,
                    labelItem,
                    isClick
                );
                window.addLayers.push({
                    layer: addLabelLayer,
                    pid: labelItem.pid,
                });

                // 福清天地图在顶部
                let fqTdLayer = window.addLayers.filter((item: any) => {
                    return item.layer.customAttr.label.includes("福清天地电子");
                });
                if (fqTdLayer.length > 0) {
                    fqTdLayer.map((item) => {
                        window.viewer.imageryLayers.raiseToTop(item.layer);
                    });
                } else {
                    window.fqMapData.forEach(async (fqBaseLayer) => {
                        if (fqBaseLayer.basemapType == 1) {
                            let addfqLabelLayer = await initLayerByKind(
                                window.viewer,
                                fqBaseLayer,
                                isClick
                            );
                            window.addLayers.push({
                                layer: addfqLabelLayer,
                                pid: fqBaseLayer.pid,
                            });
                            window.viewer.imageryLayers.raiseToTop(
                                addfqLabelLayer
                            );
                        }
                    });
                }
            } else {
                let labelItem = Object.assign({}, data, {
                    pid: `label-${data.pid}`,
                    label: `${data.label}标注`,
                    url: `${data.url.replaceAll("img", "cia")}`,
                });
                let addLabelLayer = await initLayerByKind(
                    window.viewer,
                    labelItem,
                    isClick
                );
                window.addLayers.push({
                    layer: addLabelLayer,
                    pid: labelItem.pid,
                });

                // 福清天地图在顶部
                let fqTdLayer = window.addLayers.filter((item: any) => {
                    return item.layer.customAttr.label.includes(
                        "福清天地影像图"
                    );
                });
                if (fqTdLayer.length > 0) {
                    fqTdLayer.map((item) => {
                        window.viewer.imageryLayers.raiseToTop(item.layer);
                    });
                } else {
                    window.fqMapData.forEach(async (fqBaseLayer) => {
                        if (fqBaseLayer.basemapType == 2) {
                            let addfqLabelLayer = await initLayerByKind(
                                window.viewer,
                                fqBaseLayer,
                                isClick
                            );
                            window.addLayers.push({
                                layer: addfqLabelLayer,
                                pid: fqBaseLayer.pid,
                            });
                            window.viewer.imageryLayers.raiseToTop(
                                addfqLabelLayer
                            );
                        }
                    });
                }
            }
        }
    }
    // 取消
    else {
        let hasLayer = window.addLayers.filter((item: any) => {
            return item.pid == `label-${data.pid}`;
        });
        if (hasLayer.length <= 0) return;
        hasLayer[0].layer.show = isClick;
    }
    if (data.basemapType == 1) {
        let fqTdLayer = window.addLayers.filter((item: any) => {
            return item.layer.customAttr.label.includes("福清天地电子");
        });
        fqTdLayer.map((item) => {
            item.layer.show = isClick;
        });
    } else {
        let fqTdLayer = window.addLayers.filter((item: any) => {
            return item.layer.customAttr.label.includes("福清天地影像图");
        });
        fqTdLayer.map((item) => {
            item.layer.show = isClick;
        });
    }
};

// 地形处理
const handleTerrain = async (data: any, isClick: boolean) => {
    // 是否第一次加载
    let hasLayer = window.addLayers.filter((item: any) => {
        return item.pid == data.pid;
    });

    if (isClick) {
        if (hasLayer.length > 0)
            return (window.viewer.terrainProvider = hasLayer[0].layer);
        const layer = await initLayerByKind(window.viewer, data, true);
        window.addLayers.push({
            layer,
            pid: data.pid,
        });
    } else {
        window.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
    }
};

/* 图层滚动条拖动 */
const handleOpacity = (node: any, data: any) => {
    // 项目红线图形
    if (data.kind == 20) {
        // 面颜色
        drawInit.militaryPlotLayer.geoEntity.polygon.material =
            Cesium.Color.fromCssColorString(
                data.feature.properties.attr.color
            ).withAlpha(data.opacity / 100);
        // 轮廓颜色
        drawInit.militaryPlotLayer.geoEntity.polyline.material =
            Cesium.Color.fromCssColorString(
                data.feature.properties.attr.outlinecolor
            ).withAlpha(data.opacity / 100);
    }
    // 图层
    else {
        let hasLayer = window.addLayers.filter((item: any) => {
            return item.pid == data.pid;
        });
        // 倾斜摄影
        if (data.kind == 16) {
            hasLayer[0].layer.style = new Cesium.Cesium3DTileStyle({
                color: `color('rgba(255,255,255,${data.opacity / 100})')`,
            });
        }
        // geojson
        else if (data.kind == 14 || data.kind == 99 || data.kind == 100) {
            let entities = hasLayer[0].layer.entities.values;
            for (let i = 0; i < entities.length; i++) {
                let entity = entities[i];
                if (entity.polygon) {
                    entity.polygon.material =
                        entity.polygon.material.color._value.withAlpha(
                            data.opacity / 100
                        );
                }
                if (entity.polyline) {
                    entity.polyline.material =
                        entity.polyline.material.color._value.withAlpha(
                            data.opacity / 100
                        );
                }
                if (entity.label) {
                    entity.label.fillColor =
                        entity.label.fillColor._value.withAlpha(
                            data.opacity / 100
                        );
                    entity.label.backgroundColor =
                        entity.label.backgroundColor._value.withAlpha(
                            data.opacity / 100
                        );
                }
            }
        }
        // 其他
        else {
            hasLayer[0].layer.alpha = data.opacity / 100;
        }
    }
};

onMounted(() => {
    getLayerData();
    //初始加载geojson的类
    loadGeoJson.init({ viewer: window.viewer, symbol: {} });
});
</script>

<style lang="scss" scoped>
@use "./layer.scss";
</style>
