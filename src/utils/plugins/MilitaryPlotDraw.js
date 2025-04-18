
import * as Cesium from 'cesium';

import PlotDraw from "./draw/PlotDraw";
import MilitaryPlotLayer from "./draw/PlotLayer";

//军事标绘 
let ceiumMilitaryPlot = {
    viewer: null, //地图视图
    symbol: null, //符号样式 
    init(viewer) {
        this.viewer = viewer;
        this.initPlot();
        //this.initDatas();
    },

    //初始化标绘
    initPlot() {
        this.plotDraw = new PlotDraw(this.viewer);
        this.militaryPlotLayer = new MilitaryPlotLayer(this.viewer);
        this.militaryPlotLayer.setPlotSelectable(true);
        // this.plotDraw.PlotDrawEndEvent.addEventListener((drawPlot, type) => {
        //     drawPlot.remove(); //移除绘制的对象  
        //     console.log(drawPlot.toGeoJson(), "this.militaryPlotLayer");
        //     this.militaryPlotLayer.addPlot(drawPlot.toGeoJson(), this.plotTypeObject); //将标绘对象添加到图层中进行管理
        // });
    },

    //初始化数据
    // initDatas() {
    //     fetch("../../static/data/1602419460829.json").then(res => {
    //         return res.json();
    //     }).then(res => {
    //         let features = res.features;
    //         features.forEach(feature => {
    //             this.militaryPlotLayer.addPlot(feature, this.plotTypeObject);
    //         })
    //     }).catch(err => {
    //         console.log(err)
    //     })
    // },

    //激活绘制
    //plotTypeObject
    drawActivate(plotTypeObject) {
        this.plotTypeObject = plotTypeObject;
        this.plotDraw.activate(plotTypeObject);
    },

    // //保存到文件
    // savePlots() {
    //     const features = [];
    //     this.militaryPlotLayer.plots.forEach(plot => {
    //         features.push(plot.toGeoJson());
    //     })
    //     let geojson = {
    //         "type": "FeatureCollection",
    //         "features": features
    //     }
    //     let data = JSON.stringify(geojson);

    //     var blob = new Blob([data], { type: 'text/json' });
    //     var e = document.createEvent('MouseEvents');
    //     var a = document.createElement('a');
    //     a.download = new Date().getTime() + ".json";
    //     a.href = window.URL.createObjectURL(blob);
    //     a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
    //     e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    //     a.dispatchEvent(e);
    // },

    //清空
    clear() {
        this.militaryPlotLayer.clear();
    },

    //加载3dtiles数据
    load3dtiles() {
        var tileset = this.viewer.scene.primitives.add(
            new Cesium.Cesium3DTileset({
                url: "http://data.marsgis.cn/3dtiles/max-ytlhz/tileset.json",
            })
        );

        tileset.readyPromise
            .then(tileset => {
                this.tileset = tileset;
                this.viewer.zoomTo(
                    tileset,
                );
            })
            .otherwise(function (error) {
                console.log(error);
            });
    },

    //调整3dtiles的高度位置
    setTilesetHeight(tileset) {
        var cartographic = Cesium.Cartographic.fromCartesian(
            tileset.boundingSphere.center
        );
        var surface = Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            cartographic.height
        );
        var offset = Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude, 55
        );
        var translation = Cesium.Cartesian3.subtract(
            offset,
            surface,
            new Cesium.Cartesian3()
        );
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
    },

    destroy() {
        this.viewer.entities.removeAll();
        this.viewer.imageryLayers.removeAll(true);
        this.viewer.destroy();
    },

    //禁用绘制
    deactivate() {
        if (this.plotDraw) {
            this.plotDraw.deactivate();
            this.plotDraw.drawEnd();
        }

    },
}
export default ceiumMilitaryPlot;