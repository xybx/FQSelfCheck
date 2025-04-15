<template>
  <div class="active-bar">
    <div class="state-box">
      <span style="float: left">
        <i class="state-label">项目名称：</i>
        <span style="font-weight:bold;">{{ projectname }}</span>
      </span>
      <span style="float: left">
        <i class="state-label">建设单位：</i>
        <span style="font-weight:bold;">{{ unit }}</span>
      </span>
      <span>
        <i class="state-label">经度：</i>
        <span>{{ longitude }}</span>
      </span>
      <span>
        <i class="state-label">纬度：</i>
        <span>{{ latitude }}</span>
      </span>
      <span>
        <i class="state-label">视图：</i>
        <span>{{ dimension }}</span>
      </span>
      <span>
        <i class="state-label">海拔：</i>
        <span>{{ altitude }}米</span>
      </span>
      <span>
        <i class="state-label">方位角：</i>
        <span>{{ heading }}°</span>
      </span>
      <span>
        <i class="state-label">倾斜角：</i>
        <span>{{ tilt }}°</span>
      </span>
      <span>
        <i class="state-label">视点高：</i>
        <span>{{ viewHeight }}米</span>
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
/* Vue 相关 */
import { ref, toRaw, onMounted, watch, computed } from "vue";
import useStore from "@/stores";
import { storeToRefs } from "pinia";

import * as Cesium from "cesium";

import { getProjectById } from "@/utils/common-api";

const { viewStore } = useStore();
const { mapInstance } = storeToRefs(viewStore);

//项目名称
const projectname = ref<string>("");
//建设单位
const unit = ref<string>("");

// 初始化地图
// 视点高
const viewHeight = ref<number>();
// 纬度
const latitude = ref<number>();
// 经度
const longitude = ref<number>();
// 方位角
const heading = ref<number>();
// 俯仰角
const tilt = ref<number>();
// 海拔
const altitude = ref<number>();
// 维度
const dimension = computed(() => {
  return window.viewer.scene.mode == 3 ? "三维" : "二维";
});

/* 监听三维视图变化 */
const setWatchView = () => {
  let sceneView = window.viewer;
  sceneView.camera.changed.addEventListener(() => {
    setTimeout(() => {
      getActiveVal();
    }, 1500);
  });

  // 鼠标移动监听
  let handler = new Cesium.ScreenSpaceEventHandler(sceneView.scene.canvas);
  handler.setInputAction(function () {
    getActiveVal();
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  // 滚轮监听
  let handlerWheel = new Cesium.ScreenSpaceEventHandler(sceneView.scene.canvas);

  handlerWheel.setInputAction(function () {
    getActiveVal();
  }, Cesium.ScreenSpaceEventType.WHEEL);
};

/* 动态栏赋值 */
const getActiveVal = () => {
  let sceneView = window.viewer;
  let cartoGraphic = sceneView.camera.positionCartographic;
  // 经度
  longitude.value = Number(
    ((cartoGraphic.longitude * 180) / Math.PI).toFixed(2)
  );
  // 纬度
  latitude.value = Number(((cartoGraphic.latitude * 180) / Math.PI).toFixed(2));
  // 视高
  viewHeight.value = Number(cartoGraphic.height.toFixed(1));

  // 方位角
  heading.value = Number(
    Cesium.Math.toDegrees(sceneView.camera.heading).toFixed(1)
  );
  // 倾斜角
  tilt.value = Number(Cesium.Math.toDegrees(sceneView.camera.pitch).toFixed(1));
};

setInterval(() => {
  let sceneView = window.viewer;
  let cartoGraphic = sceneView.camera.positionCartographic;
  // 海拔
  altitude.value =
    sceneView.scene.globe.getHeight(cartoGraphic) > 0
      ? sceneView.scene.globe.getHeight(cartoGraphic).toFixed(1)
      : 0;
}, 1500);

// 默认加载项目服务
async function getPrjInfo() {
  let { data } = await getProjectById({
    pid: JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
  });
  projectname.value = data.data.prjname;
  unit.value = data.data.constructionname;
}

onMounted(() => {
  setWatchView();
   getPrjInfo();
});
</script>

<style lang="scss" scoped>
@use "./active.scss";
</style>
