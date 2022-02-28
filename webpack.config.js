const path = require("path");

const PUBLIC_DIR = "public";
const LIBRARY_DIR = "dist";
const DEFAULT_ENTRY_POINT = "./src/App.ts";
const DEFAULT_SERVICE_WORKER_ENTRY_POINT = "./src/InputServiceWorker.ts"

module.exports = function (webpackEnv) {
	const mode = webpackEnv["mode"];
	// In development, the bundle is loaded from the public folder
	// In production, node_modules typically use the dist folder
	const outFolder = mode === "development" ? PUBLIC_DIR : LIBRARY_DIR;
	const entry = webpackEnv["entry"] || DEFAULT_ENTRY_POINT;
	return {
		entry: {
			// webpack output usually starts with lower case letter
			index: entry,
			inputServiceWorker: DEFAULT_SERVICE_WORKER_ENTRY_POINT
		},
		module: {
			rules: [
				// Inline bundle worker-scripts to prevent bundle resolving errors
				{
					test: /\.worker\.ts?$/,
					loader: 'worker-loader',
					options: {
						inline: 'no-fallback'
					}
				},
				{
					test: /\.ts?$/,
					loader: "ts-loader",
					exclude: /node_modules/,
				},
				{
					test: /\.css$/i,
					use: [
						"style-loader",
						"css-loader",
						"postcss-loader"
					],
				}
			]
		},
		resolve: {
			extensions: [".ts", ".js"],
		},
		output: {
			// allow generating both service worker and Papyros
			filename: "[name].js",
			path: path.resolve(__dirname, outFolder)
		},
		mode: mode,
		target: "web",
		devServer: {
			static: path.join(__dirname, PUBLIC_DIR),
			port: 8080,
		},
	}
};
