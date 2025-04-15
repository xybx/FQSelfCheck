<template>
    <el-button
        class="check-box"
        @click="onShowStep"
        v-if="route.query.u"
        :disabled="checkDisabled"
    >
        <i class="iconfont icon-chengshidizhi"></i>
        <span>模型自检</span>
    </el-button>
    <transition name="el-fade-in-linear">
        <div class="step-box" v-if="showStep">
            <el-button type="primary" v-popover="ref1" @click="onStepBtn(0)"
                >1. 位置自检</el-button
            >
            <el-button
                type="primary"
                v-popover="ref2"
                @click="onStepBtn(1)"
                :disabled="currId < 1"
                >2. 高程自检</el-button
            >
            <el-button
                type="primary"
                v-popover="ref3"
                @click="onStepBtn(2)"
                :disabled="currId < 2"
                >3. 白模自检</el-button
            >
            <el-button
                type="primary"
                @click="onStepBtn(3)"
                :disabled="currId < 3"
                >4. 生成报告</el-button
            >
        </div>
    </transition>

    <!-- 1. 位置自检 -->
    <el-popover
        ref="ref1"
        trigger="click"
        virtual-triggering
        persistent
        placement="left-start"
        popper-class="step-poper"
        :visible="currVisibleStep === 0"
    >
        <div class="tool-main">
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
                <el-button type="primary" @click="handleKeepModel"
                    >保存</el-button
                >
                <el-button type="warning" @click="handleClose">关闭</el-button>
            </div>
        </div>
    </el-popover>
    <!-- 2. 高程自检 -->
    <el-popover
        ref="ref2"
        trigger="click"
        virtual-triggering
        persistent
        placement="left-start"
        popper-class="step-poper"
        :visible="currVisibleStep === 1"
    >
        <div class="tool-main">
            <div class="tool-item">
                <div class="label">模型高度：</div>
                <el-input-number
                    v-model="viewStore.currRedLineMinHeight"
                    @change="changeModelHeight"
                    :min="0"
                />
            </div>
            <div class="tool-item">
                <el-button type="primary" @click="handleKeepModel"
                    >保存</el-button
                >
                <el-button type="warning" @click="handleClose">关闭</el-button>
            </div>
        </div>
    </el-popover>
    <!-- 3. 白模自检 -->
    <el-popover
        ref="ref3"
        trigger="click"
        virtual-triggering
        persistent
        placement="left-start"
        popper-class="step-poper"
        :visible="currVisibleStep === 2"
    >
        <div class="tool-main">
            <div class="tool-item">
                <div class="label">白模高度：</div>
                <el-input-number
                    v-model="viewStore.modelOrgMatrix.whiteHeight"
                    @change="changeWhiteHeight"
                    :min="0"
                />
            </div>
            <div class="tool-item">
                <el-button type="primary" @click="handleKeepModel"
                    >保存</el-button
                >
                <el-button type="warning" @click="handleClose">关闭</el-button>
            </div>
        </div>
    </el-popover>
</template>

<script lang="ts" setup>
/* 依赖包 */
import { ref, onMounted, unref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import useStore from "@/stores";
import html2canvas from "html2canvas";
import {
    setModelHeight,
    update3dtilesMaxtrix,
    get3DTilesCenterAndMatrix,
} from "@/utils/common-map";
import {
    getModuleConfig,
    setModuleConfig,
    getProjectById,
} from "@/utils/common-api";
import {
    getFileDataApi,
    getStatusApi,
    uploadPicApi,
    getPdfFileApi,
    getStreamDataApi,
} from "./check-api";
import * as Cesium from "cesium";

const { menuStore, viewStore, mapStore } = useStore();
const route = useRoute();

/* 步骤显隐 */
const showStep = ref(false);
const onShowStep = async () => {
    showStep.value = !showStep.value;
    if (showStep.value) {
        // await getStatus();
        await get3DTilesCenterAndMatrix(window.modelLayer);
        await getRedPrj();
    } else {
        currVisibleStep.value = -1;
        whiteArray.entities.removeAll();
        window.viewer.dataSources.remove(whiteArray);
    }
};

const dataPid = ref<any>();
const checkDisabled = ref(false);
const getStatus = async () => {
    let params = {
        prjId: JSON.parse(sessionStorage.getItem("23vUser") as string)
            ?.projectId,
    };
    const { data: res } = await getStatusApi(params, route.query.u);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    console.log(res, "statusres");
    currId.value = res.data.status;
    // dataPid.value = res.data.dataPid;
    checkDisabled.value = !res.data.edit;
};

/* 控制popover关闭 */
const popoverVisible = ref(false);
const handleClose = async () => {
    // currId.value = 0;
    currVisibleStep.value = -1;
    await get3DTilesCenterAndMatrix(window.modelLayer);
    changeModel();
    whiteArray.entities.removeAll();
    window.viewer.dataSources.remove(whiteArray);
};

/* 步骤列表 */
const ref1 = ref();
const ref2 = ref();
const ref3 = ref();

/* 模型调整 */
const changeModel = () => {
    let params = {
        tx: viewStore.modelOrgMatrix.modelx, //模型中心X轴坐标（经度，单位：十进制度）
        ty: viewStore.modelOrgMatrix.modely, //模型中心Y轴坐标（纬度，单位：十进制度）
        tz: viewStore.currRedLineMinHeight, //模型中心Z轴坐标（高程，单位：米）
        rx: viewStore.modelOrgMatrix.modelanglex, //X轴（经度）方向旋转角度（单：度）
        ry: viewStore.modelOrgMatrix.modelangley, //Y轴（纬度）方向旋转角度（单位：度）
        rz: viewStore.modelOrgMatrix.modelanglez, //Z轴（高程）方向旋转角度（单位：度）
    };
    console.log(params, viewStore.modelOrgMatrix);
    update3dtilesMaxtrix(window.modelLayer, params);
};

/* 模型高度 */
const changeModelHeight = () => {
    let params = {
        tx: viewStore.modelOrgMatrix.modelx, //模型中心X轴坐标（经度，单位：十进制度）
        ty: viewStore.modelOrgMatrix.modely, //模型中心Y轴坐标（纬度，单位：十进制度）
        tz: viewStore.currRedLineMinHeight,
        rx: viewStore.modelOrgMatrix.modelanglex, //X轴（经度）方向旋转角度（单：度）
        ry: viewStore.modelOrgMatrix.modelangley, //Y轴（纬度）方向旋转角度（单位：度）
        rz: viewStore.modelOrgMatrix.modelanglez, //Z轴（高程）方向旋转角度（单位：度）
    };
    setModelHeight(window.modelLayer, params);
};

/* 按钮禁用 */
const currId = ref<number>();
const currVisibleStep = ref<number>();
const onStepBtn = async (id: number) => {
    if (!window.modelLayer) return ElMessage.warning("请先叠加方案模型");

    // await getStatus()
    if ([0, 1].includes(id)) {
        await get3DTilesCenterAndMatrix(window.modelLayer);
        whiteArray.entities.removeAll();
        window.viewer.dataSources.remove(whiteArray);
    } else if (id === 2) {
        if (currId.value == id && currVisibleStep.value == id) return false;
        await get3DTilesCenterAndMatrix(window.modelLayer);
        await getWhiteData();
    } else if (id === 3) {
        await createPDF();
    }
    currId.value = id;
    currVisibleStep.value = id;
};

/* 1、2：保存模型 */
const handleKeepModel = async () => {
    let params: any;
    if (currId.value === 0) {
        params = {
            modelX: viewStore.modelOrgMatrix.modelx, //模型中心X轴坐标（经度，单位：十进制度）
            modelY: viewStore.modelOrgMatrix.modely, //模型中心Y轴坐标（纬度，单位：十进制度）
            rotateX: viewStore.modelOrgMatrix.modelanglex, //X轴（经度）方向旋转角度（单：度）
            rotateY: viewStore.modelOrgMatrix.modelangley, //Y轴（纬度）方向旋转角度（单位：度）
            rotateZ: viewStore.modelOrgMatrix.modelanglez, //Z轴（高程）方向旋转角度（单位：度）
            projectCode: JSON.parse(sessionStorage.getItem("23vUser") as string)
                ?.dzbpPassword,
        };
        const { data: res } = await setModuleConfig(params, route.query.u);
        if (res.code !== 200) return ElMessage.warning(res.msg);
        ElMessage.success(res.msg);
        currId.value += 1;
        currVisibleStep.value = -1;
    }
    // 高程自检
    else if (currId.value === 1) {
        params = {
            modelHeight: viewStore.currRedLineMinHeight, //模型中心Z轴坐标（高程，单位：米）
            projectCode: JSON.parse(sessionStorage.getItem("23vUser") as string)
                ?.dzbpPassword,
        };
        const { data: res } = await setModuleConfig(params, route.query.u);
        if (res.code !== 200) return ElMessage.warning(res.msg);
        ElMessage.success(res.msg);
        // 先保存数据再上传图片
        await screenShot();
        currId.value += 1;
        currVisibleStep.value = -1;
    }
    // 白模自检
    else if (currId.value === 2) {
        params = {
            whiteHeight: viewStore.modelOrgMatrix.whiteHeight,
            projectCode: JSON.parse(sessionStorage.getItem("23vUser") as string)
                ?.dzbpPassword,
        };
        const { data: res } = await setModuleConfig(params, route.query.u);
        if (res.code !== 200) return ElMessage.warning(res.msg);
        ElMessage.success(res.msg);
        // 先保存数据再上传图片
        const receiveInfo = await screenShot();
        if (!receiveInfo) {
            currId.value += 1;
            currVisibleStep.value = -1;
        }
    }
};

/* 3：拉伸白模 */
// let whiteModel = <any>null;
let whiteArray = <any>null;
const stretchWhiteModel = (arr: any) => {
    arr.forEach((el: any) => {
        let whiteModel = <any>null;
        let cartesian = Cesium.Cartesian3.fromDegreesArray(
            el.wktData[0].flat(Infinity)
        );
        debugger;
        whiteModel = new Cesium.Entity({
            polygon: {
                hierarchy: new Cesium.CallbackProperty(() => {
                    return new Cesium.PolygonHierarchy(cartesian);
                }, false),
                material: Cesium.Color.WHITE.withAlpha(1),
                extrudedHeight:
                    Number(el.jzgd) + viewStore.modelOrgMatrix.whiteHeight,
                height: 0 + viewStore.modelOrgMatrix.whiteHeight,
                // outline: true,
                // outlineWidth: 1,
                // outlineColor: Cesium.Color.GRAY,
            },
        });
        whiteModel.customHeight = Number(el.jzgd);
        whiteArray.entities.add(whiteModel);
        window.viewer.flyTo(whiteModel);
    });

    window.viewer.dataSources.add(whiteArray);
};

const changeWhiteHeight = (val: number) => {
    if (whiteArray.entities.values.length <= 0)
        return ElMessage.warning("当前没有白模数据");
    whiteArray.entities.values.forEach((item: any) => {
        item.polygon.extrudedHeight = val + item.customHeight;
        item.polygon.height = val;
    });
};

const whiteData = ref<any>();
const getWhiteData = async () => {
    let params = {
        prjId: JSON.parse(sessionStorage.getItem("23vUser") as string)
            ?.projectId,
    };
    const { data: res } = await getFileDataApi(params, route.query.u);
    console.log(res, "whiteres");
    if (res.code !== 200) return ElMessage.warning(res.msg);
    whiteData.value = res.data;
    if ([2, 3].includes(currId.value) && [2, 3].includes(currVisibleStep.value))
        return false;
    stretchWhiteModel(whiteData.value);
};

/* 截图 */
const screenShot = async () => {
    const canvas = await html2canvas(document.getElementById("map"), {
        backgroundColor: null, //画出来的图片有白色的边框,不要可设置背景为透明色（null）
        useCORS: true, //支持图片跨域
        scale: 1, //设置放大的倍数
    });
    let img = new Image();
    img.src = canvas.toDataURL("image/jpeg"); // toDataURL :图片格式转成 base64
    let params: any;
    // 高程
    if (currId.value == 1) {
        params = {
            img: img.src,
            prjId: JSON.parse(sessionStorage.getItem("23vUser") as string)
                ?.projectId,
            status: currId.value + 1,
        };
    }
    // 白模
    else if (currId.value == 2) {
        params = {
            img: img.src,
            prjId: JSON.parse(sessionStorage.getItem("23vUser") as string)
                ?.projectId,
            status: currId.value + 1,
            // dataPid: dataPid.value,
        };
    }

    const { data: res } = await uploadPicApi(params, route.query.u);
    if (res.code !== 200) return ElMessage.warning(res.msg);
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
    console.log(redJson.value, "红线数据");
};

// 生成报告
const createPDF = async () => {
    let pid = JSON.parse(
        sessionStorage.getItem("23vUser") as string
    )?.projectId;
    const { data: res } = await getPdfFileApi(pid, route.query.u);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    ElMessage.success(res.msg);
    // 文件预览
    const fileRes = await getStreamDataApi(pid, route.query.u);
    if (fileRes.status !== 200) return ElMessage.warning(fileRes.statusText);
    let bData = [];
    bData.push(fileRes.data);
    window.open(
        window.URL.createObjectURL(new Blob(bData, { type: "application/pdf" }))
    );
};

/* 组件加载 */
onMounted(async () => {
    whiteArray = new Cesium.CustomDataSource("whiteCollection");
    // window.viewer.dataSources.add(whiteArray);
    if (route.query.u) {
        await getStatus();
    }
});
</script>

<style lang="scss" scoped>
@use "./check.scss";
</style>
