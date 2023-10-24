import notion from "../../services/notionClient";
import BlogPostItem from "../elements/BlogPostItem";

import type { BlogPostItemInterface } from "@/app/types";
import type { QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";

const BlogPostList = async () => {
  try {
    const pages: QueryDatabaseResponse = await notion.databases.query({
      database_id: process.env.NOTION_BLOG_DATABASE_ID ?? "",
      sorts: [
        {
          timestamp: "last_edited_time",
          direction: "descending",
        },
      ],
    });

    const posts = pages.results as BlogPostItemInterface[];

    return (
      <div className="flex flex-col gap-8">
        {posts.map((post) => {
          return (
            <BlogPostItem
              key={post.id}
              keyId={post.id}
              title={post.properties.title.title[0].plain_text}
              tags={post.properties.tags?.multi_select}
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
