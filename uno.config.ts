import presetMini from "@unocss/preset-mini";
import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
} from "unocss";

export default defineConfig({
  content: {
    filesystem: ["**/*.{html,js,ts,jsx,tsx}"],
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      // Optional
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle",
      },
      collections: {
        carbon: () =>
          import("@iconify-json/carbon/icons.json").then((i) => i.default),
      },
    }),
    presetMini(),
  ],
  rules: [
    [
      /^(?:wh|hw)-(.+)$/,
      ([_, num]) => ({ width: `${+num / 4}rem`, height: `${+num / 4}rem` }),
    ],
  ],
});
