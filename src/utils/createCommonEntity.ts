import * as Cesium from 'cesium';
import * as turf from '@turf/turf';
import { cartesian3ToCoordinates, coordinatesToCartesian3 } from '@/utils/cesiumExt/coordinate';
import { getPolygonArea } from "@/utils/cesiumExt/baseUtils";

/* 弹出框 */
import { ElMessage } from 'element-plus';

/* 地标图片 */
import greenpng from "@/assets/images/green.png";
import redpng from "@/assets/images/red.png";
import bluepng from "@/assets/images/blue.png";

//viewer:视图
/*symbol：符号化参数（明细）
    istextshow:true,//是否显示标注文字（默认true）
    text:'文本标注',
    textcolor:文本颜色,
    fontsize:字体大小,
    showbackground:是否显示背景色（文字标注）默认true,
    backgroundcolor:背景颜色,
    outlinewidth:边框宽度,
    outlinecolor:边框颜色,
    heightreference:贴地设置,
    classificationtype:贴地设置,
    show:显示隐藏（默认true）,
    imageurl:图片地址,
    geosize:图形大小,
    color:图形颜色,
    height:立体高度
*/
//entities:实体集合
//positions:坐标点列表
const createCommonEntity = {
    viewer: null,
    symbol: {},
    entities: [],
    coordinates: [],//经纬度坐标
    positions: [],//笛卡尔坐标
    //entityid: String,
    init(options: any) {
        //debugger;
        this.entities = [];
        this.viewer = options.viewer || null;
        //let symbol=
        // this.symbol = options.symbol || {};
        this.symbol = {
            istextshow: options.symbol.istextshow || true,//是否显示标注文字（默认true）
            text: options.symbol.text || '',//'文本标注',
            textcolor: options.symbol.textcolor || 'rgba(255, 0, 0, 1)',//Cesium.Color.RED,//文本颜色(默认红色),
            fontsize: options.symbol.fontsize || 24,//字体大小,
            showbackground: options.symbol.showbackground || true,//是否显示背景色（文字标注）默认true,
            backgroundcolor: options.symbol.textcolor || 'rgba(0, 0, 0, 0.3)',//Cesium.Color.BLACK.withAlpha(0.3),//背景颜色,
            outlinewidth: options.symbol.outlinewidth || 2,//边框宽度,
            outlinecolor: options.symbol.textcolor || 'rgba(255, 255, 0, 1)',//Cesium.Color.WHITE,//边框颜色,
            heightreference: options.symbol.heightreference || Cesium.HeightReference.RELATIVE_TO_GROUND,//贴地设置,
            classificationtype: options.symbol.classificationtype || Cesium.ClassificationType.BOTH, //贴地设置,
            show: options.symbol.show || true,//显示隐藏（默认true）,
            imageurl: options.symbol.imageurl || greenpng,//图片地址,
            geosize: options.symbol.geosize || 16,//图形大小,
            color: options.symbol.color || 'rgba(255, 0, 0, 0.3)',//, //图形颜色,
            height: options.symbol.height || 10,//立体高度
        };
        //this.entityid = options.entityid;
    },

    //传入坐标点
    setPositions(options: any) {

        this.coordinates = options.coordinates || [];
        this.positions = options.positions || [];
        if (this.coordinates.length == 0 && this.positions.length == 0) {
            return ElMessage.error("传入坐标点为空！");
        }
        if (this.positions.length == 0) {
            //经纬度转笛卡尔坐标
            this.coordinates.forEach(c => {
                let position = coordinatesToCartesian3(c);
                this.positions.push(position)
            });
        }
        if (this.coordinates.length == 0) {
            //笛卡尔坐标转经纬度
            this.positions.forEach(p => {
                let coordinate = cartesian3ToCoordinates(p);
                this.coordinates.push(coordinate)
            });
        }
    },

    //创建实体标注符号
    //entityid:实体id
    createLabel(geoEntity) {
        let label = {
            text: this.symbol.text,
            showBackground: this.symbol.showbackground,
            font: 'normal ' + this.symbol.fontsize + 'px MicroSoft YaHei',
            backgroundColor: Cesium.Color.fromCssColorString(this.symbol.backgroundcolor),
            backgroundPadding: new Cesium.Cartesian2(15, 10),
            fillColor: Cesium.Color.fromCssColorString(this.symbol.textcolor),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scale: 0.5,
            outlineWidth: this.symbol.outlinewidth,
            outlineColor: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
            //pixelOffset: new Cesium.Cartesian2(0, -40),
            show: this.symbol.show,
            heightReference: this.symbol.heightreference
        };
        geoEntity.label = label;
    },

    //创建文本标注实体
    //entityid:实体id
    createText(entityid) {
        let labelEntity = new Cesium.Entity({
            id: entityid,
            position: this.positions[0],
        });
        this.createLabel(labelEntity);
        this.entities.push(
            {
                entity: labelEntity,
                symbol: this.symbol,
                coordinates: this.coordinates,
                positions: this.positions,
                center: this.positions[0],
            });
    },

    //创建广告牌实体
    //entityid:实体id
    createBillboard(entityid) {
        let _symbol = {
            // 图像地址，URI或Canvas的属性
            image: this.symbol.imageurl,
            // 设置颜色和透明度
            //color: Cesium.Color.fromCssColorString(this.symbol.color), //Cesium.Color.WHITE.withAlpha(0.8)
            //scaleByDistance: new Cesium.NearFarScalar(300, 1, 1200, 0.6), //设置随图缩放距离和比例               
            // 高度（以像素为单位）
            height: 36,
            // 宽度（以像素为单位）
            width: 30,
            // 逆时针旋转
            rotation: 0,
            // 大小是否以米为单位
            sizeInMeters: false,
            // 相对于坐标的垂直位置
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            // 相对于坐标的水平位置
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            // 该属性指定标签在屏幕空间中距此标签原点的像素偏移量
            // pixelOffset: new Cesium.Cartesian2(10, 0),          
            //让模型在地形上紧贴
            heightReference: this.symbol.imageurl,
            //disableDepthTestDistance: 10,
            scale: 1.0,
            // 是否显示
            show: this.symbol.show,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            //clampToGround: true,
        };
        let geoEntity = new Cesium.Entity({
            id: entityid,
            position: this.positions[0],
            billboard: _symbol,
        });
        if (this.symbol.istextshow && this.symbol.text != '') {
            this.createLabel(geoEntity);
        }
        this.entities.push(
            {
                entity: geoEntity,
                symbol: this.symbol,
                coordinates: this.coordinates,
                positions: this.positions,
                center: this.positions[0],
            });
        return geoEntity;
    },

    //创建点实体
    //entityid:实体id
    createPoint(entityid) {
        let geoEntity = new Cesium.Entity({
            id: entityid,
            position: this.positions[0],
            point: {
                pixelSize: this.symbol.geosize,
                color: Cesium.Color.fromCssColorString(this.symbol.color),
                outlineWidth: this.symbol.outlinewidth,
                outlineColor: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
                heightReference: this.symbol.heightreference,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, Number.MAX_VALUE),
                show: this.symbol.show,
            }
        });
        if (this.symbol.istextshow && this.symbol.text != '') {
            this.createLabel(geoEntity);
        }
        this.entities.push(
            {
                entity: geoEntity,
                symbol: this.symbol,
                coordinates: this.coordinates,
                positions: this.positions,
                center: this.positions[0],
            });
        return geoEntity;
    },

    //创建单面实体
    //entityid:实体id
    createPolygon(entityid) {
        console.log(entityid, "entityid");
        //计算多边形中心点
        var pCenter = Cesium.BoundingSphere.fromPoints(this.positions).center;
        let polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(pCenter);
        let geoEntity = new Cesium.Entity({
            id: entityid,
            position: polyCenter,
            polygon: {
                hierarchy: new Cesium.PolygonHierarchy(this.positions),
                // material: new PolylineAntialiasingMaterialProperty({ color: Cesium.Color.fromCssColorString(this.symbol.color) }),
                material: Cesium.Color.fromCssColorString(this.symbol.color),
                classificationType: this.symbol.classificationtype,//多边形贴地形
                //clampToGround: true, //线贴地形
                // // 边框
                // outline: true,
                // // 边框颜色
                // outlineColor: Cesium.Color.fromCssColorString(symbol.outlinecolor),
                // // 边框尺寸
                // outlineWidth: symbol.outlinewidth,
                show: this.symbol.show,
            },
            polyline: {
                positions: this.positions.concat(this.positions[0]),
                width: this.symbol.outlinewidth,
                // material: new Cesium.PolylineDashMaterialProperty({
                //     color: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
                // }),
                material: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
                classificationType: this.symbol.classificationtype,//多边形贴地形
                clampToGround: true, //线贴地形
                show: this.symbol.show,
            }
        });


        if (this.symbol.istextshow && this.symbol.text != '') {
            this.createLabel(geoEntity);
        }
        let area = getPolygonArea(this.positions);
        this.entities.push(
            {
                entity: geoEntity,
                symbol: this.symbol,
                coordinates: this.coordinates,
                positions: this.positions,
                center: polyCenter,
                area: area,
            });
        return geoEntity;
    },


    //创建线实体
    //entityid:实体id
    createPolyline(entityid) {
        // let positions = [];
        let transPos = [];
        let height = 0;
        if (this.coordinates.length > 0) {
            this.coordinates.forEach(point => {
                transPos.push(turf.point(point));
                height += point[2];
            });

            height = height > 0 ? height / this.coordinates.length : 0;
        }

        var features = turf.featureCollection(transPos);
        var center = turf.center(features);
        var pCenter = Cesium.Cartesian3.fromDegrees(center.geometry.coordinates[0], center.geometry.coordinates[1], height)

        let geoEntity = new Cesium.Entity({
            id: entityid,
            position: pCenter,
            polyline: {
                positions: this.positions,
                width: this.symbol.geosize,
                material: Cesium.Color.fromCssColorString(this.symbol.color),
                classificationType: this.symbol.classificationtype == true ? Cesium.ClassificationType.TERRAIN : Cesium.ClassificationType.BOTH,//多边形贴地形
                clampToGround: true, //线贴地形
                show: this.symbol.show,
            }
        });
        //图形标注文字
        if (this.symbol.istextshow && this.symbol.text != '') {
            this.createLabel(geoEntity);
        }

        this.entities.push(
            {
                entity: geoEntity,
                symbol: this.symbol,
                coordinates: this.coordinates,
                positions: this.positions,
                center: pCenter,
            });

        return geoEntity;

    },

    //创建立方体实体
    generateCube(entityid) {
        //获取高程
        const cartographic = this.viewer.camera.positionCartographic;
        let elevation = this.viewer.scene.globe.getHeight(cartographic) > 0
            ? this.viewer.scene.globe.getHeight(cartographic).toFixed(1)
            : 0;
        //中心点
        var pCenter = Cesium.BoundingSphere.fromPoints(this.positions).center;
        let polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(pCenter);
        let geoEntity = new Cesium.Entity({
            id: entityid,
            position: polyCenter,
            polygon: {
                hierarchy: new Cesium.PolygonHierarchy(this.positions),
                //meterial: new Cesium.Color(colorobj.red, colorobj.green, colorobj.blue, colorobj.alpha),
                //material: Cesium.Color.RED.withAlpha(0.6),
                material: Cesium.Color.fromCssColorString(this.symbol.color),
                // classificationType: Number(this.symbol.classificationtype),//多边形贴地形
                classificationType: this.symbol.classificationtype,//多边形贴地形                
                extrudedHeight: Number(elevation) + Number(this.symbol.height),//设置立体高度 

                show: this.symbol.show,
            },
            polyline: {
                positions: this.positions.concat(this.positions[0]),
                width: this.symbol.outlinewidth,
                material: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
                //material: Cesium.Color.fromCssColorString(this.drawSymbol.outlinecolor),//Cesium.Color.RED.withAlpha(0.6),
                depthFailMaterial: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),
                //classificationType: Cesium.ClassificationType.BOTH,
                //clampToGround: true, //线贴地形
                classificationType: this.symbol.classificationtype,//多边形贴地形
                clampToGround: true, //线贴地形
                show: this.symbol.show,
            }
        });

        //图形标注文字       
        if (this.symbol.istextshow && this.symbol.text != '') {
            this.createLabel(geoEntity);
        }
        this.entities.push(
            {
                entity: geoEntity,
                symbol: this.symbol,
                coordinates: this.coordinates,
                positions: this.positions,
                center: polyCenter,
            });
        return geoEntity;
    },

    //清除全部图形
    clearAll() {
        if (this.entities.length > 0) {
            this.entities.forEach(e => {
                this.viewer.entities.remove(e.entity);
            });
            this.entities = [];
        }
    },

    //清除单个实体
    clearByEntityId(entityid) {
        if (this.entities.length > 0) {
            this.entities.forEach(e => {
                if (e.entity.id == entityid) {
                    this.viewer.entities.remove(e.entity);
                }
            });
            //从数组中移除entityid的对象
            let index = this.entities.findIndex((e) => e.entity.id == entityid);
            this.entities.splice(index, 1);
        }
    },
    //定位图形中心点
    lookAt(center) {

        //let range = this.viewer.camera.positionCartographic.height;
        let viewHeight = this.viewer.camera.positionCartographic.height;
        let range = viewHeight > 10000 ? 10000 : viewHeight;
        //锁定视图中心点
        this.viewer.camera.lookAt(center,
            new Cesium.HeadingPitchRange(this.viewer.camera.heading, this.viewer.camera.pitch, range));
        //取消锁定中心点
        this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    },
    lookAtByParams(center,heading,pitch,range) {

        //let range = this.viewer.camera.positionCartographic.height;
        // let viewHeight = this.viewer.camera.positionCartographic.height;
        // let range = viewHeight > 10000 ? 10000 : viewHeight;
        //锁定视图中心点
        this.viewer.camera.lookAt(center,
            new Cesium.HeadingPitchRange(heading, pitch, range));
        //取消锁定中心点
        this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    },
}

export default createCommonEntity;


