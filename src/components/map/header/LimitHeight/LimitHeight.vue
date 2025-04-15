<template>
  <div class="tool-bar" :class="menuStore.layerIsShow ? '' : 'tool-transform'">
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
          <el-switch
            v-model="switchValue"
            inline-prompt
            active-text="可见"
            inactive-text="隐藏"
            class="menu-switch"
          />
        </span>
      </template>
      <div class="tool-main">
        <div class="build-form">
          <div>
            <span class="build-label">基地高度</span>
            <el-input-number v-model="baseValue" :min="0" @change="changeHeight" />
            <span class="build-unit">米</span>
          </div>
        </div>
        <div class="build-form">
          <div>
            <span class="build-label">限制高度</span>
            <el-input-number v-model="wideValue" :min="0" @change="changeHeight" />
            <span class="build-unit">米</span>
          </div>
        </div>

        <div>
          <el-button type="primary" @click="handleRender">开始分析</el-button>
          <el-button type="warning" @click="clearRender">清除</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/* Vue 相关 */
import { ref, reactive, watch, toRaw, onMounted, onBeforeUnmount } from "vue";
import useStore from "@/stores";
import { ElMessage } from "element-plus";
import * as Cesium from "cesium";
import drawInit from "@/utils/plugins/MilitaryPlotDraw";
// import cesiumInit_height from './plugins/highlimit';
import cesiumInit_height from "./plugins/highlimit";
import { getProjectById } from "@/utils/common-api";
import { encode, decode } from "js-base64";
import { useRoute } from "vue-router";
const route = useRoute();
const { menuStore, viewStore, mapStore } = useStore();

/* 弹窗状态 */
const dialogVisible = ref(false);
const switchValue = ref(false);

/* 关闭弹窗 */
const closeDialog = () => {
  if (menuStore.currFunc.code == "kgfx") {
    // menuStore.currFunc = null;
    menuStore.handleFunc("");
  }
  clearRender();
  drawInit.clear();
};
//高度
const baseValue = ref(10);
const wideValue = ref(50);
/* 初始化绘制工具 */
let geoJson = ref(null);
let redlineGeo = null;
const initTool = () => {
  drawInit.init(window.viewer);
  drawInit.plotDraw.PlotDrawEndEvent.addEventListener(async (drawPlot, type) => {
    drawPlot.remove(); //移除绘制的对象
    //console.log(drawPlot.toGeoJson(), "this.militaryPlotLayer");
    drawInit.militaryPlotLayer.addPlot(drawPlot.toGeoJson(), drawInit.plotTypeObject); //将标绘对象添加到图层中进行管理
    //转geojson
    geoJson = drawPlot.toGeoJson();

    redlineGeo = drawInit.militaryPlotLayer.geoEntity;
    console.log(geoJson, "geoJson");
  });
};
//控高初始化
let positions = null;
const init = async () => {
  positions = [];
  let params = {
    pid: JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
  };
  let { data: res } = await getProjectById(params);
  if (res.code !== 200) return ElMessage.warning(res.msg);
  if (res.data != null) {
    geoJson = JSON.parse(res.data.redlinedata);
    let symbol = geoJson.properties.attr;
    //叠加到地图上
    drawInit.militaryPlotLayer.addPlot(geoJson, symbol);
    redlineGeo = drawInit.militaryPlotLayer.geoEntity;

    geoJson.geometry.coordinates[0].forEach((element) => {
      let position = coordinatesToCartesian3(element);
      positions.push(position);
    });
  }
};
//经纬度坐标转为笛卡尔（三维）
function coordinatesToCartesian3(coordinate) {
  let position = Cesium.Cartesian3.fromDegrees(
    coordinate[0],
    coordinate[1],
    coordinate[2]
  );
  return position;
}
/* 绘制范围 */

const handleRender = async () => {
  cesiumInit_height.init(window.viewer, positions, baseValue.value, wideValue.value);
};

/* 调整限高高度 */
const changeHeight = () => {
  cesiumInit_height.update(wideValue.value, baseValue.value);
};

/* 清除范围 */
const clearRender = () => {
  wideValue.value = 10;
  cesiumInit_height.clearDraw();
};

/* 组件加载 */
onMounted(() => {
  dialogVisible.value = true;
  initTool();
  init();
});
/* 组件卸载 */
onBeforeUnmount(() => {
  closeDialog();
});
</script>

<style scoped lang="scss">
@use "./limitheight.scss";
</style>
