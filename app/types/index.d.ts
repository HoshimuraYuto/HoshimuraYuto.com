import type {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

export interface BlogPostItemInterface extends PageObjectResponse {
  properties: PageObjectResponse["properties"] & {
    title: {
      type: "title";
      title: Array<RichTextItemResponse>;
      id: string;
    };
    tags: {
      type: "multi_select";
      multi_select: {
        id: string;
        name: string;
        color: string;
      }[];
      id: string;
    };
  };
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