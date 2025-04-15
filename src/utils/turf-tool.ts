import * as turf from '@turf/turf'

// 获取turf的要素
const getTurfFeature = () => { }

// 获取中心点
const getPositionFromGeom = (geom: any) => {
    let { type, coordinates } = geom;
    let center = null
    switch (type.toLowerCase()) {
        case 'billboard':
        case 'point':
            center = geom;
            break;
        case 'polygon':
            center = turf.center(turf.polygon(coordinates)).geometry;
            break;
        case 'polyline':
        case 'spacelength':
            center = turf.center(turf.lineString(coordinates)).geometry;
            break
    }
    return center
};

const getDistance = (point: any, point1: any) => {
    // 起点
    let [x, y, z] = point
    let [x1, y1, z1] = point1
    let from = turf.point([x, y]);
    // 终点
    let to = turf.point([x1, y1]);
    let distance = turf.distance(from, to, { units: 'kilometers' });
    let center = getFeaturnCenter([from, to])
    return {
        distance: (distance * 1000).toFixed(4) + '米',
        center,
        height: (z + z1) / 2
    }
}

const getFeaturnCenter = (points: any) => {
    let features = turf.featureCollection(points);
    let center = turf.center(features);
    return center.geometry.coordinates
}

export { getTurfFeature, getPositionFromGeom, getDistance }