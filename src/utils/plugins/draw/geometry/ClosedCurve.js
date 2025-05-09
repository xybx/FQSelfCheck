import * as PlotUtils from "@/utils/cesiumExt/utils2d"
import * as Constants from "@/utils/cesiumExt/Constants"
import Polygon from "./Polygon"
import PlotTypes from "../PlotTypes"

//曲线面标绘类
export default class ClosedCurve extends Polygon {

    constructor(viewer, geoFeature) {
        super(viewer, geoFeature);

        this.properties.plotType = PlotTypes.CLOSED_CURVE; //标绘类型
        this.properties.plotName = "曲线面"; //标绘名称 
    }

    initConsts() {
        this.t = 0.3;
    }

    generate() {
        var count = this.getPointCount();
        if (count < 2) {
            return;
        }
        if (count == 2) {
            this.generatePositions(this.coordinates[0]);
        } else {
            var pnts = this.getPoints();
            pnts.push(pnts[0], pnts[1]);
            var normals = [];
            for (var i = 0; i < pnts.length - 2; i++) {
                var normalPoints = PlotUtils.getBisectorNormals(this.t, pnts[i], pnts[i + 1], pnts[i + 2]);
                normals = normals.concat(normalPoints);
            }
            var count = normals.length;
            normals = [normals[count - 1]].concat(normals.slice(0, count - 1));

            var pList = [];
            for (i = 0; i < pnts.length - 2; i++) {
                var pnt1 = pnts[i];
                var pnt2 = pnts[i + 1];
                pList.push(pnt1);
                for (var t = 0; t <= Constants.FITTING_COUNT; t++) {
                    var pnt = PlotUtils.getCubicValue(t / Constants.FITTING_COUNT, pnt1, normals[i * 2], normals[i * 2 + 1], pnt2);
                    pList.push(pnt);
                }
                pList.push(pnt2);
            }
            this.generatePositions(pList);
        }
    }
}