<template>
    <div class="login-container">
        <div class="login-header">福清市城市设计CIM基础平台</div>
        <div class="login-main">
            <div class="login-title">用户登录</div>
            <el-form
                :model="loginForm"
                :rules="loginRules"
                ref="loginFormRef"
                size="large"
            >
                <el-form-item prop="userName">
                    <el-input
                        v-model="loginForm.userName"
                        placeholder="请输入手机号"
                        clearable
                        @keyup.enter="handleLogin(loginFormRef)"
                    >
                        <template #prefix>
                            <i class="iconfont icon-yonghu"></i>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item prop="password">
                    <el-input
                        v-model="loginForm.password"
                        placeholder="请输入密码"
                        type="password"
                        clearable
                        show-password
                        @keyup.enter="handleLogin(loginFormRef)"
                    >
                        <template #prefix>
                            <i class="iconfont icon-mima"></i>
                        </template>
                    </el-input>
                </el-form-item>
                <!-- <el-form-item>
                    <el-checkbox
                        v-model="keepPassword"
                        label="记住密码"
                        size="large"
                    />
                </el-form-item> -->
                <el-form-item>
                    <el-button type="primary" @click="handleLogin(loginFormRef)"
                        >登录</el-button
                    >
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCodeApi, loginApi } from './login-api';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

// 登录表单
const loginForm = reactive({
    userName: '',
    password: '',
});

const loginRules = reactive<FormRules>({
    userName: [
        {
            required: true,
            message: '用户名不能为空',
            trigger: 'blur',
        },
    ],
    password: [
        {
            required: true,
            message: '密码不能为空',
            trigger: 'blur',
        },
    ],
});

// 是否保存密码
const keepPassword = ref(false);

const router = useRouter();
const loginFormRef = ref<FormInstance>();
// 登录
const handleLogin = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate(async (valid, fields) => {
        if (!valid) return ElMessage.warning('请补充完整登录信息');
        let data = Object.assign(loginForm);
        const { data: res } = await loginApi(data);
        if (res.code === 200) {
            sessionStorage.setItem('23vUser', JSON.stringify(res.data));
            ElMessage.success(res.msg);
            if (keepPassword.value) {
                sessionStorage.setItem('fqcimUser', loginForm.userName);
                sessionStorage.setItem('fqcimPsd', loginForm.password);
            } else {
                sessionStorage.removeItem('fqcimUser');
                sessionStorage.removeItem('fqcimPsd');
            }
            router.push(`/home`);
        } else {
            ElMessage.warning(res.msg);
        }
    });
};

onMounted(() => {
    if (
        sessionStorage.getItem('fqcimUser') &&
        sessionStorage.getItem('fqcimPsd')
    ) {
        keepPassword.value = true;
        Object.assign(loginForm, {
            userName: sessionStorage.getItem('fqcimUser'),
            password: sessionStorage.getItem('fqcimPsd'),
        });
    }
});
</script>

<style scoped lang="scss">
@import './login.scss';
</style>
