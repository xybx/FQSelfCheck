import request from '@/utils/request';

/* 获取单体指标 */
export const getDataApi = (params: any) => {
    return request({
        method: 'GET',
        url: '/project-buildingmonomer/selectByPid',
        params,
    });
};
