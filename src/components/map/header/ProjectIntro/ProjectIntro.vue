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
          <!-- <el-switch v-model="switchValue" inline-prompt active-text="可见" inactive-text="隐藏" class="menu-switch" /> -->
        </span>
      </template>
      <div class="tool-main">
        <el-form :model="form" :inline="true">
          <div class="editorText">
            <el-form-item label="">
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
      </div>
      <template #footer>
        <!-- <span class="dialog-footer"> -->
        <el-button type="primary" @click="saveForm" v-if="editFlag">保存</el-button>
        <el-button type="warning" @click="closeDialog">关闭</el-button>
        <!-- </span> -->
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/* 依赖包 */
import { ref, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import useStore from '@/stores';
import { useRoute } from 'vue-router';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css'; // 引入 css
import {
    ElMessage,
    type FormInstance,
    type FormRules,
    ElMessageBox,
} from 'element-plus';
import { Base64 } from 'js-base64';
import { encode, decode } from 'js-base64';

/* API */
import { saveDataApi, getProjectIntroById } from './ProjectIntro-api';
import { getProjectById } from '@/utils/common-api';

/* UI 相关 */
import { ElTree } from 'element-plus';
const route = useRoute();
const { menuStore, viewStore, mapStore } = useStore();
/* 弹窗状态 */
const dialogVisible = ref(false);


/* 获取项目方案信息 */
// const getProjectIntro = async () => {
//   debugger;
//   let params = {
//     prjid: JSON.parse(decode(route.query.info as string)).prjid,
//   };
//   const { data: res } = await getProjectIntroById(params);
//   if (res.code !== 200) return ElMessage.warning(res.msg);
//   if (res.data != null) {
//     form.value.valueHtml = Base64.decode(res.data.data);
//   }
//   getProjectScheme();
// };

/* 获取项目方案信息 */
let ProjectName = ref(null);
const getProjectScheme = async () => {

  let params = {
    pid: JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId,
  };
  const { data: res } = await getProjectById(params);
  if (res.code !== 200) return ElMessage.warning(res.msg);
  if (res.data != null) {
    ProjectName.value = res.data.prjname;
    form.value.valueHtml = Base64.decode(res.data.prjintro);
  }
};

/* 保存 */
const saveForm = async () => {
    let dataParams = {
        pid: JSON.parse(
            sessionStorage.getItem('23vUser') as string
        )?.projectId,
        prjname: ProjectName.value,
        prjintro: Base64.encode(form.value.valueHtml),
    };
    const { data: res } = await saveDataApi(dataParams);
    console.log(res, 'res');
    if (res.code !== 200) return ElMessage.warning(res.msg);
    else return ElMessage.success(res.msg);
};

/* 富文本start */
// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();
// 内容 HTML
const valueHtml = ref<string>('');
const toolbarConfig = {
    toolbarKeys: [
        'headerSelect',
        'bold',
        'italic',
        'underline',
        'through',
        'color',
        'bgColor',
        'insertLink',
        'bulletedList',
        {
            key: 'group-justify',
            title: '对齐',
            iconSvg:
                '<svg viewBox="0 0 1024 1024"><path d="M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8zM972.8 102.4v102.4H51.2V102.4h921.6z"></path></svg>',
            menuKeys: [
                'justifyLeft',
                'justifyRight',
                'justifyCenter',
                'justifyJustify',
            ],
        },
        'blockquote',
        'emotion',
        'uploadImage',
        'insertTable',
        {
            key: 'group-more-style',
            title: '更多',
            iconSvg:
                '<svg viewBox="0 0 1024 1024"><path d="M204.8 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M505.6 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M806.4 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path></svg>',
            menuKeys: ['codeBlock', 'code', 'clearStyle'],
        },
        'undo',
        'redo',
    ],
};
const uploadImageList = ref([]);

//自定义粘贴中带图片
const customPaste = (editor, event, callback) => {
    let html = event.clipboardData.getData('text/html');

    editor.dangerouslyInsertHtml(html);
    // 返回 false ，阻止默认粘贴行为
    event.preventDefault();
    callback(false);
};
const editorConfig = {
    placeholder: '请输入内容...',
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
const form = ref({
    name: '',
    sort: 0,
    intro: '',
    valueHtml: '',
});

/* 关闭弹窗 */
const closeDialog = () => {
    // 菜单恢复初始值
    if (menuStore.currFunc.code == 'xmjj') {
        // menuStore.currFunc = null;
        menuStore.handleFunc('');
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
    getProjectScheme();
    // viewer = window.viewer;
    // getProjectScheme();
    // setWatchView();
});
</script>

<style scoped lang="scss">
@use './ProjectIntro.scss';
</style>
