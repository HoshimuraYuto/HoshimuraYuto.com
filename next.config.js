/** @type {import('next').NextConfig} */

const path = require("path");

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  output: "export",
  images: {
    disableStaticImages: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(png|jpg|gif|svg)$/,
      use: {
        loader: "file-loader",
        options: {
          publicPath: "/_next/static/images",
          outputPath: "static/images",
        },
      },
    });
    config.module.rules.push({
      test: /\.(md|markdown)$/,
      type: "asset/source",
    });
    config.resolve.alias["@"] = path.join(__dirname);
    return config;
  },
};

module.exports = withPWA(nextConfig);
