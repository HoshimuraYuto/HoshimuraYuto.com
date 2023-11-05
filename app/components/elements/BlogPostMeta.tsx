import intersperse from "../../utils/intersperse";

const BlogPostMeta = ({ tags, date }: { tags: string[]; date: Date }) => {
  const tagsEl = tags.map((tag) => {
    return <span key={tag}>{tag}</span>;
  });
  const interspersedTagsEl = intersperse(
    tagsEl,
    <span key="tag separator">,</span>,
  );

  return (
    <div className="flex gap-2">
      <div className="flex gap-1 color-neutral-4 dark:color-neutral-5">
        {interspersedTagsEl}
      </div>
      <span className="color-neutral-1 dark:color-neutral-7">/</span>
      <span className="color-neutral-4 dark:color-neutral-5">
        {date.toLocaleDateString("ja-JP")}
      </span>
    </div>
  );
};

export default BlogPostMeta;
