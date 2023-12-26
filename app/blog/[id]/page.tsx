import fs from "fs";
import path from "path";

import { getChildrenFromDirectories } from "@/app/utils/dirScanner";
import { readFileContent } from "@/app/utils/fs";
import { transformMarkdownToReactElement } from "@/app/utils/markdownToReact";

import Main from "./Main";

import type {
  File,
  Directory,
  FrontMatter,
  ResultInterface,
} from "@/app/types";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const contentPath = path.join(
    process.cwd(),
    "content/blog",
    `${params.id}.md`,
  );
  const fileData = await readFileContent(contentPath);
  const { data } = await transformMarkdownToReactElement(fileData);
  const frontMatter = data.frontMatter as FrontMatter;
  const { title, description } = frontMatter;

  const assignTitleOrFilename = title ?? params.id;

  return {
    title,
    description,
    openGraph: {
      title: assignTitleOrFilename,
      description,
      url: `https://hoshimurayuto.com/blog/${params.id}`,
      siteName: "Hi 👋, I'm Hoshimura Yuto.",
      images: "/favicon.png",
      locale: "ja_JP",
      type: "article",
    },
    alternates: {
      canonical: `/blog/${params.id}`,
    },
  };
}

const Page = ({ params }: { params: { id: string } }) => {
  return <Main id={params.id} />;
};

export default Page;

export async function generateStaticParams() {
  const contentData = JSON.parse(
    await fs.promises.readFile("data.json", "utf-8"),
  ) as ResultInterface;

  const blogDirectory = contentData.filter(
    (item) => item.id === "blog",
  ) as Directory[];

  const posts = (await getChildrenFromDirectories(
    contentData,
    blogDirectory,
    "files",
    false,
  )) as File[];

  const targetIds = posts.map((post) => {
    return {
      id: post.attributes.pathArray ? post.attributes.pathArray[1] : null,
    };
  });
  return targetIds;
}
