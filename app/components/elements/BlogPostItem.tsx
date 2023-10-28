import Link from "next/link";

import intersperse from "../../utils/intersperse";

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
  const tagsEl = tags.map((tag) => {
    return <span key={tag.id}>{tag.name}</span>;
  });
  const interspersedTagsEl = intersperse(
    tagsEl,
    <span key="tag separator">,</span>,
  );

  return (
    <div
      className="flex flex-col gap-2"
      key={id}
    >
      <h2 className="font-size-4.5 font-normal line-height-9">
        <Link href={`/blog/${id}`}>{title}</Link>
      </h2>
      <div className="flex gap-2">
        <div className="flex gap-1 color-neutral-4 dark:color-neutral-5">
          {interspersedTagsEl}
        </div>
        <span className="color-neutral-1 dark:color-neutral-7">/</span>
        <span className="color-neutral-4 dark:color-neutral-5">
          {new Date(date).toLocaleDateString("ja-JP")}
        </span>
      </div>
    </div>
  );
};

export default BlogPostItem;
