import { Client } from "@notionhq/client";

import type { ListBlockChildrenResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const blocksChildrenList = async (
  id: string,
): Promise<ListBlockChildrenResponse> => {
  return notion.blocks.children.list({
    block_id: id,
  });
};

export const pagesRetrieve = async (id: string) => {
  return notion.pages.retrieve({
    page_id: id,
  });
};

export const databaseQuery = async () => {
  return notion.databases.query({
    database_id: process.env.NOTION_BLOG_DATABASE_ID ?? "",
    sorts: [
      {
        timestamp: "last_edited_time",
        direction: "descending",
      },
    ],
  });
};
