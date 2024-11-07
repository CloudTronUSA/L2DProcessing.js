/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismMatrix44 } from '../math/cubismmatrix44.js';
import { csmRect } from '../type/csmrectf.js';
/**
 * モデル描画を処理するレンダラ
 *
 * サブクラスに環境依存の描画命令を記述する。
 */
export class CubismRenderer {
    /**
     * レンダラのインスタンスを生成して取得する
     *
     * @return レンダラのインスタンス
     */
    static create() {
        return null;
    }
    /**
     * レンダラのインスタンスを解放する
     */
    static delete(renderer) {
        renderer = null;
    }
    /**
     * レンダラの初期化処理を実行する
     * 引数に渡したモデルからレンダラの初期化処理に必要な情報を取り出すことができる
     * @param model モデルのインスタンス
     */
    initialize(model) {
        this._model = model;
    }
    /**
     * モデルを描画する
     */
    drawModel() {
        if (this.getModel() == null)
            return;
        this.saveProfile();
        this.doDrawModel();
        this.restoreProfile();
    }
    /**
     * Model-View-Projection 行列をセットする
     * 配列は複製されるので、元の配列は外で破棄して良い
     * @param matrix44 Model-View-Projection 行列
     */
    setMvpMatrix(matrix44) {
        this._mvpMatrix4x4.setMatrix(matrix44.getArray());
    }
    /**
     * Model-View-Projection 行列を取得する
     * @return Model-View-Projection 行列
     */
    getMvpMatrix() {
        return this._mvpMatrix4x4;
    }
    /**
     * モデルの色をセットする
     * 各色0.0~1.0の間で指定する（1.0が標準の状態）
     * @param red 赤チャンネルの値
     * @param green 緑チャンネルの値
     * @param blue 青チャンネルの値
     * @param alpha αチャンネルの値
     */
    setModelColor(red, green, blue, alpha) {
        if (red < 0.0) {
            red = 0.0;
        }
        else if (red > 1.0) {
            red = 1.0;
        }
        if (green < 0.0) {
            green = 0.0;
        }
        else if (green > 1.0) {
            green = 1.0;
        }
        if (blue < 0.0) {
            blue = 0.0;
        }
        else if (blue > 1.0) {
            blue = 1.0;
        }
        if (alpha < 0.0) {
            alpha = 0.0;
        }
        else if (alpha > 1.0) {
            alpha = 1.0;
        }
        this._modelColor.r = red;
        this._modelColor.g = green;
        this._modelColor.b = blue;
        this._modelColor.a = alpha;
    }
    /**
     * モデルの色を取得する
     * 各色0.0~1.0の間で指定する(1.0が標準の状態)
     *
     * @return RGBAのカラー情報
     */
    getModelColor() {
        return JSON.parse(JSON.stringify(this._modelColor));
    }
    /**
     * 透明度を考慮したモデルの色を計算する。
     *
     * @param opacity 透明度
     *
     * @return RGBAのカラー情報
     */
    getModelColorWithOpacity(opacity) {
        const modelColorRGBA = this.getModelColor();
        modelColorRGBA.a *= opacity;
        if (this.isPremultipliedAlpha()) {
            modelColorRGBA.r *= modelColorRGBA.a;
            modelColorRGBA.g *= modelColorRGBA.a;
            modelColorRGBA.b *= modelColorRGBA.a;
        }
        return modelColorRGBA;
    }
    /**
     * 乗算済みαの有効・無効をセットする
     * 有効にするならtrue、無効にするならfalseをセットする
     */
    setIsPremultipliedAlpha(enable) {
        this._isPremultipliedAlpha = enable;
    }
    /**
     * 乗算済みαの有効・無効を取得する
     * @return true 乗算済みのα有効
     * @return false 乗算済みのα無効
     */
    isPremultipliedAlpha() {
        return this._isPremultipliedAlpha;
    }
    /**
     * カリング（片面描画）の有効・無効をセットする。
     * 有効にするならtrue、無効にするならfalseをセットする
     */
    setIsCulling(culling) {
        this._isCulling = culling;
    }
    /**
     * カリング（片面描画）の有効・無効を取得する。
     * @return true カリング有効
     * @return false カリング無効
     */
    isCulling() {
        return this._isCulling;
    }
    /**
     * テクスチャの異方性フィルタリングのパラメータをセットする
     * パラメータ値の影響度はレンダラの実装に依存する
     * @param n パラメータの値
     */
    setAnisotropy(n) {
        this._anisotropy = n;
    }
    /**
     * テクスチャの異方性フィルタリングのパラメータをセットする
     * @return 異方性フィルタリングのパラメータ
     */
    getAnisotropy() {
        return this._anisotropy;
    }
    /**
     * レンダリングするモデルを取得する
     * @return レンダリングするモデル
     */
    getModel() {
        return this._model;
    }
    /**
     * マスク描画の方式を変更する。
     * falseの場合、マスクを1枚のテクスチャに分割してレンダリングする（デフォルト）
     * 高速だが、マスク個数の上限が36に限定され、質も荒くなる
     * trueの場合、パーツ描画の前にその都度必要なマスクを描き直す
     * レンダリング品質は高いが描画処理負荷は増す
     * @param high 高精細マスクに切り替えるか？
     */
    useHighPrecisionMask(high) {
        this._useHighPrecisionMask = high;
    }
    /**
     * マスクの描画方式を取得する
     * @return true 高精細方式
     * @return false デフォルト
     */
    isUsingHighPrecisionMask() {
        return this._useHighPrecisionMask;
    }
    /**
     * コンストラクタ
     */
    constructor() {
        this._isCulling = false;
        this._isPremultipliedAlpha = false;
        this._anisotropy = 0.0;
        this._model = null;
        this._modelColor = new CubismTextureColor();
        this._useHighPrecisionMask = false;
        // 単位行列に初期化
        this._mvpMatrix4x4 = new CubismMatrix44();
        this._mvpMatrix4x4.loadIdentity();
    }
    /**
     * レンダラが保持する静的なリソースを開放する
     */
    static staticRelease;
    _mvpMatrix4x4; // Model-View-Projection 行列
    _modelColor; // モデル自体のカラー（RGBA）
    _isCulling; // カリングが有効ならtrue
    _isPremultipliedAlpha; // 乗算済みαならtrue
    _anisotropy; // テクスチャの異方性フィルタリングのパラメータ
    _model; // レンダリング対象のモデル
    _useHighPrecisionMask; // falseの場合、マスクを纏めて描画する trueの場合、マスクはパーツ描画ごとに書き直す
}
export var CubismBlendMode;
(function (CubismBlendMode) {
    CubismBlendMode[CubismBlendMode["CubismBlendMode_Normal"] = 0] = "CubismBlendMode_Normal";
    CubismBlendMode[CubismBlendMode["CubismBlendMode_Additive"] = 1] = "CubismBlendMode_Additive";
    CubismBlendMode[CubismBlendMode["CubismBlendMode_Multiplicative"] = 2] = "CubismBlendMode_Multiplicative"; // 乗算
})(CubismBlendMode || (CubismBlendMode = {}));
/**
 * テクスチャの色をRGBAで扱うためのクラス
 */
export class CubismTextureColor {
    /**
     * コンストラクタ
     */
    constructor(r = 1.0, g = 1.0, b = 1.0, a = 1.0) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    r; // 赤チャンネル
    g; // 緑チャンネル
    b; // 青チャンネル
    a; // αチャンネル
}
/**
 * クリッピングマスクのコンテキスト
 */
export class CubismClippingContext {
    /**
     * 引数付きコンストラクタ
     */
    constructor(clippingDrawableIndices, clipCount) {
        // クリップしている（＝マスク用の）Drawableのインデックスリスト
        this._clippingIdList = clippingDrawableIndices;
        // マスクの数
        this._clippingIdCount = clipCount;
        this._allClippedDrawRect = new csmRect();
        this._layoutBounds = new csmRect();
        this._clippedDrawableIndexList = [];
        this._matrixForMask = new CubismMatrix44();
        this._matrixForDraw = new CubismMatrix44();
        this._bufferIndex = 0;
    }
    /**
     * デストラクタ相当の処理
     */
    release() {
        if (this._layoutBounds != null) {
            this._layoutBounds = null;
        }
        if (this._allClippedDrawRect != null) {
            this._allClippedDrawRect = null;
        }
        if (this._clippedDrawableIndexList != null) {
            this._clippedDrawableIndexList = null;
        }
    }
    /**
     * このマスクにクリップされる描画オブジェクトを追加する
     *
     * @param drawableIndex クリッピング対象に追加する描画オブジェクトのインデックス
     */
    addClippedDrawable(drawableIndex) {
        this._clippedDrawableIndexList.push(drawableIndex);
    }
    _isUsing; // 現在の描画状態でマスクの準備が必要ならtrue
    _clippingIdList; // クリッピングマスクのIDリスト
    _clippingIdCount; // クリッピングマスクの数
    _layoutChannelIndex; // RGBAのいずれのチャンネルにこのクリップを配置するか（0:R, 1:G, 2:B, 3:A）
    _layoutBounds; // マスク用チャンネルのどの領域にマスクを入れるか（View座標-1~1, UVは0~1に直す）
    _allClippedDrawRect; // このクリッピングで、クリッピングされるすべての描画オブジェクトの囲み矩形（毎回更新）
    _matrixForMask; // マスクの位置計算結果を保持する行列
    _matrixForDraw; // 描画オブジェクトの位置計算結果を保持する行列
    _clippedDrawableIndexList; // このマスクにクリップされる描画オブジェクトのリスト
    _bufferIndex; // このマスクが割り当てられるレンダーテクスチャ（フレームバッファ）やカラーバッファのインデックス
}
// Namespace definition for compatibility.
import * as $ from './cubismrenderer.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismBlendMode = $.CubismBlendMode;
    Live2DCubismFramework.CubismRenderer = $.CubismRenderer;
    Live2DCubismFramework.CubismTextureColor = $.CubismTextureColor;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismrenderer.js.map