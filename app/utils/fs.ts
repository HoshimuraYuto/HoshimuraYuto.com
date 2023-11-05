import fs from "fs";

export const readFileContent = (filePath: string): Promise<string> => {
  return fs.promises.readFile(filePath, "utf-8");
};

export const getFileStats = (filePath: string): Promise<fs.Stats> => {
  return fs.promises.stat(filePath);
};
