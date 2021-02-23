const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({title: "Ximera",
                           template: 'src/index.html',
                           minify: {
                             collapseWhitespace: true,
                             removeComments: true
                           }
                          }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),    
  ],
  entry: './src/index.js',
  mode: "development",
  devtool: 'inline-source-map',  
  output: {
    filename: 'main.[chunkhash].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    defaultRules: [
      {
        type: 'javascript/auto',
        resolve: {}
      },
      {
        test: /\.json$/i,
        type: 'json'
      }
    ],
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(wasm)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.(dump.gz)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' }
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/'
            }
          }
        ]
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
};
