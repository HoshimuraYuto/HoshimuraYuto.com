import fs from "fs";
import path from "path";

import { getChildrenFromDirectories } from "@/app/utils/dirScanner";
import { readFileContent } from "@/app/utils/fs";
import { transformMarkdownToReactElement } from "@/app/utils/markdownToReact";

import AsideRight from "../AsideRight";
import Main from "../Main";

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
  params: { id: string[] };
}): Promise<Metadata> {
  const contentPath = path.join(
    process.cwd(),
    "content/wiki",
    `/${params.id.join("/")}.md`,
  );
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

const Page = ({ params }: { params: { id: string[] } }) => {
  return (
    <>
      <main className="w-[620px] flex flex-col gap-12 lt-md:w-auto">
        <Main id={params.id} />
      </main>
      <aside
        w="[250px]"
        // border="0 l-1 neutral-1 solid"
        className="lt-md:w-auto lt-md:border-b-1 lt-md:border-r-0 dark:border-neutral-7"
      >
        <AsideRight id={params.id} />
      </aside>
    </>
  );
};

export default Page;

export async function generateStaticParams() {
  const contentData = JSON.parse(
    await fs.promises.readFile("data.json", "utf-8"),
  ) as ResultInterface;

  const blogDirectory = contentData.filter(
    (item) => item.id === "wiki",
  ) as Directory[];

  const posts = (await getChildrenFromDirectories(
    contentData,
    blogDirectory,
    "files",
    true,
  )) as File[];

  const targetIds = posts.map((post) => {
    return {
      id: post.attributes.pathArray ? post.attributes.pathArray.slice(1) : null,
    };
  });
  return targetIds;
}
