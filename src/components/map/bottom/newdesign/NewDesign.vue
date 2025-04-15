<template>
  <div class="bottom-bar" :class="menuStore.layerIsShow ? '' : 'bottom-transform'">
    <el-button type="primary" @click="handleAdd">
      <span>新增设计</span>
      <el-icon>
        <Setting />
      </el-icon>
    </el-button>
    <el-button
      v-for="item in btnList"
      :key="item.pid"
      type="primary"
      @click="editCommon(item)"
    >
      <span>{{ item.name }}</span>
      <i
        class="iconfont icon-shanchu"
        @click="delCommon(item.pid)"
        style="margin-left: 5px"
      ></i>
    </el-button>
  </div>
</template>

<script setup lang="ts">
/* Vue 相关 */
import {
    ref,
    reactive,
    watch,
    toRaw,
    onMounted,
    onBeforeUnmount,
    nextTick,
} from 'vue';
import useStore from '@/stores';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { encode, decode } from 'js-base64';

/* api */
import { getDataApi, delDataApi } from '../../header/adddesign/adddesign-api';

/* UI 相关 */
import {
    ElMessage,
    type FormInstance,
    type FormRules,
    ElMessageBox,
    ElTree,
} from 'element-plus';

const { menuStore, viewStore, mapStore } = useStore();
const { currFunc, commonListChange } = storeToRefs(menuStore);
const route = useRoute();

/* 底部按钮列表 */
const btnList = ref<any>([]);

/* 新增设计 */
const handleAdd = () => {
    menuStore.handleCommonListChange(0);
    currFunc.value = '';
    nextTick(() => {
        currFunc.value = {
            name: '新增设计',
            code: 'xzsj',
            com: 'AddDesign',
        };
    });
};

/* 编辑设计 */
const editCommon = (dataObj) => {
    if (isdel) {
        isdel = false;
        return;
    }
    menuStore.handleCommonListChange(dataObj.pid);
    currFunc.value = '';
    nextTick(() => {
        currFunc.value = {
            name: '编辑设计',
            code: 'bjsj',
            com: 'AddDesign',
            data: dataObj,
        };
    });
};

//加载设计列表
const getList = async () => {
    const prjid = JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId;
    const { data: res } = await getDataApi({
        prjid: prjid,
    });
    if (res.code !== 200) return ElMessage.warning(res.msg);
    console.log(res, 'res');
    btnList.value = res.data;
};

//删除设计
let isdel = false;
const delCommon = (pid) => {
    isdel = true;
    ElMessageBox.confirm('确认要删除该设计吗?', 'Warning', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            menuStore.handleCommonEditDel(true, pid);
            const { data: res } = await delDataApi({ pid: pid });
            if (res.code !== 200)
                return ElMessage({ type: 'error', message: res.msg });
            console.log(res, 'res');
            getList();
            ElMessage({ type: 'success', message: '删除成功！' });
        })
        .catch(() => {
            ElMessage({
                type: 'info',
                message: '取消操作！',
            });
        });
};

onMounted(() => {
    getList();
});

/* 监听设计列表变化 */
watch(commonListChange.value, (val) => {
    getList();
});
</script>

<style scoped lang="scss">
@use './newdesign.scss';
</style>
