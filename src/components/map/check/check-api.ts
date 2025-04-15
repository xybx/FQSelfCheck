import request from "@/utils/request";

// 获取文件数据
export const getFileDataApi = (params: any, u: any) => {
    return request({
        method: "GET",
        url: "/project-scheme-attach/data",
        params,
        headers: {
            u,
        },
    });
};

// 上传图片
export const uploadPicApi = (data: any, u: any) => {
    return request({
        method: "POST",
        url: "/project-scheme-attach/upload",
        data,
        headers: {
            u,
        },
    });
};

// 获取当前项目状态
export const getStatusApi = (params: any, u: any) => {
    return request({
        method: "GET",
        url: "/project-scheme-attach/status",
        params,
        headers: {
            u,
        },
    });
};

// 推送PDF文件
export const getPdfFileApi = (pid: number, u: any) => {
    return request({
        method: "POST",
        url: `/project-scheme-attach/push/${pid}`,
        headers: {
            u,
        },
    });
};

// 获取文件流数据
export const getStreamDataApi = (pid: number, u: any) => {
    return request({
        method: "GET",
        url: `/project-scheme-attach/download/${pid}`,
        responseType: "blob",
        headers: {
            u,
        },
    });
};
