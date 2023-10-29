import type {
  PageObjectResponse,
  RichTextItemResponse,
  BlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

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
