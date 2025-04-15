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
                    <span class="title-txt">单体指标</span>
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
                <div class="ctrl-box">
                    <el-checkbox
                        v-model="checkAll"
                        :indeterminate="isIndeterminate"
                        label="全部显示"
                        @change="handleCheckAllChange"
                    />
                    <!-- <el-button type="primary" size="small" @click="handleSymbol"
            >增加标记</el-button
          > -->
                </div>
                <el-scrollbar max-height="25vh">
                    <el-tree
                        :props="layerProps"
                        show-checkbox
                        :data="layerData"
                        class="layer-tree"
                        empty-text="暂无数据"
                        ref="layerTree"
                        @check-change="checkChangeNode"
                        @check="changeLayerNode"
                        :highlight-current="true"
                        :render-after-expand="false"
                        node-key="pid"
                        :default-checked-keys="defaultcheckedkeys"
                    >
                        <template #default="{ node, data }">
                            <span class="custom-tree-node">
                                <span class="tree-text">{{
                                    data.buildname
                                }}</span>
                                <span class="tree-tools">
                                    <el-tooltip
                                        content="单体指标"
                                        placement="bottom"
                                        effect="light"
                                        v-if="
                                            data.datasource == 1 ||
                                            data.datasource == 2
                                        "
                                    >
                                        <i
                                            class="iconfont icon-24gl-grid"
                                            @click="handleSingle(node, data)"
                                        ></i>
                                    </el-tooltip>
                                    <el-tooltip
                                        :content="editFlag ? '编辑' : '查看'"
                                        placement="bottom"
                                        effect="light"
                                    >
                                        <i
                                            :class="
                                                editFlag
                                                    ? 'iconfont icon-xiugai'
                                                    : 'iconfont icon-xianshi2'
                                            "
                                            @click="handleEdit(node, data)"
                                        ></i>
                                    </el-tooltip>
                                    <el-tooltip
                                        content="删除"
                                        placement="bottom"
                                        effect="light"
                                        v-if="editFlag"
                                    >
                                        <i
                                            class="iconfont icon-shanchu"
                                            @click="handleDel(node, data)"
                                        ></i>
                                    </el-tooltip>
                                    <el-tooltip
                                        content="定位"
                                        placement="bottom"
                                        effect="light"
                                    >
                                        <i
                                            class="iconfont icon-dingweixiao"
                                            @click="handleLocate(node, data)"
                                        ></i>
                                    </el-tooltip>
                                </span>
                            </span>
                        </template>
                    </el-tree>
                </el-scrollbar>
            </div>
        </el-dialog>
        <single-table ref="singletable" :singleList="singleList" />
        <symbol-design
            ref="symboldesign"
            @func="getDrawData"
            @editFunc="editGeo"
        />
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
    nextTick,
} from "vue";
import useStore from "@/stores";
import * as Cesium from "cesium";
import { useRoute } from "vue-router";
import {
    ElMessage,
    type FormInstance,
    type FormRules,
    ElMessageBox,
    ElTree,
} from "element-plus";
import { encode, decode } from "js-base64";

/*实体符号化 entity*/
import { createEntity } from "@/utils/cesiumExt/createEntity";
/* 组件 */
import SingleTable from "./components/singletable/SingleTable.vue";
import SymbolDesign from "./components/symboldesign/SymbolDesign.vue";

import {
    selectByPrjid,
    addBuildingmonomer,
    deleteBuildingmonomer,
    updateBuildingmonomer,
} from "./singleindex-api";

const route = useRoute();
const { menuStore, viewStore, mapStore } = useStore();
let viewer = <any>null;

/* 全选框 */
const checkAll = ref<boolean>(false);
const isIndeterminate = ref<boolean>(false);
const handleCheckAllChange = (val: boolean) => {
    layerTree.value.setCheckedNodes(val ? layerData.value : []);
    isIndeterminate.value = false;
};

/* 标记列表 */
const layerData = ref<any>([]);
const layerTree = ref<InstanceType<typeof ElTree>>();
const layerProps = {
    children: "children",
    label: "label",
    disabled: "uncheck",
};
const changeLayerNode = (data: any, obj: any) => {
    if (obj.checkedNodes.length == layerData.value.length) {
        checkAll.value = true;
        isIndeterminate.value = false;
    } else {
        checkAll.value = false;
        isIndeterminate.value = true;
    }
};

//加载已保存的绘制图形
let DrawEntities = ref([]);
const checkChangeNode = (data: any, ischeck: boolean, node: any) => {
    if (ischeck) {
        if (data.geojson == "") {
            return ElMessage.warning("该项未绘制图形信息，请编辑绘制");
        }
        //显示图形
        let symbolType = JSON.parse(data.geojson).geometry.type;
        let locationGeos = window.viewer.entities.getById(
            data.pid + "-" + symbolType
        );

        if (!locationGeos) {
            defaultcheckedkeys.value.indexOf(data.pid) == -1
                ? defaultcheckedkeys.value.push(data.pid)
                : "";

            if (DrawEntities.value.length > 0) {
                DrawEntities.value.forEach((draw) => {
                    if (draw.pid == data.pid) {
                        draw.entitys.forEach((entity) => {
                            window.viewer.entities.add(entity);
                        });
                    }
                });
            }
        }
    } else {
        //移除图形
        let findIndex = defaultcheckedkeys.value.findIndex(
            (p) => p == data.pid
        );
        defaultcheckedkeys.value.splice(findIndex, 1);
        if (DrawEntities.value.length > 0) {
            DrawEntities.value.forEach((draw) => {
                if (draw.pid == data.pid) {
                    draw.entitys.forEach((entity) => {
                        window.viewer.entities.remove(entity);
                    });
                }
            });
        }
    }
};
/* 单体指标 */
const singletable = ref<any>();
const singleList = ref<any>();
const handleSingle = (node: any, data: any) => {
    singleList.value = data;
    singletable.value.showDialog(data);
    symboldesign.value.closeDialog();
};

/* 符号设计 */
const symboldesign = ref<any>();
const handleSymbol = () => {
    symboldesign.value.showDialog();
    // singletable.value.closeDialog();
};
//编辑图形--打开图形编辑页面
const handleEdit = (node: any, data: any) => {
    if (data.geojson != "") {
        let symbolType = JSON.parse(data.geojson).geometry.type;
        let locationGeos = window.viewer.entities.getById(
            data.pid + "-" + symbolType
        );
        if (!locationGeos) {
            return ElMessage.warning("请先勾选图层！");
        }
    }

    symboldesign.value.showDialog(data);
};
//TODO:接口删除
const handleDel = async (node: any, data: any) => {
    //TODO:接口删除
    if (String(data.pid).length < 10) {
        let params = {
            buildname: data.name,
            geojson: data.geojson,
            prjid: data.prjid,
            pid: data.pid,
        };
        let { data: res } = await deleteBuildingmonomer(params);

        if (res.code !== 200) return ElMessage.warning(res.msg);
        ElMessage.success(res.msg);
    }
    //移除layerData数组中的当前删除的对象
    let dataIndex = layerData.value.findIndex((p) => p.pid == data.pid);
    layerData.value.splice(dataIndex, 1);

    //删除图形
    if (DrawEntities.value.length > 0) {
        DrawEntities.value.forEach((draw) => {
            if (draw.pid == data.pid) {
                draw.entitys.forEach((entity) => {
                    window.viewer.entities.remove(entity);
                });
            }
        });
    }
};
//TODO:定位
const handleLocate = (node: any, data: any) => {
    //TODO:定位
    let locationGeos = null;
    let symbolType = JSON.parse(data.geojson).geometry.type;
    //viewer中所有实体
    const entitys = window.viewer.entities._entities._array;
    let length = entitys.length;
    if (length == 0) {
        return ElMessage.warning("请先勾选图形！");
    }
    locationGeos = window.viewer.entities.getById(data.pid + "-" + symbolType);
    //   if (data.geojson.properties.plotType == "squadcombat" || data.geojson.properties.plotType == "tailedsquadcombat") {

    // window.viewer.entities._entities._array.forEach(entity => {
    //   if (entity.plotCode == data.geojson.properties.plotCode) {
    //     locationGeos = entity;
    //   }
    // });
    // }

    if (!locationGeos) {
        return ElMessage.warning("请先勾选图形！");
    }

    //定位图形中心点
    let center = null;

    if (locationGeos.point || locationGeos.billboard || locationGeos.label) {
        center = locationGeos.position._value;
    } else if (locationGeos.polyline) {
        var pyPositions = locationGeos.polyline.positions.getValue();
        center = Cesium.BoundingSphere.fromPoints(pyPositions).center;
    } else if (locationGeos.polygon) {
        var pyPositions = locationGeos.polygon.hierarchy.getValue(
            Cesium.JulianDate.now()
        ).positions;
        center = Cesium.BoundingSphere.fromPoints(pyPositions).center;
    }

    debugger;
    let range = window.viewer.camera.positionCartographic.height;
    //锁定视图中心点
    window.viewer.camera.lookAt(
        center,
        new Cesium.HeadingPitchRange(
            window.viewer.camera.heading,
            window.viewer.camera.pitch,
            range
        )
    );
    //取消锁定中心点
    window.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

    //   if (!locationGeos) {
    //     return ElMessage.warning("请先勾选图形！");
    //   }
    // console.log(toRaw(locationGeos));

    //   window.viewer.flyTo(toRaw(locationGeos),
    //   {
    //     offset: {
    //       heading: window.viewer.camera.heading, // 以弧度为单位的航向角。
    //       pitch: window.viewer.camera.pitch, // 以弧度为单位的俯仰角。
    //       range: 0, // 到中心的距离，以米为单位。
    //     },
    //   }
    //   );
};

// 获得单体指标列表
const handlegetList = async () => {
    //TODO:定位
    let { data: res } = await selectByPrjid({
        prjid: JSON.parse(sessionStorage.getItem("23vUser") as string)
            ?.projectId,
    });
    console.log(res);
    if (res.code == 200) {
        layerData.value = res.data;
        res.data.forEach((obj) => {
            //创建图形
            let entitiys = createEntity(obj.pid, obj.geojson, window.viewer);

            //辅助图形操作
            DrawEntities.value.push({
                pid: obj.pid,
                entitys: entitiys,
            });
        });
    } else {
        layerData.value = [];
    }

    return res;
};

//保存当前绘制的图形的pid
let defaultcheckedkeys = ref([]);

const getDrawData = async (drawGeo: any) => {
    if (drawGeo) {
        let params = {
            buildname: drawGeo.name,
            geojson: JSON.stringify(drawGeo.geojson),
            prjid: JSON.parse(sessionStorage.getItem("23vUser") as string)
                ?.projectId,
            pid: 0,
        };
        let { data: res } = await addBuildingmonomer(params);
        console.log(res);

        if (res.code !== 200) return ElMessage.warning(res.msg);
        ElMessage.success(res.msg);

        let layerobj = {
            pid: res.data,
            buildname: drawGeo.name,
            geojson: JSON.stringify(drawGeo.geojson),
            uncheck: false,
        };
        layerData.value.push(layerobj);
        DrawEntities.value.push({
            pid: res.data,
            entitys: createEntity(
                res.data,
                JSON.stringify(drawGeo.geojson),
                window.viewer
            ),
        });
        await nextTick();
        defaultcheckedkeys.value.push(res.data);
        layerTree.value.setCheckedKeys(defaultcheckedkeys.value, true);
    }
};

//编辑图形-子页面传参到父页面的方法
const editGeo = async (eidtGeoData: any) => {
    let dataindex = layerData.value.findIndex((p) => p.pid == eidtGeoData.pid);
    layerData.value[dataindex].buildname = eidtGeoData.buildname;
    layerData.value[dataindex].geojson = eidtGeoData.geojson;

    let params = {
        buildname: eidtGeoData.buildname,
        geojson: eidtGeoData.geojson,
        prjid: Number(
            JSON.parse(sessionStorage.getItem("23vUser") as string)?.projectId
        ),
        pid: eidtGeoData.pid,
    };
    let { data: res } = await updateBuildingmonomer(params);
    console.log(res);

    if (res.code !== 200) return ElMessage.warning(res.msg);
    ElMessage.success(res.msg);
};

/* 弹窗状态 */
const dialogVisible = ref(false);
const switchValue = ref(false);

/* 关闭弹窗 */
const closeDialog = () => {
    // 菜单恢复初始值
    if (menuStore.currFunc?.code == "dtzb") {
        menuStore.currFunc = null;
    }

    DrawEntities.value.forEach((draw) => {
        draw.entitys.forEach((entity) => {
            window.viewer.entities.remove(entity);
        });
    });
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
        keystr: menuStore.currFunc.code,
        prjid: JSON.parse(sessionStorage.getItem("23vUser") as string)
            ?.projectId,
    });
    if (res.data.code == 200) {
        console.log(res.data, "changeVisible");
        getModuleByPrjid();
    }
};

//获取所有模块的显示隐藏
const getModuleByPrjid = async () => {
    let res = await getModuleById({
        prjid: JSON.parse(sessionStorage.getItem("23vUser") as string)
            ?.projectId,
    });
    if (res.data.code == 200) {
        console.log(res.data.data.list, "getModuleByPrjid");
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
//判断是否可编辑
let editFlag = ref(false);
onMounted(() => {
    editFlag = window.editFlag;
    dialogVisible.value = true;
    viewer = window.viewer;
    getModuleByPrjid();
    handlegetList();
});
</script>

<style scoped lang="scss">
@use "./singleindex.scss";
</style>
