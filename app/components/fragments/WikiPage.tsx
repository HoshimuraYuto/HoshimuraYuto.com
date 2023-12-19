import path from "path";

import Link from "next/link";
import { ReactElement } from "react";

import { readFileContent, getFileStats } from "@/app/utils/fs";
import { transformMarkdownToReactElement } from "@/app/utils/markdownToReact";
import Comments from "@/app/wiki/[...id]/comment";

import BlogPostMeta from "../elements/BlogPostMeta";

import type { FrontMatter } from "@/app/types";

const WikiPage = async ({
  id,
  relatedWikis,
}: {
  id: string[];
  relatedWikis: { title: string; path: string }[] | null;
}): Promise<ReactElement> => {
  const contentPath = path.join(
    process.cwd(),
    "content/wiki",
    `/${id.join("/")}.md`,
  );

  try {
    const fileData = await readFileContent(contentPath);
    const { result, data } = await transformMarkdownToReactElement(fileData);
    const reactElement = result as React.ReactElement;
    const frontMatter = data.frontMatter as FrontMatter;
    const { id: wikiId, title, tags } = frontMatter;

    const stats = await getFileStats(contentPath);
    const { mtime } = stats;

    return (
      <article className="flex flex-col gap-16">
        <header className="flex flex-col gap-4">
          <h2 className="font-size-8 font-700">{title ?? id.slice(-2)[0]}</h2>
          <BlogPostMeta
            date={mtime}
            tags={tags ?? []}
          />
        </header>
        <section>{reactElement}</section>
        <section className="border-0 border-t-2 border-color-neutral-4 border-solid dark:border-color-neutral-5">
          <h2 className="my-16 font-size-8 font-bold tracking-[0.05rem]">
            類似wiki
          </h2>
          <div className="grid grid-cols-2 gap-4 lt-lg:grid-cols-1">
            {relatedWikis?.map((wiki) => (
              <Link
                key={wiki.path}
                href={wiki.path}
                className="border-1 border-neutral-1 rounded-2 border-solid p-4 color-neutral-9 line-height-8 decoration-none transition duration-100 dark:border-neutral-7 hover:bg-neutral-1 dark:color-white dark:hover:bg-neutral-7"
              >
                {wiki.title}
              </Link>
            ))}
          </div>
        </section>
        <Comments id={wikiId} />
      </article>
    );
  } catch (error) {
    console.error(error);
    return <p>Unable to load the blog post.</p>;
  }
};

export default WikiPage;
