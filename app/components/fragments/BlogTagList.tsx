import { getAllContentsMetadata } from "@/app/utils/getAllContentsMetadata";

import BlogTagItem from "../elements/BlogTagItem";

import type { DirectoryMetadata, FileMetadata, FrontMatter } from "@/app/types";

const extractTags = (obj: DirectoryMetadata | FileMetadata): string[] => {
  const tags = [] as string[];
  Object.values(obj).forEach((value) => {
    if ((value as FrontMatter).tags) {
      tags.push(...((value as FrontMatter).tags ?? []));
    } else {
      tags.push(...extractTags(value as DirectoryMetadata));
    }
  });
  return tags;
};

const BlogTagList = async () => {
  try {
    const posts = await getAllContentsMetadata("content", 1);
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
