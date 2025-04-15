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
          <!-- <el-switch v-model="switchValue" inline-prompt active-text="可见" inactive-text="隐藏"
                        class="menu-switch" /> -->
        </span>
      </template>
      <div class="tool-main">
        <el-form
          :inline="true"
          :model="formInline"
          class="demo-form-inline"
          label-position="right"
          label-width="auto"
        >
          <el-divider content-position="left" border-style="double"
            >相机参数设置</el-divider
          >
          <el-form-item label="方位角°">
            <el-input
              v-model="formInline.azimuth"
              placeholder="方位角°"
              clearable
            />
          </el-form-item>
          <el-form-item label="俯仰角°">
            <el-input
              v-model="formInline.pitchangle"
              placeholder="俯仰角°"
              clearable
            />
          </el-form-item>
          <el-form-item label="视点X">
            <el-input
              v-model="formInline.viewpoint_x"
              placeholder="视点x"
              clearable
            />
          </el-form-item>
          <el-form-item label="视点Y">
            <el-input
              v-model="formInline.viewpoint_y"
              placeholder="视点y"
              clearable
            />
          </el-form-item>
          <el-form-item label="视点Z">
            <el-input
              v-model="formInline.viewpoint_z"
              placeholder="视点z"
              clearable
            />
            <i
              class="icon iconfont icon-jingweidushiqu"
              style="color: #24447f"
              title="相机参数拾取并保存"
              @click="cameraPicking"
            ></i>
          </el-form-item>

          <el-divider content-position="left" border-style="double"
            >中心点设置</el-divider
          >
          <el-form-item label="中心点X">
            <el-input
              v-model="formInline.center_x"
              placeholder="中心点X"
              clearable
            />
          </el-form-item>
          <el-form-item label="中心点Y">
            <el-input
              v-model="formInline.center_y"
              placeholder="中心点Y"
              clearable
            />
          </el-form-item>
          <el-form-item label="中心点Z">
            <el-input
              v-model="formInline.center_z"
              placeholder="中心点Z"
              clearable
            />
            <i
              class="icon iconfont icon-jingweidushiqu"
              style="color: #24447f"
              title="点击地图拾取中心点并保存"
              @click="coordinatePicking"
            ></i>
          </el-form-item>
          <!-- <el-form-item>
                        <el-button type="primary" @click="">保存</el-button>
                    </el-form-item> -->
          <!-- <div class="form-btn">
                        <el-button type="primary" @click="save">保存</el-button>
                        <el-button type="warning" @click="closeDialog">关闭</el-button>
                    </div> -->
        </el-form>
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
  ElMessage,
  type FormInstance,
  type FormRules,
  ElMessageBox,
} from "element-plus";
import { encode, decode } from "js-base64";

/* API */
import { saveDataApi } from "./threedimension-api";
import { getProjectById } from "@/utils/common-api";

/* 工具类 */
import { cartesian3ToCoordinates } from "@/utils/cesiumExt/coordinate";

/*图片引用*/
import greenpng from "@/assets/images/green.png";

const route = useRoute();
const { menuStore, viewStore, mapStore } = useStore();
let viewer = <any>null;
const formInline = reactive({
  viewpoint_x: 0,
  viewpoint_y: 0,
  viewpoint_z: 0,
  azimuth: 0,
  pitchangle: 0,
  center_x: 0,
  center_y: 0,
  center_z: 0,
});

let ProjectSchemeInfo = ref<any>(null);
/* 获取项目方案信息 */
const getProjectScheme = async () => {
  let params = {
    pid: JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
  };
  const { data: res } = await getProjectById(params);
  if (res.code !== 200) return ElMessage.warning(res.msg);
  if (res.data != null) {
    ProjectSchemeInfo.value = res.data;
    formInline.viewpoint_x = res.data.viewpointX;
    formInline.viewpoint_y = res.data.viewpointY;
    formInline.viewpoint_z = res.data.viewpointZ;
    formInline.azimuth = res.data.azimuth;
    formInline.pitchangle = res.data.pitchangle;
    formInline.center_x = res.data.centerX;
    formInline.center_y = res.data.centerY;
    formInline.center_z = res.data.centerZ;

    //绘制符号
    let position = Cesium.Cartesian3.fromDegrees(
      Number(formInline.center_x),
      Number(formInline.center_y),
      Number(formInline.center_z)
    );
    pointEntity(position);
  } else {
    getActiveVal();
  }
};

/* 保存 */
const save = async () => {
  let dataParams = {
    azimuth: formInline.azimuth,
    centerX: formInline.center_x,
    centerY: formInline.center_y,
    centerZ: formInline.center_z,
    pid: JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
    //redlinedata: '',
    pitchangle: formInline.pitchangle,
    viewpointX: formInline.viewpoint_x,
    viewpointY: formInline.viewpoint_y,
    viewpointZ: formInline.viewpoint_z,
  };
  const { data: res } = await saveDataApi(dataParams);
  console.log(res, "res");
  if (res.code !== 200) return ElMessage.warning(res.msg);
  else return ElMessage.success(res.msg);
};

/*相机参数拾取*/
const cameraPicking = async () => {
  let cartoGraphic = viewer.camera.positionCartographic;
  // 经度
  formInline.viewpoint_x = Number(
    ((cartoGraphic.longitude * 180) / Math.PI).toFixed(4)
  );
  // 纬度
  formInline.viewpoint_y = Number(
    ((cartoGraphic.latitude * 180) / Math.PI).toFixed(4)
  );
  // 视高
  formInline.viewpoint_z = Number(cartoGraphic.height.toFixed(1));

  // 方位角
  formInline.azimuth = Number(
    Cesium.Math.toDegrees(viewer.camera.heading).toFixed(1)
  );
  // 倾斜角
  formInline.pitchangle = Number(
    Cesium.Math.toDegrees(viewer.camera.pitch).toFixed(1)
  );

  let dataParams = {
    azimuth: formInline.azimuth,
    // centerX: formInline.center_x,
    // centerY: formInline.center_y,
    // centerZ: formInline.center_z,
    pid: JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
    //redlinedata: '',
    pitchangle: formInline.pitchangle,
    viewpointX: formInline.viewpoint_x,
    viewpointY: formInline.viewpoint_y,
    viewpointZ: formInline.viewpoint_z,
  };
  const { data: res } = await saveDataApi(dataParams);
  console.log(res, "res");
  if (res.code !== 200) return ElMessage.warning(res.msg);
  else return ElMessage.success(res.msg);
};

/*坐标拾取*/
let isShiQu = ref<boolean>(false);
let handler = <any>null;
const coordinatePicking = () => {
  //viewer.entities.removeAll();
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas); //处理用户输入事件
  handler.setInputAction(async function (event) {
    isShiQu.value = true;
    // 设置左键点击事件
    let pick = viewer.scene.pickPosition(event.position); // 获取 pick 拾取对象
    let point = cartesian3ToCoordinates(pick);
    console.log(point, "point");
    formInline.center_x = point[0];
    formInline.center_y = point[1];
    formInline.center_z = point[2];
    pointEntity(pick);
    endDraw();
    let dataParams = {
      centerX: formInline.center_x,
      centerY: formInline.center_y,
      centerZ: formInline.center_z,
      pid: JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
    };
    const { data: res } = await saveDataApi(dataParams);
    console.log(res, "res");
    if (res.code !== 200) return ElMessage.warning(res.msg);
    else return ElMessage.success(res.msg);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction((movement) => {
    viewer._element.style.cursor = "default"; //由于鼠标移动时 Cesium会默认将鼠标样式修改为手柄 所以移动时手动设置回来
    let position = viewer.scene.pickPosition(movement.endPosition);
    //添加鼠标移动提示文字
    addTips(position, "左键画点");
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
};

//添加提示性文字
let tips = null;
const addTips = (point, text) => {
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
        backgroundPadding: new Cesium.Cartesian2(10, 10), //指定以像素为单位的水平和垂直背景填充
        pixelOffset: new Cesium.Cartesian2(50, 50),
        outlineWidth: 2,
        outlineColor: Cesium.Color.WHITE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })
  );
};

//绘制点符号
let geoEntity = null;
const pointEntity = (position: any) => {
  if (geoEntity) {
    viewer.entities.remove(geoEntity);
  }
  geoEntity = new Cesium.Entity({
    position: position,
    billboard: {
      // 图像地址，URI或Canvas的属性
      image: greenpng,
      // 设置颜色和透明度
      //color: Cesium.Color.fromCssColorString(this.symbol.color), //Cesium.Color.WHITE.withAlpha(0.8)
      //scaleByDistance: new Cesium.NearFarScalar(300, 1, 1200, 0.6), //设置随图缩放距离和比例
      // 高度（以像素为单位）
      height: 36,
      // 宽度（以像素为单位）
      width: 30,
      // 逆时针旋转
      rotation: 0,
      // 大小是否以米为单位
      sizeInMeters: false,
      // 相对于坐标的垂直位置
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      // 相对于坐标的水平位置
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      // 该属性指定标签在屏幕空间中距此标签原点的像素偏移量
      // pixelOffset: new Cesium.Cartesian2(10, 0),
      //让模型在地形上紧贴
      heightReference: Cesium.HeightReference.NONE,
      //disableDepthTestDistance: 10,
      scale: 1.0,
      // 是否显示
      show: true,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      //clampToGround: true,
    },
  });
  viewer.entities.add(geoEntity);
};

//绘制点完成
const endDraw = () => {
  if (handler) {
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  if (tips != null) {
    viewer.entities.remove(tips);
  }
};

/* 监听三维视图变化 */
const setWatchView = () => {
  viewer.camera.changed.addEventListener(() => {
    setTimeout(() => {
      getActiveVal();
    }, 1500);
  });

  // 鼠标移动监听
  let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(function () {
    getActiveVal();
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  // 滚轮监听
  let handlerWheel = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  handlerWheel.setInputAction(function () {
    getActiveVal();
  }, Cesium.ScreenSpaceEventType.WHEEL);
};

//移除事件
const removeHandler = () => {
  //this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
};

/* 默认获取当前地图参数 */
const getActiveVal = () => {
  if (!ProjectSchemeInfo) {
    let cartoGraphic = viewer.camera.positionCartographic;
    // 经度
    formInline.viewpoint_x = Number(
      ((cartoGraphic.longitude * 180) / Math.PI).toFixed(4)
    );
    // 纬度
    formInline.viewpoint_y = Number(
      ((cartoGraphic.latitude * 180) / Math.PI).toFixed(4)
    );
    // 视高
    formInline.viewpoint_z = Number(cartoGraphic.height.toFixed(1));

    // 方位角
    formInline.azimuth = Number(
      Cesium.Math.toDegrees(viewer.camera.heading).toFixed(1)
    );
    // 倾斜角
    formInline.pitchangle = Number(
      Cesium.Math.toDegrees(viewer.camera.pitch).toFixed(1)
    );

    // 中心点x
    formInline.center_x = Number(
      ((cartoGraphic.longitude * 180) / Math.PI).toFixed(4)
    );

    // 中心点y
    formInline.center_y = Number(
      ((cartoGraphic.latitude * 180) / Math.PI).toFixed(4)
    );

    // 中心点z
    if (formInline.center_z) {
      formInline.center_z = Number(cartoGraphic.height.toFixed(4));
    }
  }
};

/* 弹窗状态 */
const dialogVisible = ref(false);
const switchValue = ref(true);

/* 关闭弹窗 */
const closeDialog = () => {
  // 菜单恢复初始值
  if (menuStore.currFunc?.code == "swfa") {
    menuStore.currFunc = null;
  }
  if (geoEntity) {
    viewer.entities.remove(geoEntity);
  }
  // viewer.entities.removeAll();
  //清除事件
  endDraw();
};

/* 组件卸载 */
onBeforeUnmount(() => {
  closeDialog();
});

/* 组件加载 */
onMounted(() => {
  dialogVisible.value = true;
  viewer = window.viewer;
  getProjectScheme();
  setWatchView();
});
</script>

<style scoped lang="scss">
@use "./threedimension.scss";
</style>
