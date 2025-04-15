<template>
    <!-- 左上操作栏 -->
    <ul
        class="handle-bar"
        :class="menuStore.layerIsShow ? '' : 'tool-transform'"
    >
        <li
            v-for="item in handleList"
            :key="item.code"
            :class="item.isFocus ? 'navi-isfocus' : ''"
            @click="handleNav(item)"
        >
            <div class="navi-box" v-if="item.code !== 'st'">
                <i class="iconfont" :class="item.icon"></i>
                <span class="handle-label">{{ item.label }}</span>
            </div>
            <div v-else>
                <el-popover
                    placement="bottom"
                    trigger="hover"
                    popper-class="viewport-popper"
                >
                    <template #reference>
                        <div class="navi-box">
                            <i class="iconfont" :class="item.icon"></i>
                            <span class="handle-label">{{ item.label }}</span>
                        </div>
                    </template>
                    <el-button-group>
                        <el-button
                            v-for="item in viewPortList"
                            :key="item.code"
                            @click="handlePortBtn(item)"
                            >{{ item.label }}</el-button
                        >
                    </el-button-group>
                </el-popover>
            </div>
        </li>
    </ul>

    <!-- 行人面板控制 -->
    <el-dialog
        v-model="pedestrianVisible"
        draggable
        :modal="false"
        modal-class="perdestrianout"
        :close-on-click-modal="false"
        class="perdestrian"
        @close="closepedestrian"
    >
        <template #header>
            <span class="tool-title"> 行人 </span>
        </template>
        <div class="tool-main">
            <div class="tool-item">
                <div class="label">高度：</div>
                <el-input-number
                    v-model="perHegith"
                    @change="changeHeight"
                    :min="0"
                    :max="100"
                />
            </div>
            <div class="tool-item">
                <div class="label">方位角：</div>
                <el-input-number
                    v-model="horAngel"
                    @change="changeHorangel"
                    :max="360"
                />
            </div>
            <div class="tool-item">
                <div class="label">俯仰角：</div>
                <el-input-number
                    v-model="verAngel"
                    @change="changeVerangel"
                    :min="-90"
                    :max="90"
                />
            </div>
            <div class="tool-item">
                <div class="label">视野：</div>
                <el-input-number
                    v-model="sightAngel"
                    @change="changeSightAngel"
                    :min="60"
                    :max="179"
                />
            </div>
            <div class="tool-item">
                <el-button type="primary" @click="handleLock">
                    {{ xingrenText }}</el-button
                >
                <!-- </div>
      <div class="tool-item"> -->
                <el-button type="primary" @click="resetFov"> 复原</el-button>
            </div>
        </div>
    </el-dialog>

    <!--模型高度调整 -->
    <el-dialog
        v-model="modelVisible"
        draggable
        :modal="false"
        modal-class="perdestrianout"
        :close-on-click-modal="false"
        class="perdestrian"
        @close="closeModelHeight"
    >
        <template #header>
            <span class="tool-title"> 方案模型 </span>
        </template>
        <div class="tool-main">
            <div class="tool-item">
                <div class="label">模型高度：</div>
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
                    v-model="modelFlatVal"
                    @change="changeFlatVal"
                    :min="0"
                />
                <i class="iconfont icon-yaping" @click="handleFlat"></i>
            </div>
            <div class="tool-item">
                <el-button type="primary" @click="handleKeep">保存</el-button>
                <el-button type="warning" @click="modelVisible = false"
                    >关闭</el-button
                >
            </div>
        </div>
    </el-dialog>
</template>

<script lang="ts" setup>
/* Vue 相关 */
import { ref, toRaw, onMounted } from "vue";
import useStore from "@/stores";
import * as Cesium from "cesium";
import { storeToRefs } from "pinia";
import { ElMessage } from "element-plus";
import {
    setModelHeight,
    update3dtilesMaxtrix,
    get3DTilesCenterAndMatrix,
} from "../../../utils/common-map";
import { calc3DTileBox } from "@/utils/common-tool";
import { cesiumHelper } from "@/utils/cesiumHelper";
import { getModuleConfig, setModuleConfig } from "@/utils/common-api";

const { viewStore, menuStore, mapStore } = useStore();
const { baseInfo } = storeToRefs(mapStore);

// 操作栏列表
const handleList = ref<any>([
    // {
    //     label: "自然光",
    //     icon: "icon-xianshi4",
    //     code: "zrg",
    //     isFocus: true,
    // },
    {
        label: "全图",
        icon: "icon-diqiu",
        code: "qt",
        isFocus: false,
    },
    {
        label: "环绕",
        icon: "icon-xingqiu",
        code: "hr",
        isFocus: false,
    },
    {
        label: "鸟瞰",
        icon: "icon-zhinanzhen",
        code: "fw",
        isFocus: false,
    },
    {
        label: "视图",
        icon: "icon-luxiang",
        code: "st",
        isFocus: false,
    },
    {
        label: "行人",
        icon: "icon-igw-l-gesture",
        code: "xr",
        isFocus: false,
    },
    // {
    //     label: "模型",
    //     icon: "icon-lifangtilitiduomiantifangkuai2",
    //     code: "mx",
    //     isFocus: false,
    // },
    {
        label: "环视",
        icon: "icon-iconfonttubiao_huanraofeihang",
        code: "hs",
        isFocus: false,
    },
]);

const handleNav = (item: any) => {
    if (item.code != "qt") {
        if (window.viewer.scene.mode !== Cesium.SceneMode.SCENE3D) {
            return ElMessage("请切换到三维操作");
        }
    }
    switch (item.code) {
        // 环绕
        case "hr":
            item.isFocus = !item.isFocus;
            handleList.value.forEach((item: any) => {
                if (item.code === "hs") {
                    item.isFocus = false;
                }
            });
            window.cancelAnimationFrame(animationAround);
            if (item.isFocus) {
                spinGlobe(0.5, item.isFocus);
            } else {
                clockwise = true;
                spinGlobe(0.5, item.isFocus);
            }
            break;
        case "fw":
            handleReset();
            break;
        case "qt":
            handleAll();
            break;
        case "st":
            handleViewport();
            break;
        case "xr":
            item.isFocus = !item.isFocus;
            pedestrianVisible.value = item.isFocus;
            fov = window.viewer.camera.frustum.fov;
            // handleLock();
            break;
        case "mx":
            item.isFocus = !item.isFocus;
            modelVisible = item.isFocus;
            get3DTilesCenterAndMatrix(window.modelLayer);
            console.log(viewStore.modelOrgMatrix);

            //modelHegith.value = viewStore.currRedLineMinHeight.toFixed(4);
            //   if (viewStore.modelOrgMatrix) {
            //     debugger;
            //     modelX.value = viewStore.modelOrgMatrix.modelx.toFixed(4);
            //     modelY.value = viewStore.modelOrgMatrix.modely.toFixed(4);
            //     modelAngle.value = viewStore.modelOrgMatrix.modelangle;
            //     modelHegith.value = viewStore.modelOrgMatrix.modelz.toFixed(4);
            //   }

            getModuleData();
            break;
        case "zrg":
            item.isFocus = !item.isFocus;
            handleLight(item.isFocus);
            break;
        case "hs":
            item.isFocus = !item.isFocus;
            handleAround(item.isFocus);
            handleList.value.forEach((item: any) => {
                if (item.code === "hr") {
                    item.isFocus = false;
                }
            });
            clockwise = true;
            spinGlobe(0.5, false);
            break;
        default:
            break;
    }
};

/* 全图 */
const handleAll = () => {
    window.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
            // baseInfo.value.mapInit.longitude,
            // baseInfo.value.mapInit.latitude,
            // Number(baseInfo.value.mapInit.scale)
            window.initViewData.longitude,
            window.initViewData.latitude,
            window.initViewData.shigao
        ),
    });
};

/* 鸟瞰 */
const handleReset = () => {
    let center = window.viewer.camera.pickEllipsoid(
        new Cesium.Cartesian2(
            window.viewer.canvas.clientWidth / 2,
            window.viewer.canvas.clientHeight / 2
        )
    );
    let bdSphere = new Cesium.BoundingSphere(center, 0);
    let hDegre = Cesium.Math.toRadians(210);
    let pDegre = Cesium.Math.toRadians(30);
    window.viewer.camera.flyToBoundingSphere(bdSphere, {
        offset: new Cesium.HeadingPitchRange(
            hDegre,
            pDegre,
            -window.visualAngle.distance
        ),
    });
};

// 获取当前视图的中心位置
const getCenterPosition = () => {
    const viewer = window.viewer;
    // 获取场景的宽度和高度
    var width = viewer.canvas.clientWidth;
    var height = viewer.canvas.clientHeight;

    // 获取屏幕中心点坐标
    var center = new Cesium.Cartesian2(width / 2, height / 2);

    // 将屏幕中心点坐标转换为世界坐标
    var ray = viewer.camera.getPickRay(center);
    var centerPosition = viewer.scene.globe.pick(ray, viewer.scene);

    return centerPosition;
};

// 定点环绕地图
let aroundAnimate = <any>null;
// 环绕顺时针
let clockwise = <any>true;

//环绕
var previousTime: any = null;

let result: any;

//左旋转
function lefeGl() {
    result = window.viewer.camera.pickEllipsoid(
        new Cesium.Cartesian2(
            window.viewer.canvas.clientWidth / 2,
            window.viewer.canvas.clientHeight / 2
        )
    );
    var currentTime = Date.now();
    var delta = (previousTime - currentTime) / 1e3;
    previousTime = currentTime;
    window.viewer.scene.camera.rotate(result, 0.5 * delta);
}

//右旋转
function rightGl() {
    result = window.viewer.camera.pickEllipsoid(
        new Cesium.Cartesian2(
            window.viewer.canvas.clientWidth / 2,
            window.viewer.canvas.clientHeight / 2
        )
    );
    var currentTime = Date.now();
    var delta = (currentTime - previousTime) / 1e3;
    console.log(delta, "delta");

    previousTime = currentTime;
    window.viewer.scene.camera.rotate(result, 0.5 * delta);
}

function spinGlobe(dynamicRate: any, item: any) {
    console.log(item);
    previousTime = Date.now();
    if (item) {
        //默认左旋转
        window.viewer.clock.onTick.addEventListener(lefeGl);

        window.onkeydown = (e: any) => {
            window.viewer.clock.onTick.removeEventListener(lefeGl);
            window.viewer.clock.onTick.removeEventListener(rightGl);

            if (e.keyCode == 39) {
                window.viewer.clock.onTick.addEventListener(lefeGl);
            }
            if (e.keyCode == 37) {
                window.viewer.clock.onTick.addEventListener(rightGl);
            }
        };
    } else {
        //清除事件
        window.onkeydown = null;
        window.viewer.clock.onTick.removeEventListener(lefeGl);
        window.viewer.clock.onTick.removeEventListener(rightGl);
    }
}

/*
    视图切换
*/
const viewPortList = ref<any>([
    { label: "正北", code: 1 },
    { label: "正南", code: 2 },
    { label: "正西", code: 3 },
    { label: "正东", code: 4 },
    { label: "顶视图", code: 5 },
    { label: "仰视图", code: 6 },
]);
const handleViewport = () => {};

let datta = Date.now();

const handlePortBtn = (item: any) => {
    if (window.viewer.scene.mode !== Cesium.SceneMode.SCENE3D) {
        return ElMessage("请切换到三维操作");
    }

    let camera = window.viewer.camera;
    let currentPos = camera.positionCartographic;
    let cartoGraphic: any, destination: any;

    let center = window.viewer.camera.pickEllipsoid(
        new Cesium.Cartesian2(
            window.viewer.canvas.clientWidth / 2,
            window.viewer.canvas.clientHeight / 2
        )
    );

    let bdSphere = new Cesium.BoundingSphere(center, 0);
    let hDegre: any;
    let pDegre = Cesium.Math.toRadians(window.visualAngle.pitch);

    switch (item.code) {
        // 正北
        case 1:
            hDegre = Cesium.Math.toRadians(0);
            window.viewer.camera.flyToBoundingSphere(bdSphere, {
                offset: new Cesium.HeadingPitchRange(
                    hDegre,
                    pDegre,
                    -window.visualAngle.distance
                ),
            });

            break;
        // 正南
        case 2:
            hDegre = Cesium.Math.toRadians(180);
            window.viewer.camera.flyToBoundingSphere(bdSphere, {
                offset: new Cesium.HeadingPitchRange(
                    hDegre,
                    pDegre,
                    -window.visualAngle.distance
                ),
            });

            break;
        // 正西
        case 3:
            hDegre = Cesium.Math.toRadians(270);
            window.viewer.camera.flyToBoundingSphere(bdSphere, {
                offset: new Cesium.HeadingPitchRange(
                    hDegre,
                    pDegre,
                    -window.visualAngle.distance
                ),
            });
            break;
        // 正东
        case 4:
            hDegre = Cesium.Math.toRadians(90);
            window.viewer.camera.flyToBoundingSphere(bdSphere, {
                offset: new Cesium.HeadingPitchRange(
                    hDegre,
                    pDegre,
                    -window.visualAngle.distance
                ),
            });
            break;
        case 5:
            window.viewer.camera.flyToBoundingSphere(bdSphere, {
                offset: new Cesium.HeadingPitchRange(
                    window.viewer.camera.heading,
                    Cesium.Math.toRadians(90),
                    -window.visualAngle.distance
                ),
            });
            break;
        case 6:
            window.viewer.scene.screenSpaceCameraController.enableCollisionDetection =
                false;

            window.viewer.camera.flyToBoundingSphere(bdSphere, {
                offset: new Cesium.HeadingPitchRange(
                    window.viewer.camera.heading,
                    Cesium.Math.toRadians(-90),
                    -window.visualAngle.distance
                ),
            });

            break;

        default:
            break;
    }
};
// 行人面板控制
let perHegith = ref(2);
let horAngel = ref(2);
let verAngel = ref(2);
let sightAngel = ref(60);
/* 行人锁定视角 */
let lockHandler: any = null;

//鼠标移动提示
let moveHandler: any = null;
const moveTips = () => {
    if (!moveHandler) {
        moveHandler = new Cesium.ScreenSpaceEventHandler(
            window.viewer.scene.canvas
        );
        moveHandler.setInputAction((evt: any) => {
            console.log("请左键图上点选行人站立位置");
            window.viewer._element.style.cursor = "default"; //由于鼠标移动时 Cesium会默认将鼠标样式修改为手柄 所以移动时手动设置回来
            let position = window.viewer.scene.pickPosition(evt.endPosition);
            //添加鼠标移动提示文字
            if (tips != null) {
                window.viewer.entities.remove(tips);
            }
            tips = addLabelArea(position, "请左键图上点选行人站立位置");
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
};
let locate = null;
let pedestrianVisible = ref(false);
let xingrenText = ref("行人位置");
const handleLock = () => {
    if (!lockHandler) {
        xingrenText.value = "取消行人";
        //鼠标移动提示
        moveTips();
        lockHandler = new Cesium.ScreenSpaceEventHandler(
            window.viewer.scene.canvas
        );
        lockHandler.setInputAction((evt: any) => {
            console.log(evt);

            if (moveHandler) {
                moveHandler.removeInputAction(
                    Cesium.ScreenSpaceEventType.MOUSE_MOVE
                );
                moveHandler = null;
                if (tips != null) {
                    window.viewer.entities.remove(tips);
                }
            }

            // 方位角
            heading = Number(
                Cesium.Math.toDegrees(window.viewer.camera.heading)
            );
            // 倾斜角
            tilt = Number(Cesium.Math.toDegrees(window.viewer.camera.pitch));

            let cartoGraphic = window.viewer.camera.positionCartographic;
            // 经度
            longitude = Number((cartoGraphic.longitude * 180) / Math.PI);
            // 纬度
            latitude = Number((cartoGraphic.latitude * 180) / Math.PI);

            altitude = cartoGraphic.height;

            let pick = window.viewer.scene.pickPosition(evt.position);
            locate =
                window.viewer.scene.globe.ellipsoid.cartesianToCartographic(
                    pick
                );

            window.viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(
                    (locate.longitude * 180) / Math.PI,
                    (locate.latitude * 180) / Math.PI,
                    locate.height + perHegith.value
                ),
                orientation: {
                    heading: Cesium.Math.toRadians(horAngel.value % 360 || 45),
                    pitch: Cesium.Math.toRadians(verAngel.value || 0),
                    roll: 0,
                },
            });

            window.viewer.scene.screenSpaceCameraController.enableZoom = false;

            window.viewer.scene.screenSpaceCameraController.enableTilt = false;
            window.viewer.scene.screenSpaceCameraController.enableRotate =
                false;
            window.viewer.scene.screenSpaceCameraController.enableTranslate =
                false;
            lockHandler.removeInputAction(
                Cesium.ScreenSpaceEventType.LEFT_CLICK
            );
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        rotor(lockHandler);
    } else {
        // pedestrianVisible.value = false;
        xingrenText.value = "行人位置";
        closepedestrian();
        // lockHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        // lockHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        // lockHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        // lockHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
        // if (moveHandler) {
        //   moveHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        // }
        // if (tips != null) {
        //   window.viewer.entities.remove(tips);
        // }
        // lockHandler = null;
        // moveHandler = null;
        // window.viewer.scene.screenSpaceCameraController.enableZoom = true;
        // window.viewer.scene.screenSpaceCameraController.enableRotate = true;
        // window.viewer.scene.screenSpaceCameraController.enableTranslate = true;
    }
};
function rotor(lockHandler) {
    var viewer = window.viewer;
    var startPos;
    lockHandler.setInputAction(function (event) {
        startPos = new Cesium.Cartesian2(event.position.x, event.position.y);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    lockHandler.setInputAction(function (event) {
        if (!startPos) {
            return;
        }
        var endPos = new Cesium.Cartesian2(
            event.endPosition.x,
            event.endPosition.y
        );
        var move = Cesium.Cartesian2.subtract(
            endPos,
            startPos,
            new Cesium.Cartesian2()
        );
        var x_move = move.x;
        var y_move = move.y;

        viewer.camera.setView({
            destination: viewer.camera.position,
            orientation: {
                heading: viewer.camera.heading + Cesium.Math.toRadians(x_move),
                pitch: viewer.camera.pitch + Cesium.Math.toRadians(-y_move),
            },
        });

        horAngel.value = Math.round(viewer.camera.heading * (180 / Math.PI));
        verAngel.value = Math.round(viewer.camera.pitch * (180 / Math.PI));
        startPos = endPos;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    lockHandler.setInputAction(function (event) {
        startPos = undefined;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
}

function changeHeight(value) {
    window.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
            (locate.longitude * 180) / Math.PI,
            (locate.latitude * 180) / Math.PI,
            locate.height + value
        ),
        orientation: {
            heading: Cesium.Math.toRadians(horAngel.value % 360),
            pitch: Cesium.Math.toRadians(verAngel.value),
            roll: 0,
        },
    });
}
function changeVerangel(value) {
    window.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
            (locate.longitude * 180) / Math.PI,
            (locate.latitude * 180) / Math.PI,
            locate.height + perHegith.value
        ),
        orientation: {
            heading: Cesium.Math.toRadians(horAngel.value % 360),
            pitch: Cesium.Math.toRadians(value),
            roll: 0,
        },
    });
}
function changeSightAngel(value) {
    const hr = Cesium.Math.toRadians(value);
    window.viewer.camera.frustum.fov = hr;
}
function changeHorangel(value) {
    window.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
            (locate.longitude * 180) / Math.PI,
            (locate.latitude * 180) / Math.PI,
            locate.height + +perHegith.value
        ),
        orientation: {
            heading: Cesium.Math.toRadians(value % 360),
            pitch: Cesium.Math.toRadians(verAngel.value),
            roll: 0,
        },
    });
}

function resetFov() {
    console.log(fov);
    window.viewer.camera.frustum.fov = fov;
    sightAngel.value = 60;
}
// 添加文字
let tips: any = null;
const addLabelArea = (point: any, text: any) => {
    const viewer = window.viewer;
    if (tips != null) {
        viewer.entities.remove(tips);
    }
    tips = viewer.entities.add(
        new Cesium.Entity({
            position: point,
            label: {
                text: text,
                font: "12px sans-serif",
                style: Cesium.LabelStyle.FILL,
                fillColor: Cesium.Color.WHITE,
                showBackground: true, //指定标签后面背景的可见性
                backgroundColor: new Cesium.Color(0, 0, 0, 0.8), // 背景颜色
                backgroundPadding: new Cesium.Cartesian2(6, 6), //指定以像素为单位的水平和垂直背景填充
                pixelOffset: new Cesium.Cartesian2(50, 50),
                outlineWidth: 2,
                outlineColor: Cesium.Color.WHITE,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
        })
    );
    return tips;
};

let fov: any = null;
let heading: number = 0;
let tilt: number = 0;
let longitude: number = 0;
let latitude: number = 0;
let altitude: number = 0;
function closepedestrian() {
    if (longitude > 0) {
        let center = Cesium.Cartesian3.fromDegrees(
            longitude,
            latitude,
            altitude
        );
        window.viewer.camera.lookAt(
            center,
            new Cesium.HeadingPitchRange(
                Cesium.Math.toRadians(heading % 360 || 45),
                Cesium.Math.toRadians(tilt || 0),
                altitude
            )
        );
        window.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }

    window.viewer.camera.frustum.fov = fov;
    handleList.value.forEach((item: any) => {
        if (item.code == "xr") {
            item.isFocus = false;
        }
    });

    if (lockHandler) {
        lockHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        lockHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        lockHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        lockHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
        lockHandler = null;
    }

    if (moveHandler) {
        moveHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
    if (tips != null) {
        window.viewer.entities.remove(tips);
    }
    lockHandler = null;
    moveHandler = null;
    window.viewer.scene.screenSpaceCameraController.enableZoom = true;
    window.viewer.scene.screenSpaceCameraController.enableTilt = true;
    window.viewer.scene.screenSpaceCameraController.enableRotate = true;
    window.viewer.scene.screenSpaceCameraController.enableTranslate = true;
    xingrenText.value = "行人位置";
}

//模型高度调整
let modelVisible: boolean = false;
//模型高度
let modelHegith: any = ref(1);
// let modelX: any = ref(0);
// let modelY: any = ref(0);
// let modelAngle: any = ref(0);
function closeModelHeight() {
    modelVisible = false;
    handleList.value.forEach((item: any) => {
        if (item.code === "mx") {
            item.isFocus = false;
        }
    });
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
    };
    const { data: res } = await setModuleConfig(params, route.query.u);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    ElMessage.success(res.msg);
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
                modelHegith.value = Number(height.toFixed(2));
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

// 压平高度调整
const receiveData = ref<any>(null);
const getModuleData = async () => {
    receiveData.value = await calc3DTileBox(window.modelLayer);
    console.log(receiveData.value, "receiveData");
    // debugger;
    var dataSource = Cesium.GeoJsonDataSource.load(receiveData.geometry);
    window.viewer.dataSources.add(dataSource);
};
let modelFlatVal = ref<number>();
const changeFlatVal = (num: number) => {
    console.log(num, "num");
};
const handleFlat = () => {
    let range = receiveData.value.geometry.geometry.coordinates[0];
    // range.pop();
    range.forEach((e: any) => {
        e[2] = modelFlatVal.value;
    });
    console.log(range, "range");
    cesiumHelper.flatOtherTilesets(window.viewer, null, range);
    console.log(window.viewer);

    //     // 地形压平
    //     let polygonPoints = [
    //         Cesium.Cartesian3.fromDegrees(119.3215212293588, 25.479343984382133, 0),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.32137341108017,
    //             25.479500785987362,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.31941010536222,
    //             25.479494578887643,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(119.31859403527864, 25.4794919845316, 0),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.31857769693546,
    //             25.479491935732934,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.31843444133779,
    //             25.479392601800487,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(119.31805788342963, 25.47815581176313, 0),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.31807942317639,
    //             25.478150441816688,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.31807489380932,
    //             25.478133649548056,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.31807117698503,
    //             25.478115606373446,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.31806699186343,
    //             25.478067755551887,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(119.3180745567103, 25.478001247423787, 0),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.31809086594042,
    //             25.477951767787808,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(119.31810797138382, 25.47791803404887, 0),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.31812285793184,
    //             25.477895112758212,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(119.31814648170868, 25.47786580520645, 0),
    //         Cesium.Cartesian3.fromDegrees(119.31817873657992, 25.47783482272404, 0),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.31820763795923,
    //             25.477813058751984,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.31894760697188,
    //             25.477783404059192,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.32107885988809,
    //             25.477791746258315,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(
    //             119.32127439539255,
    //             25.477943754376046,
    //             0
    //         ),
    //         Cesium.Cartesian3.fromDegrees(119.3215212293588, 25.479343984382133, 0),
    //     ];

    //     let uniforms = {};

    //     // 然后在顶点着色器中遍历这些点以检查顶点是否在多边形内
    //     var vertexShaderText = `
    // void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
    //   bool insidePolygon = true;
    //   vec4 currentPointMC = czm_inverseModel * vec4(vsOutput.positionMC, 1.0);

    //   for (int i = 0; i < NUM_POLYGON_POINTS; ++i) {
    //     int nextIndex = (i + 1) % NUM_POLYGON_POINTS;
    //     vec4 pointA = czm_inverseModel * vec4(u_polygonPoints[i], 1.0);
    //     vec4 pointB = czm_inverseModel * vec4(u_polygonPoints[nextIndex], 1.0);
    //   }

    //   if (insidePolygon) {
    //     vsOutput.positionMC.y = u_polygonPoints[0].y; // 设置为任意一个多边形顶点的高度
    //   }
    // }
    // `;

    //     // 更新uniforms
    //     for (var i = 0; i < polygonPoints.length; ++i) {
    //         uniforms[`u_polygonPoint${i}`] = {
    //             type: Cesium.UniformType.VEC3,
    //             value: polygonPoints[i],
    //         };
    //     }

    //     window.viewer.terrain.material.uniforms = uniforms;
    //     window.viewer.terrain.material.vertexShaderText = vertexShaderText;
    //     window.viewer.terrain.material.update();
};

// 自然光
const handleLight = (isFocus: Boolean) => {
    if (isFocus) {
        window.viewer.scene.light = new Cesium.SunLight();
    } else {
        window.viewer.scene.light = new Cesium.DirectionalLight({
            direction: new Cesium.Cartesian3(0.354925, -0.890918, -0.283358),
        });
    }
};

// 环视
let animationAround = <any>null;
const handleAround = (isFocus: boolean) => {
    if (isFocus) {
        flyAround();
    } else {
        window.cancelAnimationFrame(animationAround);
    }
};
const flyAround = () => {
    let camera = window.viewer.camera;
    let currentPos = camera.positionCartographic;
    let cartoGraphic = new Cesium.Cartographic(
        currentPos.longitude,
        currentPos.latitude,
        Math.abs(currentPos.height)
    );
    let destination = Cesium.Cartographic.toCartesian(cartoGraphic);
    let heading = camera.heading;
    let currDegre = Cesium.Math.toDegrees(heading);
    let newHead = currDegre + 0.25;
    camera.setView({
        destination,
        orientation: {
            heading: Cesium.Math.toRadians(newHead),
            pitch: camera.pitch,
            roll: 0,
        },
    });
    animationAround = window.requestAnimationFrame(flyAround);
};
</script>

<style lang="scss" scoped>
@use "./handle.scss";
</style>
<style lang="scss">
$main-color: #2d559f;
.el-overlay-dialog {
    position: absolute !important;
    top: auto !important;
    right: auto !important;
    left: auto !important;
    bottom: auto !important;
    overflow: visible !important;

    .el-dialog__header {
        margin-right: 0;
        padding: 6px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: $main-color;
        color: #fff;
        font-size: 15px;
        letter-spacing: 2px;

        .el-dialog__close {
            color: #fff;
        }

        .el-dialog__headerbtn {
            width: auto;
            height: auto;
            position: unset;
        }

        .tool-title {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .tool-bd {
            display: inline-block;
            width: 4px;
            height: 16px;
            background: $main-color;
            border-radius: 2px;
            margin-right: 10px;
        }
    }

    .el-dialog__body {
        padding: 10px;
    }
}
.perdestrian {
    width: 320px !important;
    padding: 0 !important;
    box-shadow: 0px 0px 7px 0px rgba(76, 138, 207, 0.48);
    border-radius: 4px;
    margin: 0;
    position: absolute;
    top: 200px;
    left: 350px;
    overflow: hidden;

    .tool-item {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border-radius: 4px;
        .label {
            width: auto;
            cursor: default;
        }
        .icon-jingweidushiqu,
        .icon-yaping {
            margin-left: 5px;
            padding: 8px;
            transition: 0.3s;
            color: $main-color;
            border-radius: 4px;
            cursor: pointer;
            // background-color: #eee;
            box-sizing: border-box;
            &:hover {
                background-color: #2d559f;
                color: #fff;
            }
        }
        .focus-icon {
            background-color: #2d559f;
            color: #fff;
        }
        .el-input-number {
            flex: 1;
        }
    }
}
.perdestrianout {
    width: 0;
    height: 0;
}
</style>
