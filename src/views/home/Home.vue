<template>
    <div class="index-container">
        <!-- 图层栏 -->
        <map-layer v-if="showLayer"></map-layer>

        <!-- 操作栏 -->
        <map-handle></map-handle>

        <!-- 动态栏 -->
        <map-active v-if="showActive"></map-active>

        <!-- 自检栏 -->
        <map-check></map-check>

        <!-- 地图 -->
        <div id="map"></div>

        <!-- 底部设计栏   -->
        <!-- <new-design v-if="editFlag"></new-design> -->

        <!-- 菜单栏组件 -->
        <component :is="menuComs[currFunc?.com]"></component>
        <!-- <div class="prjinfoDiv">
      <div>项目名称</div>
      <div>建设单位</div>
    </div> -->
    </div>
</template>
<script lang="ts" setup>
/* 依赖包 */
import { ref, onMounted, markRaw, defineAsyncComponent } from "vue";
import useStore from "@/stores";
import { storeToRefs } from "pinia";
import * as Cesium from "cesium";
import { ElMessage } from "element-plus";
import { encode, decode } from "js-base64";

/* 组件 */
import MapLayer from "@/components/map/layer/Layer.vue";
import MapActive from "@/components/map/active/Active.vue";
import NewDesign from "@/components/map/bottom/newdesign/NewDesign.vue";
import MapHandle from "@/components/map/handle/Handle.vue";
import MapCheck from "@/components/map/check/Check.vue";

/* API */
import { initMapApi } from "./home-api";
import { initLayerByKind, initView } from "@/utils/common-map";
import loadGeoJson from "@/utils/cesiumExt/loadGeoJson";

import { useRoute } from "vue-router";
const route = useRoute();

// 接口
import { getProjectById } from "@/utils/common-api";
import { getProjectRedLine } from "@/utils/common-map";

/* 取值 pinia */
const { menuStore } = useStore();
const { currFunc } = storeToRefs(menuStore);

/* 批量引入组件 */
const menuComs = ref<any>({});
const initModule = () => {
    // @ts-ignore
    const modules = import.meta.glob("../../components/map/header/**/*.vue");
    Object.entries(modules).forEach(([path, asyncCom]) => {
        const name = path.replace(/^.*\/([^/]+)\.vue$/, "$1");
        menuComs.value[name] = markRaw(defineAsyncComponent(asyncCom) as any);
    });
    console.log(menuComs, "menuComs");
};

/* 取值 pinia */
const { viewStore, mapStore } = useStore();
// 解构
const { mapInstance } = storeToRefs(viewStore);
const { baseInfo, baseLayersData } = storeToRefs(mapStore);

/* 显示动态组件 */
const showActive = ref<boolean>(false);
/* 显示图层组件 */
const showLayer = ref(false);

/* 初始化地图 */
let sceneView = <any>null;
const initMap = async () => {
    /*
        maptype:1-二维,2-三维
        prjtype:1-arcgis,2-cesium
    */
    let initParams = {
        maptype: 2,
        prjtype: 2,
    };
    const { data: res } = await initMapApi(initParams);
    // if (res.code !== 200) return ElMessage.warning(res.msg);

    sceneView = initView("map");

    // 地图实例、初始化信息存入 pinia
    baseInfo.value = res.data;
    window.viewer = sceneView;
    console.log("1");

    //   window.viewer.scene.light = new Cesium.SunLight();
    window.viewer.clock.shouldAnimate = false; //时间轴动画停止
    window.viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(
        "2024-01-27T06:00:00Z"
    ); //这个UTC时间对应的北京时间是14时
    // 动态栏显示
    showActive.value = true;

    // 底图渲染
    baselayer(window.layerData, sceneView);

    // 福清天地图渲染
    fqBaseLayer();

    // 地图中心点
    //getProjectScheme();

    // 高程地形
    window.layerData.map(async (item: any) => {
        if (item.isTerrain === 1 && item.visible) {
            const layer = await initLayerByKind(window.viewer, item, true);
            window.addLayers.push({
                layer,
                pid: item.pid,
            });
        }
    });
    // 图层栏显示
    showLayer.value = true;
};

/* 底图数组 */
function baselayer(layerData: [], viewData: any) {
    debugger;
    layerData.map(async (baseItem: any) => {
        console.log(baseItem, "baseitem");

        if (baseItem.visible && baseItem.basemapType) {
            let addLayer = await initLayerByKind(
                viewData,
                baseItem,
                baseItem.visible
            );
            window.addLayers.push({ layer: addLayer, pid: baseItem.pid });

            // 天地图需要加标注
            // 天地图电子地图
            if (baseItem.basemapType === 1 && baseItem.isTiandi === 1) {
                let labelItem = Object.assign({}, baseItem, {
                    pid: `label-${baseItem.pid}`,
                    label: `${baseItem.label}标注`,
                    url: `${baseItem.url.replaceAll("vec", "cva")}`,
                });
                let addLabelLayer = await initLayerByKind(
                    viewData,
                    labelItem,
                    labelItem.visible
                );
                window.addLayers.push({
                    layer: addLabelLayer,
                    pid: labelItem.pid,
                });
            }

            // 天地图影像图
            else if (baseItem.basemapType === 2 && baseItem.isTiandi === 1) {
                let labelItem = Object.assign({}, baseItem, {
                    pid: `label-${baseItem.pid}`,
                    label: `${baseItem.label}标注`,
                    url: `${baseItem.url.replaceAll("img", "cia")}`,
                });
                let addLabelLayer = await initLayerByKind(
                    viewData,
                    labelItem,
                    labelItem.visible
                );
                window.addLayers.push({
                    layer: addLabelLayer,
                    pid: labelItem.pid,
                });
            }
        }
    });
}

// 加载福清天地图
const fqBaseLayer = async () => {
    baselayer(window.fqMapData, window.viewer);
};

let editFlag = ref(false);
onMounted(async () => {
    editFlag = JSON.parse(
        sessionStorage.getItem("23vUser") as string
    )?.editFlag;
    await initMap();
    initModule();
});
</script>

<style lang="scss" scoped>
@use "./home.scss";
</style>
