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
          <span class="title-txt">{{ titleText }}</span>
        </span>
      </template>
      <div class="tool-main">
        <el-scrollbar>
          <el-descriptions class="margin-top" size="small" :column="3" border>
            <el-descriptions-item
              v-for="(item, index) in indexData"
              :key="index"
              :span="item.cols"
            >
              <template #label>
                <div class="cell-item">{{ item.label }}</div>
              </template>
              {{ item.value }}
            </el-descriptions-item>
          </el-descriptions>
        </el-scrollbar>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/* 依赖包 */
import { ref, reactive, watch, toRaw, onMounted, onBeforeUnmount } from "vue";
import useStore from "@/stores";
import { useRoute } from "vue-router";
import {
  ElMessage,
  type FormInstance,
  type FormRules,
  ElMessageBox,
  ElTree,
} from "element-plus";

const route = useRoute();
const { menuStore, viewStore, mapStore } = useStore();

/* 指标列表 */
const indexData = ref<any>([
  {
    label: "建筑物名称",
    value: "01#",
    cols: 3,
    name: "buildname",
  },
  {
    label: "建筑层数",
    value: "25",
    cols: 1,
    name: "jzcs",
  },
  {
    label: "建筑使用性质",
    value: "住宅",
    cols: 1,
    name: "jzsyxz",
  },
  {
    label: "建筑高度",
    value: "0",
    cols: 1,
    name: "jzgd",
  },
  {
    label: "总建筑面积",
    value: "11820.94",
    cols: 1,
    name: "zjzmj",
  },
  {
    label: "地上建筑面积",
    value: "11820.94",
    cols: 1,
    name: "dsjmj",
  },
  {
    label: "地下建筑面积",
    value: "0",
    cols: 1,
    name: "dxjzmj",
  },
  {
    label: "总计容建筑面积",
    value: "11225.95",
    cols: 1,
    name: "zjrjzmj",
  },
  {
    label: "地上计容建筑面积",
    value: "11225.95",
    cols: 1,
    name: "dsjrjzmj",
  },
  {
    label: "地下计容面积",
    value: "0",
    cols: 1,
    name: "dxjrjzmj",
  },
  {
    label: "总机动车位",
    value: "0",
    cols: 1,
    name: "zjdcw",
  },
  {
    label: "地上机动车位",
    value: "0",
    cols: 1,
    name: "dsjdcw",
  },
  {
    label: "地下机动车位",
    value: "0",
    cols: 1,
    name: "dxjdcw",
  },
  {
    label: "总非机动车位",
    value: "0",
    cols: 1,
    name: "zfjdcw",
  },
  {
    label: "地上非机动车位",
    value: "0",
    cols: 1,
    name: "dsfjdcw",
  },
  {
    label: "地下非机动车位",
    value: "0",
    cols: 1,
    name: "dxfjdcw",
  },
  {
    label: "公共配套",
    value: "门卫、养老服务设施",
    cols: 1,
    name: "ggpt",
  },
]);

let titleText = ref("");
/* 弹窗控制 */
const dialogVisible = ref(false);
const showDialog = (data) => {
  dialogVisible.value = true;
  titleText.value = data.buildname;
  indexData.value[0].value = data.buildname;
  indexData.value.forEach((item) => {
    if (item.name != "buildname") item.value = data.indexList[0][item.name];
  });
};
const closeDialog = () => {
  dialogVisible.value = false;
};

defineExpose({
  showDialog,
  closeDialog,
});

/* 组件卸载 */
onBeforeUnmount(() => {
  closeDialog();
});

/* 组件加载 */
onMounted(() => {});
</script>

<style scoped lang="scss">
@use "./singletable.scss";
</style>
