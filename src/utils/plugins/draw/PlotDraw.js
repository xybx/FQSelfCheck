
import * as Cesium from 'cesium';

// import PlotDrawTip from "./PlotDrawTip"
// import MousePoint from "@/utils/cesiumExt/MousePoint"
import PlotFactory from './PlotFactory';
import PlotTypes from './PlotTypes';

import { point3dToPoint2d } from '@/utils/cesiumExt/utils3d';
import { ZERO_TOLERANCE } from "@/utils/cesiumExt/Constants";
import { distance } from "@/utils/cesiumExt/utils2d";
import { getPlotCode } from "@/utils/cesiumExt/PlotBaseUtils";

export default class PlotDraw {
    constructor(viewer) {
        this.viewer = viewer;
        this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        this.initEvents();
    }

    //激活
    //plotTypeObject
    activate(plotTypeObject) {

        this.plotTypeObject = plotTypeObject; //绘制的图形类型以及图形符号的样式信息
        this.plotType = plotTypeObject.type;
        this.clear();
        this.points = [];
        //this.plotDrawTip = new PlotDrawTip(this.viewer);
        //this.MousePoint = new MousePoint(this.viewer);

        this.registerEvents(); //注册鼠标事件  

        //设置鼠标状态 
        this.viewer.enableCursorStyle = false;
        this.viewer._element.style.cursor = 'default';
        this.initMouseTip();

        this.PlotDrawStartEvent.raiseEvent(); //触发开始绘制事件
    }

    initMouseTip() {
        const plotName = this.getPlotNam();
        const rightClickCancel = "按下鼠标右键取消绘制";
        const leftClickPickPoint = "按下鼠标左键确定第一个点的位置";

        switch (this.plotType) {
            case PlotTypes.MARKER:
                // this.plotDrawTip.setContent(["当前绘制类型：" + plotName + "，需要1个点", "按下鼠标左键确定位置", rightClickCancel])
                break;
            case PlotTypes.POLYLINE: //最少需要2个点
            case PlotTypes.SQUAD_COMBAT:
            case PlotTypes.TAILED_SQUAD_COMBAT:
                // this.plotDrawTip.setContent(["当前绘制类型：" + plotName + "，最少需要2个点", leftClickPickPoint, rightClickCancel])
                break;
            case PlotTypes.ELLIPSE: //需要2个点
            case PlotTypes.CIRCLE:
            case PlotTypes.RECTANGLE:
            case PlotTypes.FINE_ARROW:
            case PlotTypes.ASSAULT_DIRECTION:
                // this.plotDrawTip.setContent(["当前绘制类型：" + plotName + "，需要2个点", leftClickPickPoint, rightClickCancel])
                break;
            case PlotTypes.POLYGON: //最少需要3个点
            case PlotTypes.ATTACK_ARROW:
            case PlotTypes.TAILED_ATTACK_ARROW:
            case PlotTypes.CLOSED_CURVE:
                //this.plotDrawTip.setContent(["当前绘制类型：" + plotName + "，最少需要3个点", leftClickPickPoint, rightClickCancel])
                break;
            case PlotTypes.GATHERING_PLACE: //需要3个点
            case PlotTypes.SECTOR:
                //this.plotDrawTip.setContent(["当前绘制类型：" + plotName + "，需要3个点", leftClickPickPoint, rightClickCancel])
                break;
            case PlotTypes.DOUBLE_ARROW:
                //this.plotDrawTip.setContent(["当前绘制类型：" + plotName + "，需要4个点", leftClickPickPoint, rightClickCancel])
                break;
        }
    }

    getPlotNam() {
        switch (this.plotType) {
            case PlotTypes.MARKER:
                return "点";
            case PlotTypes.POLYLINE:
                return "线";
            case PlotTypes.POLYGON:
                return "面";
            case PlotTypes.ELLIPSE:
                return "椭圆";
            case PlotTypes.CIRCLE:
                return "正圆";
            case PlotTypes.RECTANGLE:
                return "矩形";
            case PlotTypes.CLOSED_CURVE:
                return "曲线面";
            case PlotTypes.SECTOR:
                return "扇形";
            case PlotTypes.FINE_ARROW:
                return "直箭头";
            case PlotTypes.ASSAULT_DIRECTION:
                return "突击方向";
            case PlotTypes.ATTACK_ARROW:
                return "点进攻方向";
            case PlotTypes.TAILED_ATTACK_ARROW:
                return "进攻方向尾";
            case PlotTypes.GATHERING_PLACE:
                return "集结地";
            case PlotTypes.SQUAD_COMBAT:
                return "分队作战";
            case PlotTypes.TAILED_SQUAD_COMBAT:
                return "分队作战尾";
            case PlotTypes.DOUBLE_ARROW:
                return "钳击";
        }
    }

    //禁用
    deactivate() {
        this.unRegisterEvents();
        this.plotType = undefined;

        this.viewer._element.style.cursor = 'pointer';
        this.viewer.enableCursorStyle = true;

        //if (!this.plotDrawTip) return;
        //this.plotDrawTip.remove();
        // if (this.MousePoint) {
        //     this.MousePoint.remove();
        //     //this.plotDrawTip = undefined;
        //     this.MousePoint = undefined;
        // }

    }

    //清空绘制
    clear() {
        if (this.plot) {
            this.plot.remove();
            this.plot = undefined;
        }
    }

    //添加第一个点后 构造一个标绘实体 
    generatePlot(points, height) {

        const plotCode = getPlotCode();
        //根据标绘数据格式构建
        let geoFeature = {
            "type": "Feature",
            "properties": {
                "plotCode": plotCode,
                "style": {
                    height
                },
                "attr": this.plotTypeObject,
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [points]
            }
        }

        this.plot = PlotFactory.createPlot(this.viewer, this.plotTypeObject, geoFeature);
        this.plot.openEditMode(true);
    }

    initEvents() {
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.PlotDrawStartEvent = new Cesium.Event(); //开始绘制事件
        this.PlotDrawEndEvent = new Cesium.Event(); //结束绘制事件        
    }

    //注册鼠标事件
    registerEvents() {
        this.leftClickEvent();
        this.rightClickEvent();
        this.mouseMoveEvent();
    }

    leftClickEvent() {
        //单击鼠标左键画点
        this.handler.setInputAction(e => {
            this.viewer._element.style.cursor = 'default'; //由于鼠标移动时 Cesium会默认将鼠标样式修改为手柄 所以移动时手动设置回来
            let position = this.viewer.scene.pickPosition(e.position);
            if (!position) {
                position = this.viewer.scene.camera.pickEllipsoid(e.position, this.viewer.scene.globe.ellipsoid);
            }
            if (!position) return;

            const point = point3dToPoint2d(position);
            let c = Cesium.Cartographic.fromCartesian(position);
            if (this.points.length == 0) { //绘制一个点后 才创建标绘对象 解决点类型标绘必须初始化时设置坐标
                this.points.push(point);
                this.generatePlot(this.points, c.height);
            } else {
                //如果两个点距离太小会报错（点击同一个点时报错 
                if (distance(point, this.points[this.points.length - 1]) < ZERO_TOLERANCE) return;
                this.points.push(point);

                this.plot.setPoints(this.points);
            }
            this.setMouseTipContent();
            if (this.plot.fixPointCount == this.points.length) {
                this.drawEnd();
                this.deactivate();
            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    setMouseTipContent() {
        const plotName = this.getPlotNam();
        switch (this.plotType) {
            case PlotTypes.POLYLINE: //最少需要2个点
            case PlotTypes.SQUAD_COMBAT:
            case PlotTypes.TAILED_SQUAD_COMBAT:
                // this.plotDrawTip.setContent(["当前绘制类型：" + plotName + "，最少需要2个点",
                // "已有" + this.points.length + "个点，" + "按下鼠标左键确定第" + (this.points.length + 1) + "个点", ,
                // this.points.length < 2 ? "按下鼠标右键取消绘制" : "按下鼠标右键结束绘制"
                // ])
                break;
            case PlotTypes.ELLIPSE: //需要2个点
            case PlotTypes.CIRCLE:
            case PlotTypes.RECTANGLE:
            case PlotTypes.FINE_ARROW:
            case PlotTypes.ASSAULT_DIRECTION:
                // this.plotDrawTip.setContent(["当前绘制类型：" + plotName + "，需要2个点",
                // "已有" + this.points.length + "个点，" + "按下鼠标左键确定第" + (this.points.length + 1) + "个点", ,
                //     "按下鼠标右键取消绘制"
                // ])
                break;
            case PlotTypes.POLYGON: //最少需要3个点
            case PlotTypes.ATTACK_ARROW:
            case PlotTypes.TAILED_ATTACK_ARROW:
            case PlotTypes.CLOSED_CURVE:
                // this.plotDrawTip.setContent(["当前绘制类型：" + plotName + "，最少需要3个点",
                // "已有" + this.points.length + "个点，" + "按下鼠标左键确定第" + (this.points.length + 1) + "个点", ,
                // this.points.length < 3 ? "按下鼠标右键取消绘制" : "按下鼠标右键结束绘制"
                // ])
                break;
            case PlotTypes.GATHERING_PLACE: //需要3个点
            case PlotTypes.SECTOR:
                // this.plotDrawTip.setContent(["当前绘制类型：" + plotName + "，需要3个点",
                // "已有" + this.points.length + "个点，" + "按下鼠标左键确定第" + (this.points.length + 1) + "个点", ,
                //     "按下鼠标右键取消绘制"
                // ])
                break;
            case PlotTypes.DOUBLE_ARROW:
                // this.plotDrawTip.setContent(["当前绘制类型：" + plotName + "，需要4个点",
                // "已有" + this.points.length + "个点，" + "按下鼠标左键确定第" + (this.points.length + 1) + "个点", ,
                //     "按下鼠标右键取消绘制"
                // ])
                break;
        }
    }

    //鼠标移动事件
    mouseMoveEvent() {
        this.handler.setInputAction(e => {
            let position = this.viewer.scene.pickPosition(e.endPosition);
            if (!position) {
                position = this.viewer.scene.camera.pickEllipsoid(e.endPosition, this.viewer.scene.globe.ellipsoid);
            }
            if (!position) return;

            //this.plotDrawTip.updatePosition(position);
            this.addtips(position);
            if (!this.plot) return;

            let point = point3dToPoint2d(position);
            if (distance(point, this.points[this.points.length - 1]) < ZERO_TOLERANCE) return;
            const ps = this.points.concat([point]);
            this.plot.setPoints(ps);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    rightClickEvent() {
        //右键的时候 两种情况 一是取消操作（一个点都没有的情况下 是取消当前工具） 
        //有点的时候（没有限制点数）是结束绘制    
        this.handler.setInputAction(e => {
            if (this.points.length == 0) { //右键结束时 如果一个点都么有 此时没有构建标绘对象 即取消操作
                this.deactivate();
                return;
            }

            if (this.plot.fixPointCount) { //如果标绘对象有限定点数 判断当前点是否满足限定点 
                if (this.points.length == this.plot.fixPointCount) {
                    this.plot.setPoints(this.points);
                    this.drawEnd();
                    this.deactivate();
                } else { //点数达不到限定点数 取消操作
                    this.deactivate();
                    this.clear();
                }
            } else { //如果有点 并且没有限制点数 判断是否满足最少点数 结束绘制 
                if (this.points.length >= this.plot.minPointCount) {
                    this.plot.setPoints(this.points);
                    this.drawEnd();
                    this.deactivate();
                } else { //当前点数不满足最少点数 取消操作
                    this.deactivate();
                    this.clear();
                }

            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    //解除鼠标事件
    unRegisterEvents() {
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }

    //绘制结束 触发结束事件
    drawEnd() {
        //设置鼠标状态      
        if (this.plot) {
            this.plot.openEditMode(false);
            this.PlotDrawEndEvent.raiseEvent(this.plot, this.plotType);
        }
        if (this.tips != null) {
            this.viewer.entities.remove(this.tips);
        }
    }

    addtips(position) {
        if (this.tips != null) {
            this.viewer.entities.remove(this.tips);
        }
        this.tips = this.viewer.entities.add(
            new Cesium.Entity({
                position: position,
                label: {
                    text: "单击开始绘制\n右键结束绘制",
                    font: '12px sans-serif',
                    style: Cesium.LabelStyle.FILL,
                    fillColor: Cesium.Color.WHITE,
                    showBackground: true, //指定标签后面背景的可见性
                    backgroundColor: new Cesium.Color(0, 0, 0, 0.8), // 背景颜色
                    backgroundPadding: new Cesium.Cartesian2(10, 10), //指定以像素为单位的水平和垂直背景填充
                    pixelOffset: new Cesium.Cartesian2(50, 50),
                    outlineWidth: 2,
                    outlineColor: Cesium.Color.WHITE,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
            })
        );
        //this.tipcollection.push(this.tips);
        //this.mousePointEntity.position = position;
    }
}