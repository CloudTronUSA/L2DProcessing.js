/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
export let canvas = null;
export let gl = null;
export let s_instance = null;
/**
 * Cubism SDKのサンプルで使用するWebGLを管理するクラス
 */
export class LAppGlManager {
    /**
     * クラスのインスタンス（シングルトン）を返す。
     * インスタンスが生成されていない場合は内部でインスタンスを生成する。
     *
     * @return クラスのインスタンス
     */
    static getInstance(canvas) {
        if (s_instance == null) {
            s_instance = new LAppGlManager(canvas);
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
    constructor(canvas) {
        // glコンテキストを初期化
        this.gl = canvas.getContext('webgl');
        if (!this.gl) {
            // gl初期化失敗
            alert('[L2D] Cannot initialize WebGL. This browser does not support.');
            this.gl = null;
            //document.body.innerHTML =
            //    'This browser does not support the <code>&lt;canvas&gt;</code> element.';
        }
    }
    /**
     * 解放する。
     */
    release() { }
}
