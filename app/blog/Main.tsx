import { Suspense } from "react";

import Skeleton from "../components/elements/Skeleton";
import BlogPostList from "../components/fragments/BlogPostList";

const Main = () => {
  return (
    <>
      <h2 className="font-size-8 font-700 line-height-8">All Articles</h2>
      <Suspense
        fallback={Array.from({ length: 5 }).map((_, idx) => {
          return (
            <div
              key={idx}
              className="flex flex-col gap-2"
            >
              <Skeleton className="h-18 w-150" />
              <Skeleton className="h-6 w-33" />
            </div>
          );
        })}
      >
        <BlogPostList />
      </Suspense>
    </>
  );
};

export default Main;
