import fs from "fs";

import { getChildrenFromDirectories } from "@/app/utils/dirScanner";
import { extractTags } from "@/app/utils/extractTags";

import BlogTagItem from "../elements/BlogTagItem";

import type { File, Directory, ResultInterface } from "@/app/types";

const BlogTagList = async () => {
  try {
    const contentData = JSON.parse(
      await fs.promises.readFile("data.json", "utf-8"),
    ) as ResultInterface;

    const blogDirectory = contentData.filter(
      (item) => item.id === "blog",
    ) as Directory[];

    const posts = (await getChildrenFromDirectories(
      contentData,
      blogDirectory,
      "files",
      false,
    )) as File[];

    const allTags = extractTags(posts);
    const uniqueTags = Array.from(new Set(allTags));

    return (
      <div className="flex flex-col gap-4 lt-md:flex-row lt-md:flex-wrap">
        {uniqueTags.map((tag) => {
          return <BlogTagItem key={tag}>{tag}</BlogTagItem>;
        })}
      </div>
    );
  } catch (error: unknown) {
    return <p>Request failed with Notion API</p>;
  }
};

export default BlogTagList;
