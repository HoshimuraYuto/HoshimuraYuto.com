import notion from "../../services/notionClient";
import BlogTagItem from "../elements/BlogTagItem";

import type { TagsProperty } from "@/app/types";
import type { GetDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";

const BlogTagList = async () => {
  try {
    const rows: GetDatabaseResponse = await notion.databases.retrieve({
      database_id: process.env.NOTION_BLOG_DATABASE_ID ?? "",
    });

    const tags = rows.properties.tags as TagsProperty;

    return (
      <div className="flex flex-col gap-4">
        {tags.multi_select.options.map((tag) => {
          return <BlogTagItem key={tag.id}>{tag.name}</BlogTagItem>;
        })}
      </div>
    );
  } catch (error: unknown) {
    return <p>Request failed with Notion API</p>;
  }
};

export default BlogTagList;
