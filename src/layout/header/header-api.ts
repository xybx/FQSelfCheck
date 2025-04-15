import request from "@/utils/request";

/* 获取功能列表 */
export const getFuncApi = () => {
  return request({
    method: "GET",
    url: "/dimensional/functionMenu",
  });
};

//自检完成接口
export const setSelfCheckCompleted = (pid: any) => {
  return request({
    method: "POST",
    url: "/project-scheme/" + pid,
  });
};
