const path = require("path");
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const nodeExternals = require('webpack-node-externals');


const PUBLIC_DIR = "public";
const LIBRARY_DIR = "dist";
const DEVELOPMENT_PORT = 8080;
module.exports = function (webpackEnv, argv) {
	let mode = argv.mode;
	if (!mode) {
		mode = webpackEnv.WEBPACK_SERVE ? 'development' : 'production'
	}
	// In development, the bundle is loaded from the public folder
	// In production, node_modules typically use the dist folder
	let outFolder = "";
	let entries = {};
	let externals = [];
	if (mode === "development") {
		outFolder = PUBLIC_DIR;
		entries = Object.fromEntries([
			["App", "./src/App.ts"],
			["InputServiceWorker", "./src/InputServiceWorker.ts"]
		]);
	} else {
		outFolder = LIBRARY_DIR;
		entries = Object.fromEntries([
			["Library", "./src/Library.ts"],
			["/workers/input/InputWorker", "./src/workers/input/InputWorker.ts"]
		]);
		externals = [nodeExternals()];
	}
	return {
		entry: entries,
		module: {
			rules: [
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
			// Allow generating both service worker and Papyros
			filename: "[name].js",
			path: path.resolve(__dirname, outFolder),
			// Required to make output useable as an npm package
			library: {
				name: "Papyros",
				type: "umd"
			},
			publicPath: "auto"
		},
		mode: mode,
		target: "web",
		// Prevent [name].js.LICENSE.txt from being generated
		optimization: {
			minimize: true,
			minimizer: [
				new TerserPlugin({
					extractComments: false,
					terserOptions: {
						format: {
							comments: false,
						},
					},
				}),
			],
		},
		devServer: {
			static: path.join(__dirname, PUBLIC_DIR),
			port: DEVELOPMENT_PORT,
		},
		plugins: [
			new BundleAnalyzerPlugin()
		],
		externals: externals
	}
};
