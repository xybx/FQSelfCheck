/// <reference types="vite/client" />

declare interface Window {
    apiURL: string;
    apiResource: string;
    // userInfo: {
    //     userName: string;
    //     password: string;
    // };
    cesiumToken: string;
    THREE: any;
    kkfileVersion: number;
    previewURL: string;
    geometryServer: string;
    mapTypes: any;
    layerData: any;
    viewer: any; // 地图实例
    addLayers: any[];
    visualAngle: any;
    editFlag: boolean;
    redLineBufferRadius: number;
    platformname: string;
    projectname: string;
    unit: string;
    fqMapData: any;
    initViewData: any;
    modelLayer: any; //三维方案模型
    isPlatform:Number;
    redlineEntity:any;
}

declare module "*.vue" {
    import type { DefineComponent } from "vue";
    const vueComponent: DefineComponent<{}, {}, any>;
    export default vueComponent;
}

declare module "element-plus/dist/locale/zh-cn.mjs";
