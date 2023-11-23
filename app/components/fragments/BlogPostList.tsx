import fs from "fs";

import { getChildrenFromDirectories } from "@/app/utils/dirScanner";

import BlogPostItem from "../elements/BlogPostItem";

import type {
  File,
  Directory,
  FrontMatter,
  ResultInterface,
} from "@/app/types";

const BlogPostList = async () => {
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

    const sortedPosts = posts.sort((a, b) => {
      const dateA = new Date(a.attributes.timestamps.modified).getTime();
      const dateB = new Date(b.attributes.timestamps.modified).getTime();
      return dateB - dateA;
    });

    return (
      <div className="flex flex-col gap-8">
        {sortedPosts.map((post: File) => {
          const attributes = post.attributes;
          const data = attributes.data as FrontMatter;

          return (
            <BlogPostItem
              key={post.id}
              id={post.id}
              pathArray={attributes.pathArray}
              title={data.title ?? attributes.pathArray.slice(-1)[0]}
              tags={data?.tags ?? []}
              date={attributes.timestamps.modified}
            />
          );
        })}
      </div>
    );
  } catch (error: unknown) {
    return <p>{String(error)}</p>;
  }
};

export default BlogPostList;
