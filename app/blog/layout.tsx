import Aside from "./Aside";

import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Blog page.",
  openGraph: {
    url: "https://hoshimurayuto.com/blog",
  },
  alternates: {
    canonical: "/blog",
  },
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="p-10 lt-sm:p-6">
      <div className="mx-auto max-w-[830px] flex justify-center gap-10 lt-md:flex-col-reverse">
        <aside
          w="[190px]"
          border="0 r-1 neutral-1 solid"
          className="lt-md:w-auto lt-md:border-b-1 lt-md:border-r-0 dark:border-neutral-7"
        >
          <Aside />
        </aside>
        <main className="w-[600px] flex flex-col gap-12 lt-md:w-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
