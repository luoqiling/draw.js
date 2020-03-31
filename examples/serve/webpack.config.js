const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const targetDir = path.resolve(__dirname, './')

module.exports = {
  entry: path.join(targetDir, 'index.js'),
  output: {
    path: path.resolve(__dirname, '../dist')
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.js$/,
        use: ['babel-loader', 'eslint-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg|jpeg|mp4)$/,
        loader: 'url-loader',
        options: {
          limit: 8192,
          fallback: 'file-loader',
          name: '[name].[ext]'
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(targetDir, 'index.html')
    })
  ]
}
