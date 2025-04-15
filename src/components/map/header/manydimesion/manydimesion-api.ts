import request from '@/utils/request';

/* 获取视角列表 */
export const getDataApi = (params: any) => {
    return request({
        method: 'GET',
        url: '/manyview/id',
        params,
    });
};

/* 新增视角项 */
export const insertDataApi = (data: any) => {
    return request({
        method: 'POST',
        url: '/manyview/add',
        data,
    });
};

/* 删除视角 */
export const delDataApi = (params: any) => {
    return request({
        method: 'GET',
        url: '/manyview/del',
        params,
    });
};
