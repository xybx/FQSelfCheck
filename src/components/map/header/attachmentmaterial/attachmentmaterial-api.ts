import request from '@/utils/request';

/* 获取附件材料 */
export const getTreeList = (params:object) => {
  return request({
    method: 'GET',
    url: '/materiafile/fileinmenus',
    params,
  });
}
export const downTreeFile = (fileid:string,token:string) => {
  return request({
    method: 'GET',
    url: '/materiafile/downloadFile?fileid='+ fileid +'&fullfilename=picture.png',
    headers: {
      Authorization:token
    },
  });
}
export const delTree = (params:object) => {
  return request({
    method: 'GET',
    url: '/materiafile/del',
    params,
  });
}