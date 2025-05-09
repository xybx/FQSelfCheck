// 突击方向 与直箭头差不多
import FineArrow from "./FineArrow"
import PlotTypes from "../PlotTypes"

export default class AssaultDirection extends FineArrow {

    constructor(viewer, geoFeature) {
        super(viewer, geoFeature);
        this.properties.plotType = PlotTypes.ASSAULT_DIRECTION; //标绘类型
        this.properties.plotName = "突击方向"; //标绘名称 
    }

    initConsts() {
        this.tailWidthFactor = 0.2;
        this.neckWidthFactor = 0.25;
        this.headWidthFactor = 0.3;

        this.headAngle = Math.PI / 4;
        this.neckAngle = Math.PI * 0.17741;
        this.fixPointCount = 2;
    }
}