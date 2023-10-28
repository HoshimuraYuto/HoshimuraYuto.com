// import Image from "next/image";
import { Suspense } from "react";
import { match, P } from "ts-pattern";

import { BlockObjectWithChildren } from "@/app/types";

import CodeHighlight from "../components/elements/CodeHighlight";
import {
  ExternalSiteCard,
  ExternalSiteCardPlaceholder,
} from "../components/elements/ExternalSiteCard";

import { getLastPathFromURL } from "./regex";

import type { TextRichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";

const renderRichText = (
  tag: React.ElementType,
  content: string | null,
  key: string,
  className?: string,
) => (
  <RichText
    key={key}
    tag={tag}
    className={className ?? ""}
  >
    {content}
  </RichText>
);

const RichText = ({
  tag: Comp,
  children,
  className,
}: {
  tag: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) => {
  return <Comp className={className}>{children}</Comp>;
};

const getTextContent = (item: TextRichTextItemResponse | undefined) =>
  item?.text.content ?? null;

export const renderContent = (result: BlockObjectWithChildren) => {
  return (
    match(result)
      .with({ type: "bookmark" }, (res) => {
        const url = res.bookmark.url;

        return (
          <Suspense
            key={res.id}
            fallback={<ExternalSiteCardPlaceholder url={url} />}
          >
            <ExternalSiteCard url={url} />
          </Suspense>
        );
      })
      .with({ type: "breadcrumb" }, (res) => {
        return (
          <p
            key={res.id}
            className="my-4"
          >
            Not support
          </p>
        );
      })
      .with({ type: "bulleted_list_item" }, (res) => {
        const createList = (children: BlockObjectWithChildren[]) => {
          return (
            <ul className="pl-6">
              {children.map(
                (child) =>
                  child.type === "bulleted_list_item" && (
                    <li
                      key={child.id}
                      className="my-2"
                    >
                      {getTextContent(
                        child.bulleted_list_item
                          .rich_text[0] as TextRichTextItemResponse,
                      )}
                      {child.children && createList(child.children)}
                    </li>
                  ),
              )}
            </ul>
          );
        };

        return (
          <ul
            key={res.id}
            className="my-4 list-inside p-0"
          >
            <li className="my-2">
              {getTextContent(
                res.bulleted_list_item.rich_text[0] as TextRichTextItemResponse,
              )}
              {res.children && createList(res.children)}
            </li>
          </ul>
        );
      })
      .with({ type: "callout" }, (res) => {
        const emoji =
          res.callout.icon?.type === "emoji" ? res.callout.icon?.emoji : "";

        return (
          <div
            key={res.id}
            className="my-4 flex items-center gap-4 bg-neutral-1 p-4 dark:bg-neutral-7"
          >
            <span>{emoji}</span>
            {renderRichText(
              "p",
              getTextContent(
                res.callout.rich_text[0] as TextRichTextItemResponse,
              ),
              res.id,
            )}
          </div>
        );
      })
      .with({ type: "child_database" }, (res) => {
        return (
          <p
            key={res.id}
            className="my-4"
          >
            Not support
          </p>
        );
      })
      .with({ type: "child_page" }, (res) => {
        return (
          <p
            key={res.id}
            className="my-4"
          >
            Not support
          </p>
        );
      })
      .with({ type: "code" }, (res) => {
        return (
          <CodeHighlight
            lang={res.code.language ?? ""}
            key={res.id}
          >
            {getTextContent(res.code.rich_text[0] as TextRichTextItemResponse)}
          </CodeHighlight>
        );
      })
      .with({ type: P.union("column_list", "column") }, (res) => {
        const createColumnList = (children: BlockObjectWithChildren[]) => {
          return (
            <div
              key={res.id}
              className={
                res.type === "column_list"
                  ? "flex gap-4 lt-md:flex-col"
                  : "flex-1"
              }
            >
              {children.map((child) => {
                return renderContent(child);
              })}
            </div>
          );
        };

        if (res.children) {
          return createColumnList(res.children);
        }
      })
      .with({ type: "divider" }, (res) => (
        <hr
          key={res.id}
          className="my-4 border-0 border-t-2 border-color-neutral-4 border-solid dark:border-color-neutral-5"
        />
      ))
      .with({ type: "embed" }, (res) => {
        return (
          <p
            key={res.id}
            className="my-4"
          >
            Not support
          </p>
        );
      })
      .with({ type: "equation" }, (res) => {
        return (
          <p
            key={res.id}
            className="my-4"
          >
            Not support
          </p>
        );
      })
      .with({ type: "file", file: { type: "file" } }, (res) => {
        const url = res.file.file.url;
        const fileName = getLastPathFromURL(url);

        return (
          <div
            key={res.id}
            className="my-4"
          >
            <a href={res.file.file.url}>
              <div className="i-carbon-document v-sub color-neutral-4 wh-4 dark:color-neutral-5" />
              {fileName ?? url}
            </a>
          </div>
        );
      })
      .with({ type: "heading_1" }, (res) =>
        renderRichText(
          "h1",
          getTextContent(
            res.heading_1.rich_text[0] as TextRichTextItemResponse,
          ),
          res.id,
          "my-16 font-size-8 font-bold tracking-[0.05rem]",
        ),
      )
      .with({ type: "heading_2" }, (res) =>
        renderRichText(
          "h2",
          getTextContent(
            res.heading_2.rich_text[0] as TextRichTextItemResponse,
          ),
          res.id,
          "my-16 font-size-6 font-bold tracking-[0.05rem]",
        ),
      )
      .with({ type: "heading_3" }, (res) =>
        renderRichText(
          "h3",
          getTextContent(
            res.heading_3.rich_text[0] as TextRichTextItemResponse,
          ),
          res.id,
          "my-16 font-size-4 font-bold tracking-[0.05rem]",
        ),
      )
      .with({ type: "image", image: { type: "file" } }, (res) => {
        const url = res.image.file.url;

        return (
          // <div className="relative aspect-square">
          //   <NextImage
          //     src={url}
          //     alt={""}
          //     className="object-contain"
          //     fill
          //     loading="lazy"
          //   />
          // </div>
          <img
            key={res.id}
            src={url}
            loading="lazy"
            className="my-4"
          />
        );
      })
      .with({ type: "image", image: { type: "external" } }, (res) => (
        <img
          key={res.id}
          src={res.image.external.url}
          loading="lazy"
          className="my-4"
        />
      ))
      .with({ type: "link_preview" }, (res) => {
        const url = res.link_preview.url;

        return (
          <Suspense
            key={res.id}
            fallback={<ExternalSiteCardPlaceholder url={url} />}
          >
            <ExternalSiteCard url={url} />
          </Suspense>
        );
      })
      .with({ type: "numbered_list_item" }, (res) => {
        const createList = (children: BlockObjectWithChildren[]) => {
          return (
            <ol className="pl-6">
              {children.map(
                (child) =>
                  child.type === "numbered_list_item" && (
                    <li
                      key={child.id}
                      className="my-2"
                    >
                      {getTextContent(
                        child.numbered_list_item
                          .rich_text[0] as TextRichTextItemResponse,
                      )}
                      {child.children && createList(child.children)}
                    </li>
                  ),
              )}
            </ol>
          );
        };

        return (
          <ol
            key={res.id}
            className="my-4 list-inside p-0"
          >
            <li className="my-2">
              {getTextContent(
                res.numbered_list_item.rich_text[0] as TextRichTextItemResponse,
              )}
              {res.children && createList(res.children)}
            </li>
          </ol>
        );
      })
      .with({ type: "paragraph", paragraph: { rich_text: [P._] } }, (res) =>
        renderRichText(
          "p",
          getTextContent(
            res.paragraph.rich_text[0] as TextRichTextItemResponse,
          ),
          res.id,
          "my-8 line-height-8 tracking-[0.05rem]",
        ),
      )
      .with({ type: "paragraph", paragraph: { rich_text: [] } }, (res) => (
        <br
          key={res.id}
          className="block h-8 content-empty"
        />
      ))
      .with(
        { type: "pdf", pdf: { type: P.union("file", "external") } },
        (res) => {
          const url =
            res.pdf.type === "file" ? res.pdf.file.url : res.pdf.external.url;
          const fileName = getLastPathFromURL(url);

          return (
            <div
              key={res.id}
              className="my-4"
            >
              <a href={url}>
                <div className="i-carbon-document-pdf v-sub color-neutral-4 wh-4 dark:color-neutral-5" />
                {fileName ?? url}
              </a>
            </div>
          );
        },
      )
      .with({ type: "quote" }, (res) => {
        return (
          <blockquote
            key={res.id}
            className="my-4 border-0 border-l-2 border-neutral-2 border-solid pl-4 dark:border-neutral-7"
          >
            {renderRichText(
              "p",
              getTextContent(
                res.quote.rich_text[0] as TextRichTextItemResponse,
              ),
              res.id,
              "",
            )}
          </blockquote>
        );
      })
      .with({ type: "synced_block" }, (res) => {
        return (
          <p
            key={res.id}
            className="my-4"
          >
            Not support
          </p>
        );
      })
      .with({ type: "table" }, (res) => {
        return (
          <p
            key={res.id}
            className="my-4"
          >
            Not support
          </p>
        );
      })
      .with({ type: "table_of_contents" }, (res) => {
        return (
          <p
            key={res.id}
            className="my-4"
          >
            Not support
          </p>
        );
      })
      .with({ type: "to_do" }, (res) => {
        return (
          <p
            key={res.id}
            className="my-4"
          >
            Not support
          </p>
        );
      })
      .with({ type: "toggle" }, (res) => {
        return (
          <details key={res.id}>
            {renderRichText(
              "summary",
              getTextContent(
                res.toggle.rich_text[0] as TextRichTextItemResponse,
              ),
              res.id,
              "cursor-pointer",
            )}
            <div className="m-y--4 p-l-3.5">
              {res.children?.map((child) => {
                return renderContent(child);
              })}
            </div>
          </details>
        );
      })
      .with({ type: "video" }, (res) => {
        return (
          <p
            key={res.id}
            className="my-4"
          >
            Not support
          </p>
        );
      })
      // .with(P._, (res) => <p key={res.id}>{String(JSON.stringify(result))}</p>)
      .with(P._, (res) => <p key={res.id}>Not Catch</p>)
      .exhaustive()
  );
};
