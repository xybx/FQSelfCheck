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
                <div>
                    <el-button type="primary" @click="handleRender"
                        >开始分析</el-button
                    >
                    <el-button type="success" @click="handleExport"
                        >导出天际线</el-button
                    >
                    <el-button type="warning" @click="clearRender"
                        >清除</el-button
                    >
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
/* Vue 相关 */
import { ref, reactive, watch, toRaw, onMounted, onBeforeUnmount } from 'vue';
import useStore from '@/stores';
import * as Cesium from 'cesium';
import { ElMessage } from 'element-plus';

const { menuStore, viewStore, mapStore } = useStore();

/* 弹窗状态 */
const dialogVisible = ref(false);
const switchValue = ref(false);

/* 绘制范围 */
let skylineAnayStages = <any>null;
let silhouette = <any>null;
const handleRender = async () => {
    if (skylineAnayStages) {
        silhouette.enabled = true;
        return;
    }
    skylineAnayStages = window.viewer.scene.postProcessStages;
    let edgeDetection =
        Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    let postProccessStage = new Cesium.PostProcessStage({
        //此后处理阶段的唯一名称，供组合中其他阶段参考，如果未提供名称，将自动生成GUID
        //unform着色器对象 textureScale
        fragmentShader:
            // 声明一个纹理采样器 colorTexture 用于读取纹理颜色
            'uniform sampler2D colorTexture;' +
            // 声明一个纹理采样器 depthTexture 用于读取深度纹理
            'uniform sampler2D depthTexture;' +
            // 声明一个变量 v_textureCoordinates 是由顶点着色器提供的纹理坐标
            'in vec2 v_textureCoordinates;' +
            'out vec4 outColor;' +
            'void main(void)' +
            '{' +
            // 读取 v_textureCoordinates 处的深度值（cesium自定义，就是看他远近）
            'float depth = czm_readDepth(depthTexture, v_textureCoordinates);' +
            // 读取像素颜色
            'vec4 color = texture(colorTexture, v_textureCoordinates);' +
            // 如果不是边界，就是原来的颜色；如果是边界就赋值新色值
            'if(depth<1.0 - 0.000001){' +
            'outColor = color;' +
            '}' +
            'else{' +
            'outColor = vec4(1.0,0.0,0.0,1.0);' +
            '}' +
            '}',
    });

    //PostProcessStage:要使用的片段着色器。默认sampler2D制服是colorTexture和depthTexture。
    let postProccesStage_1 = new Cesium.PostProcessStage({
        // name:obj.name+'_1',
        fragmentShader:
            'uniform sampler2D colorTexture;' +
            'uniform sampler2D redTexture;' +
            'uniform sampler2D silhouetteTexture;' +
            'in vec2 v_textureCoordinates;' +
            'out vec4 outColor;' +
            'void main(void)' +
            '{' +
            'vec4 redcolor=texture(redTexture, v_textureCoordinates);' +
            'vec4 silhouetteColor = texture(silhouetteTexture, v_textureCoordinates);' +
            'vec4 color = texture(colorTexture, v_textureCoordinates);' +
            'if(redcolor.r == 1.0){' +
            'outColor = mix(color, vec4(5.0,0.0,0.0,1.0), silhouetteColor.a);' +
            '}' +
            'else{' +
            'outColor = color;' +
            '}' +
            '}',
        //uniform着色器对象
        uniforms: {
            redTexture: postProccessStage.name,
            silhouetteTexture: edgeDetection.name,
        },
    });

    //如果inputPreviousStageTexture 是 true，则每个阶段输入是场景渲染到的输出纹理或之前执行阶段的输出纹理
    //如果inputPreviousStageTexture是false，则合成中每个阶段的输入纹理都是相同的

    silhouette = new Cesium.PostProcessStageComposite({
        //PostProcessStage要按顺序执行 的 s 或组合的数组。
        stages: [edgeDetection, postProccessStage, postProccesStage_1],
        //是否执行每个后处理阶段，其中一个阶段的输入是前一个阶段的输出。否则每个包含阶段的输入是组合之前执行的阶段的输出
        inputPreviousStageTexture: false,
        //后处理阶段制服的别名
        s: edgeDetection.uniforms,
    } as any);
    skylineAnayStages.add(silhouette);
};

/* 清除天际线 */
const clearRender = () => {
    if (silhouette) {
        silhouette.enabled = false;
    }
};

/* 导出天际线图 */
const handleExport = () => {
    if (!skylineAnayStages || !silhouette.enabled)
        return ElMessage.warning('天际线分析功能未开启');
    saveToFile(window.viewer.scene);
};

const saveToFile = (scene: any) => {
    let canvas = scene.canvas;
    let image = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');

    let link = document.createElement('a');
    let blob = dataURLtoBlob(image);
    let objurl = URL.createObjectURL(blob);
    link.download = 'skyline.png';
    link.href = objurl;
    link.click();
};

const dataURLtoBlob = (dataurl: any) => {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

/* 关闭弹窗 */
const closeDialog = () => {};

/* 组件加载 */
onMounted(() => {
    dialogVisible.value = true;
});
</script>

<style scoped lang="scss">
@use './skyline.scss';
</style>
