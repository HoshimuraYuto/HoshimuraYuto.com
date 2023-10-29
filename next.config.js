/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  // ref: https://nextjs.org/docs/pages/api-reference/components/image
  // images: {
  //   domains: ["prod-files-secure.s3.us-west-2.amazonaws.com"],
  // },
};

module.exports = withPWA(nextConfig);
