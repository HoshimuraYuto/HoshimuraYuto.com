import fs from "fs";
import path from "path";

import { readFileContent } from "@/app/utils/fs";
// import { getAllContentsMetadata } from "@/app/utils/getAllContentsMetadata";
import { transformMarkdownToReactElement } from "@/app/utils/markdownToReact";

import Main from "./Main";

import type { DirectoryMetadata, FrontMatter } from "@/app/types";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const contentPath = path.join(process.cwd(), "content", `${params.id}.md`);
  const fileData = await readFileContent(contentPath);
  const { data } = await transformMarkdownToReactElement(fileData);
  const frontMatter = data.frontMatter as FrontMatter;
  const { title, description } = frontMatter;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

const Page = ({ params }: { params: { id: string } }) => {
  return <Main id={params.id} />;
};

export default Page;

export async function generateStaticParams() {
  // const pages = await getAllContentsMetadata("content", 1, "nest");

  const jsonData = await fs.promises.readFile("blog-nest.json", "utf-8");
  const pages = JSON.parse(jsonData) as DirectoryMetadata;

  const pageIds = Object.keys(pages).map((id) => ({ id }));
  return pageIds;
}
