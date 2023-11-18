import fs from "fs";
import path from "path";

import {
  ResultInterface,
  EntryReference,
  Directory,
  File,
  EntryCallback,
  AdditionalFileAttributes,
  AdditionalDirectoryAttributes,
} from "../types";

export const scanDirectoryStructure = async (
  dir: string,
  match: RegExp = /.*/,
  fileCallback: EntryCallback = async () => Promise.resolve({}),
  directoryCallback: EntryCallback = async () => Promise.resolve({}),
): Promise<ResultInterface> => {
  const results = [] as ResultInterface;
  const baseDir = path.join(process.cwd(), dir);

  const recursiveScan = async (
    currentPath: string,
    depth: number = 0,
    parentRelativePath: string = "",
  ): Promise<EntryReference[]> => {
    const entries = await fs.promises.readdir(currentPath, {
      withFileTypes: true,
    });
    const innerResults: EntryReference[] = [];

    await Promise.all(
      [...entries].map(async (entry) => {
        const entryPath = path.join(currentPath, entry.name);
        const relativePath = path.join(parentRelativePath, entry.name);

        if (match.exec(relativePath)) {
          if (entry.isFile()) {
            const fileAttributes = (await fileCallback(
              entry,
              entryPath,
              relativePath,
            )) as AdditionalFileAttributes;

            results.push({
              type: "files",
              id: relativePath,
              attributes: {
                ...fileAttributes,
                depth: depth,
              },
            });

            innerResults.push({
              type: "files",
              id: relativePath,
            });
          } else if (entry.isDirectory()) {
            const children = await recursiveScan(
              entryPath,
              depth + 1,
              relativePath,
            );
            const directoryAttributes = (await directoryCallback(
              entry,
              entryPath,
              relativePath,
            )) as AdditionalDirectoryAttributes;

            results.push({
              type: "directories",
              id: relativePath,
              attributes: {
                ...directoryAttributes,
                depth: depth,
              },
              relationships: {
                children: {
                  data: children,
                },
              },
            });

            innerResults.push({ type: "directories", id: relativePath });
          }
        }
      }),
    );

    return innerResults;
  };

  await recursiveScan(baseDir, 0, "");
  return results;
};

export const getChildrenFromDirectories = async (
  fileList: ResultInterface,
  dirs: Directory[],
  withTypes: "files" | "directories" | "all" = "all",
  withChildren: boolean = true,
): Promise<(File | Directory)[]> => {
  return dirs.reduce(
    async (prevPromise, cur) => {
      const prev = await prevPromise;

      const results = [] as ResultInterface;
      const children = cur.relationships.children.data;

      await Promise.all(
        children.map(async (child) => {
          const findItemData = fileList.filter(
            (item) => item.id === child.id,
          ) as unknown;

          if (child.type === "files" && withTypes !== "directories") {
            results.push(...(findItemData as File[]));
          }
          if (child.type === "directories" && withTypes !== "files") {
            results.push(...(findItemData as Directory[]));
          }
          if (child.type === "directories" && withChildren) {
            results.push(
              ...(await getChildrenFromDirectories(
                fileList,
                findItemData as Directory[],
                withTypes,
                withChildren,
              )),
            );
          }
        }),
      );

      return [...prev, ...results];
    },
    Promise.resolve([] as ResultInterface),
  );
};
