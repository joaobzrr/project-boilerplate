const path                   = require("path");
const webpack                = require("webpack");
const TerserWebpackPlugin    = require("terser-webpack-plugin");
const MiniCssExtractPlugin   = require('mini-css-extract-plugin');
const HtmlWebpackPlugin      = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

let config = require("./project.config.js");
config = process_config(config);

module.exports = env => {
    const output_path = config.paths.dist;
    const public_path = "/";
    const favicon_file_name   = "favicon.ico";
    const favicon_output_path = "static/images/";

    const plugins = [
        new webpack.DefinePlugin(config.globals),
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ["**/*", "!.git/**"]
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(config.paths.src, "index.hbs"),
            inject: false,
            templateParameters: {
                favicon: {
                    fileName: favicon_file_name,
                    outputPath: favicon_output_path
                }
            }
        })
    ];

    let mode, devtool, style_loader;
    if (env.config === "development") {
        mode = "development";
        devtool = "inline-source-map";
        style_loader = "style-loader";
    } else {
        mode = "production";
        devtool = false;
        style_loader = MiniCssExtractPlugin.loader;

        plugins.unshift(new MiniCssExtractPlugin({
            filename: "static/css/[name].[fullhash].css"
        }));
    }

    const result = {
        mode: mode,
        target: "web",
        entry: {
            main: [
                path.resolve(config.paths.src, "index.tsx"),
                path.resolve(config.paths.assets, "images", favicon_file_name)
            ],
        },
        output: {
            filename:   "static/js/[name].[fullhash].js",
            path:       output_path,
            publicPath: public_path
        },
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    exclude: /node_modules/,
                    use: ["babel-loader", "ts-loader"]
                },
                {
                    test: /\.(scss|css)$/,
                    use: [
                        style_loader,
                        "css-loader",
                        {
                            loader: "postcss-loader",
                            options: {
                                postcssOptions: {
                                    config: "postcss.config.js"
                                }
                            }
                        },
                        "sass-loader"
                    ]
                },
                {
                    test: /favicon.ico/i,
                    type: "asset/resource",
                    generator: {
                        filename: `${favicon_output_path}${favicon_file_name}`
                    }
                },
                {
                    test: /\.svg$/,
                    use: ["@svgr/webpack"]
                },
                {
                    test: /\.hbs$/,
                    loader: "handlebars-loader",
                }
            ]
        },
        resolve: {
            alias: config.aliases,
            extensions: [".js", ".jsx", ".json", ".ts", ".tsx"]
        },
        devServer: {
            contentBase: config.paths.dist,
            inline: true,
            hot: true
        },
        devtool: devtool,
        plugins: plugins,
        optimization: {
            minimizer: [
                new TerserWebpackPlugin({
                    terserOptions: {
                        format: {comments: false},
                        compress: {drop_console: true}
                    },
                    extractComments: false
                })
            ]
        }
    };

    return result;
};

function process_config(config) {
    const result = Object.assign({}, config);

    for (const [key, value] of Object.entries(result.paths)) {
        result.paths[key] = path.resolve(result.root, path.normalize(value));
    }

    for (const [key, value] of Object.entries(result.aliases)) {
        result.aliases[key] = path.resolve(result.root, path.normalize(value));
    }

    return result;
}
