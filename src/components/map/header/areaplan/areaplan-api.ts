import request from '@/utils/request';

/* 获取规划列表 */
export const getDataApi = (params: any) => {
    return request({
        method: 'GET',
        url: '/regionalplanning/id',
        params,
    });
};

/* 新增规划项 */
export const insertDataApi = (data: any) => {
    return request({
        method: 'POST',
        url: '/regionalplanning/add',
        data,
    });
};

/* 删除规划项 */
export const delDataApi = (params: any) => {
    return request({
        method: 'GET',
        url: '/regionalplanning/del',
        params,
    });
};
