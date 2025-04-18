import * as PlotUtils from "@/utils/cesiumExt/utils2d"
import * as Constants from "@/utils/cesiumExt/Constants"
import PlotTypes from "../PlotTypes"
import Polygon from "./Polygon"
export default class Ellipse extends Polygon {

    constructor(viewer, geoFeature) {
        super(viewer, geoFeature);

        this.properties.plotType = PlotTypes.ELLIPSE; //标绘类型
        this.properties.plotName = "椭圆"; //标绘名称 
    }

    initConsts() {
        this.fixPointCount = 2;
    }

    generate() {
        var count = this.getPointCount();
        if (count < 2) {
            return;
        }
        var pnt1 = this.coordinates[0][0];
        var pnt2 = this.coordinates[0][1];
        var center = PlotUtils.mid(pnt1, pnt2);
        var majorRadius = Math.abs((pnt1[0] - pnt2[0]) / 2);
        var minorRadius = Math.abs((pnt1[1] - pnt2[1]) / 2);
        this.generatePositions(this.generatePoints(center, majorRadius, minorRadius));
    }

    generatePoints(center, majorRadius, minorRadius) {
        var x, y, angle, points = [];
        for (var i = 0; i <= Constants.FITTING_COUNT; i++) {
            angle = Math.PI * 2 * i / Constants.FITTING_COUNT;
            x = center[0] + majorRadius * Math.cos(angle);
            y = center[1] + minorRadius * Math.sin(angle);
            points.push([x, y]);
        }
        return points;
    }
}