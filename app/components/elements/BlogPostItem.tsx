import Link from "next/link";

import BlogPostMeta from "./BlogPostMeta";

const BlogPostItem = ({
  id,
  pathArray,
  title,
  tags,
  date,
}: {
  id: string;
  pathArray: string[];
  title: string;
  tags: string[];
  date: Date;
}) => {
  return (
    <article
      className="flex flex-col gap-2"
      key={id}
    >
      <h2 className="font-size-4.5 font-normal line-height-9">
        <Link href={pathArray.join("/")}>{title}</Link>
      </h2>
      <BlogPostMeta
        date={date}
        tags={tags}
      />
    </article>
  );
};

export default BlogPostItem;
