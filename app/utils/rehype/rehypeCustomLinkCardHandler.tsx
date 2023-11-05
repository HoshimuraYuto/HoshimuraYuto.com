import { LinkCard } from "@/app/types";

const rehypeCustomLinkCardHandler = (_: unknown, node: LinkCard) => {
  const { title, description, image, url, urlOrigin } = node.data.hProperties;

  return {
    type: "element",
    tagName: "a",
    properties: {
      className: ["linkCard"],
      href: url,
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: {
          className: ["linkCard__title"],
        },
        children: [{ type: "text", value: title }],
      },
      {
        type: "element",
        tagName: "span",
        properties: {
          className: ["linkCard__description"],
        },
        children: [{ type: "text", value: description }],
      },
      {
        type: "element",
        tagName: "div",
        properties: {
          className: ["linkCard__content"],
        },
        children: [
          {
            type: "element",
            tagName: "img",
            properties: {
              className: ["linkCard__icon"],
              src: image,
              loading: "lazy",
            },
          },
          {
            type: "element",
            tagName: "span",
            properties: {
              className: ["linkCard__url"],
            },
            children: [{ type: "text", value: urlOrigin }],
          },
        ],
      },
    ],
  };
};

export default rehypeCustomLinkCardHandler;
