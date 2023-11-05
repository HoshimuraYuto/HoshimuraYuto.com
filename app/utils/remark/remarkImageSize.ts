import sizeOf from "image-size";
import { visit } from "unist-util-visit";

import { isInternalLink } from "../regex";

import type { Image } from "mdast";
import type { Node } from "unist";

const remarkImageSize = ({ dir }: { dir: string }) => {
  return (tree: Node) => {
    visit(tree, "image", (node: Image) => {
      const src = node.url;
      if (isInternalLink(src)) {
        const imagePath = `${dir}/${src}`;
        const imageSize = sizeOf(imagePath);
        const width = imageSize.width ?? 1920;
        const height = imageSize.height ?? 1080;
        node.data = {
          hProperties: {
            width,
            height,
          },
        };
      }
    });
  };
};

export default remarkImageSize;
