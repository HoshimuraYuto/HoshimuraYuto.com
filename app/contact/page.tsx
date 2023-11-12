import Page from "../components/layouts/Page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact page",
  openGraph: {
    title: "Contact",
    description: "Contact page",
  },
};

const Contact = () => {
  return (
    <Page title="Contact">
      <p className="line-height-8">Contact page</p>
    </Page>
  );
};

export default Contact;
