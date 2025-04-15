<template>
  <el-dialog
    v-model="symbolDialogVisible"
    draggable
    :modal="false"
    :close-on-click-modal="false"
    class="tool-symbol"
    @close="closeSymbol"
  >
    <template #header>
      <span class="tool-title">
        <span class="title-txt">符号设置</span>
        <el-popover
          placement="bottom-start"
          :width="200"
          trigger="hover"
          content="符号设置"
        >
          <template #reference>
            <i class="iconfont icon-shuxing"></i>
          </template>
        </el-popover>
      </span>
    </template>
    <el-form :model="formData" label-width="140px">
      <el-form-item label="名称" prop="textvalue">
        <el-input v-model="formData.name" placeholder="请输入图标名称" />
      </el-form-item>
      <!-- v-if="currentIcon.pid == 8 || currentIcon.pid == 5 || currentIcon.pid == 4 || currentIcon.pid == 1 || currentIcon.pid == 2"-->
      <el-form-item
        label="标注文字"
        prop="textvalue"
        v-if="
          (currentIcon.pid != 9) &
          (currentIcon.pid != 10) &
          (currentIcon.pid != 11) &
          (currentIcon.pid != 12)
        "
      >
        <el-input
          v-model="formData.textvalue"
          placeholder="请输入标注文字"
          @blur="onblur"
        />
      </el-form-item>
      <el-form-item
        label="文字颜色"
        prop="textcolor"
        v-if="
          (currentIcon.pid != 9) &
          (currentIcon.pid != 10) &
          (currentIcon.pid != 11) &
          (currentIcon.pid != 12)
        "
      >
        <el-color-picker
          v-model="formData.textcolor"
          show-alpha
          @change="changeTextColor"
        />
      </el-form-item>
      <el-form-item
        label="文字大小"
        prop="fontsize"
        v-if="
          (currentIcon.pid != 9) &
          (currentIcon.pid != 10) &
          (currentIcon.pid != 11) &
          (currentIcon.pid != 12)
        "
      >
        <el-input-number
          v-model="formData.fontsize"
          :min="1"
          :max="100"
          @change="changeTextSize"
        />
      </el-form-item>
      <el-form-item
        label="文字背景色"
        prop="background"
        v-if="
          (currentIcon.pid != 9) &
          (currentIcon.pid != 10) &
          (currentIcon.pid != 11) &
          (currentIcon.pid != 12)
        "
      >
        <el-color-picker
          v-model="formData.background"
          show-alpha
          @change="changeTextBgColor"
        />
      </el-form-item>
      <el-form-item label="符号" prop="shape" v-if="currentIcon.pid == 1">
        <el-select
          v-model="formData.shape"
          class="m-2"
          placeholder="Select"
          size="small"
          @change="changeShape"
        >
          <el-option label="绿色地标" value="greenpng" />
          <el-option label="红色地标" value="redpng" />
          <el-option label="蓝色地标" value="bluepng" />
          <el-option label="点符号" value="point" />
        </el-select>
      </el-form-item>
      <el-form-item
        label="图形颜色"
        prop="colorvalue"
        v-if="
          (currentIcon.pid == 1 && formData.shape == 'point') ||
          currentIcon.pid == 8 ||
          currentIcon.pid == 2 ||
          currentIcon.pid == 3 ||
          currentIcon.pid == 5 ||
          currentIcon.pid == 6 ||
          currentIcon.pid == 7
        "
      >
        <el-color-picker
          v-model="formData.colorvalue"
          show-alpha
          @change="changeGeoColor"
        />
      </el-form-item>
      <el-form-item
        :label="
          currentIcon.pid == 8 || currentIcon.pid == 5 ? '线宽' : '图形大小'
        "
        prop="geoSize"
        v-if="
          currentIcon.pid == 8 ||
          (currentIcon.pid == 1 && formData.shape == 'point') ||
          currentIcon.pid == 5
        "
      >
        <!-- || currentIcon.id == 2 -->
        <el-input-number
          v-model="formData.geoSize"
          :min="1"
          :max="10000"
          @change="changeGeoSize"
        />
      </el-form-item>

      <el-form-item
        label="轮廓颜色"
        prop="outlinecolor"
        v-if="
          (currentIcon.pid == 1 && formData.shape == 'point') ||
          currentIcon.pid == 2 ||
          currentIcon.pid == 3 ||
          currentIcon.pid == 6 ||
          currentIcon.pid == 7
        "
      >
        <el-color-picker
          v-model="formData.outlinecolor"
          show-alpha
          @change="changeOutlineColor"
        />
      </el-form-item>
      <el-form-item
        label="轮廓宽度"
        prop="outlinewidth"
        v-if="
          (currentIcon.pid == 1 && formData.shape == 'point') ||
          currentIcon.pid == 2 ||
          currentIcon.pid == 3 ||
          currentIcon.pid == 6 ||
          currentIcon.pid == 7
        "
      >
        <el-input-number
          v-model="formData.outlinewidth"
          :min="1"
          :max="100"
          @change="changeOutlineWith"
        />
      </el-form-item>
      <el-form-item label="立体高度" prop="height" v-if="currentIcon.pid == 3">
        <el-input-number
          v-model="formData.height"
          :min="1"
          :max="100000"
          @change="changeHeight"
        />
      </el-form-item>
      <el-form-item label="是否贴地" prop="isground">
        <!-- v-if="(currentIcon.id == 1 || currentIcon.id == 4 || currentIcon.id == 5) && currentIcon.id != 3"> -->
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
      <!-- <el-form-item label="贴地设置" prop="classificationtype"
          v-if="currentIcon.id != 1 && currentIcon.id != 4 && currentIcon.id != 5 && currentIcon.id != 10 && currentIcon.id != 11 && currentIcon.id != 12">
          <el-select v-model="form.classificationtype" class="m-2" placeholder="Select" size="small">
            <el-option label="贴地形和贴模型" value="2" />
            <el-option label="贴地形" value="0" />
            <el-option label="贴模型" value="1" />
          </el-select>
        </el-form-item> -->
      <el-form-item>
        <el-button type="primary" @click="drawLabel" style="margin-left: 58%"
          >确定</el-button
        >
      </el-form-item>
    </el-form>
  </el-dialog>
</template>
<script setup lang="ts">
import {
  ref,
  reactive,
  watch,
  toRaw,
  onMounted,
  defineProps,
  defineEmits,
} from "vue";
import useStore from "@/stores";
const { menuStore, viewStore, mapStore } = useStore();

/* 地标图片 */
import greenpng from "@/assets/images/green.png";
import redpng from "@/assets/images/red.png";
import bluepng from "@/assets/images/blue.png";

import {
  ElMessage,
  type FormInstance,
  type FormRules,
  ElMessageBox,
  ElAlert,
} from "element-plus";
import * as Cesium from "cesium";
/*绘制点，线，面，立方体，文字*/
import cesiumInit from "@/utils/plugins/entitydraw";
/*绘制箭头，燕尾箭头 */
import cesiumAllowInit from "@/utils/plugins/MilitaryPlotDraw";

/*实体符号化 entity*/
import { createEntity } from "@/utils/cesiumExt/createEntity";

// // 接收父组件传递过来的值
// const props = defineProps(['value'])
// 接收父组件传递过来的方法
const emit = defineEmits(["func", "editFunc"]);

let symbolDialogVisible = ref(false);
let isSymbolEdit = ref(false);
let editData = ref(null);
let currentIcon = ref<any>({});
let formData = reactive({
  name: "",
  textvalue: "", //文本标注文字内容
  textcolor: "rgba(255, 0, 0, 1)", //文字颜色
  colorvalue: "rgba(255, 0, 0, 1)", //颜色
  fontsize: 24, //文字大小,
  background: "rgba(0, 0, 0, 0.2)", //背景色
  geoSize: 16, //图形大小
  outlinecolor: "rgba(255, 255, 255, 1)",
  outlinewidth: 2,
  shape: "greenpng", //'inverted-cone',
  fillstyle: "solid",
  depth: 0, //离地高度,
  height: 10, //物体高度
  type: "twoDimensional", //二维三维图标切换
  isground: false, //是否贴地（默认贴地）
  classificationtype: "2", //贴地设置：对应cesium的ClassificationType【枚举】属性包含（TERRAIN：0，CESIUM_3D_TILE：1，BOTH：2）
  iconpid: 0,
});
let commonData = ref<any>(null);

const showDialog = (iconObj, commonObj, data = null) => {
  symbolDialogVisible.value = true;
  currentIcon.value = iconObj;
  commonData.value = commonObj;
  if (data == null) {
    editData.value = null;
    isSymbolEdit.value = false;
    formData.name = "";
    formData.textvalue = "";
    formData.textcolor = "rgba(255, 0, 0, 1)"; //文字颜色
    formData.colorvalue = "rgba(255, 0, 0, 1)"; //颜色
    formData.fontsize = 24; //文字大小,
    formData.background = "rgba(0, 0, 0, 0.2)"; //背景色
    if (currentIcon.value.pid == 5 || currentIcon.value.pid == 8) {
      formData.geoSize = 2; //图形大小
    } else {
      formData.geoSize = 16; //图形大小
    }

    formData.outlinecolor = "rgba(255, 255, 255, 1)";
    formData.outlinewidth = 2;
    formData.shape = "greenpng"; //'inverted-cone',
    formData.fillstyle = "solid";
    formData.depth = 0; //离地高度,
    formData.height = 10; //物体高度
    formData.type = "twoDimensional"; //二维三维图标切换
    formData.isground = false; //是否贴地（默认贴地）
    formData.classificationtype = "2";
    formData.iconpid = iconObj.pid;
    console.log(iconObj, "iconObj");
    initTool();
  } else {
    let symbol = data.geojson.properties.attr;
    formData.name = data.label;
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
    formData.iconpid = symbol.iconpid;
    isSymbolEdit.value = true;
    editData.value = data;
  }
};

/* 初始化绘制工具 */
//let drawGeoList = ref([]);
const initTool = () => {
  //初始化地图绘制工具
  cesiumInit.init(toRaw(window.viewer));
  cesiumInit.drawTool.DrawEndEvent.addEventListener(
    async (result, positions, drawType) => {
      let pid = new Date().getTime();
      result.remove();
      cesiumInit.geoEntity = null;
      cesiumInit.labelEntity = null;
      //辅助点，辅助label
      let assistLabels = cesiumInit.drawTool.assistLabels;
      let assistPoints = cesiumInit.drawTool.assistPoints;
      await cesiumInit.addDrawResult(positions, drawType, null, pid);
      console.log("绘制类型：" + drawType + "结果如下");
      console.log(positions);
      //转geojson
      let featuresJson = cesiumInit.toGeoJson(positions, pid);
      let entitiys = [cesiumInit.geoEntity];
      if (cesiumInit.labelEntity) {
        entitiys.push(cesiumInit.labelEntity);
      }
      for (let i = 0; i < assistLabels.length; i++) {
        const entity = assistLabels[i];
        //entity.id = pid + "-Text" + "-" + i;
        entitiys.push(entity);
      }
      for (let j = 0; j < assistPoints.length; j++) {
        const entity = assistPoints[j];
        // entity.id = pid + "-Point" + "-" + j;
        entitiys.push(entity);
      }
      let primitive = null;
      if (cesiumInit.primitiveCollection.length > 0) {
        cesiumInit.primitiveCollection.forEach((p) => {
          if (pid == p.entityid) {
            primitive = p;
          }
        });
      }

      let geoObj = {
        commonpid: commonData.value.pid,
        drawtype: currentIcon.value.pid,
        geojson: featuresJson,
        name: formData.name,
        pid: pid,
        entitiys: entitiys,
        primitive: primitive,
        // labelentitiy: cesiumInit.labelEntity
      };
      //drawGeoList.value.push(geoObj);
      emit("func", geoObj);
      //存储数据
      // let res = await cesiumInit.saveDrawData(featuresJson);
      // if (res.code != 200) {
      //   return ElMessage.error(res.msg);
      // }
      // else {
      //   //获取图标列表
      //   //resetBuildIconList(res.data);
      // }
    }
  );

  //初始化箭头绘制工具
  cesiumAllowInit.init(toRaw(window.viewer));
  cesiumAllowInit.plotDraw.PlotDrawEndEvent.addEventListener(
    async (drawPlot, type) => {
      let pid = new Date().getTime();
      drawPlot.remove(); //移除绘制的对象
      console.log(drawPlot.toGeoJson(), "this.militaryPlotLayer");
      cesiumAllowInit.militaryPlotLayer.addPlot(
        drawPlot.toGeoJson(),
        cesiumAllowInit.plotTypeObject
      ); //将标绘对象添加到图层中进行管理

      //转geojson
      let featuresJson = drawPlot.toGeoJson();
      let geoObj = {
        commonpid: commonData.value.pid,
        drawtype: currentIcon.value.pid,
        geojson: featuresJson,
        name: formData.name,
        pid: pid,
        entitiys: [
          cesiumAllowInit.militaryPlotLayer.geoEntity,
          cesiumAllowInit.militaryPlotLayer.labelEntity,
        ],
      };
      emit("func", geoObj);
    }
  );
};

// 绘制图形方法
function drawLabel() {
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
    iconpid: currentIcon.value.pid,
  };
  if (isSymbolEdit.value) {
    switch (currentIcon.value.pid) {
      case 1:
        symbol.type = formData.shape != "point" ? "billboard" : "Point";
        break;
      case 2:
        symbol.type = "Polygon";
        break;
      case 3:
        symbol.type = "Cube";
        break;
      case 4:
        symbol.type = "Text";
        break;
      case 5:
        symbol.type = "Polyline";
        break;
      case 6:
        symbol.type = "squadcombat";
        break;
      case 7:
        symbol.type = "tailedsquadcombat";
        break;
      case 8:
        symbol.type = "SpaceLength";
        break;
        case 9:
        symbol.type = "Water";
        break;
      case 10:
        symbol.type = "Fire";
        break;
      case 11:
        symbol.type = "Smoke";
        break;
      case 12:
        symbol.type = "Fountain";
        break;
    }
    editData.value.label = formData.name;
    editData.value.geojson.properties.attr = symbol;
    emit("editFunc", editData.value);
  } else {
    if (!formData.name) {
      return ElMessage.warning("请输入图标名称");
    }
    switch (currentIcon.value.pid) {
      case 1:
        symbol.type = formData.shape != "point" ? "billboard" : "Point";
        cesiumInit.drawActivate(symbol, currentIcon.value);
        break;
      case 2:
        symbol.type = "Polygon";
        cesiumInit.drawActivate(symbol, currentIcon.value);
        break;
      case 3:
        symbol.type = "Cube";
        cesiumInit.drawActivate(symbol, currentIcon.value);
        break;
      case 4:
        symbol.type = "Text";
        cesiumInit.drawActivate(symbol, currentIcon.value);
        break;
      case 5:
        symbol.type = "Polyline";
        cesiumInit.drawActivate(symbol, currentIcon.value);
        break;
      case 6:
        symbol.type = "squadcombat";
        cesiumAllowInit.drawActivate(symbol);
        break;
      case 7:
        symbol.type = "tailedsquadcombat";
        //  symbolDialogVisible.value = true;
        cesiumAllowInit.drawActivate(symbol);
        break;
      case 8:
        symbol.type = "SpaceLength";
        cesiumInit.drawActivate(symbol, currentIcon.value);
        break;
        case 9:
        symbol.type = "Water";
        cesiumInit.drawActivate(symbol, currentIcon.value);
        break;
      case 10:
        symbol.type = "Fire";
        cesiumInit.drawActivate(symbol, currentIcon.value);
        break;
      case 11:
        symbol.type = "Smoke";
        cesiumInit.drawActivate(symbol, currentIcon.value);
        break;
      case 12:
        symbol.type = "Fountain";
        cesiumInit.drawActivate(symbol, currentIcon.value);
        break;
    }
  }
}

//改变标注文字
const onblur = () => {
  if (!isSymbolEdit.value) {
    return;
  }
  let symbolType = editData.value.geojson.geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  switch (symbolType) {
    case "Point":
    case "billboard":
    case "Text":
      if (!locationGeos) {
        return ElMessage.warning("请先勾选图层！");
      }
      locationGeos.label.text._value = formData.textvalue;
      break;
    case "Polyline":
    case "Polygon":
    case "Cube":
      locationGeos = window.viewer.entities.getById(
        editData.value.pid + "-Text"
      );
      if (!locationGeos) {
        window.viewer.entities._entities._array.forEach((entity) => {
          if (entity.plotCode == editData.value.geojson.properties.plotCode) {
            locationGeos = entity;
          }
        });
      }
      if (!locationGeos) {
        return ElMessage.warning("请先勾选图层！");
      }
      locationGeos.label.text._value = formData.textvalue;
      break;
    case "SpaceLength":
      window.viewer.entities._entities._array.forEach((entity) => {
        if (entity.pid == editData.value.pid + "-Text") {
          locationGeos = entity;
          let orgText = locationGeos.label.text._value.split(":");
          locationGeos.label.text._value =
            formData.textvalue + ":" + orgText[1];
        }
      });
      break;
  }
};

//改变文本颜色
const changeTextColor = () => {
  if (!isSymbolEdit.value) {
    return;
  }
  let symbolType = editData.value.geojson.geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  switch (symbolType) {
    case "Point":
    case "billboard":
    case "Text":
      if (!locationGeos) {
        return ElMessage.warning("请先勾选图层！");
      }
      locationGeos.label.fillColor = Cesium.Color.fromCssColorString(
        formData.textcolor
      );
      break;
    case "Polyline":
    case "Polygon":
    case "Cube":
      locationGeos = window.viewer.entities.getById(
        editData.value.pid + "-Text"
      );
      if (!locationGeos) {
        window.viewer.entities._entities._array.forEach((entity) => {
          if (entity.plotCode == editData.value.geojson.properties.plotCode) {
            locationGeos = entity;
          }
        });
      }
      if (!locationGeos) {
        return ElMessage.warning("请先勾选图层！");
      }

      locationGeos.label.fillColor = Cesium.Color.fromCssColorString(
        formData.textcolor
      );
      break;
    case "SpaceLength":
      window.viewer.entities._entities._array.forEach((entity) => {
        if (entity.pid == editData.value.pid + "-Text") {
          locationGeos = entity;
          locationGeos.label.fillColor = Cesium.Color.fromCssColorString(
            formData.textcolor
          );
        }
      });
      break;
  }
};

//改变文字大小
const changeTextSize = () => {
  if (!isSymbolEdit.value) {
    return;
  }
  let symbolType = editData.value.geojson.geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  switch (symbolType) {
    case "Point":
    case "billboard":
    case "Text":
      if (!locationGeos) {
        return ElMessage.warning("请先勾选图层！");
      }
      locationGeos.label.font =
        "normal " + formData.fontsize + "px MicroSoft YaHei";
      break;
    case "Polyline":
    case "Polygon":
    case "Cube":
      locationGeos = window.viewer.entities.getById(
        editData.value.pid + "-Text"
      );
      if (!locationGeos) {
        window.viewer.entities._entities._array.forEach((entity) => {
          if (entity.plotCode == editData.value.geojson.properties.plotCode) {
            locationGeos = entity;
          }
        });
      }
      if (!locationGeos) {
        return ElMessage.warning("请先勾选图层！");
      }
      locationGeos.label.font =
        "normal " + formData.fontsize + "px MicroSoft YaHei";
      break;
    case "SpaceLength":
      window.viewer.entities._entities._array.forEach((entity) => {
        if (entity.pid == editData.value.pid + "-Text") {
          locationGeos = entity;
          locationGeos.label.font =
            "normal " + formData.fontsize + "px MicroSoft YaHei";
        }
      });
      break;
  }
};

//改变文字背景色
const changeTextBgColor = () => {
  if (!isSymbolEdit.value) {
    return;
  }
  let symbolType = editData.value.geojson.geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  switch (symbolType) {
    case "Point":
    case "billboard":
    case "Text":
      if (!locationGeos) {
        return ElMessage.warning("请先勾选图层！");
      }
      locationGeos.label.backgroundColor = Cesium.Color.fromCssColorString(
        formData.background
      );
      break;
    case "Polyline":
    case "Polygon":
    case "Cube":
      locationGeos = window.viewer.entities.getById(
        editData.value.pid + "-Text"
      );
      if (!locationGeos) {
        window.viewer.entities._entities._array.forEach((entity) => {
          if (entity.plotCode == editData.value.geojson.properties.plotCode) {
            locationGeos = entity;
          }
        });
      }
      if (!locationGeos) {
        return ElMessage.warning("请先勾选图层！");
      }
      locationGeos.label.backgroundColor = Cesium.Color.fromCssColorString(
        formData.background
      );
      break;
    case "SpaceLength":
      window.viewer.entities._entities._array.forEach((entity) => {
        if (entity.pid == editData.value.pid + "-Text") {
          locationGeos = entity;
          locationGeos.label.backgroundColor = Cesium.Color.fromCssColorString(
            formData.background
          );
        }
      });
      break;
  }
};

//改变符号
const changeShape = () => {
  if (!isSymbolEdit.value) {
    return;
  }
  let symbolType = editData.value.geojson.geometry.type;
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
        // editData.value.geojson.properties.attr.geosize = formData.geoSize;
        // editData.value.geojson.properties.attr.outlinewidth = formData.outlinewidth;
        // editData.value.geojson.properties.attr.outlinecolor = formData.outlinecolor;
        // editData.value.geojson.properties.attr.color = formData.colorvalue;
        // editData.value.geojson.properties.attr.isground = formData.isground;
      } else {
        editData.value.geojson.properties.plotType = "billboard";
        editData.value.geojson.properties.attr.type = "billboard";
        editData.value.geojson.geometry.type = "billboard";
        window.viewer.entities.remove(locationGeos);
        let geoEntitys = createEntity(
          editData.value.pid,
          JSON.stringify(editData.value.geojson),
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
        editData.value.geojson.properties.plotType = "Point";
        editData.value.geojson.properties.attr.type = "Point";
        editData.value.geojson.geometry.type = "Point";
        let geoEntitys = createEntity(
          editData.value.pid,
          JSON.stringify(editData.value.geojson),
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

//改变图形颜色
const changeGeoColor = () => {
  if (!isSymbolEdit.value) {
    return;
  }
  let symbolType = editData.value.geojson.geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  if (
    editData.value.geojson.properties.plotType == "squadcombat" ||
    editData.value.geojson.properties.plotType == "tailedsquadcombat"
  ) {
    window.viewer.entities._entities._array.forEach((entity) => {
      if (
        entity.plotCode == editData.value.geojson.properties.plotCode &&
        entity.polygon
      ) {
        locationGeos = entity;
      }
    });
  }

  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }
  switch (symbolType) {
    case "Point":
      locationGeos.point.color = Cesium.Color.fromCssColorString(
        formData.colorvalue
      );
      break;
    case "Polyline":
      locationGeos.polyline.material = Cesium.Color.fromCssColorString(
        formData.colorvalue
      );
      break;
    case "Polygon":
      locationGeos.polygon.material = Cesium.Color.fromCssColorString(
        formData.colorvalue
      );

      break;
    case "Cube":
      locationGeos.polygon.material = Cesium.Color.fromCssColorString(
        formData.colorvalue
      );
      break;
    case "SpaceLength":
      locationGeos.polyline.material = Cesium.Color.fromCssColorString(
        formData.colorvalue
      );
      break;
  }
};

//改变图形大小
const changeGeoSize = () => {
  if (!isSymbolEdit.value) {
    return;
  }
  let symbolType = editData.value.geojson.geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }
  switch (symbolType) {
    case "Point":
      locationGeos.point.pixelSize = formData.geoSize;
      break;
    case "Polyline":
    case "SpaceLength":
      locationGeos.polyline.width = formData.geoSize;
      break;
  }
};

//改变轮廓颜色
const changeOutlineColor = () => {
  if (!isSymbolEdit.value) {
    return;
  }
  let symbolType = editData.value.geojson.geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  if (
    editData.value.geojson.properties.plotType == "squadcombat" ||
    editData.value.geojson.properties.plotType == "tailedsquadcombat"
  ) {
    window.viewer.entities._entities._array.forEach((entity) => {
      if (
        entity.plotCode == editData.value.geojson.properties.plotCode &&
        entity.polygon
      ) {
        locationGeos = entity;
      }
    });
  }

  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }
  switch (symbolType) {
    case "Point":
      locationGeos.point.outlineColor = Cesium.Color.fromCssColorString(
        formData.outlinecolor
      );
      break;
    case "Polygon":
      locationGeos.polygon.outlineColor = Cesium.Color.fromCssColorString(
        formData.outlinecolor
      );
      break;
    case "Cube":
      locationGeos.polygon.outlineColor = Cesium.Color.fromCssColorString(
        formData.outlinecolor
      );
      break;
  }
};

//改变轮廓宽度
const changeOutlineWith = () => {
  if (!isSymbolEdit.value) {
    return;
  }
  let symbolType = editData.value.geojson.geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  if (
    editData.value.geojson.properties.plotType == "squadcombat" ||
    editData.value.geojson.properties.plotType == "tailedsquadcombat"
  ) {
    window.viewer.entities._entities._array.forEach((entity) => {
      if (
        entity.plotCode == editData.value.geojson.properties.plotCode &&
        entity.polygon
      ) {
        locationGeos = entity;
      }
    });
  }

  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }
  switch (symbolType) {
    case "Point":
      locationGeos.point.outlineWidth = formData.outlinewidth;
      break;
    case "Polygon":
      locationGeos.polygon.outlineWidth = formData.outlinewidth;
      break;
    case "Cube":
      locationGeos.polygon.outlineWidth = formData.outlinewidth;
      break;
  }
};

//改变高度
const changeHeight = () => {
  if (!isSymbolEdit.value) {
    return;
  }
  let symbolType = editData.value.geojson.geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }
  switch (symbolType) {
    case "Cube":
      //获取高程
      const cartographic = window.viewer.camera.positionCartographic;
      let elevation =
        window.viewer.scene.globe.getHeight(cartographic) > 0
          ? window.viewer.scene.globe.getHeight(cartographic).toFixed(1)
          : 0;
      locationGeos.polygon.extrudedHeight =
        Number(elevation) + Number(formData.height);
      break;
  }
};

//改变是否贴地
const changeGround = () => {
  if (!isSymbolEdit.value) {
    return;
  }
  let symbolType = editData.value.geojson.geometry.type;
  let locationGeos = window.viewer.entities.getById(
    editData.value.pid + "-" + symbolType
  );
  if (
    editData.value.geojson.properties.plotType == "squadcombat" ||
    editData.value.geojson.properties.plotType == "tailedsquadcombat"
  ) {
    window.viewer.entities._entities._array.forEach((entity) => {
      if (
        entity.plotCode == editData.value.geojson.properties.plotCode &&
        entity.polygon
      ) {
        locationGeos = entity;
      }
    });
  }

  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }
  switch (symbolType) {
    case "Point":
      locationGeos.label.heightReference = formData.isground
        ? Cesium.HeightReference.CLAMP_TO_GROUND
        : Cesium.HeightReference.NONE;
      locationGeos.point.heightReference = formData.isground
        ? Cesium.HeightReference.CLAMP_TO_GROUND
        : Cesium.HeightReference.NONE;
      break;
    case "billboard":
      locationGeos.label.heightReference = formData.isground
        ? Cesium.HeightReference.CLAMP_TO_GROUND
        : Cesium.HeightReference.NONE;
      locationGeos.billboard.heightReference = formData.isground
        ? Cesium.HeightReference.CLAMP_TO_GROUND
        : Cesium.HeightReference.NONE;
      break;
    case "Polyline":
      locationGeos.polyline.classificationType =
        formData.isground == true
          ? Cesium.ClassificationType.TERRAIN
          : Cesium.ClassificationType.BOTH; //多边形贴地形
      //locationGeos.polyline.clampToGround = formData.isground;
      break;
    case "Polygon":
      locationGeos.polygon.classificationType =
        formData.isground == true
          ? Cesium.ClassificationType.TERRAIN
          : Cesium.ClassificationType.BOTH; //多边形贴地形
      locationGeos.polygon.clampToGround = formData.isground;
      break;
    case "Cube":
      locationGeos.polygon.classificationType =
        formData.isground == true
          ? Cesium.ClassificationType.TERRAIN
          : Cesium.ClassificationType.BOTH; //多边形贴地形
      locationGeos.polygon.clampToGround = formData.isground;
      break;
    case "Text":
      locationGeos.label.heightReference = formData.isground
        ? Cesium.HeightReference.CLAMP_TO_GROUND
        : Cesium.HeightReference.NONE;
      break;
    case "SpaceLength":
      locationGeos.polyline.classificationType =
        formData.isground == true
          ? Cesium.ClassificationType.TERRAIN
          : Cesium.ClassificationType.BOTH; //多边形贴地形
      window.viewer.entities._entities._array.forEach((entity) => {
        if (entity.pid == editData.value.pid + "-Text") {
          entity.label.heightReference = formData.isground
            ? Cesium.HeightReference.CLAMP_TO_GROUND
            : Cesium.HeightReference.NONE;
        }
        if (entity.pid == editData.value.pid + "-Point") {
          entity.point.heightReference = formData.isground
            ? Cesium.HeightReference.CLAMP_TO_GROUND
            : Cesium.HeightReference.NONE;
        }
      });
      break;
  }
};

const closeSymbol = () => {
  symbolDialogVisible.value = false;
  cesiumInit.deactivate();
  cesiumAllowInit.deactivate();

  // formData = {}
};

defineExpose({
  showDialog,
});
</script>
<style scoped lang="scss">
@use "./symbolset.scss";
</style>
