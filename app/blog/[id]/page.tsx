import Main from "./Main";

const Page = ({ params }: { params: { id: string } }) => {
  return <Main id={params.id} />;
};

export default Page;
