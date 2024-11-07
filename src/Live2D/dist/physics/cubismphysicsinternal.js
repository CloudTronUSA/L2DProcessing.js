/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismVector2 } from '../math/cubismvector2.js';
import { csmVector } from '../type/csmvector.js';
/**
 * 物理演算の適用先の種類
 */
export var CubismPhysicsTargetType;
(function (CubismPhysicsTargetType) {
    CubismPhysicsTargetType[CubismPhysicsTargetType["CubismPhysicsTargetType_Parameter"] = 0] = "CubismPhysicsTargetType_Parameter"; // パラメータに対して適用
})(CubismPhysicsTargetType || (CubismPhysicsTargetType = {}));
/**
 * 物理演算の入力の種類
 */
export var CubismPhysicsSource;
(function (CubismPhysicsSource) {
    CubismPhysicsSource[CubismPhysicsSource["CubismPhysicsSource_X"] = 0] = "CubismPhysicsSource_X";
    CubismPhysicsSource[CubismPhysicsSource["CubismPhysicsSource_Y"] = 1] = "CubismPhysicsSource_Y";
    CubismPhysicsSource[CubismPhysicsSource["CubismPhysicsSource_Angle"] = 2] = "CubismPhysicsSource_Angle"; // 角度から
})(CubismPhysicsSource || (CubismPhysicsSource = {}));
/**
 * @brief 物理演算で使用する外部の力
 *
 * 物理演算で使用する外部の力。
 */
export class PhysicsJsonEffectiveForces {
    constructor() {
        this.gravity = new CubismVector2(0, 0);
        this.wind = new CubismVector2(0, 0);
    }
    gravity; // 重力
    wind; // 風
}
/**
 * 物理演算のパラメータ情報
 */
export class CubismPhysicsParameter {
    id; // パラメータ
    targetType; // 適用先の種類
}
/**
 * 物理演算の正規化情報
 */
export class CubismPhysicsNormalization {
    minimum; // 最大値
    maximum; // 最小値
    defalut; // デフォルト値
}
/**
 * 物理演算の演算委使用する物理点の情報
 */
export class CubismPhysicsParticle {
    constructor() {
        this.initialPosition = new CubismVector2(0, 0);
        this.position = new CubismVector2(0, 0);
        this.lastPosition = new CubismVector2(0, 0);
        this.lastGravity = new CubismVector2(0, 0);
        this.force = new CubismVector2(0, 0);
        this.velocity = new CubismVector2(0, 0);
    }
    initialPosition; // 初期位置
    mobility; // 動きやすさ
    delay; // 遅れ
    acceleration; // 加速度
    radius; // 距離
    position; // 現在の位置
    lastPosition; // 最後の位置
    lastGravity; // 最後の重力
    force; // 現在かかっている力
    velocity; // 現在の速度
}
/**
 * 物理演算の物理点の管理
 */
export class CubismPhysicsSubRig {
    constructor() {
        this.normalizationPosition = new CubismPhysicsNormalization();
        this.normalizationAngle = new CubismPhysicsNormalization();
    }
    inputCount; // 入力の個数
    outputCount; // 出力の個数
    particleCount; // 物理点の個数
    baseInputIndex; // 入力の最初のインデックス
    baseOutputIndex; // 出力の最初のインデックス
    baseParticleIndex; // 物理点の最初のインデックス
    normalizationPosition; // 正規化された位置
    normalizationAngle; // 正規化された角度
}
/**
 * 物理演算の入力情報
 */
export class CubismPhysicsInput {
    constructor() {
        this.source = new CubismPhysicsParameter();
    }
    source; // 入力元のパラメータ
    sourceParameterIndex; // 入力元のパラメータのインデックス
    weight; // 重み
    type; // 入力の種類
    reflect; // 値が反転されているかどうか
    getNormalizedParameterValue; // 正規化されたパラメータ値の取得関数
}
/**
 * @brief 物理演算の出力情報
 *
 * 物理演算の出力情報。
 */
export class CubismPhysicsOutput {
    constructor() {
        this.destination = new CubismPhysicsParameter();
        this.translationScale = new CubismVector2(0, 0);
    }
    destination; // 出力先のパラメータ
    destinationParameterIndex; // 出力先のパラメータのインデックス
    vertexIndex; // 振り子のインデックス
    translationScale; // 移動値のスケール
    angleScale; // 角度のスケール
    weight; // 重み
    type; // 出力の種類
    reflect; // 値が反転されているかどうか
    valueBelowMinimum; // 最小値を下回った時の値
    valueExceededMaximum; // 最大値をこえた時の値
    getValue; // 物理演算の値の取得関数
    getScale; // 物理演算のスケール値の取得関数
}
/**
 * @brief 物理演算のデータ
 *
 * 物理演算のデータ。
 */
export class CubismPhysicsRig {
    constructor() {
        this.settings = new csmVector();
        this.inputs = new csmVector();
        this.outputs = new csmVector();
        this.particles = new csmVector();
        this.gravity = new CubismVector2(0, 0);
        this.wind = new CubismVector2(0, 0);
        this.fps = 0.0;
    }
    subRigCount; // 物理演算の物理点の個数
    settings; // 物理演算の物理点の管理のリスト
    inputs; // 物理演算の入力のリスト
    outputs; // 物理演算の出力のリスト
    particles; // 物理演算の物理点のリスト
    gravity; // 重力
    wind; // 風
    fps; //物理演算動作FPS
}
// Namespace definition for compatibility.
import * as $ from './cubismphysicsinternal.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismPhysicsInput = $.CubismPhysicsInput;
    Live2DCubismFramework.CubismPhysicsNormalization = $.CubismPhysicsNormalization;
    Live2DCubismFramework.CubismPhysicsOutput = $.CubismPhysicsOutput;
    Live2DCubismFramework.CubismPhysicsParameter = $.CubismPhysicsParameter;
    Live2DCubismFramework.CubismPhysicsParticle = $.CubismPhysicsParticle;
    Live2DCubismFramework.CubismPhysicsRig = $.CubismPhysicsRig;
    Live2DCubismFramework.CubismPhysicsSource = $.CubismPhysicsSource;
    Live2DCubismFramework.CubismPhysicsSubRig = $.CubismPhysicsSubRig;
    Live2DCubismFramework.CubismPhysicsTargetType = $.CubismPhysicsTargetType;
    Live2DCubismFramework.PhysicsJsonEffectiveForces = $.PhysicsJsonEffectiveForces;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismphysicsinternal.js.map