import presetMini from "@unocss/preset-mini";
import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
} from "unocss";

export default defineConfig({
  content: {
    filesystem: ["**/*.{html,js,ts,jsx,tsx,css,scss}"],
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
        ri: () => import("@iconify-json/ri/icons.json").then((i) => i.default),
      },
    }),
    presetMini(),
  ],
  rules: [
    [
      /^(?:wh|hw)-(.+)$/,
      ([_, num]) => ({ width: `${+num / 4}rem`, height: `${+num / 4}rem` }),
    ],
    [
      /^(?:min-wh|min-hw)-(.+)$/,
      ([_, num]) => ({
        "min-width": `${+num / 4}rem`,
        "min-height": `${+num / 4}rem`,
      }),
    ],
    [
      /^(?:max-wh|max-hw)-(.+)$/,
      ([_, num]) => ({
        "max-width": `${+num / 4}rem`,
        "max-height": `${+num / 4}rem`,
      }),
    ],
  ],
});
