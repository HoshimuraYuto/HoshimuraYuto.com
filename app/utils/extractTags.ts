import type { File, FrontMatter } from "@/app/types";

export const extractTags = (obj: File[]): string[] => {
  return obj.reduce((prev, cur) => {
    const data = cur.attributes.data as FrontMatter;
    return [...prev, ...(data.tags ?? [])];
  }, [] as string[]);
};
