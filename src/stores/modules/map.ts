import { ref, computed } from "vue";
import { defineStore } from "pinia";

/*
    底图
*/
export const basemapStore = defineStore("basemap", () => {
  // 初始化地图信息
  const baseInfo = ref<any>();

  // 底图数组
  const baseLayersData = ref<any>([]);

  return { baseInfo, baseLayersData };
});

/*
    主地图实例
*/
export const viewStore = defineStore("view", () => {
  // 地图实例
  const mapInstance = ref<any>(null);

  // 天地图相关
  const tileMatrixLabels = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
  ];
  const subdomains = ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"];

  // 当前项目红线
  const currRedLine = ref<any>(null);

  // 当前三维模型
  const currModel = ref<any>(null);

  //当前详规盒子
  const currBoxList = ref<any>([]);

  //当前红线在地形上的最低点
  const currRedLineMinHeight = ref<any>(0);

  //模型的原始坐标点和角度
  //   {
  //     modelx: null,
  //     modely: null,
  //     modelz: null,
  //     modelangle: null,
  //   }
  const modelOrgMatrix = ref<any>({
    modelx: 0,
    modely: 0,
    modelz: 0,
    modelanglex: 0,
    modelangley: 0,
    modelanglez: 0,
    planeHeight:0
  });
  // const modely=ref<any>(null);
  // const modelangle=ref<any>(null);
  // 项目红线的中心点
  const renCenter = ref<any>(null)

  return {
    mapInstance,
    tileMatrixLabels,
    subdomains,
    currRedLine,
    currModel,
    currBoxList,
    currRedLineMinHeight,
    modelOrgMatrix,
    renCenter
  };
});

/*
    菜单
*/
export const menuStore = defineStore("menu", () => {
  // 菜单当前点击项
  const currFunc = ref<any>();
  const handleFunc = (str: any) => {
    currFunc.value = str;
  };
  // 图层树弹窗状态
  const layerIsShow = ref<boolean>(true);
  const handleLayerShow = (boo: boolean) => {
    layerIsShow.value = boo;
  };

  // 图层树
  const treeRef = ref<any>();
  const handleTreeRef = (tree: any) => {
    treeRef.value = tree;
  };

  //判断通用设计列表是否有改变
  const commonListChange = ref([]);
  const handleCommonListChange = (pid: number) => {
    commonListChange.value.push(pid);
    console.log(commonListChange.value, "commonListChange.value");
  };

  //监听编辑设计的时候是否操作删除设计
  const isEditDel = ref(false);
  const delCommonId = ref(0);
  const handleCommonEditDel = (isdel: boolean, commonid: number) => {
    isEditDel.value = isdel;
    delCommonId.value = commonid;
  };

  return {
    currFunc,
    handleFunc,
    layerIsShow,
    handleLayerShow,
    treeRef,
    handleTreeRef,
    commonListChange,
    handleCommonListChange,
    isEditDel,
    delCommonId,
    handleCommonEditDel,
  };
});
