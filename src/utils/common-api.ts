import axios from "axios";
import request from "@/utils/request";
//通用查询arcgis serverurl query
export const getQuery = (url: string, params: any) => {
    return axios({
        method: "GET",
        baseURL: url + "/query?f=json",
        params,
    });
};

/*  query查询传入参数设置如下：
   // let data = <any>{};
        // data.geometry = "{'rings': [[[107.11666700000018,29.166667000000132],[114.50000000000011,29.60000000000008],[114.35000000000014,25.400000000000148],[107.18333300000006,24.966667000000143],[107.11666700000018,29.166667000000132]]]}";
        //data.geometryType = "esriGeometryPolygon";
        //data.spatialRel = "esriSpatialRelIntersects";
        //data.units = "esriSRUnit_Meter";
        //data.outSpatialReference = JSON.stringify(spa);
        // data.where = "1=1";
        // data.returnGeometry = true;
        // data.f = "pjson";
        // data.outFields = "*";
        // const res = await getQuery(d.url, data);
        // console.log(res, "query-result");
 */

//通用查询arcgis serverurl find
export const getFind = (url: string, params: any) => {
    return axios({
        method: "GET",
        baseURL: url + "/find",
        params,
    });
};

//调用arcgis GeometryServer.project 进行坐标转换
export const getProject = (url: string, params: any) => {
    return axios({
        method: "GET",
        baseURL: url + "/project",
        params,
    });
};

//根据项目id获取项目详细信息
export const getProjectById = (params: any) => {
    return request({
        method: "GET",
        url: "/project-scheme/selectByPid",
        params,
    });
};

//新增/编辑模块的显示隐藏控制
export const addModuleVisible = (data: any) => {
    return request({
        method: "POST",
        url: "/project-modulelist/eidtData",
        data,
    });
};

//根据prjid获取所有模块的显示隐藏
export const getModuleById = (params: any) => {
    return request({
        method: "GET",
        url: "/project-modulelist/selectByProjectModulelist",
        params,
    });
};

//根据prjid 获取项目红线范围内以及相交的详规盒子数据
export const GetBoxById = (params: any) => {
    return request({
        method: "GET",
        url: "/project-scheme/xghz",
        params,
    });
};

//根据prjpassword获取该系统登录权限token认证
export const getAuth = (prjPassword: any) => {
    // return axios.create({
    //     method: 'GET',
    //     baseURL: window.apiURL + '/login/dzbp/auth',
    //     headers: {
    //         prjPassword: prjPassword
    //     }
    // });
    return axios({
        method: "GET",
        baseURL: window.apiURL + "/login/dzbp/auth",
        headers: {
            prjPassword: prjPassword,
        },
    });
    // return axios({
    //     method: 'GET',
    //     baseURL: window.apiURL + '',
    //     headers: {
    //         prjPassword: prjPassword
    //     }
    // });
};

// 获取3dtile的JSON
export const get3DJson = (url: string) => {
    return axios({
        method: "GET",
        url,
    });
};

// 获取模型设置 code=xxx
export const getModuleConfig = (params: any) => {
    return request({
        method: "GET",
        url: "/project-scheme/height",
        params,
    });
};

// 保存模型设置
export const setModuleConfig = (data: any, u: any) => {
    return request({
        method: "POST",
        url: "/project-scheme/height",
        data,
        headers: {
            u,
        },
    });
};
