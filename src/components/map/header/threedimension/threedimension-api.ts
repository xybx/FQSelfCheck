import request from '@/utils/request';

//获取三维方案信息
export const getDataApi = (params: any) => {
    return request({
        method: 'GET',
        url: '/project-scheme/getredlineview',
        params,
    });
};



/* 保存三维方案 */
export const saveDataApi = (data: any) => {
    return request({
        method: 'POST',
        url: '/project-scheme/editredlineview',
        data,
    });
};





