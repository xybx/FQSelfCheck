<template>
    <div
        class="tool-bar"
        :class="menuStore.layerIsShow ? '' : 'tool-transform'"
    >
        <el-dialog
            v-model="dialogVisible"
            draggable
            :modal="false"
            :close-on-click-modal="false"
            class="tool-dialog"
            @close="closeDialog"
        >
            <template #header>
                <span class="tool-title">
                    <span class="title-txt">{{ menuStore.currFunc.name }}</span>
                </span>
            </template>
            <div class="tool-main">
                <div class="tool-item">
                    <div class="label">底面高度：</div>
                    <el-input-number
                        v-model="viewStore.currRedLineMinHeight"
                        @change="changeModelHeight"
                        :min="0"
                    />
                    <i
                        class="iconfont icon-jingweidushiqu"
                        :class="focusPick ? 'focus-icon' : ''"
                        @click="handlePick"
                    ></i>
                </div>
                <div class="tool-item">
                    <div class="label">模型经度：</div>
                    <el-input-number
                        v-model="viewStore.modelOrgMatrix.modelx"
                        @change="changeModel"
                        :min="-180"
                        :step="0.0001"
                        :max="180"
                    />
                </div>
                <div class="tool-item">
                    <div class="label">模型纬度：</div>
                    <el-input-number
                        v-model="viewStore.modelOrgMatrix.modely"
                        @change="changeModel"
                        :min="-90"
                        :step="0.0001"
                        :max="90"
                    />
                </div>
                <div class="tool-item">
                    <div class="label">X轴旋转：</div>
                    <el-input-number
                        v-model="viewStore.modelOrgMatrix.modelanglex"
                        @change="changeModel"
                        :min="0"
                        :max="360"
                    />
                </div>
                <div class="tool-item">
                    <div class="label">Y轴旋转：</div>
                    <el-input-number
                        v-model="viewStore.modelOrgMatrix.modelangley"
                        @change="changeModel"
                        :min="0"
                        :max="360"
                    />
                </div>
                <div class="tool-item">
                    <div class="label">Z轴旋转：</div>
                    <el-input-number
                        v-model="viewStore.modelOrgMatrix.modelanglez"
                        @change="changeModel"
                        :min="0"
                        :max="360"
                    />
                </div>
                <div class="tool-item">
                    <div class="label">压平高度：</div>
                    <el-input-number
                        v-model="viewStore.modelOrgMatrix.planeHeight"
                        @change="changeFlatVal"
                    />
                    <!-- <i class="iconfont icon-yaping" @click="handleFlat"></i> -->
                </div>
                <div class="tool-item">
                    <div class="label">场地平整：</div>
                    <el-switch
                        v-model="modelSameFlat"
                        @change="handleSameFlat"
                    />
                </div>
                <div class="tool-item">
                    <el-button type="primary" @click="handleKeep"
                        >保存</el-button
                    >
                    <el-button type="warning" @click="dialogVisible = false"
                        >关闭</el-button
                    >
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
/* 依赖包 */
import { ref, reactive, watch, toRaw, onMounted, onBeforeUnmount } from "vue";
import useStore from "@/stores";
import * as Cesium from "cesium";
import { useRoute } from "vue-router";
import {
    setModelHeight,
    update3dtilesMaxtrix,
    get3DTilesCenterAndMatrix,
} from "@/utils/common-map";
import { calc3DTileBox } from "@/utils/common-tool";
import {
    ElMessage,
    type FormInstance,
    type FormRules,
    ElMessageBox,
} from "element-plus";
import {
    getModuleConfig,
    setModuleConfig,
    getProjectById,
} from "@/utils/common-api";
import { getClippingPlanes } from "@/utils/cesiumExt/baseUtils";

const route = useRoute();
const { menuStore, viewStore, mapStore } = useStore();
let viewer = <any>null;

/* 弹窗状态 */
const dialogVisible = ref(false);

/* 关闭弹窗 */
const closeDialog = () => {
    if (window.viewer.scene.globe.clampingPlanes) {
        window.viewer.scene.globe.clampingPlanes.enabled = false;
    }
    // 菜单恢复初始值
    if (menuStore.currFunc?.code == "mxwz") {
        menuStore.currFunc = null;
    }
};

//调整模型位置，旋转角度

function changeModel() {
    let params = {
        tx: viewStore.modelOrgMatrix.modelx, //模型中心X轴坐标（经度，单位：十进制度）
        ty: viewStore.modelOrgMatrix.modely, //模型中心Y轴坐标（纬度，单位：十进制度）
        // tz: viewStore.modelOrgMatrix.modelz, //模型中心Z轴坐标（高程，单位：米）
        tz: viewStore.currRedLineMinHeight, //模型中心Z轴坐标（高程，单位：米）
        rx: viewStore.modelOrgMatrix.modelanglex, //X轴（经度）方向旋转角度（单：度）
        // rx: viewStore.modelOrgMatrix.modelangle, //X轴（经度）方向旋转角度（单位：度）
        ry: viewStore.modelOrgMatrix.modelangley, //Y轴（纬度）方向旋转角度（单位：度）
        rz: viewStore.modelOrgMatrix.modelanglez, //Z轴（高程）方向旋转角度（单位：度）
    };
    console.log(params, viewStore.modelOrgMatrix);
    update3dtilesMaxtrix(window.modelLayer, params);
}

function changeModelHeight() {
    let params = {
        tx: viewStore.modelOrgMatrix.modelx, //模型中心X轴坐标（经度，单位：十进制度）
        ty: viewStore.modelOrgMatrix.modely, //模型中心Y轴坐标（纬度，单位：十进制度）
        tz: viewStore.currRedLineMinHeight,
        rx: viewStore.modelOrgMatrix.modelanglex, //X轴（经度）方向旋转角度（单：度）
        ry: viewStore.modelOrgMatrix.modelangley, //Y轴（纬度）方向旋转角度（单位：度）
        rz: viewStore.modelOrgMatrix.modelanglez, //Z轴（高程）方向旋转角度（单位：度）
    };
    setModelHeight(window.modelLayer, params);
    // setModelHeight(window.modelLayer, viewStore.modelOrgMatrix.modelz);
}

let clippingPlanes = <any>null;
const changeFlatVal = (num: number) => {
    if (!redJson.value) return ElMessage.warning("项目红线为空，压平无效");
    if (!clippingPlanes) {
        const points = redJson.value.map((point) => {
            const cartographic = Cesium.Cartographic.fromDegrees(
                point[0], // 经度
                point[1], // 纬度
                0 // 高度
            );
            return Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
        });
        clippingPlanes = getClippingPlanes(points.slice(0, points.length - 1));
        flatTerrain(window.modelLayer, clippingPlanes);
    }
    let globe = window.viewer.scene.globe;
    globe._surface._tileProvider._clampingHeight = num;
};

// 项目红线
let redJson = ref<any>();
const getRedPrj = async () => {
    let params = {
        pid: JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
    };
    const { data: res } = await getProjectById(params);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    redJson.value = JSON.parse(res.data.redlinedata).geometry.coordinates[0];
};

const handleFlat = async () => {
    // 模型- window.modellayer
    // 项目红线
    if (!redJson.value) return ElMessage.warning("项目红线为空");
    const points = redJson.value.map((point) => {
        const cartographic = Cesium.Cartographic.fromDegrees(
            point[0], // 经度
            point[1], // 纬度
            0 // 高度
        );
        return Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
    });

    const clippingPlanes = getClippingPlanes(
        points.slice(0, points.length - 1)
    );
    flatTerrain(window.modelLayer, clippingPlanes);
};

// 鼠标拾取
const focusPick = ref(false);
let pickHandler = <any>null;
const handlePick = () => {
    focusPick.value = !focusPick.value;
    let scene = window.viewer.scene;
    if (focusPick.value) {
        pickHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        pickHandler.setInputAction((movement: any) => {
            debugger;
            var cartesian = scene.pickPosition(movement.position);
            if (cartesian) {
                // 获取地形高度
                var cartographic =
                    Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
                var height = cartographic.height;

                // 将笛卡尔坐标转换为地理坐标（经度、纬度）
                var longitude = Cesium.Math.toDegrees(cartographic.longitude);
                var latitude = Cesium.Math.toDegrees(cartographic.latitude);

                console.log(
                    "经度: " +
                        longitude.toFixed(4) +
                        ", 纬度: " +
                        latitude.toFixed(4) +
                        ", 高度: " +
                        height.toFixed(2)
                );
                viewStore.currRedLineMinHeight = Number(height.toFixed(2));
                // setModelHeight(window.modelLayer, Number(height.toFixed(2)));

                let params = {
                    tx: viewStore.modelOrgMatrix.modelx, //模型中心X轴坐标（经度，单位：十进制度）
                    ty: viewStore.modelOrgMatrix.modely, //模型中心Y轴坐标（纬度，单位：十进制度）
                    tz: viewStore.currRedLineMinHeight,
                    rx: viewStore.modelOrgMatrix.modelanglex, //X轴（经度）方向旋转角度（单：度）
                    ry: viewStore.modelOrgMatrix.modelangley, //Y轴（纬度）方向旋转角度（单位：度）
                    rz: viewStore.modelOrgMatrix.modelanglez, //Z轴（高程）方向旋转角度（单位：度）
                };
                setModelHeight(window.modelLayer, params);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    } else {
        pickHandler.destroy();
    }
};

// 保存
const handleKeep = async () => {
    let params = {
        modelX: viewStore.modelOrgMatrix.modelx, //模型中心X轴坐标（经度，单位：十进制度）
        modelY: viewStore.modelOrgMatrix.modely, //模型中心Y轴坐标（纬度，单位：十进制度）
        modelHeight: viewStore.currRedLineMinHeight, //模型中心Z轴坐标（高程，单位：米）
        rotateX: viewStore.modelOrgMatrix.modelanglex, //X轴（经度）方向旋转角度（单：度）
        rotateY: viewStore.modelOrgMatrix.modelangley, //Y轴（纬度）方向旋转角度（单位：度）
        rotateZ: viewStore.modelOrgMatrix.modelanglez, //Z轴（高程）方向旋转角度（单位：度）
        projectCode: JSON.parse(sessionStorage.getItem("23vUser") as string)
            ?.dzbpPassword,
        planeHeight: viewStore.modelOrgMatrix.planeHeight,
    };
    const { data: res } = await setModuleConfig(params, route.query.u);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    ElMessage.success(res.msg);
};

// 压平
const modelSameFlat = ref(false);
const handleSameFlat = (boo: boolean) => {
    if (!redJson.value) return ElMessage.warning("项目红线为空，压平无效");
    if (!clippingPlanes) {
        const points = redJson.value.map((point) => {
            const cartographic = Cesium.Cartographic.fromDegrees(
                point[0], // 经度
                point[1], // 纬度
                0 // 高度
            );
            return Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
        });
        clippingPlanes = getClippingPlanes(points.slice(0, points.length - 1));
        flatTerrain(window.modelLayer, clippingPlanes);
    }
    let globe = window.viewer.scene.globe;
    globe._surface._tileProvider._clampingSameHeight = boo;
};
// 抬升/压平
const flatTerrain = (tileset: any, clippingPlanes: any) => {
    // TODO
    let globe = window.viewer.scene.globe;
    globe.clampingPlanes = new Cesium.ClippingPlaneCollection({
        planes: clippingPlanes,
        edgeWidth: 1.0,
        edgeColor: Cesium.Color.WHITE,
        enabled: true,
    });

    globe._surface._tileProvider._clampingHeight = viewStore.modelOrgMatrix
        .planeHeight
        ? viewStore.modelOrgMatrix.planeHeight
        : 0;
    globe._surface._tileProvider._clampingSameHeight = false;
    globe.clampingPlanes.enabled = true;
};

/* 组件卸载 */
onBeforeUnmount(() => {
    closeDialog();
});

/* 组件加载 */
onMounted(async () => {
    dialogVisible.value = true;
    viewer = window.viewer;
    await get3DTilesCenterAndMatrix(window.modelLayer);
    await getRedPrj();
    changeFlatVal(viewStore.modelOrgMatrix.planeHeight)
});
</script>

<style scoped lang="scss">
@use "./modelinfo.scss";
</style>
