import fs from "node:fs";

import matter from "gray-matter";

import { File, FileAttributes, FrontMatter } from "@/app/types";
import { scanDirectoryStructure } from "@/app/utils/dirScanner";
import executePythonScript from "@/app/utils/executePythonScript";

const generateJsonFile = async () => {
  const allContents = await scanDirectoryStructure(
    "content",
    /^(?!.*\/_+[^/]+$)(?!.*assets)(?!\.obsidian)(?!.*DS_Store).*$/,
    async (_, entryPath, relativePath) => {
      const stats = await fs.promises.stat(entryPath);
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
        timestamps: {
          created: stats.birthtime,
          modified: stats.mtime,
        },
        data: {
          id: frontMatter.id,
          title: frontMatter.title ?? pathArray?.[-1],
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
};

export default generateJsonFile;
