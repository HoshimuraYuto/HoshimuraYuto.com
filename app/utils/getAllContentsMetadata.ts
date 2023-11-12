import fs from "fs";
import path from "path";

import matter from "gray-matter";

import { getFileNameWithoutExtension } from "./regex";

import type { FrontMatter, FileMetadata, DirectoryMetadata } from "../types";

export const getAllContentsMetadata = async (
  dir: string,
  depth: number = Infinity,
  structureType: string = "flat",
): Promise<DirectoryMetadata | FileMetadata[]> => {
  const getMetadata = async (
    currentDir: string,
    currentDepth: number,
    pathArray: string[] = [],
  ): Promise<DirectoryMetadata | FileMetadata[]> => {
    const nestedResult: DirectoryMetadata = {};
    let flatResult: FileMetadata[] = [];
    const dirFileList = await fs.promises.readdir(currentDir);

    for (const name of dirFileList) {
      if (name === "assets") {
        continue;
      }

      if (/^\..*/.exec(name)) {
        continue;
      }

      if (/^_+.*/.exec(name) && process.env.NODE_ENV === "production") {
        continue;
      }

      const slug = getFileNameWithoutExtension(name) ?? name;
      const filename = path.join(currentDir, name);
      const stats = await fs.promises.stat(filename);

      if (stats.isDirectory()) {
        if (currentDepth < depth) {
          const children: unknown = await getMetadata(
            filename,
            currentDepth + 1,
            [...pathArray, slug],
          );
          if (structureType === "flat") {
            // フラットな構造を返す関数
            flatResult = [...flatResult, ...(children as FileMetadata[])];
          } else {
            // ネストした構造を返す関数
            nestedResult[slug] = children as DirectoryMetadata;
          }
        }
      } else {
        const fileData = await fs.promises.readFile(filename, "utf-8");
        const { birthtime, mtime } = stats;
        const { data } = matter(fileData);

        if (structureType === "flat") {
          // フラットな構造を返す関数
          flatResult.push({
            path: [...pathArray, slug],
            birthtime,
            mtime,
            data: data as FrontMatter,
          });
        } else {
          // ネストした構造を返す関数
          nestedResult[slug] = {
            path: [...pathArray, slug],
            birthtime,
            mtime,
            data: data as FrontMatter,
          } as FileMetadata;
        }
      }
    }

    if (structureType === "flat") {
      return flatResult;
    } else {
      return nestedResult;
    }
  };

  return getMetadata(dir, 1);
};
