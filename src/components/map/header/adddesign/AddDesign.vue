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
          <span class="title-txt">{{ title }}</span>
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
        <el-form
          :model="form"
          :inline="true"
          :rules="rules"
          ref="formRef"
          :show-message="false"
        >
          <el-form-item label="设计名称" prop="name">
            <el-input v-model="form.name"></el-input>
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number
              v-model="form.sort"
              :min="0"
              controls-position="right"
            />
          </el-form-item>
          <div class="editorText">
            <el-form-item label="设计介绍" prop="valueHtml">
              <Toolbar
                :editor="editorRef"
                :defaultConfig="toolbarConfig"
                mode="default"
              />
              <Editor
                class="editor-box"
                v-model="form.valueHtml"
                :defaultConfig="editorConfig"
                mode="default"
                @onCreated="handleCreated"
                @customPaste="customPaste"
              />
            </el-form-item>
          </div>
        </el-form>
        <ul class="panleBox">
          <li>
            <el-checkbox
              v-model="checkAll"
              :indeterminate="isIndeterminate"
              label="全部显示"
              @change="handleCheckAllChange"
            />
            <el-tree
              :props="layerProps"
              show-checkbox
              :data="layerData"
              class="layer-tree"
              empty-text="暂无数据"
              ref="layerTree"
              @check="changeLayerNode"
              @check-change="checkChangeNode"
              :highlight-current="true"
              :render-after-expand="false"
              node-key="pid"
              :default-checked-keys="defaultcheckedkeys"
            >
              <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <span class="tree-text">{{ node.label }}</span>
                  <span class="tree-tools">
                    <el-tooltip
                      content="编辑"
                      placement="bottom"
                      effect="light"
                    >
                      <i
                        class="iconfont icon-xiugai"
                        @click="handleEdit(node, data)"
                      ></i>
                    </el-tooltip>
                    <el-tooltip
                      content="删除"
                      placement="bottom"
                      effect="light"
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
          </li>
          <li>
            <span>图上标绘</span>
            <div v-for="group in iconGroup">
              <el-divider content-position="left" border-style="double">{{
                group.groupname
              }}</el-divider>
              <ol class="iconlist">
                <li
                  v-for="item in group.icontypes"
                  :key="item"
                  @click="symbolClick(item)"
                >
                  <i class="iconfont" :class="item.icon"></i>
                  <span>{{ item.name }}</span>
                </li>
              </ol>
            </div>

            <!-- <el-divider content-position="left" border-style="double">相机参数设置</el-divider>
            <ol class="iconlist">
              <li v-for="item in iconData" :key="item" @click="symbolClick">
                <i class="iconfont" :class="item.icon"></i>
                <span>{{ item.label }}</span>
              </li>
            </ol> -->
          </li>
        </ul>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="saveForm(formRef)">保存</el-button>
          <el-button type="warning" @click="closeDialog">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    <SymbolSet ref="symbolset" @func="getDrawData" @editFunc="editGeo" />
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
  shallowRef,
  nextTick,
} from "vue";
import useStore from "@/stores";
import { useRoute } from "vue-router";
import SymbolSet from "../../bottom/symbolset/SymbolSet.vue";
import * as Cesium from "cesium";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css"; // 引入 css
import { encode, decode } from "js-base64";

/* UI 相关 */
import {
  ElMessage,
  type FormInstance,
  type FormRules,
  ElMessageBox,
  ElTree,
} from "element-plus";

/* api */
import {
  getDataApi,
  insertDataApi,
  delDataApi,
  delDataGeoApi,
  getDrawDataApi,
  getDrawGeoListApi,
} from "./adddesign-api";

/*实体符号化 entity*/
import { initPlot, createEntity } from "@/utils/cesiumExt/createEntity";
import { storeToRefs } from "pinia";
const { menuStore, viewStore, mapStore } = useStore();
const route = useRoute();
const symbolset = ref<any>();
/* 弹窗状态 */
const dialogVisible = ref(false);
const switchValue = ref(true);
const iconGroup = ref<any>([]);
// const iconData = ref<any>([])
/* 左侧勾选 */
const checkAll = ref<boolean>(false);
const isIndeterminate = ref<boolean>(true);
const layerTree = ref<InstanceType<typeof ElTree>>();
const layerData = ref([]);
const layerProps = {
  children: "children",
  label: "label",
  disabled: "uncheck",
};
//保存当前绘制的图形的pid
let defaultcheckedkeys = ref([]);

const handleCheckAllChange = (val: boolean) => {
  layerTree.value.setCheckedNodes(val ? layerData.value : []);
  isIndeterminate.value = false;
};
const changeLayerNode = (data: any, obj: any) => {
  console.log(data, obj, "data");
  if (obj.checkedNodes.length == layerData.value.length) {
    checkAll.value = true;
    isIndeterminate.value = false;
  } else {
    checkAll.value = false;
    isIndeterminate.value = true;
  }
};

const checkChangeNode = (data: any, ischeck: boolean, node: any) => {
  console.log(data, ischeck, node, "data");
  //显示图形
  let symbolType = data.geojson.geometry.type;
  if (ischeck) {
    let locationGeos = window.viewer.entities.getById(
      data.pid + "-" + symbolType
    );
    // let symbolType = data.geojson.properties.attr.type;
    if (
      data.geojson.properties.plotType == "squadcombat" ||
      data.geojson.properties.plotType == "tailedsquadcombat"
    ) {
      window.viewer.entities._entities._array.forEach((entity) => {
        if (entity.plotCode == data.geojson.properties.plotCode) {
          locationGeos = entity;
        }
      });
    }
    if (
      symbolType == "Water" ||
      symbolType == "Fire" ||
      symbolType == "Fountain" ||
      symbolType == "Smoke"
    ) {
      debugger;
      locationGeos = window.viewer.entities.getById(data.pid);
      // defaultcheckedkeys.value.push(data.pid);
      if (DrawEntities.value.length > 0) {
        DrawEntities.value.forEach((draw) => {
          if (draw.pid == data.pid) {
            if (draw.primitive) {
              if (draw.primitive.index == -1) {
                defaultcheckedkeys.value.push(data.pid);
                draw.primitive.index = window.viewer.scene.primitives.length;
                window.viewer.scene.primitives.add(draw.primitive.geoPrimitive);
              } else {
                let _primitive = window.viewer.scene.primitives.get(
                  draw.primitive.index
                );
                if (_primitive && !_primitive.show) {
                  _primitive.show = true;
                }
              }
            }
            if (!locationGeos) {
              draw.entitys.forEach((entity) => {
                if (entity) {
                  window.viewer.entities.add(entity);
                }
              });
            } else {
              if (locationGeos && !locationGeos.show) {
                locationGeos.show = true;
              }
            }
          }
        });
      }
    } else {
      if (!locationGeos) {
        defaultcheckedkeys.value.push(data.pid);
        if (DrawEntities.value.length > 0) {
          DrawEntities.value.forEach((draw) => {
            if (draw.pid == data.pid) {
              draw.entitys.forEach((entity) => {
                window.viewer.entities.add(entity);
              });
            }
          });
        }
      } else {
        locationGeos.show = true;
      }
    }
  } else {
    //移除图形
    let findIndex = defaultcheckedkeys.value.findIndex((p) => p == data.pid);
    defaultcheckedkeys.value.splice(findIndex, 1);
    if (DrawEntities.value.length > 0) {
      DrawEntities.value.forEach((draw) => {
        if (draw.pid == data.pid) {
          if (
            symbolType == "Water" ||
            symbolType == "Fire" ||
            symbolType == "Fountain" ||
            symbolType == "Smoke"
          ) {
            if (draw.primitive) {
              let _primitive = window.viewer.scene.primitives.get(
                draw.primitive.index
              );
              if (_primitive) {
                _primitive.show = false;
              }
            }
          }
          draw.entitys.forEach((entity) => {
            if (entity) {
              window.viewer.entities.remove(entity);
            }
          });
        }
      });
    }
  }
};

//加载已保存的绘制图形
let DrawEntities = ref([]);
const getLayerTreeData = async () => {
  let { data: res } = await getDrawGeoListApi({ commonpid: form.value.pid });
  if (res.code !== 200) return ElMessage.warning(res.msg);
  //geolist.value = res.data;
  res.data.forEach((obj) => {
    //创建图形
    let entitiys = createEntity(obj.pid, obj.geojson, window.viewer);
    layerData.value.push({
      pid: obj.pid,
      label: obj.name,
      drawtype: obj.drawtype,
      geojson: JSON.parse(obj.geojson),
      commonpid: obj.commonpid,
      children: [],
      uncheck: false,
      //entitiys: entitiys,
    });
    let symbolType = JSON.parse(obj.geojson).properties.plotType;
    if (symbolType == "Water") {
      //辅助图形操作
      DrawEntities.value.push({
        pid: obj.pid,
        entitys: [],
        primitive: entitiys,
      });
    } else if (
      symbolType == "Fire" ||
      symbolType == "Smoke" ||
      symbolType == "Fountain"
    ) {
      DrawEntities.value.push({
        pid: obj.pid,
        entitys: [entitiys.entity],
        primitive: entitiys.primitive,
      });
    } else {
      //辅助图形操作
      DrawEntities.value.push({
        pid: obj.pid,
        entitys: entitiys,
        primitive: null,
      });
    }
  });
};
//加载当前绘制的图形数据
const getDrawData = async (drawGeo: any) => {
  if (drawGeo) {
    let layerobj = {
      pid: drawGeo.pid,
      label: drawGeo.name,
      drawtype: drawGeo.drawtype,
      geojson: drawGeo.geojson,
      commonpid: drawGeo.commonpid,
      children: [],
      uncheck: false,
      //entitiys: drawGeo.entitiys,
    };
    layerData.value.push(layerobj);
    DrawEntities.value.push({
      pid: drawGeo.pid,
      entitys: drawGeo.entitiys,
      primitive: drawGeo.primitive,
    });
    await nextTick();
    defaultcheckedkeys.value.push(drawGeo.pid);
    layerTree.value.setCheckedKeys(defaultcheckedkeys.value, true);
  }
};
//编辑图形-子页面传参到父页面的方法
const editGeo = (eidtGeoData: any) => {
  let node = layerTree.value.getNode(eidtGeoData);
  node.data.label = eidtGeoData.label;
  node.data.geojson = eidtGeoData.geojson;
  let dataindex = layerData.value.findIndex((p) => p.pid == eidtGeoData.pid);
  layerData.value[dataindex].label = eidtGeoData.label;
  layerData.value[dataindex].geojson = eidtGeoData.geojson;
};
//编辑图形--打开图形编辑页面
const handleEdit = (node: any, data: any) => {
  let symbolType = data.geojson.geometry.type;
  let locationGeos = window.viewer.entities.getById(
    data.pid + "-" + symbolType
  );
  if (
    data.geojson.properties.plotType == "squadcombat" ||
    data.geojson.properties.plotType == "tailedsquadcombat"
  ) {
    window.viewer.entities._entities._array.forEach((entity) => {
      if (entity.plotCode == data.geojson.properties.plotCode) {
        locationGeos = entity;
      }
    });
    //window.viewer.entities
  }

  if (!locationGeos) {
    return ElMessage.warning("请先勾选图层！");
  }
  let iconpid = data.geojson.properties.attr.iconpid;
  let iconObj = null;
  iconGroup.value.forEach((group) => {
    group.icontypes.forEach((icon) => {
      if (icon.pid == iconpid) {
        iconObj = icon;
      }
    });
  });

  symbolset.value.showDialog(iconObj, form.value, data);
};

//删除图形数据
const handleDel = async (node: any, data: any) => {
  //TODO:接口删除
  console.log(data, node, "nodedata");
  if (String(data.pid).length < 10) {
    let { data: res } = await delDataGeoApi({ pid: data.pid });
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
  let symbolType = data.geojson.properties.attr.type;
  if (symbolType == "squadcombat" || symbolType == "tailedsquadcombat") {
    window.viewer.entities._entities._array.forEach((entity) => {
      if (entity.plotCode == data.geojson.properties.plotCode) {
        window.viewer.entities.remove(entity);
      }
    });
  }
};

const handleLocate = (node: any, data: any) => {
  //TODO:定位
  debugger;
  console.log(data, "handleLocate");
  let locationGeos = null;
  let symbolType = data.geojson.geometry.type;
  //定位图形中心点
  let center = null;
  if (symbolType == "Water") {
    let waterPrimitive = DrawEntities.value.filter((p) => p.pid == data.pid);
    if (waterPrimitive.length == 0) {
      return ElMessage.warning("请先勾选图形！");
    } else {
      //let water_Primitive = window.viewer.scene.primitives.get(waterPrimitive[0].index);
      center = Cesium.BoundingSphere.fromPoints(
        waterPrimitive[0].primitive.positions
      ).center;
    }
  } else {
    //viewer中所有实体
    const entitys = window.viewer.entities._entities._array;
    let length = entitys.length;
    if (length == 0) {
      return ElMessage.warning("请先勾选图形！");
    }
    if (
      symbolType == "Fire" ||
      symbolType == "Smoke" ||
      symbolType == "Fountain"
    ) {
      locationGeos = locationGeos = window.viewer.entities.getById(
        data.pid
      );
    } else {
      locationGeos = window.viewer.entities.getById(
        data.pid + "-" + symbolType
      );
    }

    if (
      data.geojson.properties.plotType == "squadcombat" ||
      data.geojson.properties.plotType == "tailedsquadcombat"
    ) {
      window.viewer.entities._entities._array.forEach((entity) => {
        if (entity.plotCode == data.geojson.properties.plotCode) {
          locationGeos = entity;
        }
      });
    }

    if (!locationGeos) {
      return ElMessage.warning("请先勾选图形！");
    }

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
  }
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

  // window.viewer.flyTo(toRaw(locationGeos), {
  //   offset: {
  //     heading: window.viewer.camera.heading,	// 以弧度为单位的航向角。
  //     pitch: window.viewer.camera.pitch,		// 以弧度为单位的俯仰角。
  //     range: range								// 到中心的距离，以米为单位。
  //   }
  // });

  // DrawEntities.value.forEach(draw => {
  //   if (draw.pid == data.pid) {
  //     console.log(draw.entitys[0].billboard, "draw");
  //     window.viewer.flyTo(draw.entitys[0]);
  //   }
  // });
};

/* 右侧符号 */
const getIconList = async () => {
  const { data: res } = await getDrawDataApi();
  if (res.code !== 200) return ElMessage.warning(res.msg);
  console.log(res, "res");
  iconGroup.value = res.data;

  // iconData.value = [
  //   { label: '地标', icon: 'icon-landmark' },
  //   { label: '多边形', icon: 'icon-polygon-fill' },
  //   { label: '立方体', icon: 'icon-box' },
  //   { label: '文字', icon: 'icon-wenzi' },
  //   { label: '路径', icon: 'icon-w_lujing' },
  //   { label: '箭头', icon: 'icon-xiangzuo' },
  //   { label: '燕尾箭头', icon: 'icon-Reply-All' }
  // ]
};
/* 右侧符号点击事件 */
const symbolClick = (iconObj) => {
  symbolset.value.showDialog(iconObj, form.value);
};
/* 富文本start */
// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();
// 内容 HTML
const valueHtml = ref<string>("");
const toolbarConfig = {
  toolbarKeys: [
    "headerSelect",
    "bold",
    "italic",
    "underline",
    "through",
    "color",
    "bgColor",
    "insertLink",
    "bulletedList",
    {
      key: "group-justify",
      title: "对齐",
      iconSvg:
        '<svg viewBox="0 0 1024 1024"><path d="M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8zM972.8 102.4v102.4H51.2V102.4h921.6z"></path></svg>',
      menuKeys: [
        "justifyLeft",
        "justifyRight",
        "justifyCenter",
        "justifyJustify",
      ],
    },
    "blockquote",
    "emotion",
    "uploadImage",
    "insertTable",
    {
      key: "group-more-style",
      title: "更多",
      iconSvg:
        '<svg viewBox="0 0 1024 1024"><path d="M204.8 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M505.6 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M806.4 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path></svg>',
      menuKeys: ["codeBlock", "code", "clearStyle"],
    },
    "undo",
    "redo",
  ],
};
const uploadImageList = ref([]);
//上传本地图片
// const UploadImage = (file,insertFn)=>{
//   let formData = new FormData()
//   formData.append('file', file)
//   axios.post('http://localhost:8080/api/file/upload',formData,{
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     }
//   }).then(res => {
//     if (res.data.code == 0){
//       const src = 'http://121.37.0.16:9000/public/'+ res.data.data.fileName[0]
//       insertFn(src, '百度 logo', src)
//     }
//   })
// }
//自定义粘贴中带图片
const customPaste = (editor, event, callback) => {
  let html = event.clipboardData.getData("text/html");
  // TODO:可以将粘贴的图片进行保存
  //let srcArray = html.match(/<img [^>]*src=['"]([^'"]+)[^>]*>/g);
  //let urlArray = []
  // if(srcArray){
  //   srcArray.map(item=>{
  //     urlArray.push(item.match(/src=['"]([^'"]+)/)[1])
  //   })
  // }
  editor.dangerouslyInsertHtml(html);
  // 返回 false ，阻止默认粘贴行为
  event.preventDefault();
  callback(true);
};
const editorConfig = {
  placeholder: "请输入内容...",
  MENU_CONF: {
    // 配置上传图片
    uploadImage: {
      // fieldName: 'file',
      // base64LimitSize: 10 * 1024 * 1024, // 10M 以下插入 base64
      // server: '/api/common/uploadFile', // 自定义的接口地址
      // headers: {
      //     'Content-Type': 'multipart/form-data',
      //     'Authorization': getToken()
      // },
      // 跨域是否传递 cookie ，默认为 false
      withCredentials: true,
      // customUpload: UploadImage
    },
  },
};
const handleCreated = (editor) => {
  editorRef.value = editor; // 记录 editor 实例，重要！
};
/* 富文本end */

/* 表单 */
// const form = ref<any>({});
const formRef = ref<FormInstance>();
const form = ref({
  pid: 0,
  name: "",
  sort: 0,
  intro: "",
  valueHtml: "",
});

/*表单验证*/
const rules = reactive<any>({
  name: [{ required: true, message: "设计名称不能为空", trigger: "blur" }],
});

/* 关闭弹窗 */
const closeDialog = () => {
  // 菜单恢复初始值
  if (menuStore.currFunc.code == "xzsj") {
    // menuStore.currFunc = null;
    menuStore.handleFunc("");
  }
  if (menuStore.currFunc.code == "bjsj") {
    // menuStore.currFunc = null;
    menuStore.handleFunc("");
  }
  window.viewer.entities.removeAll();
  formRef.value.resetFields();
};

//保存设计
const saveForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (!valid) return ElMessage.warning("请补充必填项");
    // let params = Object.assign({}, form.value, {
    //   prjid: route.query.prjid,
    // });
    let drawinfos = [];
    if (layerData.value.length > 0) {
      layerData.value.forEach((obj) => {
        drawinfos.push({
          commonpid: obj.commonpid,
          drawtype: obj.drawtype,
          geojson: JSON.stringify(obj.geojson),
          name: obj.label,
          pid: 0,
        });
      });
    }
    //debugger;
    const prjid = JSON.parse(
      sessionStorage.getItem("23vUser") as string
    )?.projectId;
    let params = {
      description: form.value.valueHtml,
      drawinfos: drawinfos,
      isvisible: switchValue.value ? 1 : 0,
      name: form.value.name,
      ordernum: form.value.sort,
      pid: form.value.pid,
      prjid: prjid,
    };
    const { data: res } = await insertDataApi(params);
    if (res.code !== 200) return ElMessage.warning(res.msg);
    ElMessage.success(res.msg);
    menuStore.handleCommonListChange(form.value.pid);
    //menuStore.handleCommonListChange(false);
    // formEl.resetFields();
  });
};
//编辑赋值
let editData = ref<any>(null);
const getEditData = () => {
  if (editData) {
    title.value = editData.value.name;
    form.value.name = editData.value.name;
    form.value.pid = editData.value.pid;
    form.value.valueHtml = editData.value.description;
    form.value.sort = editData.value.ordernum;
    switchValue.value = editData.value.isvisible == 1 ? true : false;
  }
};
let title = ref<any>(null);
const dialogShow = () => {
  initPlot(window.viewer);
  if (menuStore.currFunc.code == "xzsj") {
    title.value = "新增设计";
    getIconList();
    getLayerTreeData();
    dialogVisible.value = true;
  }
  if (menuStore.currFunc.code == "bjsj") {
    //记录当前编辑的设计id
    menuStore.handleCommonEditDel(false, menuStore.currFunc.data.pid);
    console.log(menuStore.currFunc.data, "menuStore.currFunc");
    if (menuStore.currFunc.data) {
      editData.value = menuStore.currFunc.data;
      getEditData();
    }
    getIconList();
    getLayerTreeData();
    dialogVisible.value = true;
  }
};

/* 组件卸载 */
onBeforeUnmount(() => {
  closeDialog();
});

//监听删除按钮
watch(storeToRefs(menuStore).isEditDel, (val) => {
  if (storeToRefs(menuStore).isEditDel.value) {
    debugger;
    if (menuStore.delCommonId == editData.value.pid) {
      closeDialog();
    }
  }
});

/* 组件加载 */
onMounted(() => {
  dialogShow();
});
</script>

<style scoped lang="scss">
@use "./adddesign.scss";
</style>
