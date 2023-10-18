import type { Preview } from "@storybook/react";

import { themes } from "@storybook/theming";

import "./public/uno.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    nextjs: {
      appDirectory: true,
    },
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "white",
        },
        {
          name: "dark",
          value: "rgb(17, 24, 39)",
        },
      ],
    },
    darkMode: {
      stylePreview: true,
      classTarget: "html",
      dark: { ...themes.dark, appBg: "black" },
      light: { ...themes.normal, appBg: "white" },
    },
  },
};

export default preview;
