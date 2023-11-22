import type {
  PageObjectResponse,
  RichTextItemResponse,
  BlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { Node } from "unist";

export interface ExtendedProperties {
  title?: {
    type: "title";
    title: Array<RichTextItemResponse>;
    id: string;
  };
  tags?: {
    type: "multi_select";
    multi_select: {
      id: string;
      name: string;
      color: string;
    }[];
    id: string;
  };
}

export interface ExtendedPageObjectResponse extends PageObjectResponse {
  properties: PageObjectResponse["properties"] & ExtendedProperties;
}

export interface TagsProperty {
  id: string;
  name: string;
  type: string;
  multi_select: {
    options: {
      id: string;
      name: string;
      color: string;
    }[];
  };
}

export type BlockObjectWithChildren = BlockObjectResponse & {
  children?: BlockObjectWithChildren[];
};

export interface FileMetadata {
  path: string[];
  birthtime: Date;
  mtime: Date;
  data: FrontMatter;
}

export interface DirectoryMetadata {
  [name: string]: FileMetadata | DirectoryMetadata;
}

export interface FrontMatter {
  title?: string;
  description?: string;
  tags?: string[] | null;
}

export interface LinkCard extends Node {
  type: "LinkCard";
  data: {
    hProperties: {
      title: string;
      description: string;
      image: string;
      url: string;
      urlOrigin: string;
    };
  };
}

export interface ResultInterface extends Array<Directory | File> {}

export interface EntryReference {
  type: "directories" | "files";
  id: string;
}

interface AdditionalAttributes {
  [key: string]: unknown;
}

export interface Directory {
  type: "directories";
  id: string;
  attributes: DirectoryAttributes;
  relationships: {
    children: {
      data: EntryReference[];
    };
  };
}

export interface DirectoryAttributes extends AdditionalDirectoryAttributes {
  depth: number;
}

interface AdditionalDirectoryAttributes {
  name: string;
  pathArray?: string[];
}

export interface File {
  type: "files";
  id: string;
  attributes: FileAttributes;
}

export interface FileAttributes extends AdditionalFileAttributes {
  depth: number;
}

interface AdditionalFileAttributes {
  pathArray: string[];
  timestamps: {
    created: Date;
    modified: Date;
  };
  data: Frontmatter;
}

export interface EntryCallback {
  (
    entry: fs.Dirent,
    entryPath: string,
    relativePath: string,
  ):
    | Promise<DirectoryAttributes | FileAttributes>
    | (DirectoryAttributes | FileAttributes | object);
}

export interface FileSearch {
  pathArray: string[];
  data: FrontMatter;
}
