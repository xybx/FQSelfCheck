import request from "@/utils/request";

//根据项目id获取项目详细信息
export const getProjectByPrjid = (params: any) => {
    return request({
        method: 'GET',
        url: '/project-allindex/selectByPrjid',
        params,
    });
}
