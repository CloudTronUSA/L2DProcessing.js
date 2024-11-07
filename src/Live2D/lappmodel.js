/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CubismDefaultParameterId } from './dist/cubismdefaultparameterid.js';
import { CubismModelSettingJson } from './dist/cubismmodelsettingjson.js';
import { BreathParameterData, CubismBreath } from './dist/effect/cubismbreath.js';
import { CubismEyeBlink } from './dist/effect/cubismeyeblink.js';
import { CubismFramework } from './dist/live2dcubismframework.js';
import { CubismUserModel } from './dist/model/cubismusermodel.js';
import { ACubismMotion } from './dist/motion/acubismmotion.js';
import { InvalidMotionQueueEntryHandleValue } from './dist/motion/cubismmotionqueuemanager.js';
import { csmMap } from './dist/type/csmmap.js';
import { csmVector } from './dist/type/csmvector.js';
import { CSM_ASSERT, CubismLogError, CubismLogInfo } from './dist/utils/cubismdebug.js';
import * as LAppDefine from './lappdefine.js';
import { LAppPal } from './lapppal.js';
import { LAppWavFileHandler } from './lappwavfilehandler.js';
import { CubismMoc } from './dist/model/cubismmoc.js';
var LoadStep;
(function (LoadStep) {
    LoadStep[LoadStep["LoadAssets"] = 0] = "LoadAssets";
    LoadStep[LoadStep["LoadModel"] = 1] = "LoadModel";
    LoadStep[LoadStep["WaitLoadModel"] = 2] = "WaitLoadModel";
    LoadStep[LoadStep["LoadExpression"] = 3] = "LoadExpression";
    LoadStep[LoadStep["WaitLoadExpression"] = 4] = "WaitLoadExpression";
    LoadStep[LoadStep["LoadPhysics"] = 5] = "LoadPhysics";
    LoadStep[LoadStep["WaitLoadPhysics"] = 6] = "WaitLoadPhysics";
    LoadStep[LoadStep["LoadPose"] = 7] = "LoadPose";
    LoadStep[LoadStep["WaitLoadPose"] = 8] = "WaitLoadPose";
    LoadStep[LoadStep["SetupEyeBlink"] = 9] = "SetupEyeBlink";
    LoadStep[LoadStep["SetupBreath"] = 10] = "SetupBreath";
    LoadStep[LoadStep["LoadUserData"] = 11] = "LoadUserData";
    LoadStep[LoadStep["WaitLoadUserData"] = 12] = "WaitLoadUserData";
    LoadStep[LoadStep["SetupEyeBlinkIds"] = 13] = "SetupEyeBlinkIds";
    LoadStep[LoadStep["SetupLipSyncIds"] = 14] = "SetupLipSyncIds";
    LoadStep[LoadStep["SetupLayout"] = 15] = "SetupLayout";
    LoadStep[LoadStep["LoadMotion"] = 16] = "LoadMotion";
    LoadStep[LoadStep["WaitLoadMotion"] = 17] = "WaitLoadMotion";
    LoadStep[LoadStep["CompleteInitialize"] = 18] = "CompleteInitialize";
    LoadStep[LoadStep["CompleteSetupModel"] = 19] = "CompleteSetupModel";
    LoadStep[LoadStep["LoadTexture"] = 20] = "LoadTexture";
    LoadStep[LoadStep["WaitLoadTexture"] = 21] = "WaitLoadTexture";
    LoadStep[LoadStep["CompleteSetup"] = 22] = "CompleteSetup";
})(LoadStep || (LoadStep = {}));
/**
 * ユーザーが実際に使用するモデルの実装クラス<br>
 * モデル生成、機能コンポーネント生成、更新処理とレンダリングの呼び出しを行う。
 */
export class LAppModel extends CubismUserModel {
    /**
     * model3.jsonが置かれたディレクトリとファイルパスからモデルを生成する
     * @param dir
     * @param fileName
     */
    loadAssets(dir, fileName, callback=null) {
        this._modelHomeDir = dir;
        fetch(`${this._modelHomeDir}${fileName}`)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
            const setting = new CubismModelSettingJson(arrayBuffer, arrayBuffer.byteLength);
            // ステートを更新
            this._state = LoadStep.LoadModel;
            // 結果を保存
            this.setupModel(setting);
            if (callback) {
                callback();
            }
        })
            .catch(error => {
            // model3.json読み込みでエラーが発生した時点で描画は不可能なので、setupせずエラーをcatchして何もしない
            CubismLogError(`Failed to load file ${this._modelHomeDir}${fileName}`);
        });
    }
    /**
     * model3.jsonからモデルを生成する。
     * model3.jsonの記述に従ってモデル生成、モーション、物理演算などのコンポーネント生成を行う。
     *
     * @param setting ICubismModelSettingのインスタンス
     */
    setupModel(setting) {
        this._updating = true;
        this._initialized = false;
        this._modelSetting = setting;
        // CubismModel
        if (this._modelSetting.getModelFileName() != '') {
            const modelFileName = this._modelSetting.getModelFileName();
            fetch(`${this._modelHomeDir}${modelFileName}`)
                .then(response => {
                if (response.ok) {
                    return response.arrayBuffer();
                }
                else if (response.status >= 400) {
                    CubismLogError(`Failed to load file ${this._modelHomeDir}${modelFileName}`);
                    return new ArrayBuffer(0);
                }
            })
                .then(arrayBuffer => {
                this.loadModel(arrayBuffer, this._mocConsistency);
                this._state = LoadStep.LoadExpression;
                // callback
                loadCubismExpression();
            });
            this._state = LoadStep.WaitLoadModel;
        }
        else {
            LAppPal.printMessage('Model data does not exist.');
        }
        // Expression
        const loadCubismExpression = () => {
            if (this._modelSetting.getExpressionCount() > 0) {
                const count = this._modelSetting.getExpressionCount();
                for (let i = 0; i < count; i++) {
                    const expressionName = this._modelSetting.getExpressionName(i);
                    const expressionFileName = this._modelSetting.getExpressionFileName(i);
                    fetch(`${this._modelHomeDir}${expressionFileName}`)
                        .then(response => {
                        if (response.ok) {
                            return response.arrayBuffer();
                        }
                        else if (response.status >= 400) {
                            CubismLogError(`Failed to load file ${this._modelHomeDir}${expressionFileName}`);
                            // ファイルが存在しなくてもresponseはnullを返却しないため、空のArrayBufferで対応する
                            return new ArrayBuffer(0);
                        }
                    })
                        .then(arrayBuffer => {
                        const motion = this.loadExpression(arrayBuffer, arrayBuffer.byteLength, expressionName);
                        if (this._expressions.getValue(expressionName) != null) {
                            ACubismMotion.delete(this._expressions.getValue(expressionName));
                            this._expressions.setValue(expressionName, null);
                        }
                        this._expressions.setValue(expressionName, motion);
                        this._expressionCount++;
                        if (this._expressionCount >= count) {
                            this._state = LoadStep.LoadPhysics;
                            // callback
                            loadCubismPhysics();
                        }
                    });
                }
                this._state = LoadStep.WaitLoadExpression;
            }
            else {
                this._state = LoadStep.LoadPhysics;
                // callback
                loadCubismPhysics();
            }
        };
        // Physics
        const loadCubismPhysics = () => {
            if (this._modelSetting.getPhysicsFileName() != '') {
                const physicsFileName = this._modelSetting.getPhysicsFileName();
                fetch(`${this._modelHomeDir}${physicsFileName}`)
                    .then(response => {
                    if (response.ok) {
                        return response.arrayBuffer();
                    }
                    else if (response.status >= 400) {
                        CubismLogError(`Failed to load file ${this._modelHomeDir}${physicsFileName}`);
                        return new ArrayBuffer(0);
                    }
                })
                    .then(arrayBuffer => {
                    this.loadPhysics(arrayBuffer, arrayBuffer.byteLength);
                    this._state = LoadStep.LoadPose;
                    // callback
                    loadCubismPose();
                });
                this._state = LoadStep.WaitLoadPhysics;
            }
            else {
                this._state = LoadStep.LoadPose;
                // callback
                loadCubismPose();
            }
        };
        // Pose
        const loadCubismPose = () => {
            if (this._modelSetting.getPoseFileName() != '') {
                const poseFileName = this._modelSetting.getPoseFileName();
                fetch(`${this._modelHomeDir}${poseFileName}`)
                    .then(response => {
                    if (response.ok) {
                        return response.arrayBuffer();
                    }
                    else if (response.status >= 400) {
                        CubismLogError(`Failed to load file ${this._modelHomeDir}${poseFileName}`);
                        return new ArrayBuffer(0);
                    }
                })
                    .then(arrayBuffer => {
                    this.loadPose(arrayBuffer, arrayBuffer.byteLength);
                    this._state = LoadStep.SetupEyeBlink;
                    // callback
                    setupEyeBlink();
                });
                this._state = LoadStep.WaitLoadPose;
            }
            else {
                this._state = LoadStep.SetupEyeBlink;
                // callback
                setupEyeBlink();
            }
        };
        // EyeBlink
        const setupEyeBlink = () => {
            if (this._modelSetting.getEyeBlinkParameterCount() > 0) {
                this._eyeBlink = CubismEyeBlink.create(this._modelSetting);
                this._state = LoadStep.SetupBreath;
            }
            // callback
            setupBreath();
        };
        // Breath
        const setupBreath = () => {
            this._breath = CubismBreath.create();
            const breathParameters = new csmVector();
            breathParameters.pushBack(new BreathParameterData(this._idParamAngleX, 0.0, 15.0, 6.5345, 0.5));
            breathParameters.pushBack(new BreathParameterData(this._idParamAngleY, 0.0, 8.0, 3.5345, 0.5));
            breathParameters.pushBack(new BreathParameterData(this._idParamAngleZ, 0.0, 10.0, 5.5345, 0.5));
            breathParameters.pushBack(new BreathParameterData(this._idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5));
            breathParameters.pushBack(new BreathParameterData(CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBreath), 0.5, 0.5, 3.2345, 1));
            this._breath.setParameters(breathParameters);
            this._state = LoadStep.LoadUserData;
            // callback
            loadUserData();
        };
        // UserData
        const loadUserData = () => {
            if (this._modelSetting.getUserDataFile() != '') {
                const userDataFile = this._modelSetting.getUserDataFile();
                fetch(`${this._modelHomeDir}${userDataFile}`)
                    .then(response => {
                    if (response.ok) {
                        return response.arrayBuffer();
                    }
                    else if (response.status >= 400) {
                        CubismLogError(`Failed to load file ${this._modelHomeDir}${userDataFile}`);
                        return new ArrayBuffer(0);
                    }
                })
                    .then(arrayBuffer => {
                    this.loadUserData(arrayBuffer, arrayBuffer.byteLength);
                    this._state = LoadStep.SetupEyeBlinkIds;
                    // callback
                    setupEyeBlinkIds();
                });
                this._state = LoadStep.WaitLoadUserData;
            }
            else {
                this._state = LoadStep.SetupEyeBlinkIds;
                // callback
                setupEyeBlinkIds();
            }
        };
        // EyeBlinkIds
        const setupEyeBlinkIds = () => {
            const eyeBlinkIdCount = this._modelSetting.getEyeBlinkParameterCount();
            for (let i = 0; i < eyeBlinkIdCount; ++i) {
                this._eyeBlinkIds.pushBack(this._modelSetting.getEyeBlinkParameterId(i));
            }
            this._state = LoadStep.SetupLipSyncIds;
            // callback
            setupLipSyncIds();
        };
        // LipSyncIds
        const setupLipSyncIds = () => {
            const lipSyncIdCount = this._modelSetting.getLipSyncParameterCount();
            for (let i = 0; i < lipSyncIdCount; ++i) {
                this._lipSyncIds.pushBack(this._modelSetting.getLipSyncParameterId(i));
            }
            this._state = LoadStep.SetupLayout;
            // callback
            setupLayout();
        };
        // Layout
        const setupLayout = () => {
            const layout = new csmMap();
            if (this._modelSetting == null || this._modelMatrix == null) {
                CubismLogError('Failed to setupLayout().');
                return;
            }
            this._modelSetting.getLayoutMap(layout);
            this._modelMatrix.setupFromLayout(layout);
            this._state = LoadStep.LoadMotion;
            // callback
            loadCubismMotion();
        };
        // Motion
        const loadCubismMotion = () => {
            this._state = LoadStep.WaitLoadMotion;
            this._model.saveParameters();
            this._allMotionCount = 0;
            this._motionCount = 0;
            const group = [];
            const motionGroupCount = this._modelSetting.getMotionGroupCount();
            // モーションの総数を求める
            for (let i = 0; i < motionGroupCount; i++) {
                group[i] = this._modelSetting.getMotionGroupName(i);
                this._allMotionCount += this._modelSetting.getMotionCount(group[i]);
            }
            // モーションの読み込み
            for (let i = 0; i < motionGroupCount; i++) {
                this.preLoadMotionGroup(group[i]);
            }
            // モーションがない場合
            if (motionGroupCount == 0) {
                this._state = LoadStep.LoadTexture;
                // 全てのモーションを停止する
                this._motionManager.stopAllMotions();
                this._updating = false;
                this._initialized = true;
                this.createRenderer();
                this.setupTextures();
                this.getRenderer().startUp(this.gl);
            }
        };
    }
    /**
     * テクスチャユニットにテクスチャをロードする
     */
    setupTextures() {
        // iPhoneでのアルファ品質向上のためTypescriptではpremultipliedAlphaを採用
        const usePremultiply = true;
        if (this._state == LoadStep.LoadTexture) {
            // テクスチャ読み込み用
            const textureCount = this._modelSetting.getTextureCount();
            for (let modelTextureNumber = 0; modelTextureNumber < textureCount; modelTextureNumber++) {
                // テクスチャ名が空文字だった場合はロード・バインド処理をスキップ
                if (this._modelSetting.getTextureFileName(modelTextureNumber) == '') {
                    console.log('getTextureFileName null');
                    continue;
                }
                // WebGLのテクスチャユニットにテクスチャをロードする
                let texturePath = this._modelSetting.getTextureFileName(modelTextureNumber);
                texturePath = this._modelHomeDir + texturePath;
                // ロード完了時に呼び出すコールバック関数
                const onLoad = (textureInfo) => {
                    this.getRenderer().bindTexture(modelTextureNumber, textureInfo.id);
                    this._textureCount++;
                    if (this._textureCount >= textureCount) {
                        // ロード完了
                        this._state = LoadStep.CompleteSetup;
                    }
                };
                // 読み込み
                this._textureManager.createTextureFromPngFile(texturePath, usePremultiply, onLoad);
                this.getRenderer().setIsPremultipliedAlpha(usePremultiply);
            }
            this._state = LoadStep.WaitLoadTexture;
        }
    }
    /**
     * レンダラを再構築する
     */
    reloadRenderer() {
        this.deleteRenderer();
        this.createRenderer();
        this.setupTextures();
    }
    /**
     * 更新
     */
    update() {
        if (this._state != LoadStep.CompleteSetup)
            return;
        const deltaTimeSeconds = LAppPal.getDeltaTime();
        this._userTimeSeconds += deltaTimeSeconds;
        this._dragManager.update(deltaTimeSeconds);
        this._dragX = this._dragManager.getX();
        this._dragY = this._dragManager.getY();
        // モーションによるパラメータ更新の有無
        let motionUpdated = false;
        //--------------------------------------------------------------------------
        this._model.loadParameters(); // 前回セーブされた状態をロード
        if (this._motionManager.isFinished()) {
            // モーションの再生がない場合、待機モーションの中からランダムで再生する
            this.startRandomMotion(LAppDefine.MotionGroupIdle, LAppDefine.PriorityIdle);
        }
        else {
            motionUpdated = this._motionManager.updateMotion(this._model, deltaTimeSeconds); // モーションを更新
        }
        this._model.saveParameters(); // 状態を保存
        //--------------------------------------------------------------------------
        // まばたき
        if (!motionUpdated) {
            if (this._eyeBlink != null) {
                // メインモーションの更新がないとき
                this._eyeBlink.updateParameters(this._model, deltaTimeSeconds); // 目パチ
            }
        }
        if (this._expressionManager != null) {
            this._expressionManager.updateMotion(this._model, deltaTimeSeconds); // 表情でパラメータ更新（相対変化）
        }
        // ドラッグによる変化
        // ドラッグによる顔の向きの調整
        this._model.addParameterValueById(this._idParamAngleX, this._dragX * 30); // -30から30の値を加える
        this._model.addParameterValueById(this._idParamAngleY, this._dragY * 30);
        this._model.addParameterValueById(this._idParamAngleZ, this._dragX * this._dragY * -30);
        // ドラッグによる体の向きの調整
        this._model.addParameterValueById(this._idParamBodyAngleX, this._dragX * 10); // -10から10の値を加える
        // ドラッグによる目の向きの調整
        this._model.addParameterValueById(this._idParamEyeBallX, this._dragX); // -1から1の値を加える
        this._model.addParameterValueById(this._idParamEyeBallY, this._dragY);
        // 呼吸など
        if (this._breath != null) {
            this._breath.updateParameters(this._model, deltaTimeSeconds);
        }
        // 物理演算の設定
        if (this._physics != null) {
            this._physics.evaluate(this._model, deltaTimeSeconds);
        }
        // リップシンクの設定
        if (this._lipsync) {
            let value = 0.0; // リアルタイムでリップシンクを行う場合、システムから音量を取得して、0~1の範囲で値を入力します。
            this._wavFileHandler.update(deltaTimeSeconds);
            value = this._wavFileHandler.getRms();
            for (let i = 0; i < this._lipSyncIds.getSize(); ++i) {
                this._model.addParameterValueById(this._lipSyncIds.at(i), value, 0.8);
            }
        }
        // ポーズの設定
        if (this._pose != null) {
            this._pose.updateParameters(this._model, deltaTimeSeconds);
        }
        this._model.update();
    }
    /**
     * 引数で指定したモーションの再生を開始する
     * @param group モーショングループ名
     * @param no グループ内の番号
     * @param priority 優先度
     * @param onFinishedMotionHandler モーション再生終了時に呼び出されるコールバック関数
     * @return 開始したモーションの識別番号を返す。個別のモーションが終了したか否かを判定するisFinished()の引数で使用する。開始できない時は[-1]
     */
    startMotion(group, no, priority, onFinishedMotionHandler) {
        if (priority == LAppDefine.PriorityForce) {
            this._motionManager.setReservePriority(priority);
        }
        else if (!this._motionManager.reserveMotion(priority)) {
            if (this._debugMode) {
                LAppPal.printMessage("[APP]can't start motion.");
            }
            return InvalidMotionQueueEntryHandleValue;
        }
        const motionFileName = this._modelSetting.getMotionFileName(group, no);
        // ex) idle_0
        const name = `${group}_${no}`;
        let motion = this._motions.getValue(name);
        let autoDelete = false;
        if (motion == null) {
            fetch(`${this._modelHomeDir}${motionFileName}`)
                .then(response => {
                if (response.ok) {
                    return response.arrayBuffer();
                }
                else if (response.status >= 400) {
                    CubismLogError(`Failed to load file ${this._modelHomeDir}${motionFileName}`);
                    return new ArrayBuffer(0);
                }
            })
                .then(arrayBuffer => {
                motion = this.loadMotion(arrayBuffer, arrayBuffer.byteLength, null, onFinishedMotionHandler);
                if (motion == null) {
                    return;
                }
                let fadeTime = this._modelSetting.getMotionFadeInTimeValue(group, no);
                if (fadeTime >= 0.0) {
                    motion.setFadeInTime(fadeTime);
                }
                fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, no);
                if (fadeTime >= 0.0) {
                    motion.setFadeOutTime(fadeTime);
                }
                motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
                autoDelete = true; // 終了時にメモリから削除
            });
        }
        else {
            motion.setFinishedMotionHandler(onFinishedMotionHandler);
        }
        //voice
        const voice = this._modelSetting.getMotionSoundFileName(group, no);
        if (voice.localeCompare('') != 0) {
            let path = voice;
            path = this._modelHomeDir + path;
            this._wavFileHandler.start(path);
        }
        if (this._debugMode) {
            LAppPal.printMessage(`[APP]start motion: [${group}_${no}`);
        }
        return this._motionManager.startMotionPriority(motion, autoDelete, priority);
    }
    /**
     * ランダムに選ばれたモーションの再生を開始する。
     * @param group モーショングループ名
     * @param priority 優先度
     * @param onFinishedMotionHandler モーション再生終了時に呼び出されるコールバック関数
     * @return 開始したモーションの識別番号を返す。個別のモーションが終了したか否かを判定するisFinished()の引数で使用する。開始できない時は[-1]
     */
    startRandomMotion(group, priority, onFinishedMotionHandler) {
        if (this._modelSetting.getMotionCount(group) == 0) {
            return InvalidMotionQueueEntryHandleValue;
        }
        const no = Math.floor(Math.random() * this._modelSetting.getMotionCount(group));
        return this.startMotion(group, no, priority, onFinishedMotionHandler);
    }
    endMotion() {
        this._motionManager.stopAllMotions();
    }

    /**
     * 引数で指定した表情モーションをセットする
     *
     * @param expressionId 表情モーションのID
     */
    setExpression(expressionId) {
        const motion = this._expressions.getValue(expressionId);
        if (this._debugMode) {
            LAppPal.printMessage(`[APP]expression: [${expressionId}]`);
        }
        if (motion != null) {
            this._expressionManager.startMotionPriority(motion, false, LAppDefine.PriorityForce);
        }
        else {
            if (this._debugMode) {
                LAppPal.printMessage(`[APP]expression[${expressionId}] is null`);
            }
        }
    }
    /**
     * ランダムに選ばれた表情モーションをセットする
     */
    setRandomExpression() {
        if (this._expressions.getSize() == 0) {
            return;
        }
        const no = Math.floor(Math.random() * this._expressions.getSize());
        for (let i = 0; i < this._expressions.getSize(); i++) {
            if (i == no) {
                const name = this._expressions._keyValues[i].first;
                this.setExpression(name);
                return;
            }
        }
    }
    unsetExpression() {
        this._expressionManager.stopAllMotions();
    }

    /**
     * イベントの発火を受け取る
     */
    motionEventFired(eventValue) {
        CubismLogInfo('{0} is fired on LAppModel!!', eventValue.s);
    }
    /**
     * 当たり判定テスト
     * 指定ＩＤの頂点リストから矩形を計算し、座標をが矩形範囲内か判定する。
     *
     * @param hitArenaName  当たり判定をテストする対象のID
     * @param x             判定を行うX座標
     * @param y             判定を行うY座標
     */
    hitTest(hitArenaName, x, y) {
        // 透明時は当たり判定無し。
        if (this._opacity < 1) {
            return false;
        }
        const count = this._modelSetting.getHitAreasCount();
        for (let i = 0; i < count; i++) {
            if (this._modelSetting.getHitAreaName(i) == hitArenaName) {
                const drawId = this._modelSetting.getHitAreaId(i);
                return this.isHit(drawId, x, y);
            }
        }
        return false;
    }
    /**
     * モーションデータをグループ名から一括でロードする。
     * モーションデータの名前は内部でModelSettingから取得する。
     *
     * @param group モーションデータのグループ名
     */
    preLoadMotionGroup(group) {
        for (let i = 0; i < this._modelSetting.getMotionCount(group); i++) {
            const motionFileName = this._modelSetting.getMotionFileName(group, i);
            // ex) idle_0
            const name = `${group}_${i}`;
            if (this._debugMode) {
                LAppPal.printMessage(`[APP]load motion: ${motionFileName} => [${name}]`);
            }
            fetch(`${this._modelHomeDir}${motionFileName}`)
                .then(response => {
                if (response.ok) {
                    return response.arrayBuffer();
                }
                else if (response.status >= 400) {
                    CubismLogError(`Failed to load file ${this._modelHomeDir}${motionFileName}`);
                    return new ArrayBuffer(0);
                }
            })
                .then(arrayBuffer => {
                const tmpMotion = this.loadMotion(arrayBuffer, arrayBuffer.byteLength, name);
                if (tmpMotion != null) {
                    let fadeTime = this._modelSetting.getMotionFadeInTimeValue(group, i);
                    if (fadeTime >= 0.0) {
                        tmpMotion.setFadeInTime(fadeTime);
                    }
                    fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, i);
                    if (fadeTime >= 0.0) {
                        tmpMotion.setFadeOutTime(fadeTime);
                    }
                    tmpMotion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
                    if (this._motions.getValue(name) != null) {
                        ACubismMotion.delete(this._motions.getValue(name));
                    }
                    this._motions.setValue(name, tmpMotion);
                    this._motionCount++;
                    if (this._motionCount >= this._allMotionCount) {
                        this._state = LoadStep.LoadTexture;
                        // 全てのモーションを停止する
                        this._motionManager.stopAllMotions();
                        this._updating = false;
                        this._initialized = true;
                        this.createRenderer();
                        this.setupTextures();
                        this.getRenderer().startUp(this.gl);
                    }
                }
                else {
                    // loadMotionできなかった場合はモーションの総数がずれるので1つ減らす
                    this._allMotionCount--;
                }
            });
        }
    }
    /**
     * すべてのモーションデータを解放する。
     */
    releaseMotions() {
        this._motions.clear();
    }
    /**
     * 全ての表情データを解放する。
     */
    releaseExpressions() {
        this._expressions.clear();
    }
    /**
     * モデルを描画する処理。モデルを描画する空間のView-Projection行列を渡す。
     */
    doDraw() {
        if (this._model == null)
            return;
        // キャンバスサイズを渡す
        //const viewport = [0, 0, this.canvas.width, this.canvas.height];
        this.getRenderer().setRenderState(this.frameBuffer, this.viewport);
        this.getRenderer().drawModel();
    }
    /**
     * モデルを描画する処理。モデルを描画する空間のView-Projection行列を渡す。
     */
    draw(matrix) {
        if (this._model == null) {
            return;
        }
        // 各読み込み終了後
        if (this._state == LoadStep.CompleteSetup) {
            matrix.multiplyByMatrix(this._modelMatrix);
            this.getRenderer().setMvpMatrix(matrix);
            this.doDraw();
        }
    }
    hasMocConsistencyFromFile() {
        return __awaiter(this, void 0, void 0, function* () {
            CSM_ASSERT(this._modelSetting.getModelFileName().localeCompare(``));
            // CubismModel
            if (this._modelSetting.getModelFileName() != '') {
                const modelFileName = this._modelSetting.getModelFileName();
                const response = yield fetch(`${this._modelHomeDir}${modelFileName}`);
                const arrayBuffer = yield response.arrayBuffer();
                this._consistency = CubismMoc.hasMocConsistency(arrayBuffer);
                if (!this._consistency) {
                    CubismLogInfo('Inconsistent MOC3.');
                }
                else {
                    CubismLogInfo('Consistent MOC3.');
                }
                return this._consistency;
            }
            else {
                LAppPal.printMessage('Model data does not exist.');
            }
        });
    }
    /**
     * コンストラクタ
     */
    constructor(canvas_gl, textureMgr, cvs, viewport, frameBuffer) {
        super();
        this.viewport = viewport;
        this.frameBuffer = frameBuffer;
        this._textureManager = textureMgr;
        this.gl = canvas_gl;
        this.canvas = cvs;
        this._modelSetting = null;
        this._modelHomeDir = null;
        this._userTimeSeconds = 0.0;
        this._eyeBlinkIds = new csmVector();
        this._lipSyncIds = new csmVector();
        this._motions = new csmMap();
        this._expressions = new csmMap();
        this._hitArea = new csmVector();
        this._userArea = new csmVector();
        this._idParamAngleX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleX);
        this._idParamAngleY = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleY);
        this._idParamAngleZ = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleZ);
        this._idParamEyeBallX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamEyeBallX);
        this._idParamEyeBallY = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamEyeBallY);
        this._idParamBodyAngleX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBodyAngleX);
        if (LAppDefine.MOCConsistencyValidationEnable) {
            this._mocConsistency = true;
        }
        this._state = LoadStep.LoadAssets;
        this._expressionCount = 0;
        this._textureCount = 0;
        this._motionCount = 0;
        this._allMotionCount = 0;
        this._wavFileHandler = new LAppWavFileHandler();
        this._consistency = false;
    }
}
