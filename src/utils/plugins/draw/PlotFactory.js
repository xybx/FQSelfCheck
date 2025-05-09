import PlotTypes from "./PlotTypes"

import Polygon from './geometry/Polygon'
import ClosedCurve from './geometry/ClosedCurve'
import Circle from './geometry/Circle'
import Ellipse from './geometry/Ellipse'
import Sector from './geometry/Sector'
import Rectangle from "./geometry/Rectangle"
import FineArrow from './geometry/FineArrow'
// import AssaultDirection from './geometry/AssaultDirection'
import AttackArrow from './geometry/AttackArrow'
import TailedAttackArrow from './geometry/TailedAttackArrow'
import DoubleArrow from './geometry/DoubleArrow'
import GatheringPlace from './geometry/GatheringPlace'
import SquadCombat from "./geometry/SquadCombat"
import TailedSquadCombat from "./geometry/TailedSquadCombat"
import EntityDraw from "./EntityDraw";

// import Marker from "../MarkerPlot/Marker"

// import Polyline from "../LinePolt/Polyline"

let PlotFactory = {
    createPlot(viewer, plotTypeObject, geoFeature) {

        switch (plotTypeObject.type) {
            case PlotTypes.POLYGON:
                return new Polygon(viewer, geoFeature, plotTypeObject);
            case PlotTypes.DOUBLE_ARROW:
                return new DoubleArrow(viewer, geoFeature);
            case PlotTypes.ATTACK_ARROW:
                return new AttackArrow(viewer, geoFeature);
            case PlotTypes.ELLIPSE:
                return new Ellipse(viewer, geoFeature);
            case PlotTypes.CIRCLE:
                return new Circle(viewer, geoFeature);
            case PlotTypes.FINE_ARROW:
                return new FineArrow(viewer, geoFeature);
            case PlotTypes.TAILED_ATTACK_ARROW:
                return new TailedAttackArrow(viewer, geoFeature);
            // case PlotTypes.ASSAULT_DIRECTION:
            //     return new AssaultDirection(viewer, geoFeature);
            case PlotTypes.GATHERING_PLACE:
                return new GatheringPlace(viewer, geoFeature);
            case PlotTypes.CLOSED_CURVE:
                return new ClosedCurve(viewer, geoFeature);
            case PlotTypes.SECTOR:
                return new Sector(viewer, geoFeature);
            case PlotTypes.RECTANGLE:
                return new Rectangle(viewer, geoFeature);
            case PlotTypes.SQUAD_COMBAT:
                return new SquadCombat(viewer, geoFeature, plotTypeObject);
            case PlotTypes.TAILED_SQUAD_COMBAT:
                return new TailedSquadCombat(viewer, geoFeature, plotTypeObject);
        }
    }
}

export default PlotFactory;