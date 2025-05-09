import * as Cesium from "cesium";
// 喷泉粒子标绘类
import ParticlePlotBase from "./PlotBase";
import PlotTypes from "./PlotTypes";

import fountainpng from "@/assets/images/cesium-images/fountain.png";

export default class FountainPlot extends ParticlePlotBase {
  constructor(viewer, geoFeature) {
    super(viewer, geoFeature);
    this.properties.plotType = PlotTypes.FOUNTAIN;
    this.properties.plotName = "喷泉";
    this.style = geoFeature.properties.style || this.getDefaultStyle();
    this.properties.style = this.style;
    this.init();
  }

  init() {
    //需要一个entity提供位置信息
    this.entity = {
      position: this.position,
      id: this.properties.id,
      point: {
        pixelSize: 4,
        color: Cesium.Color.RED,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    };
    this.particleSystem = this.createParticleSystem();
    if (!this.properties.isadd) {
      this.entity.show = false;
      this.particleSystem.show = false;
    }
    this.entity = this.viewer.entities.add(this.entity);
    this.particleSystem = this.viewer.scene.primitives.add(this.particleSystem);
    this.addEvent();
  }

  //添加事件
  addEvent() {
    this.emitterModelMatrix = new Cesium.Matrix4();
    this.translation = new Cesium.Cartesian3();
    this.rotation = new Cesium.Quaternion();
    this.hpr = new Cesium.HeadingPitchRoll();
    this.trs = new Cesium.TranslationRotationScale();
    this.viewer.scene.preUpdate.addEventListener(this.preUpdateEvent, this);
  }

  removeEvent() {
    this.viewer.scene.preUpdate.removeEventListener(this.preUpdateEvent, this);
    this.emitterModelMatrix = undefined;
    this.translation = undefined;
    this.rotation = undefined;
    this.hpr = undefined;
    this.trs = undefined;
  }

  //场景渲染事件
  preUpdateEvent(scene, time) {
    this.particleSystem.modelMatrix = this.entity.computeModelMatrix(
      time,
      new Cesium.Matrix4()
    );
    this.hpr = Cesium.HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0, this.hpr);
    this.trs.translation = Cesium.Cartesian3.fromElements(
      0,
      0,
      0,
      this.translation
    );
    this.trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(
      this.hpr,
      this.rotation
    );
    this.particleSystem.emitterModelMatrix =
      Cesium.Matrix4.fromTranslationRotationScale(
        this.trs,
        this.emitterModelMatrix
      );
  }

  //创建粒子对象
  createParticleSystem() {
    //console.log(this.style,"style");
    this.gravityScratch = new Cesium.Cartesian3();
    return new Cesium.ParticleSystem({
      image: this.style.fountainImage,
      startColor: new Cesium.Color(1, 1, 1, 0.8),
      endColor: new Cesium.Color(0.8, 0.86, 1, 0.6),
      startScale: this.style.startScale,
      endScale: this.style.endScale,
      minimumParticleLife: this.style.minimumParticleLife,
      maximumParticleLife: this.style.maximumParticleLife,
      minimumSpeed: this.style.minimumSpeed,
      maximumSpeed: this.style.maximumSpeed,
      imageSize: new Cesium.Cartesian2(
        this.style.particleSize,
        this.style.particleSize
      ),
      emissionRate: this.style.emissionRate,
      lifetime: 16.0,
      //粒子发射器
      emitter: new Cesium.CircleEmitter(0.5),
      updateCallback: (p, dt) => {
        return this.applyGravity(p, dt);
      },
      sizeInMeters: true,
      performance: false,
    });
  }

  applyGravity(p, dt) {
    // We need to compute a local up vector for each particle in geocentric space.
    Cesium.Cartesian3.normalize(p.position, this.gravityScratch);
    Cesium.Cartesian3.multiplyByScalar(
      this.gravityScratch,
      this.style.gravity * dt,
      this.gravityScratch
    );
    p.velocity = Cesium.Cartesian3.add(
      p.velocity,
      this.gravityScratch,
      p.velocity
    );
  }

  updateStyle() {}

  //移除
  remove() {
    this.removeEvent(); //清除事件
    this.viewer.scene.primitives.remove(this.particleSystem); //删除粒子对象
    this.viewer.entities.remove(this.entity); //删除entity
  }

  //默认样式信息
  getDefaultStyle() {
    return {
      fountainImage: fountainpng, //"../../../static/images/effects/fountain.png",
      emissionRate: 40.0,
      gravity: -20.5,
      minimumParticleLife: 6,
      maximumParticleLife: 7,
      minimumSpeed: 9,
      maximumSpeed: 9.5,
      startScale: 1,
      endScale: 7,
      particleSize: 2,
    };
  }
}
