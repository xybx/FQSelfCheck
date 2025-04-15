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
        <el-table :data="tableData" border style="width: 100%" :span-method="objectSpanMethod"
          :header-cell-style="headfirst" align="center" height="700" :ow-style="{ height: '30px' }">
          <el-table-column align="center" prop="number" label="序号" width="70" />

          <el-table-column align="center" label="项目">
            <el-table-column align="center" prop="flag" width="70" />
            <el-table-column prop="flag1" width="60" />
            <el-table-column prop="project" width="150">
              <template #default="scope">
                {{ scope.row.project }}
                <span style="color: red" v-if="scope.row.number != 10">
                  (*)</span>
              </template>
            </el-table-column>
          </el-table-column>

          <el-table-column align="center" prop="unit" label="计量单位" width="90" />
          <el-table-column align="center" prop="value" label="数值" key="slot">
            <!-- <template #default="scope">

              <el-input v-model="scope.row.value" type="number" :disabled="true"/>
            </template> -->
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/* 依赖包 */
import { ref, onMounted, onBeforeUnmount, shallowRef } from "vue";
import useStore from "@/stores";
import "@wangeditor/editor/dist/css/style.css"; // 引入 css
import type { TableColumnCtx } from "element-plus";
import { getProjectByPrjid } from "./AllIndex";
import { addModuleVisible, getModuleById } from "@/utils/common-api";
import { encode, decode } from "js-base64";

import { useRoute } from "vue-router";
const route = useRoute();
const { menuStore, viewStore, mapStore } = useStore();
/* 弹窗状态 */
const dialogVisible = ref(false);
const switchValue = ref(false);

let data = {};
interface User {
  number: number;
  project: string;
  unit: string;
  value: number;
  flag: string;
  name: string;
  flag1: string;
}

let tableData = ref([
  {
    number: 1,
    flag: "",
    flag1: "",
    project: "征用面积",
    unit: "㎡",
    name: "zymj",
    value: 0,
  },
  {
    number: 1,
    flag: "",
    flag1: "",
    project: "其中实用用地面积",
    unit: "㎡",
    name: "sydmj",
    value: 0,
  },
  {
    number: 2,
    flag: "",
    flag1: "",
    project: "总建筑面积",
    unit: "㎡",
    name: "zjzmj",
    value: 0,
  },
  {
    number: 2,
    flag: "其中",
    flag1: "",
    project: "(1)地上建筑面积",
    unit: "㎡",
    name: "dsjzmj",
    value: 0,
  },
  {
    number: 2,
    flag: "其中",
    flag1: "",
    project: "(2)地下建筑面积",
    unit: "㎡",
    name: "dxjzmj",
    value: 0,
  },
  {
    number: 3,
    flag: "",
    flag1: "",
    project: "计入容积率的建筑面积",
    unit: "㎡",
    name: "jrrjljzmj",
    value: 0,
  },
  {
    number: 3,
    flag: "",
    flag1: "",
    project: "地上计容建筑面积",
    unit: "㎡",
    name: "dsjrjzmj",
    value: 0,
  },
  {
    number: 3,
    flag: "",
    flag1: "",
    project: "地下计容建筑面积",
    unit: "㎡",
    name: "dxjrjzmj",
    value: 0,
  },
  {
    number: 3,
    flag: "其中(含规划、保留建筑面积和计入容积率的地下建筑面积)",
    flag1: "(1) 住宅建筑面积",
    project: "(1) 住宅建筑面积",
    unit: "㎡",
    name: "zzjzmj",
    value: 0,
  },
  {
    number: 3,
    flag: "其中(含规划、保留建筑面积和计入容积率的地下建筑面积)",
    flag1: "(2)",
    project: "商业建筑面积",
    unit: "㎡",
    name: "syjzmj",
    value: 0,
  },
  {
    number: 3,
    flag: "其中(含规划、保留建筑面积和计入容积率的地下建筑面积)",
    flag1: "(2) ",
    project: "商业建筑面积占计容建筑面积比例",
    unit: "%",
    name: "syjzmjzjrjzmjrate",
    value: 0,
  },
  {
    number: 3,
    flag: "其中(含规划、保留建筑面积和计入容积率的地下建筑面积)",
    flag1: "",
    project: "(3) 办公建筑面积",
    unit: "㎡",
    name: "bgjzmj",
    value: 0,
  },
  {
    number: 3,
    flag: "其中(含规划、保留建筑面积和计入容积率的地下建筑面积)",
    flag1: "",
    project: "(4) 公共服务设施和市政公用设施建筑面积",
    unit: "㎡",
    name: "ggfwsshszgyssjzmj",
    value: 0,
  },
  {
    number: 4,
    flag: "",
    flag1: "",
    project: "不计入容积率的建筑面积",
    unit: "㎡",
    name: "bjrrjljzmj",
    value: 0,
  },
  {
    number: 4,
    flag: "其中",
    flag1: "",
    project: "(1) 地下室建筑面积",
    unit: "㎡",
    name: "dxsjzmj",
    value: 0,
  },
  {
    number: 4,
    flag: "其中",
    flag1: "",
    project: "(2) 架空层建筑面积",
    unit: "㎡",
    name: "jkcjzmj",
    value: 0,
  },
  {
    number: 5,
    flag: "",
    flag1: "",
    project: "容积率",
    unit: "㎡/㎡",
    name: "rjl",
    value: 0,
  },
  {
    number: 6,
    flag: "其中",
    flag1: "",
    project: "建筑占地面积",
    unit: "㎡",
    name: "jzzdmj",
    value: 0,
  },
  {
    number: 7,
    flag: "其中",
    flag1: "",
    project: "建筑密度",
    unit: "%",
    name: "jzmj",
    value: 0,
  },
  {
    number: 8,
    flag: "其中",
    flag1: "",
    project: "绿地面积",
    unit: "㎡",
    name: "ldmj",
    value: 0,
  },
  {
    number: 9,
    flag: "其中",
    flag1: "",
    project: "绿地率",
    unit: "%",
    name: "ldl",
    value: 0,
  },
  {
    number: 10,
    flag: "其中",
    flag1: "",
    project: "(1) 居住总户数",
    unit: "户",
    name: "jzzhs",
    value: 0,
  },
  {
    number: 10,
    flag: "其中",
    flag1: "",
    project: "(2) 居住人口",
    unit: "人",
    name: "jzrk",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "(1) 机动车车位数",
    unit: "辆",
    name: "jdccws",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "地上机动车车位数",
    unit: "辆",
    name: "dsjdccws",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "地下机动车车位数",
    unit: "辆",
    name: "dxjdccws",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "公共机动车车位数",
    unit: "辆",
    name: "ggjdccws",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "其他机动车车位数",
    unit: "辆",
    name: "qtjdccws",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "公共机动车车位数占比",
    unit: "%",
    name: "ggjdccwsrate",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "其他机动车车位数占比",
    unit: "%",
    name: "qtjdccwsrate",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "(2) 非机动车车位数",
    unit: "辆",
    name: "fjdccws",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "地上非机动车车位数",
    unit: "辆",
    name: "dsfjdccws",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "地下非机动车车位数",
    unit: "辆",
    name: "dxfjdccws",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "(3) 公共机动车车位",
    unit: "",
    name: "ggjdcw",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "地上公共机动车车位数",
    unit: "辆",
    name: "dsggjdccw",
    value: 0,
  },
  {
    number: 11,
    flag: "其中",
    flag1: "",
    project: "地下公共机动车车位数",
    unit: "辆",
    name: "dxggjdccw",
    value: 0,
  },
  {
    number: 12,
    flag: "",
    flag1: "",
    project: "各栋建筑物名称汇总",
    unit: data["gdjzwmchz"],
    name: "gdjzwmchz",
    value: 0,
  },
  {
    number: 13,
    flag: "",
    flag1: "",
    project: "公共配套",
    unit: data["ggpt"],
    name: "ggpt",
    value: 0,
  },
]);

interface SpanMethodProps {
  row: User;
  column: TableColumnCtx<User>;
  rowIndex: number;
  columnIndex: number;
}

let colspan1 = [16, 17, 18, 19, 20, 21, 36, 37];
let rowspan3 = [
  0, 1, 2, 5, 6, 7, 13, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33,
  34, 35,
];
// 13,
let rowspan2 = [3, 4, 8, 11, 12, 14, 15, 26, 27, 28, 29];
const objectSpanMethod = ({
  row,
  column,
  rowIndex,
  columnIndex,
}: SpanMethodProps) => {
  if (columnIndex === 0) {
    if (rowIndex === 0 || rowIndex === 21) {
      return {
        rowspan: 2,
        colspan: 1,
      };
    } else if (rowIndex === 2) {
      return {
        rowspan: 3,
        colspan: 1,
      };
    } else if (rowIndex === 5) {
      return {
        rowspan: 8,
        colspan: 1,
      };
    } else if (rowIndex === 13) {
      return {
        rowspan: 3,
        colspan: 1,
      };
    } else if (rowIndex === 23) {
      return {
        rowspan: 13,
        colspan: 1,
      };
    } else if (colspan1.indexOf(rowIndex) !== -1) {
      return {
        rowspan: 1,
        colspan: 1,
      };
    } else {
      return {
        rowspan: 0,
        colspan: 0,
      };
    }
  } else if (columnIndex === 1) {
    if (rowIndex === 3 || rowIndex == 14) {
      return {
        rowspan: 2,
        colspan: 1,
      };
    } else if (rowIndex === 8) {
      return {
        rowspan: 5,
        colspan: 1,
      };
    } else if (rowIndex === 26) {
      return {
        rowspan: 4,
        colspan: 1,
      };
    } else {
      return {
        rowspan: 0,
        colspan: 0,
      };
    }
  } else if (columnIndex === 2) {
    if (rowIndex === 9) {
      return {
        rowspan: 2,
        colspan: 1,
      };
    } else {
      return {
        rowspan: 0,
        colspan: 0,
      };
    }
  }

  if (rowspan3.indexOf(rowIndex) != -1) {
    if (columnIndex === 3) {
      return [1, 3];
    }
  }

  if (rowspan2.indexOf(rowIndex) != -1) {
    if (columnIndex === 3) {
      return [1, 2];
    }
  }
  if (rowIndex == 36 || rowIndex == 37) {
    if (columnIndex === 4) {
      return [1, 7];
    } else if (columnIndex === 5) {
      return [0, 0];
    }
  }
};

const headfirst = ({ row, column, rowIndex, columnIndex }: SpanMethodProps) => {
  if (rowIndex === 1) {
    return {
      display: "none",
    };
  }
};
/* 关闭弹窗 */
const closeDialog = () => {
  // 菜单恢复初始值
  if (menuStore.currFunc.code == "zpzb") {
    // menuStore.currFunc = null;
    menuStore.handleFunc("");
  }
};

let modulelist = ref([]);
let currentModule = ref(null);
//新增编辑模块的显示隐藏
const changeVisible = async () => {
  //debugger;
  const prjid = JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId;
  let res = await addModuleVisible({
    isvisible: switchValue.value ? 1 : 0,
    modulename: menuStore.currFunc.name,
    pid: currentModule.value ? currentModule.value.pid : 0,
    keystr: menuStore.currFunc.code,
    prjid: prjid
  });
  if (res.data.code == 200) {
    console.log(res.data, "changeVisible");
    getModuleByPrjid();
  }
};

//获取所有模块的显示隐藏
const getModuleByPrjid = async () => {
  const prjid = JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId;
  let res = await getModuleById({
    prjid: prjid,
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
onMounted(async () => {
  getModuleByPrjid();
  const prjid = JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId;
  let res = await getProjectByPrjid({
    prjid: prjid,
  });
  dialogVisible.value = true;
  if (res.data.code == 200) {
    data = res.data.data;
    tableData.value.map((item) => {
      console.log(data[item.name], item.name, item);

      item.value = data[item.name];
      if (item.name == "gdjzwmchz" || item.name == "ggpt") {
        item.unit = data[item.name];
      }
    });

    console.log(tableData, "--tableData");
  }
  else {
    // alert("暂无数据");
    switchValue.value = false;
  }

  // viewer = window.viewer;
  // getProjectScheme();
  // setWatchView();
});
</script>

<style scoped lang="scss">
@use "./AllIndex.scss";
</style>
