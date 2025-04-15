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
            @change="changeVisible"
          />
        </span>
      </template>
      <div class="tool-main">
        <div class="form-box">
          <el-input
            v-model.trim="inputValue"
            placeholder="请输入视角名称"
            clearable
          ></el-input>
          <el-button type="primary" @click="handleAdd" v-if="editFlag"
            >增加视角</el-button
          >
        </div>
        <el-divider content-position="left">视角列表</el-divider>
        <ul class="viewport-ul">
          <li
            v-for="item in fovList"
            :key="item.pid"
            @click="handleClick(item)"
            :class="item.pid == currPid ? 'curr-li' : ''"
          >
            <span>{{ item.name }}</span>
            <i class="iconfont icon-shanchu" @click="handleDel(item)"></i>
          </li>
        </ul>
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
import { getDataApi, insertDataApi, delDataApi } from './manydimesion-api';

const route = useRoute();
const { menuStore, viewStore, mapStore } = useStore();
let viewer = <any>null;

/* 输入框值 */
const inputValue = ref<string>('');

/* 视角列表 */
const fovList = ref<any>([]);

/* 获取列表 */
const getList = async () => {
    let params = {
        prjid: JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId,
    };
    const { data: res } = await getDataApi(params);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    fovList.value = res.data;
};

/* 增加视角 */
const handleAdd = async () => {
    if (inputValue.value == '') return ElMessage.warning('名称不能为空');
    let cartoGraphic = viewer.camera.positionCartographic;
    let setView = {
        //当前位置
        sceneZb: {
            heading: viewer.scene.camera.heading,
            pitch: viewer.scene.camera.pitch,
            roll: viewer.scene.camera.roll,
        },
        //相机角度
        destination: [
            Number((cartoGraphic.longitude * 180) / Math.PI),
            Number((cartoGraphic.latitude * 180) / Math.PI),
            Number(cartoGraphic.height.toFixed(1)),
        ],
    };

    // 组装参数
    let params = {
        mapparams: JSON.stringify(setView),
        prjid: JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId,
        name: inputValue.value,
    };

    const { data: res } = await insertDataApi(params);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    ElMessage.success(res.msg);
    fovList.value.push(res.data);
    inputValue.value = '';
};

/* 视角点击 */
const currPid = ref<number>();
const handleClick = (item: any) => {
    currPid.value = item.pid;
    window.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
            // @ts-ignore
            ...JSON.parse(item.mapparams).destination
        ),
        orientation: {
            ...JSON.parse(item.mapparams).sceneZb,
        },
        duration: 1,
    });
};

/* 删除视角 */
//TODO 传递参数不够，还需加上项目编号
const handleDel = async (item: any) => {
    let params = {
        pid: item.pid,
    };
    const { data: res } = await delDataApi(params);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    ElMessage.success(res.msg);
    const index = fovList.value.findIndex((item: any) => item.pid == item.pid);
    if (index == -1) return;
    fovList.value.splice(index, 1);
};

/* 弹窗状态 */
const dialogVisible = ref(false);
const switchValue = ref(false);

/* 关闭弹窗 */
const closeDialog = () => {
    // 菜单恢复初始值
    if (menuStore.currFunc?.code == 'dwsj') {
        menuStore.currFunc = null;
    }
    inputValue.value = '';
};

import { addModuleVisible, getModuleById } from "@/utils/common-api";
let modulelist = ref([]);
let currentModule = ref(null);
//新增编辑模块的显示隐藏
const changeVisible = async () => {
    debugger;

    let res = await addModuleVisible({
        isvisible: switchValue.value ? 1 : 0,
        modulename: menuStore.currFunc.name,
        pid: currentModule.value ? currentModule.value.pid : 0,
        keystr:menuStore.currFunc.code,
        prjid:JSON.parse(
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
//判断是否可编辑
let editFlag = ref(false);
onMounted(() => {
  editFlag = window.editFlag;
    dialogVisible.value = true;
    viewer = window.viewer;
    getModuleByPrjid();
    getList();
});
</script>

<style scoped lang="scss">
@use './manydimension.scss';
</style>
