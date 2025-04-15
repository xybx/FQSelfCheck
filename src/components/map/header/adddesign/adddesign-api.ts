import request from '@/utils/request';
/* 获取设计列表 */
export const getDataApi = (params: any) => {
    return request({
        method: 'GET',
        url: '/commominfo/commonlist',
        params,
    });
};

/* 新增/编辑保存设计 */
export const insertDataApi = (data: any) => {
    return request({
        method: 'POST',
        url: '/commominfo/addcommon',
        data,
    });
};

/* 删除设计 */
export const delDataApi = (params: any) => {
    return request({
        method: 'GET',
        url: '/commominfo/delcommon',
        params,
    });
};

/* 删除图形 */
export const delDataGeoApi = (params: any) => {
    return request({
        method: 'GET',
        url: '/commominfo/deldraft',
        params,
    });
};

/* 获取要绘制的图标分组集合*/
export const getDrawDataApi = () => {
    return request({
        method: 'GET',
        url: '/commominfo/iconingroups',
    });
};

/*获取项目绘制的图形列表*/
export const getDrawGeoListApi = (params: any) => {
    return request({
        method: 'GET',
        url: '/commominfo/draflist',
        params,
    });
};