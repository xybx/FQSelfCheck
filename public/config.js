// 接口地址
// const apiURL = 'http://192.168.1.250:8082/fqapi';
const apiURL = "http://192.168.1.250:8082/yzapi";
// const apiURL = 'http://192.168.1.182:8096';
const platformname = "福清市城市实验室--项目自检子平台";
//生产环境地址
// const apiURL = "http://www.fqghj.net:8088/fqzjapi";

// 服务器-底图图片路径
const apiResource = "http://192.168.1.250:8082/FileResources";

//cesium 密钥
const cesiumToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0MGMzM2NmOC0xN2M5LTQ0YzgtOWI1Ni1lYjhkY2RkZmIyZjgiLCJpZCI6MTA3OTU1LCJpYXQiOjE2NjMxMzkwMTZ9.Yz3FgXGRreHtJkEqn1nE8lx13nMj2JYW0SHgVDeH9jc";

// 用户登录信息
// const userInfo = {
//   userName: "13333333333",
//   password: "fq888888",
// };

//geosence的geometryServer的服务地址配置（用于坐标转换）
const geometryServer =
    "http://202.101.128.22:8030/arcgis/rest/services/Utilities/Geometry/GeometryServer";

// 文件预览插件版本：1-4.0版本，2-2.2.1版本
const kkfileVersion = 1;
// 文件预览插件配置地址
const previewURL = "http://192.168.1.132:8012/onlinePreview?url=";

// 服务类型
const mapTypes = [
    {
        pid: 1,
        label: "ArcGisMapServerImagery/ArcGIS服务",
        kind: 12,
    },
    {
        pid: 2,
        label: "CesiumTerrainProvider/Ceisum标准地形图",
        kind: 13,
    },
    {
        pid: 3,
        label: "GeoJsonDataSource/Geojson服务",
        kind: 14,
    },
    {
        pid: 4,
        label: "KmlDataSource/kml矢量数据",
        kind: 15,
    },
    {
        pid: 5,
        label: "Cesium3DTileset/3DTileset",
        kind: 16,
    },
];

// 图层树服务
const layerData = [
    {
        label: "福清倾斜片区4",
        level: 3,
        url: "http://192.168.1.250:9003/model/tlwiuk8nv/tileset.json",
        opacity: 100,
        kind: 16,
        pid: 169,
        visible: false,
    },
    {
        label: "天地图影像",
        basemapType: 2,
        isTiandi: 1,
        level: 3,
        url: "http://{s}.tianditu.gov.cn/img_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=",
        opacity: 100,
        kind: 10,
        pid: 19,
        visible: true,
    },
    {
        label: "天地图电子地图",
        basemapType: 1,
        isTiandi: 1,
        level: 3,
        url: "http://{s}.tianditu.gov.cn/vec_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=",
        opacity: 100,
        kind: 10,
        pid: 20,
        visible: false,
    },
    {
        label: "高程模型",
        pid: 9,
        url: "http://192.168.1.250:9003/terrain/89u44PEE",
        isTerrain: 1,
        kind: 19,
        visible: true,
        opacity: 100,
        level: 3,
    },
    {
        label: "福清倾斜片区4_新",
        level: 3,
        url: "http://192.168.1.250:9003/model/t1IZ5JQmA/tileset.json",
        opacity: 100,
        kind: 16,
        pid: 1701,
        visible: false,
    },
    // {
    //   label: "详规盒子_全部",
    //   level: 3,
    //   url: "http://192.168.1.250:9003/model/tHWNCOvH/tileset.json",
    //   opacity: 100,
    //   kind: 16,
    //   pid: 1712,
    //   visible: false,
    // },
    // {
    //   label: "详规盒子",
    //   level: 3,
    //   url: "http://192.168.1.250:9003/model/tHWNCOvH/tileset.json",
    //   opacity: 100,
    //   kind: 100,
    //   pid: 1711,
    //   visible: false,
    // },
    {
        label: "道路红线",
        level: 3,
        url: "http://202.101.128.22:8027/arcgis/rest/services/G2000/YGDTCX2000/MapServer/2",
        opacity: 100,
        kind: 99, //99:query查询
        pid: 3,
        visible: false,
    },
    // {
    //   label: "项目红线",
    //   level: 3,
    //   url: "",
    //   opacity: 100,
    //   kind: 99, //99:query查询
    //   pid: 1800,
    //   visible: false,
    // },
    {
        label: "项目红线",
        pid: 1800,
        visible: true,
        opacity: 100,
        kind: 20,
        feature: null,
        level: 3,
        isPrjRed: 1,
    },
    {
        label: "方案模型",
        level: 3,
        url: "",
        opacity: 100,
        kind: 16,
        pid: 4,
        visible: false,
    },
    {
        label: "xin方案模型",
        level: 3,
        url: "http://192.168.1.250:9003/model/dMKadrX6/tileset.json",
        opacity: 100,
        kind: 16,
        pid: 99999,
        visible: false,
    },
];

/* 视角参数配置 */
const visualAngle = {
    pitch: 45,
    distance: 2000,
};

//项目红线缓冲半径(米)
const redLineBufferRadius = 1000;

//区分自检平台和综合联审平台 1=自检平台,2=综合联审平台
const isPlatform = 1;

/* 
  福清天地图
  ! pid必须唯一
  ! 点击图层树上天地图时，福清天地图不会被遮盖
  ！kind 101是旧版，102是新版
*/
const fqMapData = [
    {
        basemapType: 2,
        isTiandi: 1,
        kind: 102,
        label: "福清天地影像图",
        level: 3,
        opacity: 100,
        pid: 520,
        url: 'http://www.fqghj.net:8088/fqtdt/arcgis/rest/services/fq_img/MapServer',
        visible: true,
    },
    {
        basemapType: 1,
        isTiandi: 1,
        kind: 102,
        label: "福清天地电子地图",
        level: 3,
        opacity: 100,
        pid: 521,
        url: "http://www.fqghj.net:8088/fqtdt/arcgis/rest/services/fq_vec/MapServer",
        visible: false,
    },
];

/* 
  初始化地图中心点
  @longitude - 经度
  @latitude - 纬度
  @height - 视点高度
  @heading - 方位角
  @pitch - 倾斜角
*/
const initViewData = {
    longitude: 119.37521433353923,
    latitude: 25.72010493145261,
    shigao: 98761,
    height: 518.5,
    heading: 7,
    pitch: -17.6,
};
