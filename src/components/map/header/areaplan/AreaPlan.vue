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
                        @change="changeVisible"
                    />
                </span>
            </template>
            <div class="tool-main">
                <el-form
                    :model="form"
                    ref="formRef"
                    :rules="rules"
                    :show-message="false"
                >
                    <el-form-item label="服务类型" prop="kind">
                        <el-select
                            v-model="form.kind"
                            placeholder="请选择服务类型"
                        >
                            <el-option
                                v-for="item in typeArr"
                                :label="item.label"
                                :value="item.kind"
                                :key="item.pid"
                            ></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="服务地址" prop="layerurl">
                        <el-input
                            placeholder="请输入服务地址"
                            v-model="form.layerurl"
                        ></el-input>
                    </el-form-item>
                    <el-form-item label="服务名称" prop="layername">
                        <el-input
                            placeholder="请输入服务名称"
                            v-model="form.layername"
                        ></el-input>
                    </el-form-item>
                    <div class="form-btn">
                        <el-button type="primary" @click="handleAdd(formRef)"
                            >新增</el-button
                        >
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
                            <i
                                class="iconfont icon-shanchu"
                                @click="handleDel(node, data)"
                            ></i>
                        </template>
                    </el-tree>
                </el-scrollbar>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
/* 依赖包 */
import { ref, reactive, watch, toRaw, onMounted, onBeforeUnmount } from 'vue';
import useStore from '@/stores';
import * as Cesium from 'cesium';
import { useRoute } from 'vue-router';
import {
    ElMessage,
    type FormInstance,
    type FormRules,
    ElMessageBox,
} from 'element-plus';
import { encode, decode } from 'js-base64';

/* API */
import { initLayerByKind } from '@/utils/common-map';
import { getDataApi, insertDataApi, delDataApi } from './areaplan-api';
import { addModuleVisible, getModuleById } from '@/utils/common-api';

const { menuStore, viewStore, mapStore } = useStore();
const route = useRoute();

/* 地图实例 */
let viewer = <any>null;

/* 表单 */
const form = ref<any>({});
const typeArr = window.mapTypes;
const formRef = ref<FormInstance>();
const rules = reactive<any>({
    kind: [{ required: true, message: '类型不能为空', trigger: 'change' }],
    layerurl: [
        { required: true, message: '服务地址不能为空', trigger: 'blur' },
    ],
    layername: [
        { required: true, message: '服务名称不能为空', trigger: 'blur' },
    ],
});

/* 图层默认字段 */
const layerProps = {
    children: 'children',
    label: 'layername',
};

/* 图层树 */
const layerData = ref<any>([]);

/* 图层点击事件 */
let addLayers = <any>[];
let currLayer = <any>null;
const changeLayerNode = async (data: any, isClick: boolean) => {
    // 是否第一次加载
    let hasLayer = addLayers.filter((item: any) => {
        return item.pid == data.pid;
    });
    console.log(hasLayer);

    debugger;
    if (hasLayer.length <= 0) {
        // 组装数据
        let params = Object.assign({}, data, {
            label: data.layername,
            url: data.layerurl,
        });
        currLayer = await initLayerByKind(viewer, params, true);
        addLayers.push({
            layer: currLayer,
            pid: data.pid,
            kind: data.kind,
        });
        // hasLayer = currLayer;
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
        hasLayer[0].layer.value.style = new Cesium.Cesium3DTileStyle({
            color: `color('rgba(255,255,255,${data.opacity / 100})')`,
        });
    }
    // geojson
    else if (data.kind == 14) {
        let entities = hasLayer[0].layer.value.entities.values;
        for (let i = 0; i < entities.length; i++) {
            let entity = entities[i];
            entity.polygon.material = Cesium.Color.RED.withAlpha(
                data.opacity / 100
            );
        }
    }
    // 其他
    else {
        hasLayer[0].layer.value.alpha = data.opacity / 100;
    }
};

/* 新增服务 */
const handleAdd = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate(async (valid, fields) => {
        if (!valid) return ElMessage.warning('请补充必填项');
        const prjid = JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId;
        let params = Object.assign({}, form.value, {
            prjid: prjid,
        });
        const { data: res } = await insertDataApi(params);
        if (res.code !== 200) return ElMessage.warning(res.msg);
        ElMessage.success(res.msg);
        layerData.value.push(res.data);
        formEl.resetFields();
    });
};

/* 弹窗状态 */
const dialogVisible = ref(false);
const switchValue = ref(false);

/* 关闭弹窗 */
const closeDialog = () => {
    // 菜单恢复初始值
    if (menuStore.currFunc?.code == 'qygh') {
        menuStore.currFunc = null;
    }
    window.viewer.entities.removeAll();
    formRef.value.resetFields();
    addLayers.map((item: any) => {
        if (item.kind == 16) {
            viewer.scene.primitives.remove(item.layer.value);
        } else {
            viewer.imageryLayers.remove(item.layer.value);
        }
    });
};

/* 获取列表 */
const getList = async () => {   
    let params = {
        prjid: JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId,
    };
    const { data: res } = await getDataApi(params);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    layerData.value = res.data;
};

/* 列表项删除 */
//TODO 传递参数不够，还需加上项目编号
const handleDel = async (node: any, data: any) => {
    let params = {
        pid: data.pid,
    };
    const { data: res } = await delDataApi(params);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    ElMessage.success(res.msg);
    const index = layerData.value.findIndex(
        (item: any) => item.pid == data.pid
    );
    if (index == -1) return;
    layerData.value.splice(index, 1);
};

let modulelist = ref([]);
let currentModule = ref(null);
//新增编辑模块的显示隐藏
const changeVisible = async () => {
    debugger;

    let res = await addModuleVisible({
        isvisible: switchValue.value ? 1 : 0,
        modulename: menuStore.currFunc.name,
        pid: currentModule.value ? currentModule.value.pid : 0,
        keystr: menuStore.currFunc.code,
        prjid: JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId,
    });
    if (res.data.code == 200) {
        console.log(res.data, 'changeVisible');
        getModuleByPrjid();
    }
};

//获取所有模块的显示隐藏
const getModuleByPrjid = async () => {
    let res = await getModuleById({
        prjid:JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId,
    });
    if (res.data.code == 200) {
        console.log(res.data.data.list, 'getModuleByPrjid');
        modulelist.value = res.data.data.list;

        if (modulelist.value.length > 0) {
            let queryModules = modulelist.value.filter(
                (p) => p.modulename == menuStore.currFunc.name
            );
            if (queryModules.length > 0) {
                currentModule.value = queryModules[0];
                switchValue.value =
                    queryModules[0].isvisible == 1 ? true : false;
            }
        }
    }
};

/* 组件卸载 */
onBeforeUnmount(() => {
    closeDialog();
});

/* 组件加载 */
onMounted(() => {
    dialogVisible.value = true;
    viewer = window.viewer;
    getModuleByPrjid();
    getList();
});
</script>

<style scoped lang="scss">
@use './areaplan.scss';
</style>
