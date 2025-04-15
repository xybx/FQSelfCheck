import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import fs from "fs";
import externalGlobals from "rollup-plugin-external-globals";
import { createHtmlPlugin } from 'vite-plugin-html';
import postcss2vw from "postcss-px-to-viewport";

const devResourcesStrippedWhenBuild = [
  'lib/CesiumUnminified',
];
function stripDevResource() {
  return {
      name: 'strip-dev-resource',
      resolveId(source: string) {
        return source === 'virtual-module' ? source : null;
      },
      writeBundle(outputOptions: { dir: any; }, inputOptions: any) {
        const outDir = outputOptions.dir;
        for (let i = 0; i < devResourcesStrippedWhenBuild.length; ++i) {
          const devResource = path.resolve(outDir, devResourcesStrippedWhenBuild[i]);
          fs.rm(devResource, { recursive: true }, () => console.log(`Deleted ${devResource}`));
        }
      }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) =>({
    base: "./",
    plugins: [
        vue(),
        {
            ...stripDevResource(),
            apply: 'build',
        },
        createHtmlPlugin({
            minify: true,
            inject: {
              data: {
                injectScript: command === 'build' ?
                    `<link rel="stylesheet" href="/lib/Cesium/Widgets/widgets.css" />
                    <script>window['CESIUM_BASE_URL'] = "/lib/Cesium/"</script>
                    <script src="/lib/Cesium/Cesium.js"></script>`
                  :
                    `<link rel="stylesheet" href="/lib/CesiumUnminified/Widgets/widgets.css" />
                    <script>window['CESIUM_BASE_URL'] = "/lib/CesiumUnminified/"</script>`,
              },
            },
          }),
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            cesium: path.resolve(__dirname, "./public/lib/CesiumUnminified/index.js"),
        },
    },
    server: {
        fs: {
            strict: false,
        },
    },
    optimizeDeps: {
        include: ["cesium"],
    },
    build: {
        rollupOptions: {
            external: ["cesium"],
            plugins: [
                externalGlobals({
                    cesium: "Cesium",
                }),
            ],
        },
    },
    css: {
        postcss: {
            plugins: [
                postcss2vw({
                    unitToConvert: "px", // 要转化的单位
                    viewportWidth: 1920, // UI设计稿的宽度
                    unitPrecision: 3, // 转换后的精度，即小数点位数
                    propList: ["*"], // 指定转换的css属性的单位，*代表全部css属性的单位都进行转换
                    viewportUnit: "vw", // 指定需要转换成的视窗单位，默认vw
                    fontViewportUnit: "vw", // 指定字体需要转换成的视窗单位，默认vw
                    selectorBlackList: [], // 指定不转换为视窗单位的类名，
                    minPixelValue: 1, // 默认值1，小于或等于1px则不进行转换
                    mediaQuery: true, // 是否在媒体查询的css代码中也进行转换，默认false
                    replace: true, // 是否转换后直接更换属性值
                    // exclude: [/node_modules/], // 设置忽略文件，用正则做目录名匹配
                    exclude: [],
                    landscape: false, // 是否处理横屏情况
                }),
            ],
        },
    },
}));
