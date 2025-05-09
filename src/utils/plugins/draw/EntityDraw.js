import * as Cesium from "cesium";
//import PolylineAntialiasingMaterialProperty from '@/utils/PolylineAntialiasingMaterialProperty';
//流动线
//import { PolylineTrailLinkMaterialProperty } from '@/utils/cesiumExt/PolylineTrailLinkMaterialProperty';
//线材质图片
import allowpng from '@/assets/images/cesium-images/arrow_1.png';
//水材质的图片
import waterJpg from "@/assets/images/cesium-images/waterNormals.jpg";

import { getLength, addPoint, addLabel } from "@/utils/cesiumExt/tool";
import { cartesian3ToCoordinates } from "@/utils/cesiumExt/coordinate";
import * as turf from '@turf/turf';

export default class EntityDraw {
    //viewer=false;
    constructor(viewer) {
        this.tips_content = "单击开始绘制\n右键结束绘制";
        this.isground = true; //传入绘制的图形是否贴地，默认贴地
        this.viewer = viewer;
        this.assistPoints = [];
        this.assistLabels = [];
        this.org_postions = [];
        this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        this.initEvents();
    }

    //激活
    //drawObject:绘制图形的符号话参数
    //isground //传入绘制的图形是否贴地，默认贴地(多边形有效)
    activate(drawObject, isground = true) {

        this.isground = isground;
        this.deactivate();
        this.clear();
        this.drawSymbol = drawObject;
        this.drawType = drawObject.type;
        this.positions = [];
        this.points = [];//经纬度点
        // this.latlongs = [];//经纬度坐标数据
        this.tempPositions = [];
        this.registerEvents(); //注册鼠标事件 

        //设置鼠标状态 
        this.viewer.enableCursorStyle = false;
        this.viewer._element.style.cursor = 'default';
        // this.DrawStartEvent.raiseEvent("开始绘制");
    }

    //禁用
    deactivate() {
        this.unRegisterEvents();
        this.drawType = undefined;
        this.drawEntity = undefined;

        this.viewer._element.style.cursor = 'pointer';
        this.viewer.enableCursorStyle = true;
    }

    //清空绘制
    clear() {
        if (this.drawEntity) {
            this.viewer.entities.remove(this.drawEntity);
            this.drawEntity = undefined;
        }
        if (this.assistLabels.length > 0) {
            this.assistLabels.forEach(entity => {
                this.viewer.entities.remove(entity);
            });
        }
        if (this.assistPoints.length > 0) {
            this.assistPoints.forEach(entity => {
                this.viewer.entities.remove(entity);
            });
        }
    }

    //初始化事件
    initEvents() {

        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.DrawStartEvent = new Cesium.Event(); //开始绘制事件
        this.DrawEndEvent = new Cesium.Event(); //结束绘制事件        
    }

    //注册鼠标事件
    registerEvents() {
        this.leftClickEvent();
        this.rightClickEvent();
        this.mouseMoveEvent();
    }

    leftClickEvent() {

        //单击鼠标左键画点
        this.handler.setInputAction(event => {
            console.log("leftClickEvent", event);
            this.viewer._element.style.cursor = 'default';
            let position = this.viewer.scene.pickPosition(event.position);
            console.log(position, event, "左键画点");
            if (!position) {
                console.log(position, event, "左键画点ellipsoid");
                position = this.viewer.scene.camera.pickEllipsoid(event.position, this.viewer.scene.globe.ellipsoid);
            }
            if (!position) return;
            this.positions.push(position);
            if (this.positions.length == 1) {
                this.handleFirstPosition();
            }
            //空间测距
            if (this.drawType == "SpaceLength") {
                if (this.positions.length > 1) {

                    var cartographic = this.positions[0];
                    if (this.positions.length > 2) {
                        cartographic = this.positions[this.positions.length - 2];
                    }
                    let _prePoint = cartesian3ToCoordinates(cartographic);
                    let prePoint = turf.point(_prePoint);
                    let _curPoint = cartesian3ToCoordinates(position);
                    let curPoint = turf.point(_curPoint);
                    let height = (Number(_prePoint[2]) + Number(_curPoint[2])) / 2;
                    var features = turf.featureCollection([prePoint, curPoint]);
                    var center = turf.center(features);
                    var pCenter = Cesium.Cartesian3.fromDegrees(center.geometry.coordinates[0], center.geometry.coordinates[1], height)
                    let text = getLength(this.positions);
                    let labelEntity = addLabel(pCenter, text, this.drawSymbol);
                    console.log(center, pCenter, this.positions[this.positions.length - 1]);
                    //let labelEntity = addLabel(this.positions[this.positions.length - 1], text, this.drawSymbol);
                    this.viewer.entities.add(labelEntity);
                    this.assistLabels.push(labelEntity);
                }
                let pointEntity = addPoint(this.positions[this.positions.length - 1], this.drawSymbol);
                this.viewer.entities.add(pointEntity);
                this.assistPoints.push(pointEntity);
            }

            console.log(this.position, event, "左键画点end");
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    handleFirstPosition() {

        switch (this.drawType) {
            case "Point":
            case "billboard":
            case "Text":
            case "Fire":
            case "Smoke":
            case "Fountain":
                //this.tips_content = "当前绘制点\n左键点击地图绘制点完成";
                this.generatePoint();
                this.drawEnd();
                break;
            case "Polyline":
                //this.tips_content = "当前绘制线\n左键点击地图开始绘制\n右键点击结束绘制";
                this.generatePolyline();
                break;
            case "SpaceLength":
                this.generateSpacePolyline();
                // if (this.positions.length == 2) {
                //     this.drawEnd();
                // }
                break;
            case "Polygon":
            // this.generatePolygon()
            case "Water":
                //this.tips_content = "当前绘制多边形面\n左键点击地图开始绘制\n右键点击结束绘制";
                this.generatePolygon();
                break;
            case "Cube":
                //this.tips_content = "当前绘制立方体\n左键点击地图开始绘制\n右键点击结束绘制";
                this.generateCube();
                break;
        }
    }

    generatePoint() {
        this.drawEntity = this.viewer.entities.add({
            position: this.positions[0],
            point: {
                pixelSize: 4,
                color: Cesium.Color.RED
            }
        })
    }

    generatePolyline() {
        console.log(this.isground == true, this.isground);
        this.drawEntity = this.viewer.entities.add({
            polyline: {
                positions: new Cesium.CallbackProperty(e => {
                    return this.tempPositions;
                }, false),
                width: this.drawSymbol.geosize,
                // material: new Cesium.PolylineDashMaterialProperty({
                //     color: Cesium.Color.fromCssColorString(this.drawSymbol.color),
                // }),
                //material: Cesium.Color.fromCssColorString(this.drawSymbol.color),
                material: new Cesium.ImageMaterialProperty({
                    image: allowpng,
                    speed: 20,
                    color: Cesium.Color.fromCssColorString(this.drawSymbol.color),
                    repeat: { x: 40, y: 1 }
                }),
                //material: new Cesium.PolylineTrailLinkMaterialProperty(Cesium.Color.RED, '', 2000),
                // depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
                //     color: Cesium.Color.fromCssColorString(this.drawSymbol.color),
                // }),
                depthFailMaterial: Cesium.Color.fromCssColorString(this.drawSymbol.color),
                classificationType: this.drawSymbol.isground == true ? Cesium.ClassificationType.TERRAIN : Cesium.ClassificationType.BOTH,//多边形贴地形
                clampToGround: this.drawSymbol.isground == true ? true : false, //线贴地形
            }
        })

        console.log(this.drawEntity, this.drawEntityclassificationType);
    }

    //空间测距划线
    generateSpacePolyline() {
        console.log(this.isground == true, this.isground);
        this.drawEntity = this.viewer.entities.add({
            polyline: {
                positions: new Cesium.CallbackProperty(e => {
                    return this.tempPositions;
                }, false),
                width: this.drawSymbol.geosize,
                material: Cesium.Color.fromCssColorString(this.drawSymbol.color),
                depthFailMaterial: Cesium.Color.fromCssColorString(this.drawSymbol.color),
                classificationType: this.drawSymbol.isground == true ? Cesium.ClassificationType.TERRAIN : Cesium.ClassificationType.BOTH,//多边形贴地形
                clampToGround: this.drawSymbol.isground == true ? true : false, //线贴地形
            }
        })
        console.log(this.drawEntity, this.drawEntityclassificationType);
    }

    generatePolygon() {
        //let polylineMaterPro = new PolylineAntialiasingMaterialProperty({ color: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor) });
        this.drawEntity = this.viewer.entities.add({
            polygon: {
                hierarchy: new Cesium.CallbackProperty(() => {
                    return new Cesium.PolygonHierarchy(this.tempPositions);
                }, false),
                //meterial: Cesium.Color.fromCssColorString(this.drawSymbol.color),
                material: Cesium.Color.RED.withAlpha(0.6),
                // classificationType: this.isground ? Cesium.ClassificationType.BOTH : Cesium.ClassificationType.TERRAIN,//多边形贴地形
                //perPositionHeight: true,//多边形贴地形不可以设置此参数
                classificationType: this.drawSymbol.isground == true ? Cesium.ClassificationType.TERRAIN : Cesium.ClassificationType.BOTH,//多边形贴地形
                clampToGround: true, //线贴地形
            },
            polyline: {
                positions: new Cesium.CallbackProperty(e => {
                    return this.tempPositions.concat(this.tempPositions[0]);
                }, false),
                width: this.drawSymbol.outlineWidth,
                // material: new Cesium.PolylineDashMaterialProperty({
                //     color: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),
                // }),
                material: new Cesium.PolylineDashMaterialProperty({
                    color: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),
                }),
                //material: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),//Cesium.Color.RED.withAlpha(0.6),
                depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
                    color: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),
                }),
                //classificationType: Cesium.ClassificationType.BOTH,
                // clampToGround: this.isground, //线贴地形
                classificationType: this.drawSymbol.isground == true ? Cesium.ClassificationType.TERRAIN : Cesium.ClassificationType.BOTH,//多边形贴地形
                clampToGround: true, //线贴地形
            }
        })
    }

    //立方体
    generateCube() {
        const cartographic = this.viewer.camera.positionCartographic;
        this.elevation = this.viewer.scene.globe.getHeight(cartographic) > 0
            ? this.viewer.scene.globe.getHeight(cartographic).toFixed(1)
            : 0;
        //let polylineMaterPro = new PolylineAntialiasingMaterialProperty({ color: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor) });
        console.log(Cesium.Color.fromCssColorString(this.drawSymbol.color), "this.drawSymbol.color");
        let colorobj = Cesium.Color.fromCssColorString(this.drawSymbol.color);
        this.drawEntity = this.viewer.entities.add({
            polygon: {
                hierarchy: new Cesium.CallbackProperty(() => {
                    return new Cesium.PolygonHierarchy(this.tempPositions);
                }, false),
                //meterial: new Cesium.Color(colorobj.red, colorobj.green, colorobj.blue, colorobj.alpha),
                material: Cesium.Color.RED.withAlpha(0.6),
                classificationType: this.drawSymbol.isground == true ? Cesium.ClassificationType.TERRAIN : Cesium.ClassificationType.BOTH,//多边形贴地形
                //clampToGround: true, //线贴地形
                extrudedHeight: Number(this.elevation) + Number(this.drawSymbol.height),//设置立体高度
                //perPositionHeight: true,//多边形贴地形不可以设置此参数
                arcType: Cesium.ArcType.RHUMB,
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),
            },
            polyline: {
                positions: new Cesium.CallbackProperty(e => {
                    return this.tempPositions.concat(this.tempPositions[0]);
                }, false),
                width: this.drawSymbol.outlineWidth,
                // material: new Cesium.PolylineDashMaterialProperty({
                //     color: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),
                // }),
                material: new Cesium.PolylineDashMaterialProperty({
                    color: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),
                }),
                //material: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),//Cesium.Color.RED.withAlpha(0.6),
                depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
                    color: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),
                }),
                //classificationType: Cesium.ClassificationType.BOTH,
                classificationType: this.drawSymbol.isground == true ? Cesium.ClassificationType.TERRAIN : Cesium.ClassificationType.BOTH,//多边形贴
                //clampToGround: true, //线贴地形
            }
        })
    }

    //添加提示性文字
    addTips(point, text) {
        if (this.tips != null) {
            this.viewer.entities.remove(this.tips);
        }
        this.tips = this.viewer.entities.add(
            new Cesium.Entity({
                position: point,
                label: {
                    text: text,
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
    }

    mouseMoveEvent() {
        this.handler.setInputAction(movement => {
            this.viewer._element.style.cursor = 'default'; //由于鼠标移动时 Cesium会默认将鼠标样式修改为手柄 所以移动时手动设置回来
            let position = this.viewer.scene.pickPosition(movement.endPosition);
            //添加鼠标移动提示文字
            this.addTips(position, this.tips_content);

            if (!position) {
                position = this.viewer.scene.camera.pickEllipsoid(movement.startPosition, this.viewer.scene.globe.ellipsoid);
            }
            if (!position) return;
            if (!this.drawEntity) return;
            this.tempPositions = this.positions.concat([position]);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    rightClickEvent() {
        this.handler.setInputAction(rightevent => {
            if (!this.drawEntity) {
                this.deactivate()
                return;
            }
            switch (this.drawType) {
                case "Polyline":
                    this.drawEntity.polyline.positions = this.positions;
                    this.minPositionCount = 2;
                    break;
                case "Cube":
                case "Polygon":
                case "Water":
                    this.drawEntity.polygon.hierarchy = this.positions;
                    this.drawEntity.polyline.positions = this.positions.concat(this.positions[0]);
                    this.minPositionCount = 3;
                    break;
            }
            if (this.positions.length < this.minPositionCount) {
                this.clear();
                this.deactivate();
                return;
            }
            this.drawEnd();
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
        this.drawEntity.remove = () => {
            this.viewer.entities.remove(this.drawEntity);
        }
        if (this.tips != null) {
            this.viewer.entities.remove(this.tips);
        }
        this.DrawEndEvent.raiseEvent(this.drawEntity, this.positions, this.drawType);
        this.deactivate();
    }
}