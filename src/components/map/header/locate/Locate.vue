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
                <el-form :model="form">
                    <el-form-item label="服务类型">
                        <el-select
                            v-model="form.type"
                            placeholder="请选择服务类型"
                            value-key="pid"
                        >
                            <el-option
                                v-for="item in typeArr"
                                :label="item.label"
                                :value="item"
                                :key="item.pid"
                            ></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="服务地址">
                        <el-input
                            placeholder="请输入服务地址"
                            v-model="form.url"
                        ></el-input>
                    </el-form-item>
                    <el-form-item label="服务名称">
                        <el-input
                            placeholder="请输入服务名称"
                            v-model="form.url"
                        ></el-input>
                    </el-form-item>
                    <div class="form-btn">
                        <el-button type="primary">新增</el-button>
                    </div>
                </el-form>
                <el-divider content-position="left">服务列表</el-divider>
                <el-scrollbar max-height="20vh">
                    <el-tree
                        :props="layerProps"
                        show-checkbox
                        :data="layerData"
                        class="layer-tree"
                        empty-text="暂无数据"
                        ref="layerTree"
                        @check-change="changeLayerNode"
                        :highlight-current="true"
                        :render-after-expand="false"
                        node-key="pid"
                    >
                        <template #default="{ node, data }">
                            <span class="tree-label">{{ node.label }}</span>
                            <el-slider
                                v-model="data.opacity"
                                size="small"
                                @change="handleOpacity(node, data)"
                            />
                            <i class="iconfont icon-shanchu"></i>
                        </template>
                    </el-tree>
                </el-scrollbar>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
/* Vue 相关 */
import { ref, reactive, watch, toRaw, onMounted, onBeforeUnmount } from 'vue';
import useStore from '@/stores';
import * as Cesium from 'cesium';

/* UI 相关 */
import {
    ElMessage,
    type FormInstance,
    type FormRules,
    ElMessageBox,
} from 'element-plus';

/* API */
import { initLayerByKind } from '@/utils/common-map';

const { menuStore, viewStore, mapStore } = useStore();

/* 表单 */
const form = ref<any>({});
const typeArr = window.mapTypes;

/* 图层默认字段 */
const layerProps = {
    children: 'children',
    label: 'label',
    disabled: 'uncheck',
};

/* 图层树 */
const layerData = ref<any>([
    {
        pid: 1,
        kind: 16,
        label: '福清倾斜片区4',
        url: 'http://192.168.1.250:9003/model/tlwiuk8nv/tileset.json',
        visible: false,
        opacity: 100,
    },
    {
        pid: 2,
        kind: 16,
        label: '福清倾斜片区1',
        url: 'http://192.168.1.250:9003/model/tlwiuk8nv/tileset.json',
        visible: false,
        opacity: 100,
    },
]);

/* 图层点击事件 */
let addLayers = <any>[];
const changeLayerNode = async (data: any, isClick: boolean) => {
    if (data.level !== 3) return false;
    console.log(data, 'data');

    // 是否第一次加载
    let hasLayer = addLayers.filter((item: any) => {
        return item.pid == data.pid;
    });
    if (hasLayer.length <= 0) {
        // const layer = await initLayerByKind(window.viewer, data, true);
        // addLayers.push({
        //     layer,
        //     pid: data.pid,
        // });
        // hasLayer = layer;
    } else {
        hasLayer[0].layer.show = isClick;
    }
};

/* 图层滚动条拖动 */
const handleOpacity = (node: any, data: any) => {
    let hasLayer = addLayers.filter((item: any) => {
        return item.pid == data.pid;
    });

    // 倾斜摄影
    if (data.kind == 16) {
        hasLayer[0].layer.style = new Cesium.Cesium3DTileStyle({
            color: `color('rgba(255,255,255,${data.opacity / 100})')`,
        });
    }
    // geojson
    else if (data.kind == 14) {
        let entities = hasLayer[0].layer.entities.values;
        for (let i = 0; i < entities.length; i++) {
            let entity = entities[i];
            entity.polygon.material = Cesium.Color.RED.withAlpha(
                data.opacity / 100
            );
        }
    }
    // 其他
    else {
        hasLayer[0].layer.alpha = data.opacity / 100;
    }
};

/* 弹窗状态 */
const dialogVisible = ref(false);
const switchValue = ref(false);

/* 关闭弹窗 */
const closeDialog = () => {
    // 菜单恢复初始值
    if (menuStore.currFunc.code == 'qygh') {
        // menuStore.currFunc = null;
        window.viewer.entities.removeAll();
    }
};

/* 组件卸载 */
onBeforeUnmount(() => {
    window.viewer.entities.removeAll();
});

/* 组件加载 */
onMounted(() => {
    ElMessage.warning('4126546');
    dialogVisible.value = true;

});
</script>

<style scoped lang="scss">
@use './locate.scss';
</style>
