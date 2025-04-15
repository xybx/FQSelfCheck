
import request from '@/utils/request';
/* 添加单体指标 */
export const addBuildingmonomer = (data: any) => {
    return request({
        method: 'POST',
        url: '/project-buildingmonomer/add',
        data,
    });
};
/* 删除单体指标 */
export const deleteBuildingmonomer = (data: any) => {
    return request({
        method: 'POST',
        url: '/project-buildingmonomer/delete',
        data,
    });
};
/* 修改单体数据 */
export const updateBuildingmonomer = (data: any) => {
    return request({
        method: 'POST',
        url: '/project-buildingmonomer/update',
        data,
    });
};

//通过项目id获取单体指标数据
export const selectByPrjid = (params: any) => {
    return request({
        method: 'GET',
        url: '/project-buildingmonomer/selectByPrjid',
        params,
    });
}
