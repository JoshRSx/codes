/* @preserve
* @esri/arcgis-rest-auth - v3.0.0 - Apache-2.0
* Copyright (c) 2017-2021 Esri, Inc.
* Mon Jan 25 2021 15:22:09 GMT-0700 (Mountain Standard Time)
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@esri/arcgis-rest-request')) :
    typeof define === 'function' && define.amd ? define(['exports', '@esri/arcgis-rest-request'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.arcgisRest = global.arcgisRest || {}, global.arcgisRest));
}(this, (function (exports, arcgisRestRequest) { 'use strict';

    /*! *****************************************************************************
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

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    /* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
     * Apache-2.0 */
    function fetchToken(url, requestOptions) {
        var options = requestOptions;
        // we generate a response, so we can't return the raw response
        options.rawResponse = false;
        return arcgisRestRequest.request(url, options).then(function (response) {
            var r = {
                token: response.access_token,
                username: response.username,
                expires: new Date(
                // convert seconds in response to milliseconds and add the value to the current time to calculate a static expiration timestamp
                Date.now() + (response.expires_in * 1000 - 1000)),
                ssl: response.ssl === true
            };
            if (response.refresh_token) {
                r.refreshToken = response.refresh_token;
            }
            return r;
        });
    }

    /* Copyright (c) 2017-2018 Environmental Systems Research Institute, Inc.
     * Apache-2.0 */
    /**
     * ```js
     * import { ApplicationSession } from '@esri/arcgis-rest-auth';
     * const session = new ApplicationSession({
     *   clientId: "abc123",
     *   clientSecret: "sshhhhhh"
     * })
     * // visit https://developers.arcgis.com to generate your own clientid and secret
     * ```
     * You can use [App Login](/arcgis-rest-js/guides/node/) to access premium content and services in ArcGIS Online.
     *
     */
    var ApplicationSession = /** @class */ (function () {
        function ApplicationSession(options) {
            this.clientId = options.clientId;
            this.clientSecret = options.clientSecret;
            this.token = options.token;
            this.expires = options.expires;
            this.portal = options.portal || "https://www.arcgis.com/sharing/rest";
            this.duration = options.duration || 7200;
        }
        // url isnt actually read or passed through.
        ApplicationSession.prototype.getToken = function (url, requestOptions) {
            if (this.token && this.expires && this.expires.getTime() > Date.now()) {
                return Promise.resolve(this.token);
            }
            if (this._pendingTokenRequest) {
                return this._pendingTokenRequest;
            }
            this._pendingTokenRequest = this.refreshToken(requestOptions);
            return this._pendingTokenRequest;
        };
        ApplicationSession.prototype.refreshToken = function (requestOptions) {
            var _this = this;
            var options = __assign({ params: {
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: "client_credentials",
                    expiration: this.duration
                } }, requestOptions);
            return fetchToken(this.portal + "/oauth2/token/", options).then(function (response) {
                _this._pendingTokenRequest = null;
                _this.token = response.token;
                _this.expires = response.expires;
                return response.token;
            });
        };
        ApplicationSession.prototype.refreshSession = function () {
            var _this = this;
            return this.refreshToken().then(function () { return _this; });
        };
        return ApplicationSession;
    }());

    /* Copyright (c) 2017-2019 Environmental Systems Research Institute, Inc.
     * Apache-2.0 */
    /**
     * ```js
     * import { ApiKey } from '@esri/arcgis-rest-auth';
     * const apiKey = new ApiKey("...");
     * ```
     * Used to authenticate with API Keys.
     */
    var ApiKey = /** @class */ (function () {
        function ApiKey(options) {
            this.key = options.key;
        }
        /**
         * Gets a token (the API Key).
         */
        ApiKey.prototype.getToken = function (url) {
            return Promise.resolve(this.key);
        };
        return ApiKey;
    }());

    /* Copyright (c) 2017-2018 Environmental Systems Research Institute, Inc.
     * Apache-2.0 */
    function generateToken(url, requestOptions) {
        var options = requestOptions;
        /* istanbul ignore else */
        if (typeof window !== "undefined" &&
            window.location &&
            window.location.host) {
            options.params.referer = window.location.host;
        }
        else {
            options.params.referer = arcgisRestRequest.NODEJS_DEFAULT_REFERER_HEADER;
        }
        return arcgisRestRequest.request(url, options);
    }

    /**
     * Used to test if a URL is an ArcGIS Online URL
     */
    var arcgisOnlineUrlRegex = /^https?:\/\/(\S+)\.arcgis\.com.+/;
    function isOnline(url) {
        return arcgisOnlineUrlRegex.test(url);
    }
    function normalizeOnlinePortalUrl(portalUrl) {
        if (!arcgisOnlineUrlRegex.test(portalUrl)) {
            return portalUrl;
        }
        switch (getOnlineEnvironment(portalUrl)) {
            case "dev":
                return "https://devext.arcgis.com/sharing/rest";
            case "qa":
                return "https://qaext.arcgis.com/sharing/rest";
            default:
                return "https://www.arcgis.com/sharing/rest";
        }
    }
    function getOnlineEnvironment(url) {
        if (!arcgisOnlineUrlRegex.test(url)) {
            return null;
        }
        var match = url.match(arcgisOnlineUrlRegex);
        var subdomain = match[1].split(".").pop();
        if (subdomain.includes("dev")) {
            return "dev";
        }
        if (subdomain.includes("qa")) {
            return "qa";
        }
        return "production";
    }
    function isFederated(owningSystemUrl, portalUrl) {
        var normalizedPortalUrl = arcgisRestRequest.cleanUrl(normalizeOnlinePortalUrl(portalUrl)).replace(/https?:\/\//, "");
        var normalizedOwningSystemUrl = arcgisRestRequest.cleanUrl(owningSystemUrl).replace(/https?:\/\//, "");
        return new RegExp(normalizedOwningSystemUrl, "i").test(normalizedPortalUrl);
    }
    function canUseOnlineToken(portalUrl, requestUrl) {
        var portalIsOnline = isOnline(portalUrl);
        var requestIsOnline = isOnline(requestUrl);
        var portalEnv = getOnlineEnvironment(portalUrl);
        var requestEnv = getOnlineEnvironment(requestUrl);
        if (portalIsOnline && requestIsOnline && portalEnv === requestEnv) {
            return true;
        }
        return false;
    }

    /* Copyright (c) 2018-2020 Environmental Systems Research Institute, Inc.
     * Apache-2.0 */
    /**
     * Validates that the user has access to the application
     * and if they user should be presented a "View Only" mode
     *
     * This is only needed/valid for Esri applications that are "licensed"
     * and shipped in ArcGIS Online or ArcGIS Enterprise. Most custom applications
     * should not need or use this.
     *
     * ```js
     * import { validateAppAccess } from '@esri/arcgis-rest-auth';
     *
     * return validateAppAccess('your-token', 'theClientId')
     * .then((result) => {
     *    if (!result.valud) {
     *      // redirect or show some other ui
     *    } else {
     *      if (result.viewOnlyUserTypeApp) {
     *        // use this to inform your app to show a "View Only" mode
     *      }
     *    }
     * })
     * .catch((err) => {
     *  // two possible errors
     *  // invalid clientId: {"error":{"code":400,"messageCode":"GWM_0007","message":"Invalid request","details":[]}}
     *  // invalid token: {"error":{"code":498,"message":"Invalid token.","details":[]}}
     * })
     * ```
     *
     * Note: This is only usable by Esri applications hosted on *arcgis.com, *esri.com or within
     * an ArcGIS Enterprise installation. Custom applications can not use this.
     *
     * @param token platform token
     * @param clientId application client id
     * @param portal Optional
     */
    function validateAppAccess(token, clientId, portal) {
        if (portal === void 0) { portal = "https://www.arcgis.com/sharing/rest"; }
        var url = portal + "/oauth2/validateAppAccess";
        var ro = {
            method: "POST",
            params: {
                f: "json",
                client_id: clientId,
                token: token,
            },
        };
        return arcgisRestRequest.request(url, ro);
    }

    /* Copyright (c) 2017-2019 Environmental Systems Research Institute, Inc.
     * Apache-2.0 */
    function defer() {
        var deferred = {
            promise: null,
            resolve: null,
            reject: null,
        };
        deferred.promise = new Promise(function (resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });
        return deferred;
    }
    /**
     * ```js
     * import { UserSession } from '@esri/arcgis-rest-auth';
     * UserSession.beginOAuth2({
     *   // register an app of your own to create a unique clientId
     *   clientId: "abc123",
     *   redirectUri: 'https://yourapp.com/authenticate.html'
     * })
     *   .then(session)
     * // or
     * new UserSession({
     *   username: "jsmith",
     *   password: "123456"
     * })
     * // or
     * UserSession.deserialize(cache)
     * ```
     * Used to authenticate both ArcGIS Online and ArcGIS Enterprise users. `UserSession` includes helper methods for [OAuth 2.0](/arcgis-rest-js/guides/browser-authentication/) in both browser and server applications.
     */
    var UserSession = /** @class */ (function () {
        function UserSession(options) {
            this.clientId = options.clientId;
            this._refreshToken = options.refreshToken;
            this._refreshTokenExpires = options.refreshTokenExpires;
            this.username = options.username;
            this.password = options.password;
            this._token = options.token;
            this._tokenExpires = options.tokenExpires;
            this.portal = options.portal
                ? arcgisRestRequest.cleanUrl(options.portal)
                : "https://www.arcgis.com/sharing/rest";
            this.ssl = options.ssl;
            this.provider = options.provider || "arcgis";
            this.tokenDuration = options.tokenDuration || 20160;
            this.redirectUri = options.redirectUri;
            this.refreshTokenTTL = options.refreshTokenTTL || 1440;
            this.trustedServers = {};
            // if a non-federated server was passed explicitly, it should be trusted.
            if (options.server) {
                // if the url includes more than '/arcgis/', trim the rest
                var root = this.getServerRootUrl(options.server);
                this.trustedServers[root] = {
                    token: options.token,
                    expires: options.tokenExpires,
                };
            }
            this._pendingTokenRequests = {};
        }
        Object.defineProperty(UserSession.prototype, "token", {
            /**
             * The current ArcGIS Online or ArcGIS Enterprise `token`.
             */
            get: function () {
                return this._token;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(UserSession.prototype, "tokenExpires", {
            /**
             * The expiration time of the current `token`.
             */
            get: function () {
                return this._tokenExpires;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(UserSession.prototype, "refreshToken", {
            /**
             * The current token to ArcGIS Online or ArcGIS Enterprise.
             */
            get: function () {
                return this._refreshToken;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(UserSession.prototype, "refreshTokenExpires", {
            /**
             * The expiration time of the current `refreshToken`.
             */
            get: function () {
                return this._refreshTokenExpires;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Begins a new browser-based OAuth 2.0 sign in. If `options.popup` is `true` the
         * authentication window will open in a new tab/window otherwise the user will
         * be redirected to the authorization page in their current tab/window.
         *
         * @browserOnly
         */
        /* istanbul ignore next */
        UserSession.beginOAuth2 = function (options, win) {
            if (win === void 0) { win = window; }
            var _a = __assign({
                portal: "https://www.arcgis.com/sharing/rest",
                provider: "arcgis",
                duration: 20160,
                popup: true,
                popupWindowFeatures: "height=400,width=600,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes",
                state: options.clientId,
                locale: "",
            }, options), portal = _a.portal, provider = _a.provider, clientId = _a.clientId, duration = _a.duration, redirectUri = _a.redirectUri, popup = _a.popup, popupWindowFeatures = _a.popupWindowFeatures, state = _a.state, locale = _a.locale, params = _a.params;
            var url;
            if (provider === "arcgis") {
                url = portal + "/oauth2/authorize?client_id=" + clientId + "&response_type=token&expiration=" + duration + "&redirect_uri=" + encodeURIComponent(redirectUri) + "&state=" + state + "&locale=" + locale;
            }
            else {
                url = portal + "/oauth2/social/authorize?client_id=" + clientId + "&socialLoginProviderName=" + provider + "&autoAccountCreateForSocial=true&response_type=token&expiration=" + duration + "&redirect_uri=" + encodeURIComponent(redirectUri) + "&state=" + state + "&locale=" + locale;
            }
            // append additional params
            if (params) {
                url = url + "&" + arcgisRestRequest.encodeQueryString(params);
            }
            if (!popup) {
                win.location.href = url;
                return undefined;
            }
            var session = defer();
            win["__ESRI_REST_AUTH_HANDLER_" + clientId] = function (errorString, oauthInfoString) {
                if (errorString) {
                    var error = JSON.parse(errorString);
                    session.reject(new arcgisRestRequest.ArcGISAuthError(error.errorMessage, error.error));
                    return;
                }
                if (oauthInfoString) {
                    var oauthInfo = JSON.parse(oauthInfoString);
                    session.resolve(new UserSession({
                        clientId: clientId,
                        portal: portal,
                        ssl: oauthInfo.ssl,
                        token: oauthInfo.token,
                        tokenExpires: new Date(oauthInfo.expires),
                        username: oauthInfo.username,
                    }));
                }
            };
            win.open(url, "oauth-window", popupWindowFeatures);
            return session.promise;
        };
        /**
         * Completes a browser-based OAuth 2.0  in. If `options.popup` is `true` the user
         * will be returned to the previous window. Otherwise a new `UserSession`
         * will be returned. You must pass the same values for `options.popup` and
         * `options.portal` as you used in `beginOAuth2()`.
         *
         * @browserOnly
         */
        /* istanbul ignore next */
        UserSession.completeOAuth2 = function (options, win) {
            if (win === void 0) { win = window; }
            var _a = __assign({ portal: "https://www.arcgis.com/sharing/rest", popup: true }, options), portal = _a.portal, clientId = _a.clientId, popup = _a.popup;
            function completeSignIn(error, oauthInfo) {
                try {
                    var handlerFn = void 0;
                    var handlerFnName = "__ESRI_REST_AUTH_HANDLER_" + clientId;
                    if (popup) {
                        // Guard b/c IE does not support window.opener
                        if (win.opener) {
                            if (win.opener.parent && win.opener.parent[handlerFnName]) {
                                handlerFn = win.opener.parent[handlerFnName];
                            }
                            else if (win.opener && win.opener[handlerFnName]) {
                                // support pop-out oauth from within an iframe
                                handlerFn = win.opener[handlerFnName];
                            }
                        }
                        else {
                            // IE
                            if (win !== win.parent && win.parent && win.parent[handlerFnName]) {
                                handlerFn = win.parent[handlerFnName];
                            }
                        }
                        // if we have a handler fn, call it and close the window
                        if (handlerFn) {
                            handlerFn(error ? JSON.stringify(error) : undefined, JSON.stringify(oauthInfo));
                            win.close();
                            return undefined;
                        }
                    }
                }
                catch (e) {
                    throw new arcgisRestRequest.ArcGISAuthError("Unable to complete authentication. It's possible you specified popup based oAuth2 but no handler from \"beginOAuth2()\" present. This generally happens because the \"popup\" option differs between \"beginOAuth2()\" and \"completeOAuth2()\".");
                }
                if (error) {
                    throw new arcgisRestRequest.ArcGISAuthError(error.errorMessage, error.error);
                }
                return new UserSession({
                    clientId: clientId,
                    portal: portal,
                    ssl: oauthInfo.ssl,
                    token: oauthInfo.token,
                    tokenExpires: oauthInfo.expires,
                    username: oauthInfo.username,
                });
            }
            var params = arcgisRestRequest.decodeQueryString(win.location.hash);
            if (!params.access_token) {
                var error = void 0;
                var errorMessage = "Unknown error";
                if (params.error) {
                    error = params.error;
                    errorMessage = params.error_description;
                }
                return completeSignIn({ error: error, errorMessage: errorMessage });
            }
            var token = params.access_token;
            var expires = new Date(Date.now() + parseInt(params.expires_in, 10) * 1000 - 60 * 1000);
            var username = params.username;
            var ssl = params.ssl === "true";
            return completeSignIn(undefined, {
                token: token,
                expires: expires,
                ssl: ssl,
                username: username,
            });
        };
        /**
         * Request session information from the parent application
         *
         * When an application is embedded into another application via an IFrame, the embedded app can
         * use `window.postMessage` to request credentials from the host application.
         *
         * @param parentOrigin origin of the parent frame. Passed into the embedded application as `parentOrigin` query param
         * @browserOnly
         */
        UserSession.fromParent = function (parentOrigin, win) {
            /* istanbul ignore next: must pass in a mockwindow for tests so we can't cover the other branch */
            if (!win && window) {
                win = window;
            }
            // Declar handler outside of promise scope so we can detach it
            var handler;
            // return a promise that will resolve when the handler recieves
            // session information from the correct origin
            return new Promise(function (resolve, reject) {
                // create an event handler that just wraps the parentMessageHandler
                handler = function (event) {
                    // ensure we only listen to events from the specified parent
                    // if the origin is not the parent origin, we don't send any response
                    if (event.origin === parentOrigin) {
                        try {
                            return resolve(UserSession.parentMessageHandler(event));
                        }
                        catch (err) {
                            return reject(err);
                        }
                    }
                };
                // add listener
                win.addEventListener("message", handler, false);
                win.parent.postMessage({ type: "arcgis:auth:requestCredential" }, parentOrigin);
            }).then(function (session) {
                win.removeEventListener("message", handler, false);
                return session;
            });
        };
        /**
         * Begins a new server-based OAuth 2.0 sign in. This will redirect the user to
         * the ArcGIS Online or ArcGIS Enterprise authorization page.
         *
         * @nodeOnly
         */
        UserSession.authorize = function (options, response) {
            var _a = __assign({ portal: "https://arcgis.com/sharing/rest", duration: 20160 }, options), portal = _a.portal, clientId = _a.clientId, duration = _a.duration, redirectUri = _a.redirectUri;
            response.writeHead(301, {
                Location: portal + "/oauth2/authorize?client_id=" + clientId + "&duration=" + duration + "&response_type=code&redirect_uri=" + encodeURIComponent(redirectUri),
            });
            response.end();
        };
        /**
         * Completes the server-based OAuth 2.0 sign in process by exchanging the `authorizationCode`
         * for a `access_token`.
         *
         * @nodeOnly
         */
        UserSession.exchangeAuthorizationCode = function (options, authorizationCode) {
            var _a = __assign({
                portal: "https://www.arcgis.com/sharing/rest",
                refreshTokenTTL: 1440,
            }, options), portal = _a.portal, clientId = _a.clientId, redirectUri = _a.redirectUri, refreshTokenTTL = _a.refreshTokenTTL;
            return fetchToken(portal + "/oauth2/token", {
                params: {
                    grant_type: "authorization_code",
                    client_id: clientId,
                    redirect_uri: redirectUri,
                    code: authorizationCode,
                },
            }).then(function (response) {
                return new UserSession({
                    clientId: clientId,
                    portal: portal,
                    ssl: response.ssl,
                    redirectUri: redirectUri,
                    refreshToken: response.refreshToken,
                    refreshTokenTTL: refreshTokenTTL,
                    refreshTokenExpires: new Date(Date.now() + (refreshTokenTTL - 1) * 1000),
                    token: response.token,
                    tokenExpires: response.expires,
                    username: response.username,
                });
            });
        };
        UserSession.deserialize = function (str) {
            var options = JSON.parse(str);
            return new UserSession({
                clientId: options.clientId,
                refreshToken: options.refreshToken,
                refreshTokenExpires: new Date(options.refreshTokenExpires),
                username: options.username,
                password: options.password,
                token: options.token,
                tokenExpires: new Date(options.tokenExpires),
                portal: options.portal,
                ssl: options.ssl,
                tokenDuration: options.tokenDuration,
                redirectUri: options.redirectUri,
                refreshTokenTTL: options.refreshTokenTTL,
            });
        };
        /**
         * Translates authentication from the format used in the [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/).
         *
         * ```js
         * UserSession.fromCredential({
         *   userId: "jsmith",
         *   token: "secret"
         * });
         * ```
         *
         * @returns UserSession
         */
        UserSession.fromCredential = function (credential) {
            return new UserSession({
                portal: credential.server.includes("sharing/rest")
                    ? credential.server
                    : credential.server + "/sharing/rest",
                ssl: credential.ssl,
                token: credential.token,
                username: credential.userId,
                tokenExpires: new Date(credential.expires),
            });
        };
        /**
         * Handle the response from the parent
         * @param event DOM Event
         */
        UserSession.parentMessageHandler = function (event) {
            if (event.data.type === "arcgis:auth:credential") {
                return UserSession.fromCredential(event.data.credential);
            }
            if (event.data.type === "arcgis:auth:rejected") {
                throw new Error(event.data.message);
            }
            else {
                throw new Error("Unknown message type.");
            }
        };
        /**
         * Returns authentication in a format useable in the [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/).
         *
         * ```js
         * esriId.registerToken(session.toCredential());
         * ```
         *
         * @returns ICredential
         */
        UserSession.prototype.toCredential = function () {
            return {
                expires: this.tokenExpires.getTime(),
                server: this.portal,
                ssl: this.ssl,
                token: this.token,
                userId: this.username,
            };
        };
        /**
         * Returns information about the currently logged in [user](https://developers.arcgis.com/rest/users-groups-and-items/user.htm). Subsequent calls will *not* result in additional web traffic.
         *
         * ```js
         * session.getUser()
         *   .then(response => {
         *     console.log(response.role); // "org_admin"
         *   })
         * ```
         *
         * @param requestOptions - Options for the request. NOTE: `rawResponse` is not supported by this operation.
         * @returns A Promise that will resolve with the data from the response.
         */
        UserSession.prototype.getUser = function (requestOptions) {
            var _this = this;
            if (this._pendingUserRequest) {
                return this._pendingUserRequest;
            }
            else if (this._user) {
                return Promise.resolve(this._user);
            }
            else {
                var url = this.portal + "/community/self";
                var options = __assign(__assign({ httpMethod: "GET", authentication: this }, requestOptions), { rawResponse: false });
                this._pendingUserRequest = arcgisRestRequest.request(url, options).then(function (response) {
                    _this._user = response;
                    _this._pendingUserRequest = null;
                    return response;
                });
                return this._pendingUserRequest;
            }
        };
        /**
         * Returns the username for the currently logged in [user](https://developers.arcgis.com/rest/users-groups-and-items/user.htm). Subsequent calls will *not* result in additional web traffic. This is also used internally when a username is required for some requests but is not present in the options.
         *
         *    * ```js
         * session.getUsername()
         *   .then(response => {
         *     console.log(response); // "casey_jones"
         *   })
         * ```
         */
        UserSession.prototype.getUsername = function () {
            if (this.username) {
                return Promise.resolve(this.username);
            }
            else if (this._user) {
                return Promise.resolve(this._user.username);
            }
            else {
                return this.getUser().then(function (user) {
                    return user.username;
                });
            }
        };
        /**
         * Gets an appropriate token for the given URL. If `portal` is ArcGIS Online and
         * the request is to an ArcGIS Online domain `token` will be used. If the request
         * is to the current `portal` the current `token` will also be used. However if
         * the request is to an unknown server we will validate the server with a request
         * to our current `portal`.
         */
        UserSession.prototype.getToken = function (url, requestOptions) {
            if (canUseOnlineToken(this.portal, url)) {
                return this.getFreshToken(requestOptions);
            }
            else if (new RegExp(this.portal, "i").test(url)) {
                return this.getFreshToken(requestOptions);
            }
            else {
                return this.getTokenForServer(url, requestOptions);
            }
        };
        /**
         * Get application access information for the current user
         * see `validateAppAccess` function for details
         *
         * @param clientId application client id
         */
        UserSession.prototype.validateAppAccess = function (clientId) {
            return this.getToken(this.portal).then(function (token) {
                return validateAppAccess(token, clientId);
            });
        };
        UserSession.prototype.toJSON = function () {
            return {
                clientId: this.clientId,
                refreshToken: this.refreshToken,
                refreshTokenExpires: this.refreshTokenExpires,
                username: this.username,
                password: this.password,
                token: this.token,
                tokenExpires: this.tokenExpires,
                portal: this.portal,
                ssl: this.ssl,
                tokenDuration: this.tokenDuration,
                redirectUri: this.redirectUri,
                refreshTokenTTL: this.refreshTokenTTL,
            };
        };
        UserSession.prototype.serialize = function () {
            return JSON.stringify(this);
        };
        /**
         * For a "Host" app that embeds other platform apps via iframes, after authenticating the user
         * and creating a UserSession, the app can then enable "post message" style authentication by calling
         * this method.
         *
         * Internally this adds an event listener on window for the `message` event
         *
         * @param validChildOrigins Array of origins that are allowed to request authentication from the host app
         */
        UserSession.prototype.enablePostMessageAuth = function (validChildOrigins, win) {
            /* istanbul ignore next: must pass in a mockwindow for tests so we can't cover the other branch */
            if (!win && window) {
                win = window;
            }
            this._hostHandler = this.createPostMessageHandler(validChildOrigins);
            win.addEventListener("message", this._hostHandler, false);
        };
        /**
         * For a "Host" app that has embedded other platform apps via iframes, when the host needs
         * to transition routes, it should call `UserSession.disablePostMessageAuth()` to remove
         * the event listener and prevent memory leaks
         */
        UserSession.prototype.disablePostMessageAuth = function (win) {
            /* istanbul ignore next: must pass in a mockwindow for tests so we can't cover the other branch */
            if (!win && window) {
                win = window;
            }
            win.removeEventListener("message", this._hostHandler, false);
        };
        /**
         * Manually refreshes the current `token` and `tokenExpires`.
         */
        UserSession.prototype.refreshSession = function (requestOptions) {
            // make sure subsequent calls to getUser() don't returned cached metadata
            this._user = null;
            if (this.username && this.password) {
                return this.refreshWithUsernameAndPassword(requestOptions);
            }
            if (this.clientId && this.refreshToken) {
                return this.refreshWithRefreshToken();
            }
            return Promise.reject(new arcgisRestRequest.ArcGISAuthError("Unable to refresh token."));
        };
        /**
         * Determines the root of the ArcGIS Server or Portal for a given URL.
         *
         * @param url the URl to determine the root url for.
         */
        UserSession.prototype.getServerRootUrl = function (url) {
            var root = arcgisRestRequest.cleanUrl(url).split(/\/rest(\/admin)?\/services(?:\/|#|\?|$)/)[0];
            var _a = root.match(/(https?:\/\/)(.+)/), match = _a[0], protocol = _a[1], domainAndPath = _a[2];
            var _b = domainAndPath.split("/"), domain = _b[0], path = _b.slice(1);
            // only the domain is lowercased becasue in some cases an org id might be
            // in the path which cannot be lowercased.
            return "" + protocol + domain.toLowerCase() + "/" + path.join("/");
        };
        /**
         * Return a function that closes over the validOrigins array and
         * can be used as an event handler for the `message` event
         *
         * @param validOrigins Array of valid origins
         */
        UserSession.prototype.createPostMessageHandler = function (validOrigins) {
            var _this = this;
            // return a function that closes over the validOrigins and
            // has access to the credential
            return function (event) {
                // Note: do not use regex's here. validOrigins is an array so we're checking that the event's origin
                // is in the array via exact match. More info about avoiding postMessave xss issues here
                // https://jlajara.gitlab.io/web/2020/07/17/Dom_XSS_PostMessage_2.html#tipsbypasses-in-postmessage-vulnerabilities
                if (validOrigins.indexOf(event.origin) > -1) {
                    var credential = _this.toCredential();
                    event.source.postMessage({ type: "arcgis:auth:credential", credential: credential }, event.origin);
                }
                else {
                    event.source.postMessage({
                        type: "arcgis:auth:rejected",
                        message: "Rejected authentication request.",
                    }, event.origin);
                }
            };
        };
        /**
         * Validates that a given URL is properly federated with our current `portal`.
         * Attempts to use the internal `trustedServers` cache first.
         */
        UserSession.prototype.getTokenForServer = function (url, requestOptions) {
            var _this = this;
            // requests to /rest/services/ and /rest/admin/services/ are both valid
            // Federated servers may have inconsistent casing, so lowerCase it
            var root = this.getServerRootUrl(url);
            var existingToken = this.trustedServers[root];
            if (existingToken &&
                existingToken.expires &&
                existingToken.expires.getTime() > Date.now()) {
                return Promise.resolve(existingToken.token);
            }
            if (this._pendingTokenRequests[root]) {
                return this._pendingTokenRequests[root];
            }
            this._pendingTokenRequests[root] = arcgisRestRequest.request(root + "/rest/info")
                .then(function (response) {
                if (response.owningSystemUrl) {
                    /**
                     * if this server is not owned by this portal
                     * bail out with an error since we know we wont
                     * be able to generate a token
                     */
                    if (!isFederated(response.owningSystemUrl, _this.portal)) {
                        throw new arcgisRestRequest.ArcGISAuthError(url + " is not federated with " + _this.portal + ".", "NOT_FEDERATED");
                    }
                    else {
                        /**
                         * if the server is federated, use the relevant token endpoint.
                         */
                        return arcgisRestRequest.request(response.owningSystemUrl + "/sharing/rest/info", requestOptions);
                    }
                }
                else if (response.authInfo &&
                    _this.trustedServers[root] !== undefined) {
                    /**
                     * if its a stand-alone instance of ArcGIS Server that doesn't advertise
                     * federation, but the root server url is recognized, use its built in token endpoint.
                     */
                    return Promise.resolve({ authInfo: response.authInfo });
                }
                else {
                    throw new arcgisRestRequest.ArcGISAuthError(url + " is not federated with any portal and is not explicitly trusted.", "NOT_FEDERATED");
                }
            })
                .then(function (response) {
                return response.authInfo.tokenServicesUrl;
            })
                .then(function (tokenServicesUrl) {
                // an expired token cant be used to generate a new token
                if (_this.token && _this.tokenExpires.getTime() > Date.now()) {
                    return generateToken(tokenServicesUrl, {
                        params: {
                            token: _this.token,
                            serverUrl: url,
                            expiration: _this.tokenDuration,
                            client: "referer",
                        },
                    });
                    // generate an entirely fresh token if necessary
                }
                else {
                    return generateToken(tokenServicesUrl, {
                        params: {
                            username: _this.username,
                            password: _this.password,
                            expiration: _this.tokenDuration,
                            client: "referer",
                        },
                    }).then(function (response) {
                        _this._token = response.token;
                        _this._tokenExpires = new Date(response.expires);
                        return response;
                    });
                }
            })
                .then(function (response) {
                _this.trustedServers[root] = {
                    expires: new Date(response.expires),
                    token: response.token,
                };
                delete _this._pendingTokenRequests[root];
                return response.token;
            });
            return this._pendingTokenRequests[root];
        };
        /**
         * Returns an unexpired token for the current `portal`.
         */
        UserSession.prototype.getFreshToken = function (requestOptions) {
            var _this = this;
            if (this.token && !this.tokenExpires) {
                return Promise.resolve(this.token);
            }
            if (this.token &&
                this.tokenExpires &&
                this.tokenExpires.getTime() > Date.now()) {
                return Promise.resolve(this.token);
            }
            if (!this._pendingTokenRequests[this.portal]) {
                this._pendingTokenRequests[this.portal] = this.refreshSession(requestOptions).then(function (session) {
                    _this._pendingTokenRequests[_this.portal] = null;
                    return session.token;
                });
            }
            return this._pendingTokenRequests[this.portal];
        };
        /**
         * Refreshes the current `token` and `tokenExpires` with `username` and
         * `password`.
         */
        UserSession.prototype.refreshWithUsernameAndPassword = function (requestOptions) {
            var _this = this;
            var options = __assign({ params: {
                    username: this.username,
                    password: this.password,
                    expiration: this.tokenDuration,
                } }, requestOptions);
            return generateToken(this.portal + "/generateToken", options).then(function (response) {
                _this._token = response.token;
                _this._tokenExpires = new Date(response.expires);
                return _this;
            });
        };
        /**
         * Refreshes the current `token` and `tokenExpires` with `refreshToken`.
         */
        UserSession.prototype.refreshWithRefreshToken = function (requestOptions) {
            var _this = this;
            if (this.refreshToken &&
                this.refreshTokenExpires &&
                this.refreshTokenExpires.getTime() < Date.now()) {
                return this.refreshRefreshToken(requestOptions);
            }
            var options = __assign({ params: {
                    client_id: this.clientId,
                    refresh_token: this.refreshToken,
                    grant_type: "refresh_token",
                } }, requestOptions);
            return fetchToken(this.portal + "/oauth2/token", options).then(function (response) {
                _this._token = response.token;
                _this._tokenExpires = response.expires;
                return _this;
            });
        };
        /**
         * Exchanges an unexpired `refreshToken` for a new one, also updates `token` and
         * `tokenExpires`.
         */
        UserSession.prototype.refreshRefreshToken = function (requestOptions) {
            var _this = this;
            var options = __assign({ params: {
                    client_id: this.clientId,
                    refresh_token: this.refreshToken,
                    redirect_uri: this.redirectUri,
                    grant_type: "exchange_refresh_token",
                } }, requestOptions);
            return fetchToken(this.portal + "/oauth2/token", options).then(function (response) {
                _this._token = response.token;
                _this._tokenExpires = response.expires;
                _this._refreshToken = response.refreshToken;
                _this._refreshTokenExpires = new Date(Date.now() + (_this.refreshTokenTTL - 1) * 60 * 1000);
                return _this;
            });
        };
        return UserSession;
    }());

    /* Copyright (c) 2018-2020 Environmental Systems Research Institute, Inc.
     * Apache-2.0 */
    /**
     * Request app-specific token, passing in the token for the current app.
     *
     * This call returns a token after performing the same checks made by validateAppAccess.
     * It returns an app-specific token of the signed-in user only if the user has access
     * to the app and the encrypted platform cookie is valid.
     *
     * A scenario where an app would use this is if it is iframed into another platform app
     * and recieves credentials via postMessage. Those credentials contain a token that is
     * specific to the host app, so the embedded app would use `exchangeToken` to get one
     * that is specific to itself.
     *
     * Note: This is only usable by Esri applications hosted on *arcgis.com, *esri.com or within
     * an ArcGIS Enterprise installation. Custom applications can not use this.
     *
     * @param token
     * @param clientId application
     * @param portal
     */
    function exchangeToken(token, clientId, portal) {
        if (portal === void 0) { portal = "https://www.arcgis.com/sharing/rest"; }
        var url = portal + "/oauth2/exchangeToken";
        var ro = {
            method: "POST",
            params: {
                f: "json",
                client_id: clientId,
                token: token,
            },
        };
        // make the request and return the token
        return arcgisRestRequest.request(url, ro).then(function (response) { return response.token; });
    }
    /**
     * Request a token for a specific application using the esri_aopc encrypted cookie
     *
     * When a client app boots up, it will know it's clientId and the redirectUri for use
     * in the normal /oauth/authorize pop-out oAuth flow.
     *
     * If the app sees an `esri_aopc` cookie (only set if the app is hosted on *.arcgis.com),
     * it can call the /oauth2/platformSelf end-point passing in the clientId and redirectUri
     * in headers, and it will recieve back an app-specific token, assuming the user has
     * access to the app.
     *
     * Since there are scenarios where an app can boot using credintials/token from localstorage
     * but those creds are not for the same user as the esri_aopc cookie, it is recommended that
     * an app check the returned username against any existing identity they may have loaded.
     *
     * Note: This is only usable by Esri applications hosted on *arcgis.com, *esri.com or within
     * an ArcGIS Enterprise installation. Custom applications can not use this.
     *
     * ```js
     * // convert the encrypted platform cookie into a UserSession
     * import { platformSelf, UserSession } from '@esri/arcgis-rest-auth';
     *
     * const portal = 'https://www.arcgis.com/sharing/rest';
     * const clientId = 'YOURAPPCLIENID';
     *
     * // exchange esri_aopc cookie
     * return platformSelf(clientId, 'https://your-app-redirect-uri', portal)
     * .then((response) => {
     *  const currentTimestamp = new Date().getTime();
     *  const tokenExpiresTimestamp = currentTimestamp + (response.expires_in * 1000);
     *  // Construct the session and return it
     *  return new UserSession({
     *    portal,
     *    clientId,
     *    username: response.username,
     *    token: response.token,
     *    tokenExpires: new Date(tokenExiresTimestamp),
     *    ssl: true
     *  });
     * })
     *
     * ```
     *
     *
     * @param clientId
     * @param redirectUri
     * @param portal
     */
    function platformSelf(clientId, redirectUri, portal) {
        if (portal === void 0) { portal = "https://www.arcgis.com/sharing/rest"; }
        // TEMPORARY: the f=json should not be needed, but currently is
        var url = portal + "/oauth2/platformSelf?f=json";
        var ro = {
            method: "POST",
            headers: {
                "X-Esri-Auth-Client-Id": clientId,
                "X-Esri-Auth-Redirect-Uri": redirectUri,
            },
            // Note: request has logic to include the cookie
            // for platformSelf calls w/ the X-Esri-Auth-Client-Id header
            params: {
                f: "json",
            },
        };
        // make the request and return the token
        return arcgisRestRequest.request(url, ro);
    }

    exports.ApiKey = ApiKey;
    exports.ApplicationSession = ApplicationSession;
    exports.UserSession = UserSession;
    exports.exchangeToken = exchangeToken;
    exports.fetchToken = fetchToken;
    exports.generateToken = generateToken;
    exports.platformSelf = platformSelf;
    exports.validateAppAccess = validateAppAccess;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=auth.umd.js.map
