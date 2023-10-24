import intersperse from "../../utils/intersperse";

const BlogPostItem = ({
  keyId,
  title,
  tags,
  date,
}: {
  keyId: string;
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
      key={keyId}
    >
      <h2 className="font-size-4.5 font-normal line-height-9">{title}</h2>
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
