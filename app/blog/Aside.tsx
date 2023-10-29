import { Suspense } from "react";

import { Button } from "../components/elements/Button";
import Skeleton from "../components/elements/Skeleton";
import BlogTagList from "../components/fragments/BlogTagList";
import siteConfig from "../config/siteConfig";

const Aside = () => {
  return (
    <div className="flex flex-col gap-12 pr-10 lt-md:pb-6 lt-md:pr-0">
      <h1 className="font-size-8 font-400 line-height-8 lt-md:hidden">Blog</h1>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Suspense
            fallback={
              <Skeleton
                wrapperClassName="flex flex-col gap-4"
                className="h-4 w-10"
                count={4}
              />
            }
          >
            <BlogTagList />
          </Suspense>
        </div>
        <div className="h-[1px] w-full shrink-0 border-0 border-r-1 border-neutral-1 border-solid bg-neutral-1 dark:border-neutral-7 dark:bg-neutral-7" />
        <div className="flex items-center gap-4">
          {siteConfig.blogLinks.map((link) => (
            <a
              href={link.url}
              target="_blank"
              key={link.icon}
              aria-label="sns link"
              className="flex items-center justify-center"
            >
              <Button
                variant="plain"
                size="original"
                className="p-0 outline-0"
                aria-label="sns link button"
              >
                <div
                  className={`${link.icon} color-neutral-4 wh-4 wh-6 dark:color-neutral-5`}
                />
              </Button>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Aside;
