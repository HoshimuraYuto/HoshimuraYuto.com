import { databaseRetrieve } from "../../services/notionClient";
import BlogTagItem from "../elements/BlogTagItem";

import type { TagsProperty } from "@/app/types";

const BlogTagList = async () => {
  try {
    const fetchTags = await databaseRetrieve();
    const tags = fetchTags.properties.tags as TagsProperty;

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
