import fs from "fs";

// import { getAllContentsMetadata } from "../../utils/getAllContentsMetadata";
import BlogPostItem from "../elements/BlogPostItem";

import type { DirectoryMetadata, FrontMatter } from "@/app/types";

const BlogPostList = async () => {
  try {
    // const posts = (await getAllContentsMetadata(
    //   "content",
    //   1,
    //   "nest",
    // )) as DirectoryMetadata;

    const jsonData = await fs.promises.readFile("blog-nest.json", "utf-8");
    const posts = JSON.parse(jsonData) as DirectoryMetadata;

    return (
      <div className="flex flex-col gap-8">
        {Object.keys(posts).map((post) => {
          const data = posts[post].data as FrontMatter;
          const date = posts[post].mtime as Date;
          return (
            <BlogPostItem
              key={post}
              id={post}
              title={data.title}
              tags={data.tags ?? []}
              date={date}
            />
          );
        })}
      </div>
    );
  } catch (error: unknown) {
    return <p>Request failed with Notion API</p>;
  }
};

export default BlogPostList;
