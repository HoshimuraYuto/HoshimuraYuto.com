import fs from "fs";

import Link from "next/link";

import { getChildrenFromDirectories } from "@/app/utils/dirScanner";

import WikiAccordion from "./WikiAccordion";

import type {
  File,
  Directory,
  FrontMatter,
  ResultInterface,
} from "@/app/types";

const WikiMenu = async () => {
  const contentData = JSON.parse(
    await fs.promises.readFile("data.json", "utf-8"),
  ) as ResultInterface;

  const searchDataById = (id: string) => {
    return contentData.filter((item) => item.id === id);
  };

  const wikiRootDirectory = searchDataById("wiki") as Directory[];

  const wikiRootChildrenContent = await getChildrenFromDirectories(
    contentData,
    wikiRootDirectory,
    "all",
    false,
  );

  const wikiContents = async (content: (Directory | File)[]) => {
    const renderParentLink = (parentElement: File) => {
      const attributes = parentElement.attributes;
      const data = attributes.data as FrontMatter;

      const path = `/${parentElement.attributes.pathArray.join("/")}`;

      return (
        <Link
          key={parentElement.id}
          href={path}
          className="block w-[100%] color-neutral-9 decoration-none dark:color-white"
        >
          {data.title ?? attributes.pathArray.slice(-2)[0]}
        </Link>
      );
    };

    return await Promise.all(
      content.map(async (post) => {
        if (post.type === "directories") {
          const children = await getChildrenFromDirectories(
            contentData,
            [post],
            "all",
            false,
          );
          const parentElement = searchDataById(
            `${post.id}/index.md`,
          )[0] as File;
          const childElement = wikiContents(children);

          return (
            <WikiAccordion
              key={post.id}
              title={
                parentElement ? (
                  renderParentLink(parentElement)
                ) : (
                  <div className="color-neutral-4 transition duration-200 dark:color-neutral-5 hover:color-neutral-9 hover:dark:color-white">
                    {post.attributes.name}
                  </div>
                )
              }
            >
              {childElement}
            </WikiAccordion>
          );
        } else if (post.type === "files") {
          const attributes = post.attributes;
          const data = attributes.data as FrontMatter;

          if (attributes.pathArray.slice(-1)[0] === "index") {
            return;
          }

          return (
            <Link
              key={post.id}
              href={`/${attributes.pathArray.join("/")}`}
              className="block w-[100%] color-neutral-9 decoration-none dark:color-white"
            >
              {data.title ?? attributes.pathArray.slice(-1)[0]}
            </Link>
          );
        }
      }),
    );
  };

  const results = await wikiContents(wikiRootChildrenContent);

  return results;
};

export default WikiMenu;
