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
                    <!-- <el-switch v-model="switchValue" inline-prompt active-text="可见" inactive-text="隐藏" class="menu-switch" /> -->
                </span>
            </template>
            <div class="tool-main">
                <el-form :model="form" :inline="true">
                    <!-- <el-form-item label="项目红线" style="margin-right: 10px">
                        <div class="options">
                            <el-checkbox
                                v-model="form.checked"
                                label="叠加"
                                size="large"
                                @change="changeCheck"
                            />
                            <el-input
                                v-model="form.json"
                                :rows="8"
                                type="textarea"
                            ></el-input>
                            <el-button
                                type="primary"
                                @click="drawRedLine"
                                v-if="editFlag"
                                >绘制</el-button
                            >
                        </div>
                    </el-form-item> -->
                    <div class="style">
                        <el-form-item label="轮廓颜色">
                            <el-color-picker
                                v-model="form.outlineColor"
                                show-alpha
                                @change="changeOutlineColor"
                            />
                        </el-form-item>
                        <el-form-item label="轮廓宽度" class="width">
                            <div class="range">
                                <el-input-number
                                    v-model="form.outlineWidth"
                                    :min="1"
                                    @change="changeOutlineWith"
                                />
                            </div>
                            <!-- <el-input v-model="form.outlineWidth" show-alpha style="text-align: center" /> -->
                        </el-form-item>
                        <el-form-item label="填充颜色">
                            <el-color-picker
                                v-model="form.fillColor"
                                @change="changeFillColor"
                            />
                        </el-form-item>
                    </div>
                    <el-form-item label="透明度">
                        <el-slider
                            v-model="form.opacity"
                            size="small"
                            @change="handleOpacity()"
                        />
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <!-- <span class="dialog-footer"> -->
                <el-button type="primary" @click="saveForm" v-if="editFlag"
                    >保存</el-button
                >
                <el-button type="warning" @click="closeDialog">关闭</el-button>
                <!-- </span> -->
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
/* 依赖包 */
import { ref, onMounted, onBeforeUnmount, shallowRef } from "vue";
import useStore from "@/stores";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css"; // 引入 css
import { encode, decode } from "js-base64";

/* UI 相关 */
import { ElTree } from "element-plus";
import { useRoute } from "vue-router";
import * as Cesium from "cesium";
/*绘制图形 */
import drawInit from "@/utils/plugins/MilitaryPlotDraw";
import {
    ElMessage,
    type FormInstance,
    type FormRules,
    ElMessageBox,
} from "element-plus";

/* api */
import { saveDataApi } from "./RedLine-api";
import { getProjectById } from "@/utils/common-api";
import { fromBase64 } from "js-base64";

const { menuStore, viewStore, mapStore } = useStore();
const route = useRoute();
/* 弹窗状态 */
const dialogVisible = ref(false);

/* 表单 */
const form = ref({
    checked: true,
    json: "",
    outlineColor: "#ffd700",
    outlineWidth: 2,
    fillColor: "#00d7ff",
    opacity: 20,
    isground: true, //是否贴地（true:默认贴地）
    classificationtype: "2", //贴地设置：对应cesium的ClassificationType【枚举】属性包含（TERRAIN：0，CESIUM_3D_TILE：1，BOTH：2）
});

/* 关闭弹窗 */
const closeDialog = () => {
    // 菜单恢复初始值
    if (menuStore.currFunc.code == "ydhx") {
        // menuStore.currFunc = null;
        menuStore.handleFunc("");
    }
    drawInit.deactivate();
    // window.viewer.entities.removeAll();
    let checkedLayerIds = menuStore.treeRef.value.getCheckedKeys();
    // 项目红线为1800
    if (!checkedLayerIds.includes(1800)) {
        window.viewer.entities.removeAll();
    }
};

/* 初始化绘制工具 */
let geoJson = ref(null);
let redlineGeo = ref(null);
const initTool = () => {
    if (drawInit.militaryPlotLayer?.geoEntity) {
        window.viewer.entities.remove(drawInit.militaryPlotLayer.geoEntity);
    }

    drawInit.init(window.viewer);
    drawInit.clear();
    drawInit.plotDraw.PlotDrawEndEvent.addEventListener(
        async (drawPlot, type) => {
            drawPlot.remove(); //移除绘制的对象
            //console.log(drawPlot.toGeoJson(), "this.militaryPlotLayer");
            drawInit.militaryPlotLayer.addPlot(
                drawPlot.toGeoJson(),
                drawInit.plotTypeObject
            ); //将标绘对象添加到图层中进行管理
            //转geojson
            geoJson = drawPlot.toGeoJson();

            redlineGeo = drawInit.militaryPlotLayer.geoEntity;
            console.log(geoJson, "geoJson");
            form.value.json = JSON.stringify(geoJson, null, "\t");
        }
    );

    // cesiumAllowInit.drawActivate(symbol);
};

/* 获取项目方案信息 */
const getProjectScheme = async () => {
    let params = {
        pid: JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
    };
    const { data: res } = await getProjectById(params);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    if (res.data != null) {
        geoJson = JSON.parse(res.data.redlinedata);
        let symbol = geoJson.properties.attr;
        form.value.json = JSON.stringify(geoJson, null, "\t");
        form.value.checked = symbol.defaultShow;
        form.value.outlineColor = symbol.outlinecolor;
        form.value.outlineWidth = symbol.outlinewidth;
        form.value.fillColor = symbol.color;
        form.value.opacity = Number(symbol.opacity) * 100;
        form.value.isground = symbol.isground;
        form.value.classificationtype = symbol.classificationtype;
        //叠加到地图上
        drawInit.militaryPlotLayer.addPlot(geoJson, symbol);
        redlineGeo = drawInit.militaryPlotLayer.geoEntity;
    }
};

// 保存按钮
const saveForm = async () => {
    let dataParams = {
        pid: JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId,
        redlinedata: JSON.stringify(geoJson),
    };
    const { data: res } = await saveDataApi(dataParams);
    console.log(res, "res");
    if (res.code !== 200) return ElMessage.warning(res.msg);
    else return ElMessage.success(res.msg);
};

// 绘制按钮
const drawRedLine = () => {
    debugger;
    form.value.json = "";
    window.viewer.entities.removeAll();
    let symbol = {
        type: "polygon",
        color: form.value.fillColor,
        outlinewidth: form.value.outlineWidth,
        outlinecolor: form.value.outlineColor,
        isground: form.value.isground,
        classificationtype: form.value.classificationtype,
        opacity: form.value.opacity / 100,
        defaultShow: form.value.checked,
    };
    drawInit.drawActivate(symbol);
};
//叠加变化
const changeCheck = (obj) => {
    if (!geoJson) {
        return;
    }
    geoJson.properties.attr.defaultShow = obj;
    form.value.json = JSON.stringify(geoJson, null, "\t");
};
//改变轮廓颜色
const changeOutlineColor = () => {
    if (!geoJson || !redlineGeo) {
        return;
    }
    geoJson.properties.attr.outlinecolor = form.value.outlineColor;
    redlineGeo.polyline.material = Cesium.Color.fromCssColorString(
        form.value.outlineColor
    );
    form.value.json = JSON.stringify(geoJson, null, "\t");
};

//改变轮廓宽度
const changeOutlineWith = () => {
    if (!geoJson || !redlineGeo) {
        return;
    }
    geoJson.properties.attr.outlinewidth = form.value.outlineWidth;
    redlineGeo.polyline.width = form.value.outlineWidth;
    form.value.json = JSON.stringify(geoJson, null, "\t");
};

//改变填充显色
const changeFillColor = () => {
    if (!geoJson || !redlineGeo) {
        return;
    }
    geoJson.properties.attr.color = form.value.fillColor;
    redlineGeo.polygon.material = Cesium.Color.fromCssColorString(
        form.value.fillColor
    ).withAlpha(form.value.opacity / 100);
    form.value.json = JSON.stringify(geoJson, null, "\t");
};
// 透明度滑动条
const handleOpacity = () => {
    if (!geoJson || !redlineGeo) {
        return;
    }
    geoJson.properties.attr.opacity = form.value.opacity / 100;
    redlineGeo.polygon.material = Cesium.Color.fromCssColorString(
        form.value.fillColor
    ).withAlpha(form.value.opacity / 100);
    form.value.json = JSON.stringify(geoJson, null, "\t");
};

/* 组件卸载 */
onBeforeUnmount(() => {
    closeDialog();
});

/* 组件加载 */
//判断是否可编辑
let editFlag = ref(false);
onMounted(() => {
    editFlag = window.editFlag;
    dialogVisible.value = true;
    initTool();
    getProjectScheme();
    // viewer = window.viewer;
    // getProjectScheme();
    // setWatchView();
});
</script>

<style scoped lang="scss">
@use "./RedLine.scss";
</style>
