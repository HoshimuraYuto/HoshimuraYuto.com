import fs from "node:fs";

import matter from "gray-matter";

import { FileAttributes, FrontMatter } from "@/app/types";
import { scanDirectoryStructure } from "@/app/utils/dirScanner";

const generateJsonFile = async () => {
  const allContents = await scanDirectoryStructure(
    "content",
    /^(?!.*\/_+[^/]+$)(?!.*assets).*$/,
    async (_, entryPath, relativePath) => {
      const stats = await fs.promises.stat(entryPath);
      const fileData = await fs.promises.readFile(entryPath, "utf-8");
      const { data } = matter(fileData);
      // const { data, content } = matter(fileData);

      const trimExtensionRegex = /^(.+?)(\.[^.]*$|$)/;
      // const fileMatch = trimExtensionRegex.exec(entry.name);
      const pathMatch = trimExtensionRegex.exec(relativePath);

      return {
        // name: fileMatch?.[1] ?? "",
        // extension: fileMatch?.[2] ?? "",
        pathArray: pathMatch?.[1].split("/"),
        timestamps: {
          created: stats.birthtime,
          modified: stats.mtime,
        },
        data,
        // content,
      };
    },
    (entry, _, relativePath) => {
      const trimExtensionRegex = /^(.+?)(\.[^.]*$|$)/;
      const pathMatch = trimExtensionRegex.exec(relativePath);

      return {
        name: entry.name as string,
        pathArray: pathMatch?.[1].split("/"),
      };
    },
  );

  fs.writeFileSync(`data.json`, JSON.stringify(allContents, null, ""));
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
};

export default generateJsonFile;
