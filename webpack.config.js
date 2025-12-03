const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: "production",

  entry: {
    // popup: "./src/popup.tsx",
    sidepanel: "./src/sidepanel.tsx",
    background: "./src/background.ts",
  },

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },

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
          "postcss-loader",
        ],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/sidepanel.html",
      filename: "sidepanel.html",
      chunks: ["sidepanel"],
    }),
  ],

  devtool: "source-map",

  optimization: {
    splitChunks: false,
  },

  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};
