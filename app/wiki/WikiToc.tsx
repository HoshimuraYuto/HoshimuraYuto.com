import path from "path";

import { readFileContent } from "@/app/utils/fs";
import { transformMarkdownToTocElement } from "@/app/utils/markdownToReact";

const WikiToc = async ({ id }: { id: string[] }) => {
  const contentPath = path.join(
    process.cwd(),
    "content/wiki",
    `/${id.join("/")}.md`,
  );
  try {
    const fileData = await readFileContent(contentPath);
    const data = await transformMarkdownToTocElement(fileData);
    const htmlContent = data.value as string;
    const tocContent = /<nav class="toc">[\s\S]*?<\/nav>/.exec(htmlContent);

    if (tocContent) {
      return (
        <div
          className="toc-wrapper"
          dangerouslySetInnerHTML={{ __html: tocContent[0] }}
        />
      );
    }
  } catch (error) {
    console.error(error);
    return <p>Unable to load the blog post.</p>;
  }
};

export default WikiToc;
