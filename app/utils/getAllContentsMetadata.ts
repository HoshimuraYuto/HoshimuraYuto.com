import fs from "fs";
import path from "path";

import matter from "gray-matter";

import { getFileNameWithoutExtension } from "./regex";

import type { FrontMatter } from "../types";

export interface FileMetadata {
  birthtime: Date;
  mtime: Date;
  data: FrontMatter;
}

export interface DirectoryMetadata {
  [name: string]: FileMetadata | DirectoryMetadata;
}

type MetadataResult = DirectoryMetadata;

export const getAllContentsMetadata = async (
  dir: string,
  depth: number = Infinity,
): Promise<MetadataResult> => {
  const getMetadata = async (
    currentDir: string,
    currentDepth: number,
  ): Promise<MetadataResult> => {
    const result: MetadataResult = {};
    const dirFileList = await fs.promises.readdir(currentDir);

    for (const name of dirFileList) {
      const slug = getFileNameWithoutExtension(name) ?? name;
      const filename = path.join(currentDir, name);
      const stats = await fs.promises.stat(filename);

      if (stats.isDirectory()) {
        if (currentDepth < depth) {
          const children = await getMetadata(filename, currentDepth + 1);
          result[slug] = children;
        }
      } else {
        const fileData = await fs.promises.readFile(filename, "utf-8");
        const { birthtime, mtime } = stats;
        const { data } = matter(fileData);

        result[slug] = {
          birthtime,
          mtime,
          data: data as FrontMatter,
        } as FileMetadata;
      }
    }

    return result;
  };

  return getMetadata(dir, 1);
};
