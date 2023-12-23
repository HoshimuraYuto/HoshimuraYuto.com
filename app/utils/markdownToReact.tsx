import { createElement } from "react";
import * as prod from "react/jsx-runtime";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeReact from "rehype-react";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import rehypeToc from "rehype-toc";
import remarkBreaks from "remark-breaks";
import remarkExtractFrontmatter from "remark-extract-frontmatter";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified, Processor } from "unified";
import yaml from "yaml";

import CustomCode from "../components/elements/CustomCode";
import CustomImage from "../components/elements/CustomImage";
import CustomLink from "../components/elements/CustomLink";

import rehypeCustomLinkCardHandler from "./rehype/rehypeCustomLinkCardHandler";
import remarkImageSize from "./remark/remarkImageSize";
import remarkLinkCard from "./remark/remarkLinkCard";
import remarkRemoveMdExtension from "./remark/remarkRemoveMdExtension";

import type { Nodes } from "mdast";
import type { Handler } from "mdast-util-to-hast";
import type { Options as RehypeReactOptions } from "rehype-react";

// ref: https://github.com/syntax-tree/mdast-util-to-hast#handlers
type Handlers = Partial<Record<Nodes["type"], Handler>>;

// @ts-expect-error: the react types are missing.
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, import/namespace
const production = { Fragment: prod.Fragment, jsx: prod.jsx, jsxs: prod.jsxs };

const parseMarkdown = (processor: Processor) => {
  return processor.use(remarkParse);
};

const extractFrontmatter = (processor: Processor) => {
  return processor.use(remarkFrontmatter).use(remarkExtractFrontmatter, {
    yaml: yaml.parse,
    name: "frontMatter",
  });
};

const enhanceMdast = (processor: Processor) => {
  return processor
    .use(remarkImageSize, { dir: "content" })
    .use(remarkRemoveMdExtension)
    .use(remarkLinkCard)
    .use(remarkGfm)
    .use(remarkBreaks);
};

const convertMdastToHast = (processor: Processor) => {
  return processor.use(remarkRehype, {
    allowDangerousHtml: true,
    handlers: {
      LinkCard: rehypeCustomLinkCardHandler,
    } as Handlers,
  });
};

const enhanceHast = (processor: Processor) => {
  return (
    processor
      .use(rehypeRaw)
      .use(rehypeSlug)
      // @ts-expect-error: ts(2345)
      .use(rehypePrettyCode, {
        keepBackground: false,
        theme: {
          dark: "github-dark-dimmed",
          light: "github-light",
        },
        defaultLang: "plaintext",
      })
  );
};

const createTocFromHast = (processor: Processor) => {
  return processor.use(rehypeSlug).use(rehypeToc);
};

const convertHastToReact = (processor: Processor) => {
  return processor.use(rehypeReact, {
    ...production,
    components: {
      a: CustomLink,
      img: CustomImage,
      pre: CustomCode,
    },
    createElement: createElement,
  } as RehypeReactOptions);
};

const convertHastToHtml = (processor: Processor) => {
  return processor.use(rehypeStringify);
};

const createProcessor = () => {
  const processor: Processor = unified();
  parseMarkdown(processor);
  extractFrontmatter(processor);
  enhanceMdast(processor);
  convertMdastToHast(processor);
  enhanceHast(processor);
  convertHastToReact(processor);
  return processor;
};

const createTocProcessor = () => {
  const processor: Processor = unified();
  parseMarkdown(processor);
  extractFrontmatter(processor);
  convertMdastToHast(processor);
  createTocFromHast(processor);
  convertHastToHtml(processor);
  return processor;
};

const transformMarkdown = async (processor: Processor, markdown: string) => {
  const result = await processor.process(markdown);
  return result;
};

export const transformMarkdownToReactElement = async (markdown: string) => {
  const processor = createProcessor();
  const result = await transformMarkdown(processor, markdown);
  return result;
};

export const transformMarkdownToTocElement = async (markdown: string) => {
  const processor = createTocProcessor();
  const result = await transformMarkdown(processor, markdown);
  return result;
};
