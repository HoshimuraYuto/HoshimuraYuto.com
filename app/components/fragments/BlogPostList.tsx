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
      return (
        new Date((b.attributes.data as FrontMatter).created_at).getTime() -
        new Date((a.attributes.data as FrontMatter).created_at).getTime()
      );
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
              title={data.title}
              tags={data?.tags ?? []}
              date={data.updated_at ?? data.created_at}
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
