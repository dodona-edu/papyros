const path = require("path");

module.exports = function (webpackEnv) {
	const mode = webpackEnv["WEBPACK_SERVE"] ? "development" : "production";
	const outDir = mode === "development" ? "public" : "lib";
	const entry = mode === "development" ? "./src/index.ts" : "./src/library.ts";
	return {
		entry: entry,
		module: {
			rules: [
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
			],
		},
		resolve: {
			extensions: [".ts", ".js"],
		},
		output: {
			filename: "index.js",
			path: path.resolve(__dirname, outDir),
			library: {
				name: "Papyros",
				type: "umd"
			},
			publicPath: "auto"
		},
		mode: mode,
		target: "web",
		devServer: {
			contentBase: path.join(__dirname, "public"),
		},
	}
};
