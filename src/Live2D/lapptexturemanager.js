/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { csmVector } from './dist/type/csmvector.js';
/**
 * テクスチャ管理クラス
 * 画像読み込み、管理を行うクラス。
 */
export class LAppTextureManager {
    /**
     * コンストラクタ
     */
    constructor(canvas_gl) {
        this.gl = canvas_gl;
        this._textures = new csmVector();
    }
    /**
     * 解放する。
     */
    release() {
        for (let ite = this._textures.begin(); ite.notEqual(this._textures.end()); ite.preIncrement()) {
            this.gl.deleteTexture(ite.ptr().id);
        }
        this._textures = null;
    }
    /**
     * 画像読み込み
     *
     * @param fileName 読み込む画像ファイルパス名
     * @param usePremultiply Premult処理を有効にするか
     * @return 画像情報、読み込み失敗時はnullを返す
     */
    createTextureFromPngFile(fileName, usePremultiply, callback) {
        // search loaded texture already
        for (let ite = this._textures.begin(); ite.notEqual(this._textures.end()); ite.preIncrement()) {
            if (ite.ptr().fileName == fileName &&
                ite.ptr().usePremultply == usePremultiply) {
                // 2回目以降はキャッシュが使用される(待ち時間なし)
                // WebKitでは同じImageのonloadを再度呼ぶには再インスタンスが必要
                // 詳細：https://stackoverflow.com/a/5024181
                ite.ptr().img = new Image();
                ite
                    .ptr()
                    .img.addEventListener('load', () => callback(ite.ptr()), {
                    passive: true
                });
                ite.ptr().img.src = fileName;
                return;
            }
        }
        // データのオンロードをトリガーにする
        const img = new Image();
        img.addEventListener('load', () => {
            // テクスチャオブジェクトの作成
            const tex = this.gl.createTexture();
            // テクスチャを選択
            this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
            // テクスチャにピクセルを書き込む
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            // Premult処理を行わせる
            if (usePremultiply) {
                this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
            }
            // テクスチャにピクセルを書き込む
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
            // ミップマップを生成
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
            // テクスチャをバインド
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            const textureInfo = new TextureInfo();
            if (textureInfo != null) {
                textureInfo.fileName = fileName;
                textureInfo.width = img.width;
                textureInfo.height = img.height;
                textureInfo.id = tex;
                textureInfo.img = img;
                textureInfo.usePremultply = usePremultiply;
                this._textures.pushBack(textureInfo);
            }
            callback(textureInfo);
        }, { passive: true });
        img.src = fileName;
    }
    /**
     * 画像の解放
     *
     * 配列に存在する画像全てを解放する。
     */
    releaseTextures() {
        for (let i = 0; i < this._textures.getSize(); i++) {
            this._textures.set(i, null);
        }
        this._textures.clear();
    }
    /**
     * 画像の解放
     *
     * 指定したテクスチャの画像を解放する。
     * @param texture 解放するテクスチャ
     */
    releaseTextureByTexture(texture) {
        for (let i = 0; i < this._textures.getSize(); i++) {
            if (this._textures.at(i).id != texture) {
                continue;
            }
            this._textures.set(i, null);
            this._textures.remove(i);
            break;
        }
    }
    /**
     * 画像の解放
     *
     * 指定した名前の画像を解放する。
     * @param fileName 解放する画像ファイルパス名
     */
    releaseTextureByFilePath(fileName) {
        for (let i = 0; i < this._textures.getSize(); i++) {
            if (this._textures.at(i).fileName == fileName) {
                this._textures.set(i, null);
                this._textures.remove(i);
                break;
            }
        }
    }
}
/**
 * 画像情報構造体
 */
export class TextureInfo {
    constructor() {
        this.id = null; // テクスチャ
        this.width = 0; // 横幅
        this.height = 0; // 高さ
    }
}
