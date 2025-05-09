// 分队战斗标绘类 与进攻方向的区别就是尾部由一个点构成

import * as PlotUtils from "@/utils/cesiumExt/utils2d"
import * as Constants from "@/utils/cesiumExt/Constants"
import PlotTypes from "../PlotTypes"

import AttackArrow from "./AttackArrow"
export default class SquadCombat extends AttackArrow {

    constructor(viewer, baseInfo, plotTypeObject, properties) {     
        super(viewer, baseInfo, plotTypeObject, properties);
        this.plotTypeObject = plotTypeObject;
        this.properties.plotType = PlotTypes.SQUAD_COMBAT; //标绘类型
        this.properties.plotName = "分队战斗"; //标绘名称
        this.minPointCount = 2; //最少2个点
        //console.log(this.polygonEntity, "this.polygonEntity-SquadCombat");
    }

    initConsts() {
        this.headHeightFactor = 0.18;
        this.headWidthFactor = 0.3;
        this.neckHeightFactor = 0.85;
        this.neckWidthFactor = 0.15;
        this.tailWidthFactor = 0.03; //修改尾部宽度
    }

    generate() {
        var count = this.getPointCount();
        if (count < 2) {
            return;
        }
        var pnts = this.getPoints();
        var tailPnts = this.getTailPoints(pnts);
        var headPnts = this.getArrowHeadPoints(pnts, tailPnts[0], tailPnts[1]);
        var neckLeft = headPnts[0];
        var neckRight = headPnts[4];
        var bodyPnts = this.getArrowBodyPoints(pnts, neckLeft, neckRight, this.tailWidthFactor);
        var count = bodyPnts.length;
        var leftPnts = [tailPnts[0]].concat(bodyPnts.slice(0, count / 2));
        leftPnts.push(neckLeft);
        var rightPnts = [tailPnts[1]].concat(bodyPnts.slice(count / 2, count));
        rightPnts.push(neckRight);

        leftPnts = PlotUtils.getQBSplinePoints(leftPnts);
        rightPnts = PlotUtils.getQBSplinePoints(rightPnts);

        this.generatePositions(leftPnts.concat(headPnts, rightPnts.reverse()));
    }

    getTailPoints(points) {
        var allLen = PlotUtils.getBaseLength(points);
        var tailWidth = allLen * this.tailWidthFactor;
        var tailLeft = PlotUtils.getThirdPoint(points[1], points[0], Constants.HALF_PI, tailWidth, false);
        var tailRight = PlotUtils.getThirdPoint(points[1], points[0], Constants.HALF_PI, tailWidth, true);
        return [tailLeft, tailRight];
    }
}