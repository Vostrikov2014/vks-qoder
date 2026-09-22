/* global __dirname */

const CircularDependencyPlugin = require('circular-dependency-plugin');
const fs = require('fs');
const { join, resolve } = require('path');
const process = require('process');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

/**
 * Signalling backends the dev server proxies to in the LOCAL contour.
 *
 * There is no jitsi-web container here: webpack-dev-server serves the UI itself (see
 * renderSsi below) and forwards the XMPP/Colibri signalling straight to the backends that
 * docker-compose.dev.yml publishes on the host — Prosody on :5280 (BOSH + XMPP WebSocket)
 * and the JVB colibri-ws on :9091 (the JVB's own 9090, remapped because Prometheus owns
 * 9090 on the host). Override either to test against another deployment, e.g.
 * WEBPACK_DEV_SERVER_PROSODY_TARGET=https://meet.example.com:5280 make dev
 */
const prosodyProxyTarget
    = process.env.WEBPACK_DEV_SERVER_PROSODY_TARGET || 'http://localhost:5280';
const jvbProxyTarget
    = process.env.WEBPACK_DEV_SERVER_JVB_TARGET || 'http://localhost:9091';

/**
 * Paths that carry the XMPP/Colibri signalling and therefore must reach the proxies
 * above instead of being answered by the local SPA/static handling.
 */
const SIGNALING_PATHS = [ '/http-bind', '/xmpp-websocket', '/colibri-ws' ];

/**
 * Socket teardown codes seen when one side of a proxied signalling session disappears
 * mid-write: the browser tab closes (or live-reloads) around the moment the upstream XMPP/
 * Colibri session ends, so the remaining socket writes into the void.
 */
const SOCKET_TEARDOWN_CODES = [ 'EPIPE', 'ECONNRESET', 'ERR_STREAM_WRITE_AFTER_END' ];

/**
 * Log lines http-proxy(-middleware) prints for such teardowns, which cannot be turned off
 * per proxy: the HPM logger is a process-wide singleton and `logError` subscribes to the
 * proxy `error` event unconditionally.
 *
 *   [HPM] Error occurred while proxying request localhost:8000/xmpp-websocket?... [EPIPE]
 *   [HPM] WebSocket error: Error [ERR_STREAM_WRITE_AFTER_END]: write after end
 *   [HPM] ECONNRESET: Error: read ECONNRESET
 *
 * The session is already gone at that point, so exactly those lines are dropped from the
 * dev server output; proxy creation info and unrelated failures stay visible.
 */
const SOCKET_TEARDOWN_LOG_PATTERN
    = new RegExp(`\\[HPM\\][^\\n]*(?:\\[(?:${SOCKET_TEARDOWN_CODES.join('|')})\\]|ECONNRESET:)`);

/**
 * Log provider for the signalling proxies: forwards everything to the default console
 * provider except the teardown noise matched above.
 */
const quietHpmLogProvider = defaultProvider => {
    return {
        ...defaultProvider,
        error: (...args) => {
            if (!SOCKET_TEARDOWN_LOG_PATTERN.test(String(args[0]))) {
                defaultProvider.error(...args);
            }
        }
    };
};

/**
 * Error handler for the signalling WebSocket proxies.
 *
 * Errors that slip past the provider filter must not be answered the way the default
 * http-proxy-middleware handler does: it tries to write an HTTP response onto the upgraded
 * socket (`res.end`), which only produces a second, bogus ERR_STREAM_WRITE_AFTER_END and
 * ends up as garbage bytes in the WebSocket stream. Keep unexpected codes loud instead and
 * close the dead session socket. (The "to undefined" target in HPM's diagnostics is by
 * design: it passes no target on the ws error path, see logError.)
 *
 * @param {Error} err - The error reported by http-proxy for the proxied socket.
 * @param {Object} _req - The upgrade request that opened the session.
 * @param {Duplex} socket - The browser-side socket of the failed session.
 */
function onSignallingProxyError(err, _req, socket) {
    if (!SOCKET_TEARDOWN_CODES.includes(err.code)) {
        console.warn(`[webpack-dev-server] signalling proxy error: ${err.message}`);
    }

    // The handshake can never complete now; do not leave the browser waiting for it.
    if (socket?.destroy && !socket.destroyed) {
        socket.destroy();
    }
}

/**
 * Build a Performance configuration object for the given size.
 * See: https://webpack.js.org/configuration/performance/
 *
 * @param {Object} options - options for the bundles configuration.
 * @param {boolean} options.analyzeBundle - whether the bundle needs to be analyzed for size.
 * @param {boolean} options.isProduction - whether this is a production build or not.
 * @param {number} size - the size limit to apply.
 * @returns {Object} a performance hints object.
 */
function getPerformanceHints(options, size) {
    const { analyzeBundle, isProduction } = options;

    return {
        hints: isProduction && !analyzeBundle ? 'error' : false,
        maxAssetSize: size,
        maxEntrypointSize: size
    };
}

/**
 * Build a BundleAnalyzerPlugin plugin instance for the given bundle name.
 *
 * @param {boolean} analyzeBundle - whether the bundle needs to be analyzed for size.
 * @param {string} name - the name of the bundle.
 * @returns {Array} a configured list of plugins.
 */
function getBundleAnalyzerPlugin(analyzeBundle, name) {
    if (!analyzeBundle) {
        return [];
    }

    return [ new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        generateStatsFile: true,
        statsFilename: `${name}-stats.json`
    }) ];
}

/**
 * Minimal SSI renderer for the dev server.
 *
 * index.html and config.js ship with nginx SSI directives (`<!--#include virtual="..."
 * -->` and `<!--# echo var="..." -->`). The production contour resolves them inside the
 * jitsi-web container (nginx `ssi on`); the local contour has no such container, so the
 * dev server resolves them here before serving the document.
 *
 * @param {string} relPath - Path of the file to render, relative to the jitsi-meet root.
 * @param {number} depth - Recursion guard for nested includes.
 * @returns {string} The file contents with the SSI directives resolved.
 */
function renderSsi(relPath, depth = 0) {
    // Guard against a self-referencing include blowing the stack.
    if (depth > 8) {
        return '';
    }

    let content = fs.readFileSync(join(__dirname, relPath), 'utf8');

    // Inline <!--#include virtual="PATH" --> recursively. A leading '/' is web-root
    // relative, i.e. the jitsi-meet directory here.
    content = content.replace(
        /<!--#\s*include\s+virtual="([^"]+)"\s*-->/g,
        (_match, include) => {
            let includePath = include.split('?')[0];

            if (includePath.startsWith('/')) {
                includePath = includePath.substring(1);
            }

            try {
                return renderSsi(includePath, depth + 1);
            } catch {
                // A missing optional include must not break the whole document.
                return '';
            }
        });

    // config.js derives bosh/websocket from `subdir`; nginx sets it to '/' at the root
    // (an empty value would glue host and path into `//hosthttp-bind`).
    content = content.replace(/<!--#\s*echo\s+var="subdir"[^>]*-->/g, '/');
    content = content.replace(/<!--#\s*echo\s+var="subdomain"[^>]*-->/g, '');

    return content;
}

/**
 * The base Webpack configuration to bundle the JavaScript artifacts of
 * jitsi-meet such as app.bundle.js and external_api.js.
 *
 * @param {Object} options - options for the bundles configuration.
 * @param {boolean} options.detectCircularDeps - whether to detect circular dependencies or not.
 * @param {boolean} options.isProduction - whether this is a production build or not.
 * @returns {Object} the base config object.
 */
function getConfig(options = {}) {
    const { detectCircularDeps, isProduction } = options;

    return {
        devtool: isProduction ? 'source-map' : 'eval-source-map',
        mode: isProduction ? 'production' : 'development',
        module: {
            rules: [ {
                // Transpile ES2015 (aka ES6) to ES5. Accept the JSX syntax by React
                // as well.

                loader: 'babel-loader',
                options: {
                    // Avoid loading babel.config.js, since we only use it for React Native.
                    configFile: false,

                    presets: [
                        [
                            require.resolve('@babel/preset-env'),

                            // Tell babel to avoid compiling imports into CommonJS
                            // so that webpack may do tree shaking.
                            {
                                modules: false,

                                // Specify our target browsers so no transpiling is
                                // done unnecessarily. For browsers not specified
                                // here, the ES2015+ profile will be used.
                                targets: {
                                    chrome: 80,
                                    electron: 10,
                                    firefox: 68,
                                    safari: 14
                                },

                                // Consider stage 3 proposals which are implemented by some browsers already.
                                shippedProposals: true,

                                // Detect usage of modern JavaScript features and automatically polyfill them
                                // with core-js.
                                useBuiltIns: 'usage',

                                // core-js version to use, must be in sync with the version in package.json.
                                corejs: '3.40'
                            }
                        ],
                        require.resolve('@babel/preset-react')
                    ]
                },
                test: /\.(j|t)sx?$/,
                exclude: /node_modules/
            }, {
                // Emit woff2 fonts to excalidraw/fonts/ preserving the subdirectory
                // structure so they land at the same path that deploy-excalidraw copies
                // them to (libs/excalidraw/fonts/...) and CSS @font-face URLs resolve.
                test: /\.woff2$/,
                type: 'asset/resource',
                generator: {
                    filename: pathData => {
                        const match = pathData.filename?.match(/\/fonts\/(.*)/);

                        return match ? `excalidraw/fonts/${match[1]}` : 'excalidraw/fonts/[name][ext]';
                    }
                }
            }, {
                // Allow CSS to be imported into JavaScript.

                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }, {
                // Import SVG as raw text when using ?raw query parameter.
                test: /\.svg$/,
                resourceQuery: /raw/,
                type: 'asset/source'
            }, {
                // Import SVG as React component (default).
                test: /\.svg$/,
                resourceQuery: { not: [ /raw/ ] },
                use: [ {
                    loader: '@svgr/webpack',
                    options: {
                        dimensions: false,
                        expandProps: 'start'
                    }
                } ]
            }, {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
                options: {
                    configFile: 'tsconfig.web.json',
                    transpileOnly: !isProduction // Skip type checking for dev builds.,
                }
            } ]
        },
        node: {
            // Allow the use of the real filename of the module being executed. By
            // default Webpack does not leak path-related information and provides a
            // value that is a mock (/index.js).
            __filename: true
        },
        optimization: {
            concatenateModules: isProduction,
            minimize: isProduction
        },
        output: {
            filename: `[name]${isProduction ? '.min' : ''}.js`,
            chunkFilename: `chunks/[id]${isProduction ? '.min' : ''}.js`,
            path: `${__dirname}/build`,
            publicPath: isProduction ? 'auto' : '/libs/',
            sourceMapFilename: '[file].map'
        },
        plugins: [
            detectCircularDeps
                && new CircularDependencyPlugin({
                    allowAsyncCycles: false,
                    exclude: /node_modules/,
                    failOnError: false
                })
        ].filter(Boolean),
        resolve: {
            alias: {
                'focus-visible': 'focus-visible/dist/focus-visible.min.js',
                '@giphy/js-analytics': resolve(__dirname, 'giphy-analytics-stub.js'),
                'react': resolve(__dirname, 'node_modules/react'),
                'react-dom': resolve(__dirname, 'node_modules/react-dom'),
                'roughjs/bin/rough': 'roughjs/bin/rough.js',
                'roughjs/bin/generator': 'roughjs/bin/generator.js',
                'roughjs/bin/math': 'roughjs/bin/math.js'
            },
            aliasFields: [
                'browser'
            ],
            extensions: [
                '.web.js',
                '.web.ts',
                '.web.tsx',

                // Typescript:
                '.tsx',
                '.ts',

                // Webpack defaults:
                '.js',
                '.json'
            ],
            fallback: {
                // Provide some empty Node modules (required by AtlasKit, olm).
                crypto: false,
                fs: false,
                path: false,
                process: false
            }
        }
    };
}

/**
 * Helper function to build the dev server config. It's necessary to split it in
 * Webpack 5 because only one devServer entry is supported, so we attach it to
 * the main bundle.
 *

 * @returns {Object} the dev server configuration.
 */
function getDevServerConfig() {
    return {
        client: {
            overlay: {
                errors: true,
                warnings: false
            }
        },
        allowedHosts: 'all',

        // Set WEBPACK_DEV_SERVER_HOST=0.0.0.0 to reach the dev server from a second
        // machine or a phone; the room URL then has to carry the same address, e.g.
        // JITSI_DOMAIN=192.168.1.10:8000.
        host: process.env.WEBPACK_DEV_SERVER_HOST || 'localhost',
        hot: true,
        port: 8000,

        // Signalling is proxied straight to the local backends (there is no jitsi-web
        // container in the local contour). XMPP over WebSocket and colibri-ws are upgrade
        // requests, hence ws: true; their session teardown races are handled by
        // quietHpmLogProvider and onSignallingProxyError above. The provider is set on all
        // three proxies for determinism: HPM applies it to its process-wide singleton, so
        // whichever proxy is created last would otherwise win with webpack-dev-server's own.
        proxy: [
            {
                // BOSH (XMPP over HTTP long polling).
                context: [ '/http-bind' ],
                target: prosodyProxyTarget,
                secure: false,
                changeOrigin: true,
                logProvider: quietHpmLogProvider
            },
            {
                // XMPP over WebSocket.
                context: [ '/xmpp-websocket' ],
                target: prosodyProxyTarget,
                ws: true,
                secure: false,
                changeOrigin: true,
                logProvider: quietHpmLogProvider,
                on: { error: onSignallingProxyError }
            },
            {
                // Colibri WebSocket: browser <-> Videobridge media signalling.
                context: [ '/colibri-ws' ],
                target: jvbProxyTarget,
                ws: true,
                secure: false,
                changeOrigin: true,
                logProvider: quietHpmLogProvider,
                on: { error: onSignallingProxyError }
            }
        ],
        server: 'http',

        // Serve the SPA entry (index.html with SSI resolved) for HTML navigation routes;
        // let webpack/static serve real assets and the proxies above own the signalling.
        setupMiddlewares: (middlewares, _devServer) => {
            const served = middlewares.filter(m => m.name !== 'cross-origin-header-check');

            served.unshift((req, res, next) => {
                if (req.method !== 'GET') {
                    return next();
                }

                const urlPath = (req.url || '/').split('?')[0];

                // The proxies own the signalling paths.
                if (SIGNALING_PATHS.some(p => urlPath.startsWith(p))) {
                    return next();
                }

                const sendHtml = file => {
                    try {
                        res.setHeader('Content-Type', 'text/html; charset=utf-8');
                        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                        res.end(renderSsi(file));
                    } catch {
                        next();
                    }
                };

                // Document root and the SPA entry itself are always rendered.
                if (urlPath === '/' || urlPath === '/index.html') {
                    return sendHtml('index.html');
                }

                // In dev the bundle is built to memory as /libs/<name>.js (no .min), while
                // index.html references the .min.js name; rewrite it when the minified file
                // is not on disk so webpack-dev-middleware serves the in-memory bundle.
                if (urlPath.startsWith('/libs/') && urlPath.endsWith('.min.js')
                        && !fs.existsSync(join(__dirname, urlPath))) {
                    req.url = req.url.replace('.min.js', '.js');

                    return next();
                }

                const lastSegment = urlPath.substring(urlPath.lastIndexOf('/') + 1);

                // A path with an extension is a real asset (css/js/images/wasm) or a
                // concrete .html file under static/ -> let webpack/static serve it.
                if (lastSegment.includes('.')) {
                    if (lastSegment.endsWith('.html')
                            && fs.existsSync(join(__dirname, urlPath.replace(/^\//, '')))) {
                        return sendHtml(urlPath.replace(/^\//, ''));
                    }

                    return next();
                }

                // No extension: a room name / SPA route. Answer HTML navigations with the
                // entry document; anything else (e.g. the HMR socket path) falls through.
                if ((req.headers.accept || '').includes('text/html')) {
                    return sendHtml('index.html');
                }

                return next();
            });

            return served;
        },
        static: {
            directory: process.cwd(),
            watch: {
                ignored: file => file.endsWith('.log')
            }
        }
    };
}

module.exports = (_env, argv) => {
    const analyzeBundle = Boolean(process.env.ANALYZE_BUNDLE);
    const mode = typeof argv.mode === 'undefined' ? 'production' : argv.mode;
    const isProduction = mode === 'production';
    const configOptions = {
        detectCircularDeps: Boolean(process.env.DETECT_CIRCULAR_DEPS),
        isProduction
    };
    const config = getConfig(configOptions);
    const perfHintOptions = {
        analyzeBundle,
        isProduction
    };

    return [
        { ...config,
            entry: {
                'app.bundle': './app.js'
            },
            devServer: isProduction ? {} : getDevServerConfig(),
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'app'),
                new webpack.DefinePlugin({
                    '__DEV__': !isProduction
                }),
                new webpack.IgnorePlugin({
                    resourceRegExp: /^canvas$/,
                    contextRegExp: /resemblejs$/
                }),
                new webpack.IgnorePlugin({
                    resourceRegExp: /^\.\/locale$/,
                    contextRegExp: /moment$/
                }),
                new webpack.ProvidePlugin({
                    process: 'process/browser'
                })
            ],

            performance: getPerformanceHints(perfHintOptions, 3.5 * 1024 * 1024) },
        { ...config,
            entry: {
                'alwaysontop': './react/features/always-on-top/index.tsx'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'alwaysontop')
            ],
            performance: getPerformanceHints(perfHintOptions, 800 * 1024) },
        { ...config,
            entry: {
                'close3': './static/close3.js'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'close3')
            ],
            performance: getPerformanceHints(perfHintOptions, 128 * 1024) },

        { ...config,
            entry: {
                'external_api': './modules/API/external/index.js'
            },
            output: { ...config.output,
                library: 'JitsiMeetExternalAPI',
                libraryTarget: 'umd' },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'external_api')
            ],
            performance: getPerformanceHints(perfHintOptions, 95 * 1024) },
        { ...config,
            entry: {
                'face-landmarks-worker': './react/features/face-landmarks/faceLandmarksWorker.ts'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'face-landmarks-worker')
            ],
            performance: getPerformanceHints(perfHintOptions, 1024 * 1024 * 2) },
        { ...config, /**
             * The NoiseSuppressorWorklet is loaded in an audio worklet which doesn't have the same
             * context as a normal window, (e.g. self/window is not defined).
             * While running a production build webpack's boilerplate code doesn't introduce any
             * audio worklet "unfriendly" code however when running the dev server, hot module replacement
             * and live reload add javascript code that can't be ran by the worklet, so we explicitly ignore
             * those parts with the null-loader.
             * The dev server also expects a `self` global object that's not available in the `AudioWorkletGlobalScope`,
             * so we replace it.
             */
            entry: {
                'noise-suppressor-worklet':
                    './react/features/stream-effects/noise-suppression/NoiseSuppressorWorklet.ts'
            },

            module: { rules: [
                ...config.module.rules,
                {
                    test: resolve(__dirname, 'node_modules/webpack-dev-server/client'),
                    loader: 'null-loader'
                }
            ] },
            plugins: [
            ],
            performance: getPerformanceHints(perfHintOptions, 1024 * 1024 * 2),

            output: {
                ...config.output,

                globalObject: 'AudioWorkletGlobalScope'
            } },

        { ...config,
            entry: {
                'screenshot-capture-worker': './react/features/screenshot-capture/worker.ts'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'screenshot-capture-worker')
            ],
            performance: getPerformanceHints(perfHintOptions, 30 * 1024) }
    ];
};
