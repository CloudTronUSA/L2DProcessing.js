// pack live2d stuff into one

import { CubismFramework, Option } from './dist/live2dcubismframework.js';
import { CubismViewMatrix } from './dist/math/cubismviewmatrix.js';
import { CubismMatrix44 } from './dist/math/cubismmatrix44.js';
import { LAppGlManager } from './lappglmanager.js';
import * as LAppDefine from './lappdefine.js';
import { LAppModel } from './lappmodel.js';
import { LAppPal } from './lapppal.js';
import { LAppTextureManager } from './lapptexturemanager.js';

/*
Live 2D class

exported functions:
    - initialize(x, y, width, height, modelDir, modelFile)
    - release()
    - loadModel(modelDir, modelFile)
    - updateModel()
    - setModelCanvasPosition(x, y, width, height)
    - setModelPosition(x, y)
    - setModelScale(scale)
    - startMotion(group_name, id)
    - stopMotion()
    - setExpression(expression_name)
    - unsetExpression()
    - setParameter(name, value, weight)
    - lookAt(x, y)
*/

export class Live2D {
    static #s_instance = null;
    static getInstance(canvas) {
        if (Live2D.#s_instance == null) {
            Live2D.#s_instance = new Live2D(canvas);
        } else {
            console.log('releasing old instance');
            Live2D.#s_instance.release();
            Live2D.#s_instance = new Live2D(canvas);
        }
        console.log('instance created');
        return Live2D.#s_instance;
    }

    constructor(canvas) {
        this._canvas = canvas;
        this._cubismOption = new Option();
        this._viewMatrix = new CubismViewMatrix();
        this.debugMode = false;
    }

    pjsToModern(pjs) {
        var oldCanvas = pjs.externals.canvas;
        var width = oldCanvas.width;
        var height = oldCanvas.height;
        this._pgraphics = pjs.createGraphics(width, height, 2);
        this._pjs = pjs;
        this._canvas = this._pgraphics.externals.canvas;
    }

    // get context
    _getCtx() {
        return this._LAppGlManager.gl;
    }

    initialize(x, y, width, height, modelDir, modelFile) {
        this._LAppGlManager = new LAppGlManager(this._canvas);
        this._gl = this._getCtx();

        if (!this._frameBuffer) {
            this._frameBuffer = this._gl.getParameter(this._gl.FRAMEBUFFER_BINDING);
        }

        this._textureManager = new LAppTextureManager(this._gl);

        this._gl.enable(this._gl.BLEND);
        this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);

        // initialize cubism
        this._initializeCubism();

        // create shader
        //this._createShader();

        // set view matrix
        this._viewMatrix.setScreenRect(x, width, y, height);
        this._viewport = [x, y, width, height];

        // load model
        this.loadModel(modelDir, modelFile);

        return true;
    }

    // initialize cubism
    _initializeCubism() {
        // setup cubism
        this._cubismOption.logFunction = LAppPal.printMessage;
        this._cubismOption.loggingLevel = LAppDefine.CubismLoggingLevel;
        CubismFramework.startUp(this._cubismOption);
        // initialize cubism
        CubismFramework.initialize();
        LAppPal.updateTime();
    }

    // create shader
    _createShader() {
        // バーテックスシェーダーのコンパイル
        const vertexShaderId = this._gl.createShader(this._gl.VERTEX_SHADER);
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
        this._gl.shaderSource(vertexShaderId, vertexShader);
        this._gl.compileShader(vertexShaderId);
        // フラグメントシェーダのコンパイル
        const fragmentShaderId = this._gl.createShader(this._gl.FRAGMENT_SHADER);
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
        this._gl.shaderSource(fragmentShaderId, fragmentShader);
        this._gl.compileShader(fragmentShaderId);
        // プログラムオブジェクトの作成
        const programId = this._gl.createProgram();
        this._gl.attachShader(programId, vertexShaderId);
        this._gl.attachShader(programId, fragmentShaderId);
        this._gl.deleteShader(vertexShaderId);
        this._gl.deleteShader(fragmentShaderId);
        // リンク
        this._gl.linkProgram(programId);
        this._gl.useProgram(programId);
        return programId;
    }

    // release everything
    release() {
        this._textureManager.release();
        this._textureManager = null;
        // release model
        this._model = null;
        // release Cubism SDK
        CubismFramework.dispose();
    }

    // load model
    loadModel(modelDir, modelFile, callback=null) {
        if (this._model) {
            this._model.release();
            this._model = null;
        }
        this._model = new LAppModel(
            this._gl, this._textureManager, 
            this.canvas, this._viewport, this._frameBuffer
        );
        this._model.loadAssets(modelDir, modelFile, callback);
    } 

    _preRender() {
        // 画面の初期化
        this._gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // 深度テストを有効化
        this._gl.enable(this._gl.DEPTH_TEST);
        // 近くにある物体は、遠くにある物体を覆い隠す
        this._gl.depthFunc(this._gl.LEQUAL);
        // カラーバッファや深度バッファをクリアする
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        this._gl.clearDepth(1.0);
        // 透過設定
        this._gl.enable(this._gl.BLEND);
        this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
    }

    // update + draw model
    updateModel() {
        if (!this._model) {
            return;
        }

        // update time
        LAppPal.updateTime();
        const projection = new CubismMatrix44();
        const width = this._viewport[2];
        const height = this._viewport[3];

        if (this._model.getModel()) {
            if (this._model.getModel().getCanvasWidth() > 1.0 && width < height) {
                // 横に長いモデルを縦長ウィンドウに表示する際モデルの横サイズでscaleを算出する
                this._model.getModelMatrix().setWidth(2.0);
                projection.scale(1.0, width / height);
            }
            else {
                projection.scale(height / width, 1.0);
            }
            // 必要があればここで乗算
            if (this._viewMatrix != null) {
                projection.multiplyByMatrix(this._viewMatrix);
            }
        }
        this._model.update();

        this._pgraphics.background(0,0);
        this._pgraphics.beginDraw();
        this._model.draw(projection);
        this._pgraphics.endDraw();
        this._pjs.image(this._pgraphics, 0, 0);
    }

    // translate model (x, y) range of 0 to width/height of canvas
    // first translate canvas position to model position
    // note: the default model position is a the center of the canvas
    setModelCanvasPosition(x, y, width, height) {
        this._viewport = [x, y, width, height];
        this._viewMatrix.setScreenRect(x, width, y, height);
        if (this._model) {
            this._model.viewport = this._viewport;
        }
    }

    // set model position (x, y) range of -1.0 to 1.0
    setModelPosition(x, y) {
        if (this._model) {
            this._viewMatrix.translate(x, y);
        }
    }

    // set model scale
    setModelScale(scale) {
        if (this._model) {
            this._viewMatrix.scale(scale, scale);
        }
    }

    // start motion
    startMotion(group_name, id) {
        this._model.startMotion(group_name, id);
    }
    // end motion
    stopMotion() {
        this._model.endMotion();
    }

    // set expression
    setExpression(expression_name) {
        this._model.setExpression(expression_name);
    }
    // unset expression
    unsetExpression() {
        this._model.unsetExpression();
    }

    // set parameter
    setParameter(name, value, weight = 1) {
        this._model.getModel().setParameterValueById(name, value, weight);
    }

    // look at (x, y) range of -1.0 to 1.0
    lookAt(x, y) {
        this._model.setDragging(x, y);
    }
}