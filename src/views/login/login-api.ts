import request from '@/utils/request';

// 获取验证码
export const getCodeApi = (randomId: number) => {
    return request({
        method: 'GET',
        url: `/login/${randomId}`,
    });
};

// 登录
export const loginApi = (data: object) => {
    return request({
        method: 'POST',
        url: '/login/loginName',
        data,
    });
};
