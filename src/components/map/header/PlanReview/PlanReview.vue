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
        <div v-for="item in boxList">
          <el-checkbox
            v-model="item.check"
            :label="item.name"
            size="large"
            style="margin-right: 20px"
            @change="oncheck(item)"
          />
          <div style="display: inline; color: #999898">
            基地高度&nbsp;<el-input-number
              v-model="item.baseHeight"
              :min="0"
              :max="99999"
              style="width: 130px"
              @change="changeHeight(item)"
            />&nbsp;米
          </div>
        </div>
      </div>

      <template #footer>
        <el-checkbox
          :indeterminate="isIndeterminate"
          v-model="checkall"
          label="全选"
          size="large"
          style="float: left; font-weight: bold"
          @change="onCheckAll"
        />
        <!-- <span class="dialog-footer"> -->
        <el-button type="primary" @click="startSC">审查</el-button>
        <el-button type="warning" @click="clearRender">清除</el-button>
        <!-- </span> -->
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/* Vue 相关 */
import { ref, reactive, watch, toRaw, onMounted, onBeforeUnmount } from "vue";
import useStore from "@/stores";
import * as Cesium from "cesium";
import { encode, decode } from "js-base64";
import { useRoute } from "vue-router";
/* Api */
import { GetBoxById } from "@/utils/common-api";
import { getBoxList } from "@/utils/common-map";

import { ElMessage } from "element-plus";
import cesiumInit_height from "../LimitHeight/plugins/highlimit";
import loadGeoJson from "@/utils/cesiumExt/loadGeoJson";
const { menuStore, viewStore, mapStore } = useStore();
const route = useRoute();
/* 弹窗状态 */
const dialogVisible = ref(false);
const switchValue = ref(false);

/* 关闭弹窗 */
const closeDialog = () => {
  if (menuStore.currFunc.code == "xgsc") {
    // menuStore.currFunc = null;
    menuStore.handleFunc("");
  }
  clearRender();
  if (geojsonLayer) {
    window.viewer.dataSources.remove(geojsonLayer);
  }
};

/* 组件加载 */
onMounted(async () => {
  isSC.value = false;
  if (!viewStore.currBoxList.length > 0) {
    let prjid = JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId;
    await getBoxList(prjid);
    boxList.value = viewStore.currBoxList;
  } else {
    boxList.value = viewStore.currBoxList;
  }
  dialogVisible.value = true;
});

/* 全选 */
let checkall = ref(false);
/* 全选不确定状态 */
const isIndeterminate = ref(false);
/* 详规盒子列表 */
let boxList = ref<any>([
  // {
  //   check: false,
  //   baseHeight: 20,
  //   name: "建筑管控1",
  // },
  // {
  //   check: false,
  //   baseHeight: 20,
  //   name: "建筑管控2",
  // },
  // {
  //   check: false,
  //   baseHeight: 20,
  //   name: "建筑管控3",
  // },
]);
let geojsonLayer: any = null;
//单选
const oncheck = async (item: any) => {
  //console.log(item, "oncheck");
  let checkLength = boxList.value.filter((p) => p.check == true).length;
  if (checkLength == boxList.value.length) {
    checkall.value = true;
    isIndeterminate.value = false;
  } else {
    if (checkLength > 0) {
      isIndeterminate.value = true;
    } else {
      isIndeterminate.value = false;
    }
    checkall.value = false;
  }
  let geojson = {
    type: "FeatureCollection",
    features: [],
  } as any;
  geojson.features.push(item.geo);
  if (geojsonLayer) {
    let entities = geojsonLayer.entities.values;
    for (let i = 0; i < entities.length; i++) {
      let entity = entities[i];
      entity.show = item.check;
    }
    if (item.check) {
      window.viewer.flyTo(geojsonLayer);
    }
  } else {
    geojsonLayer = await loadGeoJson.loadGeoJsonMethod(
      geojson,
      window.viewer,
      item.check
    );

    if (item.check) {
      window.viewer.flyTo(geojsonLayer);
    }
  }
};

//全选
const onCheckAll = async (value: boolean) => {
  if (boxList.value.length > 0) {
    boxList.value.forEach((i) => {
      i.check = value;
    });

    let geojson = {
      type: "FeatureCollection",
      features: [],
    } as any;
    viewStore.currBoxList.forEach((b) => {
      geojson.features.push(b.geo);
    });
    if (geojsonLayer) {
      let entities = geojsonLayer.entities.values;
      for (let i = 0; i < entities.length; i++) {
        let entity = entities[i];
        entity.show = value;
      }
      if (value) {
        window.viewer.flyTo(geojsonLayer);
      }
    } else {
      geojsonLayer = await loadGeoJson.loadGeoJsonMethod(geojson, window.viewer, value);
      if (value) {
        window.viewer.flyTo(geojsonLayer);
      }
    }
  }
};

//审查
let isSC = ref(false);
let featureAll = ref([]);
const startSC = async () => {
  let checkBoxList = boxList.value.filter((p) => p.check == true);
  if (checkBoxList.length == 0) {
    isSC.value = false;
    return ElMessage.warning("请选择审查的建筑管控");
  } else {
    clearResult();
    //cesiumInit_height.clearDraw();
    isSC.value = true;
    window.viewer.dataSources.remove(geojsonLayer);
    let layerdata = window.addLayers.filter((item: any) => {
      return item.pid == 4;
    });
    //let layer = layerdata[0].layer;
    let layer = await Cesium.Cesium3DTileset.fromUrl(layerdata[0].layer.resource.url, {
      show: true,
    });

    //console.log(layerdata,"layerdata");
    //window.viewer.flyTo(hasLayer[0].layer);
    let tileset = window.viewer.scene.primitives.add(layer);
    tileset.allTilesLoaded.addEventListener(() => {
      tileset.style = new Cesium.Cesium3DTileStyle({
        color: {
          evaluateColor: (feature: any) => {
            featureAll.value.push(feature);
            feature.color = Cesium.Color.RED.withAlpha(0.7);
            return feature.color;
          },
        },
      });
    });

    checkBoxList.forEach((b) => {
      console.log(b.TerrainHeight, "b.TerrainHeight,");
      cesiumInit_height.init(
        window.viewer,
        b.positions,
        b.baseHeight,
        b.height,
        "rgba(255, 0, 0, 0)"
      );
      //changeModelMatrix(layer, b);
    });
    //tileset.
  }
};

const changeModelMatrix = (layer: any, b: any) => {
  if (!cesiumInit_height.limitHeightPrimitive) return;

  // let cartographic = Cesium.Cartographic.fromCartesian(
  //   cesiumInit_height.limitHeightPrimitive._primitive._boundingSpheres[0].center
  // ); //弧度  Number(this.baseValue) +
  // let surface = Cesium.Cartesian3.fromRadians(
  //   cartographic.longitude,
  //   cartographic.latitude,
  //   Number(this.baseValue)
  // );
  // let offset = Cesium.Cartesian3.fromRadians(
  //   cartographic.longitude,
  //   cartographic.latitude,
  //   Number(this.symbol.height) + Number(this.baseValue)
  // );
  // let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());

  let polygonInstance = new Cesium.GeometryInstance({
    geometry: new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(b.positions),
      height: Number(b.baseHeight),
      extrudedHeight: Number(b.baseHeight) + Number(b.height) + 1000,
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        new Cesium.Color(1, 1, 1, 0.5)
      ),
    },
  });

  let CurrentClassificationPrimitive = new Cesium.ClassificationPrimitive({
    geometryInstances: polygonInstance,
    releaseGeometryInstances: false,
    classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
  });

  let limitHeightPrimitive = window.viewer.scene.primitives.add(
    CurrentClassificationPrimitive
  );

  limitHeightPrimitive.readyPromise.then(() => {
    // this.changeHeight();
    limitHeightPrimitive._primitive.modelMatrix = Cesium.Matrix4.fromTranslation(
      layer.modelMatrix
    );
    cesiumInit_height.limitPrimitives.push(limitHeightPrimitive);
  });
};

/* 调整基地高度高度 */
const changeHeight = (item: any) => {
  if (item.check && isSC.value) {
    cesiumInit_height.update(item.height, item.baseHeight);
  }
};

/* 清除范围 */
const clearRender = () => {
  //window.viewer.dataSources.add(geojsonLayer);
  clearResult();
  boxList.value.forEach((i) => {
    i.check = false;
  });
  checkall.value = false;
};

const clearResult = () => {
  cesiumInit_height.clearDraw();
  featureAll.value.forEach((f) => {
    f.color = Cesium.Color.RED.withAlpha(0);
  });
};

/* 组件卸载 */
onBeforeUnmount(() => {
  closeDialog();
});
</script>

<style scoped lang="scss">
@use './PlanReview.scss';
</style>
