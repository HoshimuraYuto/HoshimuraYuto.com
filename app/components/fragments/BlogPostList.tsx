import { databaseQuery } from "../../services/notionClient";
import BlogPostItem from "../elements/BlogPostItem";

import type { ExtendedPageObjectResponse } from "@/app/types";

const BlogPostList = async () => {
  try {
    const fetchPosts = await databaseQuery();
    const posts = fetchPosts.results as ExtendedPageObjectResponse[];

    return (
      <div className="flex flex-col gap-8">
        {posts.map((post) => {
          return (
            <BlogPostItem
              key={post.id}
              id={post.id}
              title={post.properties.title?.title[0].plain_text ?? ""}
              tags={post.properties.tags?.multi_select ?? []}
              date={post.last_edited_time}
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
