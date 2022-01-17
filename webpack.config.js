const path = require("path");

module.exports = function(webpackEnv){
	const mode = webpackEnv["WEBPACK_SERVE"] ? "development" : "production";
	return {
	  entry: "./src/index.ts",
	  module: {
		rules: [
		  {
			test: /\.tsx?$/,
			use: "ts-loader",
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
		extensions: [".tsx", ".ts", ".js"],
	  },
	  output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "build"),
	  },
	  devtool: "inline-source-map",
	  mode: mode,
	  devServer: {
		static: {
		  directory: path.join(__dirname, 'build'),
		},
		port: 8080,
	  },
    }
};
