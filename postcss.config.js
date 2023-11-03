module.exports = {
  plugins: {
    "postcss-preset-env": { stage: 0 },
    "@unocss/postcss": {
      // Optional
      content: ["**/*.{html,js,ts,jsx,tsx,css,scss}"],
    },
  },
};
