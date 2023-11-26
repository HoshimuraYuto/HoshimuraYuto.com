import { visit } from "unist-util-visit";

import { isInternalLink } from "../regex";

import type { Link } from "mdast";
import type { Node } from "unist";

const remarkRemoveMdExtension = () => {
  return (tree: Node) => {
    visit(tree, "link", (node: Link) => {
      if (isInternalLink(node.url) && typeof node.url === "string") {
        node.url = node.url.replace(/\.md$/, "");
      }
    });
  };
};

export default remarkRemoveMdExtension;
