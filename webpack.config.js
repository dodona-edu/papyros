const path = require("path");

module.exports = function (webpackEnv) {
	const mode = webpackEnv["mode"];
	const outDir = mode === "development" ? "public" : "dist";
	const entry = webpackEnv["entry"] || "./src/App.ts";
	return {
		entry: {
			index: entry,
			inputServiceWorker: './src/inputServiceWorker.ts'
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
			filename: "[name].js",
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
			static: path.join(__dirname, "public"),
			port: 8080,
		},
	}
};
