import Link from "next/link";

import BlogPostMeta from "./BlogPostMeta";

const BlogPostItem = ({
  id,
  title,
  tags,
  date,
}: {
  id: string;
  title: string;
  tags: {
    id: string;
    name: string;
    color: string;
  }[];
  date: string;
}) => {
  return (
    <article
      className="flex flex-col gap-2"
      key={id}
    >
      <h2 className="font-size-4.5 font-normal line-height-9">
        <Link href={`/blog/${id}`}>{title}</Link>
      </h2>
      <BlogPostMeta
        date={date}
        tags={tags}
      />
    </article>
  );
};

export default BlogPostItem;
