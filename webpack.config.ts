import * as path from 'path';
import * as webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const pathPrefix = process.env.BASE_URL ? process.env.BASE_URL : '';

const config: webpack.Configuration = {
  context: path.resolve(__dirname, 'src/client'),
  entry: './index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/client'),
  },
  devServer: {
    contentBase: path.resolve(__dirname, './src/client/public'),
    stats: 'errors-only',
    port: 8000,
    compress: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:9000',
      },
    ],
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: 'ts-loader', exclude: '/node_modules/' }],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.ejs',
      filename: './index.html',
      templateParameters: (compilation, assets, assetTags, options) => {
        return {
          compilation,
          webpackConfig: compilation.options,
          htmlWebpackPlugin: {
            tags: assetTags,
            files: assets,
            options,
          },
          pathPrefix,
        };
      },
    }),
  ],
};

export default config;
