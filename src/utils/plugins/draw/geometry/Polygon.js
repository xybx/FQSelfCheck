import * as Cesium from "cesium";
import PlotBase from "../PlotBase";
import PlotTypes from "../PlotTypes";
//面标绘 面标绘类是所有面状军事标绘的父类 默认贴对象
export default class Polygon extends PlotBase {
  constructor(viewer, geoFeature, plotTypeObject) {
    super(viewer, geoFeature, plotTypeObject);
    this.plotTypeObject = plotTypeObject;
    this.properties.plotType = PlotTypes.POLYGON; //标绘类型
    this.properties.plotName = "面"; //标绘名称
    this.generateEntity();
    this.minPointCount = 3;
  }

  //构造Entity
  generateEntity() {
    debugger;   
    let color = Cesium.Color.fromCssColorString(this.plotTypeObject.color);
    if (this.plotTypeObject.opacity) {
      color = Cesium.Color.fromCssColorString(
        this.plotTypeObject.color
      ).withAlpha(this.plotTypeObject.opacity);
    }
    this.polygonEntity = this.viewer.entities.add({
      plotType: this.properties.plotBase,
      plotCode: this.properties.plotCode,
      id: this.properties.id,
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(this.positions || []),
        material: color, //Cesium.Color.fromCssColorString(this.plotTypeObject.color).withAlpha(this.plotTypeObject.opacity),
        classificationType:
          this.plotTypeObject.isground == true
            ? Cesium.ClassificationType.BOTH
            : Cesium.ClassificationType.CESIUM_3D_TILE, //多边形贴地形
      },
      polyline: {
        positions: new Cesium.CallbackProperty((e) => {
          return !this.positions
            ? []
            : this.positions.concat(this.positions[0]);
        }, false),
        width: this.plotTypeObject.outlinewidth,
        material: Cesium.Color.fromCssColorString(
          this.plotTypeObject.outlinecolor
        ),
        clampToGround: this.plotTypeObject.isground,
      },
    });
    if (this.plotTypeObject.text) {
      var pyPositions = this.polygonEntity.polygon.hierarchy.getValue(
        Cesium.JulianDate.now()
      ).positions;
      //中心点
      var pCenter = Cesium.BoundingSphere.fromPoints(pyPositions).center;
      let polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(pCenter);

      this.generteLabel(polyCenter, true, new Date().getTime());
    }
  }

  //构造文本标注
  generteLabel(positions, bg = false, pid) {
    if (this.plotTypeObject.text != "") {
      this.labelEntity = new Cesium.Entity({
        // id: pid ? pid + "-Text" : new Date().getTime(),
        plotCode: this.properties.plotCode,
        position: positions,
        label: {
          text: this.plotTypeObject.text,
          showBackground: bg,
          font: "normal " + this.plotTypeObject.textsize + "px MicroSoft YaHei",
          backgroundColor: Cesium.Color.fromCssColorString(
            this.plotTypeObject.background
          ),
          backgroundPadding: new Cesium.Cartesian2(15, 10),
          fillColor: Cesium.Color.fromCssColorString(
            this.plotTypeObject.textcolor
          ),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          horizontalOrigin: Cesium.HorizontalOrigin.BOTTOM,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scale: 0.5,
          //   outlineWidth: this.plotTypeObject.outlinewidth,
          //   outlineColor: Cesium.Color.fromCssColorString(
          //     this.plotTypeObject.outlinecolor
          //   ),
          //pixelOffset: new Cesium.Cartesian2(0, -40),
          show: true,
          heightReference: this.plotTypeObject.isground
            ? Cesium.HeightReference.CLAMP_TO_GROUND
            : Cesium.HeightReference.RELATIVE_TO_GROUND,
        },
      });
      this.viewer.entities.add(this.labelEntity);
    }
  }

  //选中效果
  setSelected(selected) {
    if (selected) {
      this.polygonEntity.polygon.material = Cesium.Color.fromCssColorString(
        this.plotTypeObject.color
      );
    } else {
      this.polygonEntity.polygon.material = Cesium.Color.fromCssColorString(
        this.plotTypeObject.color
      );
    }
  }

  //构造点坐标
  generate() {
    var count = this.getPointCount();
    if (count < 2) {
      return;
    }
    this.generatePositions(this.coordinates[0]);
  }

  //开启或关闭编辑模式
  openEditMode(isEdit) {
    if (isEdit) {
      this.polygonEntity.polygon.hierarchy = new Cesium.CallbackProperty(
        (e) => {
          return new Cesium.PolygonHierarchy(this.positions || []);
        },
        false
      );

      // this.polygonEntity.polyline = {
      //     positions: new Cesium.CallbackProperty(e => {
      //         if (this.positions && this.positions.length > 0)
      //             return this.positions.concat(this.positions[0]);
      //         else {
      //             return [];
      //         }
      //     }, false),
      //     width: 2,
      //     clampToGround: true,
      //     material: new Cesium.PolylineDashMaterialProperty({
      //         color: Cesium.Color.YELLOW,
      //     }),
      //     depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
      //         color: Cesium.Color.YELLOW,
      //     }),
      // }
    } else {
      this.polygonEntity.polygon.hierarchy = new Cesium.PolygonHierarchy(
        this.positions || []
      );
      if (this.polygonEntity.polyline) this.polygonEntity.polyline.width = 0;
    }
  }

  //转到geojson对象 用于存储操作
  toGeoJson() {
    return {
      type: "Feature",
      properties: this.properties,
      geometry: {
        type: "Polygon",
        coordinates: this.coordinates,
      },
    };
  }

  //移除标绘对象
  remove() {
    this.viewer.entities.remove(this.polygonEntity);
  }
}
