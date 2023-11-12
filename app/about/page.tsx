import Page from "../components/layouts/Page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About page",
  openGraph: {
    title: "About",
    description: "About page",
  },
};

const About = () => {
  return (
    <Page title="About">
      <p className="line-height-8">About page</p>
    </Page>
  );
};

export default About;
