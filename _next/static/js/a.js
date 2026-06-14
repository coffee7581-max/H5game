class a {
    static getInstance() {
        return a.instance || (a.instance = new a({ game: null })), a.instance;
    }

    initGame() {
        (window.channelName = this.channelName),
            (window.subChannelName = this.subChannelName),
            (window.globalPlatformInfo = this.globalPlatformInfo),
            (this.ifExecEnterGameFunc = !1),
            this.initGameFunc();
    }

    setProgress(e) {
        if ((this.progressFunc(e), 100 === e)) {
            let e = document.getElementById(this.iframeFrameDiv);
            e && ((e.style.zIndex = "1"), (e.style.opacity = "1"));
            let t = document.getElementById(this.actionEnlargeId);
            t && (t.style.display = "block"), this.enterGameFunc();
        }
    }

    registerGamingServices() {
        let e = window.minigameCenter;
        if (e) {
            var t, n, l, r;
            null == e ||
            null === (t = e.receiveCommonData) ||
            void 0 === t ||
            t.call(e, this.globalPlatformInfo),
            null == e ||
            null === (n = e.registerProgressService) ||
            void 0 === n ||
            n.call(e, (e) => {
                this.setProgress(e.progress);
            }),
            null == e ||
            null === (l = e.registerInitGameService) ||
            void 0 === l ||
            l.call(e, (e) => {
                this.initGameSdkFunc();
            }),
            null == e ||
            null === (r = e.registerStartGameService) ||
            void 0 === r ||
            r.call(e, (e) => {
                this.setProgress(100),
                    this.enterGameFunc();
            });
        }
    }

    async loadGameOptionAndInitAsync(e) {
        let t = window.minigameCenter;
        if (!t.loadConfigAsync) return Promise.reject();
        {
            let i = (await t.loadConfigAsync(e)).afg;
            if (i) {
                var n;
                null == t ||
                null === (n = t.enableAfgService) ||
                void 0 === n ||
                n.call(t, i, !1);
            }
            return Promise.resolve();
        }
    }

    loadGame() {
        let e = document.getElementById(this.iframeFrameDiv);
        if (e) {
            let s = e.querySelector("#".concat(this.iframeFrameId)),
                o = window.minigameCenter;
            if (s && o) {
                var t, n, i, r, a;
                if (
                    window.navigator.userAgent.match(
                        /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|Symbian|Windows Phone)/i
                    )
                ) {
                    let e = Math.min(
                        null !==
                        (a =
                            null == s
                                ? void 0
                                : null === (r = s.getBoundingClientRect()) || void 0 === r
                                ? void 0
                                : r.height) && void 0 !== a
                            ? a
                            : window.innerHeight,
                        window.innerHeight
                    );
                    s.setAttribute("height", "".concat(e, "px"));
                }
                null == o ||
                null === (t = o.setGamePageUrl) ||
                void 0 === t ||
                t.call(o, this.gamePageUrl),
                null == o ||
                null === (n = o.setGamePageFrame) ||
                void 0 === n ||
                n.call(o, this.iframeFrameId),
                null == o ||
                null === (i = o.loadGamePage) ||
                void 0 === i ||
                i.call(o);
            }
        }
    }

    async gamecenterSdkLoadFunc() {
        try {
            this.initGame();
            let i = window.minigameCenter;
            if (i) {
                var e, t, n;

                null == i ||
                null === (e = i.startServiceServer) ||
                void 0 === e ||
                e.call(i),
                    this.registerGamingServices(),
                    await this.loadGameOptionAndInitAsync(
                        null !==
                        (n =
                            null === (t = this.game.base) || void 0 === t
                                ? void 0
                                : t.config) && void 0 !== n
                            ? n
                            : ""
                    ),
                    this.loadGame();
            }
        } catch (e) {
            console.warn(e);
        }
    }

    constructor({
                    iframeFrameDiv: e = "playIframeDiv",
                    iframeFrameId: t = "playIframe",
                    actionEnlargeId: n = "enlarge",
                    game: i,
                    initGameFunc: l,
                    initGameSdkFunc: a,
                    progressFunc: s,
                    enterGameFunc: o,
                    gamePageUrl: c,
                }) {
        (this.game = null),
            (this.setGameFunc = (e, t) => {
                (this.game = e), this.setGamePageUrlFunc(t, e);
            }),
            (this.gamePageUrl = ""),
            (this.setGamePageUrlFunc = (e, t) => {
                if (e) this.gamePageUrl = e;
                else {
                    var n;
                    this.gamePageUrl =
                        (t &&
                            (null === (n = t.base) || void 0 === n
                                ? void 0
                                : n.app_url)) ||
                        "";
                }
            }),
            (this.setIframeFrameDivFunc = (e) => {
                this.iframeFrameDiv = e;
            }),
            (this.setIframeFrameIdFunc = (e) => {
                this.iframeFrameId = e;
            }),
            (this.setActionEnlargeIdFunc = (e) => {
                this.actionEnlargeId = e;
            }),
            (this.channelName = "minigame"),
            (this.subChannelName = "main"),
            (this.globalPlatformInfo = {
                channelName: "minigame",
                subChannelName: "main",
            }),
            (this.initGameFunc = () => {}),
            (this.setInitGameFunc = (e) => {
                this.initGameFunc = e;
            }),
            (this.initGameSdkFunc = () => {}),
            (this.setInitGameSdkFunc = (e) => {
                this.initGameSdkFunc = e;
            }),
            (this.progressFunc = (e) => {}),
            (this.setProgressFunc = (e) => {
                this.progressFunc = e;
            }),
            (this.ifExecEnterGameFunc = !1),
            (this.enterGameFunc = () => {}),
            (this.setEnterGameFunc = (e) => {
                this.enterGameFunc = () => {
                    this.ifExecEnterGameFunc ||
                    (e(), (this.ifExecEnterGameFunc = !0));
                };
            }),
            (this.game = i),
            (this.iframeFrameDiv = e),
            (this.iframeFrameId = t),
            (this.actionEnlargeId = n),
        "function" == typeof l && (this.initGameFunc = l),
        "function" == typeof a && (this.initGameSdkFunc = a),
        "function" == typeof s && (this.progressFunc = s),
        "function" == typeof o &&
        (this.enterGameFunc = () => {
            this.ifExecEnterGameFunc ||
            (o(), (this.ifExecEnterGameFunc = !0));
        }),
            this.setGamePageUrlFunc(c, this.game);
    }
}