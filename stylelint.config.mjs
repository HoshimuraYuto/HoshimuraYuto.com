/** @type {import("stylelint").Config} */
export default {
  extends: [
    "@hoshimurayuto/code-rules/stylelint",
    "@hoshimurayuto/code-rules/stylelint/astro",
  ],
  rules: {
    /** Sizes follow the reader's font size; hairlines and shadows look wrong when they grow with it. */
    "declaration-property-unit-disallowed-list": [
      {
        "/^(?!border(-.*)?-width$|border$|outline(-width)?$|box-shadow$|text-shadow$)/":
          ["px"],
      },
      {
        message: "Use rem or em; px is only for borders, outlines and shadows",
      },
    ],
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
      {
        message: "Expected class selector to be BEM (block__element--modifier)",
      },
    ],
  },
};
