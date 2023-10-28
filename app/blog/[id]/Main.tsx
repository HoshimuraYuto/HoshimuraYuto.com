import { Suspense } from "react";

import BlogPostPage from "@/app/components/fragments/BlogPostPage";

import Skeleton from "../../components/elements/Skeleton";

const Main = ({ id }: { id: string }) => {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex flex-col gap-16">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-150" />
              <Skeleton className="h-6 w-33" />
            </div>
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, idx) => {
                return (
                  <Skeleton
                    key={idx}
                    className="h-6 w-150"
                  />
                );
              })}
            </div>
          </div>
        }
      >
        <BlogPostPage id={id} />
      </Suspense>
    </>
  );
};

export default Main;
