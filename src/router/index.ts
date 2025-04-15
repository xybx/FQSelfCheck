import { createRouter, createWebHashHistory } from "vue-router";
import { encode, decode } from "js-base64";
import { ElMessage } from "element-plus";
import { getAuth } from "@/utils/common-api";
const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            redirect: "/login",
        },
        {
            path: "/login",
            name: "Login",
            component: () => import("../views/login/Login.vue"),
        },
        {
            path: "/index",
            name: "Index",
            component: () => import("../layout/index/Index.vue"),
            children: [
                {
                    path: "/home",
                    name: "Home",
                    component: () => import("../views/home/Home.vue"),
                },
            ],
        },
    ],
});

export default router;

// router.beforeEach((to, from, next) => {
//     if (!to.query.info) {
//         ElMessage.warning('缺少相关参数');
//         return false;
//     }
//     let info = JSON.parse(decode(to.query.info as string));
//     if (to.path == '/home' && info && JSON.parse(info.user)) {
//         sessionStorage.setItem('23vUser', info.user);
//         return next();
//     } else {
//         ElMessage.warning('缺少相关参数');
//     }
//     return next();
// });

router.beforeResolve(async (to, from, next) => {
    if (!to.query.info) {
        ElMessage.warning("缺少相关参数");
        return false;
    }
    //let info = JSON.parse(decode(to.query.info as string));

    let info = to.query.info;
    const { data: res } = await getAuth(info);
    if (res.code !== 200) {
        ElMessage.warning(res.msg);
        return;
    } else {
        if (to.path == "/home" && info && res.data) {
            sessionStorage.setItem("23vUser", JSON.stringify(res.data));
            //是否可编辑状态
            window.editFlag = res.data.editFlag;
            return next();
        } else {
            ElMessage.warning("缺少相关参数");
        }
    }

    return next();
});
