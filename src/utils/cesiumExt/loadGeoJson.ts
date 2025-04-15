import * as Cesium from 'cesium';
import * as turf from '@turf/turf';
import { cartesian3ToCoordinates, coordinatesToCartesian3 } from '@/utils/cesiumExt/coordinate';
import { getPolygonArea, getMinHeightToTerrain } from "@/utils/cesiumExt/baseUtils";
import createCommonEntity from '../createCommonEntity';

/* 弹出框 */
import { ElMessage } from 'element-plus';

/* 地标图片 */
import greenpng from "@/assets/images/green.png";
import redpng from "@/assets/images/red.png";
import bluepng from "@/assets/images/blue.png";

const loadGeoJson = {
    viewer: null,
    geojson: null,
    symbol: {},
    entities: [],
    positions: [],
    init(options: any) {
        this.entities = [];

        this.viewer = options.viewer || null;
        createCommonEntity.init({ symbol: {}, viewer: this.viewer });

        this.setSymbol(options.symbol);
    },
    setSymbol(symbol: any) {
        this.symbol = {
            istextshow: symbol.istextshow || true,//是否显示标注文字（默认true）
            text: symbol.text || '',//'文本标注',
            textcolor: symbol.textcolor || 'rgba(255, 0, 0, 1)',//Cesium.Color.RED,//文本颜色(默认红色),
            fontsize: symbol.fontsize || 24,//字体大小,
            showbackground: symbol.showbackground || true,//是否显示背景色（文字标注）默认true,
            backgroundcolor: symbol.textcolor || 'rgba(0, 0, 0, 0.3)',//Cesium.Color.BLACK.withAlpha(0.3),//背景颜色,
            outlinewidth: symbol.outlinewidth || 2,//边框宽度,
            outlinecolor: symbol.textcolor || 'rgba(255, 255, 0, 1)',//Cesium.Color.WHITE,//边框颜色,
            heightreference: symbol.heightreference || Cesium.HeightReference.CLAMP_TO_GROUND,//贴地设置,
            classificationtype: symbol.classificationtype || Cesium.ClassificationType.BOTH, //贴地设置,
            show: symbol.show || true,//显示隐藏（默认true）,
            imageurl: symbol.imageurl || greenpng,//图片地址,
            geosize: symbol.geosize || 16,//图形大小,
            color: symbol.color || 'rgba(255, 255, 0, 1)',//, //图形颜色,
            height: symbol.height || 10,//立体高度
        };
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
    async loadGeoJsonMethod(geojson: any, viewer: any, isShow: any) {
        this.geojson = geojson;
        this.setSymbol({});
        this.viewer = viewer;
        let dataSource = Cesium.GeoJsonDataSource.load(geojson, {
            //stroke: Cesium.Color.fromCssColorString(this.symbol.outlinecolor),//相当于polygon的outlineColor
            //strokeWidth: this.symbol.outlinewidth,//相当于polygon的outlineWidth
            fill: Cesium.Color.fromCssColorString(this.symbol.color).withAlpha(0.5),// Cesium.Color.YELLOW.withAlpha(0.5),
            //clampToGround: true,//是否贴地
            //show: isShow,
        })
        //dataSource.show=isShow;


        //获取最低高度坐标点的高度
        // this.viewer.scene.clampToHeightMostDetailed(geojson.geometry.coordinates[0]).then(function (clampedCartesians: any) {
        //     console.log(clampedCartesians, "clampedCartesians");
        // });
        //console.log(getMinHeight(this.positions), "height");
        let elevationHeight = await getMinHeightToTerrain(this.positions, this.viewer);
        let layer = await this.viewer.dataSources.add(dataSource);
        layer.show = isShow;
        console.log(layer, "ds");
        let entities = layer.entities.values;
        //修改entity样式
        for (let i = 0; i < entities.length; i++) {
            let entity = entities[i]
            // entity.getProperty("gid");
            if (entity.polygon) {
                entity.polygon.show = true;
                entity.polygon.classificationType = Cesium.ClassificationType.BOTH;
                entity.polygon.extrudedHeight = elevationHeight + Number(entity.properties.jzgd._value);
                entity.polygon.height = 0;
                console.log(entity, "entity");
                //entity.polygon.fill = false;
            }
            //entity.polygon.fill = false;
            // entity.polyline = {
            //     positions: entity.polygon.hierarchy._value.positions,
            //     width: 2,
            //     material: Cesium.Color.fromCssColorString(this.symbol.outlinecolor)
            // }                                                                  
        }
        // return ds;

        return layer;
    },

}
export default loadGeoJson;
