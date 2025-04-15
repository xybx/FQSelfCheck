import request from '@/utils/request';
/* 保存三维方案 */
export const saveDataApi = (data: any) => {
    return request({
        method: 'POST',
        url: '/project-scheme/editredlineview',
        data,
    });
};
