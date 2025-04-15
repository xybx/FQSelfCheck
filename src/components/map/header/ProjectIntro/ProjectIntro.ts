import request from '@/utils/request';
/* 保存三维方案 */
export const saveDataApi = (data: any) => {
    return request({
        method: 'POST',
        url: '/project-scheme/getredlineview',
        data,
    });
};

//根据项目id获取项目详细信息
export const getProjectById = (params: any) => {
    return request({
        method: 'GET',
        url: '/project-scheme/selectByPid',
        params,
    });
}

