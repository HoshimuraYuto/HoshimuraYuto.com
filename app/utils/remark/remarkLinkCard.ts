import { visit } from "unist-util-visit";

import getSiteInformation from "@/app/services/getSiteInformation";

import type { LinkCard } from "@/app/types";
import type { Paragraph, Link } from "mdast";
import type { Node } from "unist";

const remarkLinkCardPlugin = () => {
  return async (tree: Node) => {
    const isSingleLinkParagraph = (node: Paragraph): boolean => {
      return (
        node.type === "paragraph" &&
        node.children.length === 1 &&
        node.children[0].type === "link"
      );
    };

    const promises: Promise<void>[] = [];

    visit(tree, "paragraph", (node: Paragraph) => {
      if (isSingleLinkParagraph(node)) {
        promises.push(
          (async () => {
            try {
              const url = (node.children[0] as Link).url;
              const urlOrigin = String(new URL(url).origin);
              const { title, description } = await getSiteInformation(url);

              const linkCard: LinkCard = {
                type: "LinkCard",
                data: {
                  hProperties: {
                    title: title ?? "",
                    description: description ?? "",
                    image: `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${urlOrigin}&size=64`,
                    url: url,
                    urlOrigin: urlOrigin,
                  },
                },
              };

              Object.assign(node, linkCard);
            } catch (error) {
              console.error("Error fetching site information:", error);
            }
          })(),
        );
      }
    });

    await Promise.all(promises);
  };
};

export default remarkLinkCardPlugin;
