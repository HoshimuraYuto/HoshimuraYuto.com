import path from "path";

import { ReactElement } from "react";

import { readFileContent, getFileStats } from "@/app/utils/fs";
import { transformMarkdownToReactElement } from "@/app/utils/markdownToReact";

import BlogPostMeta from "../elements/BlogPostMeta";

import type { FrontMatter } from "@/app/types";

const BlogPostPage = async ({ id }: { id: string }): Promise<ReactElement> => {
  const contentPath = path.join(process.cwd(), "content", `${id}.md`);

  try {
    const fileData = await readFileContent(contentPath);
    const { result, data } = await transformMarkdownToReactElement(fileData);
    const reactElement = result as React.ReactElement;
    const frontMatter = data.frontMatter as FrontMatter;
    const { title, tags } = frontMatter;

    const stats = await getFileStats(contentPath);
    const { mtime } = stats;

    return (
      <article className="flex flex-col gap-16">
        <header className="flex flex-col gap-4">
          <h2 className="font-size-8 font-700">{title}</h2>
          <BlogPostMeta
            date={mtime}
            tags={tags ?? []}
          />
        </header>
        <section>{reactElement}</section>
      </article>
    );
  } catch (error) {
    console.error(error);
    return <p>Unable to load the blog post.</p>;
  }
};

export default BlogPostPage;
