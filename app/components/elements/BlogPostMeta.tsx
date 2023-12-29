import intersperse from "../../utils/intersperse";

const BlogPostMeta = ({ tags, date }: { tags: string[]; date: string }) => {
  if (tags.length === 0) {
    return (
      <div className="flex gap-2">
        <span className="color-neutral-4 dark:color-neutral-5">
          {new Date(date).toLocaleDateString("ja-JP")}
        </span>
      </div>
    );
  }

  const tagsEl = tags.map((tag) => {
    return <span key={tag}>{tag}</span>;
  });
  const interspersedTagsEl = intersperse(
    tagsEl,
    <span key="tag separator">,</span>,
  );

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex gap-1 color-neutral-4 dark:color-neutral-5">
        {interspersedTagsEl}
      </div>
      <span className="color-neutral-1 dark:color-neutral-7">/</span>
      <time
        className="color-neutral-4 dark:color-neutral-5"
        dateTime={date}
      >
        {new Date(date).toLocaleDateString("ja-JP")}
      </time>
    </div>
  );
};

export default BlogPostMeta;
