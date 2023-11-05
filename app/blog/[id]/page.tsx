import { getAllContentsMetadata } from "@/app/utils/getAllContentsMetadata";

import Main from "./Main";

const Page = ({ params }: { params: { id: string } }) => {
  return <Main id={params.id} />;
};

export default Page;

export async function generateStaticParams() {
  const pages = await getAllContentsMetadata("content", 1);
  const pageIds = Object.keys(pages).map((id) => ({ id }));
  return pageIds;
}
