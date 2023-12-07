import fs from "fs";
import path from "path";

import { getChildrenFromDirectories } from "@/app/utils/dirScanner";
import { readFileContent } from "@/app/utils/fs";
import { transformMarkdownToReactElement } from "@/app/utils/markdownToReact";

import AsideRight from "../AsideRight";
import Main from "../Main";

import type {
  File,
  FrontMatter,
  ResultInterface,
  Directory,
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

  const assignTitleOrFilename = title ?? params.id[-1];

  return {
    title,
    description,
    openGraph: {
      title: assignTitleOrFilename,
      description,
    },
  };
}

const Page = async ({
  params,
}: {
  params: { id: string[]; relatedWiki: { title: string; path: string }[] };
}) => {
  const contentData = JSON.parse(
    await fs.promises.readFile("data.json", "utf-8"),
  ) as ResultInterface;

  const relatedWikiList = contentData
    .filter(
      (post): post is File => post.id === `wiki/${params.id.join("/")}.md`,
    )
    .map((post) => post.attributes.relatedPosts)?.[0];

  const relatedWikis = relatedWikiList?.map(
    (relatedPost) =>
      contentData
        .filter(
          (relatedWiki): relatedWiki is File => relatedWiki.id === relatedPost,
        )
        .map((item) => {
          const attributes = item.attributes;
          const data = attributes.data as FrontMatter;

          return {
            title: data.title ?? attributes.pathArray.slice(-2)[0],
            path: `/${[...attributes.pathArray].join("/")}`,
          };
        })[0],
  );

  return (
    <>
      <main className="max-w-[620px] w-full flex flex-1 flex-col gap-12 lt-md:w-auto">
        <Main
          id={params.id}
          relatedWikis={relatedWikis ?? null}
        />
      </main>
      <aside
        w="[250px]"
        // border="0 l-1 neutral-1 solid"
        className="lt-xl:hidden lt-md:w-auto lt-md:border-b-1 lt-md:border-r-0 dark:border-neutral-7"
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

  const wikiDirectory = contentData.filter(
    (item) => item.id === "wiki",
  ) as Directory[];

  const posts = (await getChildrenFromDirectories(
    contentData,
    wikiDirectory,
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
