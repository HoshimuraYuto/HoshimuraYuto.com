import fs from "node:fs";

import { getAllContentsMetadata } from "../../app/utils/getAllContentsMetadata";

const generateJsonFile = async (jsonName: string, structureType: string) => {
  const metadata = await getAllContentsMetadata("content", 1, structureType);
  fs.writeFileSync(`${jsonName}.json`, JSON.stringify(metadata, null, ""));
};

export default generateJsonFile;
