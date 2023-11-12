import fs from "fs";

// import { getAllContentsMetadata } from "@/app/utils/getAllContentsMetadata";

import BlogTagItem from "../elements/BlogTagItem";

import type { DirectoryMetadata, FileMetadata } from "@/app/types";

const extractTags = (obj: DirectoryMetadata | FileMetadata): string[] => {
  const tags = [] as string[];
  Object.values(obj).forEach((value: unknown) => {
    if (
      "data" in (value as DirectoryMetadata) &&
      "tags" in (value as DirectoryMetadata).data
    ) {
      const fileMetadata = value as FileMetadata;
      if (fileMetadata.data.tags) {
        tags.push(...fileMetadata.data.tags);
      }
    } else if (typeof value === "object" && value !== null) {
      tags.push(...extractTags(value as DirectoryMetadata));
    }
  });
  return tags;
};

const BlogTagList = async () => {
  try {
    // const posts = (await getAllContentsMetadata(
    //   "content",
    //   1,
    //   "nest",
    // )) as DirectoryMetadata;

    const jsonData = await fs.promises.readFile("blog-nest.json", "utf-8");
    const posts = JSON.parse(jsonData) as DirectoryMetadata;

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
