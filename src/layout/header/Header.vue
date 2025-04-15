<template>
    <div class="header-container">
        <div class="head-l">
            <div class="logo">{{ schemeName }}</div>
            <!-- <div class="user">
        <span>欢迎您：</span>
        <el-dropdown @command="handleDropdown">
          <span class="el-dropdown-link">
            {{ userName }}
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="exit">退出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div> -->
        </div>
        <el-menu
            :default-active="menuStore.currFunc?.code"
            class="head-r"
            mode="horizontal"
            @select="handleSelect"
        >
            <el-menu-item
                v-for="item in menuList"
                :key="item.code"
                :index="item.code"
                @click="handleClick(item)"
            >
                <div class="menu-box">
                    <span class="iconfont" :class="item.icon"></span>
                    <div>{{ item.name }}</div>
                </div>
            </el-menu-item>
            <el-menu-item
                @click="selfcheckCompleted()"
                v-if="editFlag && isPlatform == 1"
            >
                <div class="menu-box">
                    <span
                        class="iconfont icon-tijiaowancheng2"
                        style="color: #1afa29"
                    ></span>
                    <div>自检完成</div>
                </div>
            </el-menu-item>
        </el-menu>
    </div>
</template>
<script lang="ts" setup>
/* 依赖包 */
import { ref, onMounted } from "vue";
import useStore from "@/stores";
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { encode, decode } from "js-base64";
import { setSelfCheckCompleted } from "./header-api";
import { ElMessage, ElMessageBox } from "element-plus";

/* 取值 pinia */
const { menuStore } = useStore();
const { currFunc } = storeToRefs(menuStore);
const router = useRouter();
const route = useRoute();

/* 用户信息 */
const userName = ref<string>("");
const handleDropdown = (val: string) => {
    switch (val) {
        case "exit":
            sessionStorage.removeItem("23vUser");
            sessionStorage.removeItem("fqcimUser");
            sessionStorage.removeItem("fqcimPsd");
            router.push("/login");
            break;

        default:
            break;
    }
};

/*
    菜单点击选择
    key 为code值
*/
const handleSelect = (key: any) => {
    // currFunc.value = key;
    // console.log(key, 'key');
};

const handleClick = (item: any) => {
    currFunc.value = item;
    console.log(currFunc.value, "currFunc赋值");
};

/* 获取方案信息 */
const schemeName = ref<string>("");
const getSchemeInfo = () => {
    let info = JSON.parse(decode(route.query.info as string));
    schemeName.value = info.prjname;
    userName.value = JSON.parse(info.user)?.deparName;
};

//自检完成调用接口
const selfcheckCompleted = async () => {
    ElMessageBox.confirm("请确认是否提交自检完成？", "提示", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
    })
        .then(async () => {
            let pid = JSON.parse(
                sessionStorage.getItem("23vUser") as string
            )?.projectId;
            let { data: res } = await setSelfCheckCompleted(pid);
            //console.log(res.data, "res.data");
            if (res.code !== 200) return ElMessage.warning(res.msg);
            window.editFlag = false;
            ElMessage.success("提交自检完成成功");
        })
        .catch(() => {
            ElMessage({
                type: "info",
                message: "取消自检完成！",
            });
        });
};

/*
    菜单
    code 必须有值
*/
const menuList = [
    // {
    //   name: "详规审查",
    //   code: "xgsc",
    //   icon: "icon-kongjian",
    //   com: "PlanReview",
    // },
    {
        name: "模型视角",
        code: "swfa",
        icon: "icon-lifangtilitiduomiantifangkuai2",
        com: "ThreeDimension",
    },
    // {
    //     name: "模型位置",
    //     code: "mxwz",
    //     icon: "icon-yinqing_juli",
    //     com: "ModelInfo",
    // },
    // {
    //     name: "控高分析",
    //     code: "kgfx",
    //     icon: "icon-yinqing_juli",
    //     com: "LimitHeight",
    // },
    // {
    //     name: "天际线分析",
    //     code: "tjxfx",
    //     icon: "icon-iconfonttubiao_tianjixian",
    //     com: "SkyLine",
    // },
    // {
    //     name: '三维方案',
    //     code: 'swfa',
    //     icon: 'icon-lifangtilitiduomiantifangkuai2',
    //     com: 'ThreeDimension',
    // },
    // {
    //     name: "项目简介",
    //     code: "xmjj",
    //     icon: "icon-rili",
    //     com: "ProjectIntro",
    // },
    {
        name: "用地红线",
        code: "ydhx",
        icon: "icon-ditu",
        com: "RedLine",
    },
    // {
    //     name: '总平指标',
    //     code: 'zpzb',
    //     icon: 'icon-sand2',
    //     com: 'AllIndex',
    // },
    // {
    //     name: "单体指标",
    //     code: "dtzb",
    //     icon: "icon-mubiaohuizhi",
    //     com: "SingleIndex",
    // },
    // {
    //     name: '区域规划',
    //     code: 'qygh',
    //     icon: 'icon-area',
    //     com: 'AreaPlan',
    // },
    {
        name: "多维视角",
        code: "dwsj",
        icon: "icon-toumingdu",
        com: "ManyDimension",
    },
    // {
    //     name: '附件材料',
    //     code: 'fjcl',
    //     icon: 'icon-rili',
    //     com: 'AttachmentMaterial',
    // },
];
//判断是否可编辑
let editFlag = ref(false);
let isPlatform = ref(1);
onMounted(() => {
    // getSchemeInfo();
    isPlatform = window.isPlatform;
    editFlag = window.editFlag;
    schemeName.value = window.platformname;
});
</script>
<style lang="scss" scoped>
$main-color: #2d559f;
@import "../../assets/fonts/font.css";
.header-container {
    width: 100%;
    height: 80px;
    background-color: $main-color;
    display: flex;
}
.head-l {
    color: #fff;
    display: flex;
    align-items: center;
    padding-left: 22px;
    cursor: default;
    .logo {
        height: 100%;
        width: 700px;
        background-size: contain;
        font-family: "fangzheng-hei";
        font-size: 40px;
        font-style: italic;
        display: flex;
        align-items: center;
    }
    .user {
        font-size: 16px;
        margin-left: 36px;
        display: flex;
        align-items: baseline;
        .el-dropdown {
            cursor: pointer;
            color: #fff;
            :deep(.el-dropdown-link) {
                &:focus-visible {
                    outline: none;
                }
            }
        }
    }
}
:deep(.head-r) {
    flex: 1;
    justify-content: flex-end;
    padding-right: 10px;
    background-color: $main-color;
    border: 0;
    height: 100%;
    .el-menu-item {
        color: #fff;
        padding: 0 30px;
    }
    .iconfont {
        font-size: 30px;
        line-height: initial;
    }
    .iconImg {
        width: 35px;
        margin-bottom: 10px;
        line-height: 1;
    }
    .menu-box {
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
        padding: 0;
        height: 100%;
        color: #fff;
        > div {
            line-height: 1;
        }
    }
    .el-sub-menu__icon-arrow {
        display: none;
    }
    .el-sub-menu__title {
        padding: 0 30px;
    }
    .el-menu-item:not(.is-disabled):hover,
    .el-menu-item:not(.is-disabled):focus,
    .el-sub-menu .el-sub-menu__title:hover {
        background-color: #5075b9;
    }
}
</style>
