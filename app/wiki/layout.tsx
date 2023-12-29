import AsideLeftWrapper from "./AsideLeftWrapper";
import WikiHeader from "./WikiHeader";

import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Wiki page.",
  openGraph: {
    url: "https://hoshimurayuto.com/wiki",
  },
  alternates: {
    canonical: "/wiki",
  },
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <WikiHeader />
      <div className="p-10 lt-sm:p-6">
        <div className="mx-auto max-w-[1200px] flex justify-center gap-10 lt-md:flex-col-reverse">
          <aside
            w="[250px]"
            // border="0 r-1 neutral-1 solid"
            className="lt-md:w-auto lt-md:border-b-1 lt-md:border-r-0 dark:border-neutral-7"
          >
            <AsideLeftWrapper />
          </aside>
          {children}
        </div>
      </div>
    </>
  );
};

export default Layout;
