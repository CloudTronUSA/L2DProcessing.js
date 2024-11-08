/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
export class TouchManager {
    /**
     * コンストラクタ
     */
    constructor() {
        this._startX = 0.0;
        this._startY = 0.0;
        this._lastX = 0.0;
        this._lastY = 0.0;
        this._lastX1 = 0.0;
        this._lastY1 = 0.0;
        this._lastX2 = 0.0;
        this._lastY2 = 0.0;
        this._lastTouchDistance = 0.0;
        this._deltaX = 0.0;
        this._deltaY = 0.0;
        this._scale = 1.0;
        this._touchSingle = false;
        this._flipAvailable = false;
    }
    getCenterX() {
        return this._lastX;
    }
    getCenterY() {
        return this._lastY;
    }
    getDeltaX() {
        return this._deltaX;
    }
    getDeltaY() {
        return this._deltaY;
    }
    getStartX() {
        return this._startX;
    }
    getStartY() {
        return this._startY;
    }
    getScale() {
        return this._scale;
    }
    getX() {
        return this._lastX;
    }
    getY() {
        return this._lastY;
    }
    getX1() {
        return this._lastX1;
    }
    getY1() {
        return this._lastY1;
    }
    getX2() {
        return this._lastX2;
    }
    getY2() {
        return this._lastY2;
    }
    isSingleTouch() {
        return this._touchSingle;
    }
    isFlickAvailable() {
        return this._flipAvailable;
    }
    disableFlick() {
        this._flipAvailable = false;
    }
    /**
     * タッチ開始時イベント
     * @param deviceX タッチした画面のxの値
     * @param deviceY タッチした画面のyの値
     */
    touchesBegan(deviceX, deviceY) {
        this._lastX = deviceX;
        this._lastY = deviceY;
        this._startX = deviceX;
        this._startY = deviceY;
        this._lastTouchDistance = -1.0;
        this._flipAvailable = true;
        this._touchSingle = true;
    }
    /**
     * ドラッグ時のイベント
     * @param deviceX タッチした画面のxの値
     * @param deviceY タッチした画面のyの値
     */
    touchesMoved(deviceX, deviceY) {
        this._lastX = deviceX;
        this._lastY = deviceY;
        this._lastTouchDistance = -1.0;
        this._touchSingle = true;
    }
    /**
     * フリックの距離測定
     * @return フリック距離
     */
    getFlickDistance() {
        return this.calculateDistance(this._startX, this._startY, this._lastX, this._lastY);
    }
    /**
     * 点１から点２への距離を求める
     *
     * @param x1 １つ目のタッチした画面のxの値
     * @param y1 １つ目のタッチした画面のyの値
     * @param x2 ２つ目のタッチした画面のxの値
     * @param y2 ２つ目のタッチした画面のyの値
     */
    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    }
    /**
     * ２つ目の値から、移動量を求める。
     * 違う方向の場合は移動量０。同じ方向の場合は、絶対値が小さい方の値を参照する。
     *
     * @param v1 １つ目の移動量
     * @param v2 ２つ目の移動量
     *
     * @return 小さい方の移動量
     */
    calculateMovingAmount(v1, v2) {
        if (v1 > 0.0 != v2 > 0.0) {
            return 0.0;
        }
        const sign = v1 > 0.0 ? 1.0 : -1.0;
        const absoluteValue1 = Math.abs(v1);
        const absoluteValue2 = Math.abs(v2);
        return (sign * (absoluteValue1 < absoluteValue2 ? absoluteValue1 : absoluteValue2));
    }
}
