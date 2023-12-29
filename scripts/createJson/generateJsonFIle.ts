import fs from "node:fs";

import matter from "gray-matter";
import moment from "moment-timezone";
import RSS from "rss";

import { File, FileAttributes, FrontMatter } from "@/app/types";
import { scanDirectoryStructure } from "@/app/utils/dirScanner";
import executePythonScript from "@/app/utils/executePythonScript";
import { extractTags } from "@/app/utils/extractTags";
import { createOgpImage } from "@/app/utils/OgImage";

const generateJsonFile = async () => {
  const allContents = await scanDirectoryStructure(
    "content",
    /^(?!.*\/_+[^/]+$)(?!.*assets)(?!\.obsidian)(?!\.git)(?!_template)(?!.*DS_Store).*$/,
    async (_, entryPath, relativePath) => {
      // const stats = await fs.promises.stat(entryPath);
      const fileData = await fs.promises.readFile(entryPath, "utf-8");
      const { data, content } = matter(fileData);
      const frontMatter = data as FrontMatter;
      // const { data, content } = matter(fileData);

      const trimExtensionRegex = /^(.+?)(\.[^.]*$|$)/;
      // const fileMatch = trimExtensionRegex.exec(entry.name);
      const pathMatch = trimExtensionRegex.exec(relativePath);
      const pathArray = pathMatch?.[1].split("/");

      return {
        // name: fileMatch?.[1] ?? "",
        // extension: fileMatch?.[2] ?? "",
        pathArray: pathArray,
        data: {
          id: frontMatter.id,
          title: frontMatter.title ?? pathArray?.[-1],
          created_at: moment(frontMatter.created_at).tz("Asia/Tokyo").format(),
          description: frontMatter.description ?? "",
          tags: frontMatter.tags ?? [],
        },
        content:
          content
            .match(/[\w\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/g)
            ?.join("") ?? "",
      };
    },
    (entry, _, relativePath) => {
      const trimExtensionRegex = /^(.+?)(\.[^.]*$|$)/;
      const pathMatch = trimExtensionRegex.exec(relativePath);

      return {
        name: entry.name as string,
        pathArray: pathMatch?.[0].split("/"),
      };
    },
  );

  const createInputDataForPythonScript = allContents
    .filter(
      (item): item is File =>
        item.type === "files" && item.attributes.pathArray[0] === "wiki",
    )
    .map((item) => {
      return {
        id: item.id,
        content: item.attributes.content ?? "",
      };
    });

  const pythonScriptOutput = await executePythonScript(
    createInputDataForPythonScript,
  );
  const parsedResults = (await JSON.parse(pythonScriptOutput)) as {
    id: string;
    relatedPosts: string[];
  }[];

  fs.writeFileSync(
    `data.json`,
    JSON.stringify(
      allContents.map((item) => {
        const { content, ...attributesWithoutContent } = (item as File)
          .attributes;

        return {
          ...item,
          attributes: {
            ...attributesWithoutContent,
            relatedPosts: parsedResults
              .filter((res) => item.id === res.id)
              .map((i) => i.relatedPosts)?.[0],
          },
        };
      }),
      null,
      "",
    ),
  );
  fs.writeFileSync(
    `search.json`,
    JSON.stringify(
      allContents
        .filter((item) => item.type === "files")
        .map((item) => {
          const attributes = item.attributes;
          const data = (attributes as FileAttributes).data as FrontMatter;

          return {
            pathArray: item.attributes.pathArray,
            data: data,
          };
        }),
      null,
      "",
    ),
  );

  const allTags = extractTags(
    allContents.filter((item): item is File => item.type === "files"),
  );
  const uniqueTags = Array.from(new Set(allTags));

  const feed = new RSS({
    title: "Hi 👋, I'm Hoshimura Yuto.",
    description: "Personal website.",
    feed_url: "https://hoshimurayuto.com/rss.xml",
    site_url: "https://hoshimurayuto.com",
    image_url: "https://hoshimurayuto.com/favicon.png",
    managingEditor: "Hoshimura Yuto",
    webMaster: "Hoshimura Yuto",
    copyright: "MIT 2023 © hoshimurayuto.com",
    language: "ja",
    categories: uniqueTags,
    pubDate: new Date(
      Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000,
    ),
  });

  allContents
    .filter((item) => item.type === "files")
    .sort(
      (a, b) =>
        new Date(
          ((b.attributes as FileAttributes).data as FrontMatter).created_at,
        ).getTime() -
        new Date(
          ((a.attributes as FileAttributes).data as FrontMatter).created_at,
        ).getTime(),
    )
    .slice(0, 10)
    .forEach((item) => {
      const attributes = item.attributes as FileAttributes;
      const data = attributes.data as FrontMatter;

      feed.item({
        title: data.title,
        description: data.description ?? "",
        url:
          `https://hoshimurayuto.com/${attributes.pathArray?.join("/")}` ?? "",
        date: new Date(data.created_at),
      });
    });

  fs.writeFileSync(`public/rss.xml`, feed.xml());

  if (!fs.existsSync("public/ogp")) {
    fs.mkdirSync("public/ogp");
  }

  for (const item of allContents) {
    if (item.type === "files") {
      const attributes = item.attributes;
      const data = attributes.data as FrontMatter;

      await createOgpImage(data.id, data.title);
    }
  }
};

export default generateJsonFile;
