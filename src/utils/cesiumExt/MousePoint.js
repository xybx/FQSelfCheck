
import * as Cesium from "cesium";

// 绘制时显示鼠标拾取点
export default class MousePoint {
    constructor(viewer) {
        this.viewer = viewer;
        this.addPoint();
    }

    addPoint() {
        this.mousePointEntity = this.viewer.entities.add({
            point: {
                pixelSize: 6,
                color: Cesium.Color.YELLOW,
                outlineWidth: 1,
                outlineColor: Cesium.Color.GREEN
            }
        })
    }

    updatePosition(position) {
        this.mousePointEntity.position = position;
    }

    remove() {
        this.viewer.entities.remove(this.mousePointEntity);
    }

}