const path = require("path");
const glob = require("glob");
const TerserPlugin = require('terser-webpack-plugin');

const PUBLIC_DIR = "public";
const LIBRARY_DIR = "dist";
const DEVELOPMENT_PORT = 8080;
module.exports = function (webpackEnv) {
	const mode = webpackEnv["mode"];
	// In development, the bundle is loaded from the public folder
	// In production, node_modules typically use the dist folder
	const outFolder = mode === "development" ? PUBLIC_DIR : LIBRARY_DIR;
	return {
		entry: Object.fromEntries(
			glob.sync("./src/**/*.{ts,js}") // All js and ts file
			// But not already typed files or worker files (those get inlined)
			.filter(n => !n.includes(".d.ts") && !n.includes(".worker.ts"))
			// Strip src folder and extension
			// Obtain [name, actual path]
			.map(v => [v.split("./src/")[1].split(".")[0], v])
		),
		module: {
			rules: [
				// Inline bundle worker-scripts to prevent bundle resolution errors
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
	}
};
