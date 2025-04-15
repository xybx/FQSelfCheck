<template>
    <div class="tool-bar" :class="menuStore.layerIsShow ? '' : 'tool-transform'">
        <el-dialog v-model="dialogVisible" draggable :modal="false" :close-on-click-modal="false" class="tool-dialog"
            @close="closeDialog">
            <template #header>
                <span class="tool-title">
                    <span class="title-txt">{{ menuStore.currFunc.name }}</span>
                    <el-switch v-model="switchValue" inline-prompt active-text="可见" inactive-text="隐藏" class="menu-switch"
                        @change="changeVisible" />
                </span>
            </template>
            <div class="tool-main">
                <el-upload ref="upload" accept=".jpeg,.jpg,.png,.gif,.doc,.docx,.pdf,.dwg" name="files" :action="uploadUrl"
                    :headers="uploadHeaders" :data="uploadData" :show-file-list="false" :on-success="handleSuccess"
                    :before-upload="handleBeforeUpload" class="upload-demo">
                    <el-button type="primary">上传</el-button>
                </el-upload>
                <el-tree :props="layerProps" :data="layerData" class="layer-tree" empty-text="暂无数据" ref="layerTree"
                    :highlight-current="true" :render-after-expand="false" node-key="pid">
                    <template #default="{ node, data }">
                        <span class="custom-tree-node">
                            <span class="tree-text" :title="data.labelsort"><i v-if="data.datasource == 1 && data.level == 1"
                                    class="iconfont icon-tuzhiziliao_filled"></i><i
                                    v-if="data.datasource == 0 && data.level == 2"
                                    class="iconfont icon-shiyongwendang"></i>{{ node.label }}</span>
                            <span class="tree-tools" v-if="data.level == 2">
                                <span :class="data.datasource == 1 ? 'blue' : ''" @click="treelook(data)">查看</span>
                                <span v-if="data.datasource == 0" @click="treedel(data.pid)">删除</span>
                            </span>
                        </span>
                    </template>
                </el-tree>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
/* 依赖包 */
import {
    ref,
    reactive,
    watch,
    toRaw,
    onMounted,
    onBeforeUnmount,
    markRaw,
} from 'vue';
import useStore from '@/stores';
import * as Cesium from 'cesium';
import { useRoute } from 'vue-router';
import { delTree, getTreeList, downTreeFile } from './attachmentmaterial-api';
import {
    ElMessage,
    type FormInstance,
    type FormRules,
    ElMessageBox,
    ElTree,
} from 'element-plus';
import type {
    UploadInstance,
    UploadProps,
    UploadFile,
    UploadFiles,
    UploadRawFile,
} from 'element-plus';
import { Delete } from '@element-plus/icons-vue';
import { Base64 } from 'js-base64';
import { encode, decode } from 'js-base64';

const uploadRef = ref<UploadInstance>();
const uploadUrl = ref<string>('');
const uploadHeaders = ref<any>();
const uploadData = ref<any>();
/* API */

const route = useRoute();
const { menuStore, viewStore, mapStore } = useStore();
let viewer = <any>null;

/* 弹窗状态 */
const dialogVisible = ref(false);
const switchValue = ref(false);
const layerData = ref([]);
const layerProps = {
    children: 'children',
    label: 'label',
};
const getTreeData = async () => {
    let { data } = await getTreeList({
        prjid:JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId,
    });
    if (data.data.length > 0) {
        layerData.value = data.data.map((item: any) => {
            return {
                pid: item.pid,
                label: item.materialname,
                datasource: item.datasource,
                level: 1,
                children: item.files.length > 0 ? item.files.map((val: any) => {
                    return {
                        pid: val.pid,
                        label:val.filename.length > 16 ?  val.filename.slice(0,16) +'...' : val.filename,
                        labelsort:val.filename,
                        fileid: val.fileid,
                        extentname:val.extentname,
                        materialid: val.materialid,
                        datasource: val.datasource,
                        level: 2,
                    };
                }) : [],
            };
        });
    }
};
// 查看
const treelook = (item:any) => {
    let url = `${window.apiURL}/materiafile/downloadFile?fileid=${item.fileid}&fullfilename=picture.${item.extentname}&Authorization=${JSON.parse(sessionStorage.getItem('23vUser')).token}&loginType=system`;
    window.open(`${window.previewURL}${encodeURIComponent(Base64.encode(url))}`);
};

const treedel = (pid: number) => {
    ElMessageBox.confirm('你确定要删除吗？', '删除提示', {
        type: 'warning',
        icon: markRaw(Delete),
        draggable: true,
    })
        .then(async () => {
            let { data } = await delTree({ filepid: pid });
            if (data.code == 200) {
                ElMessage({
                    type: 'success',
                    message: '图片已删除',
                });
                await getTreeData();
            }
        })
        .catch(() => {
            ElMessage({
                type: 'info',
                message: '取消删除',
            });
        });
};
/* 关闭弹窗 */
const closeDialog = () => {
    // 菜单恢复初始值
    if (menuStore.currFunc?.code == 'fjcl') {
        menuStore.currFunc = null;
    }
    dialogVisible.value = false;
};
const getUpload = () => {
    uploadUrl.value = `${window.apiURL}/materiafile/upload`;
    uploadHeaders.value = {
        Authorization: JSON.parse(sessionStorage.getItem('23vUser')).token,
        loginType: 'system'
    };
    uploadData.value = {
        prjid: JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId,
    };
};
const handleBeforeUpload: UploadProps['beforeUpload'] = (
    rawFile: UploadRawFile
) => {
    if (rawFile.size > 20 * 1024 * 1024) {
        ElMessage({
            type: 'error',
            message: '请上传小于20M的图片!',
        });
        return false;
    }
};
const handleSuccess: UploadProps['onSuccess'] = async (
    response: any,
    file: UploadFile,
    fileList: UploadFiles
) => {
    ElMessage({
        type: 'success',
        message: '图片上传成功!',
    });
    await getTreeData();
};
const showDialog = () => {
    getUpload();
    getTreeData();
    dialogVisible.value = true;
};

import { addModuleVisible, getModuleById } from "@/utils/common-api";
let modulelist = ref([]);
let currentModule = ref(null);
//新增编辑模块的显示隐藏
const changeVisible = async () => {
    debugger;

    let res = await addModuleVisible({
        isvisible: switchValue.value ? 1 : 0,
        modulename: menuStore.currFunc?.name,
        pid: currentModule.value ? currentModule.value?.pid : 0,
        keystr: menuStore.currFunc?.code,
        prjid: JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId
    });
    if (res.data.code == 200) {
        console.log(res.data, "changeVisible");
        getModuleByPrjid();
    }
};

//获取所有模块的显示隐藏
const getModuleByPrjid = async () => {
    let res = await getModuleById({
        prjid: JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId,
    });
    if (res.data.code == 200) {
        console.log(res.data.data.list, "getModuleByPrjid");
        modulelist.value = res.data.data.list;

        if (modulelist.value.length > 0) {
            let queryModules = modulelist.value.filter(p => p.modulename == menuStore.currFunc.name);
            if (queryModules.length > 0) {
                currentModule.value = queryModules[0];
                switchValue.value = queryModules[0].isvisible == 1 ? true : false;
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
    showDialog();
    getModuleByPrjid();
});
</script>

<style scoped lang="scss">@use './attachmentmaterial.scss';</style>
