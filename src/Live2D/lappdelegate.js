/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismFramework, Option } from './dist/live2dcubismframework.js';
import * as LAppDefine from './lappdefine.js';
import { LAppLive2DManager } from './_lapplive2dmanager.js';
import { LAppPal } from './lapppal.js';
import { LAppTextureManager } from './lapptexturemanager.js';
import { LAppView } from './_lappview.js';
import { canvas, gl } from './lappglmanager.js';
export let s_instance = null; // LAppDelegate instance
export let frameBuffer = null; // WebGL Framebuffer
/**
 * アプリケーションクラス。
 * Cubism SDKの管理を行う。
 */
export class LAppDelegate {
    /**
     * クラスのインスタンス（シングルトン）を返す。
     * インスタンスが生成されていない場合は内部でインスタンスを生成する。
     *
     * @return クラスのインスタンス
     */
    static getInstance() {
        if (s_instance == null) {
            s_instance = new LAppDelegate();
        }
        return s_instance;
    }
    /**
     * クラスのインスタンス（シングルトン）を解放する。
     */
    static releaseInstance() {
        if (s_instance != null) {
            s_instance.release();
        }
        s_instance = null;
    }
    /**
     * APPに必要な物を初期化する。
     */
    initialize() {
        // キャンバスを DOM に追加
        document.body.appendChild(canvas);
        if (LAppDefine.CanvasSize === 'auto') {
            this._resizeCanvas();
        }
        else {
            canvas.width = LAppDefine.CanvasSize.width;
            canvas.height = LAppDefine.CanvasSize.height;
        }
        if (!frameBuffer) {
            frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        }
        // 透過設定
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        const supportTouch = 'ontouchend' in canvas;
        if (supportTouch) {
            // タッチ関連コールバック関数登録
            canvas.addEventListener('touchstart', onTouchBegan, { passive: true });
            canvas.addEventListener('touchmove', onTouchMoved, { passive: true });
            canvas.addEventListener('touchend', onTouchEnded, { passive: true });
            canvas.addEventListener('touchcancel', onTouchCancel, { passive: true });
        }
        else {
            // マウス関連コールバック関数登録
            canvas.addEventListener('mousedown', onClickBegan, { passive: true });
            canvas.addEventListener('mousemove', onMouseMoved, { passive: true });
            canvas.addEventListener('mouseup', onClickEnded, { passive: true });
        }
        // AppViewの初期化
        this._view.initialize();
        // Cubism SDKの初期化
        this.initializeCubism();
        return true;
    }
    /**
     * Resize canvas and re-initialize view.
     */
    onResize() {
        this._resizeCanvas();
        this._view.initialize();
        this._view.initializeSprite();
    }
    /**
     * 解放する。
     */
    release() {
        this._textureManager.release();
        this._textureManager = null;
        this._view.release();
        this._view = null;
        // リソースを解放
        LAppLive2DManager.releaseInstance();
        // Cubism SDKの解放
        CubismFramework.dispose();
    }
    /**
     * 実行処理。
     */
    run() {
        // メインループ
        const loop = () => {
            // インスタンスの有無の確認
            if (s_instance == null) {
                return;
            }
            // 時間更新
            LAppPal.updateTime();
            // 画面の初期化
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            // 深度テストを有効化
            gl.enable(gl.DEPTH_TEST);
            // 近くにある物体は、遠くにある物体を覆い隠す
            gl.depthFunc(gl.LEQUAL);
            // カラーバッファや深度バッファをクリアする
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.clearDepth(1.0);
            // 透過設定
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            // 描画更新
            this._view.render();
            // ループのために再帰呼び出し
            requestAnimationFrame(loop);
        };
        loop();
    }
    /**
     * シェーダーを登録する。
     */
    createShader() {
        // バーテックスシェーダーのコンパイル
        const vertexShaderId = gl.createShader(gl.VERTEX_SHADER);
        if (vertexShaderId == null) {
            LAppPal.printMessage('failed to create vertexShader');
            return null;
        }
        const vertexShader = 'precision mediump float;' +
            'attribute vec3 position;' +
            'attribute vec2 uv;' +
            'varying vec2 vuv;' +
            'void main(void)' +
            '{' +
            '   gl_Position = vec4(position, 1.0);' +
            '   vuv = uv;' +
            '}';
        gl.shaderSource(vertexShaderId, vertexShader);
        gl.compileShader(vertexShaderId);
        // フラグメントシェーダのコンパイル
        const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);
        if (fragmentShaderId == null) {
            LAppPal.printMessage('failed to create fragmentShader');
            return null;
        }
        const fragmentShader = 'precision mediump float;' +
            'varying vec2 vuv;' +
            'uniform sampler2D texture;' +
            'void main(void)' +
            '{' +
            '   gl_FragColor = texture2D(texture, vuv);' +
            '}';
        gl.shaderSource(fragmentShaderId, fragmentShader);
        gl.compileShader(fragmentShaderId);
        // プログラムオブジェクトの作成
        const programId = gl.createProgram();
        gl.attachShader(programId, vertexShaderId);
        gl.attachShader(programId, fragmentShaderId);
        gl.deleteShader(vertexShaderId);
        gl.deleteShader(fragmentShaderId);
        // リンク
        gl.linkProgram(programId);
        gl.useProgram(programId);
        return programId;
    }
    /**
     * View情報を取得する。
     */
    getView() {
        return this._view;
    }
    getTextureManager() {
        return this._textureManager;
    }
    /**
     * コンストラクタ
     */
    constructor() {
        this._captured = false;
        this._mouseX = 0.0;
        this._mouseY = 0.0;
        this._isEnd = false;
        this._cubismOption = new Option();
        this._view = new LAppView();
        this._textureManager = new LAppTextureManager();
    }
    /**
     * Cubism SDKの初期化
     */
    initializeCubism() {
        // setup cubism
        this._cubismOption.logFunction = LAppPal.printMessage;
        this._cubismOption.loggingLevel = LAppDefine.CubismLoggingLevel;
        CubismFramework.startUp(this._cubismOption);
        // initialize cubism
        CubismFramework.initialize();
        // load model
        LAppLive2DManager.getInstance();
        LAppPal.updateTime();
        this._view.initializeSprite();
    }
    /**
     * Resize the canvas to fill the screen.
     */
    _resizeCanvas() {
        canvas.width = canvas.clientWidth * window.devicePixelRatio;
        canvas.height = canvas.clientHeight * window.devicePixelRatio;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
}
/**
 * クリックしたときに呼ばれる。
 */
function onClickBegan(e) {
    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printMessage('view notfound');
        return;
    }
    LAppDelegate.getInstance()._captured = true;
    const posX = e.pageX;
    const posY = e.pageY;
    LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}
/**
 * マウスポインタが動いたら呼ばれる。
 */
function onMouseMoved(e) {
    if (!LAppDelegate.getInstance()._captured) {
        return;
    }
    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printMessage('view notfound');
        return;
    }
    const rect = e.target.getBoundingClientRect();
    const posX = e.clientX - rect.left;
    const posY = e.clientY - rect.top;
    LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}
/**
 * クリックが終了したら呼ばれる。
 */
function onClickEnded(e) {
    LAppDelegate.getInstance()._captured = false;
    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printMessage('view notfound');
        return;
    }
    const rect = e.target.getBoundingClientRect();
    const posX = e.clientX - rect.left;
    const posY = e.clientY - rect.top;
    LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}
/**
 * タッチしたときに呼ばれる。
 */
function onTouchBegan(e) {
    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printMessage('view notfound');
        return;
    }
    LAppDelegate.getInstance()._captured = true;
    const posX = e.changedTouches[0].pageX;
    const posY = e.changedTouches[0].pageY;
    LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}
/**
 * スワイプすると呼ばれる。
 */
function onTouchMoved(e) {
    if (!LAppDelegate.getInstance()._captured) {
        return;
    }
    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printMessage('view notfound');
        return;
    }
    const rect = e.target.getBoundingClientRect();
    const posX = e.changedTouches[0].clientX - rect.left;
    const posY = e.changedTouches[0].clientY - rect.top;
    LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}
/**
 * タッチが終了したら呼ばれる。
 */
function onTouchEnded(e) {
    LAppDelegate.getInstance()._captured = false;
    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printMessage('view notfound');
        return;
    }
    const rect = e.target.getBoundingClientRect();
    const posX = e.changedTouches[0].clientX - rect.left;
    const posY = e.changedTouches[0].clientY - rect.top;
    LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}
/**
 * タッチがキャンセルされると呼ばれる。
 */
function onTouchCancel(e) {
    LAppDelegate.getInstance()._captured = false;
    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printMessage('view notfound');
        return;
    }
    const rect = e.target.getBoundingClientRect();
    const posX = e.changedTouches[0].clientX - rect.left;
    const posY = e.changedTouches[0].clientY - rect.top;
    LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}
