import * as Cesium from "cesium";

const shader = `
    czm_material czm_getMaterial(czm_materialInput materialInput) { \n
      czm_material material = czm_getDefaultMaterial(materialInput); \n
      vec2 st = materialInput.st; \n
      material.diffuse = color.rgb; \n
      float dis = 1.0 - abs(0.5 - st.t) * 2.0;
      material.alpha = dis * color.a; \n
      return material; \n
    }
    `
class PolylineAntialiasingMaterialProperty {
    constructor(opt = {}) {
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this.color = opt.color;
    }
    get isConstant() {
        return true;
    }
    get definitionChanged() {
        return this._definitionChanged;
    }
    getType() {
        return PolylineAntialiasingMaterialProperty.materialType;
    }
    getValue(time, result = {}) {
        result.color = this.color || Cesium.Color.RED;
        return result;
    }
    equals(other) {
        return this === other || (
            other instanceof PolylineAntialiasingMaterialProperty &&
            other.color === this.color
        );
    }
    static materialType = 'PolylineAntialiasing'
}
Cesium.Material._materialCache.addMaterial(PolylineAntialiasingMaterialProperty.materialType, {
    fabric: {
        type: PolylineAntialiasingMaterialProperty.materialType,
        uniforms: {
            color: new Cesium.Color(1, 1, 1, 1)
        },
        source: shader
    },
    translucent: true
})
export default PolylineAntialiasingMaterialProperty;
