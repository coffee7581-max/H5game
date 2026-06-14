(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
        factory();
})((function () {
    'use strict';

    /******************************************************************************
     Copyright (c) Microsoft Corporation.

     Permission to use, copy, modify, and/or distribute this software for any
     purpose with or without fee is hereby granted.

     THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
     REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
     AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
     INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
     LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
     OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
     PERFORMANCE OF THIS SOFTWARE.
     ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P ? value : new P(function (resolve) {
                resolve(value);
            });
        }

        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }

            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }

            function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
            }

            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    const CODE = {
        OK: "OK",
        UNSUPPORTED_API: "UNSUPPORTED_API",
        TIMEOUT: "TIMEOUT",
        INVALID_PARAM: "INVALID_PARAM",
        NOT_READY: "NOT_READY",
        ADS_NO_FILL: "ADS_NO_FILL",
        AD_LOAD_FAILED: "AD_LOAD_FAILED",
        AD_DISMISSED: "AD_DISMISSED",
        AD_NOT_LOADED: "AD_NOT_LOADED",
        AD_ALREADY_LOADED: "AD_ALREADY_LOADED",
        AD_ALREADY_SHOWED: "AD_ALREADY_SHOWED"
    };
    const API_CODE = {
        CODE: CODE,
        OK: {
            code: CODE.OK,
            message: "Success"
        },
        TIMEOUT: {
            code: CODE.TIMEOUT,
            message: "timeout"
        },
        adLoadFail: {
            code: CODE.AD_LOAD_FAILED,
            message: "Ad load failed"
        },
        adDismissed: {
            code: CODE.AD_DISMISSED,
            message: "Ad dismissed"
        },
        adNotLoaded: {
            code: CODE.AD_NOT_LOADED,
            message: "Ad not loaded"
        },
        adAlreadyLoaded: {
            code: CODE.AD_ALREADY_LOADED,
            message: "Ad already loaded"
        },
        adAlreadyShowed: {
            code: CODE.AD_ALREADY_SHOWED,
            message: "Ad already showed"
        }
    };

    // https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage
    class MediationService {
        constructor(type, oneWay, serviceHandler) {
            this.type = type;
            this.isOneWay = oneWay;
            this._serviceHandler = serviceHandler;
        }

        // 响应请求
        onRequest(request) {
            return __awaiter(this, void 0, void 0, function* () {
                // console.error(`[Service: ${this.type}] ===> onRequest: `, request);
                // 处理请求
                // return this.handleRequestAsync(request);
                if (this._serviceHandler) {
                    return this._serviceHandler(request);
                }
                // 如果没有设置处理函数，则默认返回成功
                // console.error(`[Service: ${this.type}] ===> default success `);
                return Promise.resolve(generateSuccessResponse(request));
            });
        }
    }

    function generateResponseType(requestType) {
        return `${requestType}_RESPONSE`;
    }

    function generateResponse(request, code, message, payload) {
        const resp = {
            type: generateResponseType(request.type),
            requestType: request.type,
            requestId: request.requestId,
            code: code,
            message: message,
            payload: payload
        };
        return resp;
    }

    function generateSuccessResponse(request, payload) {
        return generateResponse(request, API_CODE.OK.code, API_CODE.OK.message, payload);
    }

    function generateErrorResponse(request, code, message, payload) {
        return generateResponse(request, code, message, payload);
    }

    class QuickMediationService extends MediationService {
        // private _requestHandler: (
        //   request: iMediationRequest
        // ) => Promise<iMediationResponse>;
        // constructor (
        //   type: string,
        //   oneWay: boolean,
        //   requestHandler: (request: iMediationRequest) => Promise<iMediationResponse>
        // ) {
        //   super(type, oneWay, requestHandler);
        // }
        // handleRequestAsync(request: iMediationRequest): Promise<iMediationResponse> {
        //   return this._requestHandler(request);
        // }
        static quickHandler(request) {
            const resp = generateSuccessResponse(request);
            return Promise.resolve(resp);
        }

        static createQuickHandler(handler) {
            const func = (request) => __awaiter(this, void 0, void 0, function* () {
                const resp = generateSuccessResponse(request);
                const respPayload = yield handler(request.payload);
                resp.payload = respPayload;
                return Promise.resolve(resp);
            });
            return func;
        }

        static create(type, oneWay, requestHandler) {
            return new QuickMediationService(type, oneWay, requestHandler);
        }

        static createSimpleService(type, oneWay = false, requestHandler = QuickMediationService.quickHandler) {
            return QuickMediationService.create(type, oneWay, requestHandler);
        }

        static createOneWayService(type, requestHandler) {
            return QuickMediationService.create(type, true, requestHandler);
        }
    }

    class MessageDispatcher {
        constructor(dispatcher) {
            this._window = dispatcher;
            this._messageDispatcher = this._onReceiveMessage.bind(this);
        }

        _onReceiveMessage(event) {
            try {
                const message = event.data;
                if (message && message.type) {
                    this.dispatch(message, event.source);
                }
            } catch (e) {
                console.error("Error in receiveMessage: ", e);
            }
        }

        static postMessageTo(receiver, message, origin = "*") {
            receiver.postMessage(message, origin);
        }

        // protected receiveMessage(message: iWindowMessagePayload, origin:string = "*"){
        //   this._window.postMessage(message, origin);
        // }
        start() {
            this._window.addEventListener("message", this._messageDispatcher, false);
        }

        stop() {
            this._window.removeEventListener("message", this._messageDispatcher, false);
        }
    }

    // export { generateResponseType, generateResponse,  };

    function getOption(options, key, defaultValue) {
        // 不要直接调用 hasOwnProperty https://eslint.org/docs/rules/no-prototype-builtins
        if (options && Object.prototype.hasOwnProperty.call(options, key)) {
            return options[key];
        }
        return defaultValue;
    }

    /**
     * @author : Dony
     * @date : 2022-03-04 15:13:57
     * @description : 时间工具
     */
    class TimeUtil {
        /**
         * 获取当前时间戳 13位
         * @example
         * TimeUtil.getTimestamp(); // 1614616955186
         */
        static getTimestamp() {
            return new Date().getTime();
        }

        static getTimeBySecond() {
            return Math.floor(new Date().getTime() / 1000);
        }

        /**
         * 获取当前日期（年/月/日）
         * @example
         * TimeUtil.getDate(); // "2021/3/2"
         */
        static getDate() {
            return new Date().toLocaleDateString();
        }

        /**
         * 获取当天指定时间的时间戳
         * @param hour 时
         * @param minute 分
         * @param second 秒
         * @example
         * const time = TimeUtil.getTargetTimestamp(10, 20, 30); // 1601259630000
         * new Date(time).toLocaleString(); // "上午10:20:30"
         */
        static getTargetTimestamp(hour = 0, minute = 0, second = 0) {
            const start = new Date(new Date().toLocaleDateString()).getTime();
            const target = (hour * 3600 + minute * 60 + second) * 1000;
            return new Date(start + target).getTime();
        }

        static waitTime(time, callback) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    callback && callback();
                    resolve();
                }, time);
            });
        }

        /**
         * 转换时间戳为印尼标准时间 - Indonesian Standard Time (WIB), WIB时间比标准UTC时间晚1个小时
         * @param timestamp 13为时间戳
         */
        static convertToWIB(timestamp) {
            let time = +timestamp;
            if (timestamp.length === 10) {
                // console.info("Please use 13-digit timestamp.");
                time *= 1000;
            }
            const timest = time - 1 * 60 * 60 * 1000;
            const dateWIB = new Date(timest);
            // const optionsWIB = { timeZone: "Asia/Jakarta" };
            // const localString = dateWIB.toLocaleString("id-ID", optionsWIB);
            const result = this.formatDate(dateWIB);
            return result;
        }

        /**
         * 转换时间戳为印度标准时间 - Indian Standard Time (IST)，IST时间比标准UTC时间晚2.5个小时
         * @param timestamp 13为时间戳
         */
        static convertToIST(timestamp) {
            let time = +timestamp;
            if (timestamp.length === 10) {
                // console.info("Please use 13-digit timestamp.");
                time *= 1000;
            }
            const timest = time - 2.5 * 60 * 60 * 1000;
            const dateIST = new Date(timest);
            const result = this.formatDate(dateIST);
            return result;
        }

        static convertToStandardTime(countryCode, timestamp) {
            switch (countryCode) {
                case "ID":
                    return this.convertToWIB(timestamp);
                case "IN":
                    return this.convertToIST(timestamp);
                default:
                    console.warn("No corresponding country code found.");
                    return "";
            }
        }

        static padTo2Digits(num) {
            return num.toString().padStart(2, "0");
        }

        // 👇️ format as "YYYY-MM-DD hh:mm:ss"
        // You can tweak formatting easily
        static formatDate(date) {
            return ([
                    date.getFullYear(),
                    this.padTo2Digits(date.getMonth() + 1),
                    this.padTo2Digits(date.getDate())
                ].join(".") +
                " " +
                [
                    this.padTo2Digits(date.getHours()),
                    this.padTo2Digits(date.getMinutes()),
                    this.padTo2Digits(date.getSeconds())
                ].join(":"));
        }
    }

    // 谷歌ad-placement开发文档
    /*
    'preroll' before the game loads (before UI has rendered)
    'start' before the gameplay starts (after UI has rendered)
    'pause' the player pauses the game
    'next' player navigates to the next level
    'browse' the player explores options outside of the gameplay
    'reward' a rewarded ad
    */
    const AD_TYPE = {
        preroll: "preroll",
        start: "start",
        pause: "pause",
        next: "next",
        browse: "browse",
        reward: "reward" // The player reaches a point in the game where they can be offered a reward.
    };
    const BREAK_STATUS = {
        notReady: "notReady",
        timeout: "timeout",
        error: "error",
        noAdPreloaded: "noAdPreloaded",
        frequencyCapped: "frequencyCapped",
        ignored: "ignored",
        other: "other",
        dismissed: "dismissed",
        viewed: "viewed"
    };
    let adLoaded = false;
    let adShowTime = 0;
    const adInterval = 5; // 30 * 1000; // 30 seconds
    function setAdShowed() {
        adShowTime = Date.now();
    }

    let _options;

    function setAfgOption(options) {
        console.info("setAfgOption", options);
        _options = options;
    }

    function isAdLoaded() {
        if (getOption(_options, "ignorePreload", false)) {
            // 如果忽略加载状态，则认为已加载
            return true;
        }
        return adLoaded;
    }

    function getNextShowInterval() {
        if (adShowTime <= 0) {
            // 首次播放
            return 0;
        }
        return adShowTime + adInterval - Date.now();
    }

    function isAdReadyToShow() {
        return getNextShowInterval() <= 0;
    }

    function isAdShowed(status) {
        if (status === BREAK_STATUS.viewed || status === BREAK_STATUS.dismissed) {
            return true;
        } else {
            return false;
        }
    }

    function createError(placementInfo) {
        let code = "UNKNOWN_ERROR";
        let message = code;
        if (placementInfo) {
            if (placementInfo.breakStatus) {
                code = placementInfo.breakStatus;
            }
            message = `${placementInfo.breakFormat}:${placementInfo.breakType}:${placementInfo.breakName} error, status: ${placementInfo.breakStatus}`;
        }
        return newError(code, message);
    }

    function newError(code, message) {
        return {
            code: code,
            message: message
        };
    }

    function isAdViewed(status) {
        if (status === BREAK_STATUS.viewed) {
            return true;
        } else {
            return false;
        }
    }

    function isPreroll(type) {
        return type === AD_TYPE.preroll;
    }

    function isRewardedAd(type) {
        return type === AD_TYPE.reward;
    }

    // 检查是否预加载完成
    // 只允许进入一次
    // 仅当ready返回或者异常时才重置标志位
    let _checkingAdsStatus = false;

    function checkAdsStatus() {
        if (_checkingAdsStatus) {
            // already checking
            return;
        }
        _checkingAdsStatus = true;
        console.info("===> checking Ads");
        try {
            adConfig({
                onReady: () => {
                    console.info("===> Ads are ready");
                    adLoaded = true;
                    _checkingAdsStatus = false;
                }
            });
        } catch (e) {
            console.debug("===> Check Ready, got error: ", e);
            console.info("===> Assume Ads ready");
            adLoaded = true;
            _checkingAdsStatus = false;
        }
    }

    // 异步播放广告
    function showAdSenseAsync(type, name, option) {
        option === null || option === void 0 ? void 0 : option.onShow();
        console.info("===> showAdSenseAsync called: ", type, name);
        // 【ID1000534】游戏中心sdk新功能：插屏广告替代激励视频
        // 是否使用插屏替换激励视频
        if (isRewardedAd(type) &&
            getOption(_options, "interstitial_for_rewarded", false)) {
            type = AD_TYPE.next;
            console.debug("===> showAdSenseAsync, replace rewarded with interstitial [next]");
        }
        return new Promise((resolve, reject) => {
            if (!isPreroll(type)) {
                if (!isAdLoaded()) {
                    reject(newError("notLoaded", "ad not loaded"));
                    return;
                }
                if (!isAdReadyToShow()) {
                    reject(newError("notReady", "ad not ready, wait: " +
                        (getNextShowInterval() / 1000).toFixed(2) +
                        " seconds"));
                    return;
                }
            }
            const adBreakOption = {
                type: type,
                name: name,
                adBreakDone: (placementInfo) => {
                    // 5). 广告结束
                    console.info("===> showAdSense:adBreakDone, type: " + type + ", name: " + name, placementInfo);
                    if (isAdShowed(placementInfo.breakStatus)) {
                        setAdShowed();
                        // 关闭adsense回调
                        option === null || option === void 0 ? void 0 : option.onClose();
                        // 正常播放后，都需要检查一下是否有广告
                        adLoaded = false;
                        setTimeout(() => {
                            checkAdsStatus();
                        }, 100);
                    } else {
                        // 广告播放失败
                        option === null || option === void 0 ? void 0 : option.onFail();
                    }
                    if (!isRewardedAd(type)) {
                        // 对于插屏类广告，只要播放了就表示播放成功
                        if (isAdShowed(placementInfo.breakStatus)) {
                            option === null || option === void 0 ? void 0 : option.onSuccess();
                            resolve();
                        } else {
                            // 其他表示错误
                            reject(createError(placementInfo));
                            option === null || option === void 0 ? void 0 : option.onFail();
                        }
                    } else {
                        // 对于激励类广告，只有完全播放完毕才表示播放成功
                        if (isAdViewed(placementInfo.breakStatus)) {
                            resolve();
                        } else {
                            reject(createError(placementInfo));
                        }
                    }
                }
            };
            // 增加其他回调方法
            // 1. preroll 只需要 adBreakDone
            // 2. interstitial/rewarded 增加 beforeAd, afterAd
            // 3. rewarded 增加 beforeReward, adDismissed, adViewed
            if (!isPreroll(type)) {
                adBreakOption.beforeAd = () => {
                    // 1). 广告播放前
                    console.info("===> showAdSense:beforeAd, type: " + type + ", name: " + name);
                };
                adBreakOption.afterAd = () => {
                    // 4). 广告播放后
                    console.info("===> showAdSense:afterAd, type: " + type + ", name: " + name);
                };
            }
            if (isRewardedAd(type)) {
                adBreakOption.beforeReward = (showAdFn) => {
                    // 2). 广告展示前（等待玩家确认播放）
                    console.info("===> showAdSense:beforeReward, type: " + type + ", name: " + name);
                    // 调用广告播放方法
                    showAdFn();
                    option === null || option === void 0 ? void 0 : option.onSuccess();
                };
                adBreakOption.adDismissed = () => {
                    // 3-1). 广告被关闭
                    console.info("===> showAdSense:adDismissed, type: " + type + ", name: " + name);
                    option === null || option === void 0 ? void 0 : option.onFail();
                };
                adBreakOption.adViewed = () => {
                    // 3-2). 广告被完整播放
                    console.info("===> showAdSense:adViewed, type: " + type + ", name: " + name);
                };
            }
            // 尝试展示广告
            console.info("===> showAdSense:tryShow, type: " + type + ", name: " + name);
            adBreak(adBreakOption);
        });
    }

    // 展示开屏广告
    function showPrerollAsync$1(option) {
        return showAdSenseAsync(AD_TYPE.preroll, "preroll", option);
    }

    let isPreAdbreakAgain = false;

    function preAdreak() {
        const type = "reward";
        const name = "reward";
        const adBreakOption = {
            type: type,
            name: name,
            beforeAd: () => {
                console.info("===> showAdSense:beforeAd, type: " + type + ", name: " + name);
            },
            afterAd: () => {
                console.info("===> showAdSense:afterAd, type: " + type + ", name: " + name);
            },
            beforeReward: (showAdFn) => {
                console.info("===> showAdSense:beforeReward, type: " + type + ", name: " + name);
            },
            adDismissed: () => {
                console.info("===> showAdSense:adDismissed, type: " + type + ", name: " + name);
            },
            adViewed: () => {
                console.info("===> showAdSense:adViewed, type: " + type + ", name: " + name);
            },
            adBreakDone: (placementInfo) => {
                console.info("===> showAdSense:adBreakDone, type: " + type + ", name: " + name, placementInfo);
                if (isPreAdbreakAgain) {
                    return;
                }
                if (placementInfo.breakStatus === "notReady") {
                    isPreAdbreakAgain = true;
                    TimeUtil.waitTime(1000, preAdreak);
                }
            }
        };
        adBreak(adBreakOption);
    }

    // function showAdSense(type, name) {
    //     if(!isAdLoaded()){
    //       throw(newError("notLoaded", "ad not loaded"));
    //     }
    //     if(!isAdReadyToShow()){
    //       throw(newError("notReady", "ad not ready, wait: " + (getNextShowInterval()/1000).toFixed(2) + " seconds"));
    //     }
    //     let adBreakConfig = {
    //       type: type,
    //       name: name,
    //       adBreakDone: (placementInfo) => {
    //         // 5). 广告结束
    //         console.info("===> showAdSense:adBreakDone, type: " + type + ", name: " + name, placementInfo);
    //         if(isAdShowed(placementInfo.breakStatus)){
    //           setAdShowed();
    //           // 正常播放后，都需要检查一下是否有广告
    //           adLoaded = false;
    //           setTimeout(() => {
    //             checkAdsStatus();
    //           }, 100);
    //         }
    //         if(!isRewardedAd(type)){
    //           // 对于插屏类广告，只要播放了就表示播放成功
    //           if(isAdShowed(placementInfo.breakStatus)){
    //           }else{
    //             // 其他表示错误
    //             throw(createError(placementInfo));
    //           }
    //         }else{
    //           // 对于插屏类广告，只有完全播放完毕才表示播放成功
    //           if(isAdViewed(placementInfo.breakStatus)){
    //           }else{
    //             throw(createError(placementInfo));
    //           }
    //         }
    //       }
    //     };
    //     // 增加其他回调方法
    //     // 1. preroll 只需要 adBreakDone
    //     // 2. interstitial/rewarded 增加 beforeAd, afterAd
    //     // 3. rewarded 增加 beforeReward, adDismissed, adViewed
    //     if(!isPreroll(type)){
    //       adBreakConfig.beforeAd = () => {
    //         // 1). 广告播放前
    //         console.info("===> showAdSense:beforeAd, type: " + type + ", name: " + name);
    //       };
    //       adBreakConfig.afterAd = () => {
    //         // 4). 广告播放后
    //         console.info("===> showAdSense:afterAd, type: " + type + ", name: " + name);
    //       };
    //     }
    //     if(isRewardedAd(type)){
    //       adBreakConfig.beforeReward = (showAdFn) => {
    //         // 2). 广告展示前（等待玩家确认播放）
    //         console.info("===> showAdSense:beforeReward, type: " + type + ", name: " + name);
    //         // 调用广告播放方法
    //         showAdFn();
    //       };
    //       adBreakConfig.adDismissed = () => {
    //         // 3-1). 广告被关闭
    //         console.info("===> showAdSense:adDismissed, type: " + type + ", name: " + name);
    //       };
    //       adBreakConfig.adViewed = () => {
    //         // 3-2). 广告被完整播放
    //         console.info("===> showAdSense:adViewed, type: " + type + ", name: " + name);
    //       };
    //     }
    //     // 尝试展示广告
    //     adBreak(adBreakConfig);
    // }
    // function showPrerollAsync(name){
    //   return showAdSenseAsync(AD_TYPE.preroll, name);
    // }
    // function showInterstitialAsync(type, name) {
    //   return showAdSenseAsync(type, name);
    // }
    // function showRewardedAsync(name) {
    //   return showAdSenseAsync(AD_TYPE.reward, name);
    // }

    /**
     * @author : Dony
     * @date : 2024-04-30 11:32:53
     * @description : 安卓分享
     */
    class AndroidShare {
        constructor() {
            this._shareResult = null;
        }

        shareAsync(payload) {
            return new Promise((resolve, reject) => {
                var _a, _b;
                if (AdInteractive) {
                    console.info("====> AdInteractive.share : ", payload);
                    AdInteractive.share(payload.image, (_a = payload.media) === null || _a === void 0 ? void 0 : _a.gif.url, (_b = payload.media) === null || _b === void 0 ? void 0 : _b.video.url);
                    this._shareResult = (isSuccess, errMessage) => {
                        console.info(`====> onShareResult isSuccess: ${isSuccess}`);
                        if (isSuccess) {
                            resolve();
                        } else {
                            reject({
                                code: "android share fail",
                                message: errMessage
                            });
                        }
                    };
                } else {
                    console.info("====> android share fail by no AdInteractive");
                    reject({
                        code: "android share fail",
                        message: "android share fail by no AdInteractive"
                    });
                }
            });
        }

        onShareResult(isSuccess, errMessage) {
            if (this._shareResult) {
                this._shareResult(isSuccess, errMessage);
            } else {
                console.error(`onShareResult === isSuccess : ${isSuccess}, errMessage : ${errMessage}`);
            }
        }
    }

    class DefaultShare {
        shareAsync(payload) {
            return Promise.resolve();
        }

        onShareResult(isSuccess, errMessage) {
        }
    }

    /**
     * @author : Dony
     * @date : 2024-04-30 14:59:40
     * @description : Telegram分享
     */
    class TelegramShare {
        onShareResult(isSuccess, errMessage) {
        }

        shareAsync(payload) {
            try {
                if (!minigameGamePage.sharable) {
                    return Promise.reject({
                        code: "TELEGRAM_SHARE_FAIL",
                        message: "Telegram is not sharable"
                    });
                }
                minigameGamePage.sendGame();
                return Promise.resolve();
            } catch (error) {
                return Promise.reject({
                    code: "TELEGRAM_SHARE_FAIL",
                    message: "Telegram share fail"
                });
            }
        }
    }

    /**
     * @author : Dony
     * @date : 2022-08-08 16:40:52
     * @description : 分享
     */
    class ShareHelper {
        constructor() {
            this._shareInstant = null;
        }

        static get instance() {
            if (!this._instance) {
                this._instance = new ShareHelper();
            }
            return this._instance;
        }

        init(isChannelIM) {
            if (isChannelIM) {
                this._shareInstant = new TelegramShare();
                return;
            }
            if (window.AdInteractive) {
                this._shareInstant = new AndroidShare();
                return;
            }
            this._shareInstant = new DefaultShare();
        }

        shareAsync(payload) {
            if (!this._shareInstant) {
                return Promise.reject({
                    code: "SHARE_INSTANT_NULL",
                    message: "shareInstant is null"
                });
            }
            return this._shareInstant.shareAsync(payload);
        }

        onShareResult(isSuccess, errMessage) {
            if (!this._shareInstant) {
                console.error("onShareResult === shareInstant is null");
                return;
            }
            this._shareInstant.onShareResult(isSuccess, errMessage);
        }
    }

    const shareHelper = ShareHelper.instance;
    // @ts-ignore
    window.onShareResult = shareHelper.onShareResult.bind(shareHelper);

    /**
     * @author : Dony
     * @date : 2022-06-21 15:32:32
     * @description :
     */
    class CommonInfo {
        constructor() {
            /** config url */
            this._configUrl = "";
            /** gameId */
            this._gameId = "";
            /** appId */
            this._appId = "";
            /** 渠道 主或子渠道名 */
            this._channel = "";
            /** 渠道名 */
            this._channelName = "";
            /** 渠道配置 */
            this._minigameOption = null;
            /** play页面传过来的数据 */
            this._playPageData = null;
            /** location.search */
            this._locationSearch = "";
            this._locationPathName = "";
            this._hash = "";
            /** 瀑布流配置 */
            this._adConfig = null;
            /** SDK配置 */
            this._sdkConfig = null;
            this.isChannelIM = false;
        }

        get configUrl() {
            return this._configUrl;
        }

        get gameId() {
            return this._gameId;
        }

        get appId() {
            return this._appId;
        }

        get channel() {
            return this._channel;
        }

        get channelName() {
            return this._channelName;
        }

        get minigameOption() {
            return this._minigameOption;
        }

        get playPageData() {
            return this._playPageData;
        }

        set playPageData(data) {
            this._playPageData = data;
        }

        get locationSearch() {
            return this._locationSearch;
        }

        get locationPathName() {
            return this._locationPathName;
        }

        set hash(hash) {
            this._hash = hash;
        }

        get hash() {
            this._hash = window.location.hash;
            return this._hash;
        }

        get adConfig() {
            return this._adConfig;
        }

        set adConfig(config) {
            this._adConfig = config;
        }

        get sdkConfig() {
            return this._sdkConfig;
        }

        set sdkConfig(config) {
            this._sdkConfig = config;
        }

        static get instance() {
            if (!this._instance) {
                this._instance = new CommonInfo();
            }
            return this._instance;
        }

        init(configOption) {
            this._channel = this.getSubChannelName();
            this._channelName = this.getChannelName();
            this._minigameOption = configOption;
            // 求gameId
            this._gameId = `${configOption.game_id}`;
            // 求appId
            this._appId = `${configOption.app_id}`;
            // location search
            this._locationSearch = window.location.search;
            // location path name
            this._locationPathName = window.location.pathname;
            this._hash = window.location.hash;
            this.isChannelIM = typeof window.minigameGamePage !== "undefined";
            // @ts-ignore
            window.commonInfo = CommonInfo;
            shareHelper.init(this.isChannelIM);
        }

        // channelName和subChannelName 从微游中心过来
        getChannelName() {
            return (
                // @ts-ignore
                window.globalPlatformInfo.channelName ||
                // @ts-ignore
                window.channelName ||
                this._playPageData.channelName);
        }

        getSubChannelName() {
            // @ts-ignore
            return (
                // @ts-ignore
                window.globalPlatformInfo.subChannelName ||
                // @ts-ignore
                window.subChannelName ||
                this._playPageData.subChannelName);
        }

        getChannelConfigId() {
            return this._playPageData.channelConfigId || 0;
        }

        getGameManifestJsonUrl() {
            return this._playPageData.gameManifestJsonUrl || "";
        }

        /** 是否是H5 webview android环境 */
        isH5AndroidApp() {
            if (!this._minigameOption) {
                console.warn("minigame config is not exist!!!");
                return false;
            }
            if (!this._minigameOption.android) {
                console.warn("minigame config has not android field!!!");
                return false;
            }
            return !!this._minigameOption.android.enabled;
        }

        /** 是否开启小布的CPL */
        isAdflyEnable() {
            if (!this._minigameOption) {
                console.warn("minigame config is not exist!!!");
                return false;
            }
            if (!this._minigameOption.cpl) {
                console.warn("minigame config has not cpl field!!!");
                return false;
            }
            if (!this._minigameOption.cpl.adflyer) {
                console.warn("cpl config has not adflyer field!!!");
                return false;
            }
            return this._minigameOption.cpl.adflyer.enabled;
        }

        /** 获取小步CPL 渠道ID */
        getAdflyChannelID() {
            if (!this.isAdflyEnable()) {
                return "";
            }
            return this._minigameOption.cpl.adflyer.channelId;
        }

        isSharpMatch() {
            var _a;
            const matchData = (_a = this._minigameOption) === null || _a === void 0 ? void 0 : _a.match;
            return !!(matchData === null || matchData === void 0 ? void 0 : matchData.enabled) && matchData.platform === "adfly";
        }
    }

    CommonInfo._instance = null;
    const commonInfo = CommonInfo.instance;

    let doc = document;

    function loadJsAsync(src, async = false, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const script = doc.createElement("script");
                script.src = src;
                script.async = async;
                if (options) {
                    for (const key in options) {
                        // script[key] = options[key];
                        script.setAttribute(key, options[key]);
                    }
                }
                const onload = () => {
                    script.removeEventListener("load", onload);
                    // 非异步加载的话，需要等待onload返回
                    // if (!async) {
                    //   resolve();
                    // }
                    resolve();
                };
                script.addEventListener("load", onload);
                script.addEventListener("error", (err) => {
                    console.error(err);
                    reject(new Error(`Failed to load ${src}`));
                });
                // document.head.appendChild(script);
                (doc.getElementsByTagName("head")[0] || document.documentElement).appendChild(script);
                // document.currentScript.parentNode.insertBefore(script, document.currentScript); // 有问题： currentScript不存在
                // 异步加载直接返回
                // if (async) {
                //   resolve();
                // }
            });
        });
    }

    // loadJsAsync失败后，会重新请求一次，最多请求三次，请求失败后，隔一秒在请求一次
    function loadJsWithRetryAsync(src, retries = 3) {
        return __awaiter(this, void 0, void 0, function* () {
            if (retries < 3) {
                yield TimeUtil.waitTime(1000);
            }
            return loadJsAsync(src)
                .then(() => {
                    return Promise.resolve();
                })
                .catch((err) => {
                    const retryTimes = 3 - retries + 1;
                    if (retries > 0) {
                        console.error(`load ${src} retry ${retryTimes} times`);
                        return loadJsWithRetryAsync(src, retries - 1);
                    }
                    return Promise.reject({
                        code: "LOADJS_RETRY_FAILED",
                        message: `retry load ${src} ${retryTimes} fail` + err.message
                    });
                });
        });
    }

    /**
     * @author : Dony
     * @date : 2022-02-22 15:48:16
     * @description : 拉取广告策略配置
     */
    var PlatformName;
    (function (PlatformName) {
        // afg
        PlatformName["adsense"] = "adsense";
        // minigame广告
        PlatformName["m150ad"] = "m150ad";
        // android原生广告
        PlatformName["android"] = "android";
    })(PlatformName || (PlatformName = {}));

    class FetchAdsStrategyConfig {
        constructor() {
            /** 广告数据 */
            this._adsDataFile = "";
        }

        static createDefaultInstance() {
            if (!this._instance) {
                this._instance = new FetchAdsStrategyConfig();
            }
            return this._instance;
        }

        static get instance() {
            if (!this._instance) {
                this._instance = new FetchAdsStrategyConfig();
            }
            return this._instance;
        }

        get strategy() {
            return this._adsStrategyOption;
        }

        get adsShowOption() {
            return this._adsShowOption;
        }

        // 加载广告配置
        fetchConfigAsync(configUrl) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const configFile = configUrl;
                    const res = yield fetch(configFile);
                    if (res.status === 404) {
                        throw {
                            code: "No_Config_File",
                            message: "there is no config file " + configFile
                        };
                    }
                    const adConfig = yield res.json();
                    this._adsStrategyOption = adConfig.ad_configs;
                    console.info("fetchAdsStrategyConfig success: ", this._adsStrategyOption);
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject({
                        message: "fetchAdsConfig error: " + error.message
                    });
                }
            });
        }

        fetchAdsData(url) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const isUrlExist = !!(url && url.length > 0);
                    if (!isUrlExist) {
                        console.warn("fetchAdsData error: url is null");
                    }
                    this._adsDataFile = isUrlExist
                        ? url
                        : "https://api.150ad.com/test/data.json";
                    const res = yield fetch(this._adsDataFile);
                    this._adsShowOption = yield res.json();
                    console.info("fetchAdsData success: ", this._adsShowOption);
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject({
                        code: "No_Ads_Data",
                        message: "load ads data file: " + error.message
                    });
                }
            });
        }

        // 拉取广告参数
        fetchShowConfigAsync(configUrl) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    // fetchAdsData 拉取数据成功，直接resolve
                    if (this._adsShowOption) {
                        return Promise.resolve(this._adsShowOption);
                    }
                    // fetchAdsData 拉取数据失败的话，重新拉取，或者是测试环境重新拉取
                    let configFile = this._adsDataFile || "https://api.150ad.com/test/data.json";
                    // 判断是否是测试环境
                    // @ts-ignore
                    if (window.MiniGameAds && window.MiniGameAds.isTest) {
                        configFile = "https://api.150ad.com/test/data.json";
                    }
                    const res = yield fetch(configFile);
                    this._adsShowOption = yield res.json();
                    console.info("fetchAdsShowConfig success: ", this._adsShowOption);
                    return Promise.resolve(this._adsShowOption);
                } catch (error) {
                    console.error("fetchShowConfig error: ", error);
                    throw {
                        code: "Fetch_Ads_Data_Error",
                        message: "data file was " + error.message
                    };
                }
            });
        }

        /** 判断平台SDK是否开启 */
        isPlatformOpen(platform) {
            const platformInfo = this.strategy.platforms.find((item) => item.id === platform);
            if (!platformInfo) {
                return false;
            }
            return platformInfo.enabled;
        }
    }

    FetchAdsStrategyConfig.instance;

    // 服务的接收端
    // 监听请求，并发送响应
    class MediationServer extends MessageDispatcher {
        constructor() {
            super(...arguments);
            this._services = [];
            // // 调用服务
            // invokeServiceAsync(type: string, request: iMediationRequest): Promise<iMediationResponse> {
            //   let service = this._findService(type);
            //   if(!service){
            //     return Promise.reject(ERR_NO_SERVICE_FOUND);
            //   }
            //   return service.onRequest(request);
            // }
        }

        static createDefaultInstance() {
            if (!this._instance) {
                this._instance = new MediationServer(window);
            }
            return this._instance;
        }

        static get instance() {
            if (!this._instance) {
                throw {
                    code: "NO_SERVER_INSTANCE",
                    message: "MediationServer is not initialized"
                };
            }
            return this._instance;
        }

        _findService(type) {
            return this._services.find((service) => service.type === type);
        }

        dispatch(message, source) {
            const request = message;
            // console.error("===> Call Service: ", request);
            const service = this._findService(message.type);
            if (service) {
                service
                    .onRequest(request)
                    .then((resp) => {
                        // console.error("===> Service Response: ", resp);
                        if (!service.isOneWay) {
                            // 发送响应
                            MessageDispatcher.postMessageTo(source, resp, "*");
                        }
                    })
                    .catch((err) => {
                        console.error("===> Service Error: ", err);
                        // 需要将响应返回给客户端
                        const resp = generateErrorResponse(request, err.code, err.message);
                        MessageDispatcher.postMessageTo(source, resp, "*");
                    });
            } else {
                // const resp = generateErrorResponse(
                //   request,
                //   "SERVICE_NOT_FOUND",
                //   `${message.type} not found`
                // );
                console.info("=====> Service Not Found: ", message);
                const resp = generateSuccessResponse(request);
                MessageDispatcher.postMessageTo(source, resp, "*");
            }
        }

        // 注册服务
        registerService(service) {
            // this.addMessageListener(service.type, service.onRequest.bind(service));
            // console.error("===> Register Service : " + service.type + ", oneway: " + service.isOneWay);
            this._services.push(service);
        }

        registerQuickService(type, oneWay = false, requestHandler = QuickMediationService.quickHandler) {
            const service = QuickMediationService.createSimpleService(type, oneWay, requestHandler);
            this.registerService(service);
        }

        // 移除服务
        removeService(service) {
            // this.removeMessageListener(service.type, service.onRequest.bind(service));
            if (this._services.indexOf(service) > -1) {
                this._services = this._services.filter((s) => s !== service);
            }
        }

        removeServiceByType(type) {
            const service = this._findService(type);
            if (service) {
                this.removeService(service);
            }
        }
    }

    // export namespace FBInstant {
    // 错误增加api参数，方便定位哪个接口未实现
    function newUnsupportAPIError(api) {
        return {
            code: API_CODE.CODE.UNSUPPORTED_API,
            message: "unsupport api:" + api
        };
    }

    var FBHelper;
    (function (FBHelper) {
        function emptyWait(fail) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise(function (resolve, reject) {
                    if (!fail) {
                        resolve();
                    } else {
                        reject(new Error("Failed by design"));
                    }
                });
            });
        }

        FBHelper.emptyWait = emptyWait;

        function emptyWaitObject(obj) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise(function (resolve, reject) {
                    resolve(obj);
                });
            });
        }

        FBHelper.emptyWaitObject = emptyWaitObject;

        function emptyWaitBool(boolValue, fail) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise(function (resolve, reject) {
                    resolve(boolValue);
                });
            });
        }

        FBHelper.emptyWaitBool = emptyWaitBool;

        function emptyWaitString(stringValue, fail) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise(function (resolve, reject) {
                    resolve(stringValue);
                });
            });
        }

        FBHelper.emptyWaitString = emptyWaitString;

        function emptyWaitError(error, fail) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise(function (resolve, reject) {
                    reject(error);
                });
            });
        }

        FBHelper.emptyWaitError = emptyWaitError;

        function emptyWaitUnsupportApi(api) {
            return __awaiter(this, void 0, void 0, function* () {
                return emptyWaitError(newUnsupportAPIError(api));
            });
        }

        FBHelper.emptyWaitUnsupportApi = emptyWaitUnsupportApi;

        // 由两部分组成：随机数+当前时间戳
        function generateId() {
            // 将随机数与当前时间戳进行拼接，然后转成36进制字符串
            // return Number(Math.random().toString().substr(3, 11)+Date.now()).toString(36);
            return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        }

        FBHelper.generateId = generateId;
    })(FBHelper || (FBHelper = {}));

    // export namespace FBInstant{
    class Payments {
        getCatalogAsync() {
            return FBHelper.emptyWaitObject([]);
        }

        purchaseAsync(purchaseConfig) {
            return FBHelper.emptyWaitObject(null);
        }

        getPurchasesAsync() {
            return FBHelper.emptyWaitObject([]);
        }

        consumePurchaseAsync(purchaseToken) {
            return FBHelper.emptyWaitObject(null);
        }

        onReady(callBack) {
            callBack();
        }
    }

    const defaultPayments = new Payments();

    /**
     * @description: 枚举出请求数据格式类型
     * @param {type} 枚举类型
     * @return:
     */
    var ContentType;
    (function (ContentType) {
        ContentType["json"] = "application/json";
        ContentType["form"] = "application/x-www-form-urlencoded; charset=UTF-8";
    })(ContentType || (ContentType = {}));
    /**
     * @description: 枚举request请求的method方法
     * @param {type} 枚举类型
     * @return:
     */
    var HttpMethod;
    (function (HttpMethod) {
        HttpMethod["get"] = "GET";
        HttpMethod["post"] = "POST";
    })(HttpMethod || (HttpMethod = {}));

    class HttpRequests {
        constructor() {
            this.handleUrl = (url) => (params) => {
                if (params) {
                    const paramsArray = [];
                    Object.keys(params).forEach((key) => paramsArray.push(key + "=" + encodeURIComponent(params[key])));
                    if (url.search(/\?/) === -1) {
                        // eslint-disable-next-line no-unused-expressions
                        typeof params === "object"
                            ? (url += "?" + paramsArray.join("&"))
                            : url;
                    } else {
                        url += "&" + paramsArray.join("&");
                    }
                }
                return url;
            };
        }

        getFetch(url, params,
                 // eslint-disable-next-line no-undef
                 options) {
            return __awaiter(this, void 0, void 0, function* () {
                options = {
                    method: HttpMethod.get,
                    // credentials: "include",
                    headers: {
                        "Content-Type": ContentType.json
                    }
                    // mode: "no-cors"
                };
                return yield fetch(this.handleUrl(url)(params), options)
                    .then((response) => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            // alert("服务器繁忙，请稍后再试！");
                            return Promise.reject("request failed with status " + response.status);
                        }
                    })
                    .then((response) => {
                        // @ts-ignore
                        return response;
                    })
                    .catch((error) => {
                        return Promise.reject(`get ${url} fail` + error.message);
                    });
            });
        }

        postFetch(url, params) {
            return __awaiter(this, void 0, void 0, function* () {
                const formData = new FormData();
                Object.keys(params).forEach((key) => formData.append(key, params[key]));
                const myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");
                // eslint-disable-next-line no-undef
                const options = {
                    method: HttpMethod.post,
                    headers: myHeaders,
                    body: JSON.stringify(params),
                    redirect: "follow"
                    // mode: "no-cors"
                };
                return yield fetch(url, options)
                    .then((response) => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            // alert("服务器繁忙，请稍后再试；\r\nCode:" + response.status);
                            return Promise.reject({
                                code: response.status,
                                message: `post ${url} fail status: ${response.status}`
                            });
                        }
                    })
                    .then((response) => {
                        return response;
                    })
                    .catch((error) => {
                        // alert("当前网络不可用，请检查网络设置！");
                        return Promise.reject({
                            code: "server error",
                            message: `post ${url} fail` + error.message
                        });
                    });
            });
        }
    }

    const Http = new HttpRequests();

    function postFetch(url, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return Http.postFetch(url, params);
        });
    }

    /*
     * @description: fetch失败后，默认会自动轮询3次，如果还是失败，则抛出错误, 每次轮询间隔1秒
     */
    function postFetchRetry(url, param, retries = 3) {
        return __awaiter(this, void 0, void 0, function* () {
            if (retries < 3) {
                yield TimeUtil.waitTime(1000);
            }
            return postFetch(url, param)
                .then((res) => {
                    return Promise.resolve(res);
                })
                .catch((error) => {
                    if (retries > 0) {
                        console.error(`post ${url} retry ${retries} times`);
                        return postFetchRetry(url, param, retries - 1);
                    }
                    return Promise.reject({
                        code: "fetch retry failed",
                        message: `post ${url} fail` + error
                    });
                });
        });
    }

    function fetchWithXHR(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onload = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    const config = JSON.parse(xhr.responseText);
                    resolve(config);
                } else {
                    reject({
                        message: `fail to get config data from ${url}`
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    message: "fail to get config data from : " + xhr.statusText
                });
            };
            xhr.send();
        });
    }

    // (navigator.userAgent||navigator.vendor||window.opera,'http://detectmobilebrowser.com/mobile');
    // uuid算法
    function uuid(len, radix) {
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
        const uuid = [];
        let i;
        radix = radix || chars.length;
        if (len) {
            // Compact form
            for (i = 0; i < len; i++)
                uuid[i] = chars[0 | (Math.random() * radix)];
        } else {
            // rfc4122, version 4 form
            let r;
            // rfc4122 requires these characters
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
            uuid[14] = "4";
            // Fill in random data.  At i==19 set the high bits of clock sequence as
            // per rfc4122, sec. 4.1.5
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | (Math.random() * 16);
                    uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r];
                }
            }
        }
        return uuid.join("");
    }

    function styleConsole(log, style) {
        console.log(`%c ${log}`, style || "");
    }

    // 加载远程配置文件，失败后会重新请求，知道请求成功，最多请求3次，每次间隔1秒，返回一个promise泛型数据
    function loadRemoteConfig(url, retryCount = 3, retryInterval = 1000) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const options = yield fetchWithXHR(url);
                return Promise.resolve(options);
            } catch (error) {
                if (retryCount > 0) {
                    yield TimeUtil.waitTime(retryInterval);
                    console.info("loadRemoteConfig retry: ", (3 - retryCount + 1));
                    return loadRemoteConfig(url, retryCount - 1, retryInterval);
                }
                return Promise.reject({
                    code: "LOAD_FAILED",
                    message: `load remote config failed: ${url}`
                });
            }
        });
    }

    /**
     * @author : Dony
     * @date : 2022-09-06 11:47:41
     * @description : 安卓支付
     */
    class AndroidPayment {
        constructor() {
            this._payType = "";
            this.getAvailableGoodsResult = null;
            this.queryUnConsumeOrderResult = null;
            this.payResult = null;
            this.consumeOrderResult = null;
            // -------------------------------------------安卓支付回调-----------------------------------------------
        }

        getCatalogAsync() {
            return new Promise((resolve, reject) => {
                const adInteractive = AdInteractive;
                if (!adInteractive) {
                    reject("Android AdInteractive is not exist");
                }
                adInteractive.getAvailableGoods();
                this.getAvailableGoodsResult = (isSuccess, productInfos, errorMessage) => {
                    if (isSuccess) {
                        console.info("====> getAvailableGoodsResult productInfos: ", productInfos);
                        const goodInfos = JSON.parse(productInfos);
                        const products = [];
                        goodInfos.forEach((info) => {
                            const product = {};
                            product.title = info.goodsName;
                            product.description = "";
                            product.imageURI = "";
                            product.price = info.amount;
                            product.priceCurrencyCode = info.currencyCode;
                            product.productID = info.goodsId;
                            products.push(product);
                        });
                        resolve(products);
                    } else {
                        reject({
                            code: "android_getCatelogAsync_error",
                            message: `${errorMessage}`
                        });
                    }
                };
            });
        }

        purchaseAsync(purchaseConfig) {
            return new Promise((resolve, reject) => {
                const adInteractive = AdInteractive;
                if (!adInteractive) {
                    reject("Android AdInteractive is not exist");
                    return;
                }
                // 生成订单
                const order = uuid();
                adInteractive.pay(purchaseConfig.productID, order);
                this.payResult = (isSuccess, orderId, payType, errorMessage) => {
                    if (isSuccess) {
                        const purchase = {};
                        purchase.productID = purchaseConfig.productID;
                        purchase.paymentID = "";
                        purchase.purchaseToken = orderId;
                        purchase.purchaseTime = TimeUtil.getTimestamp().toString();
                        purchase.signedRequest = "";
                        purchase.developerPayload = purchaseConfig.developerPayload;
                        this._payType = payType;
                        resolve(purchase);
                    } else {
                        reject({
                            code: "android_purchaseAsync_error",
                            message: `${errorMessage}`
                        });
                    }
                };
            });
        }

        getPurchasesAsync() {
            return new Promise((resolve, reject) => {
                const adInteractive = AdInteractive;
                if (!adInteractive) {
                    reject("Android AdInteractive is not exist");
                    return;
                }
                adInteractive.queryUnConsumeOrder();
                this.queryUnConsumeOrderResult = (isSuccess, productInfos, errorMessage) => {
                    if (isSuccess) {
                        console.info("====> queryUnConsumeOrderResult productInfos: ", productInfos);
                        const orderInfos = JSON.parse(productInfos);
                        const purchases = [];
                        orderInfos.forEach((orderInfo) => {
                            const purchase = {};
                            purchase.purchaseToken = orderInfo.id;
                            purchase.paymentID = orderInfo.thirdUid;
                            purchase.purchaseTime = TimeUtil.getTimestamp().toString();
                            purchase.productID = orderInfo.productId;
                            purchase.signedRequest = "";
                            purchases.push(purchase);
                        });
                        resolve(purchases);
                    } else {
                        reject({
                            code: "android_getPurchasesAsync_error",
                            message: `${errorMessage}`
                        });
                    }
                };
            });
        }

        consumePurchaseAsync(purchaseToken) {
            return new Promise((resolve, reject) => {
                const adInteractive = AdInteractive;
                if (!adInteractive) {
                    reject("Android AdInteractive is not exist");
                    return;
                }
                adInteractive.consume(purchaseToken, this._payType);
                this.consumeOrderResult = (isSuccess, errorMessage) => {
                    if (isSuccess) {
                        resolve();
                    } else {
                        reject({
                            code: "android_consumePurchaseAsync_error",
                            message: `${errorMessage}`
                        });
                    }
                };
            });
        }

        onReady(callBack) {
            callBack && callBack();
        }

        // -------------------------------------------安卓支付回调-----------------------------------------------
        onGetAvailableGoodsResult(isSuccess, productInfos, errorMessage) {
            console.info(`====> onGetAvailableGoodsResult isSuccess: ${isSuccess}, productInfos: ${productInfos}, errorMessage: ${errorMessage}`);
            if (this.getAvailableGoodsResult) {
                this.getAvailableGoodsResult(isSuccess, productInfos, errorMessage);
            } else {
                console.info("====> getAvailableGoodsResult is not init");
            }
        }

        onQueryUnConsumeOrderResult(isSuccess, productInfos, errorMessage) {
            console.info(`====> onQueryUnConsumeOrderResult isSuccess: ${isSuccess}, productInfos: ${productInfos}, errorMessage: ${errorMessage}`);
            if (this.queryUnConsumeOrderResult) {
                this.queryUnConsumeOrderResult(isSuccess, productInfos, errorMessage);
            } else {
                console.info("====> queryUnConsumeOrderResult is not init");
            }
        }

        onPayResult(isSuccess, orderId, payType, errorMessage) {
            console.info(`====> onPayResult isSuccess: ${isSuccess}, orderId: ${orderId}, errorMessage: ${errorMessage}`);
            if (this.payResult) {
                this.payResult(isSuccess, orderId, payType, errorMessage);
            } else {
                console.info("====> payResult is not init");
            }
        }

        onConsumeOrderResult(isSuccess, errorMessage) {
            console.info(`====> onComsumeOrderResult isSuccess: ${isSuccess}, errorMessage: ${errorMessage}`);
            if (this.consumeOrderResult) {
                this.consumeOrderResult(isSuccess, errorMessage);
            } else {
                console.info("====> onComsumeOrderResult is not init");
            }
        }
    }

    /**
     * @author : Dony
     * @date : 2024-07-16 16:41:28
     * @description : telegram支付
     */
    class TelegramPay {
        getCatalogAsync() {
            if (!minigameGamePage || !minigameGamePage.payments) {
                return Promise.reject({
                    code: "TELEGRAM_PAY_FAIL",
                    message: "minigameGamePage is not available"
                });
            }
            return minigameGamePage.payments.getCatalogAsync();
        }

        purchaseAsync(purchaseConfig) {
            if (!minigameGamePage || !minigameGamePage.payments) {
                return Promise.reject({
                    code: "TELEGRAM_PAY_FAIL",
                    message: "minigameGamePage is not available"
                });
            }
            return minigameGamePage.payments.purchaseAsync(purchaseConfig);
        }

        getPurchasesAsync() {
            if (!minigameGamePage || !minigameGamePage.payments) {
                return Promise.reject({
                    code: "TELEGRAM_PAY_FAIL",
                    message: "minigameGamePage is not available"
                });
            }
            return minigameGamePage.payments.getPurchasesAsync();
        }

        consumePurchaseAsync(purchaseToken) {
            if (!minigameGamePage || !minigameGamePage.payments) {
                return Promise.reject({
                    code: "TELEGRAM_PAY_FAIL",
                    message: "minigameGamePage is not available"
                });
            }
            return minigameGamePage.payments.consumePurchaseAsync(purchaseToken);
        }

        onReady(callBack) {
            if (!minigameGamePage || !minigameGamePage.payments) {
                return;
            }
            return minigameGamePage.payments.onReady(callBack);
        }
    }

    /**
     * @author : Dony
     * @date : 2022-09-07 14:18:55
     * @description : 支付管理器
     */
    class PaymentManager {
        constructor() {
            this._payment = null;
        }

        static get instance() {
            if (!this._instance) {
                this._instance = new PaymentManager();
            }
            return this._instance;
        }

        init() {
            // @ts-ignore
            const adInteractive = window.AdInteractive;
            if (adInteractive) {
                this._payment = new AndroidPayment();
                return;
            }
            const isChannelIM = commonInfo.isChannelIM;
            if (isChannelIM) {
                this._payment = new TelegramPay();
                return;
            }
            this._payment = defaultPayments;
        }

        getCatalogAsync() {
            return this._payment.getCatalogAsync();
        }

        purchaseAsync(purchaseConfig) {
            return this._payment.purchaseAsync(purchaseConfig);
        }

        getPurchasesAsync() {
            return this._payment.getPurchasesAsync();
        }

        consumePurchaseAsync(purchaseToken) {
            return this._payment.consumePurchaseAsync(purchaseToken);
        }

        onReady(callBack) {
            this._payment.onReady(callBack);
        }

        onGetAvailableGoodsResult(isSuccess, productInfos, errorMessage) {
            var _a;
            if (!this._payment)
                return;
            // @ts-ignore
            (_a = this._payment) === null || _a === void 0 ? void 0 : _a.onGetAvailableGoodsResult(isSuccess, productInfos, errorMessage);
        }

        onQueryUnConsumeOrderResult(isSuccess, productInfos, errorMessage) {
            var _a;
            if (!this._payment)
                return;
            // @ts-ignore
            (_a = this._payment) === null || _a === void 0 ? void 0 : _a.onQueryUnConsumeOrderResult(isSuccess, productInfos, errorMessage);
        }

        onPayResult(isSuccess, orderId, payType, errorMessage) {
            var _a;
            if (!this._payment)
                return;
            // @ts-ignore
            (_a = this._payment) === null || _a === void 0 ? void 0 : _a.onPayResult(isSuccess, orderId, payType, errorMessage);
        }

        onConsumeOrderResult(isSuccess, errorMessage) {
            var _a;
            if (!this._payment)
                return;
            // @ts-ignore
            (_a = this._payment) === null || _a === void 0 ? void 0 : _a.onConsumeOrderResult(isSuccess, errorMessage);
        }
    }

    PaymentManager._instance = null;
    const paymentManager = PaymentManager.instance;
    // @ts-ignore
    window.onGetAvailableGoodsResult =
        paymentManager.onGetAvailableGoodsResult.bind(paymentManager);
    // @ts-ignore
    window.onQueryUnConsumeOrderResult =
        paymentManager.onQueryUnConsumeOrderResult.bind(paymentManager);
    // @ts-ignore
    window.onPayResult = paymentManager.onPayResult.bind(paymentManager);
    // @ts-ignore
    window.onConsumeOrderResult =
        paymentManager.onConsumeOrderResult.bind(paymentManager);

    class PayInstantCatalogService extends MediationService {
        static createRequest() {
            return {
                type: PayInstantCatalogService.requestType
            };
        }

        static createService() {
            return new PayInstantCatalogService(PayInstantCatalogService.requestType, false, PayInstantCatalogService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            // return payHelper.query()
            return paymentManager
                .getCatalogAsync()
                .then((products) => {
                    return Promise.resolve(generateSuccessResponse(request, JSON.stringify(products)));
                })
                .catch((err) => {
                    return Promise.reject(generateErrorResponse(request, err.code, err.message));
                });
        }
    }

    PayInstantCatalogService.requestType = "PayInstantCatalogService";

    class PayInstantPurchaseService extends MediationService {
        static createRequest(payload) {
            return {
                type: PayInstantPurchaseService.requestType,
                payload: payload
            };
        }

        static createService() {
            return new PayInstantPurchaseService(PayInstantPurchaseService.requestType, false, PayInstantPurchaseService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            // return payHelper.pay(request.payload.productID)
            return paymentManager
                .purchaseAsync(request.payload)
                .then((purchase) => {
                    return Promise.resolve(generateSuccessResponse(request, purchase));
                })
                .catch((err) => {
                    return Promise.reject(generateErrorResponse(request, err.code, err.message));
                });
        }
    }

    PayInstantPurchaseService.requestType = "PayInstantPurchasesService";

    class PayInstantGetPurchasesService extends MediationService {
        static createRequest() {
            return {
                type: PayInstantGetPurchasesService.requestType
            };
        }

        static createService() {
            return new PayInstantGetPurchasesService(PayInstantGetPurchasesService.requestType, false, PayInstantGetPurchasesService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            // return payHelper.queryUncomsume()
            return paymentManager
                .getPurchasesAsync()
                .then((purchases) => {
                    return Promise.resolve(generateSuccessResponse(request, purchases));
                })
                .catch((err) => {
                    return Promise.reject(generateErrorResponse(request, err.code, err.message));
                });
        }
    }

    PayInstantGetPurchasesService.requestType = "PayInstantGetPurchasesService";

    class PayInstantConsumePurchaseService extends MediationService {
        static createRequest(payload) {
            return {
                type: PayInstantConsumePurchaseService.requestType,
                payload: payload
            };
        }

        static createService() {
            return new PayInstantConsumePurchaseService(PayInstantConsumePurchaseService.requestType, false, PayInstantConsumePurchaseService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            const purchaseToken = request.payload;
            // return payHelper.consume(purchaseToken)
            return paymentManager
                .consumePurchaseAsync(purchaseToken)
                .then(() => {
                    return Promise.resolve(generateSuccessResponse(request));
                })
                .catch((err) => {
                    return Promise.reject(generateErrorResponse(request, err.code, err.message));
                });
        }
    }

    PayInstantConsumePurchaseService.requestType = "PayInstantConsumePurchaseService";

    class PayInstantOnReadyService extends MediationService {
        static createRequest() {
            return {
                type: PayInstantOnReadyService.requestType,
            };
        }

        static createService() {
            return new PayInstantOnReadyService(PayInstantOnReadyService.requestType, false, PayInstantOnReadyService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            // const callBack: string = request.payload;
            // payHelper.onReady(() => {});
            paymentManager.onReady(request.payload);
            return Promise.resolve(generateSuccessResponse(request));
        }
    }

    PayInstantOnReadyService.requestType = "PayInstantOnReadyService";

    /** 广告容器元素 */
    let adsContainer;
    /** 是否预加载，默认是 */
    let isPreload = true;
    let adsManager$1;
    let adsLoader;
    let adDisplayContainer;
    const AdsSize = {
        x: 360,
        y: 640
    };

    /**
     * 设置广告容器元素，使用提供的或者创建一个全屏的
     * @param {HTMLElement} container
     * @returns
     */
    function setupAdsContainer(container) {
        if (container) { // && 判断 element
            return container;
        }
        const adsContainer = document.createElement("div");
        adsContainer.id = "ads-container";
        adsContainer.style.position = "absolute";
        adsContainer.style.top = "0px";
        adsContainer.style.left = "0px";
        adsContainer.style.width = "100%";
        adsContainer.style.height = "100%";
        adsContainer.style.zIndex = "10000"; // 使广告容器元素保持在最顶层
        adsContainer.style.display = "none";
        adsContainer.style.backgroundColor = "#000";
        document.body.appendChild(adsContainer);
        return adsContainer;
    }

    /**
     * 设置广告尺寸
     */
    function setupAdsSize() {
        const w = window;
        const d = document;
        const e = d.documentElement;
        const g = d.getElementsByTagName("body")[0];
        const x = w.innerWidth || e.clientWidth || g.clientWidth;
        const y = w.innerHeight || e.clientHeight || g.clientHeight;
        AdsSize.x = x < 320 ? 320 : x;
        AdsSize.y = y < 320 ? 320 : y;
        logImaAds("setupAdsSize AdsSize:", {width: AdsSize.x, height: AdsSize.y});
    }

    /**
     * 设置监听窗口大小改变事件，重置广告尺寸
     */
    function setupResizeHandler() {
        window.addEventListener("resize", function (event) {
            if (adsManager$1) {
                const width = AdsSize.x;
                const height = AdsSize.y;
                logImaAds("resize AdsSize:", {x: width, y: height});
                adsManager$1.resize(width, height, window.google.ima.ViewMode.NORMAL);
            }
        });
    }

    /**
     * 隐藏广告容器元素，在广告播放完成，或者用户关闭广告之后需调用
     */
    function hideAdsContainer() {
        adsContainer.style.display = "none";
    }

    function logImaAds(message, ...args) {
        console.log("[ima] - " + message, ...args);
    }

    /**
     * 初始化 IMA ，加载广告
     * @param {string} url 广告地址
     */
    function setupIma(url) {
        logImaAds("setupIma", {url});
        // Create the ad display container.
        createAdDisplayContainer();
        // Create ads loader.
        adsLoader = new window.google.ima.AdsLoader(adDisplayContainer);
        // Listen and respond to ads loaded and error events.
        adsLoader.addEventListener(window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, onAdsManagerLoaded, false);
        adsLoader.addEventListener(
            // @ts-ignore
            window.google.ima.AdErrorEvent.Type.AD_ERROR, onAdError, false);
        requestAds(url);
    }

    /**
     * 根据提供的广告地址发起广告请求
     * @param {string} url 广告地址
     */
    function requestAds(url) {
        logImaAds("requestAds", {url});
        // Request video ads.
        const adsRequest = new window.google.ima.AdsRequest();
        adsRequest.adTagUrl = url;
        // Specify the linear and nonlinear slot sizes. This helps the SDK to
        // select the correct creative if multiple are returned.
        adsRequest.linearAdSlotWidth = AdsSize.x;
        adsRequest.linearAdSlotHeight = AdsSize.y;
        adsRequest.nonLinearAdSlotWidth = AdsSize.x;
        adsRequest.nonLinearAdSlotHeight = AdsSize.y;
        adsLoader.requestAds(adsRequest);
    }

    /**
     * Sets the 'adContainer' div as the IMA ad display container.
     */
    function createAdDisplayContainer() {
        // We assume the adContainer is the DOM id of the element that will house
        // the ads.
        adDisplayContainer = new window.google.ima.AdDisplayContainer(adsContainer);
    }

    /**
     * Handles the ad manager loading and sets ad event listeners.
     * @param {!google.ima.AdsManagerLoadedEvent} adsManagerLoadedEvent
     */
    function onAdsManagerLoaded(adsManagerLoadedEvent) {
        const adsRenderingSettings = new window.google.ima.AdsRenderingSettings();
        adsRenderingSettings.enablePreloading = true;
        // Get the ads manager.
        // @ts-ignore
        adsManager$1 = adsManagerLoadedEvent.getAdsManager(adDisplayContainer, adsRenderingSettings);
        // Add listeners to the required events.
        adsManager$1.addEventListener(window.google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
        // 注册广告事件监听
        const events = [
            window.google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
            window.google.ima.AdEvent.Type.COMPLETE,
            // google.ima.AdEvent.Type.FIRST_QUARTILE,
            window.google.ima.AdEvent.Type.LOADED,
            // google.ima.AdEvent.Type.MIDPOINT,
            // google.ima.AdEvent.Type.PAUSED,
            window.google.ima.AdEvent.Type.STARTED,
            // google.ima.AdEvent.Type.THIRD_QUARTILE,
            window.google.ima.AdEvent.Type.USER_CLOSE,
            window.google.ima.AdEvent.Type.SKIPPED,
            window.google.ima.AdEvent.Type.CLICK
        ];
        for (const index in events) {
            adsManager$1.addEventListener(events[index], onAdEvent);
        }
        // 不是预加载的情况下，加载完成自动播放开屏广告
        if (!isPreload) {
            showAds();
        }
    }

    /**
     * Handles ad errors.
     * @param {!google.ima.AdErrorEvent} adErrorEvent
     */
    function onAdError(adErrorEvent) {
        // Handle the error logging.
        logImaAds("onAdError:", adErrorEvent.getError());
        hideAdsContainer();
        if (adsManager$1) {
            try {
                adsManager$1.destroy();
            } catch (error) {
            }
        }
        adsManager$1 = null;
    }

    /**
     * 广告事件处理
     * @param {!google.ima.AdEvent} adEvent
     */
    function onAdEvent(adEvent) {
        const ad = adEvent.getAd();
        logImaAds("onAdEvent:", adEvent.type, {ad, adEvent});
        switch (adEvent.type) {
            case window.google.ima.AdEvent.Type.LOADED:
                // This is the first event sent for an ad
                break;
            case window.google.ima.AdEvent.Type.STARTED:
                break;
            case window.google.ima.AdEvent.Type.ALL_ADS_COMPLETED: // 广告播放完成，或者用户关闭广告，隐藏广告容器元素
            case window.google.ima.AdEvent.Type.COMPLETE:
            case window.google.ima.AdEvent.Type.USER_CLOSE:
            case window.google.ima.AdEvent.Type.SKIPPED:
                hideAdsContainer();
                break;
            case window.google.ima.AdEvent.Type.CLICK:
                break;
        }
    }

    /**
     * 播放广告
     */
    function showAds() {
        // Initialize the container. Must be done through a user action on mobile devices.
        logImaAds("showAds");
        adsContainer.style.display = "block";
        adDisplayContainer.initialize();
        try {
            adsManager$1.init(AdsSize.x, AdsSize.y, window.google.ima.ViewMode.NORMAL);
            adsManager$1.start();
            logImaAds("showAds success");
        } catch (adError) {
            hideAdsContainer();
            logImaAds("showAds error: ", adError);
        }
    }

    /**
     * 加载 IMA SDK 的开屏广告
     * @param {string} adTargetUrl 广告地址，必传
     * @param {HTMLElement} container 广告容器元素，若未提供内部会创建一个
     */
    function loadPreroll(adTargetUrl, container) {
        logImaAds("loadPreroll");
        if (!window.google) {
            console.error("[ima] IMA SDK 加载失败，请检查 //imasdk.googleapis.com/js/sdkloader/ima3.js 是否加载成功");
            return;
        }
        if (!adTargetUrl) {
            console.error("[ima] 加载开屏广告失败，未提供广告地址");
            return;
        }
        adsContainer = setupAdsContainer(container);
        setupAdsSize();
        setupResizeHandler();
        // 初始化 IMA ，加载广告
        setupIma(adTargetUrl);
    }

    /**
     * 预加载情况下调用 IMA SDK 播放开屏广告
     */
    function showPrerollWithPreloadAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            logImaAds("showPrerollWithPreloadAsync");
            isPreload = true;
            showAds();
        });
    }

    /**
     * 通过 IMA SDK 显示开屏广告，加载广告，加载完成后会直接播放广告
     * @param {string} adTargetUrl 广告地址，必传
     * @param {HTMLElement} container 广告容器元素，若未提供内部会创建一个
     */
    function showPrerollAsync(adTargetUrl, container) {
        return __awaiter(this, void 0, void 0, function* () {
            logImaAds("showPrerollAsync", {adTargetUrl, container});
            isPreload = false;
            loadPreroll(adTargetUrl, container);
        });
    }

    // 加载Google IMA SDK
    function initIMA(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sdk = document.querySelector("script[src^='https://imasdk.googleapis.com/js/sdkloader/ima3.js']");
            if (!sdk) {
                loadJsAsync("https://imasdk.googleapis.com/js/sdkloader/ima3.js")
                    .then(() => {
                        console.info("[ima] init ima success");
                        if ((options === null || options === void 0 ? void 0 : options.preload) === "on") { // 预加载开屏广告
                            if (window.google && (options === null || options === void 0 ? void 0 : options.adTargetUrl)) {
                                loadPreroll(options === null || options === void 0 ? void 0 : options.adTargetUrl);
                            } else {
                                console.error("[ima] init ima error without window.google and adTargetUrl: ", {
                                    google: window.google,
                                    options
                                });
                            }
                        }
                    })
                    .catch((e) => {
                        console.error("[ima] init ima error: ", e);
                    });
            }
        });
    }

    // 加载Google Ad Manager
    function initGpt(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sdk = document.querySelector("script[src^='https://securepubads.g.doubleclick.net/tag/js/gpt.js']");
            if (!sdk) {
                loadJsAsync("https://securepubads.g.doubleclick.net/tag/js/gpt.js")
                    .then(() => {
                        // @ts-ignore
                        window.googletag = window.googletag || {cmd: []};
                        console.info("[admanager] init afg success");
                    })
                    .catch((e) => {
                        console.error("[admanager] init afg error: ", e);
                    });
            }
        });
    }

    // 加载adivery js sdk
    function initAdivery(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sdk = document.querySelector("script[src^='https://sdk.minigame.vip/js/adivery.global.js']");
            if (!sdk) {
                loadJsAsync("https://sdk.minigame.vip/js/adivery.global.js")
                    .then(() => {
                        console.info("[adivery] init afg success");
                    })
                    .catch((e) => {
                        console.error("[adivery] init afg error: ", e);
                    });
            }
        });
    }

    // 加载bridge js sdk
    function initBridge(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sdk = document.querySelector("script[src^='https://us-east-web-static.s3.amazonaws.com/sthybrid/dywx-ad-sdk.js']");
            if (!sdk) {
                loadJsAsync("https://us-east-web-static.s3.amazonaws.com/sthybrid/dywx-ad-sdk.js")
                    .then(() => {
                        // @ts-ignore
                        window.dywxBridge = new window.DYWXBridge((options === null || options === void 0 ? void 0 : options.app_id) || "", function () {
                            console.log("[JS]: DYWXBridge is ready!");
                        });
                        console.info("[bridge] init afg success");
                    })
                    .catch((e) => {
                        console.error("[bridge] init afg error: ", e);
                    });
            }
        });
    }

    // 加载playit taboola sdk
    function initPlayitTaboola(options) {
        const sdk = document.querySelector("script[src^='https://cdn.taboola.com/libtrc/flatmedia-network/loader.js']");
        if (!sdk) {
            // @ts-ignore
            window._taboola = window._taboola || [];
            // @ts-ignore
            // eslint-disable-next-line no-undef
            _taboola.push({article: "auto"});
            const fn = function (e, f, u, i) {
                if (!document.getElementById(i)) {
                    e.async = 1;
                    e.src = u;
                    e.id = i;
                    f.parentNode.insertBefore(e, f);
                }
            };
            fn(document.createElement("script"), document.getElementsByTagName("script")[0], "//cdn.taboola.com/libtrc/flatmedia-network/loader.js", "tb_loader_script");
            if (window.performance && typeof window.performance.mark === "function") {
                window.performance.mark("tbl_ic");
            }
        }
    }

    // 加载playit taboola sdk
    function initTaboola(options) {
        const sdk = document.querySelector("script[src^='https://cdn.taboola.com/libtrc/minigame-network/loader.js']");
        if (!sdk) {
            // @ts-ignore
            window._taboola = window._taboola || [];
            // @ts-ignore
            // eslint-disable-next-line no-undef
            _taboola.push({article: "auto"});
            const fn = function (e, f, u, i) {
                if (!document.getElementById(i)) {
                    e.async = 1;
                    e.src = u;
                    e.id = i;
                    f.parentNode.insertBefore(e, f);
                }
            };
            fn(document.createElement("script"), document.getElementsByTagName("script")[0], "//cdn.taboola.com/libtrc/minigame-network/loader.js", "tb_loader_script");
            if (window.performance && typeof window.performance.mark === "function") {
                window.performance.mark("tbl_ic");
            }
        }
    }

    // 加载afg js sdk，并初始化afg广告
    function initAfg(options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            console.info("[minigame] initAfg");
            // 初始化：adBreak() 和 adConfig()
            // @ts-ignore
            window.adsbygoogle = window.adsbygoogle || [];
            // @ts-ignore
            const fn = function (o) {
                // @ts-ignore
                window.adsbygoogle.push(o);
            };
            // @ts-ignore
            window.adBreak = fn;
            // @ts-ignore
            window.adConfig = fn;
            try {
                // 加载afg js sdk
                const url = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
                const attributes = (_a = options === null || options === void 0 ? void 0 : options.afg) === null || _a === void 0 ? void 0 : _a.attributes;
                // remove invalid attributes
                if (attributes && attributes["data-adbreak-test"] !== "on") {
                    delete attributes["data-adbreak-test"];
                }
                const sdk = document.querySelector("script[src^='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js']");
                if (sdk) {
                    if (sdk.getAttribute("data-ad-host") && attributes["data-ad-channel"]) {
                        delete attributes["data-ad-channel"];
                    }
                    if (!sdk.getAttribute("data-ad-host") &&
                        attributes["data-ad-host-channel"]) {
                        delete attributes["data-ad-host-channel"];
                    }
                    for (const key in attributes) {
                        if (!sdk.getAttribute(key) &&
                            attributes[key] &&
                            attributes[key].length > 0) {
                            sdk.setAttribute(key, attributes[key]);
                        }
                    }
                } else {
                    for (const key in attributes) {
                        const atr = attributes[key];
                        if (!atr) {
                            delete attributes[key];
                        }
                    }
                    loadJsAsync(url, true, attributes)
                        .then(() => {
                        })
                        .catch((e) => {
                            console.error("[minigame] init afg error: ", e);
                        });
                }
                // 初始化afg
                const configOption = (_b = options === null || options === void 0 ? void 0 : options.afg) === null || _b === void 0 ? void 0 : _b.config;
                if (configOption) {
                    // 是否强制预加载
                    const adConfigOption = {};
                    if (configOption.preloadAdBreaks) {
                        // @ts-ignore
                        adConfigOption.preloadAdBreaks = configOption.preloadAdBreaks;
                    }
                    // 是否添加onReady回调
                    if (configOption.onReady) {
                        // @ts-ignore
                        adConfigOption.onReady = () => {
                            console.info("afg ==> ready");
                        };
                    }
                    // @ts-ignore
                    window.adConfig(adConfigOption);
                    // 设置afg的行为参数
                    setAfgOption(configOption);
                    // preloadAdBreaks 为 auto时，显示广告前adbreak一次，会报错一次，后面调用adbreak就不会出错
                    if (configOption.preloadAdBreaks === "auto") {
                        yield TimeUtil.waitTime(1000);
                        preAdreak();
                    }
                }
            } catch (error) {
                console.error("init Afg error: ", error.message);
            }
        });
    }

    function getConfigFileUrlFromQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        let configFile = "minigame-config.json"; // 默认配置文件
        let found = false;
        // ID1000380 微游minigame-sdk需要支持指定配置文件
        if (urlParams.has("mn_config")) {
            configFile = urlParams.get("mn_config");
            console.debug("[minigame] config: ", configFile);
            found = true;
        }
        if (!found && urlParams.has("mn_channel")) {
            const channel = urlParams.get("mn_channel");
            console.debug("[minigame] channel: ", channel);
            configFile = channel + "-config.json";
        }
        return configFile;
    }

    function loadMinigameOptionAsync(configUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            // try {
            //   const configFile = configUrl || getConfigFileUrlFromQuery();
            //   const options: iMinigameOption = await fetchWithXHR<iMinigameOption>(configFile);
            //   return Promise.resolve(options);
            // } catch (e) {
            //   console.error("[minigame] load minigame option error: ", e);
            //   return Promise.reject(e);
            // }
            const configFile = configUrl || getConfigFileUrlFromQuery();
            return loadRemoteConfig(configFile);
        });
    }

    // 安卓app环境下需要告诉安卓当前的gameId
    function sendGameIdToAndroid(options) {
        // @ts-ignore
        if (window.AdInteractive && options.game_id) {
            // @ts-ignore
            window.AdInteractive.changeGame(options.game_id);
            console.info("gameId: ", options.game_id);
        }
    }

    // 初始化zalo广告
    function initZaloAd() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // await loadJsWithRetryAsync("https://cdn.choingay.vn/js/vnggames-sdk-v1.2.2-zalopay.js");
                yield loadJsWithRetryAsync("https://cdn.choingay.vn/js/vnggames-sdk-v1.2.2-zalopay-dev.js");
                // @ts-ignore
                const vngGamesSDK = window.VNGGamesSDK;
                yield vngGamesSDK.init();
                vngGamesSDK.configAds({
                    preloadAdBreaks: "on",
                    sound: "on",
                    onReady: () => {
                        console.log("VNGGames config Ads ready!!!");
                    }
                });
            } catch (error) {
                console.error("VNGGames init error: ", error);
            }
        });
    }

    let gaEvent = null;

    function initGaEvent(ga) {
        gaEvent = ga;
    }

    // 增加ga统计
    function logEvent(category, eventName, label, value, nonInteraction) {
        if (gaEvent) {
            gaEvent(category, eventName, label, value, nonInteraction);
        } else {
            console.warn("[minigame] gaEvent is invalid!");
        }
    }

    function logEventAd(adName, adTypeName, actionName, func) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logEvent("", `${adName}_${adTypeName}_${actionName}_start`, "", 0, true);
                yield func();
                logEvent("", `${adName}_${adTypeName}_${actionName}_success`, "", 0, true);
            } catch (error) {
                logEvent("", `${adName}_${adTypeName}_${actionName}_fail`, "", 0, true);
                throw error;
            }
        });
    }

    // 添加时间戳
    function formatUrl(url) {
        if (url.indexOf("st=") === -1) {
            if (url.indexOf("?") === -1) {
                url = `${url}?st=${new Date().getTime()}`;
            } else {
                url = `${url}&st=${new Date().getTime()}`;
            }
        }
        return url;
    }

    // @ts-ignore
    window.gaEvent = gaEvent;

    /**
     * @author : Dony
     * @date : 2022-07-12 17:48:09
     * @description : 异步队列
     */
    class AsyncQueue {
        constructor() {
            // 正在运行的任务
            this._runningAsyncTask = null;
            this._queues = [];
            // 正在执行的异步任务标识
            this._isProcessingTaskUUID = 0;
            this._enable = true;
            /**
             * 任务队列完成回调
             */
            this.complete = null;
        }

        get queues() {
            return this._queues;
        }

        /**
         * 是否开启可用
         */
        get enable() {
            return this._enable;
        }

        /**
         * 是否开启可用
         */
        set enable(val) {
            if (this._enable === val) {
                return;
            }
            this._enable = val;
            if (val && this.size > 0) {
                this.play();
            }
        }

        /**
         * push一个异步任务到队列中
         * 返回任务uuid
         */
        push(callback, params = null) {
            const uuid = AsyncQueue._$uuid_count++;
            this._queues.push({
                uuid: uuid,
                callbacks: [callback],
                params: params
            });
            return uuid;
        }

        /**
         * push多个任务，多个任务函数会同时执行,
         * 返回任务uuid
         */
        pushMulti(params, ...callbacks) {
            const uuid = AsyncQueue._$uuid_count++;
            this._queues.push({
                uuid: uuid,
                callbacks: callbacks,
                params: params
            });
            return uuid;
        }

        /** 移除一个还未执行的异步任务 */
        remove(uuid) {
            var _a;
            if (((_a = this._runningAsyncTask) === null || _a === void 0 ? void 0 : _a.uuid) === uuid) {
                console.warn("A running task cannot be removed");
                return;
            }
            for (let i = 0; i < this._queues.length; i++) {
                if (this._queues[i].uuid === uuid) {
                    this._queues.splice(i, 1);
                    break;
                }
            }
        }

        /**
         * 队列长度
         */
        get size() {
            return this._queues.length;
        }

        /**
         * 是否有正在处理的任务
         */
        get isProcessing() {
            return this._isProcessingTaskUUID > 0;
        }

        /**
         * 队列是否已停止
         */
        get isStop() {
            if (this._queues.length > 0) {
                return false;
            }
            if (this.isProcessing) {
                return false;
            }
            return true;
        }

        /** 正在执行的任务参数 */
        get runningParams() {
            if (this._runningAsyncTask) {
                return this._runningAsyncTask.params;
            }
            return null;
        }

        /**
         * 清空队列
         */
        clear() {
            this._queues = [];
            this._isProcessingTaskUUID = 0;
            this._runningAsyncTask = null;
        }

        next(taskUUID, args = null) {
            if (this._isProcessingTaskUUID === taskUUID) {
                this._isProcessingTaskUUID = 0;
                this._runningAsyncTask = null;
                this.play(args);
            } else {
                if (this._runningAsyncTask) {
                    console.info("====> runningAsyncTask: ", this._runningAsyncTask);
                }
            }
        }

        /**
         * 跳过当前正在执行的任务
         */
        step() {
            if (this.isProcessing) {
                this.next(this._isProcessingTaskUUID);
            }
        }

        /**
         * 开始运行队列
         */
        play(args = null) {
            if (this.isProcessing) {
                return;
            }
            if (!this._enable) {
                return;
            }
            const actionData = this._queues.shift();
            if (actionData) {
                this._runningAsyncTask = actionData;
                const taskUUID = actionData.uuid;
                this._isProcessingTaskUUID = taskUUID;
                const callbacks = actionData.callbacks;
                if (callbacks.length === 1) {
                    const nextFunc = (nextArgs = null) => {
                        this.next(taskUUID, nextArgs);
                    };
                    callbacks[0](nextFunc, actionData.params, args);
                } else {
                    // 多个任务函数同时执行
                    let fnum = callbacks.length;
                    const nextArgsArr = [];
                    const nextFunc = (nextArgs = null) => {
                        --fnum;
                        nextArgsArr.push(nextArgs || null);
                        if (fnum === 0) {
                            this.next(taskUUID, nextArgsArr);
                        }
                    };
                    const knum = fnum;
                    for (let i = 0; i < knum; i++) {
                        callbacks[i](nextFunc, actionData.params, args);
                    }
                }
            } else {
                this._isProcessingTaskUUID = 0;
                this._runningAsyncTask = null;
                // console.log("任务完成")
                if (this.complete) {
                    this.complete(args);
                }
            }
        }

        /**
         * 【比较常用，所以单独提出来封装】往队列中push一个延时任务
         * @param time 毫秒时间
         * @param callback （可选参数）时间到了之后回调
         */
        yieldTime(time, callback = null) {
            const task = function (next, params, args) {
                const _t = setTimeout(() => {
                    clearTimeout(_t);
                    if (callback) {
                        callback();
                    }
                    next(args);
                }, time);
            };
            this.push(task, {des: "AsyncQueue.yieldTime"});
        }

        /**
         * 返回一个执行函数，执行函数调用count次后，next将触发
         * @param count
         * @param next
         * @return 返回一个匿名函数
         */
        static excuteTimes(count, next = null) {
            let fnum = count;
            const tempCall = () => {
                --fnum;
                if (fnum === 0) {
                    next && next();
                }
            };
            return tempCall;
        }
    }

    // 任务task的唯一标识
    AsyncQueue._$uuid_count = 1;

    /**
     * @author : Dony
     * @date : 2022-07-27 15:42:28
     * @description : MinigameAd 基类
     */
    class AdsBase {
        constructor(isReward) {
            this._isReward = false;
            this._adInstants = [];
            this._curAdInstant = null;
            this._refreshTotalShowTimeCallback = null;
            /** 广告是否展示完所有次数 */
            this._isFinish = false;
            this._isReward = isReward;
        }

        get IsFinish() {
            return this._isFinish;
        }

        /** 添加次数总次数刷新回调 */
        set refreshTotalShowTimeCallback(refreshCallback) {
            this._refreshTotalShowTimeCallback = refreshCallback;
        }

        get refreshTotalShowTimeCallback() {
            return this._refreshTotalShowTimeCallback;
        }

        getCurAdName() {
            return "";
        }

        /** Android激励或者插屏的广告回调 */
        onShowAdsResult(isSuccess, errMessage) {
            var _a;
            console.info(`onShowAdsResult: isSuccess: ${isSuccess}, errMessage: ${errMessage}, this._curAdInstant: ${this._curAdInstant}`);
            if (this._curAdInstant) {
                // @ts-ignore
                (_a = this._curAdInstant) === null || _a === void 0 ? void 0 : _a.onShowAdsResult(isSuccess, errMessage);
            }
        }
    }

    var Env;
    (function (Env) {
        Env["DEBUG"] = "debug";
        Env["STAGE"] = "stage";
        Env["PROD"] = "prod";
    })(Env || (Env = {}));

    class SdkConst {
    }

    /** 支付查询订单域名 */
    SdkConst.PAY_IP = "https://purchase2.minigame.vip";
    /** 支付查询订单接口 */
    SdkConst.MINI_ORDER_ID = "v2/purchase/miniorder";
    /** 存储数据 */
    SdkConst.SET_DATA = "v1/archive";
    /** 获取存储数据 */
    SdkConst.GET_DATA = "v1/archive";
    /** 云存储域名 */
    SdkConst.STORAGE_IP = "https://storage.minigame.vip:30443";

    class ErrorCode {
    }

    /** 广告网络不存在 */
    ErrorCode.ADS_NETWORK_NOT_FOUND = "ADS_NETWORK_NOT_FOUND";

    class MDAConst {
    }

    /** 域名 */
    MDAConst.DOMAIN = "https://ingress.minigame.vip:30443";
    /** 测试域名 */
    MDAConst.TESTDOMAIN = "https://mam.minigame.vip:30443";
    /** 接口路径 */
    MDAConst.API_PATH = "/v1/mam/api/mda/random";
    /** 批量随机接口 */
    MDAConst.BATCH_API_PATH = "/v1/mam/api/mda/batch_random";
    var MDAType$1;
    (function (MDAType) {
        MDAType[MDAType["AdTypeEnumNull"] = 0] = "AdTypeEnumNull";
        /** 固定广告 */
        MDAType[MDAType["Display"] = 1] = "Display";
        /** 浮标广告 */
        MDAType[MDAType["Float"] = 2] = "Float";
        /** banner广告 */
        MDAType[MDAType["Banner"] = 3] = "Banner";
        /** 插页广告 */
        MDAType[MDAType["Interstitial"] = 4] = "Interstitial";
        /** 激励广告 */
        MDAType[MDAType["Rewarded"] = 5] = "Rewarded";
    })(MDAType$1 || (MDAType$1 = {}));

    class CPL {
    }

    CPL.ADFLY_REPORT_URL = "https://cpl.minigame.work:19443/v1/event-publish/api/event/publish";
    CPL.ADFLY_REPORT_DOMAIN = "https://ingress.minigame.vip:30443";
    CPL.ADFLY_REPORT_PUBLISH = "v1/event-publish/api/event/publish";

    /**
     * @author : Dony
     * @date : 2022-02-22 11:22:46
     * @description : 广告抽象类
     */
    var AdsType;
    (function (AdsType) {
        /** 开屏 */
        AdsType["PREROLL"] = "preroll";
        /** 插屏广告 */
        AdsType["INTERSTITIAL"] = "interstitial";
        /** 激励广告 */
        AdsType["REWARDED"] = "reward";
        /** banner广告 */
        AdsType["BANNER"] = "banner";
    })(AdsType || (AdsType = {}));

    class AdsStrategy {
        constructor(placementId, isRewarded, type, isOpened) {
            this._adName = ""; // 广告类型名称：adsense、admanager、taboola等
            this._strategyName = "AdsStrategy";
            this._placementId = placementId;
            this._isRewarded = isRewarded;
            this._isOpened = true;
            this._type = this._isRewarded ? AdsType.REWARDED : AdsType.INTERSTITIAL;
            console.info("AdsStrategy constructor placementId: type: strategyName", placementId, this._type, this._strategyName);
        }

        getPlacementID() {
            return this._placementId;
        }

        getType() {
            return this._type;
        }

        setType(type) {
            this._type = type;
        }

        getAdName() {
            return this._adName;
        }

        setAdName(adName) {
            this._adName = adName;
        }

        getRewardedType() {
            return this._isRewarded;
        }

        getAdTypeName() {
            return this._isRewarded ? "rewarded" : "interstitial";
        }

        setRewardedType(isRewarded) {
            this._isRewarded = isRewarded;
        }

        getIsOpened() {
            return this._isOpened;
        }

        setIsOpened(isOpened) {
            this._isOpened = isOpened;
        }

        getStrategyName() {
            return this._strategyName;
        }

        setAdsCallback(adsCallback) {
            this._adsCallback = adsCallback;
        }

        getAdsCallbackOption() {
            return this._adsCallback;
        }
    }

    function waitUntil(condition, timeout, interval) {
        // if not set, wait forever
        if (timeout === undefined) {
            timeout = 0;
        }
        // default interval = 50ms
        if (interval === undefined) {
            interval = 50;
        }
        let waitHandler;
        let timeoutHandler;
        return new Promise(function (resolve, reject) {
            const waitFn = function () {
                if (condition()) {
                    if (timeoutHandler) {
                        clearTimeout(timeoutHandler);
                    }
                    resolve();
                } else {
                    waitHandler = setTimeout(waitFn, interval);
                }
            };
            // 定时检查
            waitHandler = setTimeout(waitFn, interval);
            // 超时判定
            if (timeout > 0) {
                timeoutHandler = setTimeout(() => {
                    if (waitHandler) {
                        clearTimeout(waitHandler);
                    }
                    reject(API_CODE.TIMEOUT);
                }, timeout);
            }
        });
    }

    /**
     * @author : Dony
     * @date : 2022-02-22 14:43:06
     * @description : 谷歌广告策略
     */
    class AfgStrategy extends AdsStrategy {
        constructor() {
            super(...arguments);
            this._strategyName = "AfgStrategy";
        }

        loadAsync() {
            checkAdsStatus();
            return waitUntil(() => {
                return isAdLoaded();
            }, 1000)
                .then(() => {
                    console.info("[AFG] Ads loaded");
                    return Promise.resolve();
                })
                .catch((err) => {
                    console.info("[AFG] Ads load error: ", err);
                    return Promise.reject(err);
                });
        }

        showAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                // 调用服务
                const payload = {
                    isRewardedAd: this.getRewardedType(),
                    placementId: this.getPlacementID(),
                    uid: ""
                };
                const type = payload.isRewardedAd ? AD_TYPE.reward : AD_TYPE.next;
                const name = payload.placementId;
                console.info(`===> show ad: ${type}|${name}`);
                try {
                    yield showAdSenseAsync(type, name, this.getAdsCallbackOption());
                    console.info("[AFG] show ads: success");
                    return Promise.resolve();
                } catch (error) {
                    console.info("[AFG] show ads: error: ", error);
                    return Promise.reject(error);
                }
            });
        }

        isReady() {
            return isAdLoaded();
        }
    }

    /**
     * @author : Dony
     * @date : 2022-09-01 11:01:42
     * @description : MDA广告数据控制器
     */
    var MDAType;
    (function (MDAType) {
        MDAType[MDAType["AdTypeEnumNull"] = 0] = "AdTypeEnumNull";
        MDAType[MDAType["Display"] = 1] = "Display";
        MDAType[MDAType["Float"] = 2] = "Float";
        MDAType[MDAType["Banner"] = 3] = "Banner";
        MDAType[MDAType["Interstitial"] = 4] = "Interstitial";
        MDAType[MDAType["Rewarded"] = 5] = "Rewarded";
    })(MDAType || (MDAType = {}));

    class MDADataHelper {
        constructor() {
            this._mdaRewordInfos = [];
            this._mdaInterstitialInfos = [];
            this._url = `${MDAConst.DOMAIN}${MDAConst.BATCH_API_PATH}`;
        }

        static get instance() {
            if (!this._instance) {
                this._instance = new MDADataHelper();
            }
            return this._instance;
        }

        // 设置本地调用接口域名
        setTest(isTest) {
            if (isTest) {
                this._url = `${MDAConst.TESTDOMAIN}${MDAConst.BATCH_API_PATH}`;
            }
        }

        fetchMdaData(mdaType) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const mdaInfosTarget = mdaType === MDAType.Rewarded ? "_mdaRewordInfos" : "_mdaInterstitialInfos";
                    // MDA个数大于0,直接返回第一个
                    if (this[mdaInfosTarget].length > 0) {
                        const mda = this[mdaInfosTarget].shift();
                        return Promise.resolve(mda);
                    }
                    // MDA个数小于1，直接请求3个数据
                    const reqData = yield postFetch(this._url, {
                        batch: [
                            {
                                adType: mdaType,
                                count: 3
                            }
                        ]
                    });
                    if (reqData.code !== 200) {
                        return Promise.reject({
                            code: "REQUEST_MDA_ERROR",
                            message: reqData.message
                        });
                    }
                    // 返回第一个数据
                    this[mdaInfosTarget] = this[mdaInfosTarget].concat(reqData.data.ads);
                    const mda = this[mdaInfosTarget].shift();
                    return Promise.resolve(mda);
                } catch (error) {
                    return Promise.reject({
                        code: "FETCH_MDS_ERROR",
                        message: error.message
                    });
                }
            });
        }
    }

    MDADataHelper._instance = null;
    const mdaHelper = MDADataHelper.instance;

    // 广告类型
    const adType = {
        interstitial: 1,
        rewardedVideo: 2,
        banner: 3
    };
    // postmessage通信  相关操作类型
    const correspondType = {
        close: "close",
        adLoaded: "finish",
        adLoadError: "loadError",
        click: "click"
    };

    /**
     * 广告iframe对象
     */
    class AdIframe {
        /**
         * 初始化参数
         * @param  {Object} 基础广告参数
         */
        constructor(options, gaId, cbOptions) {
            this.adid = options.id; // 广告ID
            this.adType = options.type; // 广告类型
            this.adTargetUrl = options.target_url; // 广告落地页
            this.adMaterial = options.material_url; // 广告素材
            this.adTemplateUrl = options.template_url; // 模板页面
            this.adShowAttributeUrl = options.show_attribute_url; // 归因链接
            this.playLimitTime = options.impression; // 广告播放的次数上限
            this.iframe = null; // 广告iframe
            this.adTargetObj = null; // 对应类型的广告对象
            this.isInit = false; // 是否初始化完成,如果异常广告，需要重新加载初始化框架
            this.timeStamp = new Date().getTime().toString();
            this.gaId = gaId;
            this.cbOptions = cbOptions;
        }

        getIframe() {
            return this.iframe;
        }

        getGaId() {
            return this.gaId;
        }

        getAdType() {
            return this.adType;
        }

        getAdTargetUrl() {
            return this.adTargetUrl;
        }

        getAdMaterial() {
            return this.adMaterial;
        }

        getAdTemplateUrl() {
            return this.adTemplateUrl;
        }

        getTimeStamp() {
            return this.timeStamp;
        }

        getAdId() {
            return this.adid;
        }

        getInit() {
            return this.isInit;
        }

        getPlayLimitTime() {
            return this.playLimitTime;
        }

        getShowAttributeUrl() {
            return this.adShowAttributeUrl;
        }

        onShow() {
            var _a;
            (_a = this.cbOptions) === null || _a === void 0 ? void 0 : _a.onShow();
        }

        onSuccess() {
            var _a;
            (_a = this.cbOptions) === null || _a === void 0 ? void 0 : _a.onSuccess();
        }

        onFail() {
            var _a;
            (_a = this.cbOptions) === null || _a === void 0 ? void 0 : _a.onFail();
        }

        onClose() {
            var _a;
            (_a = this.cbOptions) === null || _a === void 0 ? void 0 : _a.onClose();
        }

        onClick() {
            var _a;
            (_a = this.cbOptions) === null || _a === void 0 ? void 0 : _a.onClick();
        }

        /**
         * 生成iframe广告框架,初始隐藏框架，等待其他样式添加对应的dom上，调用展示方法  最终才显示
         * @return  {Promise} promise对象,返回成功的参数为iframe对象
         */
        createIframe() {
            return new Promise((resolve, reject) => {
                var _a;
                const iframe = window.document.createElement("iframe");
                iframe.setAttribute("style", "overflow: hidden !important; width: 100vw !important; height: 100vh !important; top:0 !important; right:0 !important; bottom:0 !important; left:0 !important; position: fixed !important; clear: none !important; display: none !important; float: none !important; margin: 0px !important; max-height: none !important; max-width: none !important; opacity: 1 !important; padding: 0px !important; vertical-align: baseline !important; visibility: visible !important; z-index: 1000000000 !important;");
                iframe.setAttribute("src", this.adTemplateUrl);
                iframe.setAttribute("id", "minigameiframe");
                iframe.setAttribute("marginwidth", "0");
                iframe.setAttribute("frameborder", "0");
                iframe.setAttribute("marginheight", "0");
                iframe.setAttribute("scrolling", "no");
                (_a = window.document.querySelector("html")) === null || _a === void 0 ? void 0 : _a.appendChild(iframe);
                iframe.onload = function () {
                    // console.info("iframe loaded");
                    resolve(iframe);
                };
                iframe.onerror = function (e) {
                    console.error("fail to load iframe: ", e);
                    reject(new Error(e.toString()));
                };
            });
        }

        /**
         * 显示固定全屏的iframe
         */
        showIframe() {
            this.iframe.setAttribute("style", "overflow: hidden !important; width: 100vw !important; height: 100vh !important; top:0 !important; right:0 !important; bottom:0 !important; left:0 !important; position: fixed !important; clear: none !important; display: inline !important; float: none !important; margin: 0px !important; max-height: none !important; max-width: none !important; opacity: 1 !important; padding: 0px !important; vertical-align: baseline !important; visibility: visible !important; z-index: 1000000000 !important;");
        }

        /**
         * 移除iframe
         */
        removeIframe() {
            this.isInit && this.iframe.remove();
            this.isInit = false;
        }

        /**
         * 初始化iframe框架
         * @return  {Object} 返回  对应类型的广告对象 adTargetObj
         */
        initAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                // return new Promise(async (resolve, reject) => {
                try {
                    this.iframe = yield this.createIframe();
                    if (this.iframe === null) {
                        console.warn("fail to create iframe");
                        throw {
                            code: "NO_IFRAME",
                            msg: "fail to create iframe"
                        };
                    }
                    switch (this.adType) {
                        case adType.interstitial:
                            this.adTargetObj = new InterstitialAd(this);
                            break;
                        case adType.rewardedVideo:
                            // todo 先用插屏代替
                            this.adTargetObj = new InterstitialAd(this);
                            break;
                        // reject({
                        //   code: "NO_REWARDED_VIDEO",
                        //   msg: "feature is under development",
                        // });
                        // return;
                        case adType.banner:
                            throw {
                                code: "NO_BANNER",
                                msg: "feature is under development"
                            };
                        default:
                            break;
                    }
                    const data = {
                        adTargetUrl: this.adTargetUrl,
                        adMaterial: this.adMaterial,
                        timeStamp: this.timeStamp,
                        adId: this.adid,
                        gaId: this.gaId,
                        showAd: false
                    };
                    this.adTargetObj.loadAd(data, this.iframe);
                    window.removeEventListener("message", this.receiveMessageFromIframePage.bind(this), false);
                    window.addEventListener("message", this.receiveMessageFromIframePage.bind(this), false);
                    this.isInit = true;
                    return this.adTargetObj;
                } catch (error) {
                    console.error("fail to init minigame ads: ", error);
                    throw new Error(error.toString());
                }
            });
        }

        /**
         * 监听子页面消息事件
         * @param  {Object} event事件对象
         */
        receiveMessageFromIframePage(event) {
            if (!event.data)
                return;
            if (!event.data.action)
                return;
            if (this.timeStamp !== event.data.timeStamp)
                return;
            // console.info("receive message from iframe: ", event);
            if (this.isInit) {
                const action = event.data.action;
                switch (action) {
                    case correspondType.close:
                        this.adTargetObj.closeAd();
                        this.onClose();
                        break;
                    case correspondType.adLoaded:
                        this.adTargetObj.ready = true;
                        break;
                    case correspondType.adLoadError:
                        this.adTargetObj.ready = false;
                        break;
                    case correspondType.click:
                        this.onClick();
                        break;
                }
            }
        }
    }

    /**
     * 广告基础对象
     */
    class Ad {
        set ready(value) {
            var _a;
            this.isReady = value;
            (_a = this.adLoadedEvent) === null || _a === void 0 ? void 0 : _a.call(value);
        }

        get ready() {
            return this.isReady;
        }

        /**
         * 关闭广告
         * @param  {Object} AdIframe对象
         */
        constructor(adIframe) {
            this.adCloseEvent = null;
            this.adLoadedEvent = null;
            this.adIframe = adIframe;
        }

        loadAd(data, iframe) {
            var _a;
            this.timeStamp = data.timeStamp;
            (_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(data, "*");
            // return new Promise<void>((resolve, reject) => {
            //   this.timeStamp = data.timeStamp;
            //   console.info("send message to iframe: ", data);
            //   iframe.contentWindow.postMessage(data, "*");
            //   this.adLoadedEvent = {} as AdEvent;
            //   this.adLoadedEvent.call = (isSuccess?: boolean) => {
            //     if (isSuccess) {
            //       resolve();
            //     } else {
            //       reject({
            //         code: "MDA_LOAD_ERROR",
            //         message: "MDA load error"
            //       });
            //     }
            //   };
            // });
        }

        /**
         * 展示广告
         * @return  {Boolean} 是否展示成功，true表示成功
         */
        showAd() {
            return new Promise((resolve, reject) => {
                let isShow = false;
                if (this.adIframe.getInit()) {
                    this.adIframe.showIframe();
                    isShow = true;
                }
                return isShow;
            });
        }

        /**
         * 关闭广告
         * @return  {Boolean}  是否关闭成功，true表示成功
         */
        closeAd() {
            let isClose = false;
            if (this.adIframe.getInit()) {
                this.adIframe.removeIframe();
                isClose = true;
            }
            return isClose;
        }

        getAdId() {
            return this.adIframe.getAdId();
        }

        getPlayLimitTime() {
            return this.adIframe.getPlayLimitTime();
        }
    }

    /**
     * 插屏广告对象
     */
    class InterstitialAd extends Ad {
        constructor(adIframe) {
            super(adIframe);
            this.ready = false; // 是否广告素材资源加载完毕，为true 就可以正常调用广告播放
        }

        // /**
        //  * 加载插屏广告
        //  * @param  {String}  adTargetUrl落地页
        //  * @param  {String}  adMaterial素材
        //  * @param  {Object}  AdIframe对象
        //  */
        // loadAd (data: any, iframe: HTMLIFrameElement) {
        //   this.timeStamp = data.timeStamp;
        //   console.info("send message to iframe: ", data);
        //   iframe.contentWindow.postMessage(data, "*");
        // }
        /**
         * 展示插屏广告
         * @return  {Boolean}  是否展示插屏广告成功，true表示成功
         */
        showAd() {
            return new Promise((resolve, reject) => {
                var _a;
                try {
                    this.adIframe.onShow();
                    this.adCloseEvent = {};
                    this.adCloseEvent.call = () => {
                        resolve();
                    };
                    const data = {
                        adTargetUrl: this.adIframe.getAdTargetUrl(),
                        adShowAttributeUrl: this.adIframe.getShowAttributeUrl(),
                        adMaterial: this.adIframe.getAdMaterial(),
                        timeStamp: this.adIframe.getTimeStamp(),
                        gaId: this.adIframe.getGaId(),
                        adId: this.adIframe.getAdId(),
                        adType: this.adIframe.getAdType(),
                        showAd: true
                    };
                    if (super.showAd() && this.ready) {
                        (_a = this.adIframe.getIframe().contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(data, "*");
                        this.adIframe.onSuccess();
                    } else {
                        this.adLoadedEvent = {};
                        this.adLoadedEvent.call = (isSuccess) => {
                            var _a;
                            if (isSuccess) {
                                (_a = this.adIframe.getIframe().contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(data, "*");
                                this.adIframe.onSuccess();
                            } else {
                                this.adIframe.onFail();
                                reject({
                                    code: "not ready",
                                    msg: "fail to show ad due to not ready"
                                });
                            }
                        };
                    }
                } catch (error) {
                    console.error(error);
                    reject({
                        code: "not ready",
                        msg: "fail to show ad due to not ready:" + error
                    });
                    this.adIframe.onFail();
                }
            });
        }

        /**
         * 关闭插屏广告
         * @return  {Boolean}  是否关闭插屏广告成功，true表示成功
         */
        closeAd() {
            var _a;
            let isClose = false;
            try {
                if (super.closeAd()) {
                    isClose = true;
                    (_a = this.adCloseEvent) === null || _a === void 0 ? void 0 : _a.call();
                }
            } catch (error) {
                console.error(error);
            }
            return isClose;
        }
    }

    // class RewardedVideoAd extends Ad {
    // constructor(adIframe) {
    //   super(adIframe)
    //   this.isReady = false; // 是否广告素材资源加载完毕，为true 就可以正常调用广告播放
    // }
    //   /**
    //    * 加载激励视频广告
    //    */
    //   loadAd() { }
    //   /**
    //    * 展示激励视频广告
    //    */
    //   showAd() { }
    //   /**
    //    * 关闭激励视频广告
    //    */
    //   closeAd() { }
    // }
    // class BannerAd extends Ad {
    //   constructor(adIframe) {
    //   super(adIframe)
    //   this.isReady = false; // 是否广告素材资源加载完毕，为true 就可以正常调用广告播放
    //   }
    //   /**
    //    * 加载banner广告
    //    */
    //   loadAd() { }
    //   /**
    //    * 展示banner广告
    //    */
    //   showAd() { }
    //   /**
    //    * 关闭banner广告
    //    */
    //   closeAd() { }
    // }
    //   export const AdIframeClass = AdIframe;
    function createAdIframe(adShowOption, gaId, cbOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            // return new Promise(async (resolve, reject) => {
            try {
                const adIframe = new AdIframe(adShowOption, gaId, cbOptions);
                const ad = yield adIframe.initAsync();
                return ad;
            } catch (error) {
                throw {
                    code: "load_ad_error",
                    message: "load ad error: " + error.message
                };
            }
            // });
        });
    }

    // @ts-ignore
    window.createAdIframe = createAdIframe;

    /**
     * @author : Dony
     * @date : 2022-08-17 15:22:38
     * @description : MDA策略
     */
    class MdaStrategy extends AdsStrategy {
        constructor() {
            super(...arguments);
            this._curAd = null;
            this._strategyName = "MdaStrategy";
            this._isStartLoad = false;
            this._isLoaded = false;
            this._loadedCallback = null;
        }

        loadAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const relativeMap = {
                        Interstitial: 1,
                        Rewarded: 2
                    };
                    const mdaData = yield mdaHelper.fetchMdaData(this.getRewardedType() ? MDAType.Rewarded : MDAType.Interstitial);
                    const adsShowParam = {};
                    adsShowParam.id = mdaData.id;
                    adsShowParam.type = this.getRewardedType()
                        ? relativeMap.Rewarded
                        : relativeMap.Interstitial;
                    adsShowParam.template_url = mdaData.template_url;
                    adsShowParam.material_url = mdaData.material.url;
                    adsShowParam.target_url = mdaData.target_url;
                    adsShowParam.show_attribute_url = mdaData.show_attribute_url;
                    adsShowParam.support_country = [];
                    adsShowParam.support_language = [];
                    adsShowParam.impression = 0;
                    // this.setEventCallback();
                    // 本地测试代码
                    const adIframe = new AdIframe(adsShowParam, "", this.getAdsCallbackOption());
                    this._isStartLoad = true;
                    this._curAd = yield adIframe.initAsync();
                    this._isLoaded = true;
                    // if (this._loadedCallback) {
                    //   this._loadedCallback(this._isLoaded);
                    // }
                    return Promise.resolve();
                } catch (error) {
                    console.info("====> MDA load error: ", error);
                    return Promise.reject({
                        code: "MDA_LOAD_ERROR",
                        message: error.message
                    });
                }
            });
        }

        /** 广告事件回调 */
        setEventCallback() {
            const adsCallback = {
                onShow: () => {
                    console.log(" =======> MDA show");
                },
                onSuccess: () => {
                    console.log(" =======> MDA success");
                },
                onFail: () => {
                    console.log(" =======> MDA failed");
                },
                onClick: () => {
                    console.log(" =======> MDA clicked");
                },
                onClose: () => {
                    console.log(" =======> MDA closed");
                }
            };
            this.setAdsCallback(adsCallback);
        }

        showAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                // 没有加载成功
                // if (!this._isLoaded && this._isStartLoad) {
                //   return new Promise<void>((resolve, reject) => {
                //     this._loadedCallback = async (isLoaded: boolean) => {
                //       if (isLoaded) {
                //         if (!this._curAd) {
                //           reject({
                //             code: "NO_ADS",
                //             message: "[MDA] no ads"
                //           });
                //           return;
                //         }
                //         await this._curAd.showAd();
                //         console.info("====> MDA show success");
                //         resolve();
                //       } else {
                //         reject({
                //           code: "MDA_SHOW_ERROR",
                //           message: "MDA load fail"
                //         });
                //       }
                //     };
                //   });
                // } else {
                // 加载成功
                try {
                    if (!this._curAd) {
                        return Promise.reject({
                            code: "NO_ADS",
                            message: "[MDA] no ads"
                        });
                    }
                    yield this._curAd.showAd();
                    console.info("====> MDA show success");
                    return Promise.resolve();
                } catch (error) {
                    console.info("====> MDA show error: ", error);
                    return Promise.reject({
                        code: "MDA_SHOW_ERROR",
                        message: error.message
                    });
                }
                // }
            });
        }

        isReady() {
            return this._curAd && this._curAd.ready;
        }
    }

    /**
     * @author : Dony
     * @date : 2022-11-08 11:00:10
     * @description : 伊朗广告
     */
    class AdiveryStrategy extends AdsStrategy {
        constructor() {
            super(...arguments);
            this._curAd = null;
            this._strategyName = "AdiveryStrategy";
        }

        loadAsync() {
            return new Promise((resolve, reject) => {
                const placementId = this.getPlacementID();
                if (this.getRewardedType()) {
                    // 激励
                    // @ts-ignore
                    // eslint-disable-next-line no-undef
                    Adivery.requestRewardedAd(placementId).then((ad) => {
                        console.info("adivery Rewarded loaded");
                        this._curAd = ad;
                        resolve();
                    }, (err) => {
                        console.info("Failed to load adivery rewarded: ", err);
                        reject({
                            code: "ADIVERY_REWARD_LOAD_ERROR",
                            message: err.message
                        });
                    });
                } else {
                    // 插屏
                    // @ts-ignore
                    // eslint-disable-next-line no-undef
                    Adivery.requestInterstitialAd(placementId).then((ad) => {
                        console.log("Interstitial ad loaded");
                        this._curAd = ad;
                        resolve();
                    }, (err) => {
                        console.error("Failed to load interstitial ad", err);
                        reject({
                            code: "ADIVERY_INTERSTITIAL_LOAD_ERROR",
                            message: err.message
                        });
                    });
                }
            });
        }

        showAsync() {
            return new Promise((resolve, reject) => {
                if (!this._curAd) {
                    console.info("adivery instance null");
                    reject({
                        code: "ADIVERY_INSTANCE_NULL",
                        message: "curAd is null"
                    });
                    return;
                }
                if (this.getRewardedType()) {
                    // 激励
                    this._curAd.show().then((isRewarded) => {
                        if (isRewarded) {
                            console.log("Rewarded ad watched completely");
                            resolve();
                        } else {
                            console.log("Rewarded ad closed without reward");
                            reject({
                                code: "dismissed",
                                message: "Rewarded ad closed without reward"
                            });
                        }
                    }, (err) => {
                        console.info("Failed to display rewarded ad", err);
                        reject({
                            code: "ADIVERY_INTERSTITIAL_SHOW_ERROR",
                            message: err.message
                        });
                    });
                } else {
                    // 插屏
                    this._curAd.show().then(() => {
                        console.info("Adivery Interstitial ad displayed");
                        resolve();
                    }, (err) => {
                        console.info("Adivery Failed to display insterstitial ad", err);
                        reject({
                            code: "ADIVERY_INTERSTITIAL_SHOW_ERROR",
                            message: err.message
                        });
                    });
                }
            });
        }

        isReady() {
            return this._curAd !== null;
        }
    }

    /**
     * @author : Dony
     * @date : 2022-05-19 16:02:26
     * @description : 调用Android原生广告
     */
    class AndroidStrategy extends AdsStrategy {
        constructor() {
            super(...arguments);
            this._strategyName = "AndroidStrategy";
            this._showAdsResult = null;
        }

        loadAsync() {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }

        showAsync() {
            return new Promise((resolve, reject) => {
                // @ts-ignore
                if (!window.AdInteractive) {
                    reject("Android AdInteractive not exist");
                    return;
                }
                // @ts-ignore
                if (this.getRewardedType()) {
                    // @ts-ignore
                    const isRewardReady = window.AdInteractive.isRewardedVideoAdReady();
                    console.info("isRewardReady: ", isRewardReady);
                    // @ts-ignore
                    if (isRewardReady) {
                        // @ts-ignore
                        window.AdInteractive.showRewardedVideoAd();
                    } else {
                        console.info("android show Reward ads fail by not ready");
                        reject({
                            code: "android show fail",
                            message: "android show Reward ads fail by not ready"
                        });
                        return;
                    }
                } else {
                    // @ts-ignore
                    if (window.AdInteractive.isInterstitialAdReady()) {
                        // @ts-ignore
                        window.AdInteractive.showInterstitialAd();
                    } else {
                        reject({
                            code: "android show fail",
                            message: "android show Inters ads fail by not ready"
                        });
                        return;
                    }
                }
                this._showAdsResult = (isSuccess) => {
                    if (isSuccess) {
                        resolve();
                    } else {
                        reject({
                            code: "android show fail",
                            message: "android show ads fail"
                        });
                    }
                };
            });
        }

        isReady() {
            return true;
        }

        onShowAdsResult(isSuccess, message) {
            console.info("====> android call back show success: ", isSuccess);
            if (this._showAdsResult) {
                this._showAdsResult(isSuccess, message);
            } else {
                console.info("====> android show ads result error");
            }
        }
    }

    /**
     * @author : Dony&XiongDa
     * @date : 2022-07-13 15:36:00
     * @description : Taboola广告实现
     */
    const util$1 = {
        addCallbackEvent(events) {
            events &&
            events.length > 0 &&
            events.forEach((obj) => {
                obj.ele &&
                obj.ele.addEventListener(obj.eventName, (event) => {
                    obj.eventFunc && obj.eventFunc(event);
                });
            });
        },
        createDailogContainer() {
            let ctxDiv = document.getElementById("minigameDailogContainer");
            if (!ctxDiv) {
                ctxDiv = document.createElement("div");
                ctxDiv.setAttribute("id", "minigameDailogContainer");
                ctxDiv.setAttribute("style", "font-size: 16px;font-family: Microsoft YaHei;font-weight: 400; position: fixed;top:0;  z-index: 20000; overflow: hidden; width: 100vw;height: 100vh; background-color: rgb(0, 0, 0,0.6);");
                document.body.append(ctxDiv);
            }
            return ctxDiv;
        },
        removeDailogContainer(childrenNodeRemoveFunc) {
            const ctxDiv = document.getElementById("minigameDailogContainer");
            if (ctxDiv && ctxDiv.childNodes && ctxDiv.childNodes.length <= 1) {
                ctxDiv && ctxDiv.remove();
            } else {
                childrenNodeRemoveFunc &&
                childrenNodeRemoveFunc instanceof Function &&
                childrenNodeRemoveFunc();
            }
        }
    };

    /**
     * 广告基础对象
     */
    class TaboolaAd {
        /**
         * 初始化构造函数
         * @param  {Object}  taboola广告需要的参数对象
         * 容器元素相关参数：
         * containerObj={
         *      id:"taboola-mobile-below-article-thumbnails"              //容器id
         *      containerStr:"#stretchBtnCtx>#unfoldContent>.gameMenu>div"//需要添加容器的根元素【特殊广告无需添加】
         *      ifInsertBefore:true                                      //根元素下的前面 还是后面【特殊广告无需添加】
         *      propertysObj:{style:"",name:""}                           //容器的属性设置
         * }
         * 广告相关属性：
         * adProperties={
         *      mode: "thumbnails-320x220",
         *      container: "taboola-mobile-below-article-thumbnails",
         *      placement:"Mobile Below Article Thumbnails",
         * }
         * 是否是普通广告ifCommonAd【激励，插屏不是普通广告】
         */
        constructor(param, adsCallback) {
            // 当前容器的元素
            this.currentContainerElement = null;
            // 包含当前容器的父元素
            this.currentContainerParentElement = null;
            // 当前特殊容器的根元素
            this.currentSpecialContainerRootElement = null;
            // 是否是普通广告ifCommonAd,否则为激励或者插屏
            this.ifCommonAd = true;
            // 容器
            this.container = null;
            // 广告属性
            this.adProperties = null;
            // 关闭广告回调
            this.adCloseCallback = null;
            // 广告事件回调
            this.adsCallBack = null;
            this.currentContainerElement = null;
            this.currentContainerParentElement = null;
            this.currentSpecialContainerRootElement = null;
            if (param && param.containerObj) {
                this.container = param.containerObj;
            }
            if (param.adProperties) {
                this.adProperties = param.adProperties;
            } else {
                this.adProperties = {};
            }
            this.ifCommonAd = param.ifCommonAd;
            this.adsCallBack = adsCallback;
            this.loadScript();
        }

        /**
         * 展示广告
         * @param  {Object}  closeProperties 特殊广告需要属性
         * @return  {Promise} 是否展示成功，true表示成功(方便添加回调函数)
         */
        showAd(closeProperties) {
            return __awaiter(this, void 0, void 0, function* () {
                // eslint-disable-next-line no-async-promise-executor
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c;
                    try {
                        (_a = this.adsCallBack) === null || _a === void 0 ? void 0 : _a.onShow();
                        if (this.ifCommonAd) {
                            yield this._addAdToContainer();
                            resolve();
                        } else {
                            yield this._addAdToSpecilContainer(closeProperties);
                        }
                        (_b = this.adsCallBack) === null || _b === void 0 ? void 0 : _b.onSuccess();
                        this.adCloseCallback = {};
                        this.adCloseCallback.call = () => {
                            var _a;
                            if (!this.ifCommonAd) {
                                resolve();
                            }
                            (_a = this.adsCallBack) === null || _a === void 0 ? void 0 : _a.onClose();
                        };
                    } catch (error) {
                        (_c = this.adsCallBack) === null || _c === void 0 ? void 0 : _c.onFail();
                        reject({
                            code: `show taboola ad error`,
                            message: error.message
                        });
                    }
                }));
            });
        }

        /**
         * 关闭广告
         * @return  {Promise}  是否关闭成功，true表示成功(方便添加回调函数)
         */
        closeAd() {
            var _a, _b;
            if (this.ifCommonAd && this.currentContainerElement) {
                (_a = this.adCloseCallback) === null || _a === void 0 ? void 0 : _a.call();
                this.currentContainerElement.remove();
                return Promise.resolve(true);
            } else if (!this.ifCommonAd && this.currentSpecialContainerRootElement) {
                (_b = this.adCloseCallback) === null || _b === void 0 ? void 0 : _b.call();
                this._removeSpecilContainer();
                return Promise.resolve(true);
            }
            return Promise.resolve(false);
        }

        /**
         * 动态加载taboolajs,全局默认只加载一次，不会重复加载
         */
        loadScript() {
            // if (!TaboolaAd.ifLoadScript) {
            //   // @ts-ignore
            //   window._taboola = window._taboola || [];
            //   // @ts-ignore
            //   // eslint-disable-next-line no-undef
            //   _taboola.push({ article: "auto" });
            //   const fn = function (e, f, u, i) {
            //     if (!document.getElementById(i)) {
            //       e.async = 1;
            //       e.src = u;
            //       e.id = i;
            //       f.parentNode.insertBefore(e, f);
            //     }
            //   };
            //   fn(
            //     document.createElement("script"),
            //     document.getElementsByTagName("script")[0],
            //     "//cdn.taboola.com/libtrc/minigame-network/loader.js",
            //     "tb_loader_script"
            //   );
            //   if (window.performance && typeof window.performance.mark === "function") {
            //     window.performance.mark("tbl_ic");
            //   }
            //   TaboolaAd.ifLoadScript = true;
            // }
        }

        /**
         * 私有方法，给html批量设置属性
         * @param  {Object}  propertys 属性对象
         * @param  {Element}  ele HTML对象
         */
        _setAttributesToElememt(propertys, ele) {
            if (propertys && ele) {
                for (const key in propertys) {
                    if (Object.hasOwnProperty.call(propertys, key)) {
                        const value = propertys[key];
                        ele.setAttribute(key, value);
                    }
                }
            }
        }

        /**
         * 私有方法，普通taboola 广告添加容器
         *  @return  {Promise} true/false
         */
        _addAdToContainer() {
            try {
                const adEle = document.createElement("div");
                adEle.setAttribute("id", this.container.id);
                this.currentContainerElement = adEle;
                this._setAttributesToElememt(this.container.propertysObj, adEle);
                const containerEle = document.querySelector(`${this.container.containerStr}`);
                if (containerEle) {
                    this.currentContainerParentElement = containerEle;
                    if (this.container.ifInsertBefore) {
                        let referenceNode = null;
                        if (containerEle.hasChildNodes()) {
                            referenceNode = containerEle.childNodes[0];
                        }
                        containerEle.insertBefore(adEle, referenceNode);
                    } else {
                        containerEle.appendChild(adEle);
                    }
                }
                return Promise.resolve(true).then((m) => {
                    this._setAd();
                    this._displayAd();
                    return m;
                });
            } catch (error) {
                console.error(`show taboola ad is error`, error);
                return Promise.resolve(false);
            }
        }

        /**
         * 私有方法，激励广告、插屏广告容器
         * @param  {Object}  closeProperties 特殊广告需要属性
         * @return  {Promise} true/false
         */
        _addAdToSpecilContainer(closeProperties) {
            // let { closeTime, ifautoClose, closeBackFunc } = closeProperties;
            try {
                const uiELe = `    
        <div style="overflow: hidden;width: 100vw;height: 100vh;background-color: #262626;">
            <div style="display: flex;justify-content: center;border: 1px solid transparent;border-radius: 4px;height: 8vh;background-color: #424242;line-height: 8vh;font-family: Google Sans, Roboto, Arial, sans-serif;font-size: 20px;color: #f5f5f5">
                Ad
                <div style="display: flex;position: absolute;right: 0;flex-direction: row;align-items: center;padding-right: 4%;height: inherit;cursor: pointer;">
                    <div>
                        <div id="closeAd" style="display: ${closeProperties.closeTime < 0 ? "flex" : "none"};align-items: center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                <path style="fill: #f5f5f5"
                                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z">
                                </path>
                                <path fill="none" d="M0 0h24v24H0V0z"></path>
                            </svg>
                        </div>
                        <div id="autoSkidAd" style="display:${closeProperties.closeTime >= 0 ? "block" : "none"}; font-size: 12px">
                        Reward in <span id="autoSkidAdNum">${closeProperties.closeTime}</span> seconds
                        </div>
                    </div>
                </div>
            </div>
            <div id="specilContainerTaboolaAd" style="display: flex;flex-direction: column;justify-content: center;align-items: center;width: 100vw;height: 92vh;">

            </div>
        </div>
        `;
                const dailogDiv = document.createElement("div");
                dailogDiv.setAttribute("style", "position: absolute;z-index:5;width:100%;height:100%");
                dailogDiv.innerHTML = uiELe;
                util$1.createDailogContainer().append(dailogDiv);
                this.currentContainerParentElement = dailogDiv.querySelector("#specilContainerTaboolaAd");
                this.currentSpecialContainerRootElement = dailogDiv;
                const adEle = document.createElement("div");
                adEle.setAttribute("id", this.container.id);
                this.currentContainerElement = adEle;
                this._setAttributesToElememt(this.container.propertysObj, adEle);
                this.currentContainerParentElement.appendChild(adEle);
                const closeAdEle = dailogDiv.querySelector("#closeAd");
                const autoSkidAdEle = dailogDiv.querySelector("#autoSkidAd");
                const autoSkidAdNumEle = dailogDiv.querySelector("#autoSkidAdNum");
                closeAdEle.addEventListener("click", () => {
                    this.closeAd();
                });
                const timeFun = (num) => {
                    // @ts-ignore
                    autoSkidAdNumEle.innerText = num;
                    num--;
                    setTimeout(() => {
                        // @ts-ignore
                        autoSkidAdNumEle.innerText = num;
                        if (num > 0) {
                            timeFun(num);
                        } else {
                            if (closeProperties.ifautoClose) {
                                this.closeAd();
                            } else {
                                // @ts-ignore
                                closeAdEle.style.display = "flex";
                                // @ts-ignore
                                autoSkidAdEle.style.display = "none";
                            }
                        }
                    }, 1000);
                };
                timeFun(closeProperties.closeTime);
                return Promise.resolve(true).then((m) => {
                    this._setAd();
                    this._displayAd();
                    return m;
                });
            } catch (error) {
                console.error(`show taboola ad is error`, error);
                return Promise.resolve(false);
            }
        }

        /**
         * 私有方法，移除激励广告、插屏广告容器
         */
        _removeSpecilContainer() {
            util$1.removeDailogContainer(() => {
                this.currentSpecialContainerRootElement &&
                this.currentSpecialContainerRootElement.remove();
            });
        }

        /**
         * 私有方法，设置taboola 参数
         */
        _setAd() {
            // @ts-ignore
            window._taboola = window._taboola || [];
            // @ts-ignore
            window._taboola.push(Object.assign({target_type: "mix"}, this.adProperties));
        }

        /**
         * 私有方法，展示taboola 广告
         */
        _displayAd() {
            // @ts-ignore
            window._taboola = window._taboola || [];
            // @ts-ignore
            window._taboola.push({flush: true});
        }
    }

    // 设置静态属性，避免多次加载相同js代码
    TaboolaAd.ifLoadScript = false;

    /**
     * 固定广告对象
     */
    class CommonAd extends TaboolaAd {
        /**
         * @param  {Object}  taboola广告需要的参数对象
         * 容器元素相关参数：
         * containerObj={
         *      id:"taboola-mobile-below-article-thumbnails"              //容器id
         *      containerStr:"#stretchBtnCtx>#unfoldContent>.gameMenu>div"//需要添加容器的根元素【特殊广告无需添加】
         *      ifInsertBefore:true                                      //根元素下的前面 还是后面【特殊广告无需添加】
         *      propertysObj:{style:"",name:""}                           //容器的属性设置
         * }
         * 广告相关属性：
         * adProperties={
         *      mode: "thumbnails-320x220",
         *      container: "taboola-mobile-below-article-thumbnails",
         *      placement:"Mobile Below Article Thumbnails",
         * }
         */
        constructor(param) {
            param.ifCommonAd = true;
            super(param);
        }

        /**
         * 展示插屏广告
         * @return  {Promise}  是否展示插屏广告成功，true表示成功
         */
        showAd() {
            return super.showAd();
        }

        /**
         * 关闭插屏广告
         * @return  {Promise}  是否关闭插屏广告成功，true表示成功
         */
        closeAd() {
            return super.closeAd();
        }
    }

    /**
     * 插屏广告对象
     */
    class TaboolaInterstitialAd extends TaboolaAd {
        /**
         * @param  {Object}  taboola广告需要的参数对象
         * 容器元素相关参数：
         * containerObj={
         *      id:"taboola-mobile-below-article-thumbnails"              //容器id
         *      containerStr:"#stretchBtnCtx>#unfoldContent>.gameMenu>div"//需要添加容器的根元素【特殊广告无需添加】
         *      ifInsertBefore:true                                      //根元素下的前面 还是后面【特殊广告无需添加】
         *      propertysObj:{style:"",name:""}                           //容器的属性设置
         * }
         * 广告相关属性：
         * adProperties={
         *      mode: "thumbnails-320x220",
         *      container: "taboola-mobile-below-article-thumbnails",
         *      placement:"Mobile Below Article Thumbnails",
         * }
         * closeTime=5                                                  //定时参数，默认5s
         * ifautoClose=true                                             //是否自动关闭，插屏广告默认true
         * closeBackFunc=() => { }                                      //关闭后回调函数
         */
        // constructor ({ containerObj, adProperties, closeTime = 5, ifautoClose = true, closeBackFunc = () => { } } = { containerObj: {}, adProperties: {}, closeTime: 5, ifautoClose: true, closeBackFunc: () => { } }) {
        constructor(param, adsCallback) {
            param.taboolaParam.ifCommonAd = false;
            param.closeInfo.closeTime = -1; // -1的时，没有定时器
            super(param.taboolaParam, adsCallback);
            this.closeProperties = null;
            this.closeProperties = param.closeInfo;
        }

        /**
         * 展示插屏广告
         * @return  {Promise}  是否展示插屏广告，true表示成功
         */
        showAd() {
            return super.showAd(this.closeProperties);
        }

        /**
         * 关闭插屏广告
         * @return  {Promise}  是否关闭插屏广告，true表示成功
         */
        closeAd() {
            return super.closeAd().then((m) => {
                this.closeProperties.closeBackFunc &&
                this.closeProperties.closeBackFunc instanceof Function &&
                this.closeProperties.closeBackFunc();
                return m;
            });
        }
    }

    class TaboolaRewardedVideoAd extends TaboolaAd {
        /**
         * @param  {Object}  taboola广告需要的参数对象
         * 容器元素相关参数：
         * containerObj={
         *      id:"taboola-mobile-below-article-thumbnails"              //容器id
         *      containerStr:"#stretchBtnCtx>#unfoldContent>.gameMenu>div"//需要添加容器的根元素【特殊广告无需添加】
         *      ifInsertBefore:true                                      //根元素下的前面 还是后面【特殊广告无需添加】
         *      propertysObj:{style:"",name:""}                           //容器的属性设置
         * }
         * 广告相关属性：
         * adProperties={
         *      mode: "thumbnails-320x220",
         *      container: "taboola-mobile-below-article-thumbnails",
         *      placement:"Mobile Below Article Thumbnails",
         * }
         * closeTime=5                                                  //定时参数，默认5s
         * ifautoClose=true                                             //是否自动关闭，激励广告默认false
         * closeBackFunc=() => { }                                      //关闭后回调函数
         */
        // constructor ({ containerObj, adProperties, closeTime = 5, ifautoClose = false, closeBackFunc = () => { } } = { containerObj: {}, adProperties: {}, closeTime: 5, ifautoClose: false, closeBackFunc: () => { } }) {
        constructor(param, adsCallback) {
            param.taboolaParam.ifCommonAd = false;
            super(param.taboolaParam, adsCallback);
            this.closeProperties = null;
            this.closeProperties = param.closeInfo;
        }

        /**
         * 展示激励视频广告
         * @return  {Promise}  是否展示激励视频广告，true表示成功
         */
        showAd() {
            return super.showAd(this.closeProperties);
        }

        /**
         * 关闭激励视频广告
         * @return  {Promise}  是否关闭激励视频广告，true表示成功
         */
        closeAd() {
            return super.closeAd().then((m) => {
                this.closeProperties.closeBackFunc &&
                this.closeProperties.closeBackFunc instanceof Function &&
                this.closeProperties.closeBackFunc();
                return m;
            });
        }
    }

    /**
     * @author : Dony
     * @date : 2022-07-14 14:31:20
     * @description : Taboola广告策略
     */
    class TaboolaStrategy extends AdsStrategy {
        constructor() {
            super(...arguments);
            this._curAd = null;
            this._strategyName = "TaboolaStrategy";
        }

        loadAsync() {
            try {
                // @ts-ignore
                const channelName = window.channelName;
                const adsParam = {
                    taboolaParam: {
                        containerObj: {
                            id: "taboola-mobile-below-article-thumnbnails_interstitial",
                            propertysObj: {
                                style: "width: 340px;height:450px;overflow: hidden;margin: auto;background: white;"
                            }
                        },
                        adProperties: {
                            mode: "thumbnails-a1",
                            container: "taboola-mobile-below-article-thumnbnails_interstitial",
                            placement: `Mobile below article thumnbnails_Interstitial` +
                                (this.getRewardedType()
                                    ? `_${channelName}.rewarded`
                                    : `_${channelName}.interstitial`)
                        },
                        ifCommonAd: false
                    },
                    closeInfo: {
                        closeTime: 5,
                        ifautoClose: false,
                        closeBackFunc: () => {
                        }
                    }
                };
                if (this.getRewardedType()) {
                    adsParam.closeInfo.closeBackFunc = () => {
                        console.info("TaboolaRewardAd close");
                    };
                    this._curAd = new TaboolaRewardedVideoAd(adsParam, this.getAdsCallbackOption());
                } else {
                    adsParam.closeInfo.closeBackFunc = () => {
                        console.info("TaboolaInterstitialAd close");
                    };
                    this._curAd = new TaboolaInterstitialAd(adsParam, this.getAdsCallbackOption());
                }
                return Promise.resolve();
            } catch (error) {
                return Promise.reject({
                    code: `load ${this.getRewardedType()
                        ? "TaboolaRewardedVideoAd"
                        : "TaboolaInterstitialAd"} error`,
                    message: error
                });
            }
        }

        showAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this._curAd.showAd();
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject({
                        code: `show ${this.getRewardedType()
                            ? "TaboolaRewardedVideoAd"
                            : "TaboolaInterstitialAd"} error`,
                        message: error
                    });
                }
            });
        }

        isReady() {
            return true;
        }
    }

    /**
     * @author : linrenxin
     * @date : 2022-11-24 09:49:00
     * @description : Ad Manager
     */
    // import { logEvent } from "../config/config";
    function loadRewardedSlot(adUnitPath) {
        return new Promise((resolve, reject) => {
            console.log("admanager loadRewardedSlot");
            // @ts-ignore
            const googletag = window.googletag || {cmd: []};
            let rewardedSlot = null;
            let rewardedSlotReadyEvent = null;
            googletag.cmd.push(function () {
                rewardedSlot = googletag.defineOutOfPageSlot(adUnitPath || "/22817871455/ca-games-pub-3168355978380813-tag", googletag.enums.OutOfPageFormat.REWARDED);
                if (rewardedSlot) {
                    rewardedSlot.addService(googletag.pubads());
                    const onRewardedSlotReady = function (event) {
                        googletag.pubads().removeEventListener("rewardedSlotReady", onRewardedSlotReady);
                        console.log("admanager rewardedSlotReady", event);
                        rewardedSlotReadyEvent = event;
                        resolve({rewardedSlot, rewardedSlotReadyEvent});
                    };
                    googletag.pubads().addEventListener("rewardedSlotReady", onRewardedSlotReady);
                    // 用 slotResponseReceived 事件来判断是否返回广告
                    const onSlotResponseReceived = function (event) {
                        googletag.pubads().removeEventListener("slotResponseReceived", onSlotResponseReceived);
                        console.log("admanager slotResponseReceived", event);
                        const slot = event.slot;
                        const slotInfo = slot.getResponseInformation();
                        console.log("admanager slotResponseReceived getResponseInformation", slotInfo);
                        if (slot === rewardedSlot && !slotInfo) {
                            reject();
                        }
                    };
                    googletag.pubads().addEventListener("slotResponseReceived", onSlotResponseReceived);
                    googletag.enableServices();
                    googletag.display(rewardedSlot);
                    googletag.cmd.push(() => {
                        googletag.pubads().refresh([rewardedSlot]);
                    });
                }
            });
        });
    }

    function makeRewardedVisible({rewardedSlotReadyEvent}) {
        return new Promise((resolve, reject) => {
            console.log("admanager makeRewardedVisible", {rewardedSlotReadyEvent});
            // @ts-ignore
            const googletag = window.googletag || {cmd: []};
            if (rewardedSlotReadyEvent) {
                let payload;
                googletag.cmd.push(() => {
                    const onRewardedGranted = function (event) {
                        googletag.pubads().removeEventListener("rewardedSlotGranted", onRewardedGranted);
                        console.log("admanager rewardedSlotGranted", event);
                        payload = event.payload;
                        // resolve(payload);
                    };
                    const onRewardedClosed = function (event) {
                        googletag.pubads().removeEventListener("rewardedSlotClosed", onRewardedClosed);
                        console.log("admanager rewardedSlotClosed", event);
                        resolve(payload);
                    };
                    googletag.pubads().addEventListener("rewardedSlotClosed", onRewardedClosed);
                    googletag.pubads().addEventListener("rewardedSlotGranted", onRewardedGranted);
                });
                rewardedSlotReadyEvent.makeRewardedVisible();
            }
        });
    }

    class AdManagerStrategy extends AdsStrategy {
        constructor() {
            super(...arguments);
            this._curAd = null;
            this._strategyName = "AdManagerStrategy";
        }

        loadAsync() {
            return new Promise((resolve, reject) => {
                if (this.getRewardedType()) {
                    console.log("(admanager placementID is:", this.getPlacementID());
                    // logEvent("admanager", "admanager_rewarded_load", "load", 0, true);
                    // @ts-ignore
                    loadRewardedSlot(this.getPlacementID()).then(({rewardedSlot, rewardedSlotReadyEvent}) => {
                        if (rewardedSlotReadyEvent) {
                            // logEvent("admanager","admanager_rewarded_load","success", 0,true);
                            console.info("admanager Rewarded loaded");
                            this._curAd = rewardedSlotReadyEvent;
                            resolve();
                        } else {
                            // logEvent("admanager","admanager_rewarded_load","failed",0,true);
                            console.info("admanager Rewarded not loaded");
                            // resolve();
                            reject({
                                code: "ADMANAGER_REWARDED_LOAD_ERROR",
                                message: "admanager Rewarded not loaded"
                            });
                        }
                    }).catch((err) => {
                        // logEvent("admanager","admanager_rewarded_load","failed",0,true);
                        console.info("admanager Rewarded not loaded, error:", err);
                        // resolve();
                        reject({
                            code: "ADMANAGER_REWARDED_LOAD_ERROR",
                            message: (err === null || err === void 0 ? void 0 : err.message) || "Failed to load admanager Rewarded"
                        });
                    });
                } else {
                    reject({
                        code: "ADMANAGER_INTERSTITIAL_LOAD_ERROR",
                        message: "admanager not support interstitial yet"
                    });
                }
            });
        }

        showAsync() {
            return new Promise((resolve, reject) => {
                // logEvent("admanager", "admanager_rewarded_show", "show_init", 0, false);
                if (!this._curAd) {
                    console.info("admanager instance null");
                    // logEvent("admanager", "admanager_rewarded_show", "ad_null", 0, false);
                    reject({
                        code: "ADMANAGER_INSTANCE_NULL",
                        message: "curAd is null"
                    });
                    return;
                }
                if (this.getRewardedType()) {
                    // logEvent("admanager", "admanager_rewarded_show", "show", 0, false);
                    makeRewardedVisible({rewardedSlotReadyEvent: this._curAd}).then((payload) => {
                        if (payload) {
                            // logEvent("admanager","admanager_rewarded_show","success",0,false);
                            this.getAdsCallbackOption().onSuccess();
                            console.log("admanager Rewarded ad watched completely");
                            resolve();
                        } else {
                            // logEvent("admanager", "admanager_rewarded_show","closed_without_reward",0,false);
                            reject({
                                code: "dismissed",
                                message: "Rewarded ad closed without reward"
                            });
                        }
                    });
                } else {
                    reject({
                        code: "ADMANAGER_INTERSTITIAL_SHOW_ERROR",
                        message: "admanager not support show interstitial yet"
                    });
                }
            });
        }

        isReady() {
            return this._curAd !== null;
        }
    }

    /**
     * @author : wzx
     * @date : 2022-11-23 13:00:10
     * @description : mobiuspace广告
     */
    class BridgeStrategy extends AdsStrategy {
        constructor() {
            super(...arguments);
            this._curAd = false;
            this._strategyName = "BridgeStrategy";
            this._BridgePlacementId = "ads_minigame_splash";
            this._options = {};
        }

        loadAsync() {
            return new Promise((resolve, reject) => {
                // @ts-ignore
                window.dywxBridge.preloadAd(this._BridgePlacementId, this._options,
                    // @ts-ignore
                    new window.DYWXBridge.AdCallback({
                        onAdLoaded: ((result) => {
                            this._curAd = true;
                            console.log("[bridge]: step into onAdLoaded callback, result:", result);
                            resolve();
                        }),
                        onAdFailedToLoad: (function (result) {
                            console.error("[bridge]: step into onAdFailedToLoad, result:", result);
                            reject({
                                code: "BRIDGE_REWARD_LOAD_ERROR",
                                message: result
                            });
                        })
                    }));
            });
        }

        showAsync() {
            return new Promise((resolve, reject) => {
                if (!this._curAd) {
                    console.info("[bridge]: bridge instance is not ready");
                    reject({
                        code: "BRIDGE_INSTANCE_NOT_READY",
                        message: "curAd is fail"
                    });
                    return;
                }
                // @ts-ignore
                window.dywxBridge.showAd(this._BridgePlacementId, this._options,
                    // @ts-ignore
                    new window.DYWXBridge.AdCallback({
                        onAdImpression: (result) => {
                            console.log("[bridge]: step into onAdImpression, result:", result);
                            resolve();
                        },
                        onAdError: (result) => {
                            console.log("[bridge]: step into onAdError, result:", result);
                            reject({
                                code: "dismissed",
                                message: "Rewarded ad closed without reward"
                            });
                        },
                    }));
            });
        }

        isReady() {
            return this._curAd;
        }
    }

    const util = {
        addCallbackEvent(events) {
            events &&
            events.length > 0 &&
            events.forEach((obj) => {
                obj.ele &&
                obj.ele.addEventListener(obj.eventName, (event) => {
                    obj.eventFunc && obj.eventFunc(event);
                });
            });
        },
        createDailogContainer(ifHidden) {
            let ctxDiv = document.getElementById("minigameDailogContainer");
            if (!ctxDiv) {
                ctxDiv = document.createElement("div");
                ctxDiv.setAttribute("id", "minigameDailogContainer");
                ctxDiv.setAttribute("style", `${ifHidden ? "display:none;" : ""}font-size: 16px;font-family: Microsoft YaHei;font-weight: 400; position: fixed;top:0;  z-index: 20000; overflow: hidden; width: 100vw;height: 100vh; background-color: rgb(0, 0, 0,0.6);`);
                document.body.append(ctxDiv);
            }
            return ctxDiv;
        },
        removeDailogContainer(childrenNodeRemoveFunc) {
            const ctxDiv = document.getElementById("minigameDailogContainer");
            if (ctxDiv && ctxDiv.childNodes && ctxDiv.childNodes.length <= 1) {
                ctxDiv && ctxDiv.remove();
            } else {
                childrenNodeRemoveFunc &&
                childrenNodeRemoveFunc instanceof Function &&
                childrenNodeRemoveFunc();
            }
        }
    };

    /**
     * @author : wzx
     * @date : 2023-01-13 10:30:00
     * @description : 用固定广告封装激励视频和插屏广告实现
     */
    /**
     * 广告基础对象
     */
    class SurfaceAd {
        /**
         * 初始化构造函数
         * @param  {Object}  param插屏及激励广告参数
         * @param  {Boolean}  ifContainerOnLoad 广告主体添加选择是load函数添加，还是show的时候添加;
         * @param  {Object}  adsCallback广告回调接口
         */
        constructor(param, ifContainerOnLoad, adsCallback) {
            // 当前使用壳的广告类型名称
            this.adName = "";
            // 当前弹窗根元素
            this.dailogContainerElement = null;
            // 当前容广告容器的元素
            this.currentContainerElement = null;
            // 包含当前容器的父元素
            this.currentContainerParentElement = null;
            // 当前特殊容器的根元素
            this.currentSpecialContainerRootElement = null;
            // 容器
            this.container = null;
            // 关闭广告回调
            this.adCloseCallback = null;
            // 广告事件回调
            this.adsCallBack = null;
            // 关闭广告相关属性设置
            this.closeProperties = null;
            //  true:广告主体添加选择是在load函数调用，false:为show的时候调用,
            this.ifContainerOnLoad = false;
            this.currentContainerElement = null;
            this.currentContainerParentElement = null;
            this.currentSpecialContainerRootElement = null;
            this.ifContainerOnLoad = ifContainerOnLoad;
            if (param) {
                this.closeProperties = param.closeInfo;
                if (param.surfaceParam) {
                    if (param.surfaceParam.containerObj) {
                        this.container = param.surfaceParam.containerObj;
                    }
                    this.adName = param.surfaceParam.adName || "packageSurfaceAd";
                    (param.surfaceParam.loadBeforeHookFunc instanceof Function) && (this.loadBeforeHookFunc = param.surfaceParam.loadBeforeHookFunc);
                    (param.surfaceParam.loadAfterHookFunc instanceof Function) && (this.loadAfterHookFunc = param.surfaceParam.loadAfterHookFunc);
                    (param.surfaceParam.showAfterHookFunc instanceof Function) && (this.showAfterHookFunc = param.surfaceParam.showAfterHookFunc);
                    (param.surfaceParam.showBeforeHookFunc instanceof Function) && (this.showBeforeHookFunc = param.surfaceParam.showBeforeHookFunc);
                }
            }
            this.adsCallBack = adsCallback;
        }

        /**
         * 加载广告
         * @return  {Promise} 是否展示成功，true表示成功(方便添加回调函数)
         */
        loadAd() {
            // eslint-disable-next-line no-async-promise-executor
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                try {
                    (_a = this === null || this === void 0 ? void 0 : this.loadBeforeHookFunc) === null || _a === void 0 ? void 0 : _a.call(this);
                    this.ifContainerOnLoad && (yield this._addAdToSpecilContainer());
                    (_b = this === null || this === void 0 ? void 0 : this.loadAfterHookFunc) === null || _b === void 0 ? void 0 : _b.call(this);
                    resolve();
                } catch (error) {
                    reject({
                        code: `load ${this.adName} ad error`,
                        message: error.message
                    });
                }
            }));
        }

        /**
         * 展示广告
         * @return  {Promise} 是否展示成功，true表示成功(方便添加回调函数)
         */
        showAd() {
            // eslint-disable-next-line no-async-promise-executor
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e;
                try {
                    (_a = this.adsCallBack) === null || _a === void 0 ? void 0 : _a.onShow();
                    !this.ifContainerOnLoad && (yield this._addAdToSpecilContainer());
                    this.timeFunc(this.closeProperties.closeTime);
                    this.dailogContainerElement.style.display = "";
                    this.currentSpecialContainerRootElement.style.display = "";
                    (_b = this === null || this === void 0 ? void 0 : this.showBeforeHookFunc) === null || _b === void 0 ? void 0 : _b.call(this);
                    (_c = this.adsCallBack) === null || _c === void 0 ? void 0 : _c.onSuccess();
                    this.adCloseCallback = {};
                    this.adCloseCallback.call = () => {
                        var _a;
                        resolve();
                        (_a = this.adsCallBack) === null || _a === void 0 ? void 0 : _a.onClose();
                    };
                    (_d = this === null || this === void 0 ? void 0 : this.showAfterHookFunc) === null || _d === void 0 ? void 0 : _d.call(this);
                } catch (error) {
                    (_e = this.adsCallBack) === null || _e === void 0 ? void 0 : _e.onFail();
                    reject({
                        code: `show ${this.adName} ad error`,
                        message: error.message
                    });
                }
            }));
        }

        /**
         * 关闭广告
         * @return  {Promise}  是否关闭成功，true表示成功(方便添加回调函数)
         */
        closeAd() {
            var _a;
            if (this.currentSpecialContainerRootElement) {
                (_a = this.adCloseCallback) === null || _a === void 0 ? void 0 : _a.call();
                this.dailogContainerElement.style.display = "none";
                this._removeSpecilContainer();
                this.closeProperties.closeBackFunc && (this.closeProperties.closeBackFunc instanceof Function) && this.closeProperties.closeBackFunc();
                return Promise.resolve(true);
            }
            return Promise.resolve(false);
        }

        /**
         * 私有方法，给html批量设置属性
         * @param  {Object}  propertys 属性对象
         * @param  {Element}  ele HTML对象
         */
        _setAttributesToElememt(propertys, ele) {
            if (propertys && ele) {
                for (const key in propertys) {
                    if (Object.hasOwnProperty.call(propertys, key)) {
                        const value = propertys[key];
                        ele.setAttribute(key, value);
                    }
                }
            }
        }

        /**
         * 私有方法，激励广告、插屏广告容器
         * @return  {Promise} true/false
         */
        _addAdToSpecilContainer() {
            const closeProperties = this.closeProperties;
            try {
                const uiELe = `    
        <div style="overflow: hidden;width: 100vw;height: 100vh;background-color: #262626;">
            <div style="display: flex;justify-content: center;border: 1px solid transparent;border-radius: 4px;height: 8vh;background-color: #424242;line-height: 8vh;font-family: Google Sans, Roboto, Arial, sans-serif;font-size: 20px;color: #f5f5f5">
                Ad
                <div style="display: flex;position: absolute;right: 0;flex-direction: row;align-items: center;padding-right: 4%;height: inherit;cursor: pointer;">
                    <div>
                        <div id="closeAd" style="display: ${closeProperties.closeTime < 0 ? "flex" : "none"};align-items: center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                <path style="fill: #f5f5f5"
                                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z">
                                </path>
                                <path fill="none" d="M0 0h24v24H0V0z"></path>
                            </svg>
                        </div>
                        <div id="autoSkidAd" style="display:${closeProperties.closeTime >= 0 ? "block" : "none"}; font-size: 12px">
                        Reward in <span id="autoSkidAdNum">${closeProperties.closeTime}</span> seconds
                        </div>
                    </div>
                </div>
            </div>
            <div id="specilContainerSurfaceAd" style="display: flex;flex-direction: column;justify-content: center;align-items: center;width: 100vw;height: 92vh;">

            </div>
        </div>
        `;
                const dailogDiv = document.createElement("div");
                dailogDiv.setAttribute("style", "position: absolute;z-index:5;width:100%;height:100%");
                dailogDiv.innerHTML = uiELe;
                this.currentContainerParentElement = dailogDiv.querySelector("#specilContainerSurfaceAd");
                this.currentSpecialContainerRootElement = dailogDiv;
                const adEle = document.createElement("div");
                adEle.setAttribute("id", this.container.id);
                if (this.container.text) {
                    adEle.innerHTML = this.container.text;
                }
                this.currentContainerElement = adEle;
                this._setAttributesToElememt(this.container.propertysObj, adEle);
                this.currentContainerParentElement.appendChild(adEle);
                const closeAdEle = dailogDiv.querySelector("#closeAd");
                const autoSkidAdEle = dailogDiv.querySelector("#autoSkidAd");
                const autoSkidAdNumEle = dailogDiv.querySelector("#autoSkidAdNum");
                closeAdEle.addEventListener("click", () => {
                    this.closeAd();
                });
                this.timeFunc = (num) => {
                    // @ts-ignore
                    autoSkidAdNumEle.innerText = num;
                    num--;
                    setTimeout(() => {
                        // @ts-ignore
                        autoSkidAdNumEle.innerText = num;
                        if (num > 0) {
                            this.timeFunc(num);
                        } else {
                            if (closeProperties.ifautoClose) {
                                this.closeAd();
                            } else {
                                // @ts-ignore
                                closeAdEle.style.display = "flex";
                                // @ts-ignore
                                autoSkidAdEle.style.display = "none";
                            }
                        }
                    }, 1000);
                };
                this.dailogContainerElement = util.createDailogContainer(true);
                this.currentSpecialContainerRootElement.style.display = "none";
                this.dailogContainerElement.append(dailogDiv);
                return Promise.resolve(true);
            } catch (error) {
                console.error(`add to ${this.adName} specil container is error`, error);
                return Promise.resolve(false);
            }
        }

        /**
         * 私有方法，移除激励广告、插屏广告容器
         */
        _removeSpecilContainer() {
            util.removeDailogContainer(() => {
                this.currentSpecialContainerRootElement && this.currentSpecialContainerRootElement.remove();
            });
        }
    }

    /**
     * 插屏广告对象
     */
    class SurfaceInterstitialAd extends SurfaceAd {
        // eslint-disable-next-line no-useless-constructor
        constructor(param, ifContainerOnLoad, adsCallback) {
            super(param, ifContainerOnLoad, adsCallback);
        }

        loadAd() {
            return super.loadAd();
        }

        /**
         * 展示插屏广告
         */
        showAd() {
            return super.showAd();
        }

        /**
         * 关闭插屏广告
         * @return  {Promise}  是否关闭插屏广告，true表示成功
         */
        closeAd() {
            return super.closeAd().then(m => {
                return m;
            });
        }
    }

    class SurfaceRewardedVideoAd extends SurfaceAd {
        // eslint-disable-next-line no-useless-constructor
        constructor(param, ifContainerOnLoad, adsCallback) {
            super(param, ifContainerOnLoad, adsCallback);
        }

        loadAd() {
            return super.loadAd();
        }

        /**
         * 展示激励视频广告
         */
        showAd() {
            return super.showAd();
        }

        /**
         * 关闭激励视频广告
         * @return  {Promise}  是否关闭激励视频广告，true表示成功
         */
        closeAd() {
            return super.closeAd().then(m => {
                return m;
            });
        }
    }

    /**
     * @author : wzx
     * @date : 2023-01-13 10:30:00
     * @description : 用adx 固定广告封装 激励广告和插屏广告
     */
    class PackageAdmanagerStrategy extends AdsStrategy {
        constructor() {
            super(...arguments);
            this._curAd = null;
            this._strategyName = "PackageAdmanagerStrategy";
            this._curAdName = "";
        }

        loadAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    this._curAdName = this.getRewardedType() ? "PackageAdmanagerRewardAd" : "PackageAdmanagerInterstitialAd";
                    const id = `${this._curAdName}-display-${new Date().getTime()}`;
                    const placementId = this.getPlacementID();
                    let adslot = null;
                    const adsParam = {
                        surfaceParam: {
                            containerObj: {
                                id,
                                propertysObj: {
                                    style: "min-width: 300px; min-height: 60px;margin: auto;"
                                }
                            },
                            adName: "PackageAdmanager",
                            showBeforeHookFunc: () => {
                                // 创建完容器，在页面中显示后才调用 adx广告逻辑代码
                                window.googletag = window.googletag || {cmd: []};
                                window.googletag.cmd.push(function () {
                                    adslot = window.googletag
                                        .defineSlot(placementId, [[300, 250], [320, 480], [336, 280], [300, 600]], id)
                                        .addService(window.googletag.pubads());
                                    window.googletag.enableServices();
                                    window.googletag.display(id);
                                });
                            }
                        },
                        closeInfo: {
                            closeTime: this.getRewardedType() ? 5 : -1,
                            ifautoClose: false,
                            closeBackFunc: () => {
                            }
                        }
                    };
                    adsParam.closeInfo.closeBackFunc = () => {
                        console.info(`${this._curAdName} close`);
                    };
                    if (this.getRewardedType()) {
                        this._curAd = new SurfaceRewardedVideoAd(adsParam, false, this.getAdsCallbackOption());
                    } else {
                        this._curAd = new SurfaceInterstitialAd(adsParam, false, this.getAdsCallbackOption());
                    }
                    ;
                    yield this._curAd.loadAd();
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject({
                        code: `load ${this._curAdName} error`,
                        message: error
                    });
                }
            });
        }

        showAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this._curAd.showAd();
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject({
                        code: `show ${this._curAdName} error`,
                        message: error
                    });
                }
            });
        }

        isReady() {
            return this._curAd != null;
        }
    }

    /**
     * @author : Dony
     * @date : 2023-03-29 11:40:34
     * @description : playit安卓广告, 通过JsBridge来调用安卓接口
     */
    class PlayitStragegy extends AdsStrategy {
        constructor() {
            super(...arguments);
            this._strategyName = "PlayitStragegy";
        }

        loadAsync() {
            if (this.getRewardedType()) {
                // @ts-ignore
                window.WebViewJavascriptBridge.callHandler("prepareReward");
            }
            return Promise.resolve();
        }

        showAsync() {
            return new Promise((resolve, reject) => {
                // @ts-ignore
                const jsBridge = window.WebViewJavascriptBridge;
                this.invokeJavaNextLevel(() => {
                    if (this.getRewardedType()) {
                        jsBridge.callHandler("hasRewardAd", {}, function (data1) {
                            const stateRes = JSON.parse(data1);
                            if (!stateRes.hasAd) {
                                reject({
                                    code: "PLAYIT_REWARD_ERROR",
                                    message: "playit reward is not ready"
                                });
                                return;
                            }
                            jsBridge.callHandler("showReward", {}, function (data2) {
                                const playitRes = JSON.parse(data2);
                                if (playitRes.close) {
                                    if (!playitRes.reward) {
                                        reject({
                                            code: "PLAYIT_REWARD_ERROR",
                                            message: "playit reward show error"
                                        });
                                        return;
                                    }
                                    jsBridge.callHandler("prepareReward");
                                    resolve();
                                }
                            });
                        });
                    } else {
                        jsBridge.callHandler("hasInterstitial", {}, function (data1) {
                            const stateRes = JSON.parse(data1);
                            if (!stateRes.hasAd) {
                                reject({
                                    code: "PLAYIT_INTERST_ERROR",
                                    message: "playit interst is not ready"
                                });
                                return;
                            }
                            jsBridge.callHandler("showInterstitial", {}, function (data2) {
                                const playitRes = JSON.parse(data2);
                                if (!playitRes.suc) {
                                    reject({
                                        code: "PLAYIT_INTERST_ERROR",
                                        message: "playit interst show error"
                                    });
                                    return;
                                }
                                resolve();
                            });
                        });
                    }
                });
            });
        }

        isReady() {
            return true;
        }

        invokeJavaNextLevel(nextLevel) {
            // @ts-ignore
            if (window.WebViewJavascriptBridge) {
                nextLevel && nextLevel();
            } else {
                document.addEventListener("WebViewJavascriptBridgeReady", function () {
                    nextLevel && nextLevel();
                }, false);
            }
        }
    }

    /**
     * @author : Dony
     * @date : 2024-06-14 09:48:29
     * @description : zalo广告策略
     */
    class ZaloStrategy extends AdsStrategy {
        loadAsync() {
            return Promise.resolve();
        }

        showAsync() {
            if (this.getRewardedType()) {
                return this.showRewardedAd();
            }
            return this.showInterstitialAd();
        }

        isReady() {
            return true;
        }

        showInterstitialAd() {
            const type = "next";
            const name = "next";
            return new Promise((resolve, reject) => {
                // @ts-ignore
                const vngGamesSDK = window.VNGGamesSDK;
                vngGamesSDK.showAd({
                    type: type,
                    name: name,
                    beforeAd: () => {
                        console.info("===> showAdSense:beforeAd, type: " + type + ", name: " + name);
                    },
                    afterAd: () => {
                        console.info("===> showAdSense:afterAd, type: " + type + ", name: " + name);
                    },
                    adBreakDone: (placementInfo) => {
                        console.info("===> showAdSense:adBreakDone, type: " + type + ", name: " + name + ", placementInfo: " + placementInfo);
                        if (placementInfo.breakStatus === "viewed") {
                            resolve();
                        } else {
                            reject({
                                code: "SHOW_INTERST_ERROR",
                                message: "AdBreakDone: " + placementInfo.breakStatus
                            });
                        }
                    }
                });
            });
        }

        showRewardedAd() {
            const type = "reward";
            const name = "reward";
            return new Promise((resolve, reject) => {
                // @ts-ignore
                const vngGamesSDK = window.VNGGamesSDK;
                vngGamesSDK.showAd({
                    type: type,
                    name: name,
                    beforeAd: () => {
                        console.info("===> showAdSense:beforeAd, type: " + type + ", name: " + name);
                    },
                    afterAd: () => {
                        console.info("===> showAdSense:afterAd, type: " + type + ", name: " + name);
                    },
                    beforeReward: (showAdFn) => {
                        console.info("===> showAdSense:beforeReward, type: " + type + ", name: " + name);
                        showAdFn();
                    },
                    adDismissed: () => {
                        console.info("===> showAdSense:adDismissed, type: " + type + ", name: " + name);
                    },
                    adViewed: () => {
                        console.info("===> showAdSense:adViewed, type: " + type + ", name: " + name);
                    },
                    adBreakDone: (placementInfo) => {
                        console.info("===> showAdSense:adBreakDone, type: " + type + ", name: " + name + ", placementInfo: " + placementInfo);
                        if (placementInfo.breakStatus === "viewed") {
                            resolve();
                        } else {
                            reject({
                                code: "SHOW_INTERST_ERROR",
                                message: "AdBreakDone: " + placementInfo.breakStatus
                            });
                        }
                    }
                });
            });
        }
    }

    /**
     * @author : Dony
     * @date : 2022-11-08 14:53:26
     * @description : 策略对应关系, key: 对应瀑布流配置中广告网络的adsName字段，
     * value: 对应广告网络类
     * 新广告接入步骤1: 创建广告网络, 继承AdsStrategy, 实现loadAsync和showAsync方法
     * 2: 在strategyConfig中加入新广告网络对应的key（瀑布流策略中的adsName）和value（类名）
     * 实现这两部
     */
    const strategyConfig = {
        mda: MdaStrategy,
        adsense: AfgStrategy,
        taboola: TaboolaStrategy,
        android: AndroidStrategy,
        adivery: AdiveryStrategy,
        admanager: AdManagerStrategy,
        bridge: BridgeStrategy,
        packageAdmanager: PackageAdmanagerStrategy,
        playit: PlayitStragegy,
        zalo: ZaloStrategy
    };

    /**
     * @author : Dony
     * @date : 2022-07-19 17:35:15
     * @description : 瀑布流广告
     */
    class AdsWaterFall extends AdsBase {
        constructor(isReward, adConfig, next) {
            super(isReward);
            /** 配置 */
            this._config = null;
            /** 展示完所有次数后，如果有下一个AdsWaterFall实例，则轮到下一个 实例展示 */
            this._next = null;
            /** 当前成功展示次数 */
            this._curSucTimes = 0;
            /** 当前播放广告的名称 */
            this._curAdName = "";
            this._config = adConfig;
            this._next = next;
        }

        loadAsync(placementID) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    /** 当config.showTimes = -1代表这一轮瀑布流是播放无线次数的 */
                    if (this._curSucTimes < this._config.showTimes ||
                        this._config.showTimes === -1) {
                        // 建立映射关系
                        const ads = strategyConfig;
                        const AdsClass = ads[this._config.adsName];
                        // 广告实例不存在的情况下，直接到下一个瀑布流
                        if (typeof AdsClass === "undefined") {
                            this._isFinish = true;
                            this._next && this._next();
                            console.info(`======> error: ${this._config.adsName} waterfall strategy not found, exec queue next`);
                            return Promise.reject({
                                code: ErrorCode.ADS_NETWORK_NOT_FOUND,
                                message: `${this._config.adsName} waterfall strategy not found`
                            });
                        }
                        const _placementId = this._config.placementId || placementID; // 如果该策略配置中有 placementId 读取配置中的
                        const ad = new AdsClass(_placementId, this._isReward);
                        ad.setAdsCallback({
                            onShow: () => {
                                console.log(`====> ${this._curAdName} show`);
                            },
                            onSuccess: () => {
                                console.log(`====> ${this._curAdName} success`);
                                this._curSucTimes++;
                                if (this._curSucTimes === this._config.showTimes) {
                                    this._isFinish = true;
                                    this._next && this._next();
                                }
                                this._refreshTotalShowTimeCallback &&
                                this._refreshTotalShowTimeCallback();
                            },
                            onFail: () => {
                                console.log(`====> ${this._curAdName} failed`);
                            },
                            onClick: () => {
                                console.log(`====> ${this._curAdName} clicked`);
                            },
                            onClose: () => {
                                console.log(`====> ${this._curAdName} closed`);
                            }
                        });
                        ad.setAdName(this._config.adsName);
                        yield logEventAd(ad.getAdName(), ad.getAdTypeName(), "load", ad.loadAsync.bind(ad));
                        this._adInstants.push(ad);
                        return Promise.resolve();
                    } else {
                        return Promise.reject({
                            code: "load waterFall ad error",
                            message: "has reach showTimes"
                        });
                    }
                } catch (error) {
                    return Promise.reject({
                        code: "load waterFall ad error",
                        message: error.message
                    });
                }
            });
        }

        showAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    if (this._adInstants.length <= 0) {
                        return Promise.reject({
                            code: "show adInstant error",
                            message: "there is no ad instant"
                        });
                    }
                    if (this._curSucTimes < this._config.showTimes ||
                        this._config.showTimes === -1) {
                        const ad = this._adInstants.shift();
                        this._curAdName = ad.getStrategyName();
                        this._curAdInstant = ad;
                        yield logEventAd(ad.getAdName(), ad.getAdTypeName(), "show", ad.showAsync.bind(ad));
                        // this._curSucTimes++;
                        // if (this._curSucTimes === this._config.showTimes) {
                        //   this._isFinish = true;
                        //   this._next && this._next();
                        // }
                        return Promise.resolve();
                    }
                } catch (error) {
                    return Promise.reject(error);
                }
            });
        }

        getCurAdName() {
            this._curAdName = this._adInstants[0].getStrategyName();
            return this._curAdName;
        }

        /** 加载时间间隔 */
        getLoadTimeInterval() {
            let timeInterval = 0;
            if (!this._config) {
                timeInterval = 0;
                console.info("adsWaterFall's config null");
            }
            timeInterval = this._config.timeInterval ? this._config.timeInterval : 0;
            return timeInterval;
        }
    }

    /**
     * @author : Dony
     * @date : 2022-07-20 10:47:21
     * @description : 保底广告列表
     */
    class AdsKeepBottom extends AdsBase {
        constructor(isReward, ads) {
            super(isReward);
            this.adsNames = [];
            this.curAdName = "";
            this.adsNames = this.adsNames.concat(ads);
        }

        loadAsync(placementID) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    // 建立映射关系
                    const ads = strategyConfig;
                    const random = Math.floor(Math.random() * this.adsNames.length);
                    const randomName = this.adsNames[random];
                    const AdsClass = ads[randomName];
                    const adsCallBack = {
                        onShow: () => {
                            console.log(`====> ${this.curAdName} show`);
                        },
                        onSuccess: () => {
                            console.log(`====> ${this.curAdName} success`);
                            this._refreshTotalShowTimeCallback &&
                            this._refreshTotalShowTimeCallback();
                        },
                        onFail: () => {
                            console.log(`====> ${this.curAdName} failed`);
                        },
                        onClick: () => {
                            console.log(`====> ${this.curAdName} clicked`);
                        },
                        onClose: () => {
                            console.log(`====> ${this.curAdName} closed`);
                        }
                    };
                    if (this._adInstants.length <= 0) {
                        for (let i = 0; i < 2; i++) {
                            const ad = new AdsClass(placementID, this._isReward);
                            ad.setAdName(randomName);
                            this._adInstants.push(ad);
                            ad.setAdsCallback(adsCallBack);
                            yield logEventAd(ad.getAdName(), ad.getAdTypeName(), "load", ad.loadAsync.bind(ad));
                        }
                    } else {
                        const ad = new AdsClass(placementID, this._isReward);
                        ad.setAdName(randomName);
                        this._adInstants.push(ad);
                        ad.setAdsCallback(adsCallBack);
                        yield logEventAd(ad.getAdName(), ad.getAdTypeName(), "load", ad.loadAsync.bind(ad));
                    }
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject({
                        code: "load keep bottom ad error",
                        message: error.message
                    });
                }
            });
        }

        showAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const ad = this._adInstants.shift();
                    this.curAdName = ad.getStrategyName();
                    this._curAdInstant = ad;
                    yield logEventAd(ad.getAdName(), ad.getAdTypeName(), "show", ad.showAsync.bind(ad));
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject({
                        code: "Keep_Bottom_ad_show_error",
                        message: error.message
                    });
                }
            });
        }

        getCurAdName() {
            this.curAdName = this._adInstants[0].getStrategyName();
            return this.curAdName;
        }
    }

    /**
     * @author : Dony
     * @date : 2022-07-20 13:52:50
     * @description : 替补广告
     */
    class AdsSubstitute extends AdsBase {
        constructor(isReward, ads) {
            super(isReward);
            this.adsNames = [];
            this.adsNames = this.adsNames.concat(ads);
        }

        loadAsync(placementID) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.adsNames.length === 0) {
                    console.info("====> No Substitute Ads's config");
                    return Promise.resolve();
                }
                try {
                    // 建立映射关系
                    const ads = {
                        adsense: AfgStrategy,
                        taboola: TaboolaStrategy,
                        android: AndroidStrategy,
                        mda: MdaStrategy
                    };
                    const reflection = {
                        AfgStrategy: "adsense",
                        TaboolaStrategy: "taboola",
                        AndroidStrategy: "android",
                        MdaStrategy: "mda"
                    };
                    for (let i = 0; i < this.adsNames.length; i++) {
                        const adItemName = this.adsNames[i];
                        const isAdTypeExist = this._adInstants.some((item, index, array) => {
                            const name = item.getStrategyName();
                            const adsName = reflection[name];
                            return adsName === adItemName;
                        });
                        if (!isAdTypeExist) {
                            const AdsClass = ads[adItemName];
                            const ad = new AdsClass(placementID, this._isReward);
                            ad.setAdName(adItemName);
                            this._adInstants.push(ad);
                            yield logEventAd(ad.getAdName(), ad.getAdTypeName(), "load", ad.loadAsync.bind(ad));
                        }
                    }
                    return Promise.resolve();
                } catch (error) {
                    console.info("====> load substitute ad error: ", error.message);
                    return Promise.resolve();
                }
            });
        }

        /**
         * @param adName 当前失败广告名称
         */
        showAsync(adName) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.adsNames.length === 0) {
                    console.info("====> No Substitute Ads's config");
                    return Promise.reject({
                        code: "AdsSubstitute show error",
                        message: "No Substitute Ads's config"
                    });
                }
                try {
                    const ad = this._adInstants.find((item) => {
                        return item.getStrategyName() !== adName;
                    });
                    if (!ad) {
                        return Promise.reject({
                            code: "AdsSubstitute show error",
                            message: `${adName} is the same with substitute ad`
                        });
                    }
                    this._curAdInstant = ad;
                    const index = this._adInstants.indexOf(ad);
                    this._adInstants.splice(index, 1);
                    const curAdName = ad.getStrategyName();
                    ad.setAdsCallback({
                        onShow: () => {
                            console.log(`====> ${curAdName} success`);
                        },
                        onSuccess: () => {
                            console.log(`====> ${curAdName} success`);
                            this._refreshTotalShowTimeCallback &&
                            this._refreshTotalShowTimeCallback();
                        },
                        onFail: () => {
                            console.log(`====> ${curAdName} failed`);
                        },
                        onClick: () => {
                            console.log(`====> ${curAdName} clicked`);
                        },
                        onClose: () => {
                            console.log(`====> ${curAdName} closed`);
                        }
                    });
                    yield logEventAd(ad.getAdName(), ad.getAdTypeName(), "show", ad.showAsync.bind(ad));
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject(error);
                }
            });
        }
    }

    /** 广告流程状态 */
    var AdsProcessState;
    (function (AdsProcessState) {
        /** 固定序列广告 */
        AdsProcessState["waterFall"] = "waterFall";
        /** 保底广告 */
        AdsProcessState["keepBottom"] = "keepBottom";
    })(AdsProcessState || (AdsProcessState = {}));
    /** 广告名称 */
    var AdsName;
    (function (AdsName) {
        AdsName["adsense"] = "AfgStrategy";
        AdsName["taboola"] = "TaboolaStrategy";
        AdsName["android"] = "AndroidStrategy";
    })(AdsName || (AdsName = {}));

    class AdsController {
        constructor(isReward, adConfig, disabledAd) {
            /** 广告配置 */
            this.config = null;
            /** 是否是激励视频，否则插屏 */
            this.isReward = false;
            /** 上一次展示成功的时间 */
            this.lastShowTime = 0;
            /** 当前类型的广告是否开启 */
            this.enabled = true;
            /** 广告间隔时间 */
            this.limitTime = 0;
            /** 固定序列广告列表 */
            this.adsWaterFall = [];
            /** 用于控制时间间隔 */
            this.adsWaterFallQueue = [];
            /** 保底广告列表 */
            this.adsKeepBottom = null;
            /** 替补广告 */
            this.adsSubstitute = null;
            /** 队列 */
            this.queue = null;
            /** 当前广告流程状态 */
            this.adState = AdsProcessState.waterFall;
            /** 当前阶段的广告实例 */
            this.curAds = null;
            /** 当前成功展示的广告次数 */
            this.curShowTimes = 0;
            /** placementID */
            this.placementID = "";
            this.isReward = isReward;
            this.config = adConfig;
            this.enabled = !disabledAd && this.config.enabled;
            this.limitTime = this.config.limitTime;
            this.adsKeepBottom = new AdsKeepBottom(this.isReward, this.config.strategy.keepBottom);
            this.adsSubstitute = new AdsSubstitute(this.isReward, this.config.strategy.substitute);
            this.queue = new AsyncQueue();
            this.pushToQueue();
            this.onComplete();
            this.queue.play();
        }

        /** 创建固定序列广告任务到队列 */
        pushToQueue() {
            const waterFall = this.config.strategy.waterFall;
            waterFall.forEach((value, index, array) => {
                this.queue.push((next, param, args) => __awaiter(this, void 0, void 0, function* () {
                    const adsWaterFall = new AdsWaterFall(this.isReward, value, next);
                    this.adsWaterFall.push(adsWaterFall);
                    adsWaterFall.refreshTotalShowTimeCallback = () => {
                        this.lastShowTime = TimeUtil.getTimeBySecond();
                        this.curShowTimes++;
                    };
                }));
            });
        }

        /** 队列处理结束监听 */
        onComplete() {
            this.queue.complete = () => __awaiter(this, void 0, void 0, function* () {
                // 状态切换到保底广告组
                this.adState = AdsProcessState.keepBottom;
                console.info("====> waterFall ads finish.");
                yield this.adsKeepBottom.loadAsync(this.placementID);
                console.info("====> preload keepBottom ads");
            });
        }

        loadAsync(placementID) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.placementID.length === 0) {
                    this.placementID = placementID;
                }
                if (!this.enabled) {
                    styleConsole(`load ${this.isReward ? "rewardAd" : "interstitialAd"} is disabled`);
                    return Promise.resolve();
                }
                try {
                    yield this.adsSubstitute.loadAsync(placementID);
                    if (this.adState === AdsProcessState.waterFall) {
                        const adsWaterFall = this.adsWaterFall.find(item => item.IsFinish === false);
                        this.adsWaterFallQueue.push(adsWaterFall);
                        // 时间间隔加载
                        const timeInterval = (this.adsWaterFallQueue.length - 1) * adsWaterFall.getLoadTimeInterval();
                        yield TimeUtil.waitTime(timeInterval * 1000);
                        yield adsWaterFall.loadAsync(placementID);
                        return Promise.resolve();
                    }
                    if (this.adState === AdsProcessState.keepBottom) {
                        return this.adsKeepBottom.loadAsync(placementID);
                    }
                    return Promise.reject({
                        code: "Ads load  error",
                        message: "ad state error"
                    });
                } catch (error) {
                    // 广告实例不存在，直接瀑布流下一轮
                    if (error.code === ErrorCode.ADS_NETWORK_NOT_FOUND) {
                        if (this.adState === AdsProcessState.waterFall) {
                            const adsWaterFall = this.adsWaterFall.find(item => item.IsFinish === false);
                            return adsWaterFall.loadAsync(placementID);
                        }
                        if (this.adState === AdsProcessState.keepBottom) {
                            return this.adsKeepBottom.loadAsync(placementID);
                        }
                        return Promise.reject({
                            code: "Ads load  error",
                            message: "ad state error"
                        });
                    }
                    return Promise.reject({
                        code: `${this.adState} load ad error`,
                        message: error.message
                    });
                }
            });
        }

        showAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                /** 广告没有开启 */
                if (!this.enabled) {
                    styleConsole(`show ${this.isReward ? "rewardAd" : "interstitialAd"} is disabled`);
                    return Promise.resolve();
                }
                /** 展示次数超过总展示次数，不在展示广告 */
                if (this.curShowTimes >= this.config.totalTimes &&
                    this.config.totalTimes !== -1) {
                    return Promise.reject({
                        code: `show ${this.isReward ? "rewardAd" : "interstitialAd"} error`,
                        message: `had reach the max show times`
                    });
                }
                /** 广告的间隔时间内，不允许播放广告 */
                const currTime = TimeUtil.getTimeBySecond();
                const deltaTime = currTime - this.lastShowTime;
                if (deltaTime < this.limitTime) {
                    return Promise.reject({
                        code: `show ${this.isReward ? "rewardAd" : "interstitialAd"} frequently`,
                        message: `${this.limitTime - deltaTime} seconds remain`
                    });
                }
                let curAdName = "";
                try {
                    /** 瀑布流广告流程 */
                    if (this.adState === AdsProcessState.waterFall) {
                        const adsWaterFall = this.adsWaterFall.find((item) => item.IsFinish === false);
                        curAdName = adsWaterFall.getCurAdName();
                        this.curAds = adsWaterFall;
                        yield adsWaterFall.showAsync();
                        // this.lastShowTime = TimeUtil.getTimeBySecond();
                        // this.curShowTimes++;
                        return Promise.resolve();
                    }
                    /** 保底广告流程 */
                    if (this.adState === AdsProcessState.keepBottom) {
                        curAdName = this.adsKeepBottom.getCurAdName();
                        this.curAds = this.adsKeepBottom;
                        yield this.adsKeepBottom.showAsync();
                        this.lastShowTime = TimeUtil.getTimeBySecond();
                        this.curShowTimes++;
                        return Promise.resolve();
                    }
                    return Promise.reject({
                        code: "load ad error",
                        message: "ad state error"
                    });
                } catch (error) {
                    if (error.code === "dismissed") {
                        return Promise.reject({
                            code: `show ${this.isReward ? "rewardAd" : "interstitialAd"} error`,
                            message: error.message
                        });
                    }
                    this.curAds = this.adsSubstitute;
                    try {
                        // 替补广告
                        yield this.adsSubstitute.showAsync(curAdName);
                        this.curShowTimes++;
                        return Promise.resolve();
                    } catch (error) {
                        return Promise.reject(error);
                    }
                }
            });
        }

        onShowAdsResult(isSuccess, errMessage) {
            console.info(`====> ${this.isReward ? "rewardAd" : "interstitialAd"} show result: ${isSuccess}, this.curAds: ${this.curAds}`);
            if (this.curAds) {
                this.curAds.onShowAdsResult(isSuccess, errMessage);
            } else {
                console.error(`adsController onShowAdsResult error: cur ads is null`);
            }
        }
    }

    /**
     * @author : Dony
     * @date : 2022-07-27 15:09:57
     * @description : banner广告基类
     */
    class BannerStrategy {
    }

    /**
     * @author : Dony
     * @date : 2022-07-27 14:15:55
     * @description : android banner广告
     */
    class AndroidBannerStrategy extends BannerStrategy {
        constructor() {
            super(...arguments);
            this._showBannerResult = null;
            this._hideBannerResult = null;
        }

        showBannerAsync(placementID) {
            return new Promise((resolve, reject) => {
                // @ts-ignore
                if (!window.AdInteractive) {
                    reject("Android AdInteractive not exist");
                    return;
                }
                // @ts-ignore
                window.AdInteractive.showBannerAd();
                this._showBannerResult = (isSuccess) => {
                    if (isSuccess) {
                        resolve();
                    } else {
                        reject({
                            code: "android show fail",
                            message: "android show banner ads fail"
                        });
                    }
                };
            });
        }

        hideBannerAsync() {
            return new Promise((resolve, reject) => {
                // @ts-ignore
                if (!window.AdInteractive) {
                    reject("Android AdInteractive not exist");
                    return;
                }
                // @ts-ignore
                window.AdInteractive.hideBannerAd();
                this._hideBannerResult = (isSuccess) => {
                    if (isSuccess) {
                        resolve();
                    } else {
                        reject({
                            code: "android hide fail",
                            message: "android hide banner ads fail"
                        });
                    }
                };
            });
        }

        onShowBannerResult(isSuccess) {
            if (this._showBannerResult) {
                this._showBannerResult(isSuccess);
            } else {
                console.error("android show banner result error");
            }
        }

        onHideBannerResult(isSuccess) {
            if (this._hideBannerResult) {
                this._hideBannerResult(isSuccess);
            } else {
                console.error("android hide banner result error");
            }
        }
    }

    /**
     * @author : Dony
     * @date : 2022-07-27 14:00:50
     * @description : taboola banner广告策略
     */
    class TaboolaBannerStrategy extends BannerStrategy {
        constructor() {
            super(...arguments);
            this._bannerElement = "minigameTaboolaBanner";
        }

        showBannerAsync(placementID) {
            try {
                const ctxDiv = document.createElement("div");
                ctxDiv.setAttribute("id", "minigameTaboolaBanner");
                ctxDiv.setAttribute("style", "font-size: 16px;font-family: Microsoft YaHei;font-weight: 400; position: fixed;bottom:0;  z-index: 19999; overflow: hidden; width: 100vw;height: 80px; background-color: black;display: flex;align-items: end;justify-content: center;");
                document.body.append(ctxDiv);
                const adsParam = {
                    containerObj: {
                        id: "taboola-below-article-thumbnails_stream",
                        containerStr: `#${this._bannerElement}`,
                        ifInsertBefore: false,
                        propertysObj: {
                            style: "width:320px;height:70px;overflow: hidden;background: #fff;"
                        }
                    },
                    adProperties: {
                        mode: "thumbnails-stream",
                        container: "taboola-below-article-thumbnails_stream",
                        // @ts-ignore
                        placement: `Below Article Thumbnails_Stream_${window.channelName}.game.banner`
                    }
                };
                const commonTaboolaAd = new CommonAd(adsParam);
                return commonTaboolaAd.showAd();
            } catch (error) {
                return Promise.reject({
                    code: "show tabool banner error",
                    message: error.message
                });
            }
        }

        hideBannerAsync() {
            const ctxDiv = document.getElementById(this._bannerElement);
            if (ctxDiv) {
                ctxDiv.remove();
            }
            return Promise.resolve();
        }
    }

    class PlayitTaboolaBannerStrategy extends BannerStrategy {
        constructor() {
            super(...arguments);
            this._bannerElement = "minigameTaboolaBanner";
        }

        showBannerAsync(placementID) {
            try {
                const ctxDiv = document.createElement("div");
                ctxDiv.setAttribute("id", "minigameTaboolaBanner");
                ctxDiv.setAttribute("style", "font-size: 16px;font-family: Microsoft YaHei;font-weight: 400; position: fixed;bottom:0;  z-index: 19999; overflow: hidden; width: 100vw;height: 80px; background-color: black;display: flex;align-items: end;justify-content: center;");
                document.body.append(ctxDiv);
                const adsParam = {
                    containerObj: {
                        id: "taboola-mobile-stream-thumbnails",
                        containerStr: `#${this._bannerElement}`,
                        ifInsertBefore: false,
                        propertysObj: {
                            style: "width:320px;height:70px;overflow: hidden;background: #fff;"
                        }
                    },
                    adProperties: {
                        mode: "thumbnails-a-stream",
                        container: "taboola-mobile-stream-thumbnails",
                        // @ts-ignore
                        placement: "Mobile Stream Thumbnails"
                    }
                };
                const commonTaboolaAd = new CommonAd(adsParam);
                return commonTaboolaAd.showAd();
            } catch (error) {
                return Promise.reject({
                    code: "show playit taboola banner error",
                    message: error.message
                });
            }
        }

        hideBannerAsync() {
            const ctxDiv = document.getElementById(this._bannerElement);
            if (ctxDiv) {
                ctxDiv.remove();
            }
            return Promise.resolve();
        }
    }

    /**
     * @author : Dony
     * @date : 2022-07-20 16:31:49
     * @description : banner广告管理器
     */
    class BannerController {
        constructor(bannerConfig, disabledAd) {
            /** 当前类型的广告是否开启 */
            this.enabled = true;
            this._config = null;
            this._curBannerAd = null;
            /** 当前成功展示的广告次数 */
            this.curShowTimes = 0;
            this._config = bannerConfig;
            this.enabled = !disabledAd && this._config.enabled;
        }

        showBannerAsync(placementID) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this.enabled) {
                    styleConsole("show banner is disabled");
                    return Promise.resolve();
                }
                if (this.curShowTimes >= this._config.totalTimes &&
                    this._config.totalTimes !== -1) {
                    return Promise.reject({
                        code: "show banner error",
                        message: "banner show times is over"
                    });
                }
                try {
                    // 建立映射关系
                    const bannerAds = {
                        taboola: TaboolaBannerStrategy,
                        android: AndroidBannerStrategy,
                        playitTaboola: PlayitTaboolaBannerStrategy
                    };
                    const AdsClass = bannerAds[this._config.adsName];
                    const banner = new AdsClass();
                    this._curBannerAd = banner;
                    yield banner.showBannerAsync(placementID);
                    this.curShowTimes++;
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject(error);
                }
                // const ctxDiv = document.createElement("div");
                // ctxDiv.setAttribute("id", "minigameTaboolaBanner");
                // ctxDiv.setAttribute("style", "font-size: 16px;font-family: Microsoft YaHei;font-weight: 400; position: fixed;bottom:0;  z-index: 19999; overflow: hidden; width: 100vw;height: 80px; background-color: black;display: flex;align-items: end;justify-content: center;");
                // document.body.append(ctxDiv);
                // const adsParam: TaboolaParam = {
                //   containerObj: {
                //     id: "taboola-below-article-thumbnails_stream",
                //     containerStr: `#${bannerElement}`,
                //     ifInsertBefore: false,
                //     propertysObj: {
                //       style: "width:320px;height:70px;overflow: hidden;background: #fff;"
                //     }
                //   },
                //   adProperties: {
                //     mode: "thumbnails-stream",
                //     container: "taboola-below-article-thumbnails_stream",
                //     // @ts-ignore
                //     placement: `Below Article Thumbnails_Stream_${window.channelName}.game.banner`
                //   }
                // };
                // const commonTaboolaAd = new CommonAd(adsParam);
                // return commonTaboolaAd.showAd();
            });
        }

        hideBannerAsync() {
            if (!this.enabled) {
                styleConsole("hide banner is disabled");
                return Promise.resolve();
            }
            return this._curBannerAd.hideBannerAsync();
        }

        onShowBannerResult(isSuccess, errMessage) {
            var _a;
            if (this._curBannerAd) {
                // @ts-ignore
                (_a = this._curBannerAd) === null || _a === void 0 ? void 0 : _a.onShowBannerResult(isSuccess, errMessage);
            } else {
                console.error("ShowBanner Android Callback Error: cur bannnerAd is null");
            }
        }

        onHideBannerResult(isSuccess, errMessage) {
            var _a;
            if (this._curBannerAd) {
                // @ts-ignore
                (_a = this._curBannerAd) === null || _a === void 0 ? void 0 : _a.onHideBannerResult(isSuccess, errMessage);
            } else {
                console.error("HideBanner Android Callback Error: cur bannnerAd is null");
            }
        }
    }

    class FetchMinigameAdConfig {
        constructor() {
            this._config = null;
        }

        get config() {
            return this._config;
        }

        static get instance() {
            if (!this._instance) {
                this._instance = new FetchMinigameAdConfig();
            }
            return this._instance;
        }

        fetchConfigAsync(configUrl) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const configFile = configUrl;
                    this._config = yield loadRemoteConfig(configFile);
                    console.info("fetch MinigameAd config success: ", this._config);
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject({
                        code: "fetch MinigameAd fail",
                        message: error.message
                    });
                }
            });
        }
    }

    FetchMinigameAdConfig._instance = null;
    const fetchMgConfig = FetchMinigameAdConfig.instance;

    /**
     * @author : Dony
     * @date : 2022-07-14 17:34:36
     * @description : 微游广告管理器
     */
    const DefaultAdConfig = {
        adType: {
            interstitial: {
                enabled: true,
                limitTime: 30,
                totalTimes: -1,
                strategy: {
                    waterFall: [
                        {
                            adsName: "adsense",
                            showTimes: -1
                        }
                    ],
                    keepBottom: [],
                    substitute: []
                }
            },
            reward: {
                enabled: true,
                limitTime: 0,
                totalTimes: -1,
                strategy: {
                    waterFall: [
                        {
                            adsName: "adsense",
                            showTimes: -1
                        }
                    ],
                    keepBottom: [""],
                    substitute: [""]
                }
            },
            banner: {
                enabled: false,
                adsName: "adsense",
                totalTimes: -1
            },
            preroll: {
                adsName: "adsense",
                // preload: "on"
                // adTargetUrl: "" // 如果是 ima, adTargetUrl必须设置
            }
        }
    };
    /**
     * 根据配置找出需要加载的广告策略名称
     * @param {iAdConfig} adConfig 插屏配置或者激励配置
     * @returns {string[]} strategies 去重后的广告策略名称
     */
    const findEnabledStrategies = (adConfig) => {
        if (!adConfig.enabled) {
            return [];
        }
        const {waterFall, keepBottom, substitute} = adConfig.strategy;
        const strategies = [
            ...waterFall.map(item => item.adsName),
            ...keepBottom,
            ...substitute
        ];
        return [...new Set([...strategies])];
    };
    /**
     * 根据提供的SDK数组加载SDK
     * @param {string[]} strategies 要加载的SDK数组, ['adsense', 'adivery', 'admanager', 'bridge','packageAdmanager','ima']
     * @param {iMinigameOption} options 传给加载 SDK 的参数
     * @param {Object} customOptions 特殊的加载 SDK 的参数，可自定义匹配，目前指定 ima
     * @returns
     */
    const initScripts = (strategies, options, customOptions) => __awaiter(void 0, void 0, void 0, function* () {
        const strategyMap = {
            // mda: MdaStrategy,
            adsense: initAfg,
            // taboola: TaboolaStrategy,
            // android: AndroidStrategy,
            adivery: initAdivery,
            admanager: initGpt,
            bridge: initBridge,
            packageAdmanager: initGpt,
            ima: initIMA,
            taboola: initTaboola,
            playitTaboola: initPlayitTaboola,
            zalo: initZaloAd
        };
        const promises = [];
        strategies.forEach(item => {
            var _a;
            if (strategyMap[item]) {
                // ima单独处理，将广告地址参数传给初始化方法，在SDK加载完成后加载广告
                if (item === "ima" && ((_a = customOptions === null || customOptions === void 0 ? void 0 : customOptions.ima) === null || _a === void 0 ? void 0 : _a.adTargetUrl)) {
                    promises.push(strategyMap[item](customOptions.ima));
                } else {
                    promises.push(strategyMap[item](options));
                }
            }
        });
        return Promise.all(promises);
    });

    class AdsManager {
        constructor() {
            this.interstitialAdsController = null;
            this.rewardAdsController = null;
            this.bannerAdsController = null;
            this.config = null;
            // 微游中心渠道广告开光控制是否关闭广告(true 关闭)
            this.disabledAd = false;
            // ----------------------------android回调方法-------------------------------
        }

        static get instance() {
            if (!this._instance) {
                this._instance = new AdsManager();
            }
            return this._instance;
        }

        setConfig() {
            this.config = fetchMgConfig.config ? fetchMgConfig.config : DefaultAdConfig;
        }

        getConfig() {
            return this.config;
        }

        getDisableAds() {
            return this.disabledAd;
        }

        setDisableAds(ads_disabled) {
            this.disabledAd = ads_disabled || false;
            if (this.disabledAd) {
                styleConsole("[minigame] ads disabled");
            }
        }

        initScripts(options) {
            var _a, _b, _c;
            return __awaiter(this, void 0, void 0, function* () {
                const enabledStrategies = [
                    ...new Set([
                        ...findEnabledStrategies(this.config.adType.interstitial),
                        ...findEnabledStrategies(this.config.adType.reward)
                    ].concat(this.config.adType.banner.enabled ? [this.config.adType.banner.adsName] : [])
                        .concat(((_a = this.config.adType.preroll) === null || _a === void 0 ? void 0 : _a.adsName) ? [this.config.adType.preroll.adsName] : []))
                ];
                yield initScripts(enabledStrategies, options, {
                    ima: {
                        adTargetUrl: (_b = this.config.adType.preroll) === null || _b === void 0 ? void 0 : _b.adTargetUrl,
                        preload: ((_c = this.config.adType.preroll) === null || _c === void 0 ? void 0 : _c.preload) || "on" // 默认开启预加载
                    }
                });
            });
        }

        createAdInstants() {
            return __awaiter(this, void 0, void 0, function* () {
                this.rewardAdsController = new AdsController(true, this.config.adType.reward, this.getDisableAds());
                this.interstitialAdsController = new AdsController(false, this.config.adType.interstitial, this.getDisableAds());
                this.bannerAdsController = new BannerController(this.config.adType.banner, this.getDisableAds());
            });
        }

        loadAsync(placementId, isReward) {
            console.info("====> load AD placementId: ", placementId, "isReward: ", isReward);
            if (isReward) {
                return this.rewardAdsController.loadAsync(placementId);
            } else {
                return this.interstitialAdsController.loadAsync(placementId);
            }
        }

        showAsync(isReward) {
            console.info("====> show AD isReward: ", isReward);
            if (isReward) {
                return this.rewardAdsController.showAsync();
            } else {
                return this.interstitialAdsController.showAsync();
            }
        }

        loadBannerAsync(placementID) {
            return this.bannerAdsController.showBannerAsync(placementID);
        }

        hideBannerAsync() {
            return this.bannerAdsController.hideBannerAsync();
        }

        showPrerollAsync() {
            var _a, _b, _c, _d, _e;
            if (commonInfo.isH5AndroidApp()) {
                return this.interstitialAdsController.showAsync();
            } else {
                // adsense afg => showPrerollAsync
                // adx => ima sdk
                // 其他策略：用插屏当开屏
                const isAfg = ((_a = this.config.adType.preroll) === null || _a === void 0 ? void 0 : _a.adsName) === "adsense";
                const isIma = ((_b = this.config.adType.preroll) === null || _b === void 0 ? void 0 : _b.adsName) === "ima";
                const isPreload = ((_c = this.config.adType.preroll) === null || _c === void 0 ? void 0 : _c.preload) === undefined ||
                    ((_d = this.config.adType.preroll) === null || _d === void 0 ? void 0 : _d.preload) === "on"; // 默认开启预加载
                if (isIma) {
                    if (isPreload) {
                        return showPrerollWithPreloadAsync();
                    } else {
                        const adTargetUrl = (_e = this.config.adType.preroll) === null || _e === void 0 ? void 0 : _e.adTargetUrl;
                        return showPrerollAsync(adTargetUrl);
                    }
                } else if (isAfg) {
                    return showPrerollAsync$1();
                } else {
                    return this.interstitialAdsController.showAsync();
                }
            }
        }

        // ----------------------------android回调方法-------------------------------
        /** Android激励或插屏广告回调 */
        onShowAdsResult(isReward, isSuccess, message) {
            console.info(`=====> androidCallJs onShowAdsResult isReward: ${isReward}, isSuccess: ${isSuccess}, message: ${message}`);
            if (isReward) {
                this.rewardAdsController.onShowAdsResult(isSuccess, message);
            } else {
                this.interstitialAdsController.onShowAdsResult(isSuccess, message);
            }
        }

        /** Android Banner show 回调 */
        onShowBannerResult(isSuccess, errMessage) {
            console.info(`=====> androidCallJs onShowBannerResult isSuccess: ${isSuccess}, errMessage: ${errMessage}`);
            this.bannerAdsController.onShowBannerResult(isSuccess, errMessage);
        }

        /** Android Banner hide 回调 */
        onHideBannerResult(isSuccess, errMessage) {
            console.info(`=====> androidCallJs onHideBannerResult isSuccess: ${isSuccess}, errMessage: ${errMessage}`);
            this.bannerAdsController.onHideBannerResult(isSuccess, errMessage);
        }
    }

    AdsManager._instance = null;
    const adsManager = AdsManager.instance;
    // @ts-ignore
    window.showProllAsync = adsManager.showPrerollAsync.bind(adsManager);
    // @ts-ignore
    window.onShowAdsResult = adsManager.onShowAdsResult.bind(adsManager);
    // @ts-ignore
    window.onShowBannerResult = adsManager.onShowBannerResult.bind(adsManager);
    // @ts-ignore
    window.onHideBannerResult = adsManager.onHideBannerResult.bind(adsManager);

    class AFGAdInstantLoadService extends MediationService {
        static createRequest(payload) {
            return {
                type: AFGAdInstantLoadService.requestType,
                payload: payload
            };
        }

        static createService() {
            return new AFGAdInstantLoadService(AFGAdInstantLoadService.requestType, false, AFGAdInstantLoadService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            // console.error(`[Service: ${AFGAdInstantLoadService.requestType}]===> onRequest: `, request);
            const placementId = request.payload.placementId;
            const isRewardedAd = request.payload.isRewardedAd;
            request.payload.uid;
            // afg + taboola模式
            return adsManager
                .loadAsync(placementId, isRewardedAd)
                .then(() => {
                    console.info("====>load Ads success");
                    return Promise.resolve(generateSuccessResponse(request));
                })
                .catch((err) => {
                    return Promise.resolve(generateErrorResponse(request, err.code, err.message));
                });
            // todo 直客模式
            //   AdsContextManager.instance.createAdsStrategy(
            //     placementId,
            //     isRewardedAd,
            //     uid
            //   );
            //   return AdsContextManager.instance
            //     .loadAsync(uid)
            //     .then(() => {
            //       console.info("====>loadAdsStrategy Ads loaded");
            //       return Promise.resolve(generateSuccessResponse(request));
            //     })
            //     .catch((err) => {
            //       console.info("====>loadAdsStrategy Ads not loaded or timeout");
            //       // return Promise.reject(err);
            //       return Promise.resolve(
            //         generateErrorResponse(request, err.code, err.message)
            //       );
            //     });
        }
    }

    AFGAdInstantLoadService.requestType = "AFGAdInstantLoadService";

    class AFGAdInstantShowService extends MediationService {
        static createService() {
            return new AFGAdInstantShowService(AFGAdInstantShowService.requestType, false, AFGAdInstantShowService.handleRequestAsync);
        }

        static createRequest(payload) {
            return {
                type: AFGAdInstantShowService.requestType,
                payload: payload
            };
        }

        static handleRequestAsync(request) {
            return __awaiter(this, void 0, void 0, function* () {
                const type = request.payload.isRewardedAd
                    ? AD_TYPE.reward
                    : AD_TYPE.next;
                const name = request.payload.placementId;
                request.payload.uid;
                // console.error(`[Service: ${AFGAdInstantShowService.requestType}]===> onRequest: `, request);
                console.info(`===> show ad: ${type}|${name}`);
                // afg + taboola模式
                return adsManager
                    .showAsync(request.payload.isRewardedAd)
                    .then(() => {
                        console.info("====>show ads: success");
                        return Promise.resolve(generateSuccessResponse(request));
                    })
                    .catch((error) => {
                        console.info("====>showAdsStrategy show ads: failed: ", error);
                        return Promise.resolve(generateErrorResponse(request, error.code, error.message));
                    });
                // todo 直客模式
                // try {
                //   await AdsContextManager.instance.showAsync(uid);
                //   console.info("====>showAdsStrategy show ads: success");
                //   return Promise.resolve(generateSuccessResponse(request));
                // } catch (error) {
                //   console.info("====>showAdsStrategy show ads: failed");
                //   return Promise.resolve(
                //     generateErrorResponse(request, error.code, error.message)
                //   );
                // }
            });
        }
    }

    AFGAdInstantShowService.requestType = "AFGAdInstantShowService";

    const MiniGameServiceRequestType = {
        PROGRESS: "MINIGAME_PROGRESS",
        INIT: "MINIGAME_INIT",
        START_GAME: "MINIGAME_START_GAME",
        SET_GAME_READY: "MINIGAME_SET_GAME_READY"
    };

    // 基于local storage 封装的fb setData/getData接口
    let STORE_KEY = "_minigame_data_";
    let _localData = {};
    let _inited = false;

    function init(cacheSuffix = "") {
        if (_inited) {
            return;
        }
        _inited = true;
        if (cacheSuffix !== null) {
            STORE_KEY = STORE_KEY + cacheSuffix; // 如果有cacheSuffix，则加上cacheSuffix
        }
        const jsonData = localStorage.getItem(STORE_KEY);
        if (jsonData != null) {
            try {
                const data = JSON.parse(jsonData);
                _localData = data;
            } catch (e) {
                console.error("Failed to parse local data: " + jsonData);
            }
        }
    }

    function getItem(key, defaultValue) {
        if (key === undefined || key === null || key.trim() === "") {
            throw {
                code: API_CODE.CODE.INVALID_PARAM,
                message: "Invalid key: " + key
            };
        }
        const v = _localData[key];
        if (typeof v !== "undefined") {
            return v;
        }
        return defaultValue;
    }

    function setItem(key, value) {
        if (key === undefined || key === null || key.trim() === "") {
            throw {
                code: API_CODE.CODE.INVALID_PARAM,
                message: "Invalid key: " + key
            };
        }
        _localData[key] = value;
    }

    function flush() {
        try {
            const jsonData = JSON.stringify(_localData);
            localStorage.setItem(STORE_KEY, jsonData);
            if (localStorage.flush) {
                localStorage.flush();
            }
        } catch (e) {
            console.error("LocalCache.flush error: ", e);
        }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var cryptoJsExports = {};
    var cryptoJs = {
        get exports() {
            return cryptoJsExports;
        },
        set exports(v) {
            cryptoJsExports = v;
        },
    };

    function commonjsRequire(path) {
        throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
    }

    var coreExports = {};
    var core = {
        get exports() {
            return coreExports;
        },
        set exports(v) {
            coreExports = v;
        },
    };

    var hasRequiredCore;

    function requireCore() {
        if (hasRequiredCore) return coreExports;
        hasRequiredCore = 1;
        (function (module, exports) {
            (function (root, factory) {
                {
                    // CommonJS
                    module.exports = factory();
                }
            }(commonjsGlobal, function () {

                /*globals window, global, require*/

                /**
                 * CryptoJS core components.
                 */
                var CryptoJS = CryptoJS || (function (Math, undefined$1) {

                    var crypto;

                    // Native crypto from window (Browser)
                    if (typeof window !== 'undefined' && window.crypto) {
                        crypto = window.crypto;
                    }

                    // Native crypto in web worker (Browser)
                    if (typeof self !== 'undefined' && self.crypto) {
                        crypto = self.crypto;
                    }

                    // Native crypto from worker
                    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
                        crypto = globalThis.crypto;
                    }

                    // Native (experimental IE 11) crypto from window (Browser)
                    if (!crypto && typeof window !== 'undefined' && window.msCrypto) {
                        crypto = window.msCrypto;
                    }

                    // Native crypto from global (NodeJS)
                    if (!crypto && typeof commonjsGlobal !== 'undefined' && commonjsGlobal.crypto) {
                        crypto = commonjsGlobal.crypto;
                    }

                    // Native crypto import via require (NodeJS)
                    if (!crypto && typeof commonjsRequire === 'function') {
                        try {
                            crypto = require('crypto');
                        } catch (err) {
                        }
                    }

                    /*
    			     * Cryptographically secure pseudorandom number generator
    			     *
    			     * As Math.random() is cryptographically not safe to use
    			     */
                    var cryptoSecureRandomInt = function () {
                        if (crypto) {
                            // Use getRandomValues method (Browser)
                            if (typeof crypto.getRandomValues === 'function') {
                                try {
                                    return crypto.getRandomValues(new Uint32Array(1))[0];
                                } catch (err) {
                                }
                            }

                            // Use randomBytes method (NodeJS)
                            if (typeof crypto.randomBytes === 'function') {
                                try {
                                    return crypto.randomBytes(4).readInt32LE();
                                } catch (err) {
                                }
                            }
                        }

                        throw new Error('Native crypto module could not be used to get secure random number.');
                    };

                    /*
    			     * Local polyfill of Object.create

    			     */
                    var create = Object.create || (function () {
                        function F() {
                        }

                        return function (obj) {
                            var subtype;

                            F.prototype = obj;

                            subtype = new F();

                            F.prototype = null;

                            return subtype;
                        };
                    }());

                    /**
                     * CryptoJS namespace.
                     */
                    var C = {};

                    /**
                     * Library namespace.
                     */
                    var C_lib = C.lib = {};

                    /**
                     * Base object for prototypal inheritance.
                     */
                    var Base = C_lib.Base = (function () {


                        return {
                            /**
                             * Creates a new object that inherits from this object.
                             *
                             * @param {Object} overrides Properties to copy into the new object.
                             *
                             * @return {Object} The new object.
                             *
                             * @static
                             *
                             * @example
                             *
                             *     var MyType = CryptoJS.lib.Base.extend({
                             *         field: 'value',
                             *
                             *         method: function () {
                             *         }
                             *     });
                             */
                            extend: function (overrides) {
                                // Spawn
                                var subtype = create(this);

                                // Augment
                                if (overrides) {
                                    subtype.mixIn(overrides);
                                }

                                // Create default initializer
                                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
                                    subtype.init = function () {
                                        subtype.$super.init.apply(this, arguments);
                                    };
                                }

                                // Initializer's prototype is the subtype object
                                subtype.init.prototype = subtype;

                                // Reference supertype
                                subtype.$super = this;

                                return subtype;
                            },

                            /**
                             * Extends this object and runs the init method.
                             * Arguments to create() will be passed to init().
                             *
                             * @return {Object} The new object.
                             *
                             * @static
                             *
                             * @example
                             *
                             *     var instance = MyType.create();
                             */
                            create: function () {
                                var instance = this.extend();
                                instance.init.apply(instance, arguments);

                                return instance;
                            },

                            /**
                             * Initializes a newly created object.
                             * Override this method to add some logic when your objects are created.
                             *
                             * @example
                             *
                             *     var MyType = CryptoJS.lib.Base.extend({
                             *         init: function () {
                             *             // ...
                             *         }
                             *     });
                             */
                            init: function () {
                            },

                            /**
                             * Copies properties into this object.
                             *
                             * @param {Object} properties The properties to mix in.
                             *
                             * @example
                             *
                             *     MyType.mixIn({
                             *         field: 'value'
                             *     });
                             */
                            mixIn: function (properties) {
                                for (var propertyName in properties) {
                                    if (properties.hasOwnProperty(propertyName)) {
                                        this[propertyName] = properties[propertyName];
                                    }
                                }

                                // IE won't copy toString using the loop above
                                if (properties.hasOwnProperty('toString')) {
                                    this.toString = properties.toString;
                                }
                            },

                            /**
                             * Creates a copy of this object.
                             *
                             * @return {Object} The clone.
                             *
                             * @example
                             *
                             *     var clone = instance.clone();
                             */
                            clone: function () {
                                return this.init.prototype.extend(this);
                            }
                        };
                    }());

                    /**
                     * An array of 32-bit words.
                     *
                     * @property {Array} words The array of 32-bit words.
                     * @property {number} sigBytes The number of significant bytes in this word array.
                     */
                    var WordArray = C_lib.WordArray = Base.extend({
                        /**
                         * Initializes a newly created word array.
                         *
                         * @param {Array} words (Optional) An array of 32-bit words.
                         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
                         *
                         * @example
                         *
                         *     var wordArray = CryptoJS.lib.WordArray.create();
                         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
                         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
                         */
                        init: function (words, sigBytes) {
                            words = this.words = words || [];

                            if (sigBytes != undefined$1) {
                                this.sigBytes = sigBytes;
                            } else {
                                this.sigBytes = words.length * 4;
                            }
                        },

                        /**
                         * Converts this word array to a string.
                         *
                         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
                         *
                         * @return {string} The stringified word array.
                         *
                         * @example
                         *
                         *     var string = wordArray + '';
                         *     var string = wordArray.toString();
                         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
                         */
                        toString: function (encoder) {
                            return (encoder || Hex).stringify(this);
                        },

                        /**
                         * Concatenates a word array to this word array.
                         *
                         * @param {WordArray} wordArray The word array to append.
                         *
                         * @return {WordArray} This word array.
                         *
                         * @example
                         *
                         *     wordArray1.concat(wordArray2);
                         */
                        concat: function (wordArray) {
                            // Shortcuts
                            var thisWords = this.words;
                            var thatWords = wordArray.words;
                            var thisSigBytes = this.sigBytes;
                            var thatSigBytes = wordArray.sigBytes;

                            // Clamp excess bits
                            this.clamp();

                            // Concat
                            if (thisSigBytes % 4) {
                                // Copy one byte at a time
                                for (var i = 0; i < thatSigBytes; i++) {
                                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
                                }
                            } else {
                                // Copy one word at a time
                                for (var j = 0; j < thatSigBytes; j += 4) {
                                    thisWords[(thisSigBytes + j) >>> 2] = thatWords[j >>> 2];
                                }
                            }
                            this.sigBytes += thatSigBytes;

                            // Chainable
                            return this;
                        },

                        /**
                         * Removes insignificant bits.
                         *
                         * @example
                         *
                         *     wordArray.clamp();
                         */
                        clamp: function () {
                            // Shortcuts
                            var words = this.words;
                            var sigBytes = this.sigBytes;

                            // Clamp
                            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
                            words.length = Math.ceil(sigBytes / 4);
                        },

                        /**
                         * Creates a copy of this word array.
                         *
                         * @return {WordArray} The clone.
                         *
                         * @example
                         *
                         *     var clone = wordArray.clone();
                         */
                        clone: function () {
                            var clone = Base.clone.call(this);
                            clone.words = this.words.slice(0);

                            return clone;
                        },

                        /**
                         * Creates a word array filled with random bytes.
                         *
                         * @param {number} nBytes The number of random bytes to generate.
                         *
                         * @return {WordArray} The random word array.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var wordArray = CryptoJS.lib.WordArray.random(16);
                         */
                        random: function (nBytes) {
                            var words = [];

                            for (var i = 0; i < nBytes; i += 4) {
                                words.push(cryptoSecureRandomInt());
                            }

                            return new WordArray.init(words, nBytes);
                        }
                    });

                    /**
                     * Encoder namespace.
                     */
                    var C_enc = C.enc = {};

                    /**
                     * Hex encoding strategy.
                     */
                    var Hex = C_enc.Hex = {
                        /**
                         * Converts a word array to a hex string.
                         *
                         * @param {WordArray} wordArray The word array.
                         *
                         * @return {string} The hex string.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
                         */
                        stringify: function (wordArray) {
                            // Shortcuts
                            var words = wordArray.words;
                            var sigBytes = wordArray.sigBytes;

                            // Convert
                            var hexChars = [];
                            for (var i = 0; i < sigBytes; i++) {
                                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                                hexChars.push((bite >>> 4).toString(16));
                                hexChars.push((bite & 0x0f).toString(16));
                            }

                            return hexChars.join('');
                        },

                        /**
                         * Converts a hex string to a word array.
                         *
                         * @param {string} hexStr The hex string.
                         *
                         * @return {WordArray} The word array.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
                         */
                        parse: function (hexStr) {
                            // Shortcut
                            var hexStrLength = hexStr.length;

                            // Convert
                            var words = [];
                            for (var i = 0; i < hexStrLength; i += 2) {
                                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
                            }

                            return new WordArray.init(words, hexStrLength / 2);
                        }
                    };

                    /**
                     * Latin1 encoding strategy.
                     */
                    var Latin1 = C_enc.Latin1 = {
                        /**
                         * Converts a word array to a Latin1 string.
                         *
                         * @param {WordArray} wordArray The word array.
                         *
                         * @return {string} The Latin1 string.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
                         */
                        stringify: function (wordArray) {
                            // Shortcuts
                            var words = wordArray.words;
                            var sigBytes = wordArray.sigBytes;

                            // Convert
                            var latin1Chars = [];
                            for (var i = 0; i < sigBytes; i++) {
                                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                                latin1Chars.push(String.fromCharCode(bite));
                            }

                            return latin1Chars.join('');
                        },

                        /**
                         * Converts a Latin1 string to a word array.
                         *
                         * @param {string} latin1Str The Latin1 string.
                         *
                         * @return {WordArray} The word array.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
                         */
                        parse: function (latin1Str) {
                            // Shortcut
                            var latin1StrLength = latin1Str.length;

                            // Convert
                            var words = [];
                            for (var i = 0; i < latin1StrLength; i++) {
                                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
                            }

                            return new WordArray.init(words, latin1StrLength);
                        }
                    };

                    /**
                     * UTF-8 encoding strategy.
                     */
                    var Utf8 = C_enc.Utf8 = {
                        /**
                         * Converts a word array to a UTF-8 string.
                         *
                         * @param {WordArray} wordArray The word array.
                         *
                         * @return {string} The UTF-8 string.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
                         */
                        stringify: function (wordArray) {
                            try {
                                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
                            } catch (e) {
                                throw new Error('Malformed UTF-8 data');
                            }
                        },

                        /**
                         * Converts a UTF-8 string to a word array.
                         *
                         * @param {string} utf8Str The UTF-8 string.
                         *
                         * @return {WordArray} The word array.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
                         */
                        parse: function (utf8Str) {
                            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
                        }
                    };

                    /**
                     * Abstract buffered block algorithm template.
                     *
                     * The property blockSize must be implemented in a concrete subtype.
                     *
                     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
                     */
                    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
                        /**
                         * Resets this block algorithm's data buffer to its initial state.
                         *
                         * @example
                         *
                         *     bufferedBlockAlgorithm.reset();
                         */
                        reset: function () {
                            // Initial values
                            this._data = new WordArray.init();
                            this._nDataBytes = 0;
                        },

                        /**
                         * Adds new data to this block algorithm's buffer.
                         *
                         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
                         *
                         * @example
                         *
                         *     bufferedBlockAlgorithm._append('data');
                         *     bufferedBlockAlgorithm._append(wordArray);
                         */
                        _append: function (data) {
                            // Convert string to WordArray, else assume WordArray already
                            if (typeof data == 'string') {
                                data = Utf8.parse(data);
                            }

                            // Append
                            this._data.concat(data);
                            this._nDataBytes += data.sigBytes;
                        },

                        /**
                         * Processes available data blocks.
                         *
                         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
                         *
                         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
                         *
                         * @return {WordArray} The processed data.
                         *
                         * @example
                         *
                         *     var processedData = bufferedBlockAlgorithm._process();
                         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
                         */
                        _process: function (doFlush) {
                            var processedWords;

                            // Shortcuts
                            var data = this._data;
                            var dataWords = data.words;
                            var dataSigBytes = data.sigBytes;
                            var blockSize = this.blockSize;
                            var blockSizeBytes = blockSize * 4;

                            // Count blocks ready
                            var nBlocksReady = dataSigBytes / blockSizeBytes;
                            if (doFlush) {
                                // Round up to include partial blocks
                                nBlocksReady = Math.ceil(nBlocksReady);
                            } else {
                                // Round down to include only full blocks,
                                // less the number of blocks that must remain in the buffer
                                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
                            }

                            // Count words ready
                            var nWordsReady = nBlocksReady * blockSize;

                            // Count bytes ready
                            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

                            // Process blocks
                            if (nWordsReady) {
                                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                                    // Perform concrete-algorithm logic
                                    this._doProcessBlock(dataWords, offset);
                                }

                                // Remove processed words
                                processedWords = dataWords.splice(0, nWordsReady);
                                data.sigBytes -= nBytesReady;
                            }

                            // Return processed words
                            return new WordArray.init(processedWords, nBytesReady);
                        },

                        /**
                         * Creates a copy of this object.
                         *
                         * @return {Object} The clone.
                         *
                         * @example
                         *
                         *     var clone = bufferedBlockAlgorithm.clone();
                         */
                        clone: function () {
                            var clone = Base.clone.call(this);
                            clone._data = this._data.clone();

                            return clone;
                        },

                        _minBufferSize: 0
                    });

                    /**
                     * Abstract hasher template.
                     *
                     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
                     */
                    C_lib.Hasher = BufferedBlockAlgorithm.extend({
                        /**
                         * Configuration options.
                         */
                        cfg: Base.extend(),

                        /**
                         * Initializes a newly created hasher.
                         *
                         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
                         *
                         * @example
                         *
                         *     var hasher = CryptoJS.algo.SHA256.create();
                         */
                        init: function (cfg) {
                            // Apply config defaults
                            this.cfg = this.cfg.extend(cfg);

                            // Set initial values
                            this.reset();
                        },

                        /**
                         * Resets this hasher to its initial state.
                         *
                         * @example
                         *
                         *     hasher.reset();
                         */
                        reset: function () {
                            // Reset data buffer
                            BufferedBlockAlgorithm.reset.call(this);

                            // Perform concrete-hasher logic
                            this._doReset();
                        },

                        /**
                         * Updates this hasher with a message.
                         *
                         * @param {WordArray|string} messageUpdate The message to append.
                         *
                         * @return {Hasher} This hasher.
                         *
                         * @example
                         *
                         *     hasher.update('message');
                         *     hasher.update(wordArray);
                         */
                        update: function (messageUpdate) {
                            // Append
                            this._append(messageUpdate);

                            // Update the hash
                            this._process();

                            // Chainable
                            return this;
                        },

                        /**
                         * Finalizes the hash computation.
                         * Note that the finalize operation is effectively a destructive, read-once operation.
                         *
                         * @param {WordArray|string} messageUpdate (Optional) A final message update.
                         *
                         * @return {WordArray} The hash.
                         *
                         * @example
                         *
                         *     var hash = hasher.finalize();
                         *     var hash = hasher.finalize('message');
                         *     var hash = hasher.finalize(wordArray);
                         */
                        finalize: function (messageUpdate) {
                            // Final message update
                            if (messageUpdate) {
                                this._append(messageUpdate);
                            }

                            // Perform concrete-hasher logic
                            var hash = this._doFinalize();

                            return hash;
                        },

                        blockSize: 512 / 32,

                        /**
                         * Creates a shortcut function to a hasher's object interface.
                         *
                         * @param {Hasher} hasher The hasher to create a helper for.
                         *
                         * @return {Function} The shortcut function.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
                         */
                        _createHelper: function (hasher) {
                            return function (message, cfg) {
                                return new hasher.init(cfg).finalize(message);
                            };
                        },

                        /**
                         * Creates a shortcut function to the HMAC's object interface.
                         *
                         * @param {Hasher} hasher The hasher to use in this HMAC helper.
                         *
                         * @return {Function} The shortcut function.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
                         */
                        _createHmacHelper: function (hasher) {
                            return function (message, key) {
                                return new C_algo.HMAC.init(hasher, key).finalize(message);
                            };
                        }
                    });

                    /**
                     * Algorithm namespace.
                     */
                    var C_algo = C.algo = {};

                    return C;
                }(Math));


                return CryptoJS;

            }));
        }(core));
        return coreExports;
    }

    var x64CoreExports = {};
    var x64Core = {
        get exports() {
            return x64CoreExports;
        },
        set exports(v) {
            x64CoreExports = v;
        },
    };

    var hasRequiredX64Core;

    function requireX64Core() {
        if (hasRequiredX64Core) return x64CoreExports;
        hasRequiredX64Core = 1;
        (function (module, exports) {
            (function (root, factory) {
                {
                    // CommonJS
                    module.exports = factory(requireCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function (undefined$1) {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var Base = C_lib.Base;
                    var X32WordArray = C_lib.WordArray;

                    /**
                     * x64 namespace.
                     */
                    var C_x64 = C.x64 = {};

                    /**
                     * A 64-bit word.
                     */
                    C_x64.Word = Base.extend({
                        /**
                         * Initializes a newly created 64-bit word.
                         *
                         * @param {number} high The high 32 bits.
                         * @param {number} low The low 32 bits.
                         *
                         * @example
                         *
                         *     var x64Word = CryptoJS.x64.Word.create(0x00010203, 0x04050607);
                         */
                        init: function (high, low) {
                            this.high = high;
                            this.low = low;
                        }

                        /**
                         * Bitwise NOTs this word.
                         *
                         * @return {X64Word} A new x64-Word object after negating.
                         *
                         * @example
                         *
                         *     var negated = x64Word.not();
                         */
                        // not: function () {
                        // var high = ~this.high;
                        // var low = ~this.low;

                        // return X64Word.create(high, low);
                        // },

                        /**
                         * Bitwise ANDs this word with the passed word.
                         *
                         * @param {X64Word} word The x64-Word to AND with this word.
                         *
                         * @return {X64Word} A new x64-Word object after ANDing.
                         *
                         * @example
                         *
                         *     var anded = x64Word.and(anotherX64Word);
                         */
                        // and: function (word) {
                        // var high = this.high & word.high;
                        // var low = this.low & word.low;

                        // return X64Word.create(high, low);
                        // },

                        /**
                         * Bitwise ORs this word with the passed word.
                         *
                         * @param {X64Word} word The x64-Word to OR with this word.
                         *
                         * @return {X64Word} A new x64-Word object after ORing.
                         *
                         * @example
                         *
                         *     var ored = x64Word.or(anotherX64Word);
                         */
                        // or: function (word) {
                        // var high = this.high | word.high;
                        // var low = this.low | word.low;

                        // return X64Word.create(high, low);
                        // },

                        /**
                         * Bitwise XORs this word with the passed word.
                         *
                         * @param {X64Word} word The x64-Word to XOR with this word.
                         *
                         * @return {X64Word} A new x64-Word object after XORing.
                         *
                         * @example
                         *
                         *     var xored = x64Word.xor(anotherX64Word);
                         */
                        // xor: function (word) {
                        // var high = this.high ^ word.high;
                        // var low = this.low ^ word.low;

                        // return X64Word.create(high, low);
                        // },

                        /**
                         * Shifts this word n bits to the left.
                         *
                         * @param {number} n The number of bits to shift.
                         *
                         * @return {X64Word} A new x64-Word object after shifting.
                         *
                         * @example
                         *
                         *     var shifted = x64Word.shiftL(25);
                         */
                        // shiftL: function (n) {
                        // if (n < 32) {
                        // var high = (this.high << n) | (this.low >>> (32 - n));
                        // var low = this.low << n;
                        // } else {
                        // var high = this.low << (n - 32);
                        // var low = 0;
                        // }

                        // return X64Word.create(high, low);
                        // },

                        /**
                         * Shifts this word n bits to the right.
                         *
                         * @param {number} n The number of bits to shift.
                         *
                         * @return {X64Word} A new x64-Word object after shifting.
                         *
                         * @example
                         *
                         *     var shifted = x64Word.shiftR(7);
                         */
                        // shiftR: function (n) {
                        // if (n < 32) {
                        // var low = (this.low >>> n) | (this.high << (32 - n));
                        // var high = this.high >>> n;
                        // } else {
                        // var low = this.high >>> (n - 32);
                        // var high = 0;
                        // }

                        // return X64Word.create(high, low);
                        // },

                        /**
                         * Rotates this word n bits to the left.
                         *
                         * @param {number} n The number of bits to rotate.
                         *
                         * @return {X64Word} A new x64-Word object after rotating.
                         *
                         * @example
                         *
                         *     var rotated = x64Word.rotL(25);
                         */
                        // rotL: function (n) {
                        // return this.shiftL(n).or(this.shiftR(64 - n));
                        // },

                        /**
                         * Rotates this word n bits to the right.
                         *
                         * @param {number} n The number of bits to rotate.
                         *
                         * @return {X64Word} A new x64-Word object after rotating.
                         *
                         * @example
                         *
                         *     var rotated = x64Word.rotR(7);
                         */
                        // rotR: function (n) {
                        // return this.shiftR(n).or(this.shiftL(64 - n));
                        // },

                        /**
                         * Adds this word with the passed word.
                         *
                         * @param {X64Word} word The x64-Word to add with this word.
                         *
                         * @return {X64Word} A new x64-Word object after adding.
                         *
                         * @example
                         *
                         *     var added = x64Word.add(anotherX64Word);
                         */
                        // add: function (word) {
                        // var low = (this.low + word.low) | 0;
                        // var carry = (low >>> 0) < (this.low >>> 0) ? 1 : 0;
                        // var high = (this.high + word.high + carry) | 0;

                        // return X64Word.create(high, low);
                        // }
                    });

                    /**
                     * An array of 64-bit words.
                     *
                     * @property {Array} words The array of CryptoJS.x64.Word objects.
                     * @property {number} sigBytes The number of significant bytes in this word array.
                     */
                    C_x64.WordArray = Base.extend({
                        /**
                         * Initializes a newly created word array.
                         *
                         * @param {Array} words (Optional) An array of CryptoJS.x64.Word objects.
                         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
                         *
                         * @example
                         *
                         *     var wordArray = CryptoJS.x64.WordArray.create();
                         *
                         *     var wordArray = CryptoJS.x64.WordArray.create([
                         *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
                         *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
                         *     ]);
                         *
                         *     var wordArray = CryptoJS.x64.WordArray.create([
                         *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
                         *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
                         *     ], 10);
                         */
                        init: function (words, sigBytes) {
                            words = this.words = words || [];

                            if (sigBytes != undefined$1) {
                                this.sigBytes = sigBytes;
                            } else {
                                this.sigBytes = words.length * 8;
                            }
                        },

                        /**
                         * Converts this 64-bit word array to a 32-bit word array.
                         *
                         * @return {CryptoJS.lib.WordArray} This word array's data as a 32-bit word array.
                         *
                         * @example
                         *
                         *     var x32WordArray = x64WordArray.toX32();
                         */
                        toX32: function () {
                            // Shortcuts
                            var x64Words = this.words;
                            var x64WordsLength = x64Words.length;

                            // Convert
                            var x32Words = [];
                            for (var i = 0; i < x64WordsLength; i++) {
                                var x64Word = x64Words[i];
                                x32Words.push(x64Word.high);
                                x32Words.push(x64Word.low);
                            }

                            return X32WordArray.create(x32Words, this.sigBytes);
                        },

                        /**
                         * Creates a copy of this word array.
                         *
                         * @return {X64WordArray} The clone.
                         *
                         * @example
                         *
                         *     var clone = x64WordArray.clone();
                         */
                        clone: function () {
                            var clone = Base.clone.call(this);

                            // Clone "words" array
                            var words = clone.words = this.words.slice(0);

                            // Clone each X64Word object
                            var wordsLength = words.length;
                            for (var i = 0; i < wordsLength; i++) {
                                words[i] = words[i].clone();
                            }

                            return clone;
                        }
                    });
                }());


                return CryptoJS;

            }));
        }(x64Core));
        return x64CoreExports;
    }

    var libTypedarraysExports = {};
    var libTypedarrays = {
        get exports() {
            return libTypedarraysExports;
        },
        set exports(v) {
            libTypedarraysExports = v;
        },
    };

    var hasRequiredLibTypedarrays;

    function requireLibTypedarrays() {
        if (hasRequiredLibTypedarrays) return libTypedarraysExports;
        hasRequiredLibTypedarrays = 1;
        (function (module, exports) {
            (function (root, factory) {
                {
                    // CommonJS
                    module.exports = factory(requireCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Check if typed arrays are supported
                    if (typeof ArrayBuffer != 'function') {
                        return;
                    }

                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var WordArray = C_lib.WordArray;

                    // Reference original init
                    var superInit = WordArray.init;

                    // Augment WordArray.init to handle typed arrays
                    var subInit = WordArray.init = function (typedArray) {
                        // Convert buffers to uint8
                        if (typedArray instanceof ArrayBuffer) {
                            typedArray = new Uint8Array(typedArray);
                        }

                        // Convert other array views to uint8
                        if (
                            typedArray instanceof Int8Array ||
                            (typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray) ||
                            typedArray instanceof Int16Array ||
                            typedArray instanceof Uint16Array ||
                            typedArray instanceof Int32Array ||
                            typedArray instanceof Uint32Array ||
                            typedArray instanceof Float32Array ||
                            typedArray instanceof Float64Array
                        ) {
                            typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
                        }

                        // Handle Uint8Array
                        if (typedArray instanceof Uint8Array) {
                            // Shortcut
                            var typedArrayByteLength = typedArray.byteLength;

                            // Extract bytes
                            var words = [];
                            for (var i = 0; i < typedArrayByteLength; i++) {
                                words[i >>> 2] |= typedArray[i] << (24 - (i % 4) * 8);
                            }

                            // Initialize this word array
                            superInit.call(this, words, typedArrayByteLength);
                        } else {
                            // Else call normal init
                            superInit.apply(this, arguments);
                        }
                    };

                    subInit.prototype = WordArray;
                }());


                return CryptoJS.lib.WordArray;

            }));
        }(libTypedarrays));
        return libTypedarraysExports;
    }

    var encUtf16Exports = {};
    var encUtf16 = {
        get exports() {
            return encUtf16Exports;
        },
        set exports(v) {
            encUtf16Exports = v;
        },
    };

    var hasRequiredEncUtf16;

    function requireEncUtf16() {
        if (hasRequiredEncUtf16) return encUtf16Exports;
        hasRequiredEncUtf16 = 1;
        (function (module, exports) {
            (function (root, factory) {
                {
                    // CommonJS
                    module.exports = factory(requireCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var WordArray = C_lib.WordArray;
                    var C_enc = C.enc;

                    /**
                     * UTF-16 BE encoding strategy.
                     */
                    C_enc.Utf16 = C_enc.Utf16BE = {
                        /**
                         * Converts a word array to a UTF-16 BE string.
                         *
                         * @param {WordArray} wordArray The word array.
                         *
                         * @return {string} The UTF-16 BE string.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var utf16String = CryptoJS.enc.Utf16.stringify(wordArray);
                         */
                        stringify: function (wordArray) {
                            // Shortcuts
                            var words = wordArray.words;
                            var sigBytes = wordArray.sigBytes;

                            // Convert
                            var utf16Chars = [];
                            for (var i = 0; i < sigBytes; i += 2) {
                                var codePoint = (words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff;
                                utf16Chars.push(String.fromCharCode(codePoint));
                            }

                            return utf16Chars.join('');
                        },

                        /**
                         * Converts a UTF-16 BE string to a word array.
                         *
                         * @param {string} utf16Str The UTF-16 BE string.
                         *
                         * @return {WordArray} The word array.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var wordArray = CryptoJS.enc.Utf16.parse(utf16String);
                         */
                        parse: function (utf16Str) {
                            // Shortcut
                            var utf16StrLength = utf16Str.length;

                            // Convert
                            var words = [];
                            for (var i = 0; i < utf16StrLength; i++) {
                                words[i >>> 1] |= utf16Str.charCodeAt(i) << (16 - (i % 2) * 16);
                            }

                            return WordArray.create(words, utf16StrLength * 2);
                        }
                    };

                    /**
                     * UTF-16 LE encoding strategy.
                     */
                    C_enc.Utf16LE = {
                        /**
                         * Converts a word array to a UTF-16 LE string.
                         *
                         * @param {WordArray} wordArray The word array.
                         *
                         * @return {string} The UTF-16 LE string.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var utf16Str = CryptoJS.enc.Utf16LE.stringify(wordArray);
                         */
                        stringify: function (wordArray) {
                            // Shortcuts
                            var words = wordArray.words;
                            var sigBytes = wordArray.sigBytes;

                            // Convert
                            var utf16Chars = [];
                            for (var i = 0; i < sigBytes; i += 2) {
                                var codePoint = swapEndian((words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff);
                                utf16Chars.push(String.fromCharCode(codePoint));
                            }

                            return utf16Chars.join('');
                        },

                        /**
                         * Converts a UTF-16 LE string to a word array.
                         *
                         * @param {string} utf16Str The UTF-16 LE string.
                         *
                         * @return {WordArray} The word array.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var wordArray = CryptoJS.enc.Utf16LE.parse(utf16Str);
                         */
                        parse: function (utf16Str) {
                            // Shortcut
                            var utf16StrLength = utf16Str.length;

                            // Convert
                            var words = [];
                            for (var i = 0; i < utf16StrLength; i++) {
                                words[i >>> 1] |= swapEndian(utf16Str.charCodeAt(i) << (16 - (i % 2) * 16));
                            }

                            return WordArray.create(words, utf16StrLength * 2);
                        }
                    };

                    function swapEndian(word) {
                        return ((word << 8) & 0xff00ff00) | ((word >>> 8) & 0x00ff00ff);
                    }
                }());


                return CryptoJS.enc.Utf16;

            }));
        }(encUtf16));
        return encUtf16Exports;
    }

    var encBase64Exports = {};
    var encBase64 = {
        get exports() {
            return encBase64Exports;
        },
        set exports(v) {
            encBase64Exports = v;
        },
    };

    var hasRequiredEncBase64;

    function requireEncBase64() {
        if (hasRequiredEncBase64) return encBase64Exports;
        hasRequiredEncBase64 = 1;
        (function (module, exports) {
            (function (root, factory) {
                {
                    // CommonJS
                    module.exports = factory(requireCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var WordArray = C_lib.WordArray;
                    var C_enc = C.enc;

                    /**
                     * Base64 encoding strategy.
                     */
                    C_enc.Base64 = {
                        /**
                         * Converts a word array to a Base64 string.
                         *
                         * @param {WordArray} wordArray The word array.
                         *
                         * @return {string} The Base64 string.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
                         */
                        stringify: function (wordArray) {
                            // Shortcuts
                            var words = wordArray.words;
                            var sigBytes = wordArray.sigBytes;
                            var map = this._map;

                            // Clamp excess bits
                            wordArray.clamp();

                            // Convert
                            var base64Chars = [];
                            for (var i = 0; i < sigBytes; i += 3) {
                                var byte1 = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                                var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
                                var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

                                var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

                                for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
                                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
                                }
                            }

                            // Add padding
                            var paddingChar = map.charAt(64);
                            if (paddingChar) {
                                while (base64Chars.length % 4) {
                                    base64Chars.push(paddingChar);
                                }
                            }

                            return base64Chars.join('');
                        },

                        /**
                         * Converts a Base64 string to a word array.
                         *
                         * @param {string} base64Str The Base64 string.
                         *
                         * @return {WordArray} The word array.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
                         */
                        parse: function (base64Str) {
                            // Shortcuts
                            var base64StrLength = base64Str.length;
                            var map = this._map;
                            var reverseMap = this._reverseMap;

                            if (!reverseMap) {
                                reverseMap = this._reverseMap = [];
                                for (var j = 0; j < map.length; j++) {
                                    reverseMap[map.charCodeAt(j)] = j;
                                }
                            }

                            // Ignore padding
                            var paddingChar = map.charAt(64);
                            if (paddingChar) {
                                var paddingIndex = base64Str.indexOf(paddingChar);
                                if (paddingIndex !== -1) {
                                    base64StrLength = paddingIndex;
                                }
                            }

                            // Convert
                            return parseLoop(base64Str, base64StrLength, reverseMap);

                        },

                        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
                    };

                    function parseLoop(base64Str, base64StrLength, reverseMap) {
                        var words = [];
                        var nBytes = 0;
                        for (var i = 0; i < base64StrLength; i++) {
                            if (i % 4) {
                                var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
                                var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
                                var bitsCombined = bits1 | bits2;
                                words[nBytes >>> 2] |= bitsCombined << (24 - (nBytes % 4) * 8);
                                nBytes++;
                            }
                        }
                        return WordArray.create(words, nBytes);
                    }
                }());


                return CryptoJS.enc.Base64;

            }));
        }(encBase64));
        return encBase64Exports;
    }

    var encBase64urlExports = {};
    var encBase64url = {
        get exports() {
            return encBase64urlExports;
        },
        set exports(v) {
            encBase64urlExports = v;
        },
    };

    var hasRequiredEncBase64url;

    function requireEncBase64url() {
        if (hasRequiredEncBase64url) return encBase64urlExports;
        hasRequiredEncBase64url = 1;
        (function (module, exports) {
            (function (root, factory) {
                {
                    // CommonJS
                    module.exports = factory(requireCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var WordArray = C_lib.WordArray;
                    var C_enc = C.enc;

                    /**
                     * Base64url encoding strategy.
                     */
                    C_enc.Base64url = {
                        /**
                         * Converts a word array to a Base64url string.
                         *
                         * @param {WordArray} wordArray The word array.
                         *
                         * @param {boolean} urlSafe Whether to use url safe
                         *
                         * @return {string} The Base64url string.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var base64String = CryptoJS.enc.Base64url.stringify(wordArray);
                         */
                        stringify: function (wordArray, urlSafe = true) {
                            // Shortcuts
                            var words = wordArray.words;
                            var sigBytes = wordArray.sigBytes;
                            var map = urlSafe ? this._safe_map : this._map;

                            // Clamp excess bits
                            wordArray.clamp();

                            // Convert
                            var base64Chars = [];
                            for (var i = 0; i < sigBytes; i += 3) {
                                var byte1 = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                                var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
                                var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

                                var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

                                for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
                                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
                                }
                            }

                            // Add padding
                            var paddingChar = map.charAt(64);
                            if (paddingChar) {
                                while (base64Chars.length % 4) {
                                    base64Chars.push(paddingChar);
                                }
                            }

                            return base64Chars.join('');
                        },

                        /**
                         * Converts a Base64url string to a word array.
                         *
                         * @param {string} base64Str The Base64url string.
                         *
                         * @param {boolean} urlSafe Whether to use url safe
                         *
                         * @return {WordArray} The word array.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var wordArray = CryptoJS.enc.Base64url.parse(base64String);
                         */
                        parse: function (base64Str, urlSafe = true) {
                            // Shortcuts
                            var base64StrLength = base64Str.length;
                            var map = urlSafe ? this._safe_map : this._map;
                            var reverseMap = this._reverseMap;

                            if (!reverseMap) {
                                reverseMap = this._reverseMap = [];
                                for (var j = 0; j < map.length; j++) {
                                    reverseMap[map.charCodeAt(j)] = j;
                                }
                            }

                            // Ignore padding
                            var paddingChar = map.charAt(64);
                            if (paddingChar) {
                                var paddingIndex = base64Str.indexOf(paddingChar);
                                if (paddingIndex !== -1) {
                                    base64StrLength = paddingIndex;
                                }
                            }

                            // Convert
                            return parseLoop(base64Str, base64StrLength, reverseMap);

                        },

                        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
                        _safe_map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
                    };

                    function parseLoop(base64Str, base64StrLength, reverseMap) {
                        var words = [];
                        var nBytes = 0;
                        for (var i = 0; i < base64StrLength; i++) {
                            if (i % 4) {
                                var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
                                var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
                                var bitsCombined = bits1 | bits2;
                                words[nBytes >>> 2] |= bitsCombined << (24 - (nBytes % 4) * 8);
                                nBytes++;
                            }
                        }
                        return WordArray.create(words, nBytes);
                    }
                }());

                return CryptoJS.enc.Base64url;

            }));
        }(encBase64url));
        return encBase64urlExports;
    }

    var md5Exports = {};
    var md5 = {
        get exports() {
            return md5Exports;
        },
        set exports(v) {
            md5Exports = v;
        },
    };

    var hasRequiredMd5;

    function requireMd5() {
        if (hasRequiredMd5) return md5Exports;
        hasRequiredMd5 = 1;
        (function (module, exports) {
            (function (root, factory) {
                {
                    // CommonJS
                    module.exports = factory(requireCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function (Math) {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var WordArray = C_lib.WordArray;
                    var Hasher = C_lib.Hasher;
                    var C_algo = C.algo;

                    // Constants table
                    var T = [];

                    // Compute constants
                    (function () {
                        for (var i = 0; i < 64; i++) {
                            T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
                        }
                    }());

                    /**
                     * MD5 hash algorithm.
                     */
                    var MD5 = C_algo.MD5 = Hasher.extend({
                        _doReset: function () {
                            this._hash = new WordArray.init([
                                0x67452301, 0xefcdab89,
                                0x98badcfe, 0x10325476
                            ]);
                        },

                        _doProcessBlock: function (M, offset) {
                            // Swap endian
                            for (var i = 0; i < 16; i++) {
                                // Shortcuts
                                var offset_i = offset + i;
                                var M_offset_i = M[offset_i];

                                M[offset_i] = (
                                    (((M_offset_i << 8) | (M_offset_i >>> 24)) & 0x00ff00ff) |
                                    (((M_offset_i << 24) | (M_offset_i >>> 8)) & 0xff00ff00)
                                );
                            }

                            // Shortcuts
                            var H = this._hash.words;

                            var M_offset_0 = M[offset + 0];
                            var M_offset_1 = M[offset + 1];
                            var M_offset_2 = M[offset + 2];
                            var M_offset_3 = M[offset + 3];
                            var M_offset_4 = M[offset + 4];
                            var M_offset_5 = M[offset + 5];
                            var M_offset_6 = M[offset + 6];
                            var M_offset_7 = M[offset + 7];
                            var M_offset_8 = M[offset + 8];
                            var M_offset_9 = M[offset + 9];
                            var M_offset_10 = M[offset + 10];
                            var M_offset_11 = M[offset + 11];
                            var M_offset_12 = M[offset + 12];
                            var M_offset_13 = M[offset + 13];
                            var M_offset_14 = M[offset + 14];
                            var M_offset_15 = M[offset + 15];

                            // Working varialbes
                            var a = H[0];
                            var b = H[1];
                            var c = H[2];
                            var d = H[3];

                            // Computation
                            a = FF(a, b, c, d, M_offset_0, 7, T[0]);
                            d = FF(d, a, b, c, M_offset_1, 12, T[1]);
                            c = FF(c, d, a, b, M_offset_2, 17, T[2]);
                            b = FF(b, c, d, a, M_offset_3, 22, T[3]);
                            a = FF(a, b, c, d, M_offset_4, 7, T[4]);
                            d = FF(d, a, b, c, M_offset_5, 12, T[5]);
                            c = FF(c, d, a, b, M_offset_6, 17, T[6]);
                            b = FF(b, c, d, a, M_offset_7, 22, T[7]);
                            a = FF(a, b, c, d, M_offset_8, 7, T[8]);
                            d = FF(d, a, b, c, M_offset_9, 12, T[9]);
                            c = FF(c, d, a, b, M_offset_10, 17, T[10]);
                            b = FF(b, c, d, a, M_offset_11, 22, T[11]);
                            a = FF(a, b, c, d, M_offset_12, 7, T[12]);
                            d = FF(d, a, b, c, M_offset_13, 12, T[13]);
                            c = FF(c, d, a, b, M_offset_14, 17, T[14]);
                            b = FF(b, c, d, a, M_offset_15, 22, T[15]);

                            a = GG(a, b, c, d, M_offset_1, 5, T[16]);
                            d = GG(d, a, b, c, M_offset_6, 9, T[17]);
                            c = GG(c, d, a, b, M_offset_11, 14, T[18]);
                            b = GG(b, c, d, a, M_offset_0, 20, T[19]);
                            a = GG(a, b, c, d, M_offset_5, 5, T[20]);
                            d = GG(d, a, b, c, M_offset_10, 9, T[21]);
                            c = GG(c, d, a, b, M_offset_15, 14, T[22]);
                            b = GG(b, c, d, a, M_offset_4, 20, T[23]);
                            a = GG(a, b, c, d, M_offset_9, 5, T[24]);
                            d = GG(d, a, b, c, M_offset_14, 9, T[25]);
                            c = GG(c, d, a, b, M_offset_3, 14, T[26]);
                            b = GG(b, c, d, a, M_offset_8, 20, T[27]);
                            a = GG(a, b, c, d, M_offset_13, 5, T[28]);
                            d = GG(d, a, b, c, M_offset_2, 9, T[29]);
                            c = GG(c, d, a, b, M_offset_7, 14, T[30]);
                            b = GG(b, c, d, a, M_offset_12, 20, T[31]);

                            a = HH(a, b, c, d, M_offset_5, 4, T[32]);
                            d = HH(d, a, b, c, M_offset_8, 11, T[33]);
                            c = HH(c, d, a, b, M_offset_11, 16, T[34]);
                            b = HH(b, c, d, a, M_offset_14, 23, T[35]);
                            a = HH(a, b, c, d, M_offset_1, 4, T[36]);
                            d = HH(d, a, b, c, M_offset_4, 11, T[37]);
                            c = HH(c, d, a, b, M_offset_7, 16, T[38]);
                            b = HH(b, c, d, a, M_offset_10, 23, T[39]);
                            a = HH(a, b, c, d, M_offset_13, 4, T[40]);
                            d = HH(d, a, b, c, M_offset_0, 11, T[41]);
                            c = HH(c, d, a, b, M_offset_3, 16, T[42]);
                            b = HH(b, c, d, a, M_offset_6, 23, T[43]);
                            a = HH(a, b, c, d, M_offset_9, 4, T[44]);
                            d = HH(d, a, b, c, M_offset_12, 11, T[45]);
                            c = HH(c, d, a, b, M_offset_15, 16, T[46]);
                            b = HH(b, c, d, a, M_offset_2, 23, T[47]);

                            a = II(a, b, c, d, M_offset_0, 6, T[48]);
                            d = II(d, a, b, c, M_offset_7, 10, T[49]);
                            c = II(c, d, a, b, M_offset_14, 15, T[50]);
                            b = II(b, c, d, a, M_offset_5, 21, T[51]);
                            a = II(a, b, c, d, M_offset_12, 6, T[52]);
                            d = II(d, a, b, c, M_offset_3, 10, T[53]);
                            c = II(c, d, a, b, M_offset_10, 15, T[54]);
                            b = II(b, c, d, a, M_offset_1, 21, T[55]);
                            a = II(a, b, c, d, M_offset_8, 6, T[56]);
                            d = II(d, a, b, c, M_offset_15, 10, T[57]);
                            c = II(c, d, a, b, M_offset_6, 15, T[58]);
                            b = II(b, c, d, a, M_offset_13, 21, T[59]);
                            a = II(a, b, c, d, M_offset_4, 6, T[60]);
                            d = II(d, a, b, c, M_offset_11, 10, T[61]);
                            c = II(c, d, a, b, M_offset_2, 15, T[62]);
                            b = II(b, c, d, a, M_offset_9, 21, T[63]);

                            // Intermediate hash value
                            H[0] = (H[0] + a) | 0;
                            H[1] = (H[1] + b) | 0;
                            H[2] = (H[2] + c) | 0;
                            H[3] = (H[3] + d) | 0;
                        },

                        _doFinalize: function () {
                            // Shortcuts
                            var data = this._data;
                            var dataWords = data.words;

                            var nBitsTotal = this._nDataBytes * 8;
                            var nBitsLeft = data.sigBytes * 8;

                            // Add padding
                            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);

                            var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
                            var nBitsTotalL = nBitsTotal;
                            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
                                (((nBitsTotalH << 8) | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
                                (((nBitsTotalH << 24) | (nBitsTotalH >>> 8)) & 0xff00ff00)
                            );
                            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
                                (((nBitsTotalL << 8) | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
                                (((nBitsTotalL << 24) | (nBitsTotalL >>> 8)) & 0xff00ff00)
                            );

                            data.sigBytes = (dataWords.length + 1) * 4;

                            // Hash final blocks
                            this._process();

                            // Shortcuts
                            var hash = this._hash;
                            var H = hash.words;

                            // Swap endian
                            for (var i = 0; i < 4; i++) {
                                // Shortcut
                                var H_i = H[i];

                                H[i] = (((H_i << 8) | (H_i >>> 24)) & 0x00ff00ff) |
                                    (((H_i << 24) | (H_i >>> 8)) & 0xff00ff00);
                            }

                            // Return final computed hash
                            return hash;
                        },

                        clone: function () {
                            var clone = Hasher.clone.call(this);
                            clone._hash = this._hash.clone();

                            return clone;
                        }
                    });

                    function FF(a, b, c, d, x, s, t) {
                        var n = a + ((b & c) | (~b & d)) + x + t;
                        return ((n << s) | (n >>> (32 - s))) + b;
                    }

                    function GG(a, b, c, d, x, s, t) {
                        var n = a + ((b & d) | (c & ~d)) + x + t;
                        return ((n << s) | (n >>> (32 - s))) + b;
                    }

                    function HH(a, b, c, d, x, s, t) {
                        var n = a + (b ^ c ^ d) + x + t;
                        return ((n << s) | (n >>> (32 - s))) + b;
                    }

                    function II(a, b, c, d, x, s, t) {
                        var n = a + (c ^ (b | ~d)) + x + t;
                        return ((n << s) | (n >>> (32 - s))) + b;
                    }

                    /**
                     * Shortcut function to the hasher's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     *
                     * @return {WordArray} The hash.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hash = CryptoJS.MD5('message');
                     *     var hash = CryptoJS.MD5(wordArray);
                     */
                    C.MD5 = Hasher._createHelper(MD5);

                    /**
                     * Shortcut function to the HMAC's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     * @param {WordArray|string} key The secret key.
                     *
                     * @return {WordArray} The HMAC.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hmac = CryptoJS.HmacMD5(message, key);
                     */
                    C.HmacMD5 = Hasher._createHmacHelper(MD5);
                }(Math));


                return CryptoJS.MD5;

            }));
        }(md5));
        return md5Exports;
    }

    var sha1Exports = {};
    var sha1 = {
        get exports() {
            return sha1Exports;
        },
        set exports(v) {
            sha1Exports = v;
        },
    };

    var hasRequiredSha1;

    function requireSha1() {
        if (hasRequiredSha1) return sha1Exports;
        hasRequiredSha1 = 1;
        (function (module, exports) {
            (function (root, factory) {
                {
                    // CommonJS
                    module.exports = factory(requireCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var WordArray = C_lib.WordArray;
                    var Hasher = C_lib.Hasher;
                    var C_algo = C.algo;

                    // Reusable object
                    var W = [];

                    /**
                     * SHA-1 hash algorithm.
                     */
                    var SHA1 = C_algo.SHA1 = Hasher.extend({
                        _doReset: function () {
                            this._hash = new WordArray.init([
                                0x67452301, 0xefcdab89,
                                0x98badcfe, 0x10325476,
                                0xc3d2e1f0
                            ]);
                        },

                        _doProcessBlock: function (M, offset) {
                            // Shortcut
                            var H = this._hash.words;

                            // Working variables
                            var a = H[0];
                            var b = H[1];
                            var c = H[2];
                            var d = H[3];
                            var e = H[4];

                            // Computation
                            for (var i = 0; i < 80; i++) {
                                if (i < 16) {
                                    W[i] = M[offset + i] | 0;
                                } else {
                                    var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
                                    W[i] = (n << 1) | (n >>> 31);
                                }

                                var t = ((a << 5) | (a >>> 27)) + e + W[i];
                                if (i < 20) {
                                    t += ((b & c) | (~b & d)) + 0x5a827999;
                                } else if (i < 40) {
                                    t += (b ^ c ^ d) + 0x6ed9eba1;
                                } else if (i < 60) {
                                    t += ((b & c) | (b & d) | (c & d)) - 0x70e44324;
                                } else /* if (i < 80) */ {
                                    t += (b ^ c ^ d) - 0x359d3e2a;
                                }

                                e = d;
                                d = c;
                                c = (b << 30) | (b >>> 2);
                                b = a;
                                a = t;
                            }

                            // Intermediate hash value
                            H[0] = (H[0] + a) | 0;
                            H[1] = (H[1] + b) | 0;
                            H[2] = (H[2] + c) | 0;
                            H[3] = (H[3] + d) | 0;
                            H[4] = (H[4] + e) | 0;
                        },

                        _doFinalize: function () {
                            // Shortcuts
                            var data = this._data;
                            var dataWords = data.words;

                            var nBitsTotal = this._nDataBytes * 8;
                            var nBitsLeft = data.sigBytes * 8;

                            // Add padding
                            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
                            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
                            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
                            data.sigBytes = dataWords.length * 4;

                            // Hash final blocks
                            this._process();

                            // Return final computed hash
                            return this._hash;
                        },

                        clone: function () {
                            var clone = Hasher.clone.call(this);
                            clone._hash = this._hash.clone();

                            return clone;
                        }
                    });

                    /**
                     * Shortcut function to the hasher's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     *
                     * @return {WordArray} The hash.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hash = CryptoJS.SHA1('message');
                     *     var hash = CryptoJS.SHA1(wordArray);
                     */
                    C.SHA1 = Hasher._createHelper(SHA1);

                    /**
                     * Shortcut function to the HMAC's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     * @param {WordArray|string} key The secret key.
                     *
                     * @return {WordArray} The HMAC.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hmac = CryptoJS.HmacSHA1(message, key);
                     */
                    C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
                }());


                return CryptoJS.SHA1;

            }));
        }(sha1));
        return sha1Exports;
    }

    var sha256Exports = {};
    var sha256 = {
        get exports() {
            return sha256Exports;
        },
        set exports(v) {
            sha256Exports = v;
        },
    };

    var hasRequiredSha256;

    function requireSha256() {
        if (hasRequiredSha256) return sha256Exports;
        hasRequiredSha256 = 1;
        (function (module, exports) {
            (function (root, factory) {
                {
                    // CommonJS
                    module.exports = factory(requireCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function (Math) {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var WordArray = C_lib.WordArray;
                    var Hasher = C_lib.Hasher;
                    var C_algo = C.algo;

                    // Initialization and round constants tables
                    var H = [];
                    var K = [];

                    // Compute constants
                    (function () {
                        function isPrime(n) {
                            var sqrtN = Math.sqrt(n);
                            for (var factor = 2; factor <= sqrtN; factor++) {
                                if (!(n % factor)) {
                                    return false;
                                }
                            }

                            return true;
                        }

                        function getFractionalBits(n) {
                            return ((n - (n | 0)) * 0x100000000) | 0;
                        }

                        var n = 2;
                        var nPrime = 0;
                        while (nPrime < 64) {
                            if (isPrime(n)) {
                                if (nPrime < 8) {
                                    H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
                                }
                                K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

                                nPrime++;
                            }

                            n++;
                        }
                    }());

                    // Reusable object
                    var W = [];

                    /**
                     * SHA-256 hash algorithm.
                     */
                    var SHA256 = C_algo.SHA256 = Hasher.extend({
                        _doReset: function () {
                            this._hash = new WordArray.init(H.slice(0));
                        },

                        _doProcessBlock: function (M, offset) {
                            // Shortcut
                            var H = this._hash.words;

                            // Working variables
                            var a = H[0];
                            var b = H[1];
                            var c = H[2];
                            var d = H[3];
                            var e = H[4];
                            var f = H[5];
                            var g = H[6];
                            var h = H[7];

                            // Computation
                            for (var i = 0; i < 64; i++) {
                                if (i < 16) {
                                    W[i] = M[offset + i] | 0;
                                } else {
                                    var gamma0x = W[i - 15];
                                    var gamma0 = ((gamma0x << 25) | (gamma0x >>> 7)) ^
                                        ((gamma0x << 14) | (gamma0x >>> 18)) ^
                                        (gamma0x >>> 3);

                                    var gamma1x = W[i - 2];
                                    var gamma1 = ((gamma1x << 15) | (gamma1x >>> 17)) ^
                                        ((gamma1x << 13) | (gamma1x >>> 19)) ^
                                        (gamma1x >>> 10);

                                    W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
                                }

                                var ch = (e & f) ^ (~e & g);
                                var maj = (a & b) ^ (a & c) ^ (b & c);

                                var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
                                var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7) | (e >>> 25));

                                var t1 = h + sigma1 + ch + K[i] + W[i];
                                var t2 = sigma0 + maj;

                                h = g;
                                g = f;
                                f = e;
                                e = (d + t1) | 0;
                                d = c;
                                c = b;
                                b = a;
                                a = (t1 + t2) | 0;
                            }

                            // Intermediate hash value
                            H[0] = (H[0] + a) | 0;
                            H[1] = (H[1] + b) | 0;
                            H[2] = (H[2] + c) | 0;
                            H[3] = (H[3] + d) | 0;
                            H[4] = (H[4] + e) | 0;
                            H[5] = (H[5] + f) | 0;
                            H[6] = (H[6] + g) | 0;
                            H[7] = (H[7] + h) | 0;
                        },

                        _doFinalize: function () {
                            // Shortcuts
                            var data = this._data;
                            var dataWords = data.words;

                            var nBitsTotal = this._nDataBytes * 8;
                            var nBitsLeft = data.sigBytes * 8;

                            // Add padding
                            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
                            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
                            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
                            data.sigBytes = dataWords.length * 4;

                            // Hash final blocks
                            this._process();

                            // Return final computed hash
                            return this._hash;
                        },

                        clone: function () {
                            var clone = Hasher.clone.call(this);
                            clone._hash = this._hash.clone();

                            return clone;
                        }
                    });

                    /**
                     * Shortcut function to the hasher's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     *
                     * @return {WordArray} The hash.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hash = CryptoJS.SHA256('message');
                     *     var hash = CryptoJS.SHA256(wordArray);
                     */
                    C.SHA256 = Hasher._createHelper(SHA256);

                    /**
                     * Shortcut function to the HMAC's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     * @param {WordArray|string} key The secret key.
                     *
                     * @return {WordArray} The HMAC.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hmac = CryptoJS.HmacSHA256(message, key);
                     */
                    C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
                }(Math));


                return CryptoJS.SHA256;

            }));
        }(sha256));
        return sha256Exports;
    }

    var sha224Exports = {};
    var sha224 = {
        get exports() {
            return sha224Exports;
        },
        set exports(v) {
            sha224Exports = v;
        },
    };

    var hasRequiredSha224;

    function requireSha224() {
        if (hasRequiredSha224) return sha224Exports;
        hasRequiredSha224 = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireSha256());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var WordArray = C_lib.WordArray;
                    var C_algo = C.algo;
                    var SHA256 = C_algo.SHA256;

                    /**
                     * SHA-224 hash algorithm.
                     */
                    var SHA224 = C_algo.SHA224 = SHA256.extend({
                        _doReset: function () {
                            this._hash = new WordArray.init([
                                0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
                                0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
                            ]);
                        },

                        _doFinalize: function () {
                            var hash = SHA256._doFinalize.call(this);

                            hash.sigBytes -= 4;

                            return hash;
                        }
                    });

                    /**
                     * Shortcut function to the hasher's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     *
                     * @return {WordArray} The hash.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hash = CryptoJS.SHA224('message');
                     *     var hash = CryptoJS.SHA224(wordArray);
                     */
                    C.SHA224 = SHA256._createHelper(SHA224);

                    /**
                     * Shortcut function to the HMAC's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     * @param {WordArray|string} key The secret key.
                     *
                     * @return {WordArray} The HMAC.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hmac = CryptoJS.HmacSHA224(message, key);
                     */
                    C.HmacSHA224 = SHA256._createHmacHelper(SHA224);
                }());


                return CryptoJS.SHA224;

            }));
        }(sha224));
        return sha224Exports;
    }

    var sha512Exports = {};
    var sha512 = {
        get exports() {
            return sha512Exports;
        },
        set exports(v) {
            sha512Exports = v;
        },
    };

    var hasRequiredSha512;

    function requireSha512() {
        if (hasRequiredSha512) return sha512Exports;
        hasRequiredSha512 = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireX64Core());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var Hasher = C_lib.Hasher;
                    var C_x64 = C.x64;
                    var X64Word = C_x64.Word;
                    var X64WordArray = C_x64.WordArray;
                    var C_algo = C.algo;

                    function X64Word_create() {
                        return X64Word.create.apply(X64Word, arguments);
                    }

                    // Constants
                    var K = [
                        X64Word_create(0x428a2f98, 0xd728ae22), X64Word_create(0x71374491, 0x23ef65cd),
                        X64Word_create(0xb5c0fbcf, 0xec4d3b2f), X64Word_create(0xe9b5dba5, 0x8189dbbc),
                        X64Word_create(0x3956c25b, 0xf348b538), X64Word_create(0x59f111f1, 0xb605d019),
                        X64Word_create(0x923f82a4, 0xaf194f9b), X64Word_create(0xab1c5ed5, 0xda6d8118),
                        X64Word_create(0xd807aa98, 0xa3030242), X64Word_create(0x12835b01, 0x45706fbe),
                        X64Word_create(0x243185be, 0x4ee4b28c), X64Word_create(0x550c7dc3, 0xd5ffb4e2),
                        X64Word_create(0x72be5d74, 0xf27b896f), X64Word_create(0x80deb1fe, 0x3b1696b1),
                        X64Word_create(0x9bdc06a7, 0x25c71235), X64Word_create(0xc19bf174, 0xcf692694),
                        X64Word_create(0xe49b69c1, 0x9ef14ad2), X64Word_create(0xefbe4786, 0x384f25e3),
                        X64Word_create(0x0fc19dc6, 0x8b8cd5b5), X64Word_create(0x240ca1cc, 0x77ac9c65),
                        X64Word_create(0x2de92c6f, 0x592b0275), X64Word_create(0x4a7484aa, 0x6ea6e483),
                        X64Word_create(0x5cb0a9dc, 0xbd41fbd4), X64Word_create(0x76f988da, 0x831153b5),
                        X64Word_create(0x983e5152, 0xee66dfab), X64Word_create(0xa831c66d, 0x2db43210),
                        X64Word_create(0xb00327c8, 0x98fb213f), X64Word_create(0xbf597fc7, 0xbeef0ee4),
                        X64Word_create(0xc6e00bf3, 0x3da88fc2), X64Word_create(0xd5a79147, 0x930aa725),
                        X64Word_create(0x06ca6351, 0xe003826f), X64Word_create(0x14292967, 0x0a0e6e70),
                        X64Word_create(0x27b70a85, 0x46d22ffc), X64Word_create(0x2e1b2138, 0x5c26c926),
                        X64Word_create(0x4d2c6dfc, 0x5ac42aed), X64Word_create(0x53380d13, 0x9d95b3df),
                        X64Word_create(0x650a7354, 0x8baf63de), X64Word_create(0x766a0abb, 0x3c77b2a8),
                        X64Word_create(0x81c2c92e, 0x47edaee6), X64Word_create(0x92722c85, 0x1482353b),
                        X64Word_create(0xa2bfe8a1, 0x4cf10364), X64Word_create(0xa81a664b, 0xbc423001),
                        X64Word_create(0xc24b8b70, 0xd0f89791), X64Word_create(0xc76c51a3, 0x0654be30),
                        X64Word_create(0xd192e819, 0xd6ef5218), X64Word_create(0xd6990624, 0x5565a910),
                        X64Word_create(0xf40e3585, 0x5771202a), X64Word_create(0x106aa070, 0x32bbd1b8),
                        X64Word_create(0x19a4c116, 0xb8d2d0c8), X64Word_create(0x1e376c08, 0x5141ab53),
                        X64Word_create(0x2748774c, 0xdf8eeb99), X64Word_create(0x34b0bcb5, 0xe19b48a8),
                        X64Word_create(0x391c0cb3, 0xc5c95a63), X64Word_create(0x4ed8aa4a, 0xe3418acb),
                        X64Word_create(0x5b9cca4f, 0x7763e373), X64Word_create(0x682e6ff3, 0xd6b2b8a3),
                        X64Word_create(0x748f82ee, 0x5defb2fc), X64Word_create(0x78a5636f, 0x43172f60),
                        X64Word_create(0x84c87814, 0xa1f0ab72), X64Word_create(0x8cc70208, 0x1a6439ec),
                        X64Word_create(0x90befffa, 0x23631e28), X64Word_create(0xa4506ceb, 0xde82bde9),
                        X64Word_create(0xbef9a3f7, 0xb2c67915), X64Word_create(0xc67178f2, 0xe372532b),
                        X64Word_create(0xca273ece, 0xea26619c), X64Word_create(0xd186b8c7, 0x21c0c207),
                        X64Word_create(0xeada7dd6, 0xcde0eb1e), X64Word_create(0xf57d4f7f, 0xee6ed178),
                        X64Word_create(0x06f067aa, 0x72176fba), X64Word_create(0x0a637dc5, 0xa2c898a6),
                        X64Word_create(0x113f9804, 0xbef90dae), X64Word_create(0x1b710b35, 0x131c471b),
                        X64Word_create(0x28db77f5, 0x23047d84), X64Word_create(0x32caab7b, 0x40c72493),
                        X64Word_create(0x3c9ebe0a, 0x15c9bebc), X64Word_create(0x431d67c4, 0x9c100d4c),
                        X64Word_create(0x4cc5d4be, 0xcb3e42b6), X64Word_create(0x597f299c, 0xfc657e2a),
                        X64Word_create(0x5fcb6fab, 0x3ad6faec), X64Word_create(0x6c44198c, 0x4a475817)
                    ];

                    // Reusable objects
                    var W = [];
                    (function () {
                        for (var i = 0; i < 80; i++) {
                            W[i] = X64Word_create();
                        }
                    }());

                    /**
                     * SHA-512 hash algorithm.
                     */
                    var SHA512 = C_algo.SHA512 = Hasher.extend({
                        _doReset: function () {
                            this._hash = new X64WordArray.init([
                                new X64Word.init(0x6a09e667, 0xf3bcc908), new X64Word.init(0xbb67ae85, 0x84caa73b),
                                new X64Word.init(0x3c6ef372, 0xfe94f82b), new X64Word.init(0xa54ff53a, 0x5f1d36f1),
                                new X64Word.init(0x510e527f, 0xade682d1), new X64Word.init(0x9b05688c, 0x2b3e6c1f),
                                new X64Word.init(0x1f83d9ab, 0xfb41bd6b), new X64Word.init(0x5be0cd19, 0x137e2179)
                            ]);
                        },

                        _doProcessBlock: function (M, offset) {
                            // Shortcuts
                            var H = this._hash.words;

                            var H0 = H[0];
                            var H1 = H[1];
                            var H2 = H[2];
                            var H3 = H[3];
                            var H4 = H[4];
                            var H5 = H[5];
                            var H6 = H[6];
                            var H7 = H[7];

                            var H0h = H0.high;
                            var H0l = H0.low;
                            var H1h = H1.high;
                            var H1l = H1.low;
                            var H2h = H2.high;
                            var H2l = H2.low;
                            var H3h = H3.high;
                            var H3l = H3.low;
                            var H4h = H4.high;
                            var H4l = H4.low;
                            var H5h = H5.high;
                            var H5l = H5.low;
                            var H6h = H6.high;
                            var H6l = H6.low;
                            var H7h = H7.high;
                            var H7l = H7.low;

                            // Working variables
                            var ah = H0h;
                            var al = H0l;
                            var bh = H1h;
                            var bl = H1l;
                            var ch = H2h;
                            var cl = H2l;
                            var dh = H3h;
                            var dl = H3l;
                            var eh = H4h;
                            var el = H4l;
                            var fh = H5h;
                            var fl = H5l;
                            var gh = H6h;
                            var gl = H6l;
                            var hh = H7h;
                            var hl = H7l;

                            // Rounds
                            for (var i = 0; i < 80; i++) {
                                var Wil;
                                var Wih;

                                // Shortcut
                                var Wi = W[i];

                                // Extend message
                                if (i < 16) {
                                    Wih = Wi.high = M[offset + i * 2] | 0;
                                    Wil = Wi.low = M[offset + i * 2 + 1] | 0;
                                } else {
                                    // Gamma0
                                    var gamma0x = W[i - 15];
                                    var gamma0xh = gamma0x.high;
                                    var gamma0xl = gamma0x.low;
                                    var gamma0h = ((gamma0xh >>> 1) | (gamma0xl << 31)) ^ ((gamma0xh >>> 8) | (gamma0xl << 24)) ^ (gamma0xh >>> 7);
                                    var gamma0l = ((gamma0xl >>> 1) | (gamma0xh << 31)) ^ ((gamma0xl >>> 8) | (gamma0xh << 24)) ^ ((gamma0xl >>> 7) | (gamma0xh << 25));

                                    // Gamma1
                                    var gamma1x = W[i - 2];
                                    var gamma1xh = gamma1x.high;
                                    var gamma1xl = gamma1x.low;
                                    var gamma1h = ((gamma1xh >>> 19) | (gamma1xl << 13)) ^ ((gamma1xh << 3) | (gamma1xl >>> 29)) ^ (gamma1xh >>> 6);
                                    var gamma1l = ((gamma1xl >>> 19) | (gamma1xh << 13)) ^ ((gamma1xl << 3) | (gamma1xh >>> 29)) ^ ((gamma1xl >>> 6) | (gamma1xh << 26));

                                    // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
                                    var Wi7 = W[i - 7];
                                    var Wi7h = Wi7.high;
                                    var Wi7l = Wi7.low;

                                    var Wi16 = W[i - 16];
                                    var Wi16h = Wi16.high;
                                    var Wi16l = Wi16.low;

                                    Wil = gamma0l + Wi7l;
                                    Wih = gamma0h + Wi7h + ((Wil >>> 0) < (gamma0l >>> 0) ? 1 : 0);
                                    Wil = Wil + gamma1l;
                                    Wih = Wih + gamma1h + ((Wil >>> 0) < (gamma1l >>> 0) ? 1 : 0);
                                    Wil = Wil + Wi16l;
                                    Wih = Wih + Wi16h + ((Wil >>> 0) < (Wi16l >>> 0) ? 1 : 0);

                                    Wi.high = Wih;
                                    Wi.low = Wil;
                                }

                                var chh = (eh & fh) ^ (~eh & gh);
                                var chl = (el & fl) ^ (~el & gl);
                                var majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
                                var majl = (al & bl) ^ (al & cl) ^ (bl & cl);

                                var sigma0h = ((ah >>> 28) | (al << 4)) ^ ((ah << 30) | (al >>> 2)) ^ ((ah << 25) | (al >>> 7));
                                var sigma0l = ((al >>> 28) | (ah << 4)) ^ ((al << 30) | (ah >>> 2)) ^ ((al << 25) | (ah >>> 7));
                                var sigma1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((eh << 23) | (el >>> 9));
                                var sigma1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((el << 23) | (eh >>> 9));

                                // t1 = h + sigma1 + ch + K[i] + W[i]
                                var Ki = K[i];
                                var Kih = Ki.high;
                                var Kil = Ki.low;

                                var t1l = hl + sigma1l;
                                var t1h = hh + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0);
                                var t1l = t1l + chl;
                                var t1h = t1h + chh + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0);
                                var t1l = t1l + Kil;
                                var t1h = t1h + Kih + ((t1l >>> 0) < (Kil >>> 0) ? 1 : 0);
                                var t1l = t1l + Wil;
                                var t1h = t1h + Wih + ((t1l >>> 0) < (Wil >>> 0) ? 1 : 0);

                                // t2 = sigma0 + maj
                                var t2l = sigma0l + majl;
                                var t2h = sigma0h + majh + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0);

                                // Update working variables
                                hh = gh;
                                hl = gl;
                                gh = fh;
                                gl = fl;
                                fh = eh;
                                fl = el;
                                el = (dl + t1l) | 0;
                                eh = (dh + t1h + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0;
                                dh = ch;
                                dl = cl;
                                ch = bh;
                                cl = bl;
                                bh = ah;
                                bl = al;
                                al = (t1l + t2l) | 0;
                                ah = (t1h + t2h + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0;
                            }

                            // Intermediate hash value
                            H0l = H0.low = (H0l + al);
                            H0.high = (H0h + ah + ((H0l >>> 0) < (al >>> 0) ? 1 : 0));
                            H1l = H1.low = (H1l + bl);
                            H1.high = (H1h + bh + ((H1l >>> 0) < (bl >>> 0) ? 1 : 0));
                            H2l = H2.low = (H2l + cl);
                            H2.high = (H2h + ch + ((H2l >>> 0) < (cl >>> 0) ? 1 : 0));
                            H3l = H3.low = (H3l + dl);
                            H3.high = (H3h + dh + ((H3l >>> 0) < (dl >>> 0) ? 1 : 0));
                            H4l = H4.low = (H4l + el);
                            H4.high = (H4h + eh + ((H4l >>> 0) < (el >>> 0) ? 1 : 0));
                            H5l = H5.low = (H5l + fl);
                            H5.high = (H5h + fh + ((H5l >>> 0) < (fl >>> 0) ? 1 : 0));
                            H6l = H6.low = (H6l + gl);
                            H6.high = (H6h + gh + ((H6l >>> 0) < (gl >>> 0) ? 1 : 0));
                            H7l = H7.low = (H7l + hl);
                            H7.high = (H7h + hh + ((H7l >>> 0) < (hl >>> 0) ? 1 : 0));
                        },

                        _doFinalize: function () {
                            // Shortcuts
                            var data = this._data;
                            var dataWords = data.words;

                            var nBitsTotal = this._nDataBytes * 8;
                            var nBitsLeft = data.sigBytes * 8;

                            // Add padding
                            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
                            dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 30] = Math.floor(nBitsTotal / 0x100000000);
                            dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 31] = nBitsTotal;
                            data.sigBytes = dataWords.length * 4;

                            // Hash final blocks
                            this._process();

                            // Convert hash to 32-bit word array before returning
                            var hash = this._hash.toX32();

                            // Return final computed hash
                            return hash;
                        },

                        clone: function () {
                            var clone = Hasher.clone.call(this);
                            clone._hash = this._hash.clone();

                            return clone;
                        },

                        blockSize: 1024 / 32
                    });

                    /**
                     * Shortcut function to the hasher's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     *
                     * @return {WordArray} The hash.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hash = CryptoJS.SHA512('message');
                     *     var hash = CryptoJS.SHA512(wordArray);
                     */
                    C.SHA512 = Hasher._createHelper(SHA512);

                    /**
                     * Shortcut function to the HMAC's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     * @param {WordArray|string} key The secret key.
                     *
                     * @return {WordArray} The HMAC.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hmac = CryptoJS.HmacSHA512(message, key);
                     */
                    C.HmacSHA512 = Hasher._createHmacHelper(SHA512);
                }());


                return CryptoJS.SHA512;

            }));
        }(sha512));
        return sha512Exports;
    }

    var sha384Exports = {};
    var sha384 = {
        get exports() {
            return sha384Exports;
        },
        set exports(v) {
            sha384Exports = v;
        },
    };

    var hasRequiredSha384;

    function requireSha384() {
        if (hasRequiredSha384) return sha384Exports;
        hasRequiredSha384 = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireX64Core(), requireSha512());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_x64 = C.x64;
                    var X64Word = C_x64.Word;
                    var X64WordArray = C_x64.WordArray;
                    var C_algo = C.algo;
                    var SHA512 = C_algo.SHA512;

                    /**
                     * SHA-384 hash algorithm.
                     */
                    var SHA384 = C_algo.SHA384 = SHA512.extend({
                        _doReset: function () {
                            this._hash = new X64WordArray.init([
                                new X64Word.init(0xcbbb9d5d, 0xc1059ed8), new X64Word.init(0x629a292a, 0x367cd507),
                                new X64Word.init(0x9159015a, 0x3070dd17), new X64Word.init(0x152fecd8, 0xf70e5939),
                                new X64Word.init(0x67332667, 0xffc00b31), new X64Word.init(0x8eb44a87, 0x68581511),
                                new X64Word.init(0xdb0c2e0d, 0x64f98fa7), new X64Word.init(0x47b5481d, 0xbefa4fa4)
                            ]);
                        },

                        _doFinalize: function () {
                            var hash = SHA512._doFinalize.call(this);

                            hash.sigBytes -= 16;

                            return hash;
                        }
                    });

                    /**
                     * Shortcut function to the hasher's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     *
                     * @return {WordArray} The hash.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hash = CryptoJS.SHA384('message');
                     *     var hash = CryptoJS.SHA384(wordArray);
                     */
                    C.SHA384 = SHA512._createHelper(SHA384);

                    /**
                     * Shortcut function to the HMAC's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     * @param {WordArray|string} key The secret key.
                     *
                     * @return {WordArray} The HMAC.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hmac = CryptoJS.HmacSHA384(message, key);
                     */
                    C.HmacSHA384 = SHA512._createHmacHelper(SHA384);
                }());


                return CryptoJS.SHA384;

            }));
        }(sha384));
        return sha384Exports;
    }

    var sha3Exports = {};
    var sha3 = {
        get exports() {
            return sha3Exports;
        },
        set exports(v) {
            sha3Exports = v;
        },
    };

    var hasRequiredSha3;

    function requireSha3() {
        if (hasRequiredSha3) return sha3Exports;
        hasRequiredSha3 = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireX64Core());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function (Math) {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var WordArray = C_lib.WordArray;
                    var Hasher = C_lib.Hasher;
                    var C_x64 = C.x64;
                    var X64Word = C_x64.Word;
                    var C_algo = C.algo;

                    // Constants tables
                    var RHO_OFFSETS = [];
                    var PI_INDEXES = [];
                    var ROUND_CONSTANTS = [];

                    // Compute Constants
                    (function () {
                        // Compute rho offset constants
                        var x = 1, y = 0;
                        for (var t = 0; t < 24; t++) {
                            RHO_OFFSETS[x + 5 * y] = ((t + 1) * (t + 2) / 2) % 64;

                            var newX = y % 5;
                            var newY = (2 * x + 3 * y) % 5;
                            x = newX;
                            y = newY;
                        }

                        // Compute pi index constants
                        for (var x = 0; x < 5; x++) {
                            for (var y = 0; y < 5; y++) {
                                PI_INDEXES[x + 5 * y] = y + ((2 * x + 3 * y) % 5) * 5;
                            }
                        }

                        // Compute round constants
                        var LFSR = 0x01;
                        for (var i = 0; i < 24; i++) {
                            var roundConstantMsw = 0;
                            var roundConstantLsw = 0;

                            for (var j = 0; j < 7; j++) {
                                if (LFSR & 0x01) {
                                    var bitPosition = (1 << j) - 1;
                                    if (bitPosition < 32) {
                                        roundConstantLsw ^= 1 << bitPosition;
                                    } else /* if (bitPosition >= 32) */ {
                                        roundConstantMsw ^= 1 << (bitPosition - 32);
                                    }
                                }

                                // Compute next LFSR
                                if (LFSR & 0x80) {
                                    // Primitive polynomial over GF(2): x^8 + x^6 + x^5 + x^4 + 1
                                    LFSR = (LFSR << 1) ^ 0x71;
                                } else {
                                    LFSR <<= 1;
                                }
                            }

                            ROUND_CONSTANTS[i] = X64Word.create(roundConstantMsw, roundConstantLsw);
                        }
                    }());

                    // Reusable objects for temporary values
                    var T = [];
                    (function () {
                        for (var i = 0; i < 25; i++) {
                            T[i] = X64Word.create();
                        }
                    }());

                    /**
                     * SHA-3 hash algorithm.
                     */
                    var SHA3 = C_algo.SHA3 = Hasher.extend({
                        /**
                         * Configuration options.
                         *
                         * @property {number} outputLength
                         *   The desired number of bits in the output hash.
                         *   Only values permitted are: 224, 256, 384, 512.
                         *   Default: 512
                         */
                        cfg: Hasher.cfg.extend({
                            outputLength: 512
                        }),

                        _doReset: function () {
                            var state = this._state = [];
                            for (var i = 0; i < 25; i++) {
                                state[i] = new X64Word.init();
                            }

                            this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
                        },

                        _doProcessBlock: function (M, offset) {
                            // Shortcuts
                            var state = this._state;
                            var nBlockSizeLanes = this.blockSize / 2;

                            // Absorb
                            for (var i = 0; i < nBlockSizeLanes; i++) {
                                // Shortcuts
                                var M2i = M[offset + 2 * i];
                                var M2i1 = M[offset + 2 * i + 1];

                                // Swap endian
                                M2i = (
                                    (((M2i << 8) | (M2i >>> 24)) & 0x00ff00ff) |
                                    (((M2i << 24) | (M2i >>> 8)) & 0xff00ff00)
                                );
                                M2i1 = (
                                    (((M2i1 << 8) | (M2i1 >>> 24)) & 0x00ff00ff) |
                                    (((M2i1 << 24) | (M2i1 >>> 8)) & 0xff00ff00)
                                );

                                // Absorb message into state
                                var lane = state[i];
                                lane.high ^= M2i1;
                                lane.low ^= M2i;
                            }

                            // Rounds
                            for (var round = 0; round < 24; round++) {
                                // Theta
                                for (var x = 0; x < 5; x++) {
                                    // Mix column lanes
                                    var tMsw = 0, tLsw = 0;
                                    for (var y = 0; y < 5; y++) {
                                        var lane = state[x + 5 * y];
                                        tMsw ^= lane.high;
                                        tLsw ^= lane.low;
                                    }

                                    // Temporary values
                                    var Tx = T[x];
                                    Tx.high = tMsw;
                                    Tx.low = tLsw;
                                }
                                for (var x = 0; x < 5; x++) {
                                    // Shortcuts
                                    var Tx4 = T[(x + 4) % 5];
                                    var Tx1 = T[(x + 1) % 5];
                                    var Tx1Msw = Tx1.high;
                                    var Tx1Lsw = Tx1.low;

                                    // Mix surrounding columns
                                    var tMsw = Tx4.high ^ ((Tx1Msw << 1) | (Tx1Lsw >>> 31));
                                    var tLsw = Tx4.low ^ ((Tx1Lsw << 1) | (Tx1Msw >>> 31));
                                    for (var y = 0; y < 5; y++) {
                                        var lane = state[x + 5 * y];
                                        lane.high ^= tMsw;
                                        lane.low ^= tLsw;
                                    }
                                }

                                // Rho Pi
                                for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
                                    var tMsw;
                                    var tLsw;

                                    // Shortcuts
                                    var lane = state[laneIndex];
                                    var laneMsw = lane.high;
                                    var laneLsw = lane.low;
                                    var rhoOffset = RHO_OFFSETS[laneIndex];

                                    // Rotate lanes
                                    if (rhoOffset < 32) {
                                        tMsw = (laneMsw << rhoOffset) | (laneLsw >>> (32 - rhoOffset));
                                        tLsw = (laneLsw << rhoOffset) | (laneMsw >>> (32 - rhoOffset));
                                    } else /* if (rhoOffset >= 32) */ {
                                        tMsw = (laneLsw << (rhoOffset - 32)) | (laneMsw >>> (64 - rhoOffset));
                                        tLsw = (laneMsw << (rhoOffset - 32)) | (laneLsw >>> (64 - rhoOffset));
                                    }

                                    // Transpose lanes
                                    var TPiLane = T[PI_INDEXES[laneIndex]];
                                    TPiLane.high = tMsw;
                                    TPiLane.low = tLsw;
                                }

                                // Rho pi at x = y = 0
                                var T0 = T[0];
                                var state0 = state[0];
                                T0.high = state0.high;
                                T0.low = state0.low;

                                // Chi
                                for (var x = 0; x < 5; x++) {
                                    for (var y = 0; y < 5; y++) {
                                        // Shortcuts
                                        var laneIndex = x + 5 * y;
                                        var lane = state[laneIndex];
                                        var TLane = T[laneIndex];
                                        var Tx1Lane = T[((x + 1) % 5) + 5 * y];
                                        var Tx2Lane = T[((x + 2) % 5) + 5 * y];

                                        // Mix rows
                                        lane.high = TLane.high ^ (~Tx1Lane.high & Tx2Lane.high);
                                        lane.low = TLane.low ^ (~Tx1Lane.low & Tx2Lane.low);
                                    }
                                }

                                // Iota
                                var lane = state[0];
                                var roundConstant = ROUND_CONSTANTS[round];
                                lane.high ^= roundConstant.high;
                                lane.low ^= roundConstant.low;
                            }
                        },

                        _doFinalize: function () {
                            // Shortcuts
                            var data = this._data;
                            var dataWords = data.words;
                            this._nDataBytes * 8;
                            var nBitsLeft = data.sigBytes * 8;
                            var blockSizeBits = this.blockSize * 32;

                            // Add padding
                            dataWords[nBitsLeft >>> 5] |= 0x1 << (24 - nBitsLeft % 32);
                            dataWords[((Math.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits) >>> 5) - 1] |= 0x80;
                            data.sigBytes = dataWords.length * 4;

                            // Hash final blocks
                            this._process();

                            // Shortcuts
                            var state = this._state;
                            var outputLengthBytes = this.cfg.outputLength / 8;
                            var outputLengthLanes = outputLengthBytes / 8;

                            // Squeeze
                            var hashWords = [];
                            for (var i = 0; i < outputLengthLanes; i++) {
                                // Shortcuts
                                var lane = state[i];
                                var laneMsw = lane.high;
                                var laneLsw = lane.low;

                                // Swap endian
                                laneMsw = (
                                    (((laneMsw << 8) | (laneMsw >>> 24)) & 0x00ff00ff) |
                                    (((laneMsw << 24) | (laneMsw >>> 8)) & 0xff00ff00)
                                );
                                laneLsw = (
                                    (((laneLsw << 8) | (laneLsw >>> 24)) & 0x00ff00ff) |
                                    (((laneLsw << 24) | (laneLsw >>> 8)) & 0xff00ff00)
                                );

                                // Squeeze state to retrieve hash
                                hashWords.push(laneLsw);
                                hashWords.push(laneMsw);
                            }

                            // Return final computed hash
                            return new WordArray.init(hashWords, outputLengthBytes);
                        },

                        clone: function () {
                            var clone = Hasher.clone.call(this);

                            var state = clone._state = this._state.slice(0);
                            for (var i = 0; i < 25; i++) {
                                state[i] = state[i].clone();
                            }

                            return clone;
                        }
                    });

                    /**
                     * Shortcut function to the hasher's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     *
                     * @return {WordArray} The hash.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hash = CryptoJS.SHA3('message');
                     *     var hash = CryptoJS.SHA3(wordArray);
                     */
                    C.SHA3 = Hasher._createHelper(SHA3);

                    /**
                     * Shortcut function to the HMAC's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     * @param {WordArray|string} key The secret key.
                     *
                     * @return {WordArray} The HMAC.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hmac = CryptoJS.HmacSHA3(message, key);
                     */
                    C.HmacSHA3 = Hasher._createHmacHelper(SHA3);
                }(Math));


                return CryptoJS.SHA3;

            }));
        }(sha3));
        return sha3Exports;
    }

    var ripemd160Exports = {};
    var ripemd160 = {
        get exports() {
            return ripemd160Exports;
        },
        set exports(v) {
            ripemd160Exports = v;
        },
    };

    var hasRequiredRipemd160;

    function requireRipemd160() {
        if (hasRequiredRipemd160) return ripemd160Exports;
        hasRequiredRipemd160 = 1;
        (function (module, exports) {
            (function (root, factory) {
                {
                    // CommonJS
                    module.exports = factory(requireCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                /** @preserve
                 (c) 2012 by Cédric Mesnil. All rights reserved.

                 Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

                 - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
                 - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

                 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
                 */

                (function (Math) {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var WordArray = C_lib.WordArray;
                    var Hasher = C_lib.Hasher;
                    var C_algo = C.algo;

                    // Constants table
                    var _zl = WordArray.create([
                        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
                        7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
                        3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
                        1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
                        4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13]);
                    var _zr = WordArray.create([
                        5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
                        6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
                        15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
                        8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
                        12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11]);
                    var _sl = WordArray.create([
                        11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
                        7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
                        11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
                        11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
                        9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6]);
                    var _sr = WordArray.create([
                        8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
                        9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
                        9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
                        15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
                        8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11]);

                    var _hl = WordArray.create([0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E]);
                    var _hr = WordArray.create([0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000]);

                    /**
                     * RIPEMD160 hash algorithm.
                     */
                    var RIPEMD160 = C_algo.RIPEMD160 = Hasher.extend({
                        _doReset: function () {
                            this._hash = WordArray.create([0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0]);
                        },

                        _doProcessBlock: function (M, offset) {

                            // Swap endian
                            for (var i = 0; i < 16; i++) {
                                // Shortcuts
                                var offset_i = offset + i;
                                var M_offset_i = M[offset_i];

                                // Swap
                                M[offset_i] = (
                                    (((M_offset_i << 8) | (M_offset_i >>> 24)) & 0x00ff00ff) |
                                    (((M_offset_i << 24) | (M_offset_i >>> 8)) & 0xff00ff00)
                                );
                            }
                            // Shortcut
                            var H = this._hash.words;
                            var hl = _hl.words;
                            var hr = _hr.words;
                            var zl = _zl.words;
                            var zr = _zr.words;
                            var sl = _sl.words;
                            var sr = _sr.words;

                            // Working variables
                            var al, bl, cl, dl, el;
                            var ar, br, cr, dr, er;

                            ar = al = H[0];
                            br = bl = H[1];
                            cr = cl = H[2];
                            dr = dl = H[3];
                            er = el = H[4];
                            // Computation
                            var t;
                            for (var i = 0; i < 80; i += 1) {
                                t = (al + M[offset + zl[i]]) | 0;
                                if (i < 16) {
                                    t += f1(bl, cl, dl) + hl[0];
                                } else if (i < 32) {
                                    t += f2(bl, cl, dl) + hl[1];
                                } else if (i < 48) {
                                    t += f3(bl, cl, dl) + hl[2];
                                } else if (i < 64) {
                                    t += f4(bl, cl, dl) + hl[3];
                                } else {// if (i<80) {
                                    t += f5(bl, cl, dl) + hl[4];
                                }
                                t = t | 0;
                                t = rotl(t, sl[i]);
                                t = (t + el) | 0;
                                al = el;
                                el = dl;
                                dl = rotl(cl, 10);
                                cl = bl;
                                bl = t;

                                t = (ar + M[offset + zr[i]]) | 0;
                                if (i < 16) {
                                    t += f5(br, cr, dr) + hr[0];
                                } else if (i < 32) {
                                    t += f4(br, cr, dr) + hr[1];
                                } else if (i < 48) {
                                    t += f3(br, cr, dr) + hr[2];
                                } else if (i < 64) {
                                    t += f2(br, cr, dr) + hr[3];
                                } else {// if (i<80) {
                                    t += f1(br, cr, dr) + hr[4];
                                }
                                t = t | 0;
                                t = rotl(t, sr[i]);
                                t = (t + er) | 0;
                                ar = er;
                                er = dr;
                                dr = rotl(cr, 10);
                                cr = br;
                                br = t;
                            }
                            // Intermediate hash value
                            t = (H[1] + cl + dr) | 0;
                            H[1] = (H[2] + dl + er) | 0;
                            H[2] = (H[3] + el + ar) | 0;
                            H[3] = (H[4] + al + br) | 0;
                            H[4] = (H[0] + bl + cr) | 0;
                            H[0] = t;
                        },

                        _doFinalize: function () {
                            // Shortcuts
                            var data = this._data;
                            var dataWords = data.words;

                            var nBitsTotal = this._nDataBytes * 8;
                            var nBitsLeft = data.sigBytes * 8;

                            // Add padding
                            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
                            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
                                (((nBitsTotal << 8) | (nBitsTotal >>> 24)) & 0x00ff00ff) |
                                (((nBitsTotal << 24) | (nBitsTotal >>> 8)) & 0xff00ff00)
                            );
                            data.sigBytes = (dataWords.length + 1) * 4;

                            // Hash final blocks
                            this._process();

                            // Shortcuts
                            var hash = this._hash;
                            var H = hash.words;

                            // Swap endian
                            for (var i = 0; i < 5; i++) {
                                // Shortcut
                                var H_i = H[i];

                                // Swap
                                H[i] = (((H_i << 8) | (H_i >>> 24)) & 0x00ff00ff) |
                                    (((H_i << 24) | (H_i >>> 8)) & 0xff00ff00);
                            }

                            // Return final computed hash
                            return hash;
                        },

                        clone: function () {
                            var clone = Hasher.clone.call(this);
                            clone._hash = this._hash.clone();

                            return clone;
                        }
                    });


                    function f1(x, y, z) {
                        return ((x) ^ (y) ^ (z));

                    }

                    function f2(x, y, z) {
                        return (((x) & (y)) | ((~x) & (z)));
                    }

                    function f3(x, y, z) {
                        return (((x) | (~(y))) ^ (z));
                    }

                    function f4(x, y, z) {
                        return (((x) & (z)) | ((y) & (~(z))));
                    }

                    function f5(x, y, z) {
                        return ((x) ^ ((y) | (~(z))));

                    }

                    function rotl(x, n) {
                        return (x << n) | (x >>> (32 - n));
                    }


                    /**
                     * Shortcut function to the hasher's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     *
                     * @return {WordArray} The hash.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hash = CryptoJS.RIPEMD160('message');
                     *     var hash = CryptoJS.RIPEMD160(wordArray);
                     */
                    C.RIPEMD160 = Hasher._createHelper(RIPEMD160);

                    /**
                     * Shortcut function to the HMAC's object interface.
                     *
                     * @param {WordArray|string} message The message to hash.
                     * @param {WordArray|string} key The secret key.
                     *
                     * @return {WordArray} The HMAC.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var hmac = CryptoJS.HmacRIPEMD160(message, key);
                     */
                    C.HmacRIPEMD160 = Hasher._createHmacHelper(RIPEMD160);
                }());


                return CryptoJS.RIPEMD160;

            }));
        }(ripemd160));
        return ripemd160Exports;
    }

    var hmacExports = {};
    var hmac = {
        get exports() {
            return hmacExports;
        },
        set exports(v) {
            hmacExports = v;
        },
    };

    var hasRequiredHmac;

    function requireHmac() {
        if (hasRequiredHmac) return hmacExports;
        hasRequiredHmac = 1;
        (function (module, exports) {
            (function (root, factory) {
                {
                    // CommonJS
                    module.exports = factory(requireCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var Base = C_lib.Base;
                    var C_enc = C.enc;
                    var Utf8 = C_enc.Utf8;
                    var C_algo = C.algo;

                    /**
                     * HMAC algorithm.
                     */
                    C_algo.HMAC = Base.extend({
                        /**
                         * Initializes a newly created HMAC.
                         *
                         * @param {Hasher} hasher The hash algorithm to use.
                         * @param {WordArray|string} key The secret key.
                         *
                         * @example
                         *
                         *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
                         */
                        init: function (hasher, key) {
                            // Init hasher
                            hasher = this._hasher = new hasher.init();

                            // Convert string to WordArray, else assume WordArray already
                            if (typeof key == 'string') {
                                key = Utf8.parse(key);
                            }

                            // Shortcuts
                            var hasherBlockSize = hasher.blockSize;
                            var hasherBlockSizeBytes = hasherBlockSize * 4;

                            // Allow arbitrary length keys
                            if (key.sigBytes > hasherBlockSizeBytes) {
                                key = hasher.finalize(key);
                            }

                            // Clamp excess bits
                            key.clamp();

                            // Clone key for inner and outer pads
                            var oKey = this._oKey = key.clone();
                            var iKey = this._iKey = key.clone();

                            // Shortcuts
                            var oKeyWords = oKey.words;
                            var iKeyWords = iKey.words;

                            // XOR keys with pad constants
                            for (var i = 0; i < hasherBlockSize; i++) {
                                oKeyWords[i] ^= 0x5c5c5c5c;
                                iKeyWords[i] ^= 0x36363636;
                            }
                            oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;

                            // Set initial values
                            this.reset();
                        },

                        /**
                         * Resets this HMAC to its initial state.
                         *
                         * @example
                         *
                         *     hmacHasher.reset();
                         */
                        reset: function () {
                            // Shortcut
                            var hasher = this._hasher;

                            // Reset
                            hasher.reset();
                            hasher.update(this._iKey);
                        },

                        /**
                         * Updates this HMAC with a message.
                         *
                         * @param {WordArray|string} messageUpdate The message to append.
                         *
                         * @return {HMAC} This HMAC instance.
                         *
                         * @example
                         *
                         *     hmacHasher.update('message');
                         *     hmacHasher.update(wordArray);
                         */
                        update: function (messageUpdate) {
                            this._hasher.update(messageUpdate);

                            // Chainable
                            return this;
                        },

                        /**
                         * Finalizes the HMAC computation.
                         * Note that the finalize operation is effectively a destructive, read-once operation.
                         *
                         * @param {WordArray|string} messageUpdate (Optional) A final message update.
                         *
                         * @return {WordArray} The HMAC.
                         *
                         * @example
                         *
                         *     var hmac = hmacHasher.finalize();
                         *     var hmac = hmacHasher.finalize('message');
                         *     var hmac = hmacHasher.finalize(wordArray);
                         */
                        finalize: function (messageUpdate) {
                            // Shortcut
                            var hasher = this._hasher;

                            // Compute HMAC
                            var innerHash = hasher.finalize(messageUpdate);
                            hasher.reset();
                            var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));

                            return hmac;
                        }
                    });
                }());


            }));
        }(hmac));
        return hmacExports;
    }

    var pbkdf2Exports = {};
    var pbkdf2 = {
        get exports() {
            return pbkdf2Exports;
        },
        set exports(v) {
            pbkdf2Exports = v;
        },
    };

    var hasRequiredPbkdf2;

    function requirePbkdf2() {
        if (hasRequiredPbkdf2) return pbkdf2Exports;
        hasRequiredPbkdf2 = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireSha1(), requireHmac());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var Base = C_lib.Base;
                    var WordArray = C_lib.WordArray;
                    var C_algo = C.algo;
                    var SHA1 = C_algo.SHA1;
                    var HMAC = C_algo.HMAC;

                    /**
                     * Password-Based Key Derivation Function 2 algorithm.
                     */
                    var PBKDF2 = C_algo.PBKDF2 = Base.extend({
                        /**
                         * Configuration options.
                         *
                         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
                         * @property {Hasher} hasher The hasher to use. Default: SHA1
                         * @property {number} iterations The number of iterations to perform. Default: 1
                         */
                        cfg: Base.extend({
                            keySize: 128 / 32,
                            hasher: SHA1,
                            iterations: 1
                        }),

                        /**
                         * Initializes a newly created key derivation function.
                         *
                         * @param {Object} cfg (Optional) The configuration options to use for the derivation.
                         *
                         * @example
                         *
                         *     var kdf = CryptoJS.algo.PBKDF2.create();
                         *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8 });
                         *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8, iterations: 1000 });
                         */
                        init: function (cfg) {
                            this.cfg = this.cfg.extend(cfg);
                        },

                        /**
                         * Computes the Password-Based Key Derivation Function 2.
                         *
                         * @param {WordArray|string} password The password.
                         * @param {WordArray|string} salt A salt.
                         *
                         * @return {WordArray} The derived key.
                         *
                         * @example
                         *
                         *     var key = kdf.compute(password, salt);
                         */
                        compute: function (password, salt) {
                            // Shortcut
                            var cfg = this.cfg;

                            // Init HMAC
                            var hmac = HMAC.create(cfg.hasher, password);

                            // Initial values
                            var derivedKey = WordArray.create();
                            var blockIndex = WordArray.create([0x00000001]);

                            // Shortcuts
                            var derivedKeyWords = derivedKey.words;
                            var blockIndexWords = blockIndex.words;
                            var keySize = cfg.keySize;
                            var iterations = cfg.iterations;

                            // Generate key
                            while (derivedKeyWords.length < keySize) {
                                var block = hmac.update(salt).finalize(blockIndex);
                                hmac.reset();

                                // Shortcuts
                                var blockWords = block.words;
                                var blockWordsLength = blockWords.length;

                                // Iterations
                                var intermediate = block;
                                for (var i = 1; i < iterations; i++) {
                                    intermediate = hmac.finalize(intermediate);
                                    hmac.reset();

                                    // Shortcut
                                    var intermediateWords = intermediate.words;

                                    // XOR intermediate with block
                                    for (var j = 0; j < blockWordsLength; j++) {
                                        blockWords[j] ^= intermediateWords[j];
                                    }
                                }

                                derivedKey.concat(block);
                                blockIndexWords[0]++;
                            }
                            derivedKey.sigBytes = keySize * 4;

                            return derivedKey;
                        }
                    });

                    /**
                     * Computes the Password-Based Key Derivation Function 2.
                     *
                     * @param {WordArray|string} password The password.
                     * @param {WordArray|string} salt A salt.
                     * @param {Object} cfg (Optional) The configuration options to use for this computation.
                     *
                     * @return {WordArray} The derived key.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var key = CryptoJS.PBKDF2(password, salt);
                     *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8 });
                     *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8, iterations: 1000 });
                     */
                    C.PBKDF2 = function (password, salt, cfg) {
                        return PBKDF2.create(cfg).compute(password, salt);
                    };
                }());


                return CryptoJS.PBKDF2;

            }));
        }(pbkdf2));
        return pbkdf2Exports;
    }

    var evpkdfExports = {};
    var evpkdf = {
        get exports() {
            return evpkdfExports;
        },
        set exports(v) {
            evpkdfExports = v;
        },
    };

    var hasRequiredEvpkdf;

    function requireEvpkdf() {
        if (hasRequiredEvpkdf) return evpkdfExports;
        hasRequiredEvpkdf = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireSha1(), requireHmac());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var Base = C_lib.Base;
                    var WordArray = C_lib.WordArray;
                    var C_algo = C.algo;
                    var MD5 = C_algo.MD5;

                    /**
                     * This key derivation function is meant to conform with EVP_BytesToKey.
                     * www.openssl.org/docs/crypto/EVP_BytesToKey.html
                     */
                    var EvpKDF = C_algo.EvpKDF = Base.extend({
                        /**
                         * Configuration options.
                         *
                         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
                         * @property {Hasher} hasher The hash algorithm to use. Default: MD5
                         * @property {number} iterations The number of iterations to perform. Default: 1
                         */
                        cfg: Base.extend({
                            keySize: 128 / 32,
                            hasher: MD5,
                            iterations: 1
                        }),

                        /**
                         * Initializes a newly created key derivation function.
                         *
                         * @param {Object} cfg (Optional) The configuration options to use for the derivation.
                         *
                         * @example
                         *
                         *     var kdf = CryptoJS.algo.EvpKDF.create();
                         *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
                         *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
                         */
                        init: function (cfg) {
                            this.cfg = this.cfg.extend(cfg);
                        },

                        /**
                         * Derives a key from a password.
                         *
                         * @param {WordArray|string} password The password.
                         * @param {WordArray|string} salt A salt.
                         *
                         * @return {WordArray} The derived key.
                         *
                         * @example
                         *
                         *     var key = kdf.compute(password, salt);
                         */
                        compute: function (password, salt) {
                            var block;

                            // Shortcut
                            var cfg = this.cfg;

                            // Init hasher
                            var hasher = cfg.hasher.create();

                            // Initial values
                            var derivedKey = WordArray.create();

                            // Shortcuts
                            var derivedKeyWords = derivedKey.words;
                            var keySize = cfg.keySize;
                            var iterations = cfg.iterations;

                            // Generate key
                            while (derivedKeyWords.length < keySize) {
                                if (block) {
                                    hasher.update(block);
                                }
                                block = hasher.update(password).finalize(salt);
                                hasher.reset();

                                // Iterations
                                for (var i = 1; i < iterations; i++) {
                                    block = hasher.finalize(block);
                                    hasher.reset();
                                }

                                derivedKey.concat(block);
                            }
                            derivedKey.sigBytes = keySize * 4;

                            return derivedKey;
                        }
                    });

                    /**
                     * Derives a key from a password.
                     *
                     * @param {WordArray|string} password The password.
                     * @param {WordArray|string} salt A salt.
                     * @param {Object} cfg (Optional) The configuration options to use for this computation.
                     *
                     * @return {WordArray} The derived key.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var key = CryptoJS.EvpKDF(password, salt);
                     *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8 });
                     *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8, iterations: 1000 });
                     */
                    C.EvpKDF = function (password, salt, cfg) {
                        return EvpKDF.create(cfg).compute(password, salt);
                    };
                }());


                return CryptoJS.EvpKDF;

            }));
        }(evpkdf));
        return evpkdfExports;
    }

    var cipherCoreExports = {};
    var cipherCore = {
        get exports() {
            return cipherCoreExports;
        },
        set exports(v) {
            cipherCoreExports = v;
        },
    };

    var hasRequiredCipherCore;

    function requireCipherCore() {
        if (hasRequiredCipherCore) return cipherCoreExports;
        hasRequiredCipherCore = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireEvpkdf());
                }
            }(commonjsGlobal, function (CryptoJS) {

                /**
                 * Cipher core components.
                 */
                CryptoJS.lib.Cipher || (function (undefined$1) {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var Base = C_lib.Base;
                    var WordArray = C_lib.WordArray;
                    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
                    var C_enc = C.enc;
                    C_enc.Utf8;
                    var Base64 = C_enc.Base64;
                    var C_algo = C.algo;
                    var EvpKDF = C_algo.EvpKDF;

                    /**
                     * Abstract base cipher template.
                     *
                     * @property {number} keySize This cipher's key size. Default: 4 (128 bits)
                     * @property {number} ivSize This cipher's IV size. Default: 4 (128 bits)
                     * @property {number} _ENC_XFORM_MODE A constant representing encryption mode.
                     * @property {number} _DEC_XFORM_MODE A constant representing decryption mode.
                     */
                    var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
                        /**
                         * Configuration options.
                         *
                         * @property {WordArray} iv The IV to use for this operation.
                         */
                        cfg: Base.extend(),

                        /**
                         * Creates this cipher in encryption mode.
                         *
                         * @param {WordArray} key The key.
                         * @param {Object} cfg (Optional) The configuration options to use for this operation.
                         *
                         * @return {Cipher} A cipher instance.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
                         */
                        createEncryptor: function (key, cfg) {
                            return this.create(this._ENC_XFORM_MODE, key, cfg);
                        },

                        /**
                         * Creates this cipher in decryption mode.
                         *
                         * @param {WordArray} key The key.
                         * @param {Object} cfg (Optional) The configuration options to use for this operation.
                         *
                         * @return {Cipher} A cipher instance.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
                         */
                        createDecryptor: function (key, cfg) {
                            return this.create(this._DEC_XFORM_MODE, key, cfg);
                        },

                        /**
                         * Initializes a newly created cipher.
                         *
                         * @param {number} xformMode Either the encryption or decryption transormation mode constant.
                         * @param {WordArray} key The key.
                         * @param {Object} cfg (Optional) The configuration options to use for this operation.
                         *
                         * @example
                         *
                         *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
                         */
                        init: function (xformMode, key, cfg) {
                            // Apply config defaults
                            this.cfg = this.cfg.extend(cfg);

                            // Store transform mode and key
                            this._xformMode = xformMode;
                            this._key = key;

                            // Set initial values
                            this.reset();
                        },

                        /**
                         * Resets this cipher to its initial state.
                         *
                         * @example
                         *
                         *     cipher.reset();
                         */
                        reset: function () {
                            // Reset data buffer
                            BufferedBlockAlgorithm.reset.call(this);

                            // Perform concrete-cipher logic
                            this._doReset();
                        },

                        /**
                         * Adds data to be encrypted or decrypted.
                         *
                         * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
                         *
                         * @return {WordArray} The data after processing.
                         *
                         * @example
                         *
                         *     var encrypted = cipher.process('data');
                         *     var encrypted = cipher.process(wordArray);
                         */
                        process: function (dataUpdate) {
                            // Append
                            this._append(dataUpdate);

                            // Process available blocks
                            return this._process();
                        },

                        /**
                         * Finalizes the encryption or decryption process.
                         * Note that the finalize operation is effectively a destructive, read-once operation.
                         *
                         * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
                         *
                         * @return {WordArray} The data after final processing.
                         *
                         * @example
                         *
                         *     var encrypted = cipher.finalize();
                         *     var encrypted = cipher.finalize('data');
                         *     var encrypted = cipher.finalize(wordArray);
                         */
                        finalize: function (dataUpdate) {
                            // Final data update
                            if (dataUpdate) {
                                this._append(dataUpdate);
                            }

                            // Perform concrete-cipher logic
                            var finalProcessedData = this._doFinalize();

                            return finalProcessedData;
                        },

                        keySize: 128 / 32,

                        ivSize: 128 / 32,

                        _ENC_XFORM_MODE: 1,

                        _DEC_XFORM_MODE: 2,

                        /**
                         * Creates shortcut functions to a cipher's object interface.
                         *
                         * @param {Cipher} cipher The cipher to create a helper for.
                         *
                         * @return {Object} An object with encrypt and decrypt shortcut functions.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
                         */
                        _createHelper: (function () {
                            function selectCipherStrategy(key) {
                                if (typeof key == 'string') {
                                    return PasswordBasedCipher;
                                } else {
                                    return SerializableCipher;
                                }
                            }

                            return function (cipher) {
                                return {
                                    encrypt: function (message, key, cfg) {
                                        return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
                                    },

                                    decrypt: function (ciphertext, key, cfg) {
                                        return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
                                    }
                                };
                            };
                        }())
                    });

                    /**
                     * Abstract base stream cipher template.
                     *
                     * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 1 (32 bits)
                     */
                    C_lib.StreamCipher = Cipher.extend({
                        _doFinalize: function () {
                            // Process partial blocks
                            var finalProcessedBlocks = this._process(!!'flush');

                            return finalProcessedBlocks;
                        },

                        blockSize: 1
                    });

                    /**
                     * Mode namespace.
                     */
                    var C_mode = C.mode = {};

                    /**
                     * Abstract base block cipher mode template.
                     */
                    var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
                        /**
                         * Creates this mode for encryption.
                         *
                         * @param {Cipher} cipher A block cipher instance.
                         * @param {Array} iv The IV words.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
                         */
                        createEncryptor: function (cipher, iv) {
                            return this.Encryptor.create(cipher, iv);
                        },

                        /**
                         * Creates this mode for decryption.
                         *
                         * @param {Cipher} cipher A block cipher instance.
                         * @param {Array} iv The IV words.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
                         */
                        createDecryptor: function (cipher, iv) {
                            return this.Decryptor.create(cipher, iv);
                        },

                        /**
                         * Initializes a newly created mode.
                         *
                         * @param {Cipher} cipher A block cipher instance.
                         * @param {Array} iv The IV words.
                         *
                         * @example
                         *
                         *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
                         */
                        init: function (cipher, iv) {
                            this._cipher = cipher;
                            this._iv = iv;
                        }
                    });

                    /**
                     * Cipher Block Chaining mode.
                     */
                    var CBC = C_mode.CBC = (function () {
                        /**
                         * Abstract base CBC mode.
                         */
                        var CBC = BlockCipherMode.extend();

                        /**
                         * CBC encryptor.
                         */
                        CBC.Encryptor = CBC.extend({
                            /**
                             * Processes the data block at offset.
                             *
                             * @param {Array} words The data words to operate on.
                             * @param {number} offset The offset where the block starts.
                             *
                             * @example
                             *
                             *     mode.processBlock(data.words, offset);
                             */
                            processBlock: function (words, offset) {
                                // Shortcuts
                                var cipher = this._cipher;
                                var blockSize = cipher.blockSize;

                                // XOR and encrypt
                                xorBlock.call(this, words, offset, blockSize);
                                cipher.encryptBlock(words, offset);

                                // Remember this block to use with next block
                                this._prevBlock = words.slice(offset, offset + blockSize);
                            }
                        });

                        /**
                         * CBC decryptor.
                         */
                        CBC.Decryptor = CBC.extend({
                            /**
                             * Processes the data block at offset.
                             *
                             * @param {Array} words The data words to operate on.
                             * @param {number} offset The offset where the block starts.
                             *
                             * @example
                             *
                             *     mode.processBlock(data.words, offset);
                             */
                            processBlock: function (words, offset) {
                                // Shortcuts
                                var cipher = this._cipher;
                                var blockSize = cipher.blockSize;

                                // Remember this block to use with next block
                                var thisBlock = words.slice(offset, offset + blockSize);

                                // Decrypt and XOR
                                cipher.decryptBlock(words, offset);
                                xorBlock.call(this, words, offset, blockSize);

                                // This block becomes the previous block
                                this._prevBlock = thisBlock;
                            }
                        });

                        function xorBlock(words, offset, blockSize) {
                            var block;

                            // Shortcut
                            var iv = this._iv;

                            // Choose mixing block
                            if (iv) {
                                block = iv;

                                // Remove IV for subsequent blocks
                                this._iv = undefined$1;
                            } else {
                                block = this._prevBlock;
                            }

                            // XOR blocks
                            for (var i = 0; i < blockSize; i++) {
                                words[offset + i] ^= block[i];
                            }
                        }

                        return CBC;
                    }());

                    /**
                     * Padding namespace.
                     */
                    var C_pad = C.pad = {};

                    /**
                     * PKCS #5/7 padding strategy.
                     */
                    var Pkcs7 = C_pad.Pkcs7 = {
                        /**
                         * Pads data using the algorithm defined in PKCS #5/7.
                         *
                         * @param {WordArray} data The data to pad.
                         * @param {number} blockSize The multiple that the data should be padded to.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
                         */
                        pad: function (data, blockSize) {
                            // Shortcut
                            var blockSizeBytes = blockSize * 4;

                            // Count padding bytes
                            var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

                            // Create padding word
                            var paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;

                            // Create padding
                            var paddingWords = [];
                            for (var i = 0; i < nPaddingBytes; i += 4) {
                                paddingWords.push(paddingWord);
                            }
                            var padding = WordArray.create(paddingWords, nPaddingBytes);

                            // Add padding
                            data.concat(padding);
                        },

                        /**
                         * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
                         *
                         * @param {WordArray} data The data to unpad.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     CryptoJS.pad.Pkcs7.unpad(wordArray);
                         */
                        unpad: function (data) {
                            // Get number of padding bytes from last byte
                            var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

                            // Remove padding
                            data.sigBytes -= nPaddingBytes;
                        }
                    };

                    /**
                     * Abstract base block cipher template.
                     *
                     * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 4 (128 bits)
                     */
                    C_lib.BlockCipher = Cipher.extend({
                        /**
                         * Configuration options.
                         *
                         * @property {Mode} mode The block mode to use. Default: CBC
                         * @property {Padding} padding The padding strategy to use. Default: Pkcs7
                         */
                        cfg: Cipher.cfg.extend({
                            mode: CBC,
                            padding: Pkcs7
                        }),

                        reset: function () {
                            var modeCreator;

                            // Reset cipher
                            Cipher.reset.call(this);

                            // Shortcuts
                            var cfg = this.cfg;
                            var iv = cfg.iv;
                            var mode = cfg.mode;

                            // Reset block mode
                            if (this._xformMode == this._ENC_XFORM_MODE) {
                                modeCreator = mode.createEncryptor;
                            } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
                                modeCreator = mode.createDecryptor;
                                // Keep at least one block in the buffer for unpadding
                                this._minBufferSize = 1;
                            }

                            if (this._mode && this._mode.__creator == modeCreator) {
                                this._mode.init(this, iv && iv.words);
                            } else {
                                this._mode = modeCreator.call(mode, this, iv && iv.words);
                                this._mode.__creator = modeCreator;
                            }
                        },

                        _doProcessBlock: function (words, offset) {
                            this._mode.processBlock(words, offset);
                        },

                        _doFinalize: function () {
                            var finalProcessedBlocks;

                            // Shortcut
                            var padding = this.cfg.padding;

                            // Finalize
                            if (this._xformMode == this._ENC_XFORM_MODE) {
                                // Pad data
                                padding.pad(this._data, this.blockSize);

                                // Process final blocks
                                finalProcessedBlocks = this._process(!!'flush');
                            } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
                                // Process final blocks
                                finalProcessedBlocks = this._process(!!'flush');

                                // Unpad data
                                padding.unpad(finalProcessedBlocks);
                            }

                            return finalProcessedBlocks;
                        },

                        blockSize: 128 / 32
                    });

                    /**
                     * A collection of cipher parameters.
                     *
                     * @property {WordArray} ciphertext The raw ciphertext.
                     * @property {WordArray} key The key to this ciphertext.
                     * @property {WordArray} iv The IV used in the ciphering operation.
                     * @property {WordArray} salt The salt used with a key derivation function.
                     * @property {Cipher} algorithm The cipher algorithm.
                     * @property {Mode} mode The block mode used in the ciphering operation.
                     * @property {Padding} padding The padding scheme used in the ciphering operation.
                     * @property {number} blockSize The block size of the cipher.
                     * @property {Format} formatter The default formatting strategy to convert this cipher params object to a string.
                     */
                    var CipherParams = C_lib.CipherParams = Base.extend({
                        /**
                         * Initializes a newly created cipher params object.
                         *
                         * @param {Object} cipherParams An object with any of the possible cipher parameters.
                         *
                         * @example
                         *
                         *     var cipherParams = CryptoJS.lib.CipherParams.create({
                         *         ciphertext: ciphertextWordArray,
                         *         key: keyWordArray,
                         *         iv: ivWordArray,
                         *         salt: saltWordArray,
                         *         algorithm: CryptoJS.algo.AES,
                         *         mode: CryptoJS.mode.CBC,
                         *         padding: CryptoJS.pad.PKCS7,
                         *         blockSize: 4,
                         *         formatter: CryptoJS.format.OpenSSL
                         *     });
                         */
                        init: function (cipherParams) {
                            this.mixIn(cipherParams);
                        },

                        /**
                         * Converts this cipher params object to a string.
                         *
                         * @param {Format} formatter (Optional) The formatting strategy to use.
                         *
                         * @return {string} The stringified cipher params.
                         *
                         * @throws Error If neither the formatter nor the default formatter is set.
                         *
                         * @example
                         *
                         *     var string = cipherParams + '';
                         *     var string = cipherParams.toString();
                         *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
                         */
                        toString: function (formatter) {
                            return (formatter || this.formatter).stringify(this);
                        }
                    });

                    /**
                     * Format namespace.
                     */
                    var C_format = C.format = {};

                    /**
                     * OpenSSL formatting strategy.
                     */
                    var OpenSSLFormatter = C_format.OpenSSL = {
                        /**
                         * Converts a cipher params object to an OpenSSL-compatible string.
                         *
                         * @param {CipherParams} cipherParams The cipher params object.
                         *
                         * @return {string} The OpenSSL-compatible string.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
                         */
                        stringify: function (cipherParams) {
                            var wordArray;

                            // Shortcuts
                            var ciphertext = cipherParams.ciphertext;
                            var salt = cipherParams.salt;

                            // Format
                            if (salt) {
                                wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
                            } else {
                                wordArray = ciphertext;
                            }

                            return wordArray.toString(Base64);
                        },

                        /**
                         * Converts an OpenSSL-compatible string to a cipher params object.
                         *
                         * @param {string} openSSLStr The OpenSSL-compatible string.
                         *
                         * @return {CipherParams} The cipher params object.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
                         */
                        parse: function (openSSLStr) {
                            var salt;

                            // Parse base64
                            var ciphertext = Base64.parse(openSSLStr);

                            // Shortcut
                            var ciphertextWords = ciphertext.words;

                            // Test for salt
                            if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {
                                // Extract salt
                                salt = WordArray.create(ciphertextWords.slice(2, 4));

                                // Remove salt from ciphertext
                                ciphertextWords.splice(0, 4);
                                ciphertext.sigBytes -= 16;
                            }

                            return CipherParams.create({ciphertext: ciphertext, salt: salt});
                        }
                    };

                    /**
                     * A cipher wrapper that returns ciphertext as a serializable cipher params object.
                     */
                    var SerializableCipher = C_lib.SerializableCipher = Base.extend({
                        /**
                         * Configuration options.
                         *
                         * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
                         */
                        cfg: Base.extend({
                            format: OpenSSLFormatter
                        }),

                        /**
                         * Encrypts a message.
                         *
                         * @param {Cipher} cipher The cipher algorithm to use.
                         * @param {WordArray|string} message The message to encrypt.
                         * @param {WordArray} key The key.
                         * @param {Object} cfg (Optional) The configuration options to use for this operation.
                         *
                         * @return {CipherParams} A cipher params object.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
                         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
                         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
                         */
                        encrypt: function (cipher, message, key, cfg) {
                            // Apply config defaults
                            cfg = this.cfg.extend(cfg);

                            // Encrypt
                            var encryptor = cipher.createEncryptor(key, cfg);
                            var ciphertext = encryptor.finalize(message);

                            // Shortcut
                            var cipherCfg = encryptor.cfg;

                            // Create and return serializable cipher params
                            return CipherParams.create({
                                ciphertext: ciphertext,
                                key: key,
                                iv: cipherCfg.iv,
                                algorithm: cipher,
                                mode: cipherCfg.mode,
                                padding: cipherCfg.padding,
                                blockSize: cipher.blockSize,
                                formatter: cfg.format
                            });
                        },

                        /**
                         * Decrypts serialized ciphertext.
                         *
                         * @param {Cipher} cipher The cipher algorithm to use.
                         * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
                         * @param {WordArray} key The key.
                         * @param {Object} cfg (Optional) The configuration options to use for this operation.
                         *
                         * @return {WordArray} The plaintext.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
                         *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
                         */
                        decrypt: function (cipher, ciphertext, key, cfg) {
                            // Apply config defaults
                            cfg = this.cfg.extend(cfg);

                            // Convert string to CipherParams
                            ciphertext = this._parse(ciphertext, cfg.format);

                            // Decrypt
                            var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);

                            return plaintext;
                        },

                        /**
                         * Converts serialized ciphertext to CipherParams,
                         * else assumed CipherParams already and returns ciphertext unchanged.
                         *
                         * @param {CipherParams|string} ciphertext The ciphertext.
                         * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
                         *
                         * @return {CipherParams} The unserialized ciphertext.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
                         */
                        _parse: function (ciphertext, format) {
                            if (typeof ciphertext == 'string') {
                                return format.parse(ciphertext, this);
                            } else {
                                return ciphertext;
                            }
                        }
                    });

                    /**
                     * Key derivation function namespace.
                     */
                    var C_kdf = C.kdf = {};

                    /**
                     * OpenSSL key derivation function.
                     */
                    var OpenSSLKdf = C_kdf.OpenSSL = {
                        /**
                         * Derives a key and IV from a password.
                         *
                         * @param {string} password The password to derive from.
                         * @param {number} keySize The size in words of the key to generate.
                         * @param {number} ivSize The size in words of the IV to generate.
                         * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
                         *
                         * @return {CipherParams} A cipher params object with the key, IV, and salt.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
                         *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
                         */
                        execute: function (password, keySize, ivSize, salt) {
                            // Generate random salt
                            if (!salt) {
                                salt = WordArray.random(64 / 8);
                            }

                            // Derive key and IV
                            var key = EvpKDF.create({keySize: keySize + ivSize}).compute(password, salt);

                            // Separate key and IV
                            var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
                            key.sigBytes = keySize * 4;

                            // Return params
                            return CipherParams.create({key: key, iv: iv, salt: salt});
                        }
                    };

                    /**
                     * A serializable cipher wrapper that derives the key from a password,
                     * and returns ciphertext as a serializable cipher params object.
                     */
                    var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
                        /**
                         * Configuration options.
                         *
                         * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
                         */
                        cfg: SerializableCipher.cfg.extend({
                            kdf: OpenSSLKdf
                        }),

                        /**
                         * Encrypts a message using a password.
                         *
                         * @param {Cipher} cipher The cipher algorithm to use.
                         * @param {WordArray|string} message The message to encrypt.
                         * @param {string} password The password.
                         * @param {Object} cfg (Optional) The configuration options to use for this operation.
                         *
                         * @return {CipherParams} A cipher params object.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
                         *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
                         */
                        encrypt: function (cipher, message, password, cfg) {
                            // Apply config defaults
                            cfg = this.cfg.extend(cfg);

                            // Derive key and other params
                            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);

                            // Add IV to config
                            cfg.iv = derivedParams.iv;

                            // Encrypt
                            var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);

                            // Mix in derived params
                            ciphertext.mixIn(derivedParams);

                            return ciphertext;
                        },

                        /**
                         * Decrypts serialized ciphertext using a password.
                         *
                         * @param {Cipher} cipher The cipher algorithm to use.
                         * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
                         * @param {string} password The password.
                         * @param {Object} cfg (Optional) The configuration options to use for this operation.
                         *
                         * @return {WordArray} The plaintext.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
                         *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
                         */
                        decrypt: function (cipher, ciphertext, password, cfg) {
                            // Apply config defaults
                            cfg = this.cfg.extend(cfg);

                            // Convert string to CipherParams
                            ciphertext = this._parse(ciphertext, cfg.format);

                            // Derive key and other params
                            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);

                            // Add IV to config
                            cfg.iv = derivedParams.iv;

                            // Decrypt
                            var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);

                            return plaintext;
                        }
                    });
                }());


            }));
        }(cipherCore));
        return cipherCoreExports;
    }

    var modeCfbExports = {};
    var modeCfb = {
        get exports() {
            return modeCfbExports;
        },
        set exports(v) {
            modeCfbExports = v;
        },
    };

    var hasRequiredModeCfb;

    function requireModeCfb() {
        if (hasRequiredModeCfb) return modeCfbExports;
        hasRequiredModeCfb = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                /**
                 * Cipher Feedback block mode.
                 */
                CryptoJS.mode.CFB = (function () {
                    var CFB = CryptoJS.lib.BlockCipherMode.extend();

                    CFB.Encryptor = CFB.extend({
                        processBlock: function (words, offset) {
                            // Shortcuts
                            var cipher = this._cipher;
                            var blockSize = cipher.blockSize;

                            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);

                            // Remember this block to use with next block
                            this._prevBlock = words.slice(offset, offset + blockSize);
                        }
                    });

                    CFB.Decryptor = CFB.extend({
                        processBlock: function (words, offset) {
                            // Shortcuts
                            var cipher = this._cipher;
                            var blockSize = cipher.blockSize;

                            // Remember this block to use with next block
                            var thisBlock = words.slice(offset, offset + blockSize);

                            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);

                            // This block becomes the previous block
                            this._prevBlock = thisBlock;
                        }
                    });

                    function generateKeystreamAndEncrypt(words, offset, blockSize, cipher) {
                        var keystream;

                        // Shortcut
                        var iv = this._iv;

                        // Generate keystream
                        if (iv) {
                            keystream = iv.slice(0);

                            // Remove IV for subsequent blocks
                            this._iv = undefined;
                        } else {
                            keystream = this._prevBlock;
                        }
                        cipher.encryptBlock(keystream, 0);

                        // Encrypt
                        for (var i = 0; i < blockSize; i++) {
                            words[offset + i] ^= keystream[i];
                        }
                    }

                    return CFB;
                }());


                return CryptoJS.mode.CFB;

            }));
        }(modeCfb));
        return modeCfbExports;
    }

    var modeCtrExports = {};
    var modeCtr = {
        get exports() {
            return modeCtrExports;
        },
        set exports(v) {
            modeCtrExports = v;
        },
    };

    var hasRequiredModeCtr;

    function requireModeCtr() {
        if (hasRequiredModeCtr) return modeCtrExports;
        hasRequiredModeCtr = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                /**
                 * Counter block mode.
                 */
                CryptoJS.mode.CTR = (function () {
                    var CTR = CryptoJS.lib.BlockCipherMode.extend();

                    var Encryptor = CTR.Encryptor = CTR.extend({
                        processBlock: function (words, offset) {
                            // Shortcuts
                            var cipher = this._cipher;
                            var blockSize = cipher.blockSize;
                            var iv = this._iv;
                            var counter = this._counter;

                            // Generate keystream
                            if (iv) {
                                counter = this._counter = iv.slice(0);

                                // Remove IV for subsequent blocks
                                this._iv = undefined;
                            }
                            var keystream = counter.slice(0);
                            cipher.encryptBlock(keystream, 0);

                            // Increment counter
                            counter[blockSize - 1] = (counter[blockSize - 1] + 1) | 0;

                            // Encrypt
                            for (var i = 0; i < blockSize; i++) {
                                words[offset + i] ^= keystream[i];
                            }
                        }
                    });

                    CTR.Decryptor = Encryptor;

                    return CTR;
                }());


                return CryptoJS.mode.CTR;

            }));
        }(modeCtr));
        return modeCtrExports;
    }

    var modeCtrGladmanExports = {};
    var modeCtrGladman = {
        get exports() {
            return modeCtrGladmanExports;
        },
        set exports(v) {
            modeCtrGladmanExports = v;
        },
    };

    var hasRequiredModeCtrGladman;

    function requireModeCtrGladman() {
        if (hasRequiredModeCtrGladman) return modeCtrGladmanExports;
        hasRequiredModeCtrGladman = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                /** @preserve
                 * Counter block mode compatible with  Dr Brian Gladman fileenc.c
                 * derived from CryptoJS.mode.CTR
                 * Jan Hruby jhruby.web@gmail.com
                 */
                CryptoJS.mode.CTRGladman = (function () {
                    var CTRGladman = CryptoJS.lib.BlockCipherMode.extend();

                    function incWord(word) {
                        if (((word >> 24) & 0xff) === 0xff) { //overflow
                            var b1 = (word >> 16) & 0xff;
                            var b2 = (word >> 8) & 0xff;
                            var b3 = word & 0xff;

                            if (b1 === 0xff) // overflow b1
                            {
                                b1 = 0;
                                if (b2 === 0xff) {
                                    b2 = 0;
                                    if (b3 === 0xff) {
                                        b3 = 0;
                                    } else {
                                        ++b3;
                                    }
                                } else {
                                    ++b2;
                                }
                            } else {
                                ++b1;
                            }

                            word = 0;
                            word += (b1 << 16);
                            word += (b2 << 8);
                            word += b3;
                        } else {
                            word += (0x01 << 24);
                        }
                        return word;
                    }

                    function incCounter(counter) {
                        if ((counter[0] = incWord(counter[0])) === 0) {
                            // encr_data in fileenc.c from  Dr Brian Gladman's counts only with DWORD j < 8
                            counter[1] = incWord(counter[1]);
                        }
                        return counter;
                    }

                    var Encryptor = CTRGladman.Encryptor = CTRGladman.extend({
                        processBlock: function (words, offset) {
                            // Shortcuts
                            var cipher = this._cipher;
                            var blockSize = cipher.blockSize;
                            var iv = this._iv;
                            var counter = this._counter;

                            // Generate keystream
                            if (iv) {
                                counter = this._counter = iv.slice(0);

                                // Remove IV for subsequent blocks
                                this._iv = undefined;
                            }

                            incCounter(counter);

                            var keystream = counter.slice(0);
                            cipher.encryptBlock(keystream, 0);

                            // Encrypt
                            for (var i = 0; i < blockSize; i++) {
                                words[offset + i] ^= keystream[i];
                            }
                        }
                    });

                    CTRGladman.Decryptor = Encryptor;

                    return CTRGladman;
                }());


                return CryptoJS.mode.CTRGladman;

            }));
        }(modeCtrGladman));
        return modeCtrGladmanExports;
    }

    var modeOfbExports = {};
    var modeOfb = {
        get exports() {
            return modeOfbExports;
        },
        set exports(v) {
            modeOfbExports = v;
        },
    };

    var hasRequiredModeOfb;

    function requireModeOfb() {
        if (hasRequiredModeOfb) return modeOfbExports;
        hasRequiredModeOfb = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                /**
                 * Output Feedback block mode.
                 */
                CryptoJS.mode.OFB = (function () {
                    var OFB = CryptoJS.lib.BlockCipherMode.extend();

                    var Encryptor = OFB.Encryptor = OFB.extend({
                        processBlock: function (words, offset) {
                            // Shortcuts
                            var cipher = this._cipher;
                            var blockSize = cipher.blockSize;
                            var iv = this._iv;
                            var keystream = this._keystream;

                            // Generate keystream
                            if (iv) {
                                keystream = this._keystream = iv.slice(0);

                                // Remove IV for subsequent blocks
                                this._iv = undefined;
                            }
                            cipher.encryptBlock(keystream, 0);

                            // Encrypt
                            for (var i = 0; i < blockSize; i++) {
                                words[offset + i] ^= keystream[i];
                            }
                        }
                    });

                    OFB.Decryptor = Encryptor;

                    return OFB;
                }());


                return CryptoJS.mode.OFB;

            }));
        }(modeOfb));
        return modeOfbExports;
    }

    var modeEcbExports = {};
    var modeEcb = {
        get exports() {
            return modeEcbExports;
        },
        set exports(v) {
            modeEcbExports = v;
        },
    };

    var hasRequiredModeEcb;

    function requireModeEcb() {
        if (hasRequiredModeEcb) return modeEcbExports;
        hasRequiredModeEcb = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                /**
                 * Electronic Codebook block mode.
                 */
                CryptoJS.mode.ECB = (function () {
                    var ECB = CryptoJS.lib.BlockCipherMode.extend();

                    ECB.Encryptor = ECB.extend({
                        processBlock: function (words, offset) {
                            this._cipher.encryptBlock(words, offset);
                        }
                    });

                    ECB.Decryptor = ECB.extend({
                        processBlock: function (words, offset) {
                            this._cipher.decryptBlock(words, offset);
                        }
                    });

                    return ECB;
                }());


                return CryptoJS.mode.ECB;

            }));
        }(modeEcb));
        return modeEcbExports;
    }

    var padAnsix923Exports = {};
    var padAnsix923 = {
        get exports() {
            return padAnsix923Exports;
        },
        set exports(v) {
            padAnsix923Exports = v;
        },
    };

    var hasRequiredPadAnsix923;

    function requirePadAnsix923() {
        if (hasRequiredPadAnsix923) return padAnsix923Exports;
        hasRequiredPadAnsix923 = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                /**
                 * ANSI X.923 padding strategy.
                 */
                CryptoJS.pad.AnsiX923 = {
                    pad: function (data, blockSize) {
                        // Shortcuts
                        var dataSigBytes = data.sigBytes;
                        var blockSizeBytes = blockSize * 4;

                        // Count padding bytes
                        var nPaddingBytes = blockSizeBytes - dataSigBytes % blockSizeBytes;

                        // Compute last byte position
                        var lastBytePos = dataSigBytes + nPaddingBytes - 1;

                        // Pad
                        data.clamp();
                        data.words[lastBytePos >>> 2] |= nPaddingBytes << (24 - (lastBytePos % 4) * 8);
                        data.sigBytes += nPaddingBytes;
                    },

                    unpad: function (data) {
                        // Get number of padding bytes from last byte
                        var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

                        // Remove padding
                        data.sigBytes -= nPaddingBytes;
                    }
                };


                return CryptoJS.pad.Ansix923;

            }));
        }(padAnsix923));
        return padAnsix923Exports;
    }

    var padIso10126Exports = {};
    var padIso10126 = {
        get exports() {
            return padIso10126Exports;
        },
        set exports(v) {
            padIso10126Exports = v;
        },
    };

    var hasRequiredPadIso10126;

    function requirePadIso10126() {
        if (hasRequiredPadIso10126) return padIso10126Exports;
        hasRequiredPadIso10126 = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                /**
                 * ISO 10126 padding strategy.
                 */
                CryptoJS.pad.Iso10126 = {
                    pad: function (data, blockSize) {
                        // Shortcut
                        var blockSizeBytes = blockSize * 4;

                        // Count padding bytes
                        var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

                        // Pad
                        data.concat(CryptoJS.lib.WordArray.random(nPaddingBytes - 1)).concat(CryptoJS.lib.WordArray.create([nPaddingBytes << 24], 1));
                    },

                    unpad: function (data) {
                        // Get number of padding bytes from last byte
                        var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

                        // Remove padding
                        data.sigBytes -= nPaddingBytes;
                    }
                };


                return CryptoJS.pad.Iso10126;

            }));
        }(padIso10126));
        return padIso10126Exports;
    }

    var padIso97971Exports = {};
    var padIso97971 = {
        get exports() {
            return padIso97971Exports;
        },
        set exports(v) {
            padIso97971Exports = v;
        },
    };

    var hasRequiredPadIso97971;

    function requirePadIso97971() {
        if (hasRequiredPadIso97971) return padIso97971Exports;
        hasRequiredPadIso97971 = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                /**
                 * ISO/IEC 9797-1 Padding Method 2.
                 */
                CryptoJS.pad.Iso97971 = {
                    pad: function (data, blockSize) {
                        // Add 0x80 byte
                        data.concat(CryptoJS.lib.WordArray.create([0x80000000], 1));

                        // Zero pad the rest
                        CryptoJS.pad.ZeroPadding.pad(data, blockSize);
                    },

                    unpad: function (data) {
                        // Remove zero padding
                        CryptoJS.pad.ZeroPadding.unpad(data);

                        // Remove one more byte -- the 0x80 byte
                        data.sigBytes--;
                    }
                };


                return CryptoJS.pad.Iso97971;

            }));
        }(padIso97971));
        return padIso97971Exports;
    }

    var padZeropaddingExports = {};
    var padZeropadding = {
        get exports() {
            return padZeropaddingExports;
        },
        set exports(v) {
            padZeropaddingExports = v;
        },
    };

    var hasRequiredPadZeropadding;

    function requirePadZeropadding() {
        if (hasRequiredPadZeropadding) return padZeropaddingExports;
        hasRequiredPadZeropadding = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                /**
                 * Zero padding strategy.
                 */
                CryptoJS.pad.ZeroPadding = {
                    pad: function (data, blockSize) {
                        // Shortcut
                        var blockSizeBytes = blockSize * 4;

                        // Pad
                        data.clamp();
                        data.sigBytes += blockSizeBytes - ((data.sigBytes % blockSizeBytes) || blockSizeBytes);
                    },

                    unpad: function (data) {
                        // Shortcut
                        var dataWords = data.words;

                        // Unpad
                        var i = data.sigBytes - 1;
                        for (var i = data.sigBytes - 1; i >= 0; i--) {
                            if (((dataWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)) {
                                data.sigBytes = i + 1;
                                break;
                            }
                        }
                    }
                };


                return CryptoJS.pad.ZeroPadding;

            }));
        }(padZeropadding));
        return padZeropaddingExports;
    }

    var padNopaddingExports = {};
    var padNopadding = {
        get exports() {
            return padNopaddingExports;
        },
        set exports(v) {
            padNopaddingExports = v;
        },
    };

    var hasRequiredPadNopadding;

    function requirePadNopadding() {
        if (hasRequiredPadNopadding) return padNopaddingExports;
        hasRequiredPadNopadding = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                /**
                 * A noop padding strategy.
                 */
                CryptoJS.pad.NoPadding = {
                    pad: function () {
                    },

                    unpad: function () {
                    }
                };


                return CryptoJS.pad.NoPadding;

            }));
        }(padNopadding));
        return padNopaddingExports;
    }

    var formatHexExports = {};
    var formatHex = {
        get exports() {
            return formatHexExports;
        },
        set exports(v) {
            formatHexExports = v;
        },
    };

    var hasRequiredFormatHex;

    function requireFormatHex() {
        if (hasRequiredFormatHex) return formatHexExports;
        hasRequiredFormatHex = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function (undefined$1) {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var CipherParams = C_lib.CipherParams;
                    var C_enc = C.enc;
                    var Hex = C_enc.Hex;
                    var C_format = C.format;

                    C_format.Hex = {
                        /**
                         * Converts the ciphertext of a cipher params object to a hexadecimally encoded string.
                         *
                         * @param {CipherParams} cipherParams The cipher params object.
                         *
                         * @return {string} The hexadecimally encoded string.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var hexString = CryptoJS.format.Hex.stringify(cipherParams);
                         */
                        stringify: function (cipherParams) {
                            return cipherParams.ciphertext.toString(Hex);
                        },

                        /**
                         * Converts a hexadecimally encoded ciphertext string to a cipher params object.
                         *
                         * @param {string} input The hexadecimally encoded string.
                         *
                         * @return {CipherParams} The cipher params object.
                         *
                         * @static
                         *
                         * @example
                         *
                         *     var cipherParams = CryptoJS.format.Hex.parse(hexString);
                         */
                        parse: function (input) {
                            var ciphertext = Hex.parse(input);
                            return CipherParams.create({ciphertext: ciphertext});
                        }
                    };
                }());


                return CryptoJS.format.Hex;

            }));
        }(formatHex));
        return formatHexExports;
    }

    var aesExports = {};
    var aes = {
        get exports() {
            return aesExports;
        },
        set exports(v) {
            aesExports = v;
        },
    };

    var hasRequiredAes;

    function requireAes() {
        if (hasRequiredAes) return aesExports;
        hasRequiredAes = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireEncBase64(), requireMd5(), requireEvpkdf(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var BlockCipher = C_lib.BlockCipher;
                    var C_algo = C.algo;

                    // Lookup tables
                    var SBOX = [];
                    var INV_SBOX = [];
                    var SUB_MIX_0 = [];
                    var SUB_MIX_1 = [];
                    var SUB_MIX_2 = [];
                    var SUB_MIX_3 = [];
                    var INV_SUB_MIX_0 = [];
                    var INV_SUB_MIX_1 = [];
                    var INV_SUB_MIX_2 = [];
                    var INV_SUB_MIX_3 = [];

                    // Compute lookup tables
                    (function () {
                        // Compute double table
                        var d = [];
                        for (var i = 0; i < 256; i++) {
                            if (i < 128) {
                                d[i] = i << 1;
                            } else {
                                d[i] = (i << 1) ^ 0x11b;
                            }
                        }

                        // Walk GF(2^8)
                        var x = 0;
                        var xi = 0;
                        for (var i = 0; i < 256; i++) {
                            // Compute sbox
                            var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
                            sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
                            SBOX[x] = sx;
                            INV_SBOX[sx] = x;

                            // Compute multiplication
                            var x2 = d[x];
                            var x4 = d[x2];
                            var x8 = d[x4];

                            // Compute sub bytes, mix columns tables
                            var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
                            SUB_MIX_0[x] = (t << 24) | (t >>> 8);
                            SUB_MIX_1[x] = (t << 16) | (t >>> 16);
                            SUB_MIX_2[x] = (t << 8) | (t >>> 24);
                            SUB_MIX_3[x] = t;

                            // Compute inv sub bytes, inv mix columns tables
                            var t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
                            INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
                            INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
                            INV_SUB_MIX_2[sx] = (t << 8) | (t >>> 24);
                            INV_SUB_MIX_3[sx] = t;

                            // Compute next counter
                            if (!x) {
                                x = xi = 1;
                            } else {
                                x = x2 ^ d[d[d[x8 ^ x2]]];
                                xi ^= d[d[xi]];
                            }
                        }
                    }());

                    // Precomputed Rcon lookup
                    var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

                    /**
                     * AES block cipher algorithm.
                     */
                    var AES = C_algo.AES = BlockCipher.extend({
                        _doReset: function () {
                            var t;

                            // Skip reset of nRounds has been set before and key did not change
                            if (this._nRounds && this._keyPriorReset === this._key) {
                                return;
                            }

                            // Shortcuts
                            var key = this._keyPriorReset = this._key;
                            var keyWords = key.words;
                            var keySize = key.sigBytes / 4;

                            // Compute number of rounds
                            var nRounds = this._nRounds = keySize + 6;

                            // Compute number of key schedule rows
                            var ksRows = (nRounds + 1) * 4;

                            // Compute key schedule
                            var keySchedule = this._keySchedule = [];
                            for (var ksRow = 0; ksRow < ksRows; ksRow++) {
                                if (ksRow < keySize) {
                                    keySchedule[ksRow] = keyWords[ksRow];
                                } else {
                                    t = keySchedule[ksRow - 1];

                                    if (!(ksRow % keySize)) {
                                        // Rot word
                                        t = (t << 8) | (t >>> 24);

                                        // Sub word
                                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];

                                        // Mix Rcon
                                        t ^= RCON[(ksRow / keySize) | 0] << 24;
                                    } else if (keySize > 6 && ksRow % keySize == 4) {
                                        // Sub word
                                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
                                    }

                                    keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
                                }
                            }

                            // Compute inv key schedule
                            var invKeySchedule = this._invKeySchedule = [];
                            for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
                                var ksRow = ksRows - invKsRow;

                                if (invKsRow % 4) {
                                    var t = keySchedule[ksRow];
                                } else {
                                    var t = keySchedule[ksRow - 4];
                                }

                                if (invKsRow < 4 || ksRow <= 4) {
                                    invKeySchedule[invKsRow] = t;
                                } else {
                                    invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
                                        INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
                                }
                            }
                        },

                        encryptBlock: function (M, offset) {
                            this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
                        },

                        decryptBlock: function (M, offset) {
                            // Swap 2nd and 4th rows
                            var t = M[offset + 1];
                            M[offset + 1] = M[offset + 3];
                            M[offset + 3] = t;

                            this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);

                            // Inv swap 2nd and 4th rows
                            var t = M[offset + 1];
                            M[offset + 1] = M[offset + 3];
                            M[offset + 3] = t;
                        },

                        _doCryptBlock: function (M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
                            // Shortcut
                            var nRounds = this._nRounds;

                            // Get input, add round key
                            var s0 = M[offset] ^ keySchedule[0];
                            var s1 = M[offset + 1] ^ keySchedule[1];
                            var s2 = M[offset + 2] ^ keySchedule[2];
                            var s3 = M[offset + 3] ^ keySchedule[3];

                            // Key schedule row counter
                            var ksRow = 4;

                            // Rounds
                            for (var round = 1; round < nRounds; round++) {
                                // Shift rows, sub bytes, mix columns, add round key
                                var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
                                var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
                                var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
                                var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];

                                // Update state
                                s0 = t0;
                                s1 = t1;
                                s2 = t2;
                                s3 = t3;
                            }

                            // Shift rows, sub bytes, add round key
                            var t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
                            var t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
                            var t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
                            var t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];

                            // Set output
                            M[offset] = t0;
                            M[offset + 1] = t1;
                            M[offset + 2] = t2;
                            M[offset + 3] = t3;
                        },

                        keySize: 256 / 32
                    });

                    /**
                     * Shortcut functions to the cipher's object interface.
                     *
                     * @example
                     *
                     *     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
                     *     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
                     */
                    C.AES = BlockCipher._createHelper(AES);
                }());


                return CryptoJS.AES;

            }));
        }(aes));
        return aesExports;
    }

    var tripledesExports = {};
    var tripledes = {
        get exports() {
            return tripledesExports;
        },
        set exports(v) {
            tripledesExports = v;
        },
    };

    var hasRequiredTripledes;

    function requireTripledes() {
        if (hasRequiredTripledes) return tripledesExports;
        hasRequiredTripledes = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireEncBase64(), requireMd5(), requireEvpkdf(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var WordArray = C_lib.WordArray;
                    var BlockCipher = C_lib.BlockCipher;
                    var C_algo = C.algo;

                    // Permuted Choice 1 constants
                    var PC1 = [
                        57, 49, 41, 33, 25, 17, 9, 1,
                        58, 50, 42, 34, 26, 18, 10, 2,
                        59, 51, 43, 35, 27, 19, 11, 3,
                        60, 52, 44, 36, 63, 55, 47, 39,
                        31, 23, 15, 7, 62, 54, 46, 38,
                        30, 22, 14, 6, 61, 53, 45, 37,
                        29, 21, 13, 5, 28, 20, 12, 4
                    ];

                    // Permuted Choice 2 constants
                    var PC2 = [
                        14, 17, 11, 24, 1, 5,
                        3, 28, 15, 6, 21, 10,
                        23, 19, 12, 4, 26, 8,
                        16, 7, 27, 20, 13, 2,
                        41, 52, 31, 37, 47, 55,
                        30, 40, 51, 45, 33, 48,
                        44, 49, 39, 56, 34, 53,
                        46, 42, 50, 36, 29, 32
                    ];

                    // Cumulative bit shift constants
                    var BIT_SHIFTS = [1, 2, 4, 6, 8, 10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28];

                    // SBOXes and round permutation constants
                    var SBOX_P = [
                        {
                            0x0: 0x808200,
                            0x10000000: 0x8000,
                            0x20000000: 0x808002,
                            0x30000000: 0x2,
                            0x40000000: 0x200,
                            0x50000000: 0x808202,
                            0x60000000: 0x800202,
                            0x70000000: 0x800000,
                            0x80000000: 0x202,
                            0x90000000: 0x800200,
                            0xa0000000: 0x8200,
                            0xb0000000: 0x808000,
                            0xc0000000: 0x8002,
                            0xd0000000: 0x800002,
                            0xe0000000: 0x0,
                            0xf0000000: 0x8202,
                            0x8000000: 0x0,
                            0x18000000: 0x808202,
                            0x28000000: 0x8202,
                            0x38000000: 0x8000,
                            0x48000000: 0x808200,
                            0x58000000: 0x200,
                            0x68000000: 0x808002,
                            0x78000000: 0x2,
                            0x88000000: 0x800200,
                            0x98000000: 0x8200,
                            0xa8000000: 0x808000,
                            0xb8000000: 0x800202,
                            0xc8000000: 0x800002,
                            0xd8000000: 0x8002,
                            0xe8000000: 0x202,
                            0xf8000000: 0x800000,
                            0x1: 0x8000,
                            0x10000001: 0x2,
                            0x20000001: 0x808200,
                            0x30000001: 0x800000,
                            0x40000001: 0x808002,
                            0x50000001: 0x8200,
                            0x60000001: 0x200,
                            0x70000001: 0x800202,
                            0x80000001: 0x808202,
                            0x90000001: 0x808000,
                            0xa0000001: 0x800002,
                            0xb0000001: 0x8202,
                            0xc0000001: 0x202,
                            0xd0000001: 0x800200,
                            0xe0000001: 0x8002,
                            0xf0000001: 0x0,
                            0x8000001: 0x808202,
                            0x18000001: 0x808000,
                            0x28000001: 0x800000,
                            0x38000001: 0x200,
                            0x48000001: 0x8000,
                            0x58000001: 0x800002,
                            0x68000001: 0x2,
                            0x78000001: 0x8202,
                            0x88000001: 0x8002,
                            0x98000001: 0x800202,
                            0xa8000001: 0x202,
                            0xb8000001: 0x808200,
                            0xc8000001: 0x800200,
                            0xd8000001: 0x0,
                            0xe8000001: 0x8200,
                            0xf8000001: 0x808002
                        },
                        {
                            0x0: 0x40084010,
                            0x1000000: 0x4000,
                            0x2000000: 0x80000,
                            0x3000000: 0x40080010,
                            0x4000000: 0x40000010,
                            0x5000000: 0x40084000,
                            0x6000000: 0x40004000,
                            0x7000000: 0x10,
                            0x8000000: 0x84000,
                            0x9000000: 0x40004010,
                            0xa000000: 0x40000000,
                            0xb000000: 0x84010,
                            0xc000000: 0x80010,
                            0xd000000: 0x0,
                            0xe000000: 0x4010,
                            0xf000000: 0x40080000,
                            0x800000: 0x40004000,
                            0x1800000: 0x84010,
                            0x2800000: 0x10,
                            0x3800000: 0x40004010,
                            0x4800000: 0x40084010,
                            0x5800000: 0x40000000,
                            0x6800000: 0x80000,
                            0x7800000: 0x40080010,
                            0x8800000: 0x80010,
                            0x9800000: 0x0,
                            0xa800000: 0x4000,
                            0xb800000: 0x40080000,
                            0xc800000: 0x40000010,
                            0xd800000: 0x84000,
                            0xe800000: 0x40084000,
                            0xf800000: 0x4010,
                            0x10000000: 0x0,
                            0x11000000: 0x40080010,
                            0x12000000: 0x40004010,
                            0x13000000: 0x40084000,
                            0x14000000: 0x40080000,
                            0x15000000: 0x10,
                            0x16000000: 0x84010,
                            0x17000000: 0x4000,
                            0x18000000: 0x4010,
                            0x19000000: 0x80000,
                            0x1a000000: 0x80010,
                            0x1b000000: 0x40000010,
                            0x1c000000: 0x84000,
                            0x1d000000: 0x40004000,
                            0x1e000000: 0x40000000,
                            0x1f000000: 0x40084010,
                            0x10800000: 0x84010,
                            0x11800000: 0x80000,
                            0x12800000: 0x40080000,
                            0x13800000: 0x4000,
                            0x14800000: 0x40004000,
                            0x15800000: 0x40084010,
                            0x16800000: 0x10,
                            0x17800000: 0x40000000,
                            0x18800000: 0x40084000,
                            0x19800000: 0x40000010,
                            0x1a800000: 0x40004010,
                            0x1b800000: 0x80010,
                            0x1c800000: 0x0,
                            0x1d800000: 0x4010,
                            0x1e800000: 0x40080010,
                            0x1f800000: 0x84000
                        },
                        {
                            0x0: 0x104,
                            0x100000: 0x0,
                            0x200000: 0x4000100,
                            0x300000: 0x10104,
                            0x400000: 0x10004,
                            0x500000: 0x4000004,
                            0x600000: 0x4010104,
                            0x700000: 0x4010000,
                            0x800000: 0x4000000,
                            0x900000: 0x4010100,
                            0xa00000: 0x10100,
                            0xb00000: 0x4010004,
                            0xc00000: 0x4000104,
                            0xd00000: 0x10000,
                            0xe00000: 0x4,
                            0xf00000: 0x100,
                            0x80000: 0x4010100,
                            0x180000: 0x4010004,
                            0x280000: 0x0,
                            0x380000: 0x4000100,
                            0x480000: 0x4000004,
                            0x580000: 0x10000,
                            0x680000: 0x10004,
                            0x780000: 0x104,
                            0x880000: 0x4,
                            0x980000: 0x100,
                            0xa80000: 0x4010000,
                            0xb80000: 0x10104,
                            0xc80000: 0x10100,
                            0xd80000: 0x4000104,
                            0xe80000: 0x4010104,
                            0xf80000: 0x4000000,
                            0x1000000: 0x4010100,
                            0x1100000: 0x10004,
                            0x1200000: 0x10000,
                            0x1300000: 0x4000100,
                            0x1400000: 0x100,
                            0x1500000: 0x4010104,
                            0x1600000: 0x4000004,
                            0x1700000: 0x0,
                            0x1800000: 0x4000104,
                            0x1900000: 0x4000000,
                            0x1a00000: 0x4,
                            0x1b00000: 0x10100,
                            0x1c00000: 0x4010000,
                            0x1d00000: 0x104,
                            0x1e00000: 0x10104,
                            0x1f00000: 0x4010004,
                            0x1080000: 0x4000000,
                            0x1180000: 0x104,
                            0x1280000: 0x4010100,
                            0x1380000: 0x0,
                            0x1480000: 0x10004,
                            0x1580000: 0x4000100,
                            0x1680000: 0x100,
                            0x1780000: 0x4010004,
                            0x1880000: 0x10000,
                            0x1980000: 0x4010104,
                            0x1a80000: 0x10104,
                            0x1b80000: 0x4000004,
                            0x1c80000: 0x4000104,
                            0x1d80000: 0x4010000,
                            0x1e80000: 0x4,
                            0x1f80000: 0x10100
                        },
                        {
                            0x0: 0x80401000,
                            0x10000: 0x80001040,
                            0x20000: 0x401040,
                            0x30000: 0x80400000,
                            0x40000: 0x0,
                            0x50000: 0x401000,
                            0x60000: 0x80000040,
                            0x70000: 0x400040,
                            0x80000: 0x80000000,
                            0x90000: 0x400000,
                            0xa0000: 0x40,
                            0xb0000: 0x80001000,
                            0xc0000: 0x80400040,
                            0xd0000: 0x1040,
                            0xe0000: 0x1000,
                            0xf0000: 0x80401040,
                            0x8000: 0x80001040,
                            0x18000: 0x40,
                            0x28000: 0x80400040,
                            0x38000: 0x80001000,
                            0x48000: 0x401000,
                            0x58000: 0x80401040,
                            0x68000: 0x0,
                            0x78000: 0x80400000,
                            0x88000: 0x1000,
                            0x98000: 0x80401000,
                            0xa8000: 0x400000,
                            0xb8000: 0x1040,
                            0xc8000: 0x80000000,
                            0xd8000: 0x400040,
                            0xe8000: 0x401040,
                            0xf8000: 0x80000040,
                            0x100000: 0x400040,
                            0x110000: 0x401000,
                            0x120000: 0x80000040,
                            0x130000: 0x0,
                            0x140000: 0x1040,
                            0x150000: 0x80400040,
                            0x160000: 0x80401000,
                            0x170000: 0x80001040,
                            0x180000: 0x80401040,
                            0x190000: 0x80000000,
                            0x1a0000: 0x80400000,
                            0x1b0000: 0x401040,
                            0x1c0000: 0x80001000,
                            0x1d0000: 0x400000,
                            0x1e0000: 0x40,
                            0x1f0000: 0x1000,
                            0x108000: 0x80400000,
                            0x118000: 0x80401040,
                            0x128000: 0x0,
                            0x138000: 0x401000,
                            0x148000: 0x400040,
                            0x158000: 0x80000000,
                            0x168000: 0x80001040,
                            0x178000: 0x40,
                            0x188000: 0x80000040,
                            0x198000: 0x1000,
                            0x1a8000: 0x80001000,
                            0x1b8000: 0x80400040,
                            0x1c8000: 0x1040,
                            0x1d8000: 0x80401000,
                            0x1e8000: 0x400000,
                            0x1f8000: 0x401040
                        },
                        {
                            0x0: 0x80,
                            0x1000: 0x1040000,
                            0x2000: 0x40000,
                            0x3000: 0x20000000,
                            0x4000: 0x20040080,
                            0x5000: 0x1000080,
                            0x6000: 0x21000080,
                            0x7000: 0x40080,
                            0x8000: 0x1000000,
                            0x9000: 0x20040000,
                            0xa000: 0x20000080,
                            0xb000: 0x21040080,
                            0xc000: 0x21040000,
                            0xd000: 0x0,
                            0xe000: 0x1040080,
                            0xf000: 0x21000000,
                            0x800: 0x1040080,
                            0x1800: 0x21000080,
                            0x2800: 0x80,
                            0x3800: 0x1040000,
                            0x4800: 0x40000,
                            0x5800: 0x20040080,
                            0x6800: 0x21040000,
                            0x7800: 0x20000000,
                            0x8800: 0x20040000,
                            0x9800: 0x0,
                            0xa800: 0x21040080,
                            0xb800: 0x1000080,
                            0xc800: 0x20000080,
                            0xd800: 0x21000000,
                            0xe800: 0x1000000,
                            0xf800: 0x40080,
                            0x10000: 0x40000,
                            0x11000: 0x80,
                            0x12000: 0x20000000,
                            0x13000: 0x21000080,
                            0x14000: 0x1000080,
                            0x15000: 0x21040000,
                            0x16000: 0x20040080,
                            0x17000: 0x1000000,
                            0x18000: 0x21040080,
                            0x19000: 0x21000000,
                            0x1a000: 0x1040000,
                            0x1b000: 0x20040000,
                            0x1c000: 0x40080,
                            0x1d000: 0x20000080,
                            0x1e000: 0x0,
                            0x1f000: 0x1040080,
                            0x10800: 0x21000080,
                            0x11800: 0x1000000,
                            0x12800: 0x1040000,
                            0x13800: 0x20040080,
                            0x14800: 0x20000000,
                            0x15800: 0x1040080,
                            0x16800: 0x80,
                            0x17800: 0x21040000,
                            0x18800: 0x40080,
                            0x19800: 0x21040080,
                            0x1a800: 0x0,
                            0x1b800: 0x21000000,
                            0x1c800: 0x1000080,
                            0x1d800: 0x40000,
                            0x1e800: 0x20040000,
                            0x1f800: 0x20000080
                        },
                        {
                            0x0: 0x10000008,
                            0x100: 0x2000,
                            0x200: 0x10200000,
                            0x300: 0x10202008,
                            0x400: 0x10002000,
                            0x500: 0x200000,
                            0x600: 0x200008,
                            0x700: 0x10000000,
                            0x800: 0x0,
                            0x900: 0x10002008,
                            0xa00: 0x202000,
                            0xb00: 0x8,
                            0xc00: 0x10200008,
                            0xd00: 0x202008,
                            0xe00: 0x2008,
                            0xf00: 0x10202000,
                            0x80: 0x10200000,
                            0x180: 0x10202008,
                            0x280: 0x8,
                            0x380: 0x200000,
                            0x480: 0x202008,
                            0x580: 0x10000008,
                            0x680: 0x10002000,
                            0x780: 0x2008,
                            0x880: 0x200008,
                            0x980: 0x2000,
                            0xa80: 0x10002008,
                            0xb80: 0x10200008,
                            0xc80: 0x0,
                            0xd80: 0x10202000,
                            0xe80: 0x202000,
                            0xf80: 0x10000000,
                            0x1000: 0x10002000,
                            0x1100: 0x10200008,
                            0x1200: 0x10202008,
                            0x1300: 0x2008,
                            0x1400: 0x200000,
                            0x1500: 0x10000000,
                            0x1600: 0x10000008,
                            0x1700: 0x202000,
                            0x1800: 0x202008,
                            0x1900: 0x0,
                            0x1a00: 0x8,
                            0x1b00: 0x10200000,
                            0x1c00: 0x2000,
                            0x1d00: 0x10002008,
                            0x1e00: 0x10202000,
                            0x1f00: 0x200008,
                            0x1080: 0x8,
                            0x1180: 0x202000,
                            0x1280: 0x200000,
                            0x1380: 0x10000008,
                            0x1480: 0x10002000,
                            0x1580: 0x2008,
                            0x1680: 0x10202008,
                            0x1780: 0x10200000,
                            0x1880: 0x10202000,
                            0x1980: 0x10200008,
                            0x1a80: 0x2000,
                            0x1b80: 0x202008,
                            0x1c80: 0x200008,
                            0x1d80: 0x0,
                            0x1e80: 0x10000000,
                            0x1f80: 0x10002008
                        },
                        {
                            0x0: 0x100000,
                            0x10: 0x2000401,
                            0x20: 0x400,
                            0x30: 0x100401,
                            0x40: 0x2100401,
                            0x50: 0x0,
                            0x60: 0x1,
                            0x70: 0x2100001,
                            0x80: 0x2000400,
                            0x90: 0x100001,
                            0xa0: 0x2000001,
                            0xb0: 0x2100400,
                            0xc0: 0x2100000,
                            0xd0: 0x401,
                            0xe0: 0x100400,
                            0xf0: 0x2000000,
                            0x8: 0x2100001,
                            0x18: 0x0,
                            0x28: 0x2000401,
                            0x38: 0x2100400,
                            0x48: 0x100000,
                            0x58: 0x2000001,
                            0x68: 0x2000000,
                            0x78: 0x401,
                            0x88: 0x100401,
                            0x98: 0x2000400,
                            0xa8: 0x2100000,
                            0xb8: 0x100001,
                            0xc8: 0x400,
                            0xd8: 0x2100401,
                            0xe8: 0x1,
                            0xf8: 0x100400,
                            0x100: 0x2000000,
                            0x110: 0x100000,
                            0x120: 0x2000401,
                            0x130: 0x2100001,
                            0x140: 0x100001,
                            0x150: 0x2000400,
                            0x160: 0x2100400,
                            0x170: 0x100401,
                            0x180: 0x401,
                            0x190: 0x2100401,
                            0x1a0: 0x100400,
                            0x1b0: 0x1,
                            0x1c0: 0x0,
                            0x1d0: 0x2100000,
                            0x1e0: 0x2000001,
                            0x1f0: 0x400,
                            0x108: 0x100400,
                            0x118: 0x2000401,
                            0x128: 0x2100001,
                            0x138: 0x1,
                            0x148: 0x2000000,
                            0x158: 0x100000,
                            0x168: 0x401,
                            0x178: 0x2100400,
                            0x188: 0x2000001,
                            0x198: 0x2100000,
                            0x1a8: 0x0,
                            0x1b8: 0x2100401,
                            0x1c8: 0x100401,
                            0x1d8: 0x400,
                            0x1e8: 0x2000400,
                            0x1f8: 0x100001
                        },
                        {
                            0x0: 0x8000820,
                            0x1: 0x20000,
                            0x2: 0x8000000,
                            0x3: 0x20,
                            0x4: 0x20020,
                            0x5: 0x8020820,
                            0x6: 0x8020800,
                            0x7: 0x800,
                            0x8: 0x8020000,
                            0x9: 0x8000800,
                            0xa: 0x20800,
                            0xb: 0x8020020,
                            0xc: 0x820,
                            0xd: 0x0,
                            0xe: 0x8000020,
                            0xf: 0x20820,
                            0x80000000: 0x800,
                            0x80000001: 0x8020820,
                            0x80000002: 0x8000820,
                            0x80000003: 0x8000000,
                            0x80000004: 0x8020000,
                            0x80000005: 0x20800,
                            0x80000006: 0x20820,
                            0x80000007: 0x20,
                            0x80000008: 0x8000020,
                            0x80000009: 0x820,
                            0x8000000a: 0x20020,
                            0x8000000b: 0x8020800,
                            0x8000000c: 0x0,
                            0x8000000d: 0x8020020,
                            0x8000000e: 0x8000800,
                            0x8000000f: 0x20000,
                            0x10: 0x20820,
                            0x11: 0x8020800,
                            0x12: 0x20,
                            0x13: 0x800,
                            0x14: 0x8000800,
                            0x15: 0x8000020,
                            0x16: 0x8020020,
                            0x17: 0x20000,
                            0x18: 0x0,
                            0x19: 0x20020,
                            0x1a: 0x8020000,
                            0x1b: 0x8000820,
                            0x1c: 0x8020820,
                            0x1d: 0x20800,
                            0x1e: 0x820,
                            0x1f: 0x8000000,
                            0x80000010: 0x20000,
                            0x80000011: 0x800,
                            0x80000012: 0x8020020,
                            0x80000013: 0x20820,
                            0x80000014: 0x20,
                            0x80000015: 0x8020000,
                            0x80000016: 0x8000000,
                            0x80000017: 0x8000820,
                            0x80000018: 0x8020820,
                            0x80000019: 0x8000020,
                            0x8000001a: 0x8000800,
                            0x8000001b: 0x0,
                            0x8000001c: 0x20800,
                            0x8000001d: 0x820,
                            0x8000001e: 0x20020,
                            0x8000001f: 0x8020800
                        }
                    ];

                    // Masks that select the SBOX input
                    var SBOX_MASK = [
                        0xf8000001, 0x1f800000, 0x01f80000, 0x001f8000,
                        0x0001f800, 0x00001f80, 0x000001f8, 0x8000001f
                    ];

                    /**
                     * DES block cipher algorithm.
                     */
                    var DES = C_algo.DES = BlockCipher.extend({
                        _doReset: function () {
                            // Shortcuts
                            var key = this._key;
                            var keyWords = key.words;

                            // Select 56 bits according to PC1
                            var keyBits = [];
                            for (var i = 0; i < 56; i++) {
                                var keyBitPos = PC1[i] - 1;
                                keyBits[i] = (keyWords[keyBitPos >>> 5] >>> (31 - keyBitPos % 32)) & 1;
                            }

                            // Assemble 16 subkeys
                            var subKeys = this._subKeys = [];
                            for (var nSubKey = 0; nSubKey < 16; nSubKey++) {
                                // Create subkey
                                var subKey = subKeys[nSubKey] = [];

                                // Shortcut
                                var bitShift = BIT_SHIFTS[nSubKey];

                                // Select 48 bits according to PC2
                                for (var i = 0; i < 24; i++) {
                                    // Select from the left 28 key bits
                                    subKey[(i / 6) | 0] |= keyBits[((PC2[i] - 1) + bitShift) % 28] << (31 - i % 6);

                                    // Select from the right 28 key bits
                                    subKey[4 + ((i / 6) | 0)] |= keyBits[28 + (((PC2[i + 24] - 1) + bitShift) % 28)] << (31 - i % 6);
                                }

                                // Since each subkey is applied to an expanded 32-bit input,
                                // the subkey can be broken into 8 values scaled to 32-bits,
                                // which allows the key to be used without expansion
                                subKey[0] = (subKey[0] << 1) | (subKey[0] >>> 31);
                                for (var i = 1; i < 7; i++) {
                                    subKey[i] = subKey[i] >>> ((i - 1) * 4 + 3);
                                }
                                subKey[7] = (subKey[7] << 5) | (subKey[7] >>> 27);
                            }

                            // Compute inverse subkeys
                            var invSubKeys = this._invSubKeys = [];
                            for (var i = 0; i < 16; i++) {
                                invSubKeys[i] = subKeys[15 - i];
                            }
                        },

                        encryptBlock: function (M, offset) {
                            this._doCryptBlock(M, offset, this._subKeys);
                        },

                        decryptBlock: function (M, offset) {
                            this._doCryptBlock(M, offset, this._invSubKeys);
                        },

                        _doCryptBlock: function (M, offset, subKeys) {
                            // Get input
                            this._lBlock = M[offset];
                            this._rBlock = M[offset + 1];

                            // Initial permutation
                            exchangeLR.call(this, 4, 0x0f0f0f0f);
                            exchangeLR.call(this, 16, 0x0000ffff);
                            exchangeRL.call(this, 2, 0x33333333);
                            exchangeRL.call(this, 8, 0x00ff00ff);
                            exchangeLR.call(this, 1, 0x55555555);

                            // Rounds
                            for (var round = 0; round < 16; round++) {
                                // Shortcuts
                                var subKey = subKeys[round];
                                var lBlock = this._lBlock;
                                var rBlock = this._rBlock;

                                // Feistel function
                                var f = 0;
                                for (var i = 0; i < 8; i++) {
                                    f |= SBOX_P[i][((rBlock ^ subKey[i]) & SBOX_MASK[i]) >>> 0];
                                }
                                this._lBlock = rBlock;
                                this._rBlock = lBlock ^ f;
                            }

                            // Undo swap from last round
                            var t = this._lBlock;
                            this._lBlock = this._rBlock;
                            this._rBlock = t;

                            // Final permutation
                            exchangeLR.call(this, 1, 0x55555555);
                            exchangeRL.call(this, 8, 0x00ff00ff);
                            exchangeRL.call(this, 2, 0x33333333);
                            exchangeLR.call(this, 16, 0x0000ffff);
                            exchangeLR.call(this, 4, 0x0f0f0f0f);

                            // Set output
                            M[offset] = this._lBlock;
                            M[offset + 1] = this._rBlock;
                        },

                        keySize: 64 / 32,

                        ivSize: 64 / 32,

                        blockSize: 64 / 32
                    });

                    // Swap bits across the left and right words
                    function exchangeLR(offset, mask) {
                        var t = ((this._lBlock >>> offset) ^ this._rBlock) & mask;
                        this._rBlock ^= t;
                        this._lBlock ^= t << offset;
                    }

                    function exchangeRL(offset, mask) {
                        var t = ((this._rBlock >>> offset) ^ this._lBlock) & mask;
                        this._lBlock ^= t;
                        this._rBlock ^= t << offset;
                    }

                    /**
                     * Shortcut functions to the cipher's object interface.
                     *
                     * @example
                     *
                     *     var ciphertext = CryptoJS.DES.encrypt(message, key, cfg);
                     *     var plaintext  = CryptoJS.DES.decrypt(ciphertext, key, cfg);
                     */
                    C.DES = BlockCipher._createHelper(DES);

                    /**
                     * Triple-DES block cipher algorithm.
                     */
                    var TripleDES = C_algo.TripleDES = BlockCipher.extend({
                        _doReset: function () {
                            // Shortcuts
                            var key = this._key;
                            var keyWords = key.words;
                            // Make sure the key length is valid (64, 128 or >= 192 bit)
                            if (keyWords.length !== 2 && keyWords.length !== 4 && keyWords.length < 6) {
                                throw new Error('Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.');
                            }

                            // Extend the key according to the keying options defined in 3DES standard
                            var key1 = keyWords.slice(0, 2);
                            var key2 = keyWords.length < 4 ? keyWords.slice(0, 2) : keyWords.slice(2, 4);
                            var key3 = keyWords.length < 6 ? keyWords.slice(0, 2) : keyWords.slice(4, 6);

                            // Create DES instances
                            this._des1 = DES.createEncryptor(WordArray.create(key1));
                            this._des2 = DES.createEncryptor(WordArray.create(key2));
                            this._des3 = DES.createEncryptor(WordArray.create(key3));
                        },

                        encryptBlock: function (M, offset) {
                            this._des1.encryptBlock(M, offset);
                            this._des2.decryptBlock(M, offset);
                            this._des3.encryptBlock(M, offset);
                        },

                        decryptBlock: function (M, offset) {
                            this._des3.decryptBlock(M, offset);
                            this._des2.encryptBlock(M, offset);
                            this._des1.decryptBlock(M, offset);
                        },

                        keySize: 192 / 32,

                        ivSize: 64 / 32,

                        blockSize: 64 / 32
                    });

                    /**
                     * Shortcut functions to the cipher's object interface.
                     *
                     * @example
                     *
                     *     var ciphertext = CryptoJS.TripleDES.encrypt(message, key, cfg);
                     *     var plaintext  = CryptoJS.TripleDES.decrypt(ciphertext, key, cfg);
                     */
                    C.TripleDES = BlockCipher._createHelper(TripleDES);
                }());


                return CryptoJS.TripleDES;

            }));
        }(tripledes));
        return tripledesExports;
    }

    var rc4Exports = {};
    var rc4 = {
        get exports() {
            return rc4Exports;
        },
        set exports(v) {
            rc4Exports = v;
        },
    };

    var hasRequiredRc4;

    function requireRc4() {
        if (hasRequiredRc4) return rc4Exports;
        hasRequiredRc4 = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireEncBase64(), requireMd5(), requireEvpkdf(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var StreamCipher = C_lib.StreamCipher;
                    var C_algo = C.algo;

                    /**
                     * RC4 stream cipher algorithm.
                     */
                    var RC4 = C_algo.RC4 = StreamCipher.extend({
                        _doReset: function () {
                            // Shortcuts
                            var key = this._key;
                            var keyWords = key.words;
                            var keySigBytes = key.sigBytes;

                            // Init sbox
                            var S = this._S = [];
                            for (var i = 0; i < 256; i++) {
                                S[i] = i;
                            }

                            // Key setup
                            for (var i = 0, j = 0; i < 256; i++) {
                                var keyByteIndex = i % keySigBytes;
                                var keyByte = (keyWords[keyByteIndex >>> 2] >>> (24 - (keyByteIndex % 4) * 8)) & 0xff;

                                j = (j + S[i] + keyByte) % 256;

                                // Swap
                                var t = S[i];
                                S[i] = S[j];
                                S[j] = t;
                            }

                            // Counters
                            this._i = this._j = 0;
                        },

                        _doProcessBlock: function (M, offset) {
                            M[offset] ^= generateKeystreamWord.call(this);
                        },

                        keySize: 256 / 32,

                        ivSize: 0
                    });

                    function generateKeystreamWord() {
                        // Shortcuts
                        var S = this._S;
                        var i = this._i;
                        var j = this._j;

                        // Generate keystream word
                        var keystreamWord = 0;
                        for (var n = 0; n < 4; n++) {
                            i = (i + 1) % 256;
                            j = (j + S[i]) % 256;

                            // Swap
                            var t = S[i];
                            S[i] = S[j];
                            S[j] = t;

                            keystreamWord |= S[(S[i] + S[j]) % 256] << (24 - n * 8);
                        }

                        // Update counters
                        this._i = i;
                        this._j = j;

                        return keystreamWord;
                    }

                    /**
                     * Shortcut functions to the cipher's object interface.
                     *
                     * @example
                     *
                     *     var ciphertext = CryptoJS.RC4.encrypt(message, key, cfg);
                     *     var plaintext  = CryptoJS.RC4.decrypt(ciphertext, key, cfg);
                     */
                    C.RC4 = StreamCipher._createHelper(RC4);

                    /**
                     * Modified RC4 stream cipher algorithm.
                     */
                    var RC4Drop = C_algo.RC4Drop = RC4.extend({
                        /**
                         * Configuration options.
                         *
                         * @property {number} drop The number of keystream words to drop. Default 192
                         */
                        cfg: RC4.cfg.extend({
                            drop: 192
                        }),

                        _doReset: function () {
                            RC4._doReset.call(this);

                            // Drop
                            for (var i = this.cfg.drop; i > 0; i--) {
                                generateKeystreamWord.call(this);
                            }
                        }
                    });

                    /**
                     * Shortcut functions to the cipher's object interface.
                     *
                     * @example
                     *
                     *     var ciphertext = CryptoJS.RC4Drop.encrypt(message, key, cfg);
                     *     var plaintext  = CryptoJS.RC4Drop.decrypt(ciphertext, key, cfg);
                     */
                    C.RC4Drop = StreamCipher._createHelper(RC4Drop);
                }());


                return CryptoJS.RC4;

            }));
        }(rc4));
        return rc4Exports;
    }

    var rabbitExports = {};
    var rabbit = {
        get exports() {
            return rabbitExports;
        },
        set exports(v) {
            rabbitExports = v;
        },
    };

    var hasRequiredRabbit;

    function requireRabbit() {
        if (hasRequiredRabbit) return rabbitExports;
        hasRequiredRabbit = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireEncBase64(), requireMd5(), requireEvpkdf(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var StreamCipher = C_lib.StreamCipher;
                    var C_algo = C.algo;

                    // Reusable objects
                    var S = [];
                    var C_ = [];
                    var G = [];

                    /**
                     * Rabbit stream cipher algorithm
                     */
                    var Rabbit = C_algo.Rabbit = StreamCipher.extend({
                        _doReset: function () {
                            // Shortcuts
                            var K = this._key.words;
                            var iv = this.cfg.iv;

                            // Swap endian
                            for (var i = 0; i < 4; i++) {
                                K[i] = (((K[i] << 8) | (K[i] >>> 24)) & 0x00ff00ff) |
                                    (((K[i] << 24) | (K[i] >>> 8)) & 0xff00ff00);
                            }

                            // Generate initial state values
                            var X = this._X = [
                                K[0], (K[3] << 16) | (K[2] >>> 16),
                                K[1], (K[0] << 16) | (K[3] >>> 16),
                                K[2], (K[1] << 16) | (K[0] >>> 16),
                                K[3], (K[2] << 16) | (K[1] >>> 16)
                            ];

                            // Generate initial counter values
                            var C = this._C = [
                                (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
                                (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
                                (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
                                (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
                            ];

                            // Carry bit
                            this._b = 0;

                            // Iterate the system four times
                            for (var i = 0; i < 4; i++) {
                                nextState.call(this);
                            }

                            // Modify the counters
                            for (var i = 0; i < 8; i++) {
                                C[i] ^= X[(i + 4) & 7];
                            }

                            // IV setup
                            if (iv) {
                                // Shortcuts
                                var IV = iv.words;
                                var IV_0 = IV[0];
                                var IV_1 = IV[1];

                                // Generate four subvectors
                                var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
                                var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
                                var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
                                var i3 = (i2 << 16) | (i0 & 0x0000ffff);

                                // Modify counter values
                                C[0] ^= i0;
                                C[1] ^= i1;
                                C[2] ^= i2;
                                C[3] ^= i3;
                                C[4] ^= i0;
                                C[5] ^= i1;
                                C[6] ^= i2;
                                C[7] ^= i3;

                                // Iterate the system four times
                                for (var i = 0; i < 4; i++) {
                                    nextState.call(this);
                                }
                            }
                        },

                        _doProcessBlock: function (M, offset) {
                            // Shortcut
                            var X = this._X;

                            // Iterate the system
                            nextState.call(this);

                            // Generate four keystream words
                            S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
                            S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
                            S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
                            S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);

                            for (var i = 0; i < 4; i++) {
                                // Swap endian
                                S[i] = (((S[i] << 8) | (S[i] >>> 24)) & 0x00ff00ff) |
                                    (((S[i] << 24) | (S[i] >>> 8)) & 0xff00ff00);

                                // Encrypt
                                M[offset + i] ^= S[i];
                            }
                        },

                        blockSize: 128 / 32,

                        ivSize: 64 / 32
                    });

                    function nextState() {
                        // Shortcuts
                        var X = this._X;
                        var C = this._C;

                        // Save old counter values
                        for (var i = 0; i < 8; i++) {
                            C_[i] = C[i];
                        }

                        // Calculate new counter values
                        C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
                        C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
                        C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
                        C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
                        C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
                        C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
                        C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
                        C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
                        this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;

                        // Calculate the g-values
                        for (var i = 0; i < 8; i++) {
                            var gx = X[i] + C[i];

                            // Construct high and low argument for squaring
                            var ga = gx & 0xffff;
                            var gb = gx >>> 16;

                            // Calculate high and low result of squaring
                            var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
                            var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);

                            // High XOR low
                            G[i] = gh ^ gl;
                        }

                        // Calculate new state values
                        X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
                        X[1] = (G[1] + ((G[0] << 8) | (G[0] >>> 24)) + G[7]) | 0;
                        X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
                        X[3] = (G[3] + ((G[2] << 8) | (G[2] >>> 24)) + G[1]) | 0;
                        X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
                        X[5] = (G[5] + ((G[4] << 8) | (G[4] >>> 24)) + G[3]) | 0;
                        X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
                        X[7] = (G[7] + ((G[6] << 8) | (G[6] >>> 24)) + G[5]) | 0;
                    }

                    /**
                     * Shortcut functions to the cipher's object interface.
                     *
                     * @example
                     *
                     *     var ciphertext = CryptoJS.Rabbit.encrypt(message, key, cfg);
                     *     var plaintext  = CryptoJS.Rabbit.decrypt(ciphertext, key, cfg);
                     */
                    C.Rabbit = StreamCipher._createHelper(Rabbit);
                }());


                return CryptoJS.Rabbit;

            }));
        }(rabbit));
        return rabbitExports;
    }

    var rabbitLegacyExports = {};
    var rabbitLegacy = {
        get exports() {
            return rabbitLegacyExports;
        },
        set exports(v) {
            rabbitLegacyExports = v;
        },
    };

    var hasRequiredRabbitLegacy;

    function requireRabbitLegacy() {
        if (hasRequiredRabbitLegacy) return rabbitLegacyExports;
        hasRequiredRabbitLegacy = 1;
        (function (module, exports) {
            (function (root, factory, undef) {
                {
                    // CommonJS
                    module.exports = factory(requireCore(), requireEncBase64(), requireMd5(), requireEvpkdf(), requireCipherCore());
                }
            }(commonjsGlobal, function (CryptoJS) {

                (function () {
                    // Shortcuts
                    var C = CryptoJS;
                    var C_lib = C.lib;
                    var StreamCipher = C_lib.StreamCipher;
                    var C_algo = C.algo;

                    // Reusable objects
                    var S = [];
                    var C_ = [];
                    var G = [];

                    /**
                     * Rabbit stream cipher algorithm.
                     *
                     * This is a legacy version that neglected to convert the key to little-endian.
                     * This error doesn't affect the cipher's security,
                     * but it does affect its compatibility with other implementations.
                     */
                    var RabbitLegacy = C_algo.RabbitLegacy = StreamCipher.extend({
                        _doReset: function () {
                            // Shortcuts
                            var K = this._key.words;
                            var iv = this.cfg.iv;

                            // Generate initial state values
                            var X = this._X = [
                                K[0], (K[3] << 16) | (K[2] >>> 16),
                                K[1], (K[0] << 16) | (K[3] >>> 16),
                                K[2], (K[1] << 16) | (K[0] >>> 16),
                                K[3], (K[2] << 16) | (K[1] >>> 16)
                            ];

                            // Generate initial counter values
                            var C = this._C = [
                                (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
                                (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
                                (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
                                (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
                            ];

                            // Carry bit
                            this._b = 0;

                            // Iterate the system four times
                            for (var i = 0; i < 4; i++) {
                                nextState.call(this);
                            }

                            // Modify the counters
                            for (var i = 0; i < 8; i++) {
                                C[i] ^= X[(i + 4) & 7];
                            }

                            // IV setup
                            if (iv) {
                                // Shortcuts
                                var IV = iv.words;
                                var IV_0 = IV[0];
                                var IV_1 = IV[1];

                                // Generate four subvectors
                                var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
                                var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
                                var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
                                var i3 = (i2 << 16) | (i0 & 0x0000ffff);

                                // Modify counter values
                                C[0] ^= i0;
                                C[1] ^= i1;
                                C[2] ^= i2;
                                C[3] ^= i3;
                                C[4] ^= i0;
                                C[5] ^= i1;
                                C[6] ^= i2;
                                C[7] ^= i3;

                                // Iterate the system four times
                                for (var i = 0; i < 4; i++) {
                                    nextState.call(this);
                                }
                            }
                        },

                        _doProcessBlock: function (M, offset) {
                            // Shortcut
                            var X = this._X;

                            // Iterate the system
                            nextState.call(this);

                            // Generate four keystream words
                            S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
                            S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
                            S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
                            S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);

                            for (var i = 0; i < 4; i++) {
                                // Swap endian
                                S[i] = (((S[i] << 8) | (S[i] >>> 24)) & 0x00ff00ff) |
                                    (((S[i] << 24) | (S[i] >>> 8)) & 0xff00ff00);

                                // Encrypt
                                M[offset + i] ^= S[i];
                            }
                        },

                        blockSize: 128 / 32,

                        ivSize: 64 / 32
                    });

                    function nextState() {
                        // Shortcuts
                        var X = this._X;
                        var C = this._C;

                        // Save old counter values
                        for (var i = 0; i < 8; i++) {
                            C_[i] = C[i];
                        }

                        // Calculate new counter values
                        C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
                        C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
                        C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
                        C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
                        C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
                        C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
                        C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
                        C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
                        this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;

                        // Calculate the g-values
                        for (var i = 0; i < 8; i++) {
                            var gx = X[i] + C[i];

                            // Construct high and low argument for squaring
                            var ga = gx & 0xffff;
                            var gb = gx >>> 16;

                            // Calculate high and low result of squaring
                            var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
                            var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);

                            // High XOR low
                            G[i] = gh ^ gl;
                        }

                        // Calculate new state values
                        X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
                        X[1] = (G[1] + ((G[0] << 8) | (G[0] >>> 24)) + G[7]) | 0;
                        X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
                        X[3] = (G[3] + ((G[2] << 8) | (G[2] >>> 24)) + G[1]) | 0;
                        X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
                        X[5] = (G[5] + ((G[4] << 8) | (G[4] >>> 24)) + G[3]) | 0;
                        X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
                        X[7] = (G[7] + ((G[6] << 8) | (G[6] >>> 24)) + G[5]) | 0;
                    }

                    /**
                     * Shortcut functions to the cipher's object interface.
                     *
                     * @example
                     *
                     *     var ciphertext = CryptoJS.RabbitLegacy.encrypt(message, key, cfg);
                     *     var plaintext  = CryptoJS.RabbitLegacy.decrypt(ciphertext, key, cfg);
                     */
                    C.RabbitLegacy = StreamCipher._createHelper(RabbitLegacy);
                }());


                return CryptoJS.RabbitLegacy;

            }));
        }(rabbitLegacy));
        return rabbitLegacyExports;
    }

    (function (module, exports) {
        (function (root, factory, undef) {
            {
                // CommonJS
                module.exports = factory(requireCore(), requireX64Core(), requireLibTypedarrays(), requireEncUtf16(), requireEncBase64(), requireEncBase64url(), requireMd5(), requireSha1(), requireSha256(), requireSha224(), requireSha512(), requireSha384(), requireSha3(), requireRipemd160(), requireHmac(), requirePbkdf2(), requireEvpkdf(), requireCipherCore(), requireModeCfb(), requireModeCtr(), requireModeCtrGladman(), requireModeOfb(), requireModeEcb(), requirePadAnsix923(), requirePadIso10126(), requirePadIso97971(), requirePadZeropadding(), requirePadNopadding(), requireFormatHex(), requireAes(), requireTripledes(), requireRc4(), requireRabbit(), requireRabbitLegacy());
            }
        }(commonjsGlobal, function (CryptoJS) {

            return CryptoJS;

        }));
    }(cryptoJs));

    var CryptoJS = cryptoJsExports;

    /** 手机登录界面 */
    const emoPhoneLogin = {
        currentCtx: null,
        show() {
            const uiELe = `    
      <div style="position: absolute;  left: 0;    top: 0;  bottom: 0;  right: 0;  margin: auto;  width: 289px;  height: 289px;   background: #FFFFFF; box-shadow: 0px 2px 7px 0px rgba(143, 143, 143, 0.48);  border-radius: 11px;    display: flex;flex-direction: column;align-items: center;justify-content: center;   ">
          <div id="registerCloseBtn" style="position: absolute;right: 10px;top: 10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path style="fill: #4398FE "
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z">
                  </path>
                  <path fill="none" d="M0 0h24v24H0V0z"></path>
              </svg>
          </div>
          <div id="registerError" style="position: absolute;right: 37px;top: 139px;font-size: 6px;font-weight: 400;color: #FB4242;"></div>
          <div style="width: 202px;height: 17px;font-size: 15px;font-family: Microsoft YaHei;font-weight: bold;color: #010101;">Login with Phone Number</div>
          <div style="margin-top:15px;width: 218px;height: 30px;border: 1px solid #BABABA;border-radius: 6px;display: flex;flex-direction: row;align-items: center;justify-content: center;"><div style="    width: 46px;border-right: 1px solid #CECECE ;"><select style="border: none;outline: none;" name="registerAreacode" id="registerAreacode">
              <option value="91">+91</option>
              <option value="1">+1</option>
          </select></div><div style="flex: 1;"><input style="font-size: 12px;font-family: Microsoft YaHei;font-weight: 400;color: #515151;;background-color:transparent;border:0;width:90%;outline:none;margin-left: 6px;"
              type="text" id="registerPhone" name="registerPhone" required placeholder="Please fill in the phone"></div></div>
          <div id="registerSendBtn" style="margin-top:12px;font-size: 12px;font-family: Microsoft YaHei;font-weight: 400;color: #FFFFFF;width: 218px;height: 35px;background: #4398FE;border-radius: 6px;display: flex;flex-direction: column;align-items: center;justify-content: center;">Send</div>                    
          <div id="registerSendText" style="display: none;;text-align: center;margin-top:11px;font-size: 10px;font-family: Microsoft YaHei;font-weight: 400;color: #FFFFFF;width: 218px;height: 35px;background: #BABABA;border-radius: 6px;    padding-top: 3px;box-sizing: border-box;">Wait tor <span id="registerTime">60</span> s <br>To Request Another Code</div>
          <div style="margin-top:15px;width: 218px;height: 30px;border: 1px solid #BABABA;border-radius: 6px;display: flex;flex-direction: column;align-items: center;justify-content: center;"><input style="font-size: 12px;font-family: Microsoft YaHei;font-weight: 400;color: #515151;;background-color:transparent;border:0;width:90%;outline:none" type="text" id="registerVfcode" name="registerVfcode" required placeholder="Verification Code"> </div>
          <div id="registerLoginBtn" style="margin-top:12px;font-size: 12px;font-family: Microsoft YaHei;font-weight: 400;color: #FFFFFF;width: 218px;height: 35px;background: #4398FE;border-radius: 6px;display: flex;flex-direction: column;align-items: center;justify-content: center;">Login</div>
          <div style="margin-top: 15px;    text-align: center;width: 210px;height: 17px;font-size: 8px;font-family: Microsoft YaHei;font-weight: 400;color: #010101;">By proceeding, you agree to our <span><a href="" target="_blank" style="color: #4398FE;" > Terms & Conditions</a></span>& <span><a href="" target="_blank" style="color: #4398FE;">Privacy Policy.</a></span></div>
      </div>`;
            const dailogDiv = document.createElement("div");
            dailogDiv.setAttribute("style", "position: absolute;z-index:1;width:100%;height:100%");
            dailogDiv.innerHTML = uiELe;
            util.createDailogContainer().append(dailogDiv);
            this.currentCtx = dailogDiv;
            if (dailogDiv) {
                this.initRegisterUi([91, 86]);
                util.addCallbackEvent([
                    {
                        ele: dailogDiv.querySelector("#registerCloseBtn"),
                        eventName: "click",
                        eventFunc: () => {
                            // 关闭事件
                            this.hide();
                        }
                    },
                    {
                        ele: dailogDiv.querySelector("#registerSendBtn"),
                        eventName: "click",
                        eventFunc: () => __awaiter(this, void 0, void 0, function* () {
                            // 发送获取验证码
                            // @ts-ignore
                            dailogDiv.querySelector("#registerSendBtn") &&
                            // @ts-ignore
                            (dailogDiv.querySelector("#registerSendBtn").style.display =
                                "none");
                            // @ts-ignore
                            dailogDiv.querySelector("#registerSendText") &&
                            // @ts-ignore
                            (dailogDiv.querySelector("#registerSendText").style.display =
                                "block");
                            this.countdownFunc(60);
                            try {
                                // @ts-ignore
                                const registerAreacode = (document.getElementById("registerAreacode") &&
                                    // @ts-ignore
                                    document.getElementById("registerAreacode").value) ||
                                    "";
                                const registerPhone = (document.getElementById("registerPhone") &&
                                    // @ts-ignore
                                    document.getElementById("registerPhone").value) ||
                                    "";
                                const phoneNum = `${registerAreacode}${registerPhone}`;
                                // @ts-ignore
                                // await emoPay.sendVerifyCode(phoneNum);
                                console.info("sendVerifyCode success");
                            } catch (error) {
                                console.error("sendVerifyCode error", error);
                            }
                        })
                    },
                    {
                        ele: dailogDiv.querySelector("#registerLoginBtn"),
                        eventName: "click",
                        eventFunc: () => __awaiter(this, void 0, void 0, function* () {
                            // 登录处理
                            // @ts-ignore
                            (dailogDiv.querySelector("#registerAreacode") &&
                                // @ts-ignore
                                dailogDiv.querySelector("#registerAreacode").value) ||
                            "";
                            const registerPhone = (dailogDiv.querySelector("#registerPhone") &&
                                // @ts-ignore
                                dailogDiv.querySelector("#registerPhone").value) ||
                                "";
                            const registerVfcode = (dailogDiv.querySelector("#registerVfcode") &&
                                // @ts-ignore
                                dailogDiv.querySelector("#registerVfcode").value) ||
                                "";
                            const NumberReg = /^\d{1,}$/;
                            if (registerPhone.length !== 10 || !NumberReg.test(registerPhone)) {
                                this.displayErrorMessage("phone number error");
                                return;
                            }
                            if (registerVfcode.length === 0) {
                                this.displayErrorMessage("verification code error");
                                return;
                            }
                            try {
                                PopWaiting.init();
                                PopWaiting.show();
                                // await payHelper.userLogin(phoneNum, registerVfcode);
                                console.info("phoneLogin success");
                                // 游客转正式用户
                                // if (storageHelper.storageType === StorageType.Local) {
                                //   const isNewUser = await storageHelper.checkNewUser();
                                //   // 不是新用户不给登录，因此状态还是Local,否则Cloud
                                //   storageHelper.storageType = isNewUser
                                //     ? StorageType.Cloud
                                //     : StorageType.Local;
                                //   storageHelper.userPhone = isNewUser ? registerPhone : "";
                                //   PopWaiting.hide();
                                // } else {
                                //   PopWaiting.hide();
                                //   storageHelper.storageType = StorageType.Cloud;
                                //   storageHelper.userPhone = registerPhone;
                                //   PopTip.success({
                                //     message: "Login success",
                                //     autoCloseTime: 2,
                                //     top: "50%",
                                //     left: "50%"
                                //   });
                                // }
                                this.hide();
                            } catch (error) {
                                console.error("phoneLogin error", error);
                                PopWaiting.hide();
                                this.hide();
                                PopComfirm.showWithInit("OK", `Login failed, please try again`, () => {
                                    emoPhoneLogin.show();
                                });
                            }
                        })
                    },
                    {
                        ele: dailogDiv.querySelector("#registerPhone"),
                        eventName: "input",
                        eventFunc: (event) => {
                            // 手机输入校验
                            const val = event.target.value || "";
                            if (!/^\d+$/.test(val)) {
                                event.target.value = val.replace(/\D+/, "");
                                // 控制校验信息
                                this.displayErrorMessage("Please key in numbers!");
                            } else {
                                this.displayErrorMessage("");
                            }
                        }
                    }
                ]);
            }
        },
        // 关闭登录界面
        hide() {
            util.removeDailogContainer(() => {
                this.currentCtx && this.currentCtx.remove();
            });
        },
        // 控制校验错误信息
        displayErrorMessage(message) {
            const registerError = this.currentCtx.querySelector("#registerError");
            registerError && (registerError.innerText = message);
        },
        // 添加监听,回调事件
        addCallbackEvent(events) {
            events &&
            events.length > 0 &&
            events.forEach((obj) => {
                obj.ele &&
                obj.ele.addEventListener(obj.eventName, (event) => {
                    obj.eventFunc && obj.eventFunc(event);
                });
            });
        },
        // 60s倒计时
        countdownFunc(time) {
            const dailogDiv = this.currentCtx;
            const registerTime = dailogDiv.querySelector("#registerTime");

            function timeFun(num) {
                registerTime.innerText = num;
                num--;
                setTimeout(() => {
                    registerTime.innerText = num;
                    if (num > 0) {
                        timeFun(num);
                    } else {
                        dailogDiv.querySelector("#registerSendBtn") &&
                        (dailogDiv.querySelector("#registerSendBtn").style.display =
                            "flex");
                        dailogDiv.querySelector("#registerSendText") &&
                        (dailogDiv.querySelector("#registerSendText").style.display =
                            "none");
                    }
                }, 1000);
            }

            return timeFun(time);
        },
        // 初始化注册ui事件
        initRegisterUi(areaCodes) {
            // 动态更改区号的前缀
            const areaCode = this.currentCtx.querySelector("#registerAreacode");
            if (areaCodes && areaCodes.length > 0 && areaCode) {
                areaCode.innerHTML = "";
                areaCodes.forEach((code) => {
                    const optionEle = document.createElement("option");
                    optionEle.setAttribute("value", `${code}`);
                    optionEle.innerText = `+${code}`;
                    areaCode.appendChild(optionEle);
                });
            }
        }
    };
    /** 等待界面 */
    const PopWaiting = {
        currentCtx: null,
        btn: {
            name: "",
            func: () => {
                PopWaiting.hide();
            }
        },
        init(popInfo) {
            this.btn.name = "";
            this.btn.func = () => {
                PopWaiting.hide();
            };
            if (popInfo) {
                this.btn.name = popInfo.btnName;
                this.btn.func = popInfo.btnFunc;
            }
            this.btn.hidden = !(this.btn.name.length > 0);
            return this;
        },
        show() {
            const uiELe = `
      <div style="margin-top: -25px;top: 50%;width: 100%;text-align: center;position: absolute;display: flex;flex-direction: column;justify-content: center;align-items: center;">
          <svg  t="1655447361916" style="animation: waitRotating 2s linear infinite;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3916" width="10" height="10"><path d="M768 576v-128h192v128h-192z m-120.32-290.24l136-135.68 90.24 90.24-135.68 136zM448 768h128v192h-128v-192z m0-704h128v192h-128V64zM150.08 783.68l135.68-136 90.56 90.56-136 135.68z m0-543.36l90.24-90.24 136 135.68-90.56 90.56zM256 576H64v-128h192v128z m617.92 207.68l-90.24 90.24-136-135.68 90.56-90.56z" fill="#409EFF" p-id="3917"></path></svg>
          <p style="color: #409EFF;margin: 3px 0;font-size: 14px;">Loading...</p>
          ${this.btn.name
                ? `<div id="css_wait_ctx_cancel" style="margin-top: 25px;width: 130px;text-align: center;background: #fff;height: 30px;line-height: 30px;border-radius: 30px;">${this.btn.name}</div>`
                : ""}
      </div>
      `;
            const dailogDiv = document.createElement("div");
            dailogDiv.setAttribute("style", "position: absolute;z-index:10;width:100%;height:100%;transition: opacity .3s;background-color: rgb(0, 0, 0,0.6);");
            dailogDiv.innerHTML = uiELe;
            const keyframes = `
    @keyframes waitRotating {
        0% {
        transform: rotateZ(0);
        }
        100% {
            transform: rotateZ(360deg);
        }
    }
    `;
            const styleEle = document.createElement("style");
            styleEle.id = "css_wait_style";
            styleEle.type = "text/css";
            styleEle.innerHTML = keyframes;
            dailogDiv.appendChild(styleEle);
            util.createDailogContainer().append(dailogDiv);
            this.currentCtx = dailogDiv;
            const css_wait_ctx_cancelEle = dailogDiv.querySelector("#css_wait_ctx_cancel");
            if (css_wait_ctx_cancelEle) {
                css_wait_ctx_cancelEle.addEventListener("click", () => {
                    this.btn.func && this.btn.func();
                    this.hide();
                });
            }
        },
        hide() {
            util.removeDailogContainer(() => {
                this.currentCtx && this.currentCtx.remove();
            });
        }
    };
    /** 确认弹窗 */
    const PopComfirm = {
        message: `Sorry,This account already exists,\nplease change a new account.\r\n\r\nIf you want switch account,\nplease click the button.`,
        currentCtx: null,
        btn: {
            name: "OK",
            func: () => {
            }
        },
        init(popInfo) {
            this.message = "";
            this.btn.name = "";
            this.btn.func = () => {
            };
            if (popInfo) {
                this.message = popInfo.message;
                this.btn.name = popInfo.btnName;
                this.btn.func = popInfo.btnFunc;
            }
            return this;
        },
        show() {
            const uiELe = `    
    <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%,-50%);width: 278px;  min-height: 210px;   background: #FFFFFF; box-shadow: 0px 2px 7px 0px rgba(143, 143, 143, 0.48);  border-radius: 11px;    display: flex;flex-direction: column;align-items: center;">
        <div style="margin: 20px 0 0px;display: flex;flex-direction: column;justify-content: center;align-items: center;"><div style="width:50px;height:50px;border-radius:50px;    background: url(/images/weiyou.png);background-position: center;background-repeat: no-repeat;background-size: contain;"></div>
        <div style="max-width:268px;padding: 10px 0;min-height: 80px;width: 100%;overflow: hidden;text-align: center;word-break: break-word;box-sizing: border-box;line-height: 20px;white-space: pre-wrap;word-break: break-word;">${this.message}</div>                
        <div id="confirmMessage" style=" margin-bottom: 20px;display: flex; justify-content: center; align-items: center;width: 230px; height: 35px; border-radius: 6px;background: #4398FE;  font-size: 13px;font-family: Microsoft YaHei;font-weight: 400;color: #FFFF" >${this.btn.name}</div>
    </div>`;
            const dailogDiv = document.createElement("div");
            dailogDiv.setAttribute("style", "position: absolute;z-index:1;width:100%;height:100%");
            dailogDiv.innerHTML = uiELe;
            util.createDailogContainer().append(dailogDiv);
            this.currentCtx = dailogDiv;
            dailogDiv &&
            util.addCallbackEvent([
                {
                    ele: dailogDiv.querySelector("#minigameDailogContainer #confirmMessage"),
                    eventName: "click",
                    eventFunc: () => {
                        this.removeUi();
                        this.btn.func &&
                        this.btn.func instanceof Function &&
                        this.btn.func();
                    }
                }
            ]);
        },
        showWithInit(btnName, message, btnFunc) {
            const comfirmInfo = {};
            comfirmInfo.btnName = btnName;
            comfirmInfo.message = message;
            comfirmInfo.btnFunc = btnFunc;
            this.init(comfirmInfo);
            this.show();
        },
        removeUi() {
            util.removeDailogContainer(() => {
                this.currentCtx && this.currentCtx.remove();
            });
        }
    };

    var EmoPayState;
    (function (EmoPayState) {
        /** 待支付 */
        EmoPayState["WAITING"] = "0";
        /** 支付中 */
        EmoPayState["PAYING"] = "1";
        /** 支付成功 */
        EmoPayState["SUCCESS"] = "2";
    })(EmoPayState || (EmoPayState = {}));

    class EmoPay {
        constructor() {
            this._curProducts = [];
            this._curProductInfos = [];
        }

        static getInstance() {
            if (!this._instance) {
                this._instance = new EmoPay();
            }
            return this._instance;
        }

        init(channel) {
            return __awaiter(this, void 0, void 0, function* () {
                EmoPay._instance = this;
                try {
                    emoPaySDK.api.initSDK(channel);
                    console.info("inititial emo pay sdk success");
                } catch (error) {
                    PopComfirm.showWithInit("OK", `Payment initialization failed`);
                    return Promise.reject({
                        code: "emoPay init fail",
                        message: error.message
                    });
                }
                try {
                    const queryGoodsInfo = yield this.query();
                    this._curProducts.length = 0;
                    this._curProducts = this._curProducts.concat(queryGoodsInfo);
                    console.info("query goods info: ", this._curProducts);
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject({
                        code: "query goods fail",
                        message: error.message
                    });
                }
            });
        }

        pay(productId, extra) {
            return __awaiter(this, void 0, void 0, function* () {
                let isLoginStatus = false;
                try {
                    isLoginStatus = yield this.checkLoginAsync();
                } catch (error) {
                    // 获取登录状态失败提示
                    PopComfirm.showWithInit("OK", `Network error, please check 
if the network is available`);
                    return Promise.reject({
                        code: "pay error",
                        message: error.message
                    });
                }
                if (!isLoginStatus) {
                    // 当前处于未登录状态或者token过期，弹出提示
                    PopComfirm.showWithInit("Login", `You are currently not logged in, 
or the token has expired, 
please log in again`, () => {
                        // 拉起登录界面
                        emoPhoneLogin.show();
                    });
                    return Promise.reject({
                        code: "login error",
                        message: "without login, please login frist."
                    });
                } else {
                    // 支付
                    try {
                        const param = {};
                        param.orderNo = extra || uuid();
                        param.productId = productId;
                        const data = yield this.buyGoods(param);
                        // 适配数据
                        const purchase = {};
                        purchase.paymentID = "";
                        purchase.signedRequest = "";
                        purchase.productID = productId;
                        purchase.purchaseTime = data.paidTime;
                        purchase.purchaseToken = data.cpOrderNo;
                        return Promise.resolve(purchase);
                    } catch (error) {
                        // 支付失败弹窗提示
                        PopComfirm.showWithInit("OK", `Payment failed, please pay again`);
                        return Promise.reject({
                            code: "pay fail",
                            message: error.message
                        });
                    }
                }
            });
        }

        query() {
            return new Promise((resolve, reject) => {
                emoPaySDK.api.requestGoods((res) => {
                    if (res.code !== 0) {
                        // 获取商品列表失败
                        reject({
                            code: "request goods fail",
                            message: res.msg
                        });
                    }
                    if (res.data == null || res.data.length === 0) {
                        reject({
                            code: "request goods empty",
                            message: "request goods empty"
                        });
                    }
                    const products = [];
                    const productList = res.data;
                    this._curProductInfos = productList;
                    // console.info("productList: ", this._curProductInfos);
                    productList.forEach((productInfo) => {
                        const product = {};
                        product.title = productInfo.goodsName;
                        product.price = `${productInfo.amount}`;
                        product.productID = productInfo.goodsId;
                        product.description = productInfo.goodsExp;
                        product.priceCurrencyCode = "";
                        product.imageURI = "";
                        products.push(product);
                    });
                    resolve(products);
                });
            });
        }

        queryUncomsume() {
            return __awaiter(this, void 0, void 0, function* () {
                // 获取未消费商品
                try {
                    const orderInfos = yield postFetchRetry(`${SdkConst.PAY_IP}/${SdkConst.MINI_ORDER_ID}/query`, {
                        thirdUid: emoPaySDK.api.getUserId()
                    });
                    console.log("query uncomsume orderInfos: ", orderInfos);
                    // @ts-ignore
                    const paidMiniOrder = orderInfos.paidMiniOrders;
                    const productList = [];
                    paidMiniOrder.forEach((orderInfo) => {
                        const productInfo = this._curProducts.filter((product) => product.productID === orderInfo.productId)[0];
                        const purchase = {};
                        purchase.paymentID = "";
                        purchase.purchaseTime = "";
                        purchase.productID = productInfo.productID;
                        purchase.purchaseToken = orderInfo.thirdOrderId;
                        purchase.signedRequest = "";
                        productList.push(purchase);
                    });
                    return Promise.resolve(productList);
                } catch (error) {
                    return Promise.reject({
                        code: "query uncomsume order",
                        message: error.message
                    });
                }
            });
        }

        consume(purchaseToken) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const orderInfos = yield postFetchRetry(`${SdkConst.PAY_IP}/${SdkConst.MINI_ORDER_ID}/consume`, {
                        mini_order_id: purchaseToken
                    });
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject({
                        code: "consume_fail",
                        message: error.message
                    });
                }
            });
        }

        onReady(callBack) {
            // this.initPay();
            // callBack && callBack();
        }

        /**
         * 登陆状态检查
         */
        checkUserLoginStatus() {
            return new Promise((resolve, reject) => {
                emoPaySDK.api.checkUserLoginStatus((res) => {
                    if (res === 0) {
                        resolve(true);
                    } else if (res === -1 || res === -2) {
                        // -1: token过期，-2: 尚未登录
                        resolve(false);
                    } else {
                        reject({
                            code: "check user login status error",
                            message: JSON.stringify(res)
                        });
                    }
                });
            });
        }

        buyGoods(option) {
            console.info("=====> pay options: ", option);
            return new Promise((resolve, reject) => {
                const productInfo = this._curProductInfos.filter((product) => product.goodsId === option.productId)[0];
                if (productInfo == null) {
                    reject({
                        message: "product not found"
                    });
                    return;
                }
                // 添加拓展对象
                const extObj = {
                    game_id: commonInfo.gameId
                };
                // 拓传字段
                const ext = JSON.stringify(extObj);
                // 支付回调地址
                const notifyUrl = "http://purchase.minigame.vip/v2/purchase/emo/callback";
                console.info("=====> emoPay buyGoods ing");
                emoPaySDK.api.buyGoods(productInfo, option.orderNo, ext, notifyUrl, (res) => {
                    console.info("emoPay buyGoods response: ", res);
                    if (res.code === 0 && res.data != null) {
                        // 购买成功
                        if (res.data.paySt === EmoPayState.SUCCESS) {
                            // 支付成功
                            console.info("pay success");
                            resolve(res.data);
                        } else {
                            // 支付失败
                            console.info("pay fail");
                            reject({
                                code: "pay fail",
                                message: res.msg
                            });
                        }
                    } else {
                        // 购买失败
                        reject({
                            code: "buy goods fail",
                            message: res.msg
                        });
                    }
                });
            });
        }

        /** 游客登录 */
        guestLogin() {
            return new Promise((resolve, reject) => {
                emoPaySDK.api.guestLogin((res) => {
                    if (res.code === 0) {
                        // 登录成功
                        console.info("guest login success");
                        resolve();
                    } else {
                        // 登录失败
                        console.info("guest login fail");
                        reject({
                            code: "guest login fail",
                            message: res.msg
                        });
                    }
                });
            });
        }

        /** 发送验证码 */
        sendVerifyCode(phone) {
            return new Promise((resolve, reject) => {
                emoPaySDK.api.requestOpt(phone, (res) => {
                    if (res.code === 0) {
                        // 发送成功
                        resolve();
                    } else {
                        // 发送失败
                        reject({
                            code: "send verify code fail",
                            message: res.msg
                        });
                    }
                });
            });
        }

        /** 手机登录 */
        phoneLogin(phone, code) {
            return new Promise((resolve, reject) => {
                emoPaySDK.api.phoneLogin(phone, code, (res) => {
                    if (res.code === 0) {
                        // 登录成功
                        resolve();
                    } else {
                        // 登录失败
                        reject({
                            code: "phone login fail",
                            message: res.msg
                        });
                    }
                });
            });
        }

        /** 账号登录 */
        userLogin(account, password) {
            return this.phoneLogin(account, password);
        }

        /** 获取当前用户ID */
        getUserId() {
            const userId = emoPaySDK.api.getUserId();
            return userId || "";
        }

        /** 获取当前登录用户的token */
        getUserToken() {
            return emoPaySDK.api.getUserToken();
        }

        /** 检测登录 */
        checkLoginAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                return Promise.resolve(false);
                // try {
                //   const isLoginStatus = await this.checkUserLoginStatus();
                //   if (
                //     (isLoginStatus && storageHelper.storageType !== StorageType.Cloud) ||
                //     !isLoginStatus
                //   ) {
                //     return Promise.resolve(false);
                //   }
                //   return Promise.resolve(true);
                // } catch (error) {
                //   return Promise.reject({
                //     code: "check Login error",
                //     message: error.message
                //   });
                // }
            });
        }
    }

    EmoPay.getInstance();
    // ClassStorage.EmoPay = EmoPay;

    const ClassStorage = {};
    ClassStorage.EmoPay = EmoPay;

    /**
     * @author : Dony
     * @date : 2022-06-14 18:11:40
     * @description : 代理类
     */
    class ProxyClass {
        /**
         * 代理构建方法
         * @param className 动态类名称
         * @param option 动态类创建参数
         */
        static getClass(className, option) {
            // 一个简单的异常判断，如果存储类中不存在此类 则抛出异常提醒
            if (ClassStorage[className] === undefined ||
                ClassStorage[className] === null) {
                console.warn(`未找到 className：${className} 对应实现`);
                return null;
            }
            // 从存放对象上找出对应class 创建即可
            return new ClassStorage[className](option);
        }

        static checkValidClass(className) {
            // 一个简单的异常判断，如果存储类中不存在此类 则抛出异常提醒
            if (ClassStorage[className] === undefined ||
                ClassStorage[className] === null) {
                return null;
            }
            // 从存放对象上找出对应class 创建即可
            return className;
        }
    }

    /**
     * @author : Dony
     * @date : 2022-06-14 16:50:14
     * @description : 支付管理器
     */
    class PayHelper {
        constructor() {
            this._payPlatormInfo = null;
            this._curPayment = null;
            this._isPayEnable = false;
            this._inited = false;
        }

        static get instance() {
            if (!this._instance) {
                this._instance = new PayHelper();
            }
            return this._instance;
        }

        set payEnable(isEnable) {
            this._isPayEnable = isEnable;
        }

        get payEnable() {
            return this._isPayEnable;
        }

        get inited() {
            return this._inited;
        }

        init(channel) {
            throw new Error("Method not implemented.");
        }

        pay(productId, extra) {
            console.info("=====> pay productID: ", productId);
            if (!this._inited) {
                PopComfirm.showWithInit("OK", `The payment initialization failed. 
Please restart the game if you 
want to make a payment.`);
                return Promise.reject({
                    code: "fail to initialize payment",
                    message: `payment inited false`
                });
            }
            if (this._curPayment) {
                return this._curPayment.pay(productId, extra);
            } else {
                console.error("purchase fail no payment selected");
                return Promise.reject({
                    code: "purchaseAsync fail",
                    message: "no payment selected"
                });
            }
        }

        query() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this._curPayment) {
                    try {
                        const products = yield this._curPayment.query();
                        console.info("get products : ", products);
                        return products;
                    } catch (error) {
                        return Promise.reject({
                            message: "getCatalog fail " + error.message
                        });
                    }
                } else {
                    return Promise.reject({
                        code: "getCatalogAsync fail",
                        message: "no payment selected"
                    });
                }
            });
        }

        queryUncomsume() {
            if (this._curPayment) {
                return this._curPayment.queryUncomsume();
            } else {
                return Promise.reject({
                    code: "getPurchasesAsync fail",
                    message: "no payment selected"
                });
            }
        }

        consume(purchaseToken) {
            if (this._curPayment) {
                return this._curPayment.consume(purchaseToken);
            } else {
                return Promise.reject({
                    code: "consumePurchaseAsync fail",
                    message: "no payment selected"
                });
            }
        }

        onReady(callBack) {
            if (this._curPayment) {
                this._curPayment.onReady(callBack);
            } else {
                console.error("no payment selected");
            }
        }

        fetchPayConfig(configUrl) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const res = yield fetch(configUrl);
                    if (res.status === 404) {
                        return Promise.reject({
                            code: "fetchPayConfig fail " + configUrl
                        });
                    }
                    const payConfig = yield res.json();
                    const infos = payConfig.infos;
                    const enableInfo = infos.filter((info) => info.enabled)[0];
                    this._curPayment = ProxyClass.getClass(enableInfo.id);
                    this._payPlatormInfo = enableInfo;
                    if (!this._curPayment) {
                        return Promise.reject({
                            code: "this._curPayment null " + enableInfo.id
                        });
                    }
                    console.info("load pay config: ", configUrl);
                    this._isPayEnable = true;
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject({
                        message: "fetchPayConfig fail " + error.message
                    });
                }
            });
        }

        loadSDK() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield loadJsAsync(this._payPlatormInfo.sdkUrl, true);
                    console.info("load pay dk: ", this._payPlatormInfo.sdkUrl);
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject({
                        message: "load pay sdk fail " + error.message
                    });
                }
            });
        }

        loadPayment(configUrl) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.fetchPayConfig(configUrl);
                    yield this.loadSDK();
                    this._curPayment.init(this._payPlatormInfo.channel);
                    this._inited = true;
                    return Promise.resolve();
                } catch (error) {
                    //       if (this._curPayment && this._curPayment.getUserId().length === 0) {
                    //         PopComfirm.showWithInit("OK", `emoPay初始化失败，
                    // 数据将被保存到本地`);
                    //       }
                    return Promise.reject({
                        code: "loadPayment fail",
                        message: error.message
                    });
                }
            });
        }

        //   async getCatalogAsync (): Promise<Product[]> {
        //     if (this._curPayment) {
        //       try {
        //         const products:Product[] = await this._curPayment.query();
        //         console.info("get products : ", products);
        //         return products;
        //       } catch (error) {
        //         return Promise.reject({
        //           message: "getCatalog fail " + error.message
        //         });
        //       }
        //     } else {
        //       return Promise.reject({
        //         code: "getCatalogAsync fail",
        //         message: "no payment selected"
        //       });
        //     }
        //   }
        //   purchaseAsync (purchaseConfig: PurchaseConfig): Promise<Purchase> {
        //     console.info("purchase productID: ", purchaseConfig.productID);
        //     if (!this._inited) {
        //       PopComfirm.showWithInit("OK", `The payment initialization failed.
        // Please restart the game if you
        // want to make a payment.`);
        //       return Promise.reject({
        //         code: "fail to initialize payment",
        //         message: `payment inited false`
        //       });
        //     }
        //     if (this._curPayment) {
        //       return this._curPayment.pay(purchaseConfig.productID);
        //     } else {
        //       console.error("purchase fail no payment selected");
        //       return Promise.reject({
        //         code: "purchaseAsync fail",
        //         message: "no payment selected"
        //       });
        //     }
        //   }
        //   getPurchasesAsync (): Promise<Purchase[]> {
        //     if (this._curPayment) {
        //       return this._curPayment.queryUncomsume();
        //     } else {
        //       return Promise.reject({
        //         code: "getPurchasesAsync fail",
        //         message: "no payment selected"
        //       });
        //     }
        //   }
        //   consumePurchaseAsync (purchaseToken: string): Promise<void> {
        //     if (this._curPayment) {
        //       return this._curPayment.consume(purchaseToken);
        //     } else {
        //       return Promise.reject({
        //         code: "consumePurchaseAsync fail",
        //         message: "no payment selected"
        //       });
        //     }
        //   }
        setPayment(payment) {
            if (!payment) {
                console.error("payment is null");
                return;
            }
            this._curPayment = payment;
        }

        getUserId() {
            if (this._curPayment) {
                return this._curPayment.getUserId();
            } else {
                return "";
            }
        }

        guestLogin() {
            if (this._curPayment) {
                return this._curPayment.guestLogin();
            } else {
                return Promise.reject({
                    code: "payHelper guestLogin fail",
                    message: "this _curPayment is null"
                });
            }
        }

        userLogin(account, password) {
            if (this._curPayment) {
                return this._curPayment.userLogin(account, password);
            } else {
                return Promise.reject({
                    code: "payHelper userLogin fail",
                    message: "this _curPayment is null"
                });
            }
        }

        checkLoginAsync() {
            if (this._curPayment) {
                return this._curPayment.checkLoginAsync();
            } else {
                return Promise.reject({
                    code: "checkLoginAsync fail",
                    message: "no payment selected"
                });
            }
        }
    }

    const payHelper = PayHelper.instance;

    class CloudStorage {
        constructor() {
            this.handleUrl = (url) => (params) => {
                if (params) {
                    const paramsArray = [];
                    Object.keys(params).forEach((key) => paramsArray.push("keys=" + params[key]));
                    if (url.search(/\?/) === -1) {
                        // eslint-disable-next-line no-unused-expressions
                        typeof params === "object"
                            ? (url += "?" + paramsArray.join("&"))
                            : url;
                    } else {
                        url += "&" + paramsArray.join("&");
                    }
                }
                return url;
            };
        }

        static get instance() {
            if (!this._instance) {
                this._instance = new CloudStorage();
            }
            return this._instance;
        }

        getDataAsync(keys) {
            return __awaiter(this, void 0, void 0, function* () {
                console.info("====> getData userId: ", payHelper.getUserId());
                if (payHelper.getUserId() === "") {
                    console.error("=====> userId is null");
                    // return Promise.reject({
                    //   code: "USERID_NULL",
                    //   message: "userId is null"
                    // });
                }
                const methods = HttpMethod.get;
                const symbol = `${commonInfo.channelName}_${commonInfo.channel}_${commonInfo.gameId}_${payHelper.getUserId()}`;
                console.info("get data id: ", symbol);
                const date = new Date().toUTCString().toString();
                const digest = "HMACSHA512-SecretKey";
                const Base64 = CryptoJS.enc.Base64;
                const hmacSHA512 = CryptoJS.HmacSHA512;
                let uri = `/${SdkConst.GET_DATA}/${symbol}?`;
                let url = `${SdkConst.PAY_IP}/dev/${SdkConst.GET_DATA}/${symbol}?`;
                keys.forEach((key, index) => {
                    if (index !== 0) {
                        url += "&";
                        uri += "&";
                    }
                    url += `keys=${key}`;
                    uri += `keys=${key}`;
                });
                const signature = Base64.stringify(hmacSHA512(`(request-target): get ${uri}\nx-date: ${date}\ndigest: `, digest));
                const keyId = "write";
                const algorithm = "hmac-sha512";
                const myHeaders = new Headers();
                myHeaders.append("Authorization", `Signature keyId="${keyId}",algorithm="${algorithm}",headers="(request-target) x-date digest",signature="${signature}"`);
                myHeaders.append("x-date", date);
                // eslint-disable-next-line no-undef
                const option = {
                    method: methods,
                    headers: myHeaders,
                    redirect: "follow"
                    // mode: "no-cors"
                };
                return yield fetch(url, option)
                    .then((response) => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            // console.error(`get ${url} fail status: ${response.status}`);
                            return Promise.reject({
                                code: response.status,
                                message: `get ${url} fail status: ${response.status}`
                            });
                        }
                    })
                    .then((response) => {
                        console.info(`get ${url} success response: ${JSON.stringify(response)}`);
                        return Promise.resolve(response.data);
                    })
                    .catch((error) => {
                        console.error(`get ${url} error: ${error.message}`);
                        return Promise.reject({
                            code: "CloudStorage getData error",
                            message: error.message
                        });
                    });
            });
        }

        setDataAsync(data) {
            return __awaiter(this, void 0, void 0, function* () {
                if (payHelper.getUserId() === "") {
                    console.error("=====> userId is null");
                    // return Promise.reject({
                    //   code: "USERID_NULL",
                    //   message: "userId is null"
                    // });
                }
                const methods = HttpMethod.post;
                const date = new Date().toUTCString().toString();
                const secret = "HMACSHA512-SecretKey";
                const sha256 = CryptoJS.SHA256;
                const Base64 = CryptoJS.enc.Base64;
                const hmacSHA512 = CryptoJS.HmacSHA512;
                const symbol = `${commonInfo.channelName}_${commonInfo.channel}_${commonInfo.gameId}_${payHelper.getUserId()}`;
                console.info("set data id: ", symbol);
                const fetchData = {
                    id: symbol,
                    data: data
                };
                const digest = `SHA-256=${Base64.stringify(sha256(JSON.stringify(fetchData)))}`;
                const keyId = "write";
                const algorithm = "hmac-sha512";
                const signature = Base64.stringify(hmacSHA512(`(request-target): post /${SdkConst.SET_DATA}\nx-date: ${date}\ndigest: ${digest}`, secret));
                const myHeaders = new Headers();
                myHeaders.append("Authorization", `Signature keyId="${keyId}",algorithm="${algorithm}",headers="(request-target) x-date digest",signature="${signature}"`);
                myHeaders.append("Content-Type", "application/json");
                myHeaders.append("x-date", date);
                myHeaders.append("digest", digest);
                // eslint-disable-next-line no-undef
                const options = {
                    method: methods,
                    headers: myHeaders,
                    // mode: "no-cors",
                    body: JSON.stringify(fetchData)
                };
                const url = `${SdkConst.PAY_IP}/dev/${SdkConst.SET_DATA}`;
                console.info("=====> cloudStorage setData: ", JSON.stringify(fetchData));
                return yield fetch(url, options)
                    .then((response) => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            // alert("服务器繁忙，请稍后再试；\r\nCode:" + response.status);
                            // console.error(`post ${url} fail status: ${response.status}`);
                            return Promise.reject({
                                code: response.status,
                                message: `post ${url} fail status: ${response.status}`
                            });
                        }
                    })
                    .then((response) => {
                        console.info(`post ${url} success response: ${JSON.stringify(response)}`);
                        return Promise.resolve();
                    })
                    .catch((error) => {
                        console.error("CloudStorage setData error: " + error.message);
                        return Promise.reject({
                            message: "CloudStorage setData error: " + error.message
                        });
                    });
            });
        }
    }

    const cloudDataStorage = CloudStorage.instance;

    /**
     * @author : Dony
     * @date : 2022-06-08 11:09:49
     * @description : 本地存储
     */
    class LocalStorage {
        static get instance() {
            if (!this._instance) {
                this._instance = new LocalStorage();
                this._instance.init();
            }
            return this._instance;
        }

        init() {
            // @ts-ignore
            // const appId = window.commonInfo.appId || "";
            init();
        }

        getDataAsync(keys) {
            if (!keys || keys.length === 0) {
                return Promise.reject({
                    message: "LocalStorage getData keys null"
                });
            }
            const objData = {};
            for (const key of keys) {
                objData[key] = getItem(key);
            }
            console.info("======> get local data: ", objData);
            return Promise.resolve(objData);
        }

        setDataAsync(data) {
            if (!data) {
                return Promise.reject({
                    message: "LocalStorage setData data null"
                });
            }
            for (const key in data) {
                setItem(key, data[key]);
            }
            flush();
            console.info("======> set local data: ", data);
            return Promise.resolve();
        }
    }

    const localDataStorage = LocalStorage.instance;

    /**
     * @author : Dony
     * @date : 2022-06-15 16:14:35
     * @description : 存储工具
     */
    var StorageType;
    (function (StorageType) {
        StorageType["Local"] = "Local";
        StorageType["Cloud"] = "Cloud";
        StorageType["None"] = "None";
    })(StorageType || (StorageType = {}));
    var SaveKey;
    (function (SaveKey) {
        SaveKey["GuestUid"] = "guestUid";
        SaveKey["UserPhone"] = "userPhone";
        SaveKey["StorageType"] = "storageType";
    })(SaveKey || (SaveKey = {}));

    class StorageHelper {
        constructor() {
            // 存储类型
            this._storageType = StorageType.None;
        }

        static get instance() {
            if (!this._instance) {
                this._instance = new StorageHelper();
            }
            return this._instance;
        }

        init() {
            localDataStorage.init();
        }

        set storageType(storageType) {
            this._storageType = storageType;
            setItem(SaveKey.StorageType, this._storageType);
            flush();
        }

        get storageType() {
            if (getItem(SaveKey.StorageType)) {
                this._storageType = getItem(SaveKey.StorageType);
            }
            return this._storageType;
        }

        //   // 游客uid
        //   private _guestUid: string = "";
        //   public set guestUid (uid: string) {
        //     this._guestUid = uid;
        //     LocalCache.setItem(SaveKey.GuestUid, this._guestUid);
        //     LocalCache.flush();
        //   }
        //   public get guestUid (): string {
        //     if (LocalCache.getItem(SaveKey.GuestUid)) {
        //       this._guestUid = LocalCache.getItem(SaveKey.GuestUid);
        //     }
        //     return this._guestUid;
        //   }
        //   // 注册用户手机号
        //   private _userPhone: string = "";
        //   public set userPhone (userPhone: string) {
        //     this._userPhone = userPhone;
        //     LocalCache.setItem(SaveKey.UserPhone, this._userPhone);
        //     LocalCache.flush();
        //   }
        //   public get userPhone (): string {
        //     if (LocalCache.getItem(SaveKey.UserPhone)) {
        //       this._userPhone = LocalCache.getItem(SaveKey.UserPhone);
        //     }
        //     return this._userPhone;
        //   }
        //   // 检查是否是新的正式用户
        //   public async isNewUser (): Promise<boolean> {
        //     try {
        //       const data: Object = LocalCache.localData();
        //       const keys = Object.keys(data);
        //       const getData = await cloudDataStorage.getDataAsync(keys);
        //       const isNew: boolean = !getData;
        //       console.info(
        //         `====> check keys: ${keys}/\n getData: ${getData}\n !!getData: ${isNew}`
        //       );
        //       return Promise.resolve(isNew);
        //     } catch (error) {
        //       console.error(`isNewUser error: ${error.message}`);
        //       return Promise.reject({
        //         code: "isNewUser error",
        //         message: error.message
        //       });
        //     }
        //   }
        //   /**
        //    * 是新用户，则把本地穿裆继承到服务器
        //    * 否则，提示绑定失败
        //    */
        //   public async checkNewUser (): Promise<boolean> {
        //     try {
        //       const isNewUser: boolean = await this.isNewUser();
        //       if (isNewUser) {
        //         await this.dealBindingAccountSuccess();
        //       } else {
        //         this.dealExistAccountBinding();
        //       }
        //       return Promise.resolve(isNewUser);
        //     } catch (error) {
        //       console.error(`checkNewUser error: ${error.message}`);
        //       return Promise.reject({
        //         code: "checkNewUser error",
        //         message: `${error.message}`
        //       });
        //     }
        //   }
        //   /** 处理绑定账号已存在情况 */
        //   private dealExistAccountBinding (): void {
        //     const comfirmInfo: PopComfirmInfo = {} as PopComfirmInfo;
        //     comfirmInfo.btnName = "SWITCH";
        //     comfirmInfo.message = `Sorry,This account already exists,
        // please change a new account.
        // If you want switch account,
        // please click the button.`;
        //     comfirmInfo.btnFunc = () => {
        //       emoPhoneLogin.show();
        //     };
        //     PopComfirm.init(comfirmInfo);
        //     PopComfirm.show();
        //   }
        //   /** 处理账号绑定成功情况 */
        //   private async dealBindingAccountSuccess (): Promise<void> {
        //     try {
        //       await cloudDataStorage.setDataAsync(LocalCache.localData());
        //       PopTip.success({
        //         message: "Register success.",
        //         autoCloseTime: 2,
        //         top: "50%",
        //         left: "50%"
        //       });
        //       return Promise.resolve();
        //     } catch (error) {
        //       PopTip.success({
        //         message: "Register fail.",
        //         autoCloseTime: 2,
        //         top: "50%",
        //         left: "50%"
        //       });
        //       return Promise.reject({
        //         code: "fail save local data to cloud",
        //         message: error.message
        //       });
        //     }
        //   }
        getDataAsync(keys) {
            // todo 这边注释要放在payHelper中处理
            // if (payHelper.getUserId().length === 0 || !payHelper.inited) {
            //   return localDataStorage.getDataAsync(keys);
            // }
            if (this._storageType === StorageType.Cloud) {
                return cloudDataStorage.getDataAsync(keys);
            }
            return localDataStorage.getDataAsync(keys);
        }

        setDataAsync(data) {
            // todo 这边注释要放在payHelper中处理
            // if (payHelper.getUserId().length === 0 || !payHelper.inited) {
            //   return localDataStorage.setDataAsync(data);
            // }
            if (this._storageType === StorageType.Cloud) {
                return cloudDataStorage.setDataAsync(data);
            }
            return localDataStorage.setDataAsync(data);
        }
    }

    const storageHelper = StorageHelper.instance;

    class StorageInstantSetDataService extends MediationService {
        static createRequest(data) {
            return {
                type: StorageInstantSetDataService.requestType,
                payload: data
            };
        }

        static createService() {
            return new StorageInstantSetDataService(StorageInstantSetDataService.requestType, false, StorageInstantSetDataService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            return storageHelper
                .setDataAsync(request.payload)
                .then(() => {
                    return Promise.resolve(generateSuccessResponse(request));
                })
                .catch((err) => {
                    return Promise.resolve(generateErrorResponse(request, err.code, err.message));
                });
        }
    }

    StorageInstantSetDataService.requestType = "StorageInstantSetDataService";

    class StorageInstantGetDataService extends MediationService {
        static createRequest(keys) {
            return {
                type: StorageInstantGetDataService.requestType,
                payload: keys
            };
        }

        static createService() {
            return new StorageInstantGetDataService(StorageInstantGetDataService.requestType, false, StorageInstantGetDataService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            return storageHelper
                .getDataAsync(request.payload)
                .then((data) => {
                    return Promise.resolve(generateSuccessResponse(request, data));
                })
                .catch((err) => {
                    return Promise.resolve(generateErrorResponse(request, err.code, err.message));
                });
        }
    }

    StorageInstantGetDataService.requestType = "StorageInstantGetDataService";

    function loadChildPage(url, frameId) {
        const frame = document.getElementById(frameId);
        console.assert(frame != null);
        frame.src = url;
    }

    /**
     * @author : Dony
     * @date : 2022-07-20 17:01:30
     * @description : 广告服务
     */
    class BannerShowService extends MediationService {
        static createRequest(placementID) {
            return {
                type: BannerShowService.requestType,
                payload: placementID
            };
        }

        static createService() {
            return new BannerShowService(BannerShowService.requestType, false, BannerShowService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            return adsManager
                .loadBannerAsync(request.payload)
                .then(() => {
                    return Promise.resolve(generateSuccessResponse(request));
                })
                .catch((err) => {
                    return Promise.reject(generateErrorResponse(request, err.code, err.message));
                });
        }
    }

    BannerShowService.requestType = "BannerShowService";

    class BannerHideService extends MediationService {
        static createRequest() {
            return {
                type: BannerHideService.requestType
            };
        }

        static createService() {
            return new BannerHideService(BannerHideService.requestType, false, BannerHideService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            return adsManager
                .hideBannerAsync()
                .then(() => {
                    return Promise.resolve(generateSuccessResponse(request));
                })
                .catch((err) => {
                    return Promise.reject(generateErrorResponse(request, err.code, err.message));
                });
        }
    }

    BannerHideService.requestType = "BannerHideService";

    /**
     * @author : Dony
     * @date : 2022-08-18 09:20:50
     * @description : commonInfo 公共信息服务
     */
    class CommonInfoService extends MediationService {
        static createRequest() {
            return {
                type: CommonInfoService.requestType
            };
        }

        static createService() {
            return new CommonInfoService(CommonInfoService.requestType, false, CommonInfoService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            return new Promise((resolve, reject) => {
                resolve(generateSuccessResponse(request, commonInfo));
            });
        }
    }

    CommonInfoService.requestType = "CommonInfoService";

    /**
     * @author : Dony
     * @date : 2022-08-26 14:22:24
     * @description : 分享服务
     */
    class ShareService extends MediationService {
        static createRequest(payload) {
            return {
                type: ShareService.requestType,
                payload: payload
            };
        }

        static createService() {
            return new ShareService(ShareService.requestType, false, ShareService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            return shareHelper
                .shareAsync(request.payload)
                .then(() => {
                    return Promise.resolve(generateSuccessResponse(request));
                })
                .catch((err) => {
                    return Promise.resolve(generateErrorResponse(request, err.code, err.message));
                });
        }
    }

    ShareService.requestType = "ShareService";

    /**
     * @author : Dony
     * @date : 2022-09-16 13:53:59
     * @description : 安卓打点服务
     */
    class AndroidLogEventService extends MediationService {
        static createRequest(eventName) {
            return {
                type: AndroidLogEventService.requestType,
                payload: eventName
            };
        }

        static createService() {
            return new AndroidLogEventService(AndroidLogEventService.requestType, false, AndroidLogEventService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            // @ts-ignore
            if (!window.AdInteractive) {
                const errorInfo = {
                    code: "ANDROID_INSTANCE_ERROR",
                    message: "Android AdInteractive not exist"
                };
                return Promise.resolve(generateErrorResponse(request, errorInfo.code, errorInfo.message));
            }
            // @ts-ignore
            window.AdInteractive.trackEvent(request.payload);
            console.info(`====> android trackEvent ${request.payload}`);
            return Promise.resolve(generateSuccessResponse(request));
        }
    }

    AndroidLogEventService.requestType = "AndroidLogEventService";

    class AdflyEventReport {
        onGameEvent(event) {
            // 获取clickid
            const urlParams = new URLSearchParams(window.location.search);
            if (!urlParams.has("clickid")) {
                console.error("location search hasn't clickid field");
                return;
            }
            const clickid = urlParams.get("clickid");
            let gaid = "";
            if (urlParams.has("gaid")) {
                gaid = urlParams.get("gaid");
            }
            const reportEvent = {};
            reportEvent.subject = event.eventName;
            if (event.label) {
                reportEvent.eventValue = event.label;
            }
            const reportModel = {};
            reportModel.channelId = commonInfo.getChannelName();
            reportModel.gameId = commonInfo.minigameOption.game_id;
            reportModel.clickId = clickid;
            reportModel.event = reportEvent;
            reportModel.ts = `${TimeUtil.getTimeBySecond()}`;
            if (gaid.length > 0) {
                reportModel.gaid = gaid;
            }
            this.reportToMinigameEventGateway(reportModel);
            console.info("====> reportModel: ", reportModel);
        }

        reportToMinigameEventGateway(reportEvent) {
            return __awaiter(this, void 0, void 0, function* () {
                const methods = HttpMethod.post;
                const date = new Date().toUTCString().toString();
                const secret = "HMACSHA512-SecretKey";
                const sha256 = CryptoJS.SHA256;
                const Base64 = CryptoJS.enc.Base64;
                const hmacSHA512 = CryptoJS.HmacSHA512;
                const fetchData = reportEvent;
                const digest = `SHA-256=${Base64.stringify(sha256(JSON.stringify(fetchData)))}`;
                const keyId = "write";
                const algorithm = "hmac-sha512";
                const signature = Base64.stringify(hmacSHA512(`(request-target): post /${CPL.ADFLY_REPORT_PUBLISH}\nx-date: ${date}\ndigest: ${digest}`, secret));
                const myHeaders = new Headers();
                myHeaders.append("Authorization", `Signature keyId="${keyId}",algorithm="${algorithm}",headers="(request-target) x-date digest",signature="${signature}"`);
                myHeaders.append("Content-Type", "application/json");
                myHeaders.append("x-date", date);
                myHeaders.append("digest", digest);
                // eslint-disable-next-line no-undef
                const options = {
                    method: methods,
                    headers: myHeaders,
                    // mode: "no-cors",
                    body: JSON.stringify(fetchData)
                };
                const url = `${CPL.ADFLY_REPORT_DOMAIN}/${CPL.ADFLY_REPORT_PUBLISH}`;
                console.info("=====> reportToMinigameEventGateway: ", JSON.stringify(fetchData));
                yield fetch(url, options)
                    .then((response) => {
                        if (response.ok) {
                            response.json();
                            console.info(`====> reportToMinigameEventGateway post ${url} success response: ${JSON.stringify(response.json())}`);
                        } else {
                            console.error(`====> reportToMinigameEventGateway post ${url} fail status: ${response.status}`);
                        }
                    })
                    .catch((error) => {
                        console.error("====> reportToMinigameEventGateway setData error: " + error.message);
                    });
            });
        }
    }

    /**
     * @author : Dony
     * @date : 2022-09-22 09:45:11
     * @description : CPL上报
     */
    class CplReportHelper {
        static get instance() {
            if (!this._instance) {
                this._instance = new CplReportHelper();
            }
            return this._instance;
        }

        constructor() {
            this._curReport = null;
            // todo 暂且写死，后面接入其他CPL再看下规则来设置
            this._curReport = new AdflyEventReport();
        }

        onGameEvent(event) {
            if (!event) {
                console.error("report event is null");
                return;
            }
            if (!this._curReport) {
                console.error("cur report instance is null");
                return;
            }
            this._curReport.onGameEvent(event);
        }
    }

    CplReportHelper._instance = null;
    const cplHelper = CplReportHelper.instance;

    /**
     * @author : Dony
     * @date : 2022-09-21 17:58:00
     * @description : 微游中心事件上报服务（CPL）
     */
    class GameEventReportService extends MediationService {
        static createRequest(payload) {
            return {
                type: GameEventReportService.requestType,
                payload: payload
            };
        }

        static createService() {
            return new GameEventReportService(GameEventReportService.requestType, false, GameEventReportService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            cplHelper.onGameEvent(request.payload);
            return Promise.resolve(generateSuccessResponse(request));
        }
    }

    GameEventReportService.requestType = "GameEventReportService";

    /** 提示弹窗 */
    const PopTip = {
        show(tipInfo) {
            const newAutoCloseTime = tipInfo.autoCloseTime || 2;
            const newTop = tipInfo.top || "50%";
            const finalTop = tipInfo.finalTop || `30%`;
            const newLeft = tipInfo.left || "50%";
            const div = document.createElement("div");
            div.innerHTML = `<div style="transition: all 0.5s ease-out;position: fixed;top: -100%;left:${newLeft};transform: translate(-50%,0%);z-index: 20002;width:100%;text-align: center;">
            <div style="display: inline-block;font-size: 12px;font-weight: 500;color: #F2F8FF;line-height: 17px;background: rgba(20,31,43,0.8);max-width: 280px;min-width: 100px;min-height: 20px;border-radius: 9px;word-break: break-word;padding: 10px;">
                <div>${tipInfo.message}</div>
            </div>
        </div>`;
            document.body.append(div);
            // @ts-ignore
            div.firstChild.style.top = newTop;
            setTimeout(() => {
                // @ts-ignore
                div.firstChild.style.top = finalTop;
                setTimeout(() => {
                    div.remove();
                }, newAutoCloseTime * 1000);
            }, 1);
        },
        error(tipInfo) {
            tipInfo.autoCloseTime && (this.autoCloseTime = tipInfo.autoCloseTime);
            const newAutoCloseTime = tipInfo.autoCloseTime || 1;
            const newTop = tipInfo.top || "50%";
            const finalTop = tipInfo.finalTop || `0px`;
            const newLeft = tipInfo.left || "50%";
            const div = document.createElement("div");
            div.innerHTML = `<div  style="transition: all 0.5s ease-out;border: 1px solid #fde2e2;color:#f56c6c;background: #fef0f0;max-width: 300px;min-height: 20px;position: fixed;top: -100%;left:${newLeft};transform: translate(-50%,0%);z-index: 20001;border-radius: 4px;word-break: break-word;padding: 10px;">
                <div>
                    <svg t="1655971895182" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3456" width="20" height="20"><path d="M827.392 195.584q65.536 65.536 97.792 147.456t32.256 167.936-32.256 167.936-97.792 147.456-147.456 98.304-167.936 32.768-168.448-32.768-147.968-98.304-98.304-147.456-32.768-167.936 32.768-167.936 98.304-147.456 147.968-97.792 168.448-32.256 167.936 32.256 147.456 97.792zM720.896 715.776q21.504-21.504 18.944-49.152t-24.064-49.152l-107.52-107.52 107.52-107.52q21.504-21.504 24.064-49.152t-18.944-49.152-51.712-21.504-51.712 21.504l-107.52 106.496-104.448-104.448q-21.504-20.48-49.152-23.04t-49.152 17.92q-21.504 21.504-21.504 52.224t21.504 52.224l104.448 104.448-104.448 104.448q-21.504 21.504-21.504 51.712t21.504 51.712 49.152 18.944 49.152-24.064l104.448-104.448 107.52 107.52q21.504 21.504 51.712 21.504t51.712-21.504z" p-id="3457" fill="#f56c6c"></path></svg>
                </div>
                <div>${tipInfo.message}</div>
            </div>`;
            document.body.append(div);
            // @ts-ignore
            div.firstChild.style.top = newTop;
            setTimeout(() => {
                // @ts-ignore
                div.firstChild.style.top = finalTop;
                setTimeout(() => {
                    div.remove();
                }, newAutoCloseTime * 1000);
            }, 1);
        }
    };

    class SharpMatchService extends MediationService {
        static createRequest(payload) {
            return {
                type: this.requestType,
                payload: payload
            };
        }

        static createService() {
            return new SharpMatchService(this.requestType, false, this.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            const payload = request.payload;
            if (payload === undefined) {
                return Promise.resolve(generateSuccessResponse(request));
            }
            return new Promise((resolve, reject) => {
                try {
                    // @ts-ignore
                    window.xwJsbCallback = (res) => {
                        // jsbridge回调处理
                        resolve(generateSuccessResponse(request));
                    };
                    // @ts-ignore
                    window.xworld.jsbridge(JSON.stringify({
                        method: "finishGame",
                        params: {
                            relay_data: payload.relay_data,
                            score: payload.score // 游戏提交分数
                        },
                        callback: "xwJsbCallback"
                    }));
                } catch (error) {
                    PopTip.show({message: error.message});
                    console.error("sharp report score error: ", error.message);
                    resolve(generateSuccessResponse(request));
                }
            });
        }
    }

    SharpMatchService.requestType = "SharpMatchService";

    class TPBase {
        invokeMethodByName(methodName, ...args) {
            return __awaiter(this, void 0, void 0, function* () {
                if (typeof this[methodName] !== "function") {
                    return Promise.reject({
                        code: "FOUND_ERROR",
                        message: `Function ${methodName} is not exist.`
                    });
                }
                return yield this[methodName](...args);
            });
        }
    }

    class TPPlayerit extends TPBase {
        scoreUpdate(data) {
            // @ts-ignore
            const jsBridge = window.WebViewJavascriptBridge;
            if (!jsBridge) {
                return Promise.reject({
                    code: "JSBRIGDE_ERROR",
                    message: "WebViewJavascriptBridge is not undefined"
                });
            }
            try {
                const score = data[0][0];
                console.info("scoreUpdate: ", score);
                const timestamp = Date.now();
                jsBridge === null || jsBridge === void 0 ? void 0 : jsBridge.callHandler("scoreUpdate", {
                    score: score,
                    time: timestamp
                }, function (data) {
                    const scoreInfo = JSON.parse(data);
                    console.info("scoreInfo: ", scoreInfo);
                });
                return Promise.resolve();
            } catch (error) {
                console.error("playit scoreUpdate error: ", error.message);
                return Promise.reject({
                    code: "SCOREUPDATE_ERROR",
                    message: `playit scoreUpdate error: ${error.message}`
                });
            }
        }

        getVersion() {
            // @ts-ignore
            const jsBridge = window.WebViewJavascriptBridge;
            if (!jsBridge) {
                return Promise.reject({
                    code: "JSBRIGDE_ERROR",
                    message: "WebViewJavascriptBridge is not undefined"
                });
            }
            return new Promise((resolve, reject) => {
                jsBridge === null || jsBridge === void 0 ? void 0 : jsBridge.callHandler("getVersion", {}, function (data) {
                    if (!data) {
                        reject({
                            code: "GETVERSION_ERROR",
                            message: "getVersion return data null"
                        });
                    }
                    const versionInfo = JSON.parse(data);
                    if (!versionInfo.ver) {
                        reject({
                            code: "GETVERSION_ERROR",
                            message: "ver null"
                        });
                    }
                    return resolve(versionInfo.ver);
                });
            });
        }

        isEntryExist() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const versionStr = yield this.getVersion();
                    const version = parseInt(versionStr);
                    console.info("version: ", versionStr);
                    if (version >= 20705090) {
                        return true;
                    }
                    return false;
                } catch (error) {
                    return false;
                }
            });
        }
    }

    var TPName;
    (function (TPName) {
        TPName["PLAYERIT"] = "playit";
    })(TPName || (TPName = {}));
    const tpConfig = {
        playit: TPPlayerit
    };

    class ExternalHelper {
        static init() {
            Object.keys(tpConfig).forEach(key => {
                const tpBase = new tpConfig[key]();
                this._tpMap.set(key, tpBase);
            });
        }

        static execute(chName, funcName, data) {
            return __awaiter(this, void 0, void 0, function* () {
                console.info(`funcName: ${funcName}, data: `, data);
                const tpBase = this._tpMap.get(chName);
                if (tpBase) {
                    const res = yield tpBase.invokeMethodByName(funcName, data);
                    if (typeof res === "undefined") {
                        return Promise.resolve();
                    } else {
                        return Promise.resolve(res);
                    }
                } else {
                    return Promise.reject({
                        code: "TP_NOT_FOUND",
                        message: `${chName} is not found`
                    });
                }
            });
        }
    }

    ExternalHelper._tpMap = new Map();
    ExternalHelper.init();

    /**
     * @author : Dony
     * @date : 2023-09-07 18:12:02
     * @description : 第三方输入接口统一处理
     */
    class ExternalService extends MediationService {
        static createRequest(payload) {
            return {
                type: this.requestType,
                payload: payload
            };
        }

        static createService() {
            return new ExternalService(this.requestType, false, this.hanleRequestAsync);
        }

        static hanleRequestAsync(request) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const data = yield ExternalHelper.execute(request === null || request === void 0 ? void 0 : request.payload.chnName, request === null || request === void 0 ? void 0 : request.payload.funcName, (_a = request.payload) === null || _a === void 0 ? void 0 : _a.data);
                    // 根据data是否为undefined或null来确定如何响应
                    if (data === undefined || data === null) {
                        return Promise.resolve(generateSuccessResponse(request));
                    } else {
                        return Promise.resolve(generateSuccessResponse(request, data));
                    }
                } catch (error) {
                    // 在这里处理错误，例如返回一个错误响应或抛出错误
                    console.error("Error executing ExternalHelper:", error);
                    return Promise.resolve(generateErrorResponse(request, error.code, error.message));
                }
            });
        }
    }

    ExternalService.requestType = "ExternalService";

    /**
     * @author : Dony
     * @date : 2024-06-07 11:14:46
     * @description : Telegram setGameScore
     */
    class TelevsGameScoreService extends MediationService {
        static createRequest(payload) {
            return {
                type: TelevsGameScoreService.requestType,
                payload: payload
            };
        }

        static createService() {
            return new TelevsGameScoreService(TelevsGameScoreService.requestType, false, TelevsGameScoreService.handleRequestAsync);
        }

        static handleRequestAsync(request) {
            return new Promise((resolve, reject) => {
                // @ts-ignore
                const minigameGamePage = window.minigameGamePage;
                if (!minigameGamePage || typeof minigameGamePage.setGameScore !== "function") {
                    reject(generateErrorResponse(request, "MINIGAME_GAME_PAGE_NOT_FOUND", "minigameGamePage is not found"));
                }
                minigameGamePage.setGameScore(request.payload);
                resolve(generateSuccessResponse(request));
            });
        }
    }

    TelevsGameScoreService.requestType = "TelevsGameScoreService";

    let _gamePageUrl = "gamepage.html";
    let _gamePageFrame = "gamepageFrame";
    const minigameCenter = {
        startServiceServer: function () {
            MediationServer.createDefaultInstance();
            MediationServer.instance.start();
        },
        setGamePageUrl: function (gameUrl) {
            _gamePageUrl = gameUrl;
        },
        setGamePageFrame: function (gameFrame) {
            _gamePageFrame = gameFrame;
        },
        loadGamePage: function () {
            loadChildPage(_gamePageUrl, _gamePageFrame);
        },
        onWindowLoad: function () {
            window.removeEventListener("load", minigameCenter.onWindowLoad);
            minigameCenter.startServiceServer();
            // 加载中间层页面
            minigameCenter.loadGamePage();
        },
        registerProgressService: function (requestHandler) {
            // console.info("registerProgressService");
            MediationServer.instance.registerQuickService(MiniGameServiceRequestType.PROGRESS, true, QuickMediationService.createQuickHandler(requestHandler));
        },
        registerInitGameService: function (requestHandler) {
            MediationServer.instance.registerQuickService(MiniGameServiceRequestType.INIT, true, QuickMediationService.createQuickHandler(requestHandler));
        },
        registerStartGameService: function (requestHandler) {
            const handle = (request) => new Promise((resolve, reject) => {
                var _a;
                // todo SDK可以在这里添加一些对游戏startGameAsync后的操作
                console.info("registerStartGameService handle");
                // @ts-ignore
                (_a = window.AdInteractive) === null || _a === void 0 ? void 0 : _a.gameLoaded();
                return requestHandler(request);
            });
            MediationServer.instance.registerQuickService(MiniGameServiceRequestType.START_GAME, true, QuickMediationService.createQuickHandler(handle));
        },
        registerSetGameReadyService: function (requestHandler) {
            const handle = (request) => new Promise((resolve, reject) => {
                // todo SDK可以在这里添加一些对游戏setGameReadyAsync后的操作
                console.info("registerSetGameReadyService handle");
                return requestHandler(request);
            });
            MediationServer.instance.registerQuickService(MiniGameServiceRequestType.SET_GAME_READY, true, QuickMediationService.createQuickHandler(handle));
        },
        // 开启afg服务
        enableAfgService(afgOption, disabled) {
            // initAdivery(afgOption);
            // 注册广告服务
            MediationServer.instance.registerService(AFGAdInstantLoadService.createService());
            MediationServer.instance.registerService(AFGAdInstantShowService.createService());
            // 注册Banner服务
            MediationServer.instance.registerService(BannerShowService.createService());
            MediationServer.instance.registerService(BannerHideService.createService());
            // 注册存储服务
            MediationServer.instance.registerService(StorageInstantSetDataService.createService());
            MediationServer.instance.registerService(StorageInstantGetDataService.createService());
            // 注册Common服务
            MediationServer.instance.registerService(CommonInfoService.createService());
            // 注册分享服务
            MediationServer.instance.registerService(ShareService.createService());
            // 注册支付服务
            MediationServer.instance.registerService(PayInstantCatalogService.createService());
            MediationServer.instance.registerService(PayInstantConsumePurchaseService.createService());
            MediationServer.instance.registerService(PayInstantGetPurchasesService.createService());
            MediationServer.instance.registerService(PayInstantOnReadyService.createService());
            MediationServer.instance.registerService(PayInstantPurchaseService.createService());
            // 注册安卓打点事件
            if (commonInfo.isH5AndroidApp()) {
                MediationServer.instance.registerService(AndroidLogEventService.createService());
            }
            // 事件上报微游中心事件中心服务
            MediationServer.instance.registerService(GameEventReportService.createService());
            // 注册小步赛事服务
            if (commonInfo.isSharpMatch()) {
                MediationServer.instance.registerService(SharpMatchService.createService());
            }
            // 第三方接口服务
            MediationServer.instance.registerService(ExternalService.createService());
            // telegram服务
            MediationServer.instance.registerService(TelevsGameScoreService.createService());
            // 播放开屏广告 暂时关闭，由微游中心控制
            // console.info("show proll ad");
            // AdsContextManager.instance.showProllAsync();
        },
        loadConfigAsync(url) {
            return __awaiter(this, void 0, void 0, function* () {
                // url = formatUrl(url);
                // 加载MinigameAd配置$channel$-realization.json
                try {
                    const minigameAdConfigUrl = url.replace("config", "realization");
                    yield fetchMgConfig.fetchConfigAsync(minigameAdConfigUrl);
                } catch (error) {
                    console.error("load MinigameAd: ", error);
                }
                adsManager.setConfig();
                let configOptions;
                try {
                    configOptions = yield loadMinigameOptionAsync(url);
                } catch (error) {
                    console.error("loadConfigAsync :", error);
                }
                adsManager.setDisableAds(configOptions === null || configOptions === void 0 ? void 0 : configOptions.ads_disabled);
                if (!adsManager.getDisableAds()) {
                    yield adsManager.initScripts(configOptions);
                }
                adsManager.createAdInstants();
                try {
                    commonInfo.init(configOptions);
                    // 初始化数据保存
                    storageHelper.init();
                } catch (error) {
                    console.error("init config error: ", error);
                }
                // 发送游戏id到android
                try {
                    sendGameIdToAndroid(configOptions);
                } catch (error) {
                    console.info("sendGameIdToAndroid error: ", error);
                }
                // 初始化支付
                try {
                    paymentManager.init();
                } catch (error) {
                    console.error("init payments error: ", error);
                }
                console.info("===> configOptions: ", configOptions);
                return configOptions;
            });
        },
        registerLogEvent: function (logFunc) {
            initGaEvent(logFunc);
        },
        receiveCommonData(globalInfo) {
            commonInfo.playPageData = globalInfo;
        },
        version: "1.3.2 b0002"
    };
    // window.addEventListener("load", minigameCenter.onWindowLoad);
    // MediationServer.createDefaultInstance();
    // MediationServer.instance.start();
    console.info("MiniGameCenter SDK version: " + minigameCenter.version);
    // @ts-ignore
    window.minigameCenter = minigameCenter;
    // TODO: 由页面来注册服务

}));
