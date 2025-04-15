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
          <span class="title-txt">符号设置</span>
        </span>
      </template>
      <el-form :model="formData" label-width="auto">
        <el-form-item label="名称" prop="textvalue">
          <el-input v-model.trim="formData.name" placeholder="请输入图标名称" />
        </el-form-item>
        <el-form-item label="标注文字" prop="textvalue">
          <el-input
            v-model.trim="formData.textvalue"
            placeholder="请输入标注文字"
            @blur="onblur"
          />
        </el-form-item>
        <el-form-item label="文字颜色" prop="textcolor">
          <el-color-picker
            v-model="formData.textcolor"
            show-alpha
            @change="changeTextColor"
          />
        </el-form-item>
        <el-form-item label="文字大小" prop="fontsize">
          <el-input-number
            v-model="formData.fontsize"
            :min="1"
            :max="100"
            @change="changeTextSize"
          />
        </el-form-item>
        <el-form-item label="文字背景色" prop="background">
          <el-color-picker
            v-model="formData.background"
            show-alpha
            @change="changeTextBgColor"
          />
        </el-form-item>
        <el-form-item label="符号" prop="shape">
          <el-select
            v-model="formData.shape"
            class="m-2"
            placeholder="Select"
            @change="changeShape"
          >
            <el-option label="绿色地标" value="greenpng" />
            <el-option label="红色地标" value="redpng" />
            <el-option label="蓝色地标" value="bluepng" />
            <el-option label="点符号" value="point" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否贴地" prop="isground">
          <el-switch
            v-model="formData.isground"
            class="ml-2"
            inline-prompt
            style="
              --el-switch-on-color: #2d559f;
              --el-switch-off-color: rgba(176, 173, 173, 0.7);
            "
            active-text="贴地"
            inactive-text="不贴地"
            @change="changeGround"
          />
        </el-form-item>
        <div class="btns">
          <el-button type="primary" @click="handleComfirm" v-if="editFlag"
            >确定</el-button
          >
        </div>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/* 依赖包 */
import { ref, reactive, watch, toRaw, onMounted } from "vue";
import useStore from "@/stores";
import { ElMessage } from "element-plus";
import * as Cesium from "cesium";
/*绘制点，线，面，立方体，文字*/

import cesiumInit from "@/utils/plugins/entitydraw";
import { useRoute } from "vue-router"; /* 地标图片 */
import greenpng from "@/assets/images/green.png";
import redpng from "@/assets/images/red.png";
import bluepng from "@/assets/images/blue.png";
/*实体符号化 entity*/
import { createEntity } from "@/utils/cesiumExt/createEntity";
const route = useRoute();
// 接收父组件传递过来的方法
const emit = defineEmits(["func", "editFunc"]);
const { menuStore, viewStore, mapStore } = useStore();

const formData: any = reactive({
  name: "",
  textvalue: "", //文本标注文字内容
  textcolor: "rgba(255, 0, 0, 1)", //文字颜色
  colorvalue: "rgba(255, 0, 0, 1)", //颜色
  fontsize: 24, //文字大小,
  background: "rgba(0, 0, 0, 0.7)", //背景色
  geoSize: 16, //图形大小
  outlinecolor: "rgba(255, 255, 255, 1)",
  outlinewidth: 2,
  shape: "greenpng", //'inverted-cone',
  fillstyle: "solid",
  depth: 0, //离地高度,
  height: 10, //物体高度
  type: "Point", //二维三维图标切换
  isground: false, //是否贴地（默认不贴地）
  classificationtype: "2", //贴地设置：对应cesium的ClassificationType【枚举】属性包含（TERRAIN：0，CESIUM_3D_TILE：1，BOTH：2）
});

let isSymbolEdit = ref(false);
let editData = ref(null);
/* 确定标记 */
const handleComfirm = async () => {
  console.log("zzzzzzzzz", isSymbolEdit.value);

  let symbol = {
    name: formData.name,
    type: "Point",
    image: formData.shape,
    color: formData.colorvalue,
    outlinewidth: formData.outlinewidth,
    outlinecolor: formData.outlinecolor,
    geosize: formData.geoSize,
    text: formData.textvalue,
    textcolor: formData.textcolor,
    textsize: formData.fontsize,
    background: formData.background,
    depth: formData.depth,
    height: formData.height,
    isground: formData.isground,
    classificationtype: formData.classificationtype,
  };

  if (isSymbolEdit.value && editData.value.geojson != "") {
    symbol.type = formData.shape != "point" ? "billboard" : "Point";

    let geojson = JSON.parse(editData.value.geojson);
    editData.value.buildname = formData.name;
    geojson.properties.attr = symbol;

    editData.value.geojson = JSON.stringify(geojson);
    emit("editFunc", editData.value);
  } else if (isSymbolEdit.value && editData.value.geojson == "") {
    if (formData.name == "") return ElMessage.warning("名称不能为空");
    symbol.type = formData.shape != "point" ? "billboard" : "Point";
    cesiumInit.drawActivate(symbol);
  } else {
    if (formData.name == "") return ElMessage.warning("名称不能为空");
    symbol.type = formData.shape != "point" ? "billboard" : "Point";
    cesiumInit.drawActivate(symbol);
  }
};

/* 初始化绘制工具 */
//let drawGeoList = ref([]);
const initTool = () => {
  debugger;
  //初始化地图绘制工具
  cesiumInit.init(toRaw(window.viewer));
  cesiumInit.drawTool.DrawEndEvent.addEventListener(
    async (result, positions, drawType) => {
      result.remove();
      cesiumInit.geoEntity = null;
      cesiumInit.addDrawResult(positions, drawType);
      console.log("绘制类型：" + drawType + "结果如下");
      console.log(positions);
      //转geojson
      let featuresJson = cesiumInit.toGeoJson(positions);

      let geoObj = {
        geojson: featuresJson,
        name: formData.name,
        pid: new Date().getTime(),
        entities: cesiumInit.geoEntity,
      };
      if (!isSymbolEdit.value) {
        emit("func", geoObj);
      } else {
        geoObj = {
          geojson: JSON.stringify(featuresJson),
          buildname: formData.name,
          pid: editData.value.pid,
          entities: cesiumInit.geoEntity,
        };
        //geoObj.pid = editData.value.pid;
        emit("editFunc", geoObj);
        createEntity(
          editData.value.pid,
          JSON.stringify(featuresJson),
          window.viewer
        );
      }
      window.viewer.entities.remove(cesiumInit.geoEntity);
    }
  );
};

/* 弹窗控制 */
//判断是否可编辑
let editFlag = ref(false);
const dialogVisible = ref(false);
const showDialog = (data = null) => {
  debugger;
  editFlag = window.editFlag;
  dialogVisible.value = true;
  if (data == null) {
    isSymbolEdit.value = false;
    formData.name = "";
    formData.textvalue = "";
    formData.textcolor = "rgba(255, 0, 0, 1)"; //文字颜色
    formData.colorvalue = "rgba(255, 0, 0, 1)"; //颜色
    formData.fontsize = 24; //文字大小,
    formData.background = "rgba(0, 0, 0, 0.2)"; //背景色
    formData.geoSize = 16; //图形大小
    formData.outlinecolor = "rgba(255, 255, 255, 1)";
    formData.outlinewidth = 2;
    formData.shape = "greenpng"; //'inverted-cone',
    formData.fillstyle = "solid";
    formData.depth = 0; //离地高度,
    formData.height = 10; //物体高度
    formData.type = "twoDimensional"; //二维三维图标切换
    formData.isground = false; //是否贴地（默认贴地）
    formData.classificationtype = "2";
    initTool();
  } else if (data.geojson == "") {
    formData.name = data.buildname;
    formData.textvalue = "";
    formData.textcolor = "rgba(255, 0, 0, 1)"; //文字颜色
    formData.colorvalue = "rgba(255, 0, 0, 1)"; //颜色
    formData.fontsize = 24; //文字大小,
    formData.background = "rgba(0, 0, 0, 0.2)"; //背景色
    formData.geoSize = 16; //图形大小
    formData.outlinecolor = "rgba(255, 255, 255, 1)";
    formData.outlinewidth = 2;
    formData.shape = "greenpng"; //'inverted-cone',
    formData.fillstyle = "solid";
    formData.depth = 0; //离地高度,
    formData.height = 10; //物体高度
    formData.type = "twoDimensional"; //二维三维图标切换
    formData.isground = false; //是否贴地（默认贴地）
    formData.classificationtype = "2";
    isSymbolEdit.value = true;
    editData.value = data;
    initTool();
  } else {
    let symbol = JSON.parse(data.geojson).properties.attr;
    formData.name = data.buildname;
    formData.textvalue = symbol.text;
    formData.textcolor = symbol.textcolor; //文字颜色
    formData.colorvalue = symbol.color; //颜色
    formData.fontsize = symbol.textsize; //文字大小,
    formData.background = symbol.background; //背景色
    formData.geoSize = symbol.geosize; //图形大小
    formData.outlinecolor = symbol.outlinecolor;
    formData.outlinewidth = symbol.outlinewidth;
    formData.shape = symbol.image; //'inverted-cone',
    formData.depth = symbol.depth; //离地高度,
    formData.height = symbol.height; //物体高度
    formData.type = symbol.type; //二维三维图标切换
    formData.isground = symbol.isground; //是否贴地（默认贴地）
    formData.classificationtype = symbol.classificationtype;
    isSymbolEdit.value = true;
    editData.value = data;
  }
};

//改变标注文字
const onblur = () => {
  if (!isSymbolEdit.value || editData.value.geojson == "") {
    return;
  }
  let symbolType = JSON.parse(editData.value.geojson).geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }

  locationGeos.label.text._value = formData.textvalue;
};
//改变文本颜色
const changeTextColor = () => {
  if (!isSymbolEdit.value || editData.value.geojson == "") {
    return;
  }
  let symbolType = JSON.parse(editData.value.geojson).geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }
  locationGeos.label.fillColor = Cesium.Color.fromCssColorString(
    formData.textcolor
  );
};

//改变文字大小
const changeTextSize = () => {
  if (!isSymbolEdit.value || editData.value.geojson == "") {
    return;
  }
  let symbolType = JSON.parse(editData.value.geojson).geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }
  locationGeos.label.font =
    "normal " + formData.fontsize + "px MicroSoft YaHei";
};

//改变文字背景色
const changeTextBgColor = () => {
  if (!isSymbolEdit.value || editData.value.geojson == "") {
    return;
  }
  let symbolType = JSON.parse(editData.value.geojson).geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }
  locationGeos.label.backgroundColor = Cesium.Color.fromCssColorString(
    formData.background
  );
};

//改变符号
const changeShape = () => {
  if (!isSymbolEdit.value || editData.value.geojson == "") {
    return;
  }
  let symbolType = JSON.parse(editData.value.geojson).geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }
  switch (symbolType) {
    case "Point":
      if (formData.shape == "point") {
        locationGeos.point.pixelSize = formData.geoSize;
        locationGeos.point.color = Cesium.Color.fromCssColorString(
          formData.colorvalue
        );
        locationGeos.point.outlineWidth = formData.outlinewidth;
        locationGeos.point.outlineColor = Cesium.Color.fromCssColorString(
          formData.outlinecolor
        );
        locationGeos.point.heightReference = formData.isground
          ? Cesium.HeightReference.CLAMP_TO_GROUND
          : Cesium.HeightReference.NONE;
      } else {
        window.viewer.entities.remove(locationGeos);
        let geojson = JSON.parse(editData.value.geojson);
        geojson.properties.plotType = "billboard";
        geojson.properties.attr.type = "billboard";
        geojson.geometry.type = "billboard";
        editData.value.geojson = JSON.stringify(geojson);
        let geoEntitys = createEntity(
          editData.value.pid,
          editData.value.geojson,
          window.viewer
        );
        geoEntitys.forEach((entity) => {
          window.viewer.entities.add(entity);
        });
      }

      break;
    case "billboard":
      if (formData.shape == "point") {
        window.viewer.entities.remove(locationGeos);
        let geojson = JSON.parse(editData.value.geojson);
        geojson.properties.plotType = "Point";
        geojson.properties.attr.type = "Point";
        geojson.geometry.type = "Point";
        editData.value.geojson = JSON.stringify(geojson);
        let geoEntitys = createEntity(
          editData.value.pid,
          editData.value.geojson,
          window.viewer
        );
        geoEntitys.forEach((entity) => {
          window.viewer.entities.add(entity);
        });
      } else {
        let image = greenpng;
        switch (formData.shape) {
          case "redpng":
            image = redpng;
            break;
          case "bluepng":
            image = bluepng;
            break;
          default:
            image = greenpng;
            break;
        }
        locationGeos.billboard.image = image;
        //editData.value.geojson.properties.attr.image = formData.shape;
      }
      break;
  }
};

//改变是否贴地
const changeGround = () => {
  if (!isSymbolEdit.value || editData.value.geojson == "") {
    return;
  }
  let symbolType = JSON.parse(editData.value.geojson).geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }
  switch (symbolType) {
    case "Point":
      locationGeos.point.heightReference = formData.isground
        ? Cesium.HeightReference.CLAMP_TO_GROUND
        : Cesium.HeightReference.NONE;
      locationGeos.label.heightReference = formData.isground
        ? Cesium.HeightReference.CLAMP_TO_GROUND
        : Cesium.HeightReference.NONE;
      break;
    case "billboard":
      locationGeos.billboard.heightReference = formData.isground
        ? Cesium.HeightReference.CLAMP_TO_GROUND
        : Cesium.HeightReference.NONE;
      locationGeos.label.heightReference = formData.isground
        ? Cesium.HeightReference.CLAMP_TO_GROUND
        : Cesium.HeightReference.NONE;
      break;
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
  formData.textvalue = "";
};
defineExpose({
  showDialog,
  closeDialog,
});
</script>

<style scoped lang="scss">
@use "./symboldesign.scss";
</style>
