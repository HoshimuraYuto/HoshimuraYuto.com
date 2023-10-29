import { BlockObjectWithChildren, ExtendedProperties } from "@/app/types";
import { renderContent } from "@/app/utils/renderContent";

import { blocksChildrenList, pagesRetrieve } from "../../services/notionClient";
import BlogPostMeta from "../elements/BlogPostMeta";

import type {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

const fetchPageWithChildren = async (
  id: string,
  cache = new Map<string, Promise<BlockObjectWithChildren[]>>(),
): Promise<BlockObjectWithChildren[]> => {
  if (cache.has(id)) return (await cache.get(id)) ?? [];

  const fetchPagePromise = blocksChildrenList(id).then(async (fetchPage) => {
    const page = fetchPage.results as BlockObjectResponse[];

    const pageWithChildren = await Promise.all(
      page.map(async (block) => {
        if (block.has_children) {
          const children = await fetchPageWithChildren(block.id, cache);
          return { ...block, children };
        } else {
          return block;
        }
      }),
    );

    return pageWithChildren;
  });

  cache.set(id, fetchPagePromise);
  return await fetchPagePromise;
};

const BlogPostPage = async ({ id }: { id: string }) => {
  try {
    const [pageWithChildren, pageObject] = await Promise.all([
      fetchPageWithChildren(id),
      pagesRetrieve(id).then((res) => res as PageObjectResponse),
    ]);

    const pageProperties = pageObject.properties as ExtendedProperties;
    const title = pageProperties.title?.title[0].plain_text;
    const tags = pageProperties.tags?.multi_select;
    const date = pageObject.last_edited_time;

    return (
      <article className="flex flex-col gap-16">
        <header className="flex flex-col gap-4">
          <h2 className="font-size-8 font-700">{title}</h2>
          <BlogPostMeta
            date={date}
            tags={tags ?? []}
          />
        </header>
        <section>
          {pageWithChildren.map((result) => renderContent(result))}
        </section>
      </article>
    );
  } catch (error: unknown) {
    return <p>Request failed with Notion API</p>;
  }
};

export default BlogPostPage;
