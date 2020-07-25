import * as path from 'path';
import * as webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const pathPrefix = process.env.BASE_URL ? process.env.BASE_URL : '';
const PROD = process.env.PROD;

const config: webpack.Configuration = {
  context: path.resolve(__dirname, 'src/client'),
  entry: './index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/client'),
  },
  devServer: {
    contentBase: path.resolve(__dirname, './src/client/public'),
    contentBasePublicPath: '/assets',
    stats: 'errors-only',
    port: 8000,
    compress: true,
    proxy: [
      {
        context: ['/socket.io', '/api'],
        target: 'http://localhost:8080',
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
    new CopyPlugin({
      patterns: [{ from: 'public', to: 'assets' }],
    }),
  ],
};

if (!PROD) {
  config.plugins.push(new webpack.EnvironmentPlugin({ BASE_URL: 'http://localhost:8000' }));
} else {
  config.plugins.push(new webpack.EnvironmentPlugin({ BASE_URL: 'https://coup.jbat.ch' }));
}

export default config;
