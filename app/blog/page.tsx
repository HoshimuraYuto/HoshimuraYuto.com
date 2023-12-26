import Main from "./Main";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Blog page",
  openGraph: {
    title: "Blog",
    description: "Blog page",
    url: `https://hoshimurayuto.com/blog`,
    siteName: "Hi 👋, I'm Hoshimura Yuto.",
    images: "/favicon.png",
    locale: "ja_JP",
    type: "website",
  },
};

const Page = () => {
  return <Main />;
};

export default Page;
