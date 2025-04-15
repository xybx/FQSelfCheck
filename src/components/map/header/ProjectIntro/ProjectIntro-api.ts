import request from '@/utils/request';
/* 保存项目简介 */
export const saveDataApi = (data: any) => {
    return request({
        method: 'POST',
        url: '/project-scheme/update',
        data,
    });
};

//根据项目id获取项目简介
export const getProjectIntroById = (params: any) => {
    return request({
        method: 'GET',
        url: '/project-scheme/queryPrjIntroByPrjID',
        params,
    });
}

