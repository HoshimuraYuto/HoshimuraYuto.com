import { Client } from "@notionhq/client";
import { cache } from "react";

import type { ListBlockChildrenResponse } from "@notionhq/client/build/src/api-endpoints";

export const revalidate = 3600;

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const blocksChildrenList = cache(
  async (id: string): Promise<ListBlockChildrenResponse> => {
    return notion.blocks.children.list({
      block_id: id,
    });
  },
);

export const pagesRetrieve = cache(async (id: string) => {
  return notion.pages.retrieve({
    page_id: id,
  });
});

export const databaseQuery = cache(async () => {
  return notion.databases.query({
    database_id: process.env.NOTION_BLOG_DATABASE_ID ?? "",
    sorts: [
      {
        timestamp: "last_edited_time",
        direction: "descending",
      },
    ],
  });
});

export const databaseRetrieve = cache(async () => {
  return notion.databases.retrieve({
    database_id: process.env.NOTION_BLOG_DATABASE_ID ?? "",
  });
});
