const path = require("path");
const TerserPlugin = require('terser-webpack-plugin');
const { PyodidePlugin } = require("@pyodide/webpack-plugin");


const PUBLIC_DIR = "public";
const DEVELOPMENT_PORT = 8080;
module.exports = function (webpackEnv, argv) {
	let mode = argv.mode;
	if (!mode) {
		mode = webpackEnv.WEBPACK_SERVE ? 'development' : 'production'
	}
	return {
		plugins: [
			new PyodidePlugin()
		],
		entry: Object.fromEntries([
			["App", "./src/App.ts"],
			["InputServiceWorker", "./src/InputServiceWorker.ts"]
		]),
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
			path: path.resolve(__dirname, PUBLIC_DIR),
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
	}
};
