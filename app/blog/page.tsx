import Main from "./Main";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Blog page",
  openGraph: {
    title: "Blog",
    description: "Blog page",
  },
};

const Page = () => {
  return <Main />;
};

export default Page;
